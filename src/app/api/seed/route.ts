import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Clean up existing data (order matters due to foreign keys)
    // Wrapped in try/catch per table for resilience
    const deleteTable = async (fn: () => Promise<unknown>) => { try { await fn() } catch { /* skip */ } }

    // Children first (referencing other tables)
    await deleteTable(() => db.webhookDelivery.deleteMany())
    await deleteTable(() => db.webhookEndpoint.deleteMany())
    await deleteTable(() => db.aPIKey.deleteMany())
    await deleteTable(() => db.scheduledReport.deleteMany())
    await deleteTable(() => db.reportTemplate.deleteMany())
    await deleteTable(() => db.shiftHandover.deleteMany())
    await deleteTable(() => db.nozzleEvent.deleteMany())
    await deleteTable(() => db.cNGStorage.deleteMany())
    await deleteTable(() => db.cNGCompressor.deleteMany())
    await deleteTable(() => db.customerComplaint.deleteMany())
    await deleteTable(() => db.giftCard.deleteMany())
    await deleteTable(() => db.loyaltyTransaction.deleteMany())
    await deleteTable(() => db.safeDrop.deleteMany())
    await deleteTable(() => db.cashDrawer.deleteMany())
    await deleteTable(() => db.taxConfig.deleteMany())
    await deleteTable(() => db.accountPayable.deleteMany())
    await deleteTable(() => db.accountReceivable.deleteMany())
    await deleteTable(() => db.journalLine.deleteMany())
    await deleteTable(() => db.journalEntry.deleteMany())
    await deleteTable(() => db.gLAccount.deleteMany())
    await deleteTable(() => db.shrinkageRecord.deleteMany())
    await deleteTable(() => db.theftAlert.deleteMany())
    await deleteTable(() => db.fuelTransfer.deleteMany())
    await deleteTable(() => db.aTGProfile.deleteMany())
    await deleteTable(() => db.dispenserProfile.deleteMany())
    await deleteTable(() => db.commLog.deleteMany())
    await deleteTable(() => db.commConnection.deleteMany())
    await deleteTable(() => db.commProtocol.deleteMany())
    await deleteTable(() => db.encryptionKey.deleteMany())
    await deleteTable(() => db.backupRecord.deleteMany())
    await deleteTable(() => db.securityAlert.deleteMany())
    await deleteTable(() => db.rBACPermission.deleteMany())
    await deleteTable(() => db.securitySession.deleteMany())
    await deleteTable(() => db.oMSLicense.deleteMany())
    await deleteTable(() => db.oMSSyncLog.deleteMany())
    await deleteTable(() => db.oMSPayment.deleteMany())
    await deleteTable(() => db.oMSInvoice.deleteMany())
    await deleteTable(() => db.oMSPackage.deleteMany())
    await deleteTable(() => db.oMSClient.deleteMany())
    await deleteTable(() => db.deviceCommandQueue.deleteMany())
    await deleteTable(() => db.deviceEventLog.deleteMany())
    await deleteTable(() => db.deviceConfig.deleteMany())
    await deleteTable(() => db.vacuumStation.deleteMany())
    await deleteTable(() => db.airCompressor.deleteMany())
    await deleteTable(() => db.carWashSystem.deleteMany())
    await deleteTable(() => db.tankerTracker.deleteMany())
    await deleteTable(() => db.weatherStation.deleteMany())
    await deleteTable(() => db.utilityMeter.deleteMany())
    await deleteTable(() => db.fireAlarmSystem.deleteMany())
    await deleteTable(() => db.surveillanceCamera.deleteMany())
    await deleteTable(() => db.generator.deleteMany())
    await deleteTable(() => db.paymentTerminal.deleteMany())
    await deleteTable(() => db.forecourtController.deleteMany())
    await deleteTable(() => db.auditLog.deleteMany())
    await deleteTable(() => db.aIForecast.deleteMany())
    await deleteTable(() => db.aIAlert.deleteMany())
    await deleteTable(() => db.notification.deleteMany())
    await deleteTable(() => db.dailyReport.deleteMany())
    await deleteTable(() => db.vaporRecoveryReading.deleteMany())
    await deleteTable(() => db.environmentalAlert.deleteMany())
    await deleteTable(() => db.promotionUsage.deleteMany())
    await deleteTable(() => db.promotion.deleteMany())
    await deleteTable(() => db.loyaltyRule.deleteMany())
    await deleteTable(() => db.customer.deleteMany())
    await deleteTable(() => db.leaveRequest.deleteMany())
    await deleteTable(() => db.payrollRecord.deleteMany())
    await deleteTable(() => db.attendance.deleteMany())
    await deleteTable(() => db.maintenanceRecord.deleteMany())
    await deleteTable(() => db.expense.deleteMany())
    await deleteTable(() => db.transaction.deleteMany())
    await deleteTable(() => db.supplierInvoice.deleteMany())
    await deleteTable(() => db.purchaseOrder.deleteMany())
    await deleteTable(() => db.supplier.deleteMany())
    await deleteTable(() => db.lotterySale.deleteMany())
    await deleteTable(() => db.carWashSession.deleteMany())
    await deleteTable(() => db.retailTransaction.deleteMany())
    await deleteTable(() => db.lubricantProduct.deleteMany())
    await deleteTable(() => db.retailProduct.deleteMany())
    await deleteTable(() => db.chargingSession.deleteMany())
    await deleteTable(() => db.fueling.deleteMany())
    await deleteTable(() => db.meterRecord.deleteMany())
    await deleteTable(() => db.shift.deleteMany())
    await deleteTable(() => db.tankCalibration.deleteMany())
    await deleteTable(() => db.reconciliation.deleteMany())
    await deleteTable(() => db.tankReading.deleteMany())
    await deleteTable(() => db.fuelDelivery.deleteMany())
    await deleteTable(() => db.tank.deleteMany())
    await deleteTable(() => db.nozzle.deleteMany())
    await deleteTable(() => db.dispenser.deleteMany())
    await deleteTable(() => db.eVCharger.deleteMany())
    await deleteTable(() => db.cNGDispenser.deleteMany())
    await deleteTable(() => db.aNPRCamera.deleteMany())
    await deleteTable(() => db.rFIDReader.deleteMany())
    await deleteTable(() => db.priceBoard.deleteMany())
    await deleteTable(() => db.fuelPrice.deleteMany())
    await deleteTable(() => db.employee.deleteMany())
    await deleteTable(() => db.fuelCard.deleteMany())
    await deleteTable(() => db.vehicle.deleteMany())
    await deleteTable(() => db.driver.deleteMany())
    await deleteTable(() => db.fleetAccount.deleteMany())
    await deleteTable(() => db.hardwareCatalog.deleteMany())
    await deleteTable(() => db.controllerProfile.deleteMany())
    await deleteTable(() => db.controllerProtocol.deleteMany())
    await deleteTable(() => db.serialKey.deleteMany())
    await deleteTable(() => db.user.deleteMany())
    await deleteTable(() => db.station.deleteMany())
    await deleteTable(() => db.tenant.deleteMany())
    // Owner module tables
    await deleteTable(() => db.invoicePayment.deleteMany())
    await deleteTable(() => db.invoiceItem.deleteMany())
    await deleteTable(() => db.invoice.deleteMany())
    await deleteTable(() => db.quotationItem.deleteMany())
    await deleteTable(() => db.quotation.deleteMany())
    await deleteTable(() => db.licenseKey.deleteMany())
    await deleteTable(() => db.clientDevice.deleteMany())
    await deleteTable(() => db.clientSubscription.deleteMany())
    await deleteTable(() => db.subscriptionPlan.deleteMany())
    await deleteTable(() => db.tenantDatabase.deleteMany())
    await deleteTable(() => db.ownerClient.deleteMany())

    // =====================================================
    // 1. TENANT
    // =====================================================
    const tenant = await db.tenant.create({
      data: {
        name: 'ApexFlow Energy Corp',
        slug: 'apexflow-energy',
        primaryColor: '#f59e0b',
        address: 'Blue Area, Jinnah Avenue',
        city: 'Islamabad',
        country: 'Pakistan',
        phone: '+92-51-1234567',
        email: 'ops@apexflow.pk',
        subscription: 'enterprise',
        taxId: 'NTN-1234567-8',
        registrationNumber: 'SEC-2024-PK-001',
        isActive: true,
      }
    })

    // =====================================================
    // 2. STATIONS (5 across Pakistan)
    // =====================================================
    const stationData = [
      { name: 'Islamabad Main Station', code: 'ISB-001', city: 'Islamabad', region: 'ICT', stationType: 'hybrid', lat: 33.6844, lng: 73.0479 },
      { name: 'Lahore Canal Station', code: 'LHR-001', city: 'Lahore', region: 'Punjab', stationType: 'fuel', lat: 31.5204, lng: 74.3587 },
      { name: 'Karachi Port Station', code: 'KHI-001', city: 'Karachi', region: 'Sindh', stationType: 'fuel', lat: 24.8607, lng: 67.0011 },
      { name: 'Peshawar GT Station', code: 'PEW-001', city: 'Peshawar', region: 'KPK', stationType: 'cng', lat: 34.0151, lng: 71.5249 },
      { name: 'Faisalabad Sargodha Station', code: 'FSD-001', city: 'Faisalabad', region: 'Punjab', stationType: 'hybrid', lat: 31.4504, lng: 73.1350 },
    ]

    const stations: Awaited<ReturnType<typeof db.station.create>>[] = []
    for (const s of stationData) {
      const station = await db.station.create({
        data: {
          tenantId: tenant.id,
          name: s.name,
          code: s.code,
          city: s.city,
          region: s.region,
          country: 'Pakistan',
          stationType: s.stationType,
          address: `${s.code}, ${s.city}`,
          latitude: s.lat,
          longitude: s.lng,
          phone: `+92-${s.code.slice(0,3)}-000000`,
          email: `${s.code.toLowerCase()}@apexflow.pk`,
          isActive: true,
          operatingHours: '06:00-23:00',
          timezone: 'Asia/Karachi',
          currency: 'PKR',
        }
      })
      stations.push(station)
    }

    const mainStation = stations[0]

    // =====================================================
    // 3. USERS
    // =====================================================
    const { hashPassword } = await import('@/lib/auth')
    const defaultPasswordHash = await hashPassword('fuelflow123')
    
    const users = await Promise.all([
      db.user.create({ data: { tenantId: tenant.id, email: 'superadmin@apexflow.pk', name: 'Imran Akhtar', role: 'superadmin', passwordHash: defaultPasswordHash, isActive: true, lastLogin: new Date() } }),
      db.user.create({ data: { tenantId: tenant.id, email: 'admin@apexflow.pk', name: 'Fatima Noor', role: 'admin', passwordHash: defaultPasswordHash, isActive: true, lastLogin: new Date() } }),
      db.user.create({ data: { tenantId: tenant.id, email: 'manager1@apexflow.pk', name: 'Hassan Rizvi', role: 'manager', passwordHash: defaultPasswordHash, isActive: true, lastLogin: new Date() } }),
      db.user.create({ data: { tenantId: tenant.id, email: 'manager2@apexflow.pk', name: 'Ayesha Siddiqui', role: 'manager', passwordHash: defaultPasswordHash, isActive: true } }),
      db.user.create({ data: { tenantId: tenant.id, email: 'operator1@apexflow.pk', name: 'Bilal Khan', role: 'operator', passwordHash: defaultPasswordHash, isActive: true } }),
      db.user.create({ data: { tenantId: tenant.id, email: 'operator2@apexflow.pk', name: 'Sana Rehman', role: 'operator', passwordHash: defaultPasswordHash, isActive: true } }),
    ])

    // =====================================================
    // 3b. SERIAL KEYS
    // =====================================================
    await Promise.all([
      db.serialKey.create({
        data: {
          key: 'FF-PROF-A1B2-C3D4-E5F6',
          tenantId: tenant.id,
          status: 'active',
          plan: 'professional',
          maxStations: 3,
          maxDispensers: 24,
          maxUsers: 15,
          activatedAt: new Date('2024-06-01'),
          expiresAt: new Date('2026-06-01'),
          notes: 'Main professional license for ApexFlow Energy Corp',
        },
      }),
      db.serialKey.create({
        data: {
          key: 'FF-ENTR-G7H8-I9J0-K1L2',
          tenantId: tenant.id,
          status: 'active',
          plan: 'enterprise',
          maxStations: 50,
          maxDispensers: 500,
          maxUsers: 100,
          activatedAt: new Date('2024-01-15'),
          expiresAt: new Date('2027-01-15'),
          notes: 'Enterprise license - all features unlocked',
        },
      }),
      db.serialKey.create({
        data: {
          key: 'FF-STAR-M3N4-O5P6-Q7R8',
          status: 'inactive',
          plan: 'starter',
          maxStations: 1,
          maxDispensers: 8,
          maxUsers: 5,
          expiresAt: new Date('2026-12-31'),
          notes: 'Starter plan - ready for activation',
        },
      }),
      db.serialKey.create({
        data: {
          key: 'FF-PROF-S9T0-U1V2-W3X4',
          status: 'inactive',
          plan: 'professional',
          maxStations: 5,
          maxDispensers: 40,
          maxUsers: 20,
          expiresAt: new Date('2027-06-30'),
          notes: 'Professional plan - ready for activation',
        },
      }),
      db.serialKey.create({
        data: {
          key: 'FF-EXP-Y5Z6-A7B8-C9D0',
          status: 'expired',
          plan: 'starter',
          maxStations: 1,
          maxDispensers: 4,
          maxUsers: 3,
          activatedAt: new Date('2023-01-01'),
          expiresAt: new Date('2024-01-01'),
          notes: 'Expired starter license',
        },
      }),
    ])

    // =====================================================
    // 4. EMPLOYEES (8)
    // =====================================================
    const employeeNames = [
      { name: 'Ahmed Khan', role: 'manager', salary: 85000, comm: 0 },
      { name: 'Muhammad Ali', role: 'supervisor', salary: 55000, comm: 0 },
      { name: 'Bilal Hussain', role: 'attendant', salary: 35000, comm: 0.5 },
      { name: 'Usman Sheikh', role: 'attendant', salary: 35000, comm: 0.5 },
      { name: 'Farhan Raza', role: 'attendant', salary: 35000, comm: 0.5 },
      { name: 'Tariq Mehmood', role: 'attendant', salary: 35000, comm: 0.5 },
      { name: 'Zain Ahmed', role: 'cashier', salary: 40000, comm: 0 },
      { name: 'Kamran Siddiqui', role: 'maintenance', salary: 40000, comm: 0 },
    ]

    const employees: Awaited<ReturnType<typeof db.employee.create>>[] = []
    for (const e of employeeNames) {
      const emp = await db.employee.create({
        data: {
          stationId: mainStation.id,
          name: e.name,
          role: e.role,
          salary: e.salary,
          commissionRate: e.comm,
          status: 'active',
          hireDate: new Date('2024-06-01'),
          employeeId: `EMP-${String(employeeNames.indexOf(e) + 1).padStart(4, '0')}`,
        }
      })
      employees.push(emp)
    }

    // =====================================================
    // 5. TANKS (4)
    // =====================================================
    const tankTypes = [
      { name: 'Tank A - Petrol', code: 'TANK-A', fuelType: 'petrol', capacity: 20000 },
      { name: 'Tank B - Diesel', code: 'TANK-B', fuelType: 'diesel', capacity: 25000 },
      { name: 'Tank C - Premium', code: 'TANK-C', fuelType: 'premium', capacity: 15000 },
      { name: 'Tank D - High Speed Diesel', code: 'TANK-D', fuelType: 'hsd', capacity: 30000 },
    ]

    const tanks: Awaited<ReturnType<typeof db.tank.create>>[] = []
    for (const t of tankTypes) {
      const currentLevel = t.capacity * (0.3 + Math.random() * 0.5)
      const tank = await db.tank.create({
        data: {
          stationId: mainStation.id,
          name: t.name,
          code: t.code,
          fuelType: t.fuelType,
          capacity: t.capacity,
          currentLevel: Math.round(currentLevel),
          waterLevel: Math.round(Math.random() * 50),
          temperature: 25 + Math.random() * 10,
          density: 0.74 + Math.random() * 0.05,
          atgType: 'veeder-root',
          status: currentLevel / t.capacity < 0.25 ? 'low' : 'normal',
        }
      })
      tanks.push(tank)
    }

    // =====================================================
    // 6. DISPENSERS (8) with 2 nozzles each (16 nozzles)
    // =====================================================
    const dispenserData = [
      { name: 'Pump 1', code: 'P-01', manufacturer: 'tatsuno', controller: 'pts', comm: 'tcpip' },
      { name: 'Pump 2', code: 'P-02', manufacturer: 'gilbarco', controller: 'fusion', comm: 'tcpip' },
      { name: 'Pump 3', code: 'P-03', manufacturer: 'wayne', controller: 'pts', comm: 'rs485' },
      { name: 'Pump 4', code: 'P-04', manufacturer: 'tokheim', controller: 'doms', comm: 'ethernet' },
      { name: 'Pump 5', code: 'P-05', manufacturer: 'tatsuno', controller: 'pts', comm: 'tcpip' },
      { name: 'Pump 6', code: 'P-06', manufacturer: 'gilbarco', controller: 'fusion', comm: 'tcpip' },
      { name: 'Pump 7', code: 'P-07', manufacturer: 'sanki', controller: 'pts', comm: 'rs232' },
      { name: 'Pump 8', code: 'P-08', manufacturer: 'censtar', controller: 'hectronic', comm: 'ethernet' },
    ]

    const dispensers: Awaited<ReturnType<typeof db.dispenser.create>>[] = []
    const allNozzles: Awaited<ReturnType<typeof db.nozzle.create>>[] = []
    const statuses = ['idle', 'fueling', 'idle', 'idle', 'maintenance', 'idle', 'idle', 'fueling']

    for (let idx = 0; idx < dispenserData.length; idx++) {
      const d = dispenserData[idx]
      const dispenser = await db.dispenser.create({
        data: {
          stationId: mainStation.id,
          name: d.name,
          code: d.code,
          manufacturer: d.manufacturer,
          controllerType: d.controller,
          communicationType: d.comm,
          status: statuses[idx],
          isActive: true,
        }
      })
      dispensers.push(dispenser)

      // Create 2 nozzles per dispenser
      const nozzleFuelTypes: [string, string][] = idx % 2 === 0
        ? [['petrol', 'Petrol'], ['diesel', 'Diesel']]
        : [['premium', 'Premium'], ['hsd', 'High Speed Diesel']]

      for (let n = 0; n < nozzleFuelTypes.length; n++) {
        const meterReading = 100000 + Math.floor(Math.random() * 500000)
        const nozzle = await db.nozzle.create({
          data: {
            dispenserId: dispenser.id,
            nozzleNumber: n + 1,
            fuelType: nozzleFuelTypes[n][0],
            fuelGrade: nozzleFuelTypes[n][1],
            meterReading,
            previousReading: meterReading - 1000 - Math.floor(Math.random() * 500),
            totalizer: meterReading,
            status: statuses[idx] === 'fueling' && n === 0 ? 'fueling' : 'idle',
            calibrationFactor: 1.0,
            calibrationDate: new Date('2025-01-15'),
          }
        })
        allNozzles.push(nozzle)
      }
    }

    // =====================================================
    // 7. TANK READINGS (24 per tank = 96)
    // =====================================================
    for (const tank of tanks) {
      for (let i = 0; i < 24; i++) {
        await db.tankReading.create({
          data: {
            tankId: tank.id,
            level: tank.currentLevel * (0.7 + Math.random() * 0.3),
            volume: tank.currentLevel * (0.7 + Math.random() * 0.3),
            waterLevel: Math.random() * 50,
            temperature: 25 + Math.random() * 10,
            readingType: 'automatic',
            readingAt: new Date(Date.now() - i * 3600000),
          }
        })
      }
    }

    // =====================================================
    // 8. SUPPLIERS (5)
    // =====================================================
    const suppliers = await Promise.all([
      db.supplier.create({ data: { tenantId: tenant.id, name: 'Pakistan State Oil', code: 'PSO', contactPerson: 'Aslam Pervaiz', phone: '+92-21-111-PSO-11', email: 'supply@pso.com.pk', address: 'PSO House, Karachi', city: 'Karachi', category: 'fuel', paymentTerms: 'net30', taxId: 'NTN-PSO-001', isActive: true } }),
      db.supplier.create({ data: { tenantId: tenant.id, name: 'Shell Pakistan', code: 'SHELL', contactPerson: 'Naveed Qureshi', phone: '+92-21-111-SHELL', email: 'orders@shell.pk', address: 'Shell House, Karachi', city: 'Karachi', category: 'fuel', paymentTerms: 'net15', taxId: 'NTN-SHELL-001', isActive: true } }),
      db.supplier.create({ data: { tenantId: tenant.id, name: 'Castrol Pakistan', code: 'CASTROL', contactPerson: 'Rizwan Ahmad', phone: '+92-42-35761234', email: 'lubricants@castrol.pk', address: 'Lahore', city: 'Lahore', category: 'lubricant', paymentTerms: 'net30', isActive: true } }),
      db.supplier.create({ data: { tenantId: tenant.id, name: 'Metro Wholesale', code: 'METRO', contactPerson: 'Khalid Butt', phone: '+92-51-28901234', email: 'orders@metro.pk', address: 'Islamabad', city: 'Islamabad', category: 'retail', paymentTerms: 'cod', isActive: true } }),
      db.supplier.create({ data: { tenantId: tenant.id, name: 'TechServe Maintenance', code: 'TECHSERVE', contactPerson: 'Javed Iqbal', phone: '+92-300-9876543', email: 'service@techserve.pk', address: 'Rawalpindi', city: 'Rawalpindi', category: 'maintenance', paymentTerms: 'net15', isActive: true } }),
    ])

    // =====================================================
    // 9. FUEL DELIVERIES (5)
    // =====================================================
    const deliveries = await Promise.all([
      db.fuelDelivery.create({ data: { stationId: mainStation.id, tankId: tanks[0].id, supplierId: suppliers[0].id, supplierName: 'Pakistan State Oil', tankerNumber: 'TK-4521', driverName: 'Rashid Ali', expectedVolume: 10000, actualVolume: 10000, density: 0.745, temperature: 26, productType: 'petrol', status: 'completed', deliveryDate: new Date(Date.now() - 2 * 86400000), completedAt: new Date(Date.now() - 2 * 86400000 + 3600000), variance: 0, invoiceNumber: 'INV-PSO-001', costPerUnit: 250, totalCost: 2500000 } }),
      db.fuelDelivery.create({ data: { stationId: mainStation.id, tankId: tanks[1].id, supplierId: suppliers[0].id, supplierName: 'Pakistan State Oil', tankerNumber: 'TK-4522', driverName: 'Majeed Khan', expectedVolume: 15000, actualVolume: 14980, density: 0.835, temperature: 25, productType: 'diesel', status: 'completed', deliveryDate: new Date(Date.now() - 86400000), completedAt: new Date(Date.now() - 86400000 + 4200000), variance: -20, invoiceNumber: 'INV-PSO-002', costPerUnit: 245, totalCost: 3670100 } }),
      db.fuelDelivery.create({ data: { stationId: mainStation.id, tankId: tanks[2].id, supplierId: suppliers[1].id, supplierName: 'Shell Pakistan', tankerNumber: 'SH-8834', driverName: 'Imtiaz Hussain', expectedVolume: 8000, actualVolume: 8000, density: 0.752, temperature: 27, productType: 'premium', status: 'completed', deliveryDate: new Date(Date.now() - 3 * 86400000), completedAt: new Date(Date.now() - 3 * 86400000 + 3000000), variance: 0, invoiceNumber: 'INV-SHELL-001', costPerUnit: 278, totalCost: 2224000 } }),
      db.fuelDelivery.create({ data: { stationId: mainStation.id, tankId: tanks[3].id, supplierId: suppliers[1].id, supplierName: 'Shell Pakistan', tankerNumber: 'SH-8835', driverName: 'Waqar Younis', expectedVolume: 20000, actualVolume: 0, productType: 'hsd', status: 'pending', deliveryDate: new Date(Date.now() + 86400000), notes: 'Scheduled delivery tomorrow' } }),
      db.fuelDelivery.create({ data: { stationId: mainStation.id, tankId: tanks[0].id, supplierId: suppliers[0].id, supplierName: 'Pakistan State Oil', tankerNumber: 'TK-4523', driverName: 'Shahid Afridi', expectedVolume: 12000, actualVolume: 11850, density: 0.748, temperature: 28, productType: 'petrol', status: 'discrepancy', deliveryDate: new Date(Date.now() - 43200000), completedAt: new Date(Date.now() - 43200000 + 5400000), variance: -150, invoiceNumber: 'INV-PSO-003', costPerUnit: 250, totalCost: 2962500, notes: '150L variance detected - under investigation' } }),
    ])

    // =====================================================
    // 10. RECONCILIATIONS
    // =====================================================
    for (const tank of tanks) {
      const opening = tank.currentLevel + 2000 + Math.random() * 3000
      const sales = 1500 + Math.random() * 3000
      const delivery = sales - opening + tank.currentLevel + (Math.random() * 100 - 50)
      const closing = opening + delivery - sales
      const bookStock = closing
      const actualStock = closing + (Math.random() * 60 - 30)
      const variance = actualStock - bookStock
      await db.reconciliation.create({
        data: {
          tankId: tank.id,
          stationId: mainStation.id,
          date: new Date(Date.now() - 86400000),
          openingStock: Math.round(opening),
          deliveries: Math.round(Math.max(0, delivery)),
          sales: Math.round(sales),
          closingStock: Math.round(closing),
          bookStock: Math.round(bookStock),
          actualStock: Math.round(actualStock),
          variance: Math.round(variance),
          variancePercentage: Math.round(Math.abs(variance / bookStock) * 10000) / 100,
          status: 'approved',
          reviewedBy: users[1].id,
        }
      })
    }

    // =====================================================
    // 11. TANK CALIBRATIONS
    // =====================================================
    for (const tank of tanks) {
      const volumeTable = JSON.stringify(
        Array.from({ length: 10 }, (_, i) => ({
          heightCm: (i + 1) * 20,
          volumeLitres: Math.round(tank.capacity * ((i + 1) / 10)),
        }))
      )
      await db.tankCalibration.create({
        data: {
          stationId: mainStation.id,
          tankId: tank.id,
          calibrationDate: new Date('2025-01-15'),
          calibratedBy: 'Pakistan Weights & Measures Dept',
          certificateNumber: `CAL-${tank.code}-2025`,
          volumeTable,
          notes: 'Annual calibration per regulatory requirements',
        }
      })
    }

    // =====================================================
    // 12. SHIFTS (1 open + 2 closed)
    // =====================================================
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Closed shift 1 (yesterday night)
    const closedShift1 = await db.shift.create({
      data: {
        stationId: mainStation.id,
        shiftNumber: 1,
        attendantId: employees[2].id,
        supervisorId: employees[1].id,
        openedAt: new Date(todayStart.getTime() - 86400000 + 6 * 3600000),
        closedAt: new Date(todayStart.getTime() - 86400000 + 14 * 3600000),
        openingCash: 50000,
        closingCash: 285000,
        expectedCash: 287500,
        cashVariance: -2500,
        totalSales: 287500,
        totalVolume: 1100,
        fuelSales: 262500,
        retailSales: 25000,
        cardSales: 87500,
        fleetSales: 52500,
        creditSales: 17500,
        cashSales: 130000,
        transactionCount: 42,
        status: 'reconciled',
      }
    })

    // Closed shift 2 (today morning)
    const closedShift2 = await db.shift.create({
      data: {
        stationId: mainStation.id,
        shiftNumber: 2,
        attendantId: employees[3].id,
        supervisorId: employees[1].id,
        openedAt: new Date(todayStart.getTime() + 6 * 3600000),
        closedAt: new Date(todayStart.getTime() + 14 * 3600000),
        openingCash: 60000,
        closingCash: 195000,
        expectedCash: 198000,
        cashVariance: -3000,
        totalSales: 198000,
        totalVolume: 750,
        fuelSales: 178000,
        retailSales: 20000,
        cardSales: 58000,
        fleetSales: 42000,
        creditSales: 12000,
        cashSales: 86000,
        transactionCount: 31,
        status: 'closed',
      }
    })

    // Open shift (current)
    const openShift = await db.shift.create({
      data: {
        stationId: mainStation.id,
        shiftNumber: 3,
        attendantId: employees[4].id,
        supervisorId: employees[0].id,
        openedAt: new Date(todayStart.getTime() + 14 * 3600000),
        openingCash: 50000,
        totalSales: 0,
        totalVolume: 0,
        fuelSales: 0,
        retailSales: 0,
        cardSales: 0,
        fleetSales: 0,
        creditSales: 0,
        cashSales: 0,
        status: 'open',
      }
    })

    // =====================================================
    // 13. FUELING TRANSACTIONS (60+)
    // =====================================================
    const fuelTypes = ['petrol', 'diesel', 'premium', 'hsd']
    const paymentMethods = ['cash', 'card', 'fleet', 'rfid', 'mobile']
    const prices: Record<string, number> = { petrol: 272.50, diesel: 268.00, premium: 302.50, hsd: 275.00 }

    let openShiftSales = 0
    let openShiftVolume = 0
    let openShiftFuelSales = 0
    let openShiftCardSales = 0
    let openShiftFleetSales = 0
    let openShiftCreditSales = 0
    let openShiftCashSales = 0

    // Transactions for closed shift 1
    for (let i = 0; i < 20; i++) {
      const fuelType = fuelTypes[Math.floor(Math.random() * fuelTypes.length)]
      const volume = 5 + Math.floor(Math.random() * 55)
      const price = prices[fuelType]
      const amount = Math.round(volume * price * 100) / 100
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
      const dispenserIdx = Math.floor(Math.random() * dispensers.length)
      const nozzlesForDispenser = allNozzles.filter(n => n.dispenserId === dispensers[dispenserIdx].id)
      const nozzle = nozzlesForDispenser[Math.floor(Math.random() * nozzlesForDispenser.length)]
      if (!nozzle) continue

      const hoursAgo = 20 + Math.floor(Math.random() * 8)
      const startTime = new Date(now.getTime() - hoursAgo * 3600000)

      await db.fueling.create({
        data: {
          stationId: mainStation.id,
          dispenserId: dispensers[dispenserIdx].id,
          nozzleId: nozzle.id,
          shiftId: closedShift1.id,
          fuelType,
          volume,
          pricePerUnit: price,
          totalAmount: amount,
          paymentMethod,
          meterStart: nozzle.meterReading - volume - Math.floor(Math.random() * 10),
          meterEnd: nozzle.meterReading - Math.floor(Math.random() * 10),
          attendantId: employees[2].id,
          status: 'completed',
          startedAt: startTime,
          completedAt: new Date(startTime.getTime() + 120000 + Math.random() * 300000),
        }
      })
    }

    // Transactions for closed shift 2
    for (let i = 0; i < 20; i++) {
      const fuelType = fuelTypes[Math.floor(Math.random() * fuelTypes.length)]
      const volume = 5 + Math.floor(Math.random() * 55)
      const price = prices[fuelType]
      const amount = Math.round(volume * price * 100) / 100
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
      const dispenserIdx = Math.floor(Math.random() * dispensers.length)
      const nozzlesForDispenser = allNozzles.filter(n => n.dispenserId === dispensers[dispenserIdx].id)
      const nozzle = nozzlesForDispenser[Math.floor(Math.random() * nozzlesForDispenser.length)]
      if (!nozzle) continue

      const hoursAgo = 8 + Math.floor(Math.random() * 6)
      const startTime = new Date(now.getTime() - hoursAgo * 3600000)

      await db.fueling.create({
        data: {
          stationId: mainStation.id,
          dispenserId: dispensers[dispenserIdx].id,
          nozzleId: nozzle.id,
          shiftId: closedShift2.id,
          fuelType,
          volume,
          pricePerUnit: price,
          totalAmount: amount,
          paymentMethod,
          meterStart: nozzle.meterReading - volume - Math.floor(Math.random() * 10),
          meterEnd: nozzle.meterReading - Math.floor(Math.random() * 10),
          attendantId: employees[3].id,
          status: 'completed',
          startedAt: startTime,
          completedAt: new Date(startTime.getTime() + 120000 + Math.random() * 300000),
        }
      })
    }

    // Transactions for open shift (current)
    for (let i = 0; i < 25; i++) {
      const fuelType = fuelTypes[Math.floor(Math.random() * fuelTypes.length)]
      const volume = 5 + Math.floor(Math.random() * 55)
      const price = prices[fuelType]
      const amount = Math.round(volume * price * 100) / 100
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
      const dispenserIdx = Math.floor(Math.random() * dispensers.length)
      const nozzlesForDispenser = allNozzles.filter(n => n.dispenserId === dispensers[dispenserIdx].id)
      const nozzle = nozzlesForDispenser[Math.floor(Math.random() * nozzlesForDispenser.length)]
      if (!nozzle) continue

      const hoursAgo = Math.floor(Math.random() * 6)
      const startTime = new Date(now.getTime() - hoursAgo * 3600000)

      openShiftSales += amount
      openShiftVolume += volume
      openShiftFuelSales += amount
      if (paymentMethod === 'card') openShiftCardSales += amount
      else if (paymentMethod === 'fleet') openShiftFleetSales += amount
      else if (paymentMethod === 'cash') openShiftCashSales += amount
      else openShiftCreditSales += amount

      await db.fueling.create({
        data: {
          stationId: mainStation.id,
          dispenserId: dispensers[dispenserIdx].id,
          nozzleId: nozzle.id,
          shiftId: openShift.id,
          fuelType,
          volume,
          pricePerUnit: price,
          totalAmount: amount,
          paymentMethod,
          meterStart: nozzle.meterReading - volume - Math.floor(Math.random() * 10),
          meterEnd: nozzle.meterReading - Math.floor(Math.random() * 10),
          attendantId: employees[4 + Math.floor(Math.random() * 2)].id,
          status: 'completed',
          startedAt: startTime,
          completedAt: new Date(startTime.getTime() + 120000 + Math.random() * 300000),
        }
      })
    }

    // Update open shift totals
    await db.shift.update({
      where: { id: openShift.id },
      data: {
        totalSales: Math.round(openShiftSales * 100) / 100,
        totalVolume: Math.round(openShiftVolume),
        fuelSales: Math.round(openShiftFuelSales * 100) / 100,
        cardSales: Math.round(openShiftCardSales * 100) / 100,
        fleetSales: Math.round(openShiftFleetSales * 100) / 100,
        creditSales: Math.round(openShiftCreditSales * 100) / 100,
        cashSales: Math.round(openShiftCashSales * 100) / 100,
      }
    })

    // =====================================================
    // 14. METER RECORDS
    // =====================================================
    for (const nozzle of allNozzles) {
      const readingStart = nozzle.meterReading - 2000 - Math.floor(Math.random() * 1000)
      await db.meterRecord.create({
        data: {
          stationId: mainStation.id,
          nozzleId: nozzle.id,
          shiftId: closedShift1.id,
          readingStart,
          readingEnd: readingStart + 500 + Math.floor(Math.random() * 1000),
          volumeDispensed: 500 + Math.floor(Math.random() * 1000),
          recordedAt: new Date(Date.now() - 86400000),
        }
      })
      // Meter record for closed shift 2
      const readingStart2 = nozzle.previousReading + Math.floor(Math.random() * 500)
      await db.meterRecord.create({
        data: {
          stationId: mainStation.id,
          nozzleId: nozzle.id,
          shiftId: closedShift2.id,
          readingStart: readingStart2,
          readingEnd: readingStart2 + 300 + Math.floor(Math.random() * 700),
          volumeDispensed: 300 + Math.floor(Math.random() * 700),
          recordedAt: new Date(todayStart.getTime() + 6 * 3600000),
        }
      })
      await db.meterRecord.create({
        data: {
          stationId: mainStation.id,
          nozzleId: nozzle.id,
          shiftId: openShift.id,
          readingStart: nozzle.meterReading - 1000 - Math.floor(Math.random() * 500),
          readingEnd: nozzle.meterReading,
          volumeDispensed: 500 + Math.floor(Math.random() * 500),
          recordedAt: new Date(),
        }
      })
    }

    // =====================================================
    // 15. FLEET ACCOUNTS (4) with vehicles, drivers, fuel cards
    // =====================================================
    const fleetData = [
      { name: 'Pakistan Post Fleet', contact: 'Malik Aslam', daily: 5000 },
      { name: 'Daewoo Express', contact: 'Syed Wajahat', daily: 15000 },
      { name: 'NLC Logistics', contact: 'Col. Rashid', daily: 25000 },
      { name: 'Metro Bus Operations', contact: 'Engr. Farooq', daily: 20000 },
    ]

    const fleetAccounts: Awaited<ReturnType<typeof db.fleetAccount.create>>[] = []
    for (const f of fleetData) {
      const fleet = await db.fleetAccount.create({
        data: {
          tenantId: tenant.id,
          companyName: f.name,
          contactPerson: f.contact,
          phone: '+92-300-1234567',
          email: `fleet@${f.name.toLowerCase().replace(/\s/g, '')}.pk`,
          creditLimit: 5000000,
          currentBalance: 2500000 + Math.floor(Math.random() * 2000000),
          dailyLimit: f.daily,
          monthlyLimit: f.daily * 30,
          fuelTypes: 'petrol,diesel,hsd',
          status: 'active',
          paymentTerms: 'net30',
        }
      })
      fleetAccounts.push(fleet)

      // 3 vehicles per fleet
      const vehicleMakes = ['Toyota', 'Suzuki', 'Honda', 'Isuzu', 'Hino', 'Daewoo', 'Hyundai', 'Mitsubishi', 'Kia', 'Foton', 'MAN', 'Volvo']
      for (let v = 0; v < 3; v++) {
        await db.vehicle.create({
          data: {
            fleetAccountId: fleet.id,
            plateNumber: `LEA-${Math.floor(Math.random() * 9000 + 1000)}`,
            make: vehicleMakes[Math.floor(Math.random() * vehicleMakes.length)],
            model: `${2020 + Math.floor(Math.random() * 5)}`,
            year: 2020 + Math.floor(Math.random() * 5),
            vehicleType: v === 0 ? 'sedan' : v === 1 ? 'bus' : 'truck',
            rfidTag: `RFID-${fleet.id.slice(-4)}-${v + 1}`,
            fuelType: v === 0 ? 'petrol' : 'diesel',
            tankCapacity: v === 0 ? 50 : v === 1 ? 200 : 400,
            dailyLimit: f.daily / 3,
            odometer: 50000 + Math.floor(Math.random() * 100000),
            isActive: true,
          }
        })
      }

      // 3 drivers per fleet
      const driverNames = ['Akram Shah', 'Nasir Javed', 'Waqas Malik', 'Faisal Iqbal', 'Sajid Mehmood', 'Rizwan Ahmed', 'Shoaib Akhtar', 'Asif Khan', 'Younis Raza', 'Kamran Yousuf', 'Imran Butt', 'Haris Sohail']
      for (let d = 0; d < 3; d++) {
        await db.driver.create({
          data: {
            fleetAccountId: fleet.id,
            name: driverNames[fleetData.indexOf(f) * 3 + d],
            licenseNumber: `DL-${Math.floor(Math.random() * 900000 + 100000)}`,
            phone: `+92-3${Math.floor(Math.random() * 10)}0-${Math.floor(Math.random() * 9000000 + 1000000)}`,
            rfidCard: `DRV-${fleet.id.slice(-4)}-${d + 1}`,
            isActive: true,
          }
        })
      }

      // 5 fuel cards per fleet
      for (let c = 0; c < 5; c++) {
        await db.fuelCard.create({
          data: {
            tenantId: tenant.id,
            cardNumber: `FC-${fleet.id.slice(-4)}-${String(c + 1).padStart(4, '0')}`,
            fleetAccountId: fleet.id,
            cardType: 'fleet',
            rfidTag: `FC-RFID-${fleet.id.slice(-4)}-${c + 1}`,
            pin: String(1000 + c),
            dailyLimit: f.daily / 5,
            monthlyLimit: f.daily * 6,
            balance: 100000 + Math.floor(Math.random() * 200000),
            isActive: true,
            expiryDate: new Date('2026-12-31'),
          }
        })
      }
    }

    // =====================================================
    // 16. FUEL PRICES
    // =====================================================
    const fuelPriceData = [
      { fuelType: 'petrol', pricePerUnit: 272.50, previousPrice: 270.00 },
      { fuelType: 'diesel', pricePerUnit: 268.00, previousPrice: 265.50 },
      { fuelType: 'premium', pricePerUnit: 302.50, previousPrice: 298.00 },
      { fuelType: 'hsd', pricePerUnit: 275.00, previousPrice: 272.50 },
    ]

    for (const fp of fuelPriceData) {
      await db.fuelPrice.create({
        data: {
          tenantId: tenant.id,
          stationId: mainStation.id,
          fuelType: fp.fuelType,
          pricePerUnit: fp.pricePerUnit,
          previousPrice: fp.previousPrice,
          currency: 'PKR',
          effectiveFrom: new Date('2025-03-01'),
          status: 'active',
          isGovernment: true,
          updatedBy: users[0].id,
        }
      })
    }

    // =====================================================
    // 17. PRICE BOARDS (2) - NO code field
    // =====================================================
    await db.priceBoard.createMany({
      data: [
        { stationId: mainStation.id, name: 'Main Price Board', boardType: 'led', status: 'online', ipAddress: '192.168.1.100', port: 8080, lastUpdate: new Date() },
        { stationId: mainStation.id, name: 'Canopy Display', boardType: 'digital', status: 'online', ipAddress: '192.168.1.101', port: 8081, lastUpdate: new Date() },
      ]
    })

    // =====================================================
    // 18. RETAIL PRODUCTS (8+)
    // =====================================================
    const retailItems = [
      { name: 'Mineral Water 500ml', category: 'beverages', price: 80, stock: 200, sku: 'BEV-001' },
      { name: 'Cold Drink 345ml', category: 'beverages', price: 120, stock: 150, sku: 'BEV-002' },
      { name: 'Energy Drink 250ml', category: 'beverages', price: 280, stock: 80, sku: 'BEV-003' },
      { name: 'Snack Pack', category: 'snacks', price: 150, stock: 100, sku: 'SNK-001' },
      { name: 'Chips Variety', category: 'snacks', price: 100, stock: 120, sku: 'SNK-002' },
      { name: 'Engine Oil 1L', category: 'automotive', price: 850, stock: 50, sku: 'AUTO-001' },
      { name: 'Windshield Washer', category: 'automotive', price: 350, stock: 30, sku: 'AUTO-002' },
      { name: 'Car Freshener', category: 'automotive', price: 250, stock: 60, sku: 'AUTO-003' },
      { name: 'First Aid Kit', category: 'automotive', price: 1200, stock: 15, sku: 'AUTO-004' },
    ]

    for (const r of retailItems) {
      await db.retailProduct.create({
        data: {
          stationId: mainStation.id,
          name: r.name,
          category: r.category,
          price: r.price,
          costPrice: r.price * 0.7,
          stockQty: r.stock,
          minStock: 10,
          unit: 'piece',
          sku: r.sku,
          supplierId: r.category === 'beverages' || r.category === 'snacks' ? suppliers[3].id : null,
        }
      })
    }

    // =====================================================
    // 19. LUBRICANT PRODUCTS (6)
    // =====================================================
    const lubricantItems = [
      { name: '5W-30 Full Synthetic', brand: 'Castrol EDGE', viscosity: '5W-30', category: 'engine_oil', price: 4500, stock: 20 },
      { name: '10W-40 Semi Synthetic', brand: 'Castrol MAGNATEC', viscosity: '10W-40', category: 'engine_oil', price: 3200, stock: 30 },
      { name: '75W-90 Gear Oil', brand: 'Castrol Syntrax', viscosity: '75W-90', category: 'gear_oil', price: 2800, stock: 15 },
      { name: 'DOT 4 Brake Fluid', brand: 'Castrol React', viscosity: null, category: 'brake_fluid', price: 950, stock: 25 },
      { name: 'Automatic ATF', brand: 'Castrol Transmax', viscosity: 'ATF', category: 'transmission', price: 3500, stock: 10 },
      { name: 'Coolant Ready Mix', brand: 'Castrol Radicool', viscosity: null, category: 'coolant', price: 1200, stock: 20 },
    ]

    for (const l of lubricantItems) {
      await db.lubricantProduct.create({
        data: {
          stationId: mainStation.id,
          name: l.name,
          brand: l.brand,
          viscosity: l.viscosity,
          category: l.category,
          price: l.price,
          costPrice: l.price * 0.65,
          stockQty: l.stock,
          minStock: 5,
          isActive: true,
        }
      })
    }

    // =====================================================
    // 20. RETAIL TRANSACTIONS (5)
    // =====================================================
    for (let i = 0; i < 5; i++) {
      const items = JSON.stringify([
        { name: retailItems[Math.floor(Math.random() * retailItems.length)].name, qty: 1 + Math.floor(Math.random() * 3), price: retailItems[Math.floor(Math.random() * retailItems.length)].price }
      ])
      const totalAmount = 200 + Math.floor(Math.random() * 2000)
      await db.retailTransaction.create({
        data: {
          stationId: mainStation.id,
          shiftId: openShift.id,
          totalAmount,
          paymentMethod: Math.random() > 0.5 ? 'cash' : 'card',
          items,
          posTerminal: 'POS-01',
          discountAmount: Math.random() > 0.7 ? Math.floor(totalAmount * 0.05) : 0,
          status: 'completed',
        }
      })
    }

    // =====================================================
    // 21. CAR WASH SESSIONS (4)
    // =====================================================
    const washTypes = ['basic', 'premium', 'deluxe']
    const washPrices: Record<string, number> = { basic: 500, premium: 1200, deluxe: 2500 }
    for (let i = 0; i < 4; i++) {
      const washType = washTypes[Math.floor(Math.random() * washTypes.length)]
      await db.carWashSession.create({
        data: {
          stationId: mainStation.id,
          shiftId: openShift.id,
          vehiclePlate: `ISB-${Math.floor(Math.random() * 900 + 100)}`,
          washType,
          amount: washPrices[washType],
          paymentMethod: Math.random() > 0.5 ? 'cash' : 'card',
          status: 'completed',
          startedAt: new Date(Date.now() - (i + 1) * 3600000),
          completedAt: new Date(Date.now() - (i + 1) * 3600000 + 1800000),
        }
      })
    }

    // =====================================================
    // 22. LOTTERY SALES (3)
    // =====================================================
    const lotteryGames = ['scratch', 'draw', 'online']
    for (let i = 0; i < 3; i++) {
      const ticketCount = 1 + Math.floor(Math.random() * 5)
      const saleAmount = ticketCount * (100 + Math.floor(Math.random() * 200))
      await db.lotterySale.create({
        data: {
          stationId: mainStation.id,
          shiftId: openShift.id,
          gameType: lotteryGames[i],
          ticketCount,
          saleAmount,
          commission: Math.round(saleAmount * 0.05),
          status: 'completed',
        }
      })
    }

    // =====================================================
    // 23. SUPPLIER INVOICES (3)
    // =====================================================
    await db.supplierInvoice.createMany({
      data: [
        { stationId: mainStation.id, supplierId: suppliers[0].id, invoiceNumber: 'INV-PSO-2025-001', invoiceDate: new Date(Date.now() - 5 * 86400000), dueDate: new Date(Date.now() + 25 * 86400000), totalAmount: 2500000, taxAmount: 450000, netAmount: 2950000, status: 'pending', paidAmount: 0, notes: 'Monthly fuel supply - March 2025' },
        { stationId: mainStation.id, supplierId: suppliers[1].id, invoiceNumber: 'INV-SHELL-2025-001', invoiceDate: new Date(Date.now() - 10 * 86400000), dueDate: new Date(Date.now() + 5 * 86400000), totalAmount: 1800000, taxAmount: 324000, netAmount: 2124000, status: 'approved', paidAmount: 0, notes: 'Diesel & HSD supply - Feb 2025' },
        { stationId: mainStation.id, supplierId: suppliers[2].id, invoiceNumber: 'INV-CASTROL-2025-001', invoiceDate: new Date(Date.now() - 15 * 86400000), dueDate: new Date(Date.now() - 1 * 86400000), totalAmount: 450000, taxAmount: 81000, netAmount: 531000, status: 'paid', paidAmount: 531000, paidDate: new Date(Date.now() - 3 * 86400000), notes: 'Lubricant stock replenishment' },
      ]
    })

    // =====================================================
    // 24. PURCHASE ORDERS (2)
    // =====================================================
    await db.purchaseOrder.createMany({
      data: [
        { stationId: mainStation.id, supplierId: suppliers[3].id, poNumber: 'PO-2025-001', orderDate: new Date(Date.now() - 3 * 86400000), expectedDate: new Date(Date.now() + 4 * 86400000), items: JSON.stringify([{ name: 'Mineral Water 500ml', qty: 200, unitPrice: 56 }, { name: 'Energy Drink 250ml', qty: 100, unitPrice: 196 }]), totalAmount: 30800, status: 'submitted', notes: 'Urgent retail stock replenishment' },
        { stationId: mainStation.id, supplierId: suppliers[4].id, poNumber: 'PO-2025-002', orderDate: new Date(Date.now() - 7 * 86400000), expectedDate: new Date(Date.now() - 2 * 86400000), items: JSON.stringify([{ name: 'Pump Nozzle Calibration', qty: 16, unitPrice: 5000 }, { name: 'ATG Sensor Check', qty: 4, unitPrice: 3500 }]), totalAmount: 94000, status: 'received', approvedBy: users[1].id, notes: 'Quarterly maintenance service' },
      ]
    })

    // =====================================================
    // 25. ATTENDANCE RECORDS (today)
    // =====================================================
    for (const emp of employees) {
      if (emp.role === 'maintenance') continue
      const checkInHour = emp.role === 'manager' ? 8 : 6 + Math.floor(Math.random() * 2)
      await db.attendance.create({
        data: {
          employeeId: emp.id,
          stationId: mainStation.id,
          checkIn: new Date(todayStart.getTime() + checkInHour * 3600000),
          checkOut: null,
          status: checkInHour > 7 ? 'late' : 'present',
          hoursWorked: null,
        }
      })
    }

    // =====================================================
    // 26. PAYROLL RECORDS (current month - all employees)
    // =====================================================
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    for (const emp of employees) {
      const overtimeHours = emp.role === 'attendant' ? Math.floor(Math.random() * 20) : Math.floor(Math.random() * 10)
      const overtimeRate = emp.salary / 200 // hourly rate approximation
      const overtimePay = Math.round(overtimeHours * overtimeRate)
      const commissions = emp.commissionRate ? Math.round(emp.salary * emp.commissionRate * 0.01 * (10 + Math.random() * 20)) : 0
      const deductions = Math.round(emp.salary * 0.02)
      const taxDeductions = Math.round(emp.salary * 0.1)
      const netPay = emp.salary + overtimePay + commissions - deductions - taxDeductions
      await db.payrollRecord.create({
        data: {
          stationId: mainStation.id,
          employeeId: emp.id,
          periodStart: currentMonthStart,
          periodEnd: currentMonthEnd,
          baseSalary: emp.salary,
          overtimeHours,
          overtimePay,
          commissions,
          deductions,
          taxDeductions,
          netPay,
          status: emp.role === 'manager' || emp.role === 'supervisor' ? 'approved' : 'pending',
        }
      })
    }

    // Legacy payroll records for February
    await db.payrollRecord.create({
      data: {
        stationId: mainStation.id,
        employeeId: employees[0].id,
        periodStart: new Date('2025-02-01'),
        periodEnd: new Date('2025-02-28'),
        baseSalary: 85000,
        overtimeHours: 12,
        overtimePay: 6000,
        commissions: 0,
        deductions: 2000,
        taxDeductions: 8500,
        netPay: 80500,
        status: 'paid',
        paidDate: new Date('2025-03-01'),
      }
    })
    await db.payrollRecord.create({
      data: {
        stationId: mainStation.id,
        employeeId: employees[1].id,
        periodStart: new Date('2025-02-01'),
        periodEnd: new Date('2025-02-28'),
        baseSalary: 55000,
        overtimeHours: 8,
        overtimePay: 4000,
        commissions: 0,
        deductions: 1500,
        taxDeductions: 5500,
        netPay: 52000,
        status: 'paid',
        paidDate: new Date('2025-03-01'),
      }
    })

    // =====================================================
    // 27. LEAVE REQUESTS (1 approved, 1 pending)
    // =====================================================
    await db.leaveRequest.create({
      data: {
        stationId: mainStation.id,
        employeeId: employees[2].id,
        leaveType: 'sick',
        startDate: new Date(Date.now() - 2 * 86400000),
        endDate: new Date(Date.now() - 1 * 86400000),
        reason: 'Medical appointment - flu symptoms',
        status: 'approved',
        approvedBy: users[1].id,
      }
    })
    await db.leaveRequest.create({
      data: {
        stationId: mainStation.id,
        employeeId: employees[5].id,
        leaveType: 'annual',
        startDate: new Date(Date.now() + 3 * 86400000),
        endDate: new Date(Date.now() + 5 * 86400000),
        reason: 'Family wedding in Lahore',
        status: 'pending',
      }
    })

    // =====================================================
    // 28. AI ALERTS (6)
    // =====================================================
    const alertData = [
      { type: 'fuel_loss', severity: 'critical', title: 'Unusual Fuel Loss Detected - Tank B', desc: 'Variance of 142L detected in Tank B (Diesel) during shift reconciliation. This exceeds the 0.5% threshold.' },
      { type: 'theft', severity: 'critical', title: 'Potential Fuel Theft Alert - Pump 3', desc: 'Meter readings show discrepancy of 23L on Pump 3 Nozzle 1. Pattern matches known meter manipulation.' },
      { type: 'variance', severity: 'warning', title: 'Stock Variance - Tank A', desc: 'Tank A (Petrol) showing 0.3% variance over last 3 shifts. Recommend investigation.' },
      { type: 'maintenance', severity: 'warning', title: 'Pump 7 Calibration Due', desc: 'Pump 7 last calibrated 89 days ago. Recommended calibration interval is 90 days.' },
      { type: 'demand', severity: 'info', title: 'High Demand Forecast - Weekend', desc: 'AI predicts 35% increase in petrol demand this weekend based on historical patterns and local events.' },
      { type: 'leakage', severity: 'critical', title: 'Possible Tank Leak - Tank C', desc: 'Continuous level drop of 2.1L/hour detected in Tank C (Premium) with no corresponding sales.' },
    ]

    for (const a of alertData) {
      await db.aIAlert.create({
        data: {
          tenantId: tenant.id,
          stationId: mainStation.id,
          alertType: a.type,
          severity: a.severity,
          title: a.title,
          description: a.desc,
          confidence: 0.75 + Math.random() * 0.2,
          isRead: false,
          isResolved: false,
        }
      })
    }

    // =====================================================
    // 29. AI FORECASTS (14 days × 3 types × 3 fuels = 126)
    // =====================================================
    const forecastTypes = ['demand', 'revenue', 'inventory']
    const aiForecastFuelTypes = ['petrol', 'diesel', 'premium']

    for (let dayOffset = -7; dayOffset <= 7; dayOffset++) {
      const periodStart = new Date()
      periodStart.setDate(periodStart.getDate() + dayOffset)
      periodStart.setHours(0, 0, 0, 0)

      const periodEnd = new Date(periodStart)
      periodEnd.setHours(23, 59, 59, 999)

      for (const forecastType of forecastTypes) {
        for (const fuelType of aiForecastFuelTypes) {
          let predictedValue: number
          if (forecastType === 'demand') {
            // Demand in liters: 5000-25000
            predictedValue = 5000 + Math.random() * 20000
          } else if (forecastType === 'revenue') {
            // Revenue in PKR: 150000-800000
            predictedValue = 150000 + Math.random() * 650000
          } else {
            // Inventory in liters: 10000-50000
            predictedValue = 10000 + Math.random() * 40000
          }

          // Confidence: 0.65-0.95, slightly higher for past dates (already observed)
          const baseConfidence = dayOffset <= 0 ? 0.80 : 0.65
          const confidenceRange = dayOffset <= 0 ? 0.15 : 0.20
          const confidence = baseConfidence + Math.random() * confidenceRange

          await db.aIForecast.create({
            data: {
              tenantId: tenant.id,
              stationId: mainStation.id,
              forecastType,
              fuelType,
              predictedValue: Math.round(predictedValue * 100) / 100,
              confidence: Math.round(confidence * 1000) / 1000,
              periodStart,
              periodEnd,
            }
          })
        }
      }
    }

    // =====================================================
    // 30. NOTIFICATIONS (6)
    // =====================================================
    const notificationData = [
      { title: 'Shift 3 Opened', message: 'Shift #3 has been opened by Farhan Raza at 14:00', type: 'shift', priority: 'normal' },
      { title: 'Fuel Delivery Arriving', message: 'Shell Pakistan HSD delivery expected tomorrow at 08:00', type: 'delivery', priority: 'high' },
      { title: 'Tank B Low Alert', message: 'Tank B (Diesel) has dropped below 25% capacity', type: 'alert', priority: 'high' },
      { title: 'Price Update Scheduled', message: 'Government fuel price revision effective from March 15, 2025', type: 'system', priority: 'normal' },
      { title: 'Fleet Payment Due', message: 'Daewoo Express monthly invoice of PKR 1.2M due in 5 days', type: 'warning', priority: 'high' },
      { title: 'Daily Report Ready', message: "Yesterday's daily report has been generated and is ready for review", type: 'info', priority: 'low' },
    ]

    for (const n of notificationData) {
      await db.notification.create({
        data: {
          tenantId: tenant.id,
          stationId: mainStation.id,
          title: n.title,
          message: n.message,
          type: n.type,
          priority: n.priority,
          isRead: false,
        }
      })
    }

    // =====================================================
    // 31. CUSTOMERS with loyalty data (10)
    // =====================================================
    const customerNames = [
      'Asad Mahmood', 'Bushra Khan', 'Chaudhry Naveed', 'Dr. Saeed Ahmad', 'Erum Fatima',
      'Ghulam Mustafa', 'Hina Shahid', 'Irfan-ul-Haq', 'Javeria Siddiqui', 'Khalid Mehmood'
    ]

    for (let i = 0; i < customerNames.length; i++) {
      const tier = i < 2 ? 'platinum' : i < 5 ? 'gold' : i < 8 ? 'silver' : 'basic'
      await db.customer.create({
        data: {
          tenantId: tenant.id,
          name: customerNames[i],
          phone: `+92-3${Math.floor(Math.random() * 10)}0-${Math.floor(Math.random() * 9000000 + 1000000)}`,
          email: `${customerNames[i].toLowerCase().replace(/\s/g, '.')}@email.pk`,
          loyaltyPoints: i < 2 ? 5000 + Math.floor(Math.random() * 5000) : 500 + Math.floor(Math.random() * 2000),
          membershipTier: tier,
          totalSpent: i < 2 ? 500000 + Math.floor(Math.random() * 500000) : 50000 + Math.floor(Math.random() * 200000),
          totalVisits: 10 + Math.floor(Math.random() * 100),
          lastVisit: new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000),
          isActive: true,
        }
      })
    }

    // =====================================================
    // 32. LOYALTY RULES (2)
    // =====================================================
    await db.loyaltyRule.createMany({
      data: [
        { tenantId: tenant.id, name: 'Standard Fuel Points', pointsPerUnit: 1, fuelType: null, minimumPurchase: 500, bonusMultiplier: 1, isActive: true, validFrom: new Date('2025-01-01'), validTo: new Date('2025-12-31') },
        { tenantId: tenant.id, name: 'Premium Double Points', pointsPerUnit: 2, fuelType: 'premium', minimumPurchase: 1000, bonusMultiplier: 2, isActive: true, validFrom: new Date('2025-03-01'), validTo: new Date('2025-04-30') },
      ]
    })

    // =====================================================
    // 33. PROMOTIONS with usage (2)
    // =====================================================
    const promo1 = await db.promotion.create({
      data: {
        tenantId: tenant.id,
        name: 'Weekend Fuel Discount',
        description: '5% off on all fuel types during weekends',
        discountType: 'percentage',
        discountValue: 5,
        applicableTo: 'fuel',
        fuelType: null,
        minimumPurchase: 2000,
        validFrom: new Date('2025-03-01'),
        validTo: new Date('2025-03-31'),
        isActive: true,
      }
    })

    const promo2 = await db.promotion.create({
      data: {
        tenantId: tenant.id,
        name: 'Car Wash Bundle',
        description: 'Free basic car wash with 40L+ fuel purchase',
        discountType: 'fixed',
        discountValue: 500,
        applicableTo: 'car_wash',
        fuelType: null,
        minimumPurchase: 10000,
        validFrom: new Date('2025-03-01'),
        validTo: new Date('2025-04-30'),
        isActive: true,
      }
    })

    // Promotion usage
    await db.promotionUsage.createMany({
      data: [
        { stationId: mainStation.id, promotionId: promo1.id, customerName: 'Asad Mahmood', discountAmount: 750 },
        { stationId: mainStation.id, promotionId: promo1.id, customerName: 'Bushra Khan', discountAmount: 520 },
        { stationId: mainStation.id, promotionId: promo2.id, customerName: 'Chaudhry Naveed', discountAmount: 500 },
      ]
    })

    // =====================================================
    // 34. ENVIRONMENTAL ALERTS (3)
    // =====================================================
    await db.environmentalAlert.createMany({
      data: [
        { stationId: mainStation.id, alertType: 'vapor', severity: 'warning', tankId: tanks[1].id, description: 'Vapor recovery system showing elevated pressure readings on Tank B', epaCode: 'EPA-VRR-001', isReportable: false, isResolved: false },
        { stationId: mainStation.id, alertType: 'water_intrusion', severity: 'warning', tankId: tanks[0].id, description: 'Water level in Tank A exceeding normal thresholds - 48mm detected', epaCode: 'EPA-WI-003', isReportable: false, isResolved: false },
        { stationId: mainStation.id, alertType: 'overfill', severity: 'critical', tankId: tanks[2].id, description: 'Overfill alarm triggered during fuel delivery to Tank C', epaCode: 'EPA-OF-002', isReportable: true, isResolved: false, reportedToAgency: true },
      ]
    })

    // =====================================================
    // 35. VAPOR RECOVERY READINGS (2)
    // =====================================================
    await db.vaporRecoveryReading.createMany({
      data: [
        { stationId: mainStation.id, tankId: tanks[0].id, vaporPressure: 2.5, recoveryRate: 98.5, status: 'normal', readingAt: new Date(Date.now() - 3600000) },
        { stationId: mainStation.id, tankId: tanks[1].id, vaporPressure: 4.8, recoveryRate: 92.1, status: 'warning', readingAt: new Date() },
      ]
    })

    // =====================================================
    // 36. DAILY REPORTS (last 7 days)
    // =====================================================
    for (let i = 1; i <= 7; i++) {
      const reportDate = new Date(now)
      reportDate.setDate(reportDate.getDate() - i)
      reportDate.setHours(0, 0, 0, 0)

      const fuelRevenue = 400000 + Math.floor(Math.random() * 300000)
      const retailRevenue = 20000 + Math.floor(Math.random() * 30000)
      const totalVolume = 1500 + Math.floor(Math.random() * 1500)
      const expenses = 50000 + Math.floor(Math.random() * 40000)

      await db.dailyReport.create({
        data: {
          stationId: mainStation.id,
          reportDate,
          totalRevenue: fuelRevenue + retailRevenue,
          fuelRevenue,
          retailRevenue,
          totalVolume,
          transactionCount: 50 + Math.floor(Math.random() * 40),
          averageTicket: Math.round((fuelRevenue + retailRevenue) / (50 + Math.floor(Math.random() * 40))),
          cashVariance: Math.round((Math.random() - 0.5) * 5000),
          fuelVariance: Math.round((Math.random() - 0.5) * 200),
          expenses,
          netProfit: fuelRevenue + retailRevenue - expenses,
        }
      })
    }

    // =====================================================
    // 37. AUDIT LOGS (20+)
    // =====================================================
    const auditActions = [
      { action: 'LOGIN', entity: 'User', details: 'Superadmin logged in from 192.168.1.10' },
      { action: 'CREATE', entity: 'Shift', details: 'Shift #3 opened by Ahmed Khan' },
      { action: 'UPDATE', entity: 'FuelPrice', details: 'Petrol price updated from PKR 270.00 to PKR 272.50' },
      { action: 'CREATE', entity: 'Fueling', details: 'Fueling transaction #001 created - 35L Petrol' },
      { action: 'UPDATE', entity: 'Tank', details: 'Tank A level updated - current: 8,500L' },
      { action: 'CREATE', entity: 'FuelDelivery', details: 'Fuel delivery scheduled from PSO - 10,000L Petrol' },
      { action: 'APPROVE', entity: 'Reconciliation', details: 'Tank A reconciliation approved by Fatima Noor' },
      { action: 'UPDATE', entity: 'Employee', details: 'Employee Bilal Hussain marked as present' },
      { action: 'CREATE', entity: 'FleetAccount', details: 'New fleet account created - Pakistan Post Fleet' },
      { action: 'UPDATE', entity: 'Dispenser', details: 'Pump 5 status changed to maintenance' },
      { action: 'LOGIN', entity: 'User', details: 'Admin Fatima Noor logged in from 192.168.1.11' },
      { action: 'CREATE', entity: 'CarWashSession', details: 'Deluxe car wash session started for plate LEA-4521' },
      { action: 'UPDATE', entity: 'SupplierInvoice', details: 'Invoice INV-CASTROL-2025-001 marked as paid' },
      { action: 'CREATE', entity: 'RetailTransaction', details: 'Retail sale of PKR 1,200 completed at POS-01' },
      { action: 'UPDATE', entity: 'PriceBoard', details: 'Main Price Board updated with new fuel prices' },
      { action: 'CREATE', entity: 'LeaveRequest', details: 'Tariq Mehmood requested annual leave for 3 days' },
      { action: 'UPDATE', entity: 'MeterRecord', details: 'Meter record updated for Pump 1 Nozzle 1' },
      { action: 'RESOLVE', entity: 'AIAlert', details: 'Fuel loss alert for Tank B acknowledged by Ahmed Khan' },
      { action: 'CREATE', entity: 'PayrollRecord', details: 'Payroll processed for Ahmed Khan - PKR 80,500' },
      { action: 'UPDATE', entity: 'Promotion', details: 'Weekend Fuel Discount promotion activated' },
      { action: 'CREATE', entity: 'PurchaseOrder', details: 'PO-2025-001 created for Metro Wholesale' },
    ]

    for (let i = 0; i < auditActions.length; i++) {
      const a = auditActions[i]
      await db.auditLog.create({
        data: {
          userId: i < 10 ? users[0].id : users[1].id,
          tenantId: tenant.id,
          action: a.action,
          entity: a.entity,
          entityId: `seed-${i + 1}`,
          details: a.details,
          ipAddress: `192.168.1.${10 + (i % 5)}`,
          userAgent: 'Mozilla/5.0 FuelFlow-OS/1.0',
        }
      })
    }

    // =====================================================
    // 38. EV CHARGERS + CNG DISPENSERS
    // =====================================================
    await db.eVCharger.createMany({
      data: [
        { stationId: mainStation.id, name: 'EV Charger 1', code: 'EV-01', connectorType: 'type2', maxPowerKw: 22, status: 'available', isActive: true },
        { stationId: mainStation.id, name: 'EV Charger 2', code: 'EV-02', connectorType: 'ccs', maxPowerKw: 50, status: 'charging', currentSession: 'active', isActive: true },
        { stationId: mainStation.id, name: 'EV Charger 3', code: 'EV-03', connectorType: 'chademo', maxPowerKw: 50, status: 'available', isActive: true },
      ]
    })

    // Charging sessions
    const evChargers = await db.eVCharger.findMany({ where: { stationId: mainStation.id } })
    if (evChargers.length >= 2) {
      await db.chargingSession.create({
        data: {
          chargerId: evChargers[1].id,
          stationId: mainStation.id,
          vehiclePlate: 'ISB-EV-001',
          energyKwh: 15.5,
          durationMinutes: 45,
          pricePerKwh: 35,
          totalAmount: 542.5,
          paymentMethod: 'card',
          status: 'active',
          startedAt: new Date(Date.now() - 2700000),
        }
      })
    }

    await db.cNGDispenser.createMany({
      data: [
        { stationId: mainStation.id, name: 'CNG Dispenser 1', code: 'CNG-01', pressure: 220, status: 'idle', isActive: true },
        { stationId: mainStation.id, name: 'CNG Dispenser 2', code: 'CNG-02', pressure: 215, status: 'dispensing', isActive: true },
      ]
    })

    // =====================================================
    // 39. RFID READERS + ANPR CAMERAS
    // =====================================================
    await db.rFIDReader.createMany({
      data: [
        { stationId: mainStation.id, name: 'RFID Lane 1', code: 'RFID-01', readerType: 'vehicle', ipAddress: '192.168.1.200', port: 5000, status: 'online', isActive: true },
        { stationId: mainStation.id, name: 'RFID Lane 2', code: 'RFID-02', readerType: 'driver', ipAddress: '192.168.1.201', port: 5001, status: 'online', isActive: true },
      ]
    })

    await db.aNPRCamera.createMany({
      data: [
        { stationId: mainStation.id, name: 'Entry ANPR', code: 'ANPR-01', location: 'Entry Gate', ipAddress: '192.168.1.210', port: 6000, status: 'online', isActive: true },
        { stationId: mainStation.id, name: 'Exit ANPR', code: 'ANPR-02', location: 'Exit Gate', ipAddress: '192.168.1.211', port: 6001, status: 'online', isActive: true },
      ]
    })

    // =====================================================
    // 40. FINANCIAL TRANSACTIONS (income + expenses)
    // =====================================================
    const today = new Date()
    for (let i = 0; i < 15; i++) {
      const isIncome = Math.random() > 0.3
      await db.transaction.create({
        data: {
          stationId: mainStation.id,
          tenantId: tenant.id,
          type: isIncome ? 'income' : 'expense',
          category: isIncome ? 'fuel_sale' : ['utilities', 'maintenance', 'salary', 'supplies'][Math.floor(Math.random() * 4)],
          amount: isIncome ? 50000 + Math.floor(Math.random() * 200000) : 5000 + Math.floor(Math.random() * 30000),
          paymentMethod: isIncome ? 'cash' : 'bank_transfer',
          status: 'completed',
          date: new Date(today.getTime() - Math.floor(Math.random() * 7) * 86400000),
          description: isIncome ? 'Daily fuel sales collection' : 'Operational expense payment',
          referenceNumber: `TXN-${String(i + 1).padStart(5, '0')}`,
        }
      })
    }

    // Additional expenses
    const expenseCategories = ['utilities', 'maintenance', 'supplies', 'insurance']
    for (let i = 0; i < 5; i++) {
      await db.expense.create({
        data: {
          stationId: mainStation.id,
          category: expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
          amount: 5000 + Math.floor(Math.random() * 50000),
          description: `${expenseCategories[Math.floor(Math.random() * expenseCategories.length)]} expense - March 2025`,
          vendor: ['WAPDA', 'SNGPL', 'TechServe', 'State Life', 'Local Supplier'][i],
          receiptNumber: `RCT-${String(i + 1).padStart(4, '0')}`,
          date: new Date(today.getTime() - Math.floor(Math.random() * 7) * 86400000),
          approvedBy: users[1].id,
          status: 'approved',
        }
      })
    }

    // =====================================================
    // 41. MAINTENANCE RECORDS
    // =====================================================
    await db.maintenanceRecord.createMany({
      data: [
        { stationId: mainStation.id, equipmentType: 'dispenser', equipmentId: dispensers[4].id, nozzleId: allNozzles.find(n => n.dispenserId === dispensers[4].id)?.id || null, type: 'preventive', description: 'Quarterly pump calibration and inspection', technician: 'Kamran Siddiqui', cost: 15000, status: 'scheduled', scheduledDate: new Date(Date.now() + 2 * 86400000) },
        { stationId: mainStation.id, equipmentType: 'tank', equipmentId: tanks[2].id, type: 'corrective', description: 'Overfill alarm sensor replacement for Tank C', technician: 'External - TechServe', cost: 25000, status: 'in_progress', scheduledDate: new Date() },
      ]
    })

    // =====================================================
    // 42. DEVICE INTEGRATION - FORECOURT CONTROLLERS (2)
    // =====================================================
    const ptsController = await db.forecourtController.create({
      data: {
        stationId: mainStation.id,
        name: 'PTS-FC-01',
        code: 'PTS-01',
        controllerType: 'pts',
        manufacturer: 'Petroinnovations',
        model: 'PTS-2000',
        serialNumber: 'PTS-SN-2024-001',
        firmwareVersion: '4.2.1',
        communicationType: 'tcpip',
        ipAddress: '192.168.1.100',
        port: 5000,
        protocol: 'ifsf',
        pollingInterval: 1000,
        timeout: 5000,
        maxDispensers: 32,
        connectedDispensers: 8,
        status: 'online',
        lastHeartbeat: new Date(),
        lastCommunication: new Date(),
        isActive: true,
      }
    })

    const fusionController = await db.forecourtController.create({
      data: {
        stationId: mainStation.id,
        name: 'FUSION-FC-02',
        code: 'FUS-02',
        controllerType: 'fusion',
        manufacturer: 'Gilbarco Veeder-Root',
        model: 'Fusion 3.0',
        serialNumber: 'GVR-FSN-2024-002',
        firmwareVersion: '3.5.0',
        communicationType: 'tcpip',
        ipAddress: '192.168.1.101',
        port: 5010,
        protocol: 'gilbarco-g-site',
        pollingInterval: 2000,
        timeout: 5000,
        maxDispensers: 16,
        connectedDispensers: 4,
        status: 'online',
        lastHeartbeat: new Date(),
        lastCommunication: new Date(),
        isActive: true,
      }
    })

    // =====================================================
    // 43. DEVICE INTEGRATION - PAYMENT TERMINALS (3)
    // =====================================================
    const posTerminal = await db.paymentTerminal.create({
      data: {
        stationId: mainStation.id,
        name: 'POS-T1',
        code: 'POS-T1',
        terminalType: 'pos',
        manufacturer: 'Ingenico',
        model: 'iCT250',
        serialNumber: 'ING-250-001',
        communicationType: 'tcpip',
        ipAddress: '192.168.1.110',
        port: 8000,
        protocol: 'iso8583',
        merchantId: 'MERCH-001-PK',
        terminalId: 'TERM-001-PK',
        supportedCards: '["visa","mastercard","unionpay"]',
        supportedMethods: '["emv","contactless","nfc"]',
        status: 'online',
        transactionCount: 156,
        lastTransaction: new Date(Date.now() - 3600000),
        isActive: true,
      }
    })

    const eftposTerminal = await db.paymentTerminal.create({
      data: {
        stationId: mainStation.id,
        name: 'EFTPOS-T2',
        code: 'EFT-T2',
        terminalType: 'eftpos',
        manufacturer: 'Verifone',
        model: 'Vx520',
        serialNumber: 'VF-520-002',
        communicationType: 'tcpip',
        ipAddress: '192.168.1.111',
        port: 8001,
        protocol: 'nac',
        merchantId: 'MERCH-001-PK',
        terminalId: 'TERM-002-PK',
        supportedCards: '["visa","mastercard"]',
        supportedMethods: '["emv","contactless"]',
        status: 'online',
        transactionCount: 89,
        lastTransaction: new Date(Date.now() - 1800000),
        isActive: true,
      }
    })

    const papTerminal = await db.paymentTerminal.create({
      data: {
        stationId: mainStation.id,
        name: 'PAP-T3',
        code: 'PAP-T3',
        terminalType: 'pay_at_pump',
        manufacturer: 'PAX',
        model: 'S920',
        serialNumber: 'PAX-S920-003',
        communicationType: 'tcpip',
        ipAddress: '192.168.1.112',
        port: 8002,
        protocol: 'ompi',
        merchantId: 'MERCH-001-PK',
        terminalId: 'TERM-003-PK',
        supportedCards: '["visa","mastercard","unionpay"]',
        supportedMethods: '["emv","contactless","nfc","qr"]',
        status: 'busy',
        transactionCount: 234,
        lastTransaction: new Date(Date.now() - 300000),
        isActive: true,
      }
    })

    // =====================================================
    // 44. DEVICE INTEGRATION - GENERATOR (1)
    // =====================================================
    const generator = await db.generator.create({
      data: {
        stationId: mainStation.id,
        name: 'GEN-MAIN-01',
        code: 'GEN-01',
        manufacturer: 'Cummins',
        model: 'C330 D5',
        serialNumber: 'CUM-330-2024',
        fuelType: 'diesel',
        capacityKva: 330,
        currentLoadKva: 0,
        fuelLevel: 85,
        runHours: 1250.5,
        voltage: 220,
        frequency: 50,
        oilPressure: 55,
        coolantTemp: 72,
        communicationType: 'tcpip',
        ipAddress: '192.168.1.120',
        port: 502,
        protocol: 'modbus',
        autoStart: true,
        autoTransfer: true,
        status: 'standby',
        lastStartedAt: new Date(Date.now() - 2 * 86400000),
        nextServiceDate: new Date(Date.now() + 30 * 86400000),
        isActive: true,
      }
    })

    // =====================================================
    // 45. DEVICE INTEGRATION - SURVEILLANCE CAMERAS (5)
    // =====================================================
    const cameraForecourt = await db.surveillanceCamera.create({
      data: {
        stationId: mainStation.id,
        name: 'CAM-FORE-01',
        code: 'CAM-01',
        cameraType: 'dome',
        manufacturer: 'Hikvision',
        model: 'DS-2DE4425IW',
        serialNumber: 'HKV-DS-001',
        resolution: '4k',
        location: 'forecourt',
        ipAddress: '192.168.1.130',
        port: 554,
        rtspUrl: 'rtsp://192.168.1.130:554/stream1',
        httpUrl: 'http://192.168.1.130:80',
        onvifSupported: true,
        ptzEnabled: true,
        nightVision: true,
        recordingEnabled: true,
        analyticsEnabled: true,
        analyticsType: 'motion',
        status: 'recording',
        lastRecordingAt: new Date(),
        isActive: true,
      }
    })

    const cameraEntrance = await db.surveillanceCamera.create({
      data: {
        stationId: mainStation.id,
        name: 'CAM-ENTRY-02',
        code: 'CAM-02',
        cameraType: 'bullet',
        manufacturer: 'Dahua',
        model: 'IPC-HFW5442T',
        serialNumber: 'DH-IPC-002',
        resolution: '5mp',
        location: 'entrance',
        ipAddress: '192.168.1.131',
        onvifSupported: true,
        nightVision: true,
        recordingEnabled: true,
        status: 'recording',
        isActive: true,
      }
    })

    const cameraExit = await db.surveillanceCamera.create({
      data: {
        stationId: mainStation.id,
        name: 'CAM-EXIT-03',
        code: 'CAM-03',
        cameraType: 'ptz',
        manufacturer: 'Axis',
        model: 'Q6135-LE',
        serialNumber: 'AX-Q61-003',
        resolution: '1080p',
        location: 'exit',
        ipAddress: '192.168.1.132',
        ptzEnabled: true,
        onvifSupported: true,
        nightVision: true,
        analyticsEnabled: true,
        analyticsType: 'plate',
        status: 'recording',
        isActive: true,
      }
    })

    const cameraStore = await db.surveillanceCamera.create({
      data: {
        stationId: mainStation.id,
        name: 'CAM-STORE-04',
        code: 'CAM-04',
        cameraType: 'dome',
        manufacturer: 'Hikvision',
        model: 'DS-2CD2143G2',
        serialNumber: 'HKV-DS-004',
        resolution: '4k',
        location: 'store',
        ipAddress: '192.168.1.133',
        nightVision: true,
        recordingEnabled: true,
        status: 'recording',
        isActive: true,
      }
    })

    const cameraTankFarm = await db.surveillanceCamera.create({
      data: {
        stationId: mainStation.id,
        name: 'CAM-TANK-05',
        code: 'CAM-05',
        cameraType: 'thermal',
        manufacturer: 'Axis',
        model: 'Q1942-E',
        serialNumber: 'AX-Q19-005',
        resolution: '1080p',
        location: 'tank_farm',
        ipAddress: '192.168.1.134',
        nightVision: true,
        analyticsEnabled: true,
        analyticsType: 'intrusion',
        status: 'recording',
        isActive: true,
      }
    })

    // =====================================================
    // 46. DEVICE INTEGRATION - FIRE ALARM SYSTEM (1)
    // =====================================================
    const fireAlarm = await db.fireAlarmSystem.create({
      data: {
        stationId: mainStation.id,
        name: 'FAS-MAIN-01',
        code: 'FAS-01',
        systemType: 'addressable',
        manufacturer: 'Honeywell',
        model: 'XLS100',
        serialNumber: 'HW-XLS-001',
        firmwareVersion: '2.1.0',
        zoneCount: 12,
        detectorCount: 48,
        communicationType: 'tcpip',
        ipAddress: '192.168.1.140',
        port: 502,
        protocol: 'modbus',
        suppressionType: 'foam',
        autoSuppress: false,
        linkedToDispensers: true,
        linkedToTanks: true,
        status: 'normal',
        lastTestDate: new Date(Date.now() - 30 * 86400000),
        nextTestDate: new Date(Date.now() + 60 * 86400000),
        isActive: true,
      }
    })

    // =====================================================
    // 47. DEVICE INTEGRATION - UTILITY METERS (3)
    // =====================================================
    const electricityMeter = await db.utilityMeter.create({
      data: {
        stationId: mainStation.id,
        name: 'ELEC-MTR-01',
        code: 'ELC-01',
        meterType: 'electricity',
        manufacturer: 'ABB',
        model: 'ABB B23',
        serialNumber: 'ABB-B23-001',
        meterNumber: 'IESCO-EL-001234',
        communicationType: 'tcpip',
        ipAddress: '192.168.1.150',
        port: 502,
        protocol: 'modbus',
        currentReading: 45678.5,
        previousReading: 45000,
        consumption: 678.5,
        unit: 'kwh',
        peakDemand: 85.2,
        powerFactor: 0.92,
        tariffRate: 25.5,
        status: 'online',
        lastReading: new Date(Date.now() - 900000),
        isActive: true,
      }
    })

    const waterMeter = await db.utilityMeter.create({
      data: {
        stationId: mainStation.id,
        name: 'WATER-MTR-01',
        code: 'WTR-01',
        meterType: 'water',
        manufacturer: 'Siemens',
        model: 'SITRANS F M',
        serialNumber: 'SIE-FM-001',
        meterNumber: 'CDA-WTR-005678',
        communicationType: 'tcpip',
        ipAddress: '192.168.1.151',
        protocol: 'modbus',
        currentReading: 12345.0,
        previousReading: 12200.0,
        consumption: 145.0,
        unit: 'cubic_meters',
        tariffRate: 45.0,
        status: 'online',
        lastReading: new Date(Date.now() - 900000),
        isActive: true,
      }
    })

    const gasMeter = await db.utilityMeter.create({
      data: {
        stationId: mainStation.id,
        name: 'GAS-MTR-01',
        code: 'GAS-01',
        meterType: 'gas',
        manufacturer: 'Landis+Gyr',
        model: 'G470',
        serialNumber: 'LG-G470-001',
        meterNumber: 'SNGPL-GAS-009012',
        communicationType: 'tcpip',
        ipAddress: '192.168.1.152',
        protocol: 'dlms',
        currentReading: 8900.5,
        previousReading: 8850.0,
        consumption: 50.5,
        unit: 'cubic_meters',
        tariffRate: 120.0,
        status: 'online',
        lastReading: new Date(Date.now() - 1800000),
        isActive: true,
      }
    })

    // =====================================================
    // 48. DEVICE INTEGRATION - WEATHER STATION (1)
    // =====================================================
    const weatherStation = await db.weatherStation.create({
      data: {
        stationId: mainStation.id,
        name: 'WX-STN-01',
        code: 'WX-01',
        manufacturer: 'Davis',
        model: 'Vantage Pro2',
        serialNumber: 'DVP-VP2-001',
        communicationType: 'tcpip',
        ipAddress: '192.168.1.160',
        port: 80,
        protocol: 'http',
        temperature: 32.5,
        humidity: 45,
        windSpeed: 8.5,
        windDirection: 'SW',
        pressure: 1013.2,
        rainfall: 0,
        uvIndex: 7,
        visibility: 10.0,
        dewPoint: 18.5,
        status: 'online',
        lastReading: new Date(Date.now() - 300000),
        isActive: true,
      }
    })

    // =====================================================
    // 49. DEVICE INTEGRATION - TANKER TRACKERS (2)
    // =====================================================
    const tanker1 = await db.tankerTracker.create({
      data: {
        stationId: mainStation.id,
        name: 'TANKER-TK-01',
        code: 'TK-01',
        trackerType: 'gps_gsm',
        manufacturer: 'Teltonika',
        model: 'FM5300',
        serialNumber: 'TLT-FM5-001',
        simCardNumber: '+923001234567',
        imei: '356938035642801',
        communicationType: 'gsm',
        ipAddress: '0.0.0.0',
        port: 5027,
        protocol: 'h02',
        latitude: 33.6844,
        longitude: 73.0479,
        speed: 0,
        heading: 0,
        altitude: 540,
        odometer: 45000,
        fuelLevel: 75,
        ignitionStatus: false,
        doorStatus: false,
        geofenceEnabled: true,
        geofenceRadius: 500,
        status: 'parked',
        lastLocationAt: new Date(Date.now() - 600000),
        isActive: true,
      }
    })

    const tanker2 = await db.tankerTracker.create({
      data: {
        stationId: mainStation.id,
        name: 'TANKER-TK-02',
        code: 'TK-02',
        trackerType: 'gps_gsm',
        manufacturer: 'Queclink',
        model: 'GV300W',
        serialNumber: 'QL-GV3-002',
        simCardNumber: '+923009876543',
        imei: '867584020053402',
        communicationType: 'gsm',
        protocol: 'gt06',
        latitude: 33.7294,
        longitude: 73.0931,
        speed: 45,
        heading: 90,
        altitude: 520,
        odometer: 32000,
        fuelLevel: 60,
        ignitionStatus: true,
        doorStatus: true,
        geofenceEnabled: true,
        geofenceRadius: 500,
        status: 'moving',
        lastLocationAt: new Date(Date.now() - 120000),
        isActive: true,
      }
    })

    // =====================================================
    // 50. DEVICE INTEGRATION - CAR WASH SYSTEM (1)
    // =====================================================
    const carWashSystem = await db.carWashSystem.create({
      data: {
        stationId: mainStation.id,
        name: 'CW-SYS-01',
        code: 'CW-01',
        systemType: 'automatic',
        manufacturer: 'Ryko',
        model: 'CarWash Pro',
        serialNumber: 'RYK-CWP-001',
        firmwareVersion: '3.0.1',
        communicationType: 'tcpip',
        ipAddress: '192.168.1.170',
        port: 502,
        protocol: 'modbus',
        bayCount: 1,
        currentBay: 1,
        waterPressure: 120,
        waterTemp: 38,
        chemicalLevel: 72,
        waxLevel: 55,
        dailyCount: 12,
        monthlyCount: 345,
        revenueToday: 3600,
        status: 'idle',
        lastWashAt: new Date(Date.now() - 1800000),
        nextServiceDate: new Date(Date.now() + 15 * 86400000),
        isActive: true,
      }
    })

    // =====================================================
    // 51. DEVICE INTEGRATION - AIR COMPRESSOR (1)
    // =====================================================
    const airCompressor = await db.airCompressor.create({
      data: {
        stationId: mainStation.id,
        name: 'AIR-CMP-01',
        code: 'AIR-01',
        manufacturer: 'Atlas Copco',
        model: 'GA 15+',
        serialNumber: 'AC-GA15-001',
        communicationType: 'tcpip',
        ipAddress: '192.168.1.180',
        port: 502,
        protocol: 'modbus',
        pressure: 145,
        maxPressure: 150,
        tankCapacity: 200,
        motorStatus: 'on',
        runHours: 850,
        coinOperated: true,
        pricePerUse: 20,
        dailyUsage: 23,
        revenueToday: 460,
        status: 'running',
        lastUsedAt: new Date(Date.now() - 300000),
        isActive: true,
      }
    })

    // =====================================================
    // 52. DEVICE INTEGRATION - VACUUM STATIONS (2)
    // =====================================================
    const vacuum1 = await db.vacuumStation.create({
      data: {
        stationId: mainStation.id,
        name: 'VAC-01',
        code: 'VAC-01',
        manufacturer: 'Jim Coleman',
        model: 'Vac Pro',
        serialNumber: 'JC-VP-001',
        communicationType: 'tcpip',
        ipAddress: '192.168.1.190',
        protocol: 'modbus',
        motorStatus: 'off',
        suctionPower: 95,
        coinOperated: true,
        pricePerUse: 30,
        dailyUsage: 15,
        revenueToday: 450,
        runHours: 320,
        status: 'idle',
        lastUsedAt: new Date(Date.now() - 1200000),
        isActive: true,
      }
    })

    const vacuum2 = await db.vacuumStation.create({
      data: {
        stationId: mainStation.id,
        name: 'VAC-02',
        code: 'VAC-02',
        manufacturer: 'Jim Coleman',
        model: 'Vac Pro',
        serialNumber: 'JC-VP-002',
        communicationType: 'tcpip',
        ipAddress: '192.168.1.191',
        protocol: 'modbus',
        motorStatus: 'off',
        suctionPower: 92,
        coinOperated: true,
        pricePerUse: 30,
        dailyUsage: 11,
        revenueToday: 330,
        runHours: 280,
        status: 'idle',
        lastUsedAt: new Date(Date.now() - 2700000),
        isActive: true,
      }
    })

    // =====================================================
    // 53. DEVICE CONFIG ENTRIES
    // NOTE: Polymorphic FK constraints — PostgreSQL handles FK constraints differently
    // =====================================================

    await db.deviceConfig.createMany({
      data: [
        { deviceType: 'forecourt_controller', deviceId: ptsController.id, configKey: 'polling_mode', configValue: 'continuous', dataType: 'string', description: 'Dispenser polling mode' },
        { deviceType: 'forecourt_controller', deviceId: ptsController.id, configKey: 'auto_authorize', configValue: 'true', dataType: 'boolean', description: 'Auto-authorize fueling' },
        { deviceType: 'forecourt_controller', deviceId: ptsController.id, configKey: 'max_flow_rate', configValue: '50', dataType: 'number', description: 'Max flow rate in L/min' },
        { deviceType: 'payment_terminal', deviceId: posTerminal.id, configKey: 'settlement_time', configValue: '23:00', dataType: 'string', description: 'Daily settlement time' },
        { deviceType: 'payment_terminal', deviceId: posTerminal.id, configKey: 'tip_enabled', configValue: 'false', dataType: 'boolean', description: 'Enable tip on POS' },
      ]
    })

    // =====================================================
    // 54. DEVICE EVENT LOG ENTRIES (12)
    // =====================================================
    await db.deviceEventLog.createMany({
      data: [
        { stationId: mainStation.id, deviceType: 'forecourt_controller', deviceId: ptsController.id, eventType: 'heartbeat', severity: 'info', message: 'Heartbeat received from PTS Controller', dataJson: JSON.stringify({ responseTime: '45ms' }), createdAt: new Date(Date.now() - 60000) },
        { stationId: mainStation.id, deviceType: 'forecourt_controller', deviceId: ptsController.id, eventType: 'status_change', severity: 'info', message: 'Status changed to online', dataJson: JSON.stringify({ previousStatus: 'offline' }), createdAt: new Date(Date.now() - 3600000) },
        { stationId: mainStation.id, deviceType: 'forecourt_controller', deviceId: fusionController.id, eventType: 'heartbeat', severity: 'info', message: 'Heartbeat received from Fusion Controller', dataJson: JSON.stringify({ responseTime: '62ms' }), createdAt: new Date(Date.now() - 120000) },
        { stationId: mainStation.id, deviceType: 'payment_terminal', deviceId: posTerminal.id, eventType: 'command', severity: 'info', message: 'Command acknowledged - settlement initiated', dataJson: JSON.stringify({ command: 'settle', resultCode: '00' }), createdAt: new Date(Date.now() - 1800000) },
        { stationId: mainStation.id, deviceType: 'payment_terminal', deviceId: papTerminal.id, eventType: 'status_change', severity: 'info', message: 'Status changed to busy', dataJson: JSON.stringify({ previousStatus: 'online' }), createdAt: new Date(Date.now() - 300000) },
        { stationId: mainStation.id, deviceType: 'utility_meter', deviceId: electricityMeter.id, eventType: 'reading', severity: 'info', message: 'Tank reading updated - 45678.5 kWh', dataJson: JSON.stringify({ reading: 45678.5, unit: 'kwh' }), createdAt: new Date(Date.now() - 900000) },
        { stationId: mainStation.id, deviceType: 'generator', deviceId: generator.id, eventType: 'status_change', severity: 'info', message: 'Generator on standby - utility power stable', dataJson: JSON.stringify({ utilityVoltage: 220, utilityFreq: 50 }), createdAt: new Date(Date.now() - 7200000) },
        { stationId: mainStation.id, deviceType: 'surveillance_camera', deviceId: cameraForecourt.id, eventType: 'alarm', severity: 'warning', message: 'Motion detected on forecourt camera', dataJson: JSON.stringify({ zone: 'pump_area_3', confidence: 0.95 }), createdAt: new Date(Date.now() - 420000) },
        { stationId: mainStation.id, deviceType: 'surveillance_camera', deviceId: cameraExit.id, eventType: 'reading', severity: 'info', message: 'License plate captured - LEA-4521', dataJson: JSON.stringify({ plate: 'LEA-4521', confidence: 0.98 }), createdAt: new Date(Date.now() - 600000) },
        { stationId: mainStation.id, deviceType: 'fire_alarm', deviceId: fireAlarm.id, eventType: 'heartbeat', severity: 'info', message: 'Fire alarm system health check - all zones normal', dataJson: JSON.stringify({ zones: 12, activeDetectors: 48 }), createdAt: new Date(Date.now() - 5400000) },
        { stationId: mainStation.id, deviceType: 'weather_station', deviceId: weatherStation.id, eventType: 'reading', severity: 'info', message: 'Weather data updated - 32.5C, SW wind 8.5km/h', dataJson: JSON.stringify({ temp: 32.5, wind: 8.5, dir: 'SW' }), createdAt: new Date(Date.now() - 300000) },
        { stationId: mainStation.id, deviceType: 'tanker_tracker', deviceId: tanker2.id, eventType: 'status_change', severity: 'info', message: 'Tanker TK-02 entered geofence zone', dataJson: JSON.stringify({ geofence: 'station_perimeter', distance: 450 }), createdAt: new Date(Date.now() - 180000) },
      ]
    })

    // =====================================================
    // 55. DEVICE COMMAND QUEUE ENTRIES (4)
    // =====================================================
    await db.deviceCommandQueue.createMany({
      data: [
        { stationId: mainStation.id, deviceType: 'forecourt_controller', deviceId: ptsController.id, command: 'authorize_dispenser', parameters: JSON.stringify({ dispenserId: dispensers[0].id, nozzleNumber: 1, volume: 50, fuelType: 'petrol' }), priority: 'high', status: 'queued', createdBy: users[0].id },
        { stationId: mainStation.id, deviceType: 'forecourt_controller', deviceId: ptsController.id, command: 'update_price', parameters: JSON.stringify({ fuelType: 'petrol', newPrice: 272.50 }), priority: 'normal', status: 'sent', sentAt: new Date(Date.now() - 30000), createdBy: users[1].id },
        { stationId: mainStation.id, deviceType: 'payment_terminal', deviceId: posTerminal.id, command: 'reboot_terminal', parameters: JSON.stringify({ reason: 'Scheduled maintenance reboot' }), priority: 'low', status: 'queued', createdBy: users[0].id },
        { stationId: mainStation.id, deviceType: 'surveillance_camera', deviceId: cameraForecourt.id, command: 'ptz_move', parameters: JSON.stringify({ pan: 45, tilt: 30, zoom: 2 }), priority: 'normal', status: 'acknowledged', sentAt: new Date(Date.now() - 60000), acknowledgedAt: new Date(Date.now() - 45000), createdBy: users[1].id },
      ]
    })

    // PostgreSQL: FK constraints re-enabled automatically after transaction

    // =====================================================
    // 56. OMS CLIENT
    // =====================================================
    const omsClient = await db.oMSClient.create({
      data: {
        tenantId: tenant.id,
        omsClientId: 'APEX-CLI-001',
        companyName: 'ApexFuel Pakistan',
        subscriptionPlan: 'enterprise',
        licenseKey: 'APEX-LIC-2024-ENT-001',
        licenseStatus: 'active',
        licensedModules: '["forecourt","tanks","sales","fleet","pricing","retail","employees","finance","multisite","ai_suite","ev_cng","devices","security","comms","reports"]',
        maxStations: 50,
        maxUsers: 100,
        maxDevices: 200,
        currentStations: 4,
        currentUsers: 12,
        currentDevices: 35,
        billingCycle: 'monthly',
        basePrice: 25000,
        perStationPrice: 5000,
        perUserPrice: 500,
        totalMonthly: 81000,
        lastSyncAt: new Date(),
        syncStatus: 'synced',
        isActive: true,
      }
    })

    // =====================================================
    // 57. OMS PACKAGES (3)
    // =====================================================
    await db.oMSPackage.createMany({
      data: [
        { omsClientId: omsClient.id, packageName: 'Starter', description: 'Basic fuel station management for single station operators', modules: '["forecourt","tanks","sales","pricing"]', stationLimit: 1, userLimit: 5, deviceLimit: 10, price: 15000, currency: 'PKR', billingCycle: 'monthly', isCustom: false, isActive: true },
        { omsClientId: omsClient.id, packageName: 'Professional', description: 'Complete station management with all modules for growing businesses', modules: '["forecourt","tanks","sales","fleet","pricing","retail","employees","finance","multisite","ai_suite","ev_cng","devices","security","comms","reports"]', stationLimit: 5, userLimit: 25, deviceLimit: 50, price: 45000, currency: 'PKR', billingCycle: 'monthly', isCustom: false, isActive: true },
        { omsClientId: omsClient.id, packageName: 'Enterprise', description: 'Full-featured OMS with white-label support for large operators', modules: '["forecourt","tanks","sales","fleet","pricing","retail","employees","finance","multisite","ai_suite","ev_cng","devices","security","comms","reports","white_label","custom_integration"]', stationLimit: 50, userLimit: 100, deviceLimit: 200, price: 81000, currency: 'PKR', billingCycle: 'monthly', isCustom: false, isActive: true },
      ]
    })

    // =====================================================
    // 58. OMS INVOICES (3)
    // =====================================================
    await db.oMSInvoice.createMany({
      data: [
        { omsClientId: omsClient.id, invoiceNumber: 'OMS-INV-2025-001', invoiceDate: new Date('2025-02-01'), dueDate: new Date('2025-02-28'), subtotal: 81000, taxAmount: 14580, totalAmount: 95580, status: 'paid', paidAmount: 95580, paidDate: new Date('2025-02-15'), items: '[{"description":"Enterprise Monthly Subscription - 4 Stations","quantity":1,"unitPrice":81000,"amount":81000}]', notes: 'February 2025 subscription' },
        { omsClientId: omsClient.id, invoiceNumber: 'OMS-INV-2025-002', invoiceDate: new Date('2025-03-01'), dueDate: new Date('2025-03-31'), subtotal: 81000, taxAmount: 14580, totalAmount: 95580, status: 'pending', paidAmount: 0, items: '[{"description":"Enterprise Monthly Subscription - 4 Stations","quantity":1,"unitPrice":81000,"amount":81000}]', notes: 'March 2025 subscription' },
        { omsClientId: omsClient.id, invoiceNumber: 'OMS-INV-2025-003', invoiceDate: new Date('2025-01-01'), dueDate: new Date('2025-01-15'), subtotal: 81000, taxAmount: 14580, totalAmount: 95580, status: 'overdue', paidAmount: 0, items: '[{"description":"Enterprise Monthly Subscription - 4 Stations","quantity":1,"unitPrice":81000,"amount":81000}]', notes: 'January 2025 subscription - overdue' },
      ]
    })

    // =====================================================
    // 59. OMS PAYMENTS (2)
    // =====================================================
    await db.oMSPayment.createMany({
      data: [
        { omsClientId: omsClient.id, invoiceId: undefined, amount: 95580, paymentMethod: 'bank_transfer', referenceNumber: 'BNK-TXN-2025-001', transactionId: 'HBL-20250215-001', status: 'completed', paymentDate: new Date('2025-02-15'), notes: 'February subscription payment via HBL' },
        { omsClientId: omsClient.id, invoiceId: undefined, amount: 95580, paymentMethod: 'online', referenceNumber: 'ONLINE-TXN-2025-002', transactionId: 'JAZZCASH-20250301-001', status: 'completed', paymentDate: new Date('2025-03-01'), notes: 'March subscription - JazzCash online payment' },
      ]
    })

    // =====================================================
    // 60. OMS SYNC LOGS (5)
    // =====================================================
    await db.oMSSyncLog.createMany({
      data: [
        { omsClientId: omsClient.id, syncType: 'client_registration', direction: 'outbound', status: 'success', payload: '{"action":"register","client":"APEX-CLI-001"}', response: '{"status":"ok","clientId":"APEX-CLI-001"}', errorMessage: null, syncedAt: new Date(Date.now() - 5 * 86400000) },
        { omsClientId: omsClient.id, syncType: 'subscription', direction: 'outbound', status: 'success', payload: '{"plan":"enterprise","stations":4}', response: '{"status":"ok","subscriptionUpdated":true}', errorMessage: null, syncedAt: new Date(Date.now() - 4 * 86400000) },
        { omsClientId: omsClient.id, syncType: 'license', direction: 'inbound', status: 'success', payload: '{"licenseKey":"APEX-LIC-2024-ENT-001"}', response: '{"status":"valid","modules":15}', errorMessage: null, syncedAt: new Date(Date.now() - 3 * 86400000) },
        { omsClientId: omsClient.id, syncType: 'invoice', direction: 'outbound', status: 'success', payload: '{"invoiceNumber":"OMS-INV-2025-002"}', response: '{"status":"ok","invoiceCreated":true}', errorMessage: null, syncedAt: new Date(Date.now() - 2 * 86400000) },
        { omsClientId: omsClient.id, syncType: 'module_control', direction: 'inbound', status: 'error', payload: '{"module":"ai_suite","action":"enable"}', response: null, errorMessage: 'Module activation requires license upgrade - contact support', syncedAt: new Date(Date.now() - 86400000) },
      ]
    })

    // =====================================================
    // 61. OMS LICENSES (5)
    // =====================================================
    await db.oMSLicense.createMany({
      data: [
        { omsClientId: omsClient.id, licenseKey: 'APEX-FORCOURT-001', moduleKey: 'forecourt', moduleName: 'Forecourt Management', is_enabled: true, validFrom: new Date('2025-01-01'), validTo: new Date('2025-12-31'), maxUsage: 50, currentUsage: 8, status: 'active' },
        { omsClientId: omsClient.id, licenseKey: 'APEX-TANKS-001', moduleKey: 'tanks', moduleName: 'Tank & ATG Monitoring', is_enabled: true, validFrom: new Date('2025-01-01'), validTo: new Date('2025-12-31'), maxUsage: 50, currentUsage: 4, status: 'active' },
        { omsClientId: omsClient.id, licenseKey: 'APEX-SALES-001', moduleKey: 'sales', moduleName: 'Sales & Transactions', is_enabled: true, validFrom: new Date('2025-01-01'), validTo: new Date('2025-12-31'), maxUsage: null, currentUsage: 0, status: 'active' },
        { omsClientId: omsClient.id, licenseKey: 'APEX-FLEET-001', moduleKey: 'fleet', moduleName: 'Fleet Management', is_enabled: true, validFrom: new Date('2025-01-01'), validTo: new Date('2025-12-31'), maxUsage: 500, currentUsage: 60, status: 'active' },
        { omsClientId: omsClient.id, licenseKey: 'APEX-AI-001', moduleKey: 'ai_suite', moduleName: 'AI Analytics Suite', is_enabled: true, validFrom: new Date('2025-03-01'), validTo: new Date('2025-12-31'), maxUsage: null, currentUsage: 0, status: 'active' },
      ]
    })

    // =====================================================
    // 62. SECURITY SESSIONS (3)
    // =====================================================
    await db.securitySession.createMany({
      data: [
        { userId: users[0].id, tenantId: tenant.id, tokenHash: 'sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', ipAddress: '192.168.1.10', userAgent: 'Mozilla/5.0 Chrome/122.0 FuelFlow-OS/1.0', deviceInfo: 'Desktop - Windows 11 - Chrome', loginAt: new Date(Date.now() - 2 * 3600000), lastActivityAt: new Date(), logoutAt: null, status: 'active', expiresAt: new Date(Date.now() + 22 * 3600000) },
        { userId: users[1].id, tenantId: tenant.id, tokenHash: 'sha256:b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3', ipAddress: '192.168.1.11', userAgent: 'Mozilla/5.0 Safari/17.0 FuelFlow-OS/1.0', deviceInfo: 'Desktop - macOS - Safari', loginAt: new Date(Date.now() - 48 * 3600000), lastActivityAt: new Date(Date.now() - 24 * 3600000), logoutAt: new Date(Date.now() - 24 * 3600000), status: 'expired', expiresAt: new Date(Date.now() - 24 * 3600000) },
        { userId: users[2].id, tenantId: tenant.id, tokenHash: 'sha256:c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', ipAddress: '203.101.55.78', userAgent: 'Mozilla/5.0 Firefox/123.0', deviceInfo: 'Unknown - Suspicious origin', loginAt: new Date(Date.now() - 72 * 3600000), lastActivityAt: new Date(Date.now() - 72 * 3600000), logoutAt: new Date(Date.now() - 71.5 * 3600000), status: 'revoked', expiresAt: null },
      ]
    })

    // =====================================================
    // 63. RBAC PERMISSIONS (25)
    // =====================================================
    const rbacRoles = ['admin', 'manager', 'cashier', 'attendant', 'viewer']
    const rbacModules = ['forecourt', 'tanks', 'sales', 'fleet', 'finance']
    const rbacActions = ['read', 'write', 'delete', 'approve']

    const rbacData: { role: string; module: string; action: string; isAllowed: boolean }[] = []
    for (const role of rbacRoles) {
      for (const mod of rbacModules) {
        for (const action of rbacActions) {
          let isAllowed = false
          if (role === 'admin') isAllowed = true
          else if (role === 'manager') isAllowed = action !== 'delete' || mod === 'sales'
          else if (role === 'cashier') isAllowed = (mod === 'sales' || mod === 'forecourt') && (action === 'read' || action === 'write')
          else if (role === 'attendant') isAllowed = mod === 'forecourt' && action === 'read'
          else if (role === 'viewer') isAllowed = action === 'read'
          rbacData.push({ role, module: mod, action, isAllowed })
        }
      }
    }

    await db.rBACPermission.createMany({
      data: rbacData.map(p => ({
        tenantId: tenant.id,
        role: p.role,
        module: p.module,
        action: p.action,
        isAllowed: p.isAllowed,
      }))
    })

    // =====================================================
    // 64. SECURITY ALERTS (3)
    // =====================================================
    await db.securityAlert.createMany({
      data: [
        { tenantId: tenant.id, stationId: mainStation.id, alertType: 'unauthorized_access', severity: 'critical', title: 'Unauthorized Login Attempt Detected', description: 'Multiple failed login attempts from IP 203.101.55.78 targeting admin account. 5 attempts in 3 minutes.', sourceIp: '203.101.55.78', targetEntity: 'User', targetEntityId: users[0].id, isResolved: false },
        { tenantId: tenant.id, stationId: mainStation.id, alertType: 'suspicious_activity', severity: 'warning', title: 'After-Hours Access to Billing Module', description: 'User Hassan Rizvi accessed billing module outside normal operating hours at 02:30 AM.', sourceIp: '192.168.1.15', targetEntity: 'OMSBilling', targetEntityId: null, isResolved: false },
        { tenantId: tenant.id, stationId: null, alertType: 'data_breach', severity: 'info', title: 'API Rate Limit Approaching Threshold', description: 'API key APEX-API-001 has reached 80% of hourly rate limit (800/1000 requests). Normal monitoring traffic pattern.', sourceIp: null, targetEntity: 'APIKey', targetEntityId: null, isResolved: true, resolvedAt: new Date(Date.now() - 3600000), resolvedBy: users[0].id },
      ]
    })

    // =====================================================
    // 65. BACKUP RECORDS (3)
    // =====================================================
    await db.backupRecord.createMany({
      data: [
        { tenantId: tenant.id, stationId: mainStation.id, backupType: 'full', status: 'completed', fileSize: 256.4, fileKey: 'backups/2025/03/full-20250304.tar.gz', startedAt: new Date(Date.now() - 2 * 86400000), completedAt: new Date(Date.now() - 2 * 86400000 + 1800), duration: 1800, checksum: 'sha256:abc123def456', isRestorable: true, notes: 'Daily full backup completed successfully' },
        { tenantId: tenant.id, stationId: mainStation.id, backupType: 'incremental', status: 'completed', fileSize: 45.2, fileKey: 'backups/2025/03/incr-20250305.tar.gz', startedAt: new Date(Date.now() - 86400000), completedAt: new Date(Date.now() - 86400000 + 420), duration: 420, checksum: 'sha256:789ghi012jkl', isRestorable: true, notes: 'Daily incremental backup' },
        { tenantId: tenant.id, stationId: mainStation.id, backupType: 'full', status: 'failed', fileSize: null, fileKey: null, startedAt: new Date(Date.now() - 3600000), completedAt: null, duration: null, checksum: null, isRestorable: false, notes: 'Backup failed - insufficient disk space on target volume. Retry scheduled.' },
      ]
    })

    // =====================================================
    // 66. ENCRYPTION KEYS (2)
    // =====================================================
    await db.encryptionKey.createMany({
      data: [
        { tenantId: tenant.id, keyType: 'aes256', keyReference: 'APEX-AES256-2025-PRIMARY', isActive: true, rotatedAt: null, expiresAt: new Date('2025-12-31') },
        { tenantId: tenant.id, keyType: 'rsa2048', keyReference: 'APEX-RSA2048-2024-ARCHIVE', isActive: false, rotatedAt: new Date('2025-01-15'), expiresAt: null },
      ]
    })

    // =====================================================
    // 67. COMM PROTOCOLS (4)
    // =====================================================
    const commProtocols = await Promise.all([
      db.commProtocol.create({
        data: {
          stationId: mainStation.id, name: 'IFSF over TCP/IP', protocolType: 'ifsf', version: '3.2', transportType: 'tcp', hostOrPort: '192.168.1.100:5000', heartbeatInterval: 30, timeout: 5, retryCount: 3, pollInterval: 1000, isActive: true,
        }
      }),
      db.commProtocol.create({
        data: {
          stationId: mainStation.id, name: 'Modbus RTU over RS485', protocolType: 'modbus', version: 'RTU', transportType: 'rs485', hostOrPort: 'COM1', baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none', heartbeatInterval: 60, timeout: 3, retryCount: 3, pollInterval: 2000, isActive: true,
        }
      }),
      db.commProtocol.create({
        data: {
          stationId: mainStation.id, name: 'MQTT for IoT Devices', protocolType: 'mqtt', version: '5.0', transportType: 'mqtt', hostOrPort: 'mqtt.apexflow.pk:1883', heartbeatInterval: 15, timeout: 10, retryCount: 5, pollInterval: 500, configJson: '{"topicPrefix":"apexflow/isb001/","qos":1,"retain":true}', isActive: true,
        }
      }),
      db.commProtocol.create({
        data: {
          stationId: mainStation.id, name: 'ISO 8583 for Payment', protocolType: 'iso8583', version: '1987', transportType: 'tcp', hostOrPort: '192.168.1.110:8000', heartbeatInterval: 60, timeout: 30, retryCount: 2, pollInterval: 0, configJson: '{"messageType":"0800","responseType":"0810"}', isActive: true,
        }
      }),
    ])

    // =====================================================
    // 68. COMM CONNECTIONS (6)
    // =====================================================
    await db.commConnection.createMany({
      data: [
        { stationId: mainStation.id, protocolId: commProtocols[0].id, name: 'PTS Controller Link', deviceType: 'controller', deviceId: ptsController.id, connectionState: 'connected', lastConnectedAt: new Date(), lastMessageAt: new Date(), messagesSent: 15420, messagesReceived: 15380, errors: 3, latencyMs: 45, isActive: true },
        { stationId: mainStation.id, protocolId: commProtocols[0].id, name: 'Pump 1-4 IFSF Link', deviceType: 'dispenser', deviceId: dispensers[0].id, connectionState: 'connected', lastConnectedAt: new Date(), lastMessageAt: new Date(Date.now() - 500), messagesSent: 8932, messagesReceived: 8930, errors: 1, latencyMs: 32, isActive: true },
        { stationId: mainStation.id, protocolId: commProtocols[1].id, name: 'ATG Tank Farm Link', deviceType: 'tank_atg', deviceId: tanks[0].id, connectionState: 'connected', lastConnectedAt: new Date(), lastMessageAt: new Date(Date.now() - 2000), messagesSent: 4520, messagesReceived: 4520, errors: 0, latencyMs: 78, isActive: true },
        { stationId: mainStation.id, protocolId: commProtocols[2].id, name: 'IoT Sensor Bridge', deviceType: 'controller', deviceId: null, connectionState: 'connected', lastConnectedAt: new Date(), lastMessageAt: new Date(Date.now() - 1000), messagesSent: 22100, messagesReceived: 22100, errors: 5, latencyMs: 15, isActive: true },
        { stationId: mainStation.id, protocolId: commProtocols[3].id, name: 'POS Terminal Link', deviceType: 'payment_terminal', deviceId: posTerminal.id, connectionState: 'connected', lastConnectedAt: new Date(), lastMessageAt: new Date(Date.now() - 300000), messagesSent: 3120, messagesReceived: 3118, errors: 2, latencyMs: 120, isActive: true },
        { stationId: mainStation.id, protocolId: commProtocols[1].id, name: 'Generator Modbus Link', deviceType: 'controller', deviceId: generator.id, connectionState: 'disconnected', lastConnectedAt: new Date(Date.now() - 3600000), lastMessageAt: new Date(Date.now() - 3600000), messagesSent: 890, messagesReceived: 888, errors: 12, latencyMs: null, isActive: true },
      ]
    })

    // =====================================================
    // 69. COMM LOGS (10)
    // =====================================================
    const commConnections = await db.commConnection.findMany({ where: { stationId: mainStation.id } })
    await db.commLog.createMany({
      data: [
        { stationId: mainStation.id, connectionId: commConnections[0]?.id || null, protocolId: commProtocols[0].id, direction: 'outbound', messageType: 'heartbeat', rawData: '1F0023000100', parsedData: '{"type":"heartbeat","seq":15420}', deviceType: 'controller', isSuccess: true, durationMs: 45, createdAt: new Date(Date.now() - 60000) },
        { stationId: mainStation.id, connectionId: commConnections[1]?.id || null, protocolId: commProtocols[0].id, direction: 'inbound', messageType: 'response', rawData: '1F00230002AA', parsedData: '{"type":"status","pump":"P-01","state":"idle","volume":0}', deviceType: 'dispenser', isSuccess: true, durationMs: 32, createdAt: new Date(Date.now() - 55000) },
        { stationId: mainStation.id, connectionId: commConnections[1]?.id || null, protocolId: commProtocols[0].id, direction: 'outbound', messageType: 'command', rawData: '1F00460003FF', parsedData: '{"type":"authorize","pump":"P-01","nozzle":1,"volume":50}', deviceType: 'dispenser', isSuccess: true, durationMs: 28, createdAt: new Date(Date.now() - 50000) },
        { stationId: mainStation.id, connectionId: commConnections[2]?.id || null, protocolId: commProtocols[1].id, direction: 'inbound', messageType: 'event', rawData: '010300000001A8', parsedData: '{"type":"tank_reading","tank":"TANK-A","level":8500,"temp":27.2,"water":12}', deviceType: 'tank_atg', isSuccess: true, durationMs: 78, createdAt: new Date(Date.now() - 45000) },
        { stationId: mainStation.id, connectionId: commConnections[3]?.id || null, protocolId: commProtocols[2].id, direction: 'inbound', messageType: 'event', rawData: null, parsedData: '{"topic":"apexflow/isb001/sensor/temp","payload":32.5}', deviceType: 'controller', isSuccess: true, durationMs: 15, createdAt: new Date(Date.now() - 40000) },
        { stationId: mainStation.id, connectionId: commConnections[4]?.id || null, protocolId: commProtocols[3].id, direction: 'outbound', messageType: 'command', rawData: '0800200000000000000000000000', parsedData: '{"type":"financial_msg","mti":"0800","stan":"000001"}', deviceType: 'payment_terminal', isSuccess: true, durationMs: 120, createdAt: new Date(Date.now() - 300000) },
        { stationId: mainStation.id, connectionId: commConnections[4]?.id || null, protocolId: commProtocols[3].id, direction: 'inbound', messageType: 'response', rawData: '0810200000000000000000000000', parsedData: '{"type":"financial_response","mti":"0810","responseCode":"00"}', deviceType: 'payment_terminal', isSuccess: true, durationMs: 85, createdAt: new Date(Date.now() - 299000) },
        { stationId: mainStation.id, connectionId: commConnections[0]?.id || null, protocolId: commProtocols[0].id, direction: 'outbound', messageType: 'command', rawData: '1F00460005BB', parsedData: '{"type":"stop_pump","pump":"P-03"}', deviceType: 'dispenser', isSuccess: false, errorMessage: 'Timeout waiting for ACK from pump P-03', durationMs: 5002, createdAt: new Date(Date.now() - 20000) },
        { stationId: mainStation.id, connectionId: commConnections[5]?.id || null, protocolId: commProtocols[1].id, direction: 'outbound', messageType: 'heartbeat', rawData: null, parsedData: null, deviceType: 'controller', isSuccess: false, errorMessage: 'Connection refused - generator offline', durationMs: null, createdAt: new Date(Date.now() - 3600000) },
        { stationId: mainStation.id, connectionId: commConnections[2]?.id || null, protocolId: commProtocols[1].id, direction: 'inbound', messageType: 'event', rawData: '010300000002B4', parsedData: '{"type":"tank_reading","tank":"TANK-B","level":6200,"temp":25.8,"water":5}', deviceType: 'tank_atg', isSuccess: true, durationMs: 72, createdAt: new Date(Date.now() - 10000) },
      ]
    })

    // =====================================================
    // 70. DISPENSER PROFILES (8)
    // =====================================================
    await db.dispenserProfile.createMany({
      data: [
        { tenantId: tenant.id, manufacturer: 'tatsuno', modelName: 'Tatsuno M-1000', pumpTypes: '["dual_hose","multi_product"]', supportedFuels: '["petrol","diesel","premium"]', maxNozzles: 4, flowRate: 50, protocol: 'ifsf', communicationTypes: '["tcpip","rs485"]', defaultPort: 5000, defaultBaudRate: 9600, defaultPolling: 1000, notes: 'Japanese quality, widely used in Pakistan', isActive: true },
        { tenantId: tenant.id, manufacturer: 'tatsuno_sunny', modelName: 'Tatsuno Sunny A-250', pumpTypes: '["single_hose","dual_hose"]', supportedFuels: '["petrol","diesel"]', maxNozzles: 2, flowRate: 40, protocol: 'ifsf', communicationTypes: '["tcpip","rs232"]', defaultPort: 5001, defaultBaudRate: 9600, defaultPolling: 1000, notes: 'Budget-friendly Tatsuno variant for emerging markets', isActive: true },
        { tenantId: tenant.id, manufacturer: 'gilbarco', modelName: 'Gilbarco Veeder-Root Encore 700', pumpTypes: '["multi_product","high_flow"]', supportedFuels: '["petrol","diesel","premium","hsd"]', maxNozzles: 6, flowRate: 60, protocol: 'gilbarco_gsite', communicationTypes: '["tcpip","ethernet"]', defaultPort: 5010, defaultBaudRate: null, defaultPolling: 2000, notes: 'Premium dispenser with media display, global standard', isActive: true },
        { tenantId: tenant.id, manufacturer: 'wayne', modelName: 'Wayne iX 500', pumpTypes: '["dual_hose","multi_product"]', supportedFuels: '["petrol","diesel","premium"]', maxNozzles: 4, flowRate: 55, protocol: 'wayne_dart', communicationTypes: '["tcpip","rs485"]', defaultPort: 5020, defaultBaudRate: 19200, defaultPolling: 1500, notes: 'Wayne flagship model with payment-at-pump support', isActive: true },
        { tenantId: tenant.id, manufacturer: 'tokheim', modelName: 'Tokheim Quantium 410', pumpTypes: '["dual_hose","multi_product"]', supportedFuels: '["petrol","diesel","hsd"]', maxNozzles: 4, flowRate: 50, protocol: 'dfs', communicationTypes: '["tcpip","ethernet"]', defaultPort: 5030, defaultBaudRate: null, defaultPolling: 2000, notes: 'European design, commonly found in CNG/fuel hybrid stations', isActive: true },
        { tenantId: tenant.id, manufacturer: 'bennett', modelName: 'Bennett 3000 Series', pumpTypes: '["single_hose","dual_hose"]', supportedFuels: '["petrol","diesel"]', maxNozzles: 2, flowRate: 45, protocol: 'patrius', communicationTypes: '["rs485","tcpip"]', defaultPort: 5040, defaultBaudRate: 9600, defaultPolling: 1000, notes: 'Reliable workhorse for smaller stations', isActive: true },
        { tenantId: tenant.id, manufacturer: 'censtar', modelName: 'Censtar CS32', pumpTypes: '["dual_hose","multi_product"]', supportedFuels: '["petrol","diesel","premium"]', maxNozzles: 4, flowRate: 50, protocol: 'ifsf', communicationTypes: '["tcpip","rs485"]', defaultPort: 5050, defaultBaudRate: 9600, defaultPolling: 1000, notes: 'Chinese manufacturer, cost-effective option for Pakistani market', isActive: true },
        { tenantId: tenant.id, manufacturer: 'eaglestar', modelName: 'Eaglestar ETP-200', pumpTypes: '["single_hose","dual_hose"]', supportedFuels: '["petrol","diesel"]', maxNozzles: 2, flowRate: 40, protocol: 'proprietary', communicationTypes: '["rs485","tcpip"]', defaultPort: 5060, defaultBaudRate: 9600, defaultPolling: 1500, notes: 'Budget Chinese option, growing presence in KPK region', isActive: true },
      ]
    })

    // =====================================================
    // 71. ATG PROFILES (4)
    // =====================================================
    await db.aTGProfile.createMany({
      data: [
        { tenantId: tenant.id, manufacturer: 'veeder_root', modelName: 'TLS-350 Plus', atgType: 'magnetostrictive', probeTypes: '["magnetostrictive","capacitive"]', maxProbes: 8, communicationTypes: '["tcpip","rs232","rs485"]', protocol: 'ifsf', defaultPort: 10001, defaultBaudRate: 9600, features: '["leak_detection","overfill","water_detection","temperature","density","vapor_pressure"]', configTemplate: '{"pollingInterval":5000,"leakTestInterval":3600000}', notes: 'Industry standard ATG in Pakistan, most widely deployed', isActive: true },
        { tenantId: tenant.id, manufacturer: 'opw', modelName: 'SiteSentinel iSite', atgType: 'capacitive', probeTypes: '["capacitive","ultrasonic"]', maxProbes: 16, communicationTypes: '["tcpip","ethernet"]', protocol: 'modbus', defaultPort: 502, defaultBaudRate: null, features: '["leak_detection","overfill","water_detection","temperature","inventory_management"]', configTemplate: '{"pollingInterval":3000,"reportInterval":300000}', notes: 'Modern cloud-connected ATG with remote monitoring', isActive: true },
        { tenantId: tenant.id, manufacturer: 'franklin', modelName: 'TS-550', atgType: 'magnetostrictive', probeTypes: '["magnetostrictive"]', maxProbes: 6, communicationTypes: '["tcpip","rs232"]', protocol: 'ifsf', defaultPort: 10002, defaultBaudRate: 19200, features: '["leak_detection","overfill","water_detection","temperature"]', configTemplate: '{"pollingInterval":5000,"alarmThreshold":{"waterLevel":50,"tempDelta":5}}', notes: 'Reliable mid-range ATG, popular in Middle East and South Asia', isActive: true },
        { tenantId: tenant.id, manufacturer: 'hectronic', modelName: 'Hectronic ATG 200', atgType: 'ultrasonic', probeTypes: '["ultrasonic","capacitive"]', maxProbes: 10, communicationTypes: '["tcpip","rs485"]', protocol: 'modbus', defaultPort: 502, defaultBaudRate: 9600, features: '["leak_detection","water_detection","temperature","density","vapor_pressure","remote_diagnostics"]', configTemplate: '{"pollingInterval":2000,"ultrasonicMode":"continuous"}', notes: 'German engineering, premium ATG with advanced diagnostics', isActive: true },
      ]
    })

    // =====================================================
    // 72. FUEL TRANSFERS (2)
    // =====================================================
    await db.fuelTransfer.createMany({
      data: [
        { stationId: mainStation.id, fromTankId: tanks[0].id, toTankId: tanks[2].id, fuelType: 'petrol', volume: 2000, reason: 'stock_rebalance', status: 'completed', approvedBy: users[1].id, startedAt: new Date(Date.now() - 2 * 86400000), completedAt: new Date(Date.now() - 2 * 86400000 + 3600000), variance: -3, notes: 'Tank A over capacity, transferred surplus to Tank C' },
        { stationId: mainStation.id, fromTankId: tanks[1].id, toTankId: tanks[3].id, fuelType: 'diesel', volume: 5000, reason: 'tank_maintenance', status: 'pending', approvedBy: null, startedAt: null, completedAt: null, variance: null, notes: 'Scheduled transfer prior to Tank B maintenance inspection' },
      ]
    })

    // =====================================================
    // 73. THEFT ALERTS (2)
    // =====================================================
    await db.theftAlert.createMany({
      data: [
        { stationId: mainStation.id, tankId: tanks[1].id, dispenserId: dispensers[2].id, nozzleId: allNozzles.find(n => n.dispenserId === dispensers[2].id)?.id || null, detectionType: 'meter_manipulation', severity: 'critical', estimatedVolume: 142, estimatedLoss: 38964, evidence: '{"meterStart":125400,"meterEnd":125400,"dispensedVolume":142,"paidVolume":0,"timeWindow":"02:15-02:45","cameras":["CAM-FORE-01"]}', isInvestigated: false },
        { stationId: mainStation.id, tankId: tanks[0].id, dispenserId: dispensers[0].id, nozzleId: allNozzles.find(n => n.dispenserId === dispensers[0].id)?.id || null, detectionType: 'after_hours', severity: 'warning', estimatedVolume: 45, estimatedLoss: 12263, evidence: '{"time":"23:45","authorizedBy":null,"nozzleUpEvent":true,"noPayment":true,"cameras":["CAM-FORE-01","CAM-ENTRY-02"]}', isInvestigated: false },
      ]
    })

    // =====================================================
    // 74. SHRINKAGE RECORDS (2)
    // =====================================================
    await db.shrinkageRecord.createMany({
      data: [
        { stationId: mainStation.id, tankId: tanks[0].id, periodStart: new Date('2025-02-01'), periodEnd: new Date('2025-02-28'), openingStock: 18000, deliveries: 40000, salesVolume: 55200, expectedClosing: 2800, actualClosing: 2710, shrinkage: 90, shrinkagePercent: 0.16, temperatureVariance: 2.3, densityVariance: 0.002, cause: 'temperature', isReviewed: true, reviewedBy: users[1].id, notes: 'Normal thermal shrinkage - within acceptable 0.3% threshold' },
        { stationId: mainStation.id, tankId: tanks[1].id, periodStart: new Date('2025-02-01'), periodEnd: new Date('2025-02-28'), openingStock: 22000, deliveries: 35000, salesVolume: 50800, expectedClosing: 6200, actualClosing: 5970, shrinkage: 230, shrinkagePercent: 0.37, temperatureVariance: 1.8, densityVariance: 0.005, cause: 'unknown', isReviewed: false, reviewedBy: null, notes: 'Shrinkage exceeds 0.3% threshold - investigation pending. Possible measurement error or leak.' },
      ]
    })

    // =====================================================
    // 75. GL ACCOUNTS (10)
    // =====================================================
    const glAccounts = await Promise.all([
      db.gLAccount.create({ data: { tenantId: tenant.id, accountCode: '1000', accountName: 'Cash', accountType: 'asset', subType: 'current_asset', balance: 1250000, isActive: true } }),
      db.gLAccount.create({ data: { tenantId: tenant.id, accountCode: '1100', accountName: 'Accounts Receivable', accountType: 'asset', subType: 'current_asset', balance: 3200000, isActive: true } }),
      db.gLAccount.create({ data: { tenantId: tenant.id, accountCode: '1200', accountName: 'Inventory', accountType: 'asset', subType: 'current_asset', balance: 8500000, isActive: true } }),
      db.gLAccount.create({ data: { tenantId: tenant.id, accountCode: '2000', accountName: 'Accounts Payable', accountType: 'liability', subType: 'current_liability', balance: 4500000, isActive: true } }),
      db.gLAccount.create({ data: { tenantId: tenant.id, accountCode: '2100', accountName: 'Tax Payable', accountType: 'liability', subType: 'current_liability', balance: 780000, isActive: true } }),
      db.gLAccount.create({ data: { tenantId: tenant.id, accountCode: '3000', accountName: 'Owner Equity', accountType: 'equity', subType: null, balance: 15000000, isActive: true } }),
      db.gLAccount.create({ data: { tenantId: tenant.id, accountCode: '4000', accountName: 'Fuel Revenue', accountType: 'revenue', subType: 'operating_revenue', balance: 12500000, isActive: true } }),
      db.gLAccount.create({ data: { tenantId: tenant.id, accountCode: '4100', accountName: 'Retail Revenue', accountType: 'revenue', subType: 'operating_revenue', balance: 1800000, isActive: true } }),
      db.gLAccount.create({ data: { tenantId: tenant.id, accountCode: '5000', accountName: 'Cost of Goods Sold', accountType: 'expense', subType: 'cost_of_sales', balance: 9800000, isActive: true } }),
      db.gLAccount.create({ data: { tenantId: tenant.id, accountCode: '5100', accountName: 'Operating Expenses', accountType: 'expense', subType: 'operating_expense', balance: 2100000, isActive: true } }),
    ])

    // =====================================================
    // 76. JOURNAL ENTRIES (3) with Journal Lines
    // =====================================================
    const journalEntry1 = await db.journalEntry.create({
      data: {
        tenantId: tenant.id, stationId: mainStation.id, entryNumber: 'JE-2025-001', entryDate: new Date('2025-03-01'), description: 'Daily fuel sales - March 1, 2025', referenceType: 'fueling', totalDebit: 485000, totalCredit: 485000, status: 'posted', postedAt: new Date('2025-03-01'), postedBy: users[1].id,
      }
    })
    await db.journalLine.createMany({
      data: [
        { journalEntryId: journalEntry1.id, glAccountId: glAccounts[0].id, debit: 485000, credit: 0, description: 'Cash received from fuel sales' },
        { journalEntryId: journalEntry1.id, glAccountId: glAccounts[6].id, debit: 0, credit: 485000, description: 'Fuel revenue for March 1' },
      ]
    })

    const journalEntry2 = await db.journalEntry.create({
      data: {
        tenantId: tenant.id, stationId: mainStation.id, entryNumber: 'JE-2025-002', entryDate: new Date('2025-03-02'), description: 'Fuel purchase from PSO - February settlement', referenceType: 'delivery', totalDebit: 2500000, totalCredit: 2500000, status: 'posted', postedAt: new Date('2025-03-02'), postedBy: users[1].id,
      }
    })
    await db.journalLine.createMany({
      data: [
        { journalEntryId: journalEntry2.id, glAccountId: glAccounts[2].id, debit: 2500000, credit: 0, description: 'Fuel inventory increase - PSO delivery' },
        { journalEntryId: journalEntry2.id, glAccountId: glAccounts[3].id, debit: 0, credit: 2500000, description: 'Accounts payable to PSO' },
      ]
    })

    const journalEntry3 = await db.journalEntry.create({
      data: {
        tenantId: tenant.id, stationId: mainStation.id, entryNumber: 'JE-2025-003', entryDate: new Date('2025-03-03'), description: 'Monthly operating expenses - utilities and maintenance', referenceType: 'expense', totalDebit: 0, totalCredit: 0, status: 'draft',
      }
    })
    await db.journalLine.createMany({
      data: [
        { journalEntryId: journalEntry3.id, glAccountId: glAccounts[9].id, debit: 185000, credit: 0, description: 'WAPDA electricity bill' },
        { journalEntryId: journalEntry3.id, glAccountId: glAccounts[9].id, debit: 45000, credit: 0, description: 'SNGPL gas bill' },
        { journalEntryId: journalEntry3.id, glAccountId: glAccounts[0].id, debit: 0, credit: 230000, description: 'Cash paid for utilities' },
      ]
    })
    // Update journal entry 3 totals
    await db.journalEntry.update({ where: { id: journalEntry3.id }, data: { totalDebit: 230000, totalCredit: 230000 } })

    // =====================================================
    // 77. ACCOUNTS RECEIVABLE (3)
    // =====================================================
    await db.accountReceivable.createMany({
      data: [
        { tenantId: tenant.id, stationId: mainStation.id, customerId: fleetAccounts[0].id, invoiceNumber: 'AR-2025-001', amount: 1200000, paidAmount: 0, balance: 1200000, dueDate: new Date(Date.now() + 15 * 86400000), status: 'open', agingDays: 0, notes: 'Pakistan Post Fleet - March 2025 billing' },
        { tenantId: tenant.id, stationId: mainStation.id, customerId: fleetAccounts[1].id, invoiceNumber: 'AR-2025-002', amount: 2500000, paidAmount: 1500000, balance: 1000000, dueDate: new Date(Date.now() + 10 * 86400000), status: 'partial', agingDays: 5, notes: 'Daewoo Express - partial payment received, balance pending' },
        { tenantId: tenant.id, stationId: mainStation.id, customerId: fleetAccounts[2].id, invoiceNumber: 'AR-2025-003', amount: 800000, paidAmount: 0, balance: 800000, dueDate: new Date(Date.now() - 5 * 86400000), status: 'overdue', agingDays: 35, notes: 'NLC Logistics - overdue account, follow-up required' },
      ]
    })

    // =====================================================
    // 78. ACCOUNTS PAYABLE (2)
    // =====================================================
    await db.accountPayable.createMany({
      data: [
        { tenantId: tenant.id, stationId: mainStation.id, supplierId: suppliers[0].id, invoiceNumber: 'AP-PSO-2025-001', amount: 2500000, paidAmount: 0, balance: 2500000, dueDate: new Date(Date.now() + 20 * 86400000), status: 'open', agingDays: 0, notes: 'PSO fuel supply invoice - March 2025' },
        { tenantId: tenant.id, stationId: mainStation.id, supplierId: suppliers[1].id, invoiceNumber: 'AP-SHELL-2025-001', amount: 1800000, paidAmount: 0, balance: 1800000, dueDate: new Date(Date.now() + 5 * 86400000), status: 'open', agingDays: 10, notes: 'Shell diesel supply - pending approval for payment' },
      ]
    })

    // =====================================================
    // 79. TAX CONFIGURATIONS (3)
    // =====================================================
    await db.taxConfig.createMany({
      data: [
        { tenantId: tenant.id, taxName: 'Sales Tax', taxType: 'sales_tax', rate: 17, applicableTo: 'all', fuelType: null, isCompound: false, isActive: true, effectiveFrom: new Date('2025-01-01'), effectiveTo: null },
        { tenantId: tenant.id, taxName: 'Fuel Levy', taxType: 'fuel_levy', rate: 5, applicableTo: 'fuel', fuelType: null, isCompound: false, isActive: true, effectiveFrom: new Date('2025-01-01'), effectiveTo: null },
        { tenantId: tenant.id, taxName: 'GST', taxType: 'gst', rate: 17, applicableTo: 'all', fuelType: null, isCompound: true, isActive: true, effectiveFrom: new Date('2025-07-01'), effectiveTo: null },
      ]
    })

    // =====================================================
    // 80. CASH DRAWERS (2)
    // =====================================================
    const cashDrawers = await Promise.all([
      db.cashDrawer.create({
        data: { stationId: mainStation.id, shiftId: openShift.id, drawerNumber: 'DRW-01', openingBalance: 50000, cashSales: 86000, cardSales: 58000, otherReceipts: 2500, safeDrops: 30000, cashPayments: 5000, closingBalance: null, variance: null, status: 'open', lastCountedAt: new Date(Date.now() - 1800000) }
      }),
      db.cashDrawer.create({
        data: { stationId: mainStation.id, shiftId: closedShift2.id, drawerNumber: 'DRW-02', openingBalance: 60000, cashSales: 130000, cardSales: 58000, otherReceipts: 1200, safeDrops: 50000, cashPayments: 8000, closingBalance: 135200, variance: -3000, status: 'closed', lastCountedAt: new Date(Date.now() - 86400000) }
      }),
    ])

    // =====================================================
    // 81. SAFE DROPS (2)
    // =====================================================
    await db.safeDrop.createMany({
      data: [
        { stationId: mainStation.id, shiftId: openShift.id, drawerId: cashDrawers[0].id, amount: 30000, reason: 'Cash limit exceeded - excess moved to safe', performedBy: employees[4].id, witnessedBy: employees[0].id, createdAt: new Date(Date.now() - 7200000) },
        { stationId: mainStation.id, shiftId: closedShift2.id, drawerId: cashDrawers[1].id, amount: 50000, reason: 'End of shift safe drop', performedBy: employees[3].id, witnessedBy: employees[1].id, createdAt: new Date(Date.now() - 86400000) },
      ]
    })

    // =====================================================
    // 82. LOYALTY TRANSACTIONS (5)
    // =====================================================
    const loyaltyCustomers = await db.customer.findMany({ where: { tenantId: tenant.id }, take: 5 })
    if (loyaltyCustomers.length >= 5) {
      await db.loyaltyTransaction.createMany({
        data: [
          { tenantId: tenant.id, customerId: loyaltyCustomers[0].id, stationId: mainStation.id, pointsEarned: 500, pointsRedeemed: 0, balanceAfter: 5500, transactionType: 'earn', referenceType: 'fueling', description: 'Points earned on fuel purchase PKR 5,000' },
          { tenantId: tenant.id, customerId: loyaltyCustomers[1].id, stationId: mainStation.id, pointsEarned: 0, pointsRedeemed: 2000, balanceAfter: 1500, transactionType: 'redeem', referenceType: 'fueling', description: 'Points redeemed for PKR 500 fuel discount' },
          { tenantId: tenant.id, customerId: loyaltyCustomers[0].id, stationId: mainStation.id, pointsEarned: 1000, pointsRedeemed: 0, balanceAfter: 6500, transactionType: 'bonus', referenceType: 'promotion', description: 'Platinum member bonus - double points weekend' },
          { tenantId: tenant.id, customerId: loyaltyCustomers[3].id, stationId: mainStation.id, pointsEarned: 0, pointsRedeemed: 0, balanceAfter: 0, transactionType: 'expiry', description: 'Points expired - no activity for 12 months' },
          { tenantId: tenant.id, customerId: loyaltyCustomers[2].id, stationId: mainStation.id, pointsEarned: 200, pointsRedeemed: 0, balanceAfter: 1700, transactionType: 'adjustment', referenceType: 'manual', description: 'Manager adjustment - points credited for service complaint' },
        ]
      })
    }

    // =====================================================
    // 83. GIFT CARDS (3)
    // =====================================================
    await db.giftCard.createMany({
      data: [
        { tenantId: tenant.id, cardNumber: 'GFT-2025-0001', initialBalance: 5000, currentBalance: 3200, currency: 'PKR', purchaserName: 'Ahmed Raza', recipientName: 'Sara Raza', isActivated: true, activatedAt: new Date('2025-02-14'), expiryDate: new Date('2026-02-14'), lastUsedAt: new Date(Date.now() - 3 * 86400000), isActive: true },
        { tenantId: tenant.id, cardNumber: 'GFT-2025-0002', initialBalance: 10000, currentBalance: 10000, currency: 'PKR', purchaserName: 'Kamran Sheikh', recipientName: null, isActivated: false, activatedAt: null, expiryDate: new Date('2026-06-30'), lastUsedAt: null, isActive: true },
        { tenantId: tenant.id, cardNumber: 'GFT-2024-0015', initialBalance: 3000, currentBalance: 0, currency: 'PKR', purchaserName: 'Nadia Ashraf', recipientName: 'Ali Ashraf', isActivated: true, activatedAt: new Date('2024-01-15'), expiryDate: new Date('2025-01-15'), lastUsedAt: new Date('2025-01-10'), isActive: false },
      ]
    })

    // =====================================================
    // 84. CUSTOMER COMPLAINTS (3)
    // =====================================================
    await db.customerComplaint.createMany({
      data: [
        { tenantId: tenant.id, stationId: mainStation.id, customerId: null, complainantName: 'Rashid Minhas', complainantPhone: '+92-300-5551234', category: 'fuel_quality', priority: 'high', description: 'Vehicle engine knocking after refueling petrol from Pump 3. Suspect contaminated fuel.', status: 'open', assignedTo: users[2].id, resolution: null, resolvedAt: null, followUpDate: new Date(Date.now() + 2 * 86400000) },
        { tenantId: tenant.id, stationId: mainStation.id, customerId: null, complainantName: 'Farhan Ali', complainantPhone: '+92-321-9876543', category: 'billing', priority: 'normal', description: 'Double charged on credit card for fuel purchase of PKR 5,450 on Feb 28. POS terminal showed error but charge went through.', status: 'investigating', assignedTo: users[1].id, resolution: null, resolvedAt: null, followUpDate: new Date(Date.now() + 3 * 86400000) },
        { tenantId: tenant.id, stationId: mainStation.id, customerId: null, complainantName: 'Samina Begum', complainantPhone: '+92-333-1112233', category: 'service', priority: 'low', description: 'Attendant was rude and refused to check oil level after fueling.', status: 'resolved', assignedTo: users[2].id, resolution: 'Attendant counseled and given warning. Customer offered complimentary car wash.', resolvedAt: new Date(Date.now() - 86400000), followUpDate: null },
      ]
    })

    // =====================================================
    // 85. CNG COMPRESSOR (1) - for CNG/hybrid station
    // =====================================================
    const cngStation = stations.find(s => s.stationType === 'cng' || s.stationType === 'hybrid') || mainStation
    await db.cNGCompressor.create({
      data: {
        stationId: cngStation.id, name: 'CNG-COMP-01', code: 'CNG-C-01', manufacturer: 'Ariel', model: 'JGK/4', serialNumber: 'ARL-JG4-2024', communicationType: 'tcpip', ipAddress: '192.168.1.200', port: 502, protocol: 'modbus', stages: 4, inputPressure: 5, outputPressure: 220, currentPressure: 205, temperature: 85, motorStatus: 'on', runHours: 3450.5, gasConsumption: 1200, isActive: true, status: 'compressing', lastServiceDate: new Date(Date.now() - 45 * 86400000), nextServiceDate: new Date(Date.now() + 15 * 86400000),
      }
    })

    // =====================================================
    // 86. CNG STORAGE (1)
    // =====================================================
    await db.cNGStorage.create({
      data: {
        stationId: cngStation.id, name: 'CNG-CASCADE-01', code: 'CNG-CS-01', storageType: 'cascade', capacity: 3000, currentLevel: 2100, pressure: 200, maxPressure: 250, temperature: 35, status: 'normal', isActive: true,
      }
    })

    // =====================================================
    // 87. NOZZLE EVENTS (8)
    // =====================================================
    await db.nozzleEvent.createMany({
      data: [
        { stationId: mainStation.id, nozzleId: allNozzles[0].id, eventType: 'nozzle_up', volume: null, meterReading: allNozzles[0].meterReading, fuelType: 'petrol', attendantId: employees[4].id, vehiclePlate: 'ISB-4521', rfidTag: null, isAuthorized: true, dataJson: '{"authorizedBy":"system","presetVolume":50}', createdAt: new Date(Date.now() - 1800000) },
        { stationId: mainStation.id, nozzleId: allNozzles[0].id, eventType: 'fueling_start', volume: null, meterReading: allNozzles[0].meterReading, fuelType: 'petrol', attendantId: employees[4].id, vehiclePlate: 'ISB-4521', rfidTag: null, isAuthorized: true, dataJson: '{"presetVolume":50,"pricePerUnit":272.50}', createdAt: new Date(Date.now() - 1790000) },
        { stationId: mainStation.id, nozzleId: allNozzles[0].id, eventType: 'fueling_end', volume: 50, meterReading: allNozzles[0].meterReading + 50, fuelType: 'petrol', attendantId: employees[4].id, vehiclePlate: 'ISB-4521', rfidTag: null, isAuthorized: true, dataJson: '{"dispensedVolume":50,"totalAmount":13625}', createdAt: new Date(Date.now() - 1700000) },
        { stationId: mainStation.id, nozzleId: allNozzles[0].id, eventType: 'nozzle_down', volume: 50, meterReading: allNozzles[0].meterReading + 50, fuelType: 'petrol', attendantId: employees[4].id, vehiclePlate: 'ISB-4521', rfidTag: null, isAuthorized: true, dataJson: null, createdAt: new Date(Date.now() - 1695000) },
        { stationId: mainStation.id, nozzleId: allNozzles[2].id, eventType: 'unauthorized', volume: 12, meterReading: allNozzles[2].meterReading + 12, fuelType: 'petrol', attendantId: null, vehiclePlate: null, rfidTag: null, isAuthorized: false, dataJson: '{"reason":"no_preset","alertTriggered":true}', createdAt: new Date(Date.now() - 900000) },
        { stationId: mainStation.id, nozzleId: allNozzles[4].id, eventType: 'nozzle_up', volume: null, meterReading: allNozzles[4].meterReading, fuelType: 'diesel', attendantId: employees[5].id, vehiclePlate: 'LEA-7890', rfidTag: 'RFID-FC-001', isAuthorized: true, dataJson: '{"fleetAccount":"Pakistan Post Fleet","authorizedBy":"rfid"}', createdAt: new Date(Date.now() - 600000) },
        { stationId: mainStation.id, nozzleId: allNozzles[6].id, eventType: 'error', volume: null, meterReading: allNozzles[6].meterReading, fuelType: 'premium', attendantId: null, vehiclePlate: null, rfidTag: null, isAuthorized: false, dataJson: '{"errorCode":"FLOW_METER_FAULT","message":"Pump 4 Nozzle 1 flow meter reading unstable"}', createdAt: new Date(Date.now() - 3600000) },
        { stationId: mainStation.id, nozzleId: allNozzles[8].id, eventType: 'lock', volume: null, meterReading: allNozzles[8].meterReading, fuelType: 'petrol', attendantId: null, vehiclePlate: null, rfidTag: null, isAuthorized: false, dataJson: '{"reason":"maintenance_scheduled","lockedBy":"system"}', createdAt: new Date(Date.now() - 7200000) },
      ]
    })

    // =====================================================
    // 88. SHIFT HANDOVER (1)
    // =====================================================
    await db.shiftHandover.create({
      data: {
        stationId: mainStation.id, fromShiftId: closedShift2.id, toShiftId: openShift.id, fromAttendantId: employees[3].id, toAttendantId: employees[4].id, cashHandedOver: 135200, cashExpected: 138000, cashVariance: -2800, pumpReadings: JSON.stringify(allNozzles.slice(0, 8).map((n, i) => ({ nozzle: `Pump ${Math.floor(i/2)+1} Nozzle ${(i%2)+1}`, reading: n.meterReading }))), openIssues: '["Pump 5 under maintenance","Tank C overfill sensor needs replacement"]', notes: 'Shift handover completed. Cash variance of PKR 2,800 under investigation. Pump 5 still under maintenance.', status: 'accepted', acceptedAt: new Date(Date.now() - 6 * 3600000),
      }
    })

    // =====================================================
    // 89. REPORT TEMPLATES (4)
    // =====================================================
    const reportTemplates = await Promise.all([
      db.reportTemplate.create({
        data: { tenantId: tenant.id, name: 'Daily Sales Report', description: 'Comprehensive daily sales breakdown by fuel type, payment method, and shift', reportType: 'daily_sales', category: 'operations', dataSource: '{"tables":["Fueling","RetailTransaction","Shift"],"joins":["station","nozzle"]}', columns: '[{"key":"date","label":"Date"},{"key":"fuelType","label":"Fuel Type"},{"key":"volume","label":"Volume (L)"},{"key":"amount","label":"Amount (PKR)"},{"key":"paymentMethod","label":"Payment Method"}]', filters: '{"dateRange":true,"fuelType":true,"paymentMethod":true}', groupBy: '["fuelType","paymentMethod"]', sortBy: '{"field":"amount","order":"desc"}', chartType: 'bar', isSystem: true, isPublic: false, createdBy: users[0].id }
      }),
      db.reportTemplate.create({
        data: { tenantId: tenant.id, name: 'Shift Summary', description: 'Shift-level summary with attendant performance and cash reconciliation', reportType: 'shift_summary', category: 'operations', dataSource: '{"tables":["Shift","Fueling","MeterRecord"],"joins":["employee","station"]}', columns: '[{"key":"shiftNumber","label":"Shift"},{"key":"attendant","label":"Attendant"},{"key":"openedAt","label":"Start"},{"key":"closedAt","label":"End"},{"key":"totalSales","label":"Total Sales"},{"key":"cashVariance","label":"Cash Variance"}]', filters: '{"dateRange":true,"shiftNumber":true,"attendant":true}', groupBy: '["shiftNumber"]', sortBy: '{"field":"openedAt","order":"desc"}', chartType: 'table', isSystem: true, isPublic: false, createdBy: users[0].id }
      }),
      db.reportTemplate.create({
        data: { tenantId: tenant.id, name: 'Fuel Variance Report', description: 'Tank-level variance analysis with shrinkage tracking and theft alert correlation', reportType: 'fuel_variance', category: 'compliance', dataSource: '{"tables":["Reconciliation","ShrinkageRecord","TheftAlert"],"joins":["tank","station"]}', columns: '[{"key":"tank","label":"Tank"},{"key":"date","label":"Date"},{"key":"bookStock","label":"Book Stock"},{"key":"actualStock","label":"Actual Stock"},{"key":"variance","label":"Variance (L)"},{"key":"variancePercent","label":"Variance %"}]', filters: '{"dateRange":true,"tank":true,"fuelType":true}', groupBy: '["tank","date"]', sortBy: '{"field":"variancePercent","order":"desc"}', chartType: 'line', isSystem: true, isPublic: false, createdBy: users[0].id }
      }),
      db.reportTemplate.create({
        data: { tenantId: tenant.id, name: 'Financial Summary', description: 'GL-level financial summary with revenue, expenses, and profitability analysis', reportType: 'financial', category: 'finance', dataSource: '{"tables":["GLAccount","JournalEntry","JournalLine"],"joins":[]}', columns: '[{"key":"accountCode","label":"Account Code"},{"key":"accountName","label":"Account Name"},{"key":"accountType","label":"Type"},{"key":"debit","label":"Debit"},{"key":"credit","label":"Credit"},{"key":"balance","label":"Balance"}]', filters: '{"dateRange":true,"accountType":true,"station":true}', groupBy: '["accountType","accountCode"]', sortBy: '{"field":"accountCode","order":"asc"}', chartType: 'bar', isSystem: true, isPublic: false, createdBy: users[0].id }
      }),
    ])

    // =====================================================
    // 90. SCHEDULED REPORTS (2)
    // =====================================================
    await db.scheduledReport.createMany({
      data: [
        { tenantId: tenant.id, reportTemplateId: reportTemplates[0].id, scheduleType: 'daily', scheduleTime: '09:00', scheduleDay: null, recipients: '["ops@apexflow.pk","manager1@apexflow.pk"]', format: 'pdf', lastRunAt: new Date(Date.now() - 86400000), nextRunAt: new Date(Date.now() + 15 * 3600000), isActive: true },
        { tenantId: tenant.id, reportTemplateId: reportTemplates[3].id, scheduleType: 'monthly', scheduleTime: '08:00', scheduleDay: 1, recipients: '["finance@apexflow.pk","admin@apexflow.pk"]', format: 'excel', lastRunAt: new Date('2025-02-01T08:00:00'), nextRunAt: new Date('2025-04-01T08:00:00'), isActive: true },
      ]
    })

    // =====================================================
    // 91. API KEYS (2)
    // =====================================================
    await db.aPIKey.createMany({
      data: [
        { tenantId: tenant.id, keyHash: 'sha256:f1e2d3c4b5a6978869504132475869a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6', keyPrefix: 'apex_pk_a1', name: 'Production API Key', permissions: '["forecourt:read","tanks:read","sales:read","sales:write","fleet:read","pricing:read"]', allowedIPs: '["203.101.55.0/24","192.168.1.0/24"]', rateLimit: 1000, usageCount: 8450, lastUsedAt: new Date(Date.now() - 300000), expiresAt: new Date('2026-03-04'), isActive: true, createdBy: users[0].id },
        { tenantId: tenant.id, keyHash: 'sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890', keyPrefix: 'apex_pk_b2', name: 'Webhook Integration Key', permissions: '["sales:read","fleet:read","reports:read"]', allowedIPs: null, rateLimit: 500, usageCount: 2320, lastUsedAt: new Date(Date.now() - 1800000), expiresAt: new Date('2025-12-31'), isActive: true, createdBy: users[1].id },
      ]
    })

    // =====================================================
    // 92. WEBHOOK ENDPOINTS (2)
    // =====================================================
    const webhookEndpoints = await Promise.all([
      db.webhookEndpoint.create({
        data: { tenantId: tenant.id, url: 'https://erp.apexflow.pk/webhooks/fuelflow', name: 'ERP Integration', events: '["sale.completed","delivery.completed","shift.closed"]', secret: 'whsec_abc123def456ghi789', isActive: true, lastTriggeredAt: new Date(Date.now() - 3600000), successCount: 845, failureCount: 12 }
      }),
      db.webhookEndpoint.create({
        data: { tenantId: tenant.id, url: 'https://fleet.apexflow.pk/api/notifications', name: 'Fleet Management System', events: '["fleet.transaction","fleet.alert","fuel.price_update"]', secret: 'whsec_xyz789uvw012rst345', isActive: true, lastTriggeredAt: new Date(Date.now() - 7200000), successCount: 312, failureCount: 3 }
      }),
    ])

    // =====================================================
    // 93. WEBHOOK DELIVERIES (3)
    // =====================================================
    await db.webhookDelivery.createMany({
      data: [
        { webhookId: webhookEndpoints[0].id, event: 'sale.completed', payload: '{"transactionId":"TXN-00451","amount":13625,"fuelType":"petrol","volume":50,"station":"ISB-001","paymentMethod":"cash"}', statusCode: 200, response: '{"status":"ok","processed":true}', isSuccess: true, retryCount: 0, deliveredAt: new Date(Date.now() - 3600000) },
        { webhookId: webhookEndpoints[0].id, event: 'delivery.completed', payload: '{"deliveryId":"DLV-00089","tankId":"TANK-A","volume":10000,"supplier":"PSO","station":"ISB-001"}', statusCode: 500, response: '{"error":"Internal server error","message":"Database connection timeout"}', isSuccess: false, retryCount: 2, deliveredAt: new Date(Date.now() - 7200000) },
        { webhookId: webhookEndpoints[1].id, event: 'fleet.transaction', payload: '{"fleetAccount":"Pakistan Post Fleet","vehiclePlate":"LEA-4521","amount":8175,"fuelType":"diesel","volume":30.5}', statusCode: 200, response: '{"status":"accepted","transactionRef":"FLEET-TXN-98765"}', isSuccess: true, retryCount: 0, deliveredAt: new Date(Date.now() - 5400000) },
      ]
    })

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with comprehensive data including all new models',
      summary: {
        tenant: tenant.name,
        stations: stations.length,
        users: users.length,
        employees: employees.length,
        dispensers: dispensers.length,
        nozzles: allNozzles.length,
        tanks: tanks.length,
        tankReadings: tanks.length * 24,
        suppliers: suppliers.length,
        deliveries: deliveries.length,
        shifts: 3,
        fuelingTransactions: '65+',
        fleetAccounts: fleetAccounts.length,
        vehicles: fleetAccounts.length * 3,
        drivers: fleetAccounts.length * 3,
        fuelCards: fleetAccounts.length * 5,
        retailProducts: retailItems.length,
        lubricantProducts: lubricantItems.length,
        aiAlerts: alertData.length,
        notifications: notificationData.length,
        customers: customerNames.length,
        auditLogs: auditActions.length,
        dailyReports: 7,
        forecourtControllers: 2,
        paymentTerminals: 3,
        generators: 1,
        surveillanceCameras: 5,
        fireAlarmSystems: 1,
        utilityMeters: 3,
        weatherStations: 1,
        tankerTrackers: 2,
        carWashSystems: 1,
        airCompressors: 1,
        vacuumStations: 2,
        deviceConfigs: 5,
        deviceEventLogs: 12,
        deviceCommandQueue: 4,
        // New models
        omsClient: 1,
        omsPackages: 3,
        omsInvoices: 3,
        omsPayments: 2,
        omsSyncLogs: 5,
        omsLicenses: 5,
        securitySessions: 3,
        rbacPermissions: rbacData.length,
        securityAlerts: 3,
        backupRecords: 3,
        encryptionKeys: 2,
        commProtocols: 4,
        commConnections: 6,
        commLogs: 10,
        dispenserProfiles: 8,
        atgProfiles: 4,
        fuelTransfers: 2,
        theftAlerts: 2,
        shrinkageRecords: 2,
        glAccounts: 10,
        journalEntries: 3,
        accountsReceivable: 3,
        accountsPayable: 2,
        taxConfigs: 3,
        cashDrawers: 2,
        safeDrops: 2,
        loyaltyTransactions: 5,
        giftCards: 3,
        customerComplaints: 3,
        cngCompressors: 1,
        cngStorages: 1,
        nozzleEvents: 8,
        shiftHandovers: 1,
        reportTemplates: 4,
        scheduledReports: 2,
        apiKeys: 2,
        webhookEndpoints: 2,
        webhookDeliveries: 3,
      }
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
