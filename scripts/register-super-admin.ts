// One-time script to register Super Admin with Lifetime Subscription
import { PrismaClient } from '@prisma/client'
import { randomBytes, createHmac } from 'crypto'

const prisma = new PrismaClient()

const SALT_LENGTH = 32

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString('hex')
  const hash = createHmac('sha512', salt).update(password).digest('hex')
  return `${salt}:${hash}`
}

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

const LIFETIME_DATE = new Date('9999-12-31T23:59:59.999Z')

async function main() {
  console.log('🚀 Setting up Super Admin with Lifetime Enterprise Subscription...\n')

  const name = 'Ashraf Saagar'
  const email = 'ashraf.saagar@gmail.com'
  const phone = '+92-300-0000000'
  const companyName = 'ApexFlow Energy Corp'

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    console.log('⚠️  User already exists with this email. Updating role to superadmin...')
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { role: 'superadmin', isActive: true, isDemo: false },
    })
    
    // Update tenant subscription
    if (existingUser.tenantId) {
      await prisma.tenant.update({
        where: { id: existingUser.tenantId },
        data: { subscription: 'enterprise', isActive: true },
      })
    }
    
    // Update or create serial key with lifetime
    const existingKey = await prisma.serialKey.findFirst({ where: { tenantId: existingUser.tenantId } })
    if (existingKey) {
      await prisma.serialKey.update({
        where: { id: existingKey.id },
        data: { expiresAt: LIFETIME_DATE, plan: 'enterprise', maxStations: 999, maxDispensers: 9999, maxUsers: 999 },
      })
    }
    
    console.log('✅ User updated to Super Admin with lifetime enterprise access!')
    console.log('\n📋 Credentials:')
    console.log(`   Email: ${email}`)
    console.log(`   Role: superadmin (LIFETIME ENTERPRISE)`)
    return
  }

  // Generate credentials
  const plainPassword = generatePassword()
  const passwordHash = await hashPassword(plainPassword)
  const apiKey = generateApiKey()
  const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) + '-' + randomBytes(3).toString('hex')

  // Generate unique serial key
  let serialKey = generateSerialKey()
  let attempts = 0
  while (await prisma.serialKey.findUnique({ where: { key: serialKey } })) {
    serialKey = generateSerialKey()
    attempts++
    if (attempts > 100) throw new Error('Failed to generate unique serial key')
  }

  // Generate unique license key
  let licenseKeyStr = generateSerialKey()
  attempts = 0
  while (await prisma.licenseKey.findUnique({ where: { key: licenseKeyStr } })) {
    licenseKeyStr = generateSerialKey()
    attempts++
    if (attempts > 100) throw new Error('Failed to generate unique license key')
  }

  // ── 1. Create Tenant ──
  const tenant = await prisma.tenant.create({
    data: {
      name: companyName,
      slug,
      primaryColor: '#0d9488',
      address: 'Pakistan',
      city: 'Islamabad',
      country: 'Pakistan',
      phone,
      email,
      subscription: 'enterprise',
      isActive: true,
    },
  })
  console.log(`✅ Tenant created: ${tenant.name} (${tenant.slug})`)

  // ── 2. Create Super Admin User ──
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email,
      name,
      passwordHash,
      role: 'superadmin',
      isActive: true,
      isDemo: false,
      lastLogin: new Date(),
    },
  })
  console.log(`✅ Super Admin user created: ${user.name} (${user.email})`)

  // ── 3. Create Serial Key ──
  const serialKeyRecord = await prisma.serialKey.create({
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
  console.log(`✅ Serial Key created: ${serialKeyRecord.key}`)

  // ── 4. Create Owner Client ──
  const owner = await prisma.ownerClient.create({
    data: {
      companyName,
      slug,
      contactPerson: name,
      email,
      phone,
      country: 'Pakistan',
      passwordHash,
      apiKey,
      status: 'active',
      databaseStatus: 'active',
    },
  })
  console.log(`✅ Owner Client created: ${owner.companyName}`)

  // ── 5. Find or create Subscription Plan ──
  let planRecord = await prisma.subscriptionPlan.findUnique({ where: { slug: 'enterprise' } })
  if (!planRecord) {
    planRecord = await prisma.subscriptionPlan.create({
      data: {
        name: 'Enterprise',
        slug: 'enterprise',
        description: 'Enterprise plan - Full access, unlimited everything',
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
  await prisma.clientSubscription.create({
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
  console.log('✅ Lifetime subscription created')

  // ── 7. Create License Key ──
  const license = await prisma.licenseKey.create({
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
  console.log(`✅ License Key created: ${license.key}`)

  // ── 8. Create Client Device ──
  const device = await prisma.clientDevice.create({
    data: {
      clientId: owner.id,
      deviceName: 'Owner Terminal HQ',
      deviceType: 'pos',
      serialNumber: serialKey,
      status: 'active',
    },
  })
  console.log(`✅ Device registered: ${device.deviceName}`)

  // ── 9. Seed default station ──
  const station = await prisma.station.create({
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
      phone,
      email,
      isActive: true,
      operatingHours: '24/7',
      timezone: 'Asia/Karachi',
      currency: 'PKR',
    },
  })
  console.log(`✅ Station created: ${station.name}`)

  // ── 10. Seed tanks ──
  const tankData = [
    { name: 'Petrol Tank 1', code: 'T-PMS-01', fuelType: 'petrol', capacity: 20000, currentLevel: 14500 },
    { name: 'Diesel Tank 1', code: 'T-HSD-01', fuelType: 'diesel', capacity: 25000, currentLevel: 18200 },
    { name: 'Premium Tank 1', code: 'T-PRE-01', fuelType: 'premium', capacity: 15000, currentLevel: 8900 },
    { name: 'Diesel Tank 2', code: 'T-HSD-02', fuelType: 'diesel', capacity: 25000, currentLevel: 21000 },
  ]
  for (const t of tankData) {
    await prisma.tank.create({
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
  console.log('✅ 4 tanks seeded')

  // ── 11. Seed dispensers ──
  const dispenserData = [
    { name: 'Dispenser 1', code: 'D-01', pumpLane: 1, nozzleCount: 2 },
    { name: 'Dispenser 2', code: 'D-02', pumpLane: 2, nozzleCount: 2 },
    { name: 'Dispenser 3', code: 'D-03', pumpLane: 3, nozzleCount: 2 },
    { name: 'Dispenser 4', code: 'D-04', pumpLane: 4, nozzleCount: 2 },
  ]
  for (const d of dispenserData) {
    await prisma.dispenser.create({
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
  console.log('✅ 4 dispensers seeded')

  // ── 12. Seed fuel prices ──
  const priceData = [
    { fuelType: 'petrol', pricePerUnit: 272.3 },
    { fuelType: 'diesel', pricePerUnit: 278.5 },
    { fuelType: 'premium', pricePerUnit: 305.0 },
  ]
  for (const p of priceData) {
    await prisma.fuelPrice.create({
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
  console.log('✅ Fuel prices seeded')

  // ── Print Credentials ──
  console.log('\n' + '═'.repeat(60))
  console.log('🔑 SUPER ADMIN CREDENTIALS — SAVE THESE NOW!')
  console.log('═'.repeat(60))
  console.log(`\n  📧 Email:       ${email}`)
  console.log(`  🔒 Password:    ${plainPassword}`)
  console.log(`  🔑 Serial Key:  ${serialKey}`)
  console.log(`  🛡️  API Key:     ${apiKey}`)
  console.log(`  📋 License Key: ${licenseKeyStr}`)
  console.log(`\n  🏢 Company:     ${companyName}`)
  console.log(`  📍 Station:     ${station.name} (${station.code})`)
  console.log(`  👤 Role:        Super Admin (LIFETIME ENTERPRISE)`)
  console.log(`  ♾️  Expires:     NEVER (Lifetime)`)
  console.log('\n' + '═'.repeat(60))
  console.log('⚠️  SAVE YOUR PASSWORD AND API KEY — THEY CANNOT BE RECOVERED!')
  console.log('═'.repeat(60) + '\n')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
