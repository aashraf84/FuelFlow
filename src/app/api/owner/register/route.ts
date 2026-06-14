import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes, createHash } from 'crypto'

// ── Helpers ──────────────────────────────────────

function generateSerialKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars like I, O, 0, 1
  const seg = (): string => {
    let s = ''
    for (let i = 0; i < 4; i++) s += chars.charAt(Math.floor(Math.random() * chars.length))
    return s
  }
  return `FF-${seg()}-${seg()}-${seg()}`
}

function generateApiKey(): string {
  const prefix = 'ff_live'
  const key = randomBytes(24).toString('base64url')
  return `${prefix}_${key}`
}

function generatePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const special = '@#$%&*'
  const all = upper + lower + digits + special
  let pw = ''
  // Ensure at least one of each type
  pw += upper[Math.floor(Math.random() * upper.length)]
  pw += lower[Math.floor(Math.random() * lower.length)]
  pw += digits[Math.floor(Math.random() * digits.length)]
  pw += special[Math.floor(Math.random() * special.length)]
  for (let i = 4; i < 14; i++) {
    pw += all[Math.floor(Math.random() * all.length)]
  }
  // Shuffle
  return pw.split('').sort(() => Math.random() - 0.5).join('')
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

// ── POST: Register as Device Owner ──────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      companyName,
      contactPerson,
      email,
      phone,
      address,
      city,
      state,
      country,
      deviceName,
      deviceType,
      serialNumber,
      macAddress,
      plan,
    } = body

    // Validate required fields
    if (!companyName || !contactPerson || !email || !phone || !deviceName || !deviceType) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, contactPerson, email, phone, deviceName, deviceType' },
        { status: 400 }
      )
    }

    // Check if email already registered
    const existing = await db.ownerClient.findFirst({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'This email is already registered as an owner. Please login instead.' },
        { status: 409 }
      )
    }

    // Generate credentials
    const plainPassword = generatePassword()
    const hashedPassword = hashPassword(plainPassword)
    const apiKey = generateApiKey()
    const slug = slugify(companyName) + '-' + randomBytes(3).toString('hex')

    // Generate unique serial key
    let serialKey = generateSerialKey()
    let attempts = 0
    while (await db.licenseKey.findUnique({ where: { key: serialKey } })) {
      serialKey = generateSerialKey()
      attempts++
      if (attempts > 100) {
        return NextResponse.json({ error: 'Failed to generate a unique serial key' }, { status: 500 })
      }
    }

    // Determine plan limits
    const planLimits: Record<string, { maxStations: number; maxDispensers: number; maxUsers: number }> = {
      starter: { maxStations: 1, maxDispensers: 4, maxUsers: 5 },
      professional: { maxStations: 5, maxDispensers: 32, maxUsers: 25 },
      enterprise: { maxStations: 50, maxDispensers: 500, maxUsers: 200 },
    }
    const selectedPlan = plan || 'starter'
    const limits = planLimits[selectedPlan] || planLimits.starter

    // Find or create the subscription plan
    let planRecord = await db.subscriptionPlan.findUnique({ where: { slug: selectedPlan } })
    if (!planRecord) {
      const planDetails: Record<string, { name: string; priceMonthly: number; priceAnnual: number; features: string }> = {
        starter: { name: 'Starter', priceMonthly: 4999, priceAnnual: 49990, features: '["1 Station","4 Dispensers","5 Users","Basic Reporting","Email Support"]' },
        professional: { name: 'Professional', priceMonthly: 14999, priceAnnual: 149990, features: '["5 Stations","32 Dispensers","25 Users","Advanced Analytics","Priority Support","API Access","Custom Integrations"]' },
        enterprise: { name: 'Enterprise', priceMonthly: 49999, priceAnnual: 499990, features: '["50 Stations","500 Dispensers","200 Users","Full Analytics Suite","24/7 Support","Full API Access","Custom Development","Dedicated Database"]' },
      }
      const detail = planDetails[selectedPlan] || planDetails.starter
      planRecord = await db.subscriptionPlan.create({
        data: {
          name: detail.name,
          slug: selectedPlan,
          description: `${detail.name} plan for FuelFlow OS`,
          priceMonthly: detail.priceMonthly,
          priceAnnual: detail.priceAnnual,
          currency: 'PKR',
          maxStations: limits.maxStations,
          maxDispensers: limits.maxDispensers,
          maxUsers: limits.maxUsers,
          features: detail.features,
          isPopular: selectedPlan === 'professional',
          sortOrder: selectedPlan === 'starter' ? 0 : selectedPlan === 'professional' ? 1 : 2,
        },
      })
    }

    // Create owner client with credentials
    const owner = await db.ownerClient.create({
      data: {
        companyName,
        slug,
        contactPerson,
        email,
        phone,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || 'Pakistan',
        passwordHash: hashedPassword,
        apiKey,
        status: 'trial',
        databaseStatus: 'pending',
      },
    })

    // Create license key and assign to owner
    const license = await db.licenseKey.create({
      data: {
        key: serialKey,
        clientId: owner.id,
        planId: planRecord.id,
        status: 'assigned',
        maxStations: limits.maxStations,
        maxDispensers: limits.maxDispensers,
        maxUsers: limits.maxUsers,
        assignedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day trial
        notes: `Auto-generated for ${companyName} (${selectedPlan} plan)`,
      },
    })

    // Create the client device
    const device = await db.clientDevice.create({
      data: {
        clientId: owner.id,
        deviceName,
        deviceType,
        serialNumber: serialNumber || null,
        macAddress: macAddress || null,
        status: 'active',
      },
    })

    // Create trial subscription
    await db.clientSubscription.create({
      data: {
        clientId: owner.id,
        planId: planRecord.id,
        status: 'trial',
        billingCycle: 'monthly',
        startDate: new Date(),
        trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        notes: `Trial subscription for ${companyName}`,
      },
    })

    // Return credentials (plain password shown only once!)
    return NextResponse.json({
      success: true,
      message: 'Device owner registered successfully',
      credentials: {
        email: owner.email,
        password: plainPassword,
        apiKey: owner.apiKey,
        ownerId: owner.id,
      },
      serialKey: {
        key: license.key,
        plan: selectedPlan,
        maxStations: limits.maxStations,
        maxDispensers: limits.maxDispensers,
        maxUsers: limits.maxUsers,
        expiresAt: license.expiresAt,
        status: license.status,
      },
      device: {
        id: device.id,
        name: device.deviceName,
        type: device.deviceType,
        status: device.status,
      },
      owner: {
        id: owner.id,
        companyName: owner.companyName,
        slug: owner.slug,
        contactPerson: owner.contactPerson,
        status: owner.status,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Owner Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register device owner. Please try again.' },
      { status: 500 }
    )
  }
}

// ── GET: Check registration status ──────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const apiKeyParam = searchParams.get('apiKey')

    if (apiKeyParam) {
      const owner = await db.ownerClient.findUnique({
        where: { apiKey: apiKeyParam },
        include: {
          devices: true,
          licenseKeys: { include: { plan: true } },
          subscriptions: { include: { plan: true } },
        },
      })
      if (!owner) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 404 })
      }
      return NextResponse.json({
        owner: {
          id: owner.id,
          companyName: owner.companyName,
          email: owner.email,
          status: owner.status,
          apiKey: owner.apiKey,
        },
        devices: owner.devices,
        licenseKeys: owner.licenseKeys,
        subscriptions: owner.subscriptions,
      })
    }

    if (email) {
      const owner = await db.ownerClient.findFirst({
        where: { email },
        select: {
          id: true,
          companyName: true,
          email: true,
          status: true,
          apiKey: true,
          createdAt: true,
        },
      })
      if (!owner) {
        return NextResponse.json({ registered: false })
      }
      return NextResponse.json({ registered: true, owner })
    }

    // List all registered owners (admin view)
    const owners = await db.ownerClient.findMany({
      select: {
        id: true,
        companyName: true,
        email: true,
        status: true,
        createdAt: true,
        _count: { select: { devices: true, licenseKeys: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({ owners })
  } catch (error) {
    console.error('Owner Registration GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch owner data' }, { status: 500 })
  }
}
