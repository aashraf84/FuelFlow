import { Server } from 'socket.io'

const PORT = 3003

const io = new Server(PORT, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  path: '/',
})

// =====================================================
// DEVICE STATE MANAGEMENT
// =====================================================

// Dispenser status tracking
const dispenserStatuses = new Map<string, string>()
const nozzleVolumes = new Map<string, number>()
const nozzleStates = new Map<string, string>() // up, down, error

// Generator state
const generatorState = {
  status: 'standby' as string,
  loadKva: 0,
  fuelLevel: 85,
  runHours: 1250.5,
  voltage: 220,
  frequency: 50,
}

// Weather data
const weatherState = {
  temperature: 32.5,
  humidity: 45,
  windSpeed: 8.5,
  windDirection: 'SW',
  pressure: 1013.2,
  rainfall: 0,
  uvIndex: 7,
}

// Tanker positions
const tankerPositions = new Map<string, { lat: number; lng: number; speed: number; heading: number }>()
tankerPositions.set('TK-01', { lat: 33.6844, lng: 73.0479, speed: 0, heading: 0 })
tankerPositions.set('TK-02', { lat: 33.7294, lng: 73.0931, speed: 45, heading: 90 })

// Initialize 8 dispensers with nozzle states
for (let i = 1; i <= 8; i++) {
  const pumpId = `P-${String(i).padStart(2, '0')}`
  dispenserStatuses.set(pumpId, i === 5 ? 'maintenance' : 'idle')
  nozzleVolumes.set(`${pumpId}-1`, 0)
  nozzleVolumes.set(`${pumpId}-2`, 0)
  nozzleStates.set(`${pumpId}-1`, 'down')
  nozzleStates.set(`${pumpId}-2`, 'down')
}

// =====================================================
// REAL-TIME EVENT SIMULATION
// =====================================================

function simulateForecourtEvents() {
  // Dispenser fueling events
  for (let i = 1; i <= 8; i++) {
    const pumpId = `P-${String(i).padStart(2, '0')}`
    const current = dispenserStatuses.get(pumpId) || 'idle'
    
    if (current === 'idle' && Math.random() < 0.05) {
      dispenserStatuses.set(pumpId, 'fueling')
      const nozzleNum = Math.random() > 0.5 ? 1 : 2
      nozzleStates.set(`${pumpId}-${nozzleNum}`, 'up')
      
      io.emit('dispenser:status', {
        pumpId,
        status: 'fueling',
        nozzle: nozzleNum,
        fuelType: ['petrol', 'diesel', 'premium', 'hsd'][Math.floor(Math.random() * 4)],
        startTime: new Date().toISOString(),
      })

      // Nozzle up event
      io.emit('nozzle:event', {
        nozzleId: `${pumpId}-${nozzleNum}`,
        eventType: 'nozzle_up',
        isAuthorized: true,
        timestamp: new Date().toISOString(),
      })

      // Fueling start event
      io.emit('nozzle:event', {
        nozzleId: `${pumpId}-${nozzleNum}`,
        eventType: 'fueling_start',
        isAuthorized: true,
        timestamp: new Date().toISOString(),
      })
    } else if (current === 'fueling' && Math.random() < 0.08) {
      dispenserStatuses.set(pumpId, 'idle')
      const volume = 5 + Math.random() * 55
      const prices: Record<string, number> = { petrol: 272.5, diesel: 268, premium: 302.5, hsd: 275 }
      const fuelType = ['petrol', 'diesel', 'premium', 'hsd'][Math.floor(Math.random() * 4)]
      const nozzleNum = Math.random() > 0.5 ? 1 : 2

      nozzleStates.set(`${pumpId}-${nozzleNum}`, 'down')
      
      io.emit('dispenser:complete', {
        pumpId,
        status: 'idle',
        volume: Math.round(volume * 10) / 10,
        amount: Math.round(volume * (prices[fuelType] || 272.5) * 100) / 100,
        fuelType,
        paymentMethod: ['cash', 'card', 'fleet', 'rfid', 'mobile'][Math.floor(Math.random() * 5)],
        completedAt: new Date().toISOString(),
      })

      // Nozzle down + fueling end events
      io.emit('nozzle:event', {
        nozzleId: `${pumpId}-${nozzleNum}`,
        eventType: 'fueling_end',
        volume: Math.round(volume * 10) / 10,
        isAuthorized: true,
        timestamp: new Date().toISOString(),
      })
      io.emit('nozzle:event', {
        nozzleId: `${pumpId}-${nozzleNum}`,
        eventType: 'nozzle_down',
        isAuthorized: true,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Unauthorized fueling detection (rare)
  if (Math.random() < 0.005) {
    const pumpId = `P-${String(Math.floor(Math.random() * 8) + 1).padStart(2, '0')}`
    const nozzleNum = Math.random() > 0.5 ? 1 : 2
    io.emit('nozzle:event', {
      nozzleId: `${pumpId}-${nozzleNum}`,
      eventType: 'unauthorized',
      isAuthorized: false,
      volume: 0,
      timestamp: new Date().toISOString(),
    })
    io.emit('theft:alert', {
      dispenserId: pumpId,
      nozzleId: `${pumpId}-${nozzleNum}`,
      detectionType: 'unauthorized_fueling',
      severity: 'critical',
      timestamp: new Date().toISOString(),
    })
  }

  // Tank level changes
  if (Math.random() < 0.1) {
    const tankId = ['TANK-A', 'TANK-B', 'TANK-C', 'TANK-D'][Math.floor(Math.random() * 4)]
    const change = -Math.random() * 50
    
    io.emit('tank:update', {
      tankId,
      levelChange: Math.round(change),
      timestamp: new Date().toISOString(),
    })
  }

  // ATG readings (Veeder-Root, OPW, Franklin simulation)
  if (Math.random() < 0.15) {
    const tankId = ['TANK-A', 'TANK-B', 'TANK-C', 'TANK-D'][Math.floor(Math.random() * 4)]
    const atgSystems = ['veeder_root_tls350', 'opw_sitesentinel', 'franklin_ts550']
    
    io.emit('atg:reading', {
      tankId,
      atgType: atgSystems[Math.floor(Math.random() * atgSystems.length)],
      temperature: 25 + Math.random() * 10,
      waterLevel: Math.random() * 50,
      density: 0.74 + Math.random() * 0.05,
      probeType: Math.random() > 0.5 ? 'magnetostrictive' : 'capacitive',
      timestamp: new Date().toISOString(),
    })
  }

  // RFID scans
  if (Math.random() < 0.03) {
    const vehicles = ['LEA-1234', 'ICT-5678', 'KHI-9012', 'LHR-3456', 'PEW-7890']
    const plate = vehicles[Math.floor(Math.random() * vehicles.length)]
    
    io.emit('rfid:scan', {
      readerId: `RFID-0${Math.floor(Math.random() * 2) + 1}`,
      vehiclePlate: plate,
      tagId: `TAG-${Math.floor(Math.random() * 10000)}`,
      tagType: Math.random() > 0.5 ? 'vehicle' : 'driver',
      timestamp: new Date().toISOString(),
    })
  }

  // ANPR detection
  if (Math.random() < 0.03) {
    const vehicles = ['LEA-1234', 'ICT-5678', 'KHI-9012', 'LHR-3456', 'PEW-7890']
    const plate = vehicles[Math.floor(Math.random() * vehicles.length)]
    
    io.emit('anpr:detection', {
      cameraId: `ANPR-0${Math.floor(Math.random() * 2) + 1}`,
      plateNumber: plate,
      confidence: 0.85 + Math.random() * 0.14,
      isBlacklisted: Math.random() < 0.05,
      isFleet: Math.random() < 0.3,
      timestamp: new Date().toISOString(),
    })
  }

  // Generator status updates
  if (Math.random() < 0.05) {
    // Simulate occasional power outage → generator starts
    if (generatorState.status === 'standby' && Math.random() < 0.1) {
      generatorState.status = 'running'
      generatorState.loadKva = 50 + Math.random() * 100
      io.emit('generator:status', {
        status: 'running',
        loadKva: generatorState.loadKva,
        fuelLevel: generatorState.fuelLevel,
        voltage: generatorState.voltage,
        frequency: generatorState.frequency,
        autoStarted: true,
        timestamp: new Date().toISOString(),
      })
    } else if (generatorState.status === 'running') {
      generatorState.fuelLevel = Math.max(0, generatorState.fuelLevel - Math.random() * 0.1)
      generatorState.loadKva = 50 + Math.random() * 150
      generatorState.runHours += 0.001

      // Power restored → back to standby
      if (Math.random() < 0.05) {
        generatorState.status = 'standby'
        generatorState.loadKva = 0
      }
      
      io.emit('generator:status', { ...generatorState, timestamp: new Date().toISOString() })
    }
  }

  // Weather station updates
  if (Math.random() < 0.08) {
    weatherState.temperature = 30 + Math.random() * 8
    weatherState.humidity = 35 + Math.random() * 25
    weatherState.windSpeed = 2 + Math.random() * 15
    weatherState.pressure = 1010 + Math.random() * 8
    
    io.emit('weather:update', { ...weatherState, timestamp: new Date().toISOString() })
  }

  // Tanker GPS tracking updates
  if (Math.random() < 0.1) {
    for (const [trackerId, pos] of tankerPositions) {
      if (pos.speed > 0) {
        // Move tanker slightly
        pos.lat += (Math.random() - 0.5) * 0.005
        pos.lng += (Math.random() - 0.5) * 0.005
        pos.speed = 30 + Math.random() * 40
        pos.heading = Math.floor(Math.random() * 360)
      } else if (Math.random() < 0.1) {
        // Start moving
        pos.speed = 30 + Math.random() * 40
      }
      
      io.emit('tanker:position', {
        trackerId,
        latitude: pos.lat,
        longitude: pos.lng,
        speed: pos.speed,
        heading: pos.heading,
        ignitionStatus: pos.speed > 0,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Payment terminal events
  if (Math.random() < 0.04) {
    io.emit('payment:transaction', {
      terminalId: ['POS-T1', 'EFT-T2', 'PAP-T3'][Math.floor(Math.random() * 3)],
      transactionType: Math.random() > 0.5 ? 'sale' : 'refund',
      amount: Math.round((100 + Math.random() * 5000) * 100) / 100,
      cardType: ['visa', 'mastercard', 'unionpay'][Math.floor(Math.random() * 3)],
      method: Math.random() > 0.3 ? 'contactless' : 'emv',
      status: Math.random() > 0.05 ? 'approved' : 'declined',
      timestamp: new Date().toISOString(),
    })
  }

  // Fire alarm heartbeat
  if (Math.random() < 0.02) {
    io.emit('fire_alarm:heartbeat', {
      systemId: 'FAS-01',
      status: 'normal',
      zoneStatuses: Array.from({ length: 12 }, (_, i) => ({
        zone: i + 1,
        status: 'normal',
        detectors: 4,
      })),
      timestamp: new Date().toISOString(),
    })
  }

  // Price board sync
  if (Math.random() < 0.01) {
    io.emit('price_board:sync', {
      boardId: 'PB-01',
      prices: {
        petrol: 272.5,
        diesel: 268.0,
        premium: 302.5,
        hsd: 275.0,
      },
      syncStatus: 'success',
      timestamp: new Date().toISOString(),
    })
  }

  // AI alerts
  if (Math.random() < 0.01) {
    const alerts = [
      { type: 'fuel_loss', severity: 'critical', title: 'Fuel loss detected', description: 'Unusual stock variance detected at Tank A' },
      { type: 'theft', severity: 'critical', title: 'Unauthorized fueling attempt', description: 'Nozzle lifted without authorization at P-03' },
      { type: 'variance', severity: 'warning', title: 'Stock variance detected', description: 'Tank B variance exceeds 0.5% threshold' },
      { type: 'maintenance', severity: 'info', title: 'Scheduled maintenance reminder', description: 'Pump 5 due for filter replacement' },
      { type: 'demand_forecast', severity: 'info', title: 'Demand forecast updated', description: 'Expected 15% increase in petrol demand this weekend' },
    ]
    const alert = alerts[Math.floor(Math.random() * alerts.length)]
    
    io.emit('ai:alert', {
      ...alert,
      confidence: 0.75 + Math.random() * 0.2,
      timestamp: new Date().toISOString(),
    })
  }

  // Communication layer events
  if (Math.random() < 0.06) {
    const protocols = ['ifsf', 'modbus', 'mqtt', 'iso8583']
    const protocol = protocols[Math.floor(Math.random() * protocols.length)]
    
    io.emit('comm:message', {
      protocol,
      direction: Math.random() > 0.5 ? 'inbound' : 'outbound',
      messageType: ['heartbeat', 'command', 'response', 'event'][Math.floor(Math.random() * 4)],
      isSuccess: Math.random() > 0.05,
      latencyMs: Math.floor(5 + Math.random() * 50),
      timestamp: new Date().toISOString(),
    })
  }

  // EV charger events
  if (Math.random() < 0.03) {
    io.emit('ev_charger:status', {
      chargerId: 'EV-01',
      status: Math.random() > 0.5 ? 'charging' : 'available',
      energyKwh: Math.random() * 50,
      durationMinutes: Math.floor(Math.random() * 60),
      timestamp: new Date().toISOString(),
    })
  }

  // CNG compressor events
  if (Math.random() < 0.02) {
    io.emit('cng:status', {
      compressorId: 'CNG-CMP-01',
      status: Math.random() > 0.3 ? 'compressing' : 'idle',
      currentPressure: 200 + Math.random() * 50,
      temperature: 35 + Math.random() * 15,
      timestamp: new Date().toISOString(),
    })
  }

  // Surveillance camera events
  if (Math.random() < 0.02) {
    io.emit('surveillance:event', {
      cameraId: `CAM-${String(Math.floor(Math.random() * 5) + 1).padStart(2, '0')}`,
      eventType: Math.random() > 0.7 ? 'motion_detected' : 'analytics',
      analyticsType: Math.random() > 0.5 ? 'plate_recognized' : 'person_detected',
      timestamp: new Date().toISOString(),
    })
  }

  // Utility meter readings
  if (Math.random() < 0.03) {
    io.emit('meter:reading', {
      meterId: ['ELC-01', 'WTR-01', 'GAS-01'][Math.floor(Math.random() * 3)],
      meterType: ['electricity', 'water', 'gas'][Math.floor(Math.random() * 3)],
      reading: 1000 + Math.random() * 500,
      consumption: Math.random() * 50,
      timestamp: new Date().toISOString(),
    })
  }
}

// =====================================================
// SOCKET CONNECTION HANDLERS
// =====================================================

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)
  
  // Send current dispenser statuses
  socket.emit('forecourt:init', {
    dispensers: Array.from(dispenserStatuses.entries()).map(([id, status]) => ({
      pumpId: id,
      status,
    })),
    nozzleStates: Array.from(nozzleStates.entries()).map(([id, state]) => ({
      nozzleId: id,
      state,
    })),
    timestamp: new Date().toISOString(),
  })

  // Send generator state
  socket.emit('generator:status', { ...generatorState, timestamp: new Date().toISOString() })

  // Send weather data
  socket.emit('weather:update', { ...weatherState, timestamp: new Date().toISOString() })

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

  // Nozzle commands
  socket.on('nozzle:lock', (data) => {
    console.log(`Lock nozzle: ${data.nozzleId}`)
    nozzleStates.set(data.nozzleId, 'locked')
    io.emit('nozzle:event', {
      nozzleId: data.nozzleId,
      eventType: 'lock',
      isAuthorized: true,
      timestamp: new Date().toISOString(),
    })
  })

  socket.on('nozzle:unlock', (data) => {
    console.log(`Unlock nozzle: ${data.nozzleId}`)
    nozzleStates.set(data.nozzleId, 'down')
    io.emit('nozzle:event', {
      nozzleId: data.nozzleId,
      eventType: 'unlock',
      isAuthorized: true,
      timestamp: new Date().toISOString(),
    })
  })

  socket.on('nozzle:disable', (data) => {
    console.log(`Disable nozzle: ${data.nozzleId}`)
    nozzleStates.set(data.nozzleId, 'disabled')
    io.emit('nozzle:event', {
      nozzleId: data.nozzleId,
      eventType: 'disable',
      isAuthorized: true,
      timestamp: new Date().toISOString(),
    })
  })

  // Price commands
  socket.on('price:update', (data) => {
    console.log(`Price update received for ${data.fuelType}`)
    io.emit('price:updated', {
      fuelType: data.fuelType,
      newPrice: data.newPrice,
      updatedBy: data.updatedBy || 'system',
      timestamp: new Date().toISOString(),
    })
    // Sync to price boards
    io.emit('price_board:sync', {
      boardId: 'ALL',
      fuelType: data.fuelType,
      newPrice: data.newPrice,
      syncStatus: 'success',
      timestamp: new Date().toISOString(),
    })
  })

  // Emergency stop
  socket.on('emergency:stop', () => {
    console.log('EMERGENCY STOP - All pumps halted')
    for (const [pumpId] of dispenserStatuses) {
      dispenserStatuses.set(pumpId, 'locked')
    }
    io.emit('emergency:stopped', {
      timestamp: new Date().toISOString(),
      allPumpsLocked: true,
    })
    // Trigger fire alarm alert
    io.emit('fire_alarm:alert', {
      systemId: 'FAS-01',
      alertType: 'emergency_stop',
      severity: 'critical',
      timestamp: new Date().toISOString(),
    })
  })

  // Generator commands
  socket.on('generator:start', () => {
    console.log('Generator manual start')
    generatorState.status = 'running'
    generatorState.loadKva = 50 + Math.random() * 100
    io.emit('generator:status', { ...generatorState, manuallyStarted: true, timestamp: new Date().toISOString() })
  })

  socket.on('generator:stop', () => {
    console.log('Generator manual stop')
    generatorState.status = 'standby'
    generatorState.loadKva = 0
    io.emit('generator:status', { ...generatorState, manuallyStopped: true, timestamp: new Date().toISOString() })
  })

  // Communication test
  socket.on('comm:test', (data) => {
    console.log(`Communication test: ${data.protocol}`)
    io.emit('comm:message', {
      protocol: data.protocol,
      direction: 'outbound',
      messageType: 'command',
      isSuccess: true,
      latencyMs: Math.floor(5 + Math.random() * 20),
      timestamp: new Date().toISOString(),
    })
  })

  // OMS sync trigger
  socket.on('oms:sync', (data) => {
    console.log(`OMS sync triggered: ${data.syncType}`)
    io.emit('oms:sync_result', {
      syncType: data.syncType,
      status: 'success',
      timestamp: new Date().toISOString(),
    })
  })

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

// Run simulation every 3 seconds
setInterval(simulateForecourtEvents, 3000)

console.log(`🏎️ FuelFlow OS Forecourt WebSocket running on port ${PORT}`)
console.log(`   Real-time events: Dispenser, Nozzle, ATG, RFID, ANPR, Generator, Weather,`)
console.log(`   Tanker GPS, Payment Terminal, Fire Alarm, Price Board, EV Charger, CNG,`)
console.log(`   Surveillance, Utility Meters, AI Alerts, Communication Layer`)
