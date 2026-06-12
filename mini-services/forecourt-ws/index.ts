import { Server } from 'socket.io'

const PORT = 3003

const io = new Server(PORT, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  path: '/',
})

// Dispenser status simulation
const dispenserStatuses = new Map<string, string>()
const nozzleVolumes = new Map<string, number>()

// Initialize 8 dispensers
for (let i = 1; i <= 8; i++) {
  dispenserStatuses.set(`P-${String(i).padStart(2, '0')}`, i === 5 ? 'maintenance' : 'idle')
  nozzleVolumes.set(`P-${String(i).padStart(2, '0')}-1`, 0)
  nozzleVolumes.set(`P-${String(i).padStart(2, '0')}-2`, 0)
}

// Simulate real-time events
function simulateForecourtEvents() {
  // Randomly start/stop fueling on some pumps
  for (let i = 1; i <= 8; i++) {
    const pumpId = `P-${String(i).padStart(2, '0')}`
    const current = dispenserStatuses.get(pumpId) || 'idle'
    
    if (current === 'idle' && Math.random() < 0.05) {
      dispenserStatuses.set(pumpId, 'fueling')
      const volume = 0
      nozzleVolumes.set(`${pumpId}-${Math.random() > 0.5 ? 1 : 2}`, volume)
      
      io.emit('dispenser:status', {
        pumpId,
        status: 'fueling',
        nozzle: Math.random() > 0.5 ? 1 : 2,
        fuelType: ['petrol', 'diesel', 'premium', 'hsd'][Math.floor(Math.random() * 4)],
        startTime: new Date().toISOString(),
      })
    } else if (current === 'fueling' && Math.random() < 0.08) {
      dispenserStatuses.set(pumpId, 'idle')
      const volume = 5 + Math.random() * 55
      const prices: Record<string, number> = { petrol: 272.5, diesel: 268, premium: 302.5, hsd: 275 }
      const fuelType = ['petrol', 'diesel', 'premium', 'hsd'][Math.floor(Math.random() * 4)]
      
      io.emit('dispenser:complete', {
        pumpId,
        status: 'idle',
        volume: Math.round(volume * 10) / 10,
        amount: Math.round(volume * (prices[fuelType] || 272.5) * 100) / 100,
        fuelType,
        paymentMethod: ['cash', 'card', 'fleet', 'rfid', 'mobile'][Math.floor(Math.random() * 5)],
        completedAt: new Date().toISOString(),
      })
    }
  }

  // Simulate tank level changes
  if (Math.random() < 0.1) {
    const tankId = ['TANK-A', 'TANK-B', 'TANK-C', 'TANK-D'][Math.floor(Math.random() * 4)]
    const change = -Math.random() * 50 // Levels only go down in real time
    
    io.emit('tank:update', {
      tankId,
      levelChange: Math.round(change),
      timestamp: new Date().toISOString(),
    })
  }

  // Simulate ATG readings
  if (Math.random() < 0.15) {
    const tankId = ['TANK-A', 'TANK-B', 'TANK-C', 'TANK-D'][Math.floor(Math.random() * 4)]
    
    io.emit('atg:reading', {
      tankId,
      temperature: 25 + Math.random() * 10,
      waterLevel: Math.random() * 50,
      density: 0.74 + Math.random() * 0.05,
      timestamp: new Date().toISOString(),
    })
  }

  // Simulate RFID scans
  if (Math.random() < 0.03) {
    const vehicles = ['LEA-1234', 'ICT-5678', 'KHI-9012', 'LHR-3456', 'PEW-7890']
    const plate = vehicles[Math.floor(Math.random() * vehicles.length)]
    
    io.emit('rfid:scan', {
      readerId: `RFID-0${Math.floor(Math.random() * 2) + 1}`,
      vehiclePlate: plate,
      tagId: `TAG-${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
    })
  }

  // Simulate ANPR detection
  if (Math.random() < 0.03) {
    const vehicles = ['LEA-1234', 'ICT-5678', 'KHI-9012', 'LHR-3456', 'PEW-7890']
    const plate = vehicles[Math.floor(Math.random() * vehicles.length)]
    
    io.emit('anpr:detection', {
      cameraId: `ANPR-0${Math.floor(Math.random() * 2) + 1}`,
      plateNumber: plate,
      confidence: 0.85 + Math.random() * 0.14,
      isBlacklisted: Math.random() < 0.05,
      timestamp: new Date().toISOString(),
    })
  }

  // Simulate AI alerts
  if (Math.random() < 0.01) {
    const alerts = [
      { type: 'fuel_loss', severity: 'critical', title: 'Fuel loss detected' },
      { type: 'theft', severity: 'critical', title: 'Unauthorized fueling attempt' },
      { type: 'variance', severity: 'warning', title: 'Stock variance detected' },
      { type: 'maintenance', severity: 'info', title: 'Scheduled maintenance reminder' },
    ]
    const alert = alerts[Math.floor(Math.random() * alerts.length)]
    
    io.emit('ai:alert', {
      ...alert,
      description: `Automated detection at ${new Date().toLocaleTimeString()}`,
      confidence: 0.75 + Math.random() * 0.2,
      timestamp: new Date().toISOString(),
    })
  }
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)
  
  // Send current dispenser statuses
  socket.emit('forecourt:init', {
    dispensers: Array.from(dispenserStatuses.entries()).map(([id, status]) => ({
      pumpId: id,
      status,
    })),
    timestamp: new Date().toISOString(),
  })

  // Handle dispenser commands
  socket.on('dispenser:authorize', (data) => {
    console.log(`Authorize pump: ${data.pumpId}`)
    dispenserStatuses.set(data.pumpId, 'fueling')
    io.emit('dispenser:status', {
      pumpId: data.pumpId,
      status: 'fueling',
      authorizedBy: data.userId || 'system',
      timestamp: new Date().toISOString(),
    })
  })

  socket.on('dispenser:stop', (data) => {
    console.log(`Stop pump: ${data.pumpId}`)
    dispenserStatuses.set(data.pumpId, 'idle')
    io.emit('dispenser:status', {
      pumpId: data.pumpId,
      status: 'idle',
      stoppedBy: data.userId || 'system',
      timestamp: new Date().toISOString(),
    })
  })

  socket.on('dispenser:lock', (data) => {
    console.log(`Lock pump: ${data.pumpId}`)
    dispenserStatuses.set(data.pumpId, 'locked')
    io.emit('dispenser:status', {
      pumpId: data.pumpId,
      status: 'locked',
      timestamp: new Date().toISOString(),
    })
  })

  socket.on('dispenser:unlock', (data) => {
    console.log(`Unlock pump: ${data.pumpId}`)
    dispenserStatuses.set(data.pumpId, 'idle')
    io.emit('dispenser:status', {
      pumpId: data.pumpId,
      status: 'idle',
      timestamp: new Date().toISOString(),
    })
  })

  socket.on('price:update', (data) => {
    console.log(`Price update received`)
    io.emit('price:updated', {
      fuelType: data.fuelType,
      newPrice: data.newPrice,
      updatedBy: data.updatedBy || 'system',
      timestamp: new Date().toISOString(),
    })
  })

  socket.on('emergency:stop', () => {
    console.log('EMERGENCY STOP - All pumps halted')
    for (const [pumpId] of dispenserStatuses) {
      dispenserStatuses.set(pumpId, 'locked')
    }
    io.emit('emergency:stopped', {
      timestamp: new Date().toISOString(),
      allPumpsLocked: true,
    })
  })

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

// Run simulation every 3 seconds
setInterval(simulateForecourtEvents, 3000)

console.log(`🏎️ FuelFlow OS Forecourt WebSocket running on port ${PORT}`)
console.log(`   Real-time dispenser, tank, RFID, ANPR simulation active`)
