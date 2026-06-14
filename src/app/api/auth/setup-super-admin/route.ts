import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { randomBytes } from 'crypto'

// ── Helpers ──────────────────────────────────────

function generateSerialKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
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
  pw += upper[Math.floor(Math.random() * upper.length)]
  pw += lower[Math.floor(Math.random() * lower.length)]
  pw += digits[Math.floor(Math.random() * digits.length)]
  pw += special[Math.floor(Math.random() * special.length)]
  for (let i = 4; i < 16; i++) {
    pw += all[Math.floor(Math.random() * all.length)]
  }
  return pw.split('').sort(() => Math.random() - 0.5).join('')
}

// Lifetime = year 9999 (effectively never expires)
const LIFETIME_DATE = new Date('9999-12-31T23:59:59.999Z')

// ── POST: Setup Super Admin with Lifetime Subscription ──────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      companyName,
      deviceName,
      deviceType,
    } = body

    // Validate required fields
    if (!name || !email || !companyName || !deviceName || !deviceType) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, companyName, deviceName, deviceType' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists. Please use a different email or login.' },
        { status: 409 }
      )
    }

    // Generate credentials
    const plainPassword = generatePassword()
    const passwordHash = await hashPassword(plainPassword)
    const apiKey = generateApiKey()
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) + '-' + randomBytes(3).toString('hex')

    // Generate unique serial key
    let serialKey = generateSerialKey()
    let attempts = 0
    while (await db.serialKey.findUnique({ where: { key: serialKey } })) {
      serialKey = generateSerialKey()
      attempts++
      if (attempts > 100) {
        return NextResponse.json({ error: 'Failed to generate a unique serial key' }, { status: 500 })
      }
    }

    // Also generate a unique license key for the owner system
    let licenseKeyStr = generateSerialKey()
    attempts = 0
    while (await db.licenseKey.findUnique({ where: { key: licenseKeyStr } })) {
      licenseKeyStr = generateSerialKey()
      attempts++
      if (attempts > 100) {
        return NextResponse.json({ error: 'Failed to generate a unique license key' }, { status: 500 })
      }
    }

    // ── 1. Create Tenant ──
    const tenant = await db.tenant.create({
      data: {
        name: companyName,
        slug,
        primaryColor: '#0d9488',
        address: 'Pakistan',
        city: 'Islamabad',
        country: 'Pakistan',
        phone: phone || null,
        email: normalizedEmail,
        subscription: 'enterprise',
        isActive: true,
      },
    })

    // ── 2. Create Super Admin User ──
    const user = await db.user.create({
      data: {
        tenantId: tenant.id,
        email: normalizedEmail,
        name,
        passwordHash,
        role: 'superadmin',
        isActive: true,
        isDemo: false,
        lastLogin: new Date(),
      },
    })

    // ── 3. Create Serial Key (Enterprise / Lifetime) ──
    const serialKeyRecord = await db.serialKey.create({
      data: {
        key: serialKey,
        tenantId: tenant.id,
        status: 'active',
        plan: 'enterprise',
        maxStations: 999,
        maxDispensers: 9999,
        maxUsers: 999,
        activatedAt: new Date(),
        expiresAt: LIFETIME_DATE,
        hardwareBinding: `superadmin-${user.id}`,
        notes: `LIFETIME Enterprise license for ${name} (Super Admin) - Never expires`,
      },
    })

    // ── 4. Create Owner Client ──
    const owner = await db.ownerClient.create({
      data: {
        companyName,
        slug,
        contactPerson: name,
        email: normalizedEmail,
        phone: phone || 'N/A',
        country: 'Pakistan',
        passwordHash,
        apiKey,
        status: 'active',
        databaseStatus: 'active',
      },
    })

    // ── 5. Create Subscription Plan (Enterprise Lifetime) ──
    let planRecord = await db.subscriptionPlan.findUnique({ where: { slug: 'enterprise' } })
    if (!planRecord) {
      planRecord = await db.subscriptionPlan.create({
        data: {
          name: 'Enterprise',
          slug: 'enterprise',
          description: 'Enterprise plan for FuelFlow OS - Full access, unlimited everything',
          priceMonthly: 49999,
          priceAnnual: 499990,
          currency: 'PKR',
          maxStations: 999,
          maxDispensers: 9999,
          maxUsers: 999,
          maxDevices: 9999,
          features: '["Unlimited Stations","Unlimited Dispensers","Unlimited Users","Full Analytics Suite","24/7 Support","Full API Access","Custom Development","Dedicated Database","AI Suite","Lifetime Access"]',
          isPopular: true,
          sortOrder: 2,
        },
      })
    }

    // ── 6. Create Lifetime Subscription ──
    await db.clientSubscription.create({
      data: {
        clientId: owner.id,
        planId: planRecord.id,
        status: 'active',
        billingCycle: 'lifetime',
        startDate: new Date(),
        endDate: LIFETIME_DATE,
        autoRenew: false,
        notes: `LIFETIME subscription for ${name} (Super Admin) - Never expires`,
      },
    })

    // ── 7. Create License Key (Owner-level, Lifetime) ──
    const license = await db.licenseKey.create({
      data: {
        key: licenseKeyStr,
        clientId: owner.id,
        planId: planRecord.id,
        status: 'assigned',
        maxStations: 999,
        maxDispensers: 9999,
        maxUsers: 999,
        assignedAt: new Date(),
        expiresAt: LIFETIME_DATE,
        notes: `LIFETIME Enterprise license for ${name} (Super Admin)`,
      },
    })

    // ── 8. Create Client Device ──
    const device = await db.clientDevice.create({
      data: {
        clientId: owner.id,
        deviceName,
        deviceType,
        serialNumber: serialKey,
        status: 'active',
      },
    })

    // ── 9. Seed a default station for the tenant ──
    const station = await db.station.create({
      data: {
        tenantId: tenant.id,
        name: `${companyName} - Main Station`,
        code: 'HQ-001',
        city: 'Islamabad',
        region: 'ICT',
        country: 'Pakistan',
        stationType: 'hybrid',
        address: 'Main Office, Islamabad',
        latitude: 33.6844,
        longitude: 73.0479,
        phone: phone || '+92-000-0000000',
        email: normalizedEmail,
        isActive: true,
        operatingHours: '24/7',
        timezone: 'Asia/Karachi',
        currency: 'PKR',
      },
    })

    // ── 10. Seed tanks for the station ──
    const tankData = [
      { name: 'Petrol Tank 1', code: 'T-PMS-01', fuelType: 'petrol', capacity: 20000, currentLevel: 14500 },
      { name: 'Diesel Tank 1', code: 'T-HSD-01', fuelType: 'diesel', capacity: 25000, currentLevel: 18200 },
      { name: 'Premium Tank 1', code: 'T-PRE-01', fuelType: 'premium', capacity: 15000, currentLevel: 8900 },
      { name: 'Diesel Tank 2', code: 'T-HSD-02', fuelType: 'diesel', capacity: 25000, currentLevel: 21000 },
    ]
    for (const t of tankData) {
      await db.tank.create({
        data: {
          stationId: station.id,
          name: t.name,
          code: t.code,
          fuelType: t.fuelType,
          capacity: t.capacity,
          currentLevel: t.currentLevel,
          waterLevel: 0,
          temperature: 22 + Math.random() * 5,
          status: 'normal',
          lastReading: new Date(),
        },
      })
    }

    // ── 11. Seed dispensers ──
    const dispenserData = [
      { name: 'Dispenser 1', code: 'D-01', pumpLane: 1, nozzleCount: 2 },
      { name: 'Dispenser 2', code: 'D-02', pumpLane: 2, nozzleCount: 2 },
      { name: 'Dispenser 3', code: 'D-03', pumpLane: 3, nozzleCount: 2 },
      { name: 'Dispenser 4', code: 'D-04', pumpLane: 4, nozzleCount: 2 },
    ]
    for (const d of dispenserData) {
      await db.dispenser.create({
        data: {
          stationId: station.id,
          name: d.name,
          code: d.code,
          pumpLane: d.pumpLane,
          nozzleCount: d.nozzleCount,
          status: 'idle',
          isActive: true,
        },
      })
    }

    // ── 12. Seed fuel prices ──
    const priceData = [
      { fuelType: 'petrol', pricePerUnit: 272.3 },
      { fuelType: 'diesel', pricePerUnit: 278.5 },
      { fuelType: 'premium', pricePerUnit: 305.0 },
    ]
    for (const p of priceData) {
      await db.fuelPrice.create({
        data: {
          tenantId: tenant.id,
          stationId: station.id,
          fuelType: p.fuelType,
          pricePerUnit: p.pricePerUnit,
          effectiveFrom: new Date(),
          updatedBy: user.id,
        },
      })
    }

    // Return credentials (plain password shown only once!)
    return NextResponse.json({
      success: true,
      message: 'Super Admin registered with LIFETIME Enterprise subscription',
      credentials: {
        email: normalizedEmail,
        password: plainPassword,
        apiKey: owner.apiKey,
        userId: user.id,
        ownerId: owner.id,
      },
      serialKey: {
        key: serialKeyRecord.key,
        plan: 'enterprise',
        maxStations: 999,
        maxDispensers: 9999,
        maxUsers: 999,
        expiresAt: 'LIFETIME (Never Expires)',
        status: 'active',
      },
      licenseKey: {
        key: license.key,
        status: 'assigned',
        expiresAt: 'LIFETIME (Never Expires)',
      },
      device: {
        id: device.id,
        name: device.deviceName,
        type: device.deviceType,
        status: device.status,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        subscription: 'enterprise',
      },
      station: {
        id: station.id,
        name: station.name,
        code: station.code,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[setup-super-admin] Error:', error)
    return NextResponse.json(
      { error: 'Failed to setup super admin. Please try again.' },
      { status: 500 }
    )
  }
}
