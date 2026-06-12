import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Clean up existing data (order matters due to foreign keys)
    await db.auditLog.deleteMany()
    await db.aIForecast.deleteMany()
    await db.aIAlert.deleteMany()
    await db.notification.deleteMany()
    await db.dailyReport.deleteMany()
    await db.vaporRecoveryReading.deleteMany()
    await db.environmentalAlert.deleteMany()
    await db.promotionUsage.deleteMany()
    await db.promotion.deleteMany()
    await db.loyaltyRule.deleteMany()
    await db.customer.deleteMany()
    await db.leaveRequest.deleteMany()
    await db.payrollRecord.deleteMany()
    await db.attendance.deleteMany()
    await db.maintenanceRecord.deleteMany()
    await db.expense.deleteMany()
    await db.transaction.deleteMany()
    await db.supplierInvoice.deleteMany()
    await db.purchaseOrder.deleteMany()
    await db.supplier.deleteMany()
    await db.lotterySale.deleteMany()
    await db.carWashSession.deleteMany()
    await db.retailTransaction.deleteMany()
    await db.lubricantProduct.deleteMany()
    await db.retailProduct.deleteMany()
    await db.chargingSession.deleteMany()
    await db.fueling.deleteMany()
    await db.meterRecord.deleteMany()
    await db.shift.deleteMany()
    await db.tankCalibration.deleteMany()
    await db.reconciliation.deleteMany()
    await db.tankReading.deleteMany()
    await db.fuelDelivery.deleteMany()
    await db.tank.deleteMany()
    await db.nozzle.deleteMany()
    await db.dispenser.deleteMany()
    await db.eVCharger.deleteMany()
    await db.cNGDispenser.deleteMany()
    await db.aNPRCamera.deleteMany()
    await db.rFIDReader.deleteMany()
    await db.priceBoard.deleteMany()
    await db.fuelPrice.deleteMany()
    await db.employee.deleteMany()
    await db.fuelCard.deleteMany()
    await db.vehicle.deleteMany()
    await db.driver.deleteMany()
    await db.fleetAccount.deleteMany()
    await db.user.deleteMany()
    await db.station.deleteMany()
    await db.tenant.deleteMany()

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
    const users = await Promise.all([
      db.user.create({ data: { tenantId: tenant.id, email: 'superadmin@apexflow.pk', name: 'Imran Akhtar', role: 'superadmin', isActive: true, lastLogin: new Date() } }),
      db.user.create({ data: { tenantId: tenant.id, email: 'admin@apexflow.pk', name: 'Fatima Noor', role: 'admin', isActive: true, lastLogin: new Date() } }),
      db.user.create({ data: { tenantId: tenant.id, email: 'manager1@apexflow.pk', name: 'Hassan Rizvi', role: 'manager', isActive: true, lastLogin: new Date() } }),
      db.user.create({ data: { tenantId: tenant.id, email: 'manager2@apexflow.pk', name: 'Ayesha Siddiqui', role: 'manager', isActive: true } }),
      db.user.create({ data: { tenantId: tenant.id, email: 'operator1@apexflow.pk', name: 'Bilal Khan', role: 'operator', isActive: true } }),
      db.user.create({ data: { tenantId: tenant.id, email: 'operator2@apexflow.pk', name: 'Sana Rehman', role: 'operator', isActive: true } }),
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
    // 29. NOTIFICATIONS (6)
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
    // 30. CUSTOMERS with loyalty data (10)
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
    // 31. LOYALTY RULES (2)
    // =====================================================
    await db.loyaltyRule.createMany({
      data: [
        { tenantId: tenant.id, name: 'Standard Fuel Points', pointsPerUnit: 1, fuelType: null, minimumPurchase: 500, bonusMultiplier: 1, isActive: true, validFrom: new Date('2025-01-01'), validTo: new Date('2025-12-31') },
        { tenantId: tenant.id, name: 'Premium Double Points', pointsPerUnit: 2, fuelType: 'premium', minimumPurchase: 1000, bonusMultiplier: 2, isActive: true, validFrom: new Date('2025-03-01'), validTo: new Date('2025-04-30') },
      ]
    })

    // =====================================================
    // 32. PROMOTIONS with usage (2)
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
    // 33. ENVIRONMENTAL ALERTS (3)
    // =====================================================
    await db.environmentalAlert.createMany({
      data: [
        { stationId: mainStation.id, alertType: 'vapor', severity: 'warning', tankId: tanks[1].id, description: 'Vapor recovery system showing elevated pressure readings on Tank B', epaCode: 'EPA-VRR-001', isReportable: false, isResolved: false },
        { stationId: mainStation.id, alertType: 'water_intrusion', severity: 'warning', tankId: tanks[0].id, description: 'Water level in Tank A exceeding normal thresholds - 48mm detected', epaCode: 'EPA-WI-003', isReportable: false, isResolved: false },
        { stationId: mainStation.id, alertType: 'overfill', severity: 'critical', tankId: tanks[2].id, description: 'Overfill alarm triggered during fuel delivery to Tank C', epaCode: 'EPA-OF-002', isReportable: true, isResolved: false, reportedToAgency: true },
      ]
    })

    // =====================================================
    // 34. VAPOR RECOVERY READINGS (2)
    // =====================================================
    await db.vaporRecoveryReading.createMany({
      data: [
        { stationId: mainStation.id, tankId: tanks[0].id, vaporPressure: 2.5, recoveryRate: 98.5, status: 'normal', readingAt: new Date(Date.now() - 3600000) },
        { stationId: mainStation.id, tankId: tanks[1].id, vaporPressure: 4.8, recoveryRate: 92.1, status: 'warning', readingAt: new Date() },
      ]
    })

    // =====================================================
    // 35. DAILY REPORTS (last 7 days)
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
    // 36. AUDIT LOGS (20+)
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
    // 37. EV CHARGERS + CNG DISPENSERS
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
    // 38. RFID READERS + ANPR CAMERAS
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
    // 39. FINANCIAL TRANSACTIONS (income + expenses)
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
    // 40. MAINTENANCE RECORDS
    // =====================================================
    await db.maintenanceRecord.createMany({
      data: [
        { stationId: mainStation.id, equipmentType: 'dispenser', equipmentId: dispensers[4].id, nozzleId: allNozzles.find(n => n.dispenserId === dispensers[4].id)?.id || null, type: 'preventive', description: 'Quarterly pump calibration and inspection', technician: 'Kamran Siddiqui', cost: 15000, status: 'scheduled', scheduledDate: new Date(Date.now() + 2 * 86400000) },
        { stationId: mainStation.id, equipmentType: 'tank', equipmentId: tanks[2].id, type: 'corrective', description: 'Overfill alarm sensor replacement for Tank C', technician: 'External - TechServe', cost: 25000, status: 'in_progress', scheduledDate: new Date() },
      ]
    })

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with comprehensive data',
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
      }
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
