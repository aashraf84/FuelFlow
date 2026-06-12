import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Create tenant
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
      }
    })

    // Create stations
    const stationData = [
      { name: 'Islamabad Main Station', code: 'ISB-001', city: 'Islamabad', region: 'ICT', stationType: 'hybrid' },
      { name: 'Lahore Canal Station', code: 'LHR-001', city: 'Lahore', region: 'Punjab', stationType: 'fuel' },
      { name: 'Karachi Port Station', code: 'KHI-001', city: 'Karachi', region: 'Sindh', stationType: 'fuel' },
      { name: 'Peshawar GT Station', code: 'PEW-001', city: 'Peshawar', region: 'KPK', stationType: 'cng' },
      { name: 'Faisalabad Sargodha Station', code: 'FSD-001', city: 'Faisalabad', region: 'Punjab', stationType: 'hybrid' },
    ]

    const stations = []
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
          isActive: true,
        }
      })
      stations.push(station)
    }

    const mainStation = stations[0]

    // Create tanks for main station
    const tankTypes = [
      { name: 'Tank A - Petrol', code: 'TANK-A', fuelType: 'petrol', capacity: 20000 },
      { name: 'Tank B - Diesel', code: 'TANK-B', fuelType: 'diesel', capacity: 25000 },
      { name: 'Tank C - Premium', code: 'TANK-C', fuelType: 'premium', capacity: 15000 },
      { name: 'Tank D - High Speed Diesel', code: 'TANK-D', fuelType: 'hsd', capacity: 30000 },
    ]

    const tanks = []
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

    // Create dispensers for main station
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

    const dispensers = []
    for (const d of dispenserData) {
      const statuses = ['idle', 'fueling', 'idle', 'idle', 'maintenance', 'idle', 'idle', 'fueling']
      const idx = dispenserData.indexOf(d)
      const dispenser = await db.dispenser.create({
        data: {
          stationId: mainStation.id,
          name: d.name,
          code: d.code,
          manufacturer: d.manufacturer,
          controllerType: d.controller,
          communicationType: d.comm,
          status: statuses[idx] || 'idle',
          isActive: true,
        }
      })
      dispensers.push(dispenser)

      // Create nozzles for each dispenser (dual hose)
      const fuelTypes = d.manufacturer === 'wayne' || d.manufacturer === 'tokheim' 
        ? [['petrol', 'Petrol'], ['diesel', 'Diesel']]
        : [['petrol', 'Petrol'], ['diesel', 'Diesel']]

      for (let n = 0; n < fuelTypes.length; n++) {
        const meterReading = 100000 + Math.floor(Math.random() * 500000)
        await db.nozzle.create({
          data: {
            dispenserId: dispenser.id,
            nozzleNumber: n + 1,
            fuelType: fuelTypes[n][0],
            fuelGrade: fuelTypes[n][1],
            meterReading,
            previousReading: meterReading - 1000 - Math.floor(Math.random() * 500),
            totalizer: meterReading,
            status: statuses[idx] === 'fueling' && n === 0 ? 'fueling' : 'idle',
            calibrationFactor: 1.0,
            calibrationDate: new Date('2025-01-15'),
          }
        })
      }
    }

    // Create employees
    const employeeNames = [
      { name: 'Ahmed Khan', role: 'manager', salary: 85000 },
      { name: 'Muhammad Ali', role: 'supervisor', salary: 55000 },
      { name: 'Bilal Hussain', role: 'attendant', salary: 35000 },
      { name: 'Usman Sheikh', role: 'attendant', salary: 35000 },
      { name: 'Farhan Raza', role: 'attendant', salary: 35000 },
      { name: 'Zain Ahmed', role: 'cashier', salary: 40000 },
      { name: 'Kamran Siddiqui', role: 'maintenance', salary: 40000 },
      { name: 'Tariq Mehmood', role: 'attendant', salary: 35000 },
    ]

    const employees = []
    for (const e of employeeNames) {
      const emp = await db.employee.create({
        data: {
          stationId: mainStation.id,
          name: e.name,
          role: e.role,
          salary: e.salary,
          commissionRate: e.role === 'attendant' ? 0.5 : 0,
          status: 'active',
          hireDate: new Date('2024-06-01'),
        }
      })
      employees.push(emp)
    }

    // Create current shift
    const shift = await db.shift.create({
      data: {
        stationId: mainStation.id,
        shiftNumber: 1,
        attendantId: employees[2].id,
        openedAt: new Date(),
        openingCash: 50000,
        totalSales: 0,
        totalVolume: 0,
        fuelSales: 0,
        retailSales: 0,
        status: 'open',
      }
    })

    // Create fueling transactions (today's data)
    const fuelTypes = ['petrol', 'diesel', 'premium', 'hsd']
    const paymentMethods = ['cash', 'card', 'fleet', 'rfid', 'mobile']
    const prices: Record<string, number> = { petrol: 272.50, diesel: 268.00, premium: 302.50, hsd: 275.00 }
    
    let totalSales = 0
    let totalVolume = 0

    for (let i = 0; i < 45; i++) {
      const fuelType = fuelTypes[Math.floor(Math.random() * fuelTypes.length)]
      const volume = 5 + Math.floor(Math.random() * 55)
      const price = prices[fuelType]
      const amount = Math.round(volume * price * 100) / 100
      totalSales += amount
      totalVolume += volume

      const dispenserIdx = Math.floor(Math.random() * dispensers.length)
      const dispenser = dispensers[dispenserIdx]
      const nozzles = await db.nozzle.findMany({ where: { dispenserId: dispenser.id } })
      const nozzle = nozzles[Math.floor(Math.random() * nozzles.length)]
      
      if (!nozzle) continue

      const meterStart = nozzle.meterReading - volume - Math.floor(Math.random() * 10)
      const hoursAgo = Math.floor(Math.random() * 8)
      const startTime = new Date(Date.now() - hoursAgo * 3600000)

      await db.fueling.create({
        data: {
          stationId: mainStation.id,
          dispenserId: dispenser.id,
          nozzleId: nozzle.id,
          shiftId: shift.id,
          fuelType,
          volume,
          pricePerUnit: price,
          totalAmount: amount,
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          meterStart,
          meterEnd: meterStart + volume,
          attendantId: employees[2 + Math.floor(Math.random() * 4)].id,
          status: 'completed',
          startedAt: startTime,
          completedAt: new Date(startTime.getTime() + 120000 + Math.random() * 300000),
        }
      })
    }

    // Update shift totals
    await db.shift.update({
      where: { id: shift.id },
      data: { totalSales, totalVolume: Math.round(totalVolume), fuelSales: totalSales }
    })

    // Create fleet accounts
    const fleetData = [
      { name: 'Pakistan Post Fleet', contact: 'Malik Aslam', daily: 5000 },
      { name: 'Daewoo Express', contact: 'Syed Wajahat', daily: 15000 },
      { name: 'NLC Logistics', contact: 'Col. Rashid', daily: 25000 },
      { name: 'Metro Bus Operations', contact: 'Engr. Farooq', daily: 20000 },
    ]

    for (const f of fleetData) {
      await db.fleetAccount.create({
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
        }
      })
    }

    // Create fuel prices
    for (const [fuelType, price] of Object.entries(prices)) {
      await db.fuelPrice.create({
        data: {
          tenantId: tenant.id,
          stationId: mainStation.id,
          fuelType,
          pricePerUnit: price,
          previousPrice: price - 2.5,
          currency: 'PKR',
          effectiveFrom: new Date('2025-03-01'),
          status: 'active',
        }
      })
    }

    // Create AI alerts
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

    // Create transactions (financial)
    const today = new Date()
    for (let i = 0; i < 20; i++) {
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
        }
      })
    }

    // Create retail products
    const retailItems = [
      { name: 'Mineral Water 500ml', category: 'beverages', price: 80, stock: 200 },
      { name: 'Cold Drink 345ml', category: 'beverages', price: 120, stock: 150 },
      { name: 'Snack Pack', category: 'snacks', price: 150, stock: 100 },
      { name: 'Engine Oil 1L', category: 'automotive', price: 850, stock: 50 },
      { name: 'Windshield Washer', category: 'automotive', price: 350, stock: 30 },
      { name: 'Car Freshener', category: 'automotive', price: 250, stock: 60 },
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
        }
      })
    }

    // Create EV chargers
    await db.eVCharger.createMany({
      data: [
        { stationId: mainStation.id, name: 'EV Charger 1', code: 'EV-01', connectorType: 'type2', maxPowerKw: 22, status: 'available' },
        { stationId: mainStation.id, name: 'EV Charger 2', code: 'EV-02', connectorType: 'ccs', maxPowerKw: 50, status: 'charging' },
        { stationId: mainStation.id, name: 'EV Charger 3', code: 'EV-03', connectorType: 'chademo', maxPowerKw: 50, status: 'available' },
      ]
    })

    // Create CNG dispensers
    await db.cNGDispenser.createMany({
      data: [
        { stationId: mainStation.id, name: 'CNG Dispenser 1', code: 'CNG-01', pressure: 220, status: 'idle' },
        { stationId: mainStation.id, name: 'CNG Dispenser 2', code: 'CNG-02', pressure: 215, status: 'dispensing' },
      ]
    })

    // Create ANPR cameras
    await db.aNPRCamera.createMany({
      data: [
        { stationId: mainStation.id, name: 'Entry ANPR', code: 'ANPR-01', location: 'Entry Gate', status: 'online' },
        { stationId: mainStation.id, name: 'Exit ANPR', code: 'ANPR-02', location: 'Exit Gate', status: 'online' },
      ]
    })

    // Create RFID readers
    await db.rFIDReader.createMany({
      data: [
        { stationId: mainStation.id, name: 'RFID Lane 1', code: 'RFID-01', readerType: 'vehicle', status: 'online' },
        { stationId: mainStation.id, name: 'RFID Lane 2', code: 'RFID-02', readerType: 'driver', status: 'online' },
      ]
    })

    // Create price boards
    await db.priceBoard.createMany({
      data: [
        { stationId: mainStation.id, name: 'Main Price Board', boardType: 'led', status: 'online' },
        { stationId: mainStation.id, name: 'Canopy Display', boardType: 'digital', status: 'online' },
      ]
    })

    // Create tank readings
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

    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully',
      tenant: tenant.name,
      stations: stations.length,
      dispensers: dispensers.length,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
