import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// =====================================================
// FuelFlow OS - Comprehensive Hardware Integration API
// Architecture: ERP → Forecourt Controller → Pumps
// The ERP NEVER communicates directly with pumps.
// All communication goes through Forecourt Controllers.
// =====================================================

// =====================================================
// DEVICE TYPE REGISTRY
// Uses lazy accessor functions to avoid initialization timing issues
// =====================================================

type DeviceDelegate = {
  findMany: (args?: Record<string, unknown>) => Promise<unknown[]>
  findUnique: (args: Record<string, unknown>) => Promise<unknown | null>
  findFirst: (args?: Record<string, unknown>) => Promise<unknown | null>
  create: (args: Record<string, unknown>) => Promise<unknown>
  update: (args: Record<string, unknown>) => Promise<unknown>
  delete: (args: Record<string, unknown>) => Promise<unknown>
  count: (args?: Record<string, unknown>) => Promise<number>
}

interface DeviceTypeInfo {
  key: string
  getModel: () => DeviceDelegate
  label: string
  category: string
}

const DEVICE_TYPES: DeviceTypeInfo[] = [
  { key: 'forecourt_controller', getModel: () => db.forecourtController as unknown as DeviceDelegate, label: 'Forecourt Controllers', category: 'controller' },
  { key: 'payment_terminal', getModel: () => db.paymentTerminal as unknown as DeviceDelegate, label: 'Payment Terminals', category: 'payment_terminal' },
  { key: 'generator', getModel: () => db.generator as unknown as DeviceDelegate, label: 'Generators', category: 'generator' },
  { key: 'surveillance_camera', getModel: () => db.surveillanceCamera as unknown as DeviceDelegate, label: 'Surveillance Cameras', category: 'camera' },
  { key: 'fire_alarm', getModel: () => db.fireAlarmSystem as unknown as DeviceDelegate, label: 'Fire Alarm Systems', category: 'fire_alarm' },
  { key: 'utility_meter', getModel: () => db.utilityMeter as unknown as DeviceDelegate, label: 'Utility Meters', category: 'utility_meter' },
  { key: 'weather_station', getModel: () => db.weatherStation as unknown as DeviceDelegate, label: 'Weather Stations', category: 'weather_station' },
  { key: 'tanker_tracker', getModel: () => db.tankerTracker as unknown as DeviceDelegate, label: 'Tanker Trackers', category: 'tanker_tracker' },
  { key: 'car_wash', getModel: () => db.carWashSystem as unknown as DeviceDelegate, label: 'Car Wash Systems', category: 'car_wash' },
  { key: 'air_compressor', getModel: () => db.airCompressor as unknown as DeviceDelegate, label: 'Air Compressors', category: 'air_compressor' },
  { key: 'vacuum_station', getModel: () => db.vacuumStation as unknown as DeviceDelegate, label: 'Vacuum Stations', category: 'vacuum_station' },
]

const DEVICE_TYPE_MAP = new Map<string, DeviceTypeInfo>(
  DEVICE_TYPES.map((dt) => [dt.key, dt])
)

const ALL_DEVICE_TYPE_KEYS = DEVICE_TYPES.map((dt) => dt.key)

// =====================================================
// TYPE-SPECIFIC FIELD DEFINITIONS
// =====================================================

const COMMON_FIELDS = [
  'name', 'code', 'manufacturer', 'model', 'serialNumber', 'firmwareVersion',
  'communicationType', 'ipAddress', 'port', 'comPort', 'protocol',
  'status', 'isActive', 'configJson',
] as const

const TYPE_SPECIFIC_FIELDS: Record<string, string[]> = {
  forecourt_controller: [
    'controllerType', 'baudRate', 'pollingInterval', 'timeout',
    'maxDispensers', 'connectedDispensers', 'lastHeartbeat', 'lastCommunication',
  ],
  payment_terminal: [
    'terminalType', 'merchantId', 'terminalId', 'supportedCards',
    'supportedMethods', 'shiftId', 'transactionCount', 'lastTransaction',
  ],
  generator: [
    'fuelType', 'capacityKva', 'currentLoadKva', 'fuelLevel',
    'runHours', 'voltage', 'frequency', 'oilPressure', 'coolantTemp',
    'autoStart', 'autoTransfer', 'lastStartedAt', 'lastStoppedAt', 'nextServiceDate',
  ],
  surveillance_camera: [
    'cameraType', 'resolution', 'location', 'rtspUrl', 'httpUrl',
    'onvifSupported', 'ptzEnabled', 'nightVision', 'recordingEnabled',
    'storageDays', 'analyticsEnabled', 'analyticsType', 'lastRecordingAt',
  ],
  fire_alarm: [
    'systemType', 'zoneCount', 'detectorCount', 'suppressionType',
    'autoSuppress', 'linkedToDispensers', 'linkedToTanks',
    'lastAlarmAt', 'lastTestDate', 'nextTestDate',
  ],
  utility_meter: [
    'meterType', 'meterNumber', 'currentReading', 'previousReading',
    'consumption', 'unit', 'peakDemand', 'powerFactor',
    'billingCycle', 'tariffRate', 'lastReading',
  ],
  weather_station: [
    'temperature', 'humidity', 'windSpeed', 'windDirection',
    'pressure', 'rainfall', 'uvIndex', 'visibility', 'dewPoint', 'lastReading',
  ],
  tanker_tracker: [
    'trackerType', 'simCardNumber', 'imei', 'latitude', 'longitude',
    'speed', 'heading', 'altitude', 'odometer', 'fuelLevel',
    'ignitionStatus', 'doorStatus', 'geofenceEnabled', 'geofenceRadius', 'lastLocationAt',
  ],
  car_wash: [
    'systemType', 'bayCount', 'currentBay', 'waterPressure',
    'waterTemp', 'chemicalLevel', 'waxLevel', 'dailyCount',
    'monthlyCount', 'revenueToday', 'lastWashAt', 'nextServiceDate',
  ],
  air_compressor: [
    'pressure', 'maxPressure', 'tankCapacity', 'motorStatus',
    'runHours', 'coinOperated', 'pricePerUse', 'dailyUsage', 'revenueToday', 'lastUsedAt',
  ],
  vacuum_station: [
    'motorStatus', 'suctionPower', 'coinOperated', 'pricePerUse',
    'dailyUsage', 'revenueToday', 'runHours', 'lastUsedAt',
  ],
}

// =====================================================
// SUPPORTED HARDWARE CATALOG DATA
// =====================================================

const SUPPORTED_FORECOURT_CONTROLLERS = [
  {
    manufacturer: 'pts',
    modelName: 'PTS Over_Controller',
    controllerType: 'pts',
    supportedProtocols: JSON.stringify(['ifsf', 'patrius', 'dfs']),
    supportedDispensers: JSON.stringify(['gilbarco', 'wayne', 'tatsuno', 'tokheim', 'bennett', 'petrotec', 'scheidt_bachmann', 'censtar', 'eaglestar', 'hongyang', 'sanki', 'zhejiang_datian', 'tatsuno_sunny', 'tatsuno_benc', 'tatsuno_korea', 'hectronic']),
    maxDispensers: 32,
    maxNozzlesPerPump: 4,
    communicationTypes: JSON.stringify(['tcpip', 'rs232', 'rs485', 'serial', 'ethernet']),
    defaultPort: 5000,
    defaultPollingMs: 1000,
    features: JSON.stringify(['authorize', 'stop', 'nozzle_status', 'sales_data', 'meter_values', 'price_change', 'pump_errors', 'preset', 'lock', 'tank_levels']),
    atgSupport: true,
    atgBrands: JSON.stringify(['veeder_root', 'opw', 'franklin', 'hectronic']),
    paymentIntegration: true,
    mqttSupport: true,
    notes: 'Universal forecourt controller supporting 50+ dispenser brands via IFSF/Patrius protocols. Most popular choice for multi-brand stations.',
  },
  {
    manufacturer: 'doms',
    modelName: 'DOMS DC',
    controllerType: 'doms',
    supportedProtocols: JSON.stringify(['ifsf', 'patrius', 'dfs']),
    supportedDispensers: JSON.stringify(['gilbarco', 'wayne', 'tatsuno', 'tokheim', 'bennett', 'petrotec']),
    maxDispensers: 24,
    maxNozzlesPerPump: 4,
    communicationTypes: JSON.stringify(['tcpip', 'rs232', 'rs485']),
    defaultPort: 5010,
    defaultPollingMs: 1000,
    features: JSON.stringify(['authorize', 'stop', 'nozzle_status', 'sales_data', 'meter_values', 'price_change', 'preset', 'lock']),
    atgSupport: true,
    atgBrands: JSON.stringify(['veeder_root', 'opw']),
    paymentIntegration: false,
    mqttSupport: false,
    notes: 'DOMS Dispenser Controller supporting multiple brands. Common in European markets.',
  },
  {
    manufacturer: 'fusion',
    modelName: 'Fusion FCM-6',
    controllerType: 'fusion',
    supportedProtocols: JSON.stringify(['ifsf', 'patrius', 'dfs', 'wayne-dart']),
    supportedDispensers: JSON.stringify(['gilbarco', 'wayne', 'tatsuno', 'tokheim', 'bennett']),
    maxDispensers: 24,
    maxNozzlesPerPump: 4,
    communicationTypes: JSON.stringify(['tcpip', 'rs232', 'rs485', 'ethernet']),
    defaultPort: 5020,
    defaultPollingMs: 800,
    features: JSON.stringify(['authorize', 'stop', 'nozzle_status', 'sales_data', 'meter_values', 'price_change', 'preset', 'lock', 'pump_errors']),
    atgSupport: true,
    atgBrands: JSON.stringify(['veeder_root', 'opw', 'franklin']),
    paymentIntegration: true,
    mqttSupport: true,
    notes: 'Multi-protocol fusion controller. Supports IFSF, Patrius, DFS and Wayne DART protocols.',
  },
  {
    manufacturer: 'hectronic',
    modelName: 'Hectronic FCC',
    controllerType: 'hectronic',
    supportedProtocols: JSON.stringify(['ifsf', 'dfs']),
    supportedDispensers: JSON.stringify(['tatsuno', 'gilbarco', 'wayne', 'bennett']),
    maxDispensers: 16,
    maxNozzlesPerPump: 4,
    communicationTypes: JSON.stringify(['tcpip', 'rs485']),
    defaultPort: 5030,
    defaultPollingMs: 1000,
    features: JSON.stringify(['authorize', 'stop', 'nozzle_status', 'sales_data', 'meter_values', 'price_change']),
    atgSupport: true,
    atgBrands: JSON.stringify(['hectronic', 'veeder_root']),
    paymentIntegration: false,
    mqttSupport: false,
    notes: 'European standard forecourt controller by Hectronic. Common in Central European markets.',
  },
  {
    manufacturer: 'wayne',
    modelName: 'Wayne Site Controller',
    controllerType: 'wayne',
    supportedProtocols: JSON.stringify(['wayne-dart']),
    supportedDispensers: JSON.stringify(['wayne']),
    maxDispensers: 32,
    maxNozzlesPerPump: 4,
    communicationTypes: JSON.stringify(['tcpip', 'rs485']),
    defaultPort: 5040,
    defaultPollingMs: 500,
    features: JSON.stringify(['authorize', 'stop', 'nozzle_status', 'sales_data', 'meter_values', 'price_change', 'preset', 'lock']),
    atgSupport: true,
    atgBrands: JSON.stringify(['veeder_root']),
    paymentIntegration: true,
    mqttSupport: false,
    notes: 'Wayne proprietary site controller. Only supports Wayne dispensers via DART protocol.',
  },
  {
    manufacturer: 'gilbarco',
    modelName: 'Gilbarco G-Site',
    controllerType: 'gilbarco',
    supportedProtocols: JSON.stringify(['gilbarco-g-site']),
    supportedDispensers: JSON.stringify(['gilbarco']),
    maxDispensers: 32,
    maxNozzlesPerPump: 4,
    communicationTypes: JSON.stringify(['tcpip', 'rs485']),
    defaultPort: 5050,
    defaultPollingMs: 500,
    features: JSON.stringify(['authorize', 'stop', 'nozzle_status', 'sales_data', 'meter_values', 'price_change', 'preset', 'lock']),
    atgSupport: true,
    atgBrands: JSON.stringify(['veeder_root']),
    paymentIntegration: true,
    mqttSupport: false,
    notes: 'Gilbarco proprietary G-Site controller. Only supports Gilbarco/Veeder-Root dispensers.',
  },
  {
    manufacturer: 'tokheim',
    modelName: 'Tokheim TC-400',
    controllerType: 'tokheim',
    supportedProtocols: JSON.stringify(['dfs']),
    supportedDispensers: JSON.stringify(['tokheim']),
    maxDispensers: 16,
    maxNozzlesPerPump: 4,
    communicationTypes: JSON.stringify(['tcpip', 'rs485']),
    defaultPort: 5060,
    defaultPollingMs: 1000,
    features: JSON.stringify(['authorize', 'stop', 'nozzle_status', 'sales_data', 'meter_values', 'price_change']),
    atgSupport: false,
    paymentIntegration: false,
    mqttSupport: false,
    notes: 'Tokheim proprietary controller. Only supports Tokheim dispensers via DFS protocol.',
  },
  {
    manufacturer: 'scheidt_bachmann',
    modelName: 'Scheidt & Bachmann FMP',
    controllerType: 'scheidt_bachmann',
    supportedProtocols: JSON.stringify(['ifsf', 'dfs']),
    supportedDispensers: JSON.stringify(['scheidt_bachmann']),
    maxDispensers: 24,
    maxNozzlesPerPump: 4,
    communicationTypes: JSON.stringify(['tcpip', 'rs485']),
    defaultPort: 5070,
    defaultPollingMs: 1000,
    features: JSON.stringify(['authorize', 'stop', 'nozzle_status', 'sales_data', 'meter_values', 'price_change', 'preset']),
    atgSupport: true,
    atgBrands: JSON.stringify(['veeder_root', 'opw']),
    paymentIntegration: true,
    mqttSupport: true,
    notes: 'S&B proprietary Fuel Management Point controller. Supports S&B PETROPOINT dispensers.',
  },
]

const SUPPORTED_DISPENSERS = [
  // Gilbarco (Veeder-Root)
  { manufacturer: 'gilbarco', modelName: 'Encore 500', maxNozzles: 4, flowRate: 60, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel', 'premium']), communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['ifsf', 'gilbarco-g-site']), compatibleControllers: JSON.stringify(['pts', 'gilbarco']), specifications: JSON.stringify({ display: 'Color LCD', media: 'Optional', payment: 'Pay-at-pump ready' }), hardwareType: 'multi_product' },
  { manufacturer: 'gilbarco', modelName: 'Encore 700', maxNozzles: 6, flowRate: 80, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel', 'premium', 'hsd']), communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['ifsf', 'gilbarco-g-site']), compatibleControllers: JSON.stringify(['pts', 'gilbarco']), specifications: JSON.stringify({ display: 'Large color LCD', media: 'Built-in', payment: 'Pay-at-pump', cabinet: 'Climate controlled' }), hardwareType: 'multi_product' },
  { manufacturer: 'gilbarco', modelName: 'Advantage', maxNozzles: 2, flowRate: 50, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel']), communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['ifsf', 'gilbarco-g-site']), compatibleControllers: JSON.stringify(['pts', 'gilbarco']), specifications: JSON.stringify({ display: 'LED', payment: 'Cash only' }), hardwareType: 'dual_hose' },
  { manufacturer: 'gilbarco', modelName: 'Eclipse', maxNozzles: 2, flowRate: 40, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel']), communicationTypes: JSON.stringify(['rs485']), protocols: JSON.stringify(['gilbarco-g-site']), compatibleControllers: JSON.stringify(['gilbarco']), specifications: JSON.stringify({ display: 'LED backlit', economy: true }), hardwareType: 'dual_hose' },

  // Wayne
  { manufacturer: 'wayne', modelName: 'iX', maxNozzles: 4, flowRate: 60, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel', 'premium']), communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['ifsf', 'wayne-dart']), compatibleControllers: JSON.stringify(['pts', 'fusion', 'wayne']), specifications: JSON.stringify({ display: 'Full-color LCD', media: 'Optional', payment: 'Pay-at-pump ready' }), hardwareType: 'multi_product' },
  { manufacturer: 'wayne', modelName: 'Helix', maxNozzles: 6, flowRate: 80, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel', 'premium', 'hsd']), communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['ifsf', 'wayne-dart']), compatibleControllers: JSON.stringify(['pts', 'fusion', 'wayne']), specifications: JSON.stringify({ display: 'Wide-screen LCD', media: 'Built-in', payment: 'Pay-at-pump' }), hardwareType: 'multi_product' },
  { manufacturer: 'wayne', modelName: 'Ovation', maxNozzles: 2, flowRate: 50, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel']), communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['ifsf', 'wayne-dart']), compatibleControllers: JSON.stringify(['pts', 'wayne']), specifications: JSON.stringify({ display: 'LED', payment: 'Cash only' }), hardwareType: 'dual_hose' },
  { manufacturer: 'wayne', modelName: 'Quantum', maxNozzles: 4, flowRate: 70, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel', 'premium']), communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['wayne-dart']), compatibleControllers: JSON.stringify(['wayne']), specifications: JSON.stringify({ display: 'LCD', payment: 'Pay-at-pump ready' }), hardwareType: 'multi_product' },
  { manufacturer: 'wayne', modelName: 'Vac', maxNozzles: 1, flowRate: 120, category: 'dispenser', supportedFuels: JSON.stringify(['diesel']), communicationTypes: JSON.stringify(['rs485']), protocols: JSON.stringify(['wayne-dart']), compatibleControllers: JSON.stringify(['pts', 'wayne']), specifications: JSON.stringify({ type: 'High-speed diesel', flowRate: '120 L/min' }), hardwareType: 'high_flow' },

  // Tatsuno
  { manufacturer: 'tatsuno', modelName: 'TSM-12', maxNozzles: 2, flowRate: 50, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel']), communicationTypes: JSON.stringify(['tcpip', 'rs485', 'rs232']), protocols: JSON.stringify(['ifsf', 'patrius']), compatibleControllers: JSON.stringify(['pts', 'doms', 'fusion']), specifications: JSON.stringify({ display: 'LED backlit', market: 'Asia-Pacific' }), hardwareType: 'dual_hose' },
  { manufacturer: 'tatsuno', modelName: 'TSM-22', maxNozzles: 2, flowRate: 60, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel', 'premium']), communicationTypes: JSON.stringify(['tcpip', 'rs485', 'rs232']), protocols: JSON.stringify(['ifsf', 'patrius']), compatibleControllers: JSON.stringify(['pts', 'doms', 'fusion']), specifications: JSON.stringify({ display: 'LCD', market: 'Asia-Pacific' }), hardwareType: 'dual_hose' },
  { manufacturer: 'tatsuno', modelName: 'TSM-30', maxNozzles: 4, flowRate: 70, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel', 'premium', 'hsd']), communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['ifsf', 'patrius']), compatibleControllers: JSON.stringify(['pts', 'doms', 'fusion']), specifications: JSON.stringify({ display: 'Color LCD', market: 'Asia-Pacific' }), hardwareType: 'multi_product' },
  { manufacturer: 'tatsuno', modelName: 'Saturn', maxNozzles: 2, flowRate: 45, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel']), communicationTypes: JSON.stringify(['rs485', 'rs232']), protocols: JSON.stringify(['patrius']), compatibleControllers: JSON.stringify(['pts', 'doms']), specifications: JSON.stringify({ display: 'LED', economy: true, market: 'South Asia' }), hardwareType: 'dual_hose' },
  { manufacturer: 'tatsuno', modelName: 'Benč', maxNozzles: 2, flowRate: 50, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel']), communicationTypes: JSON.stringify(['rs485', 'rs232']), protocols: JSON.stringify(['patrius']), compatibleControllers: JSON.stringify(['pts', 'doms']), specifications: JSON.stringify({ display: 'LED', market: 'Central Asia' }), hardwareType: 'dual_hose' },

  // Tokheim
  { manufacturer: 'tokheim', modelName: 'Quantium', maxNozzles: 4, flowRate: 60, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel', 'premium']), communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['ifsf', 'dfs']), compatibleControllers: JSON.stringify(['pts', 'tokheim', 'fusion']), specifications: JSON.stringify({ display: 'Color LCD', media: 'Optional', payment: 'Pay-at-pump ready' }), hardwareType: 'multi_product' },
  { manufacturer: 'tokheim', modelName: 'System 1000', maxNozzles: 2, flowRate: 50, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel']), communicationTypes: JSON.stringify(['rs485']), protocols: JSON.stringify(['dfs']), compatibleControllers: JSON.stringify(['pts', 'tokheim']), specifications: JSON.stringify({ display: 'LED', economy: true }), hardwareType: 'dual_hose' },
  { manufacturer: 'tokheim', modelName: 'ProGauge', maxNozzles: 2, flowRate: 55, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel']), communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['dfs']), compatibleControllers: JSON.stringify(['pts', 'tokheim']), specifications: JSON.stringify({ display: 'LCD', precision: 'High accuracy gauge' }), hardwareType: 'dual_hose' },

  // Bennett
  { manufacturer: 'bennett', modelName: '3000 Series', maxNozzles: 2, flowRate: 45, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel']), communicationTypes: JSON.stringify(['rs485', 'rs232']), protocols: JSON.stringify(['ifsf', 'patrius']), compatibleControllers: JSON.stringify(['pts', 'doms']), specifications: JSON.stringify({ display: 'LED', economy: true, market: 'North America' }), hardwareType: 'dual_hose' },
  { manufacturer: 'bennett', modelName: '4000 Series', maxNozzles: 4, flowRate: 60, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel', 'premium']), communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['ifsf', 'patrius']), compatibleControllers: JSON.stringify(['pts', 'doms', 'fusion']), specifications: JSON.stringify({ display: 'LCD', market: 'North America' }), hardwareType: 'multi_product' },
  { manufacturer: 'bennett', modelName: '9100', maxNozzles: 2, flowRate: 50, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel']), communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['ifsf']), compatibleControllers: JSON.stringify(['pts']), specifications: JSON.stringify({ display: 'LED backlit', market: 'North America' }), hardwareType: 'dual_hose' },

  // Petrotec
  { manufacturer: 'petrotec', modelName: 'C-300', maxNozzles: 2, flowRate: 45, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel']), communicationTypes: JSON.stringify(['rs485', 'rs232']), protocols: JSON.stringify(['ifsf', 'patrius']), compatibleControllers: JSON.stringify(['pts', 'doms']), specifications: JSON.stringify({ display: 'LED', economy: true, market: 'Europe' }), hardwareType: 'dual_hose' },
  { manufacturer: 'petrotec', modelName: 'C-500', maxNozzles: 4, flowRate: 60, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel', 'premium']), communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['ifsf', 'patrius']), compatibleControllers: JSON.stringify(['pts', 'doms', 'fusion']), specifications: JSON.stringify({ display: 'LCD', market: 'Europe' }), hardwareType: 'multi_product' },
  { manufacturer: 'petrotec', modelName: 'E-300', maxNozzles: 2, flowRate: 50, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel']), communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['ifsf', 'patrius']), compatibleControllers: JSON.stringify(['pts', 'doms']), specifications: JSON.stringify({ display: 'LED backlit', market: 'Europe', economy: true }), hardwareType: 'dual_hose' },

  // Scheidt & Bachmann
  { manufacturer: 'scheidt_bachmann', modelName: 'FMP', maxNozzles: 4, flowRate: 60, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel', 'premium']), communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['ifsf', 'dfs']), compatibleControllers: JSON.stringify(['pts', 'scheidt_bachmann']), specifications: JSON.stringify({ display: 'LCD', market: 'Europe', precision: 'OIML R117' }), hardwareType: 'multi_product' },
  { manufacturer: 'scheidt_bachmann', modelName: 'PETROPOINT', maxNozzles: 2, flowRate: 50, category: 'dispenser', supportedFuels: JSON.stringify(['petrol', 'diesel']), communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['ifsf', 'dfs']), compatibleControllers: JSON.stringify(['pts', 'scheidt_bachmann']), specifications: JSON.stringify({ display: 'LED', market: 'Europe', type: 'Compact' }), hardwareType: 'dual_hose' },
]

// =====================================================
// HELPERS
// =====================================================

async function getFirstStationId(): Promise<string | null> {
  const station = await db.station.findFirst({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })
  return station?.id ?? null
}

function errorResponse(message: string, status: number = 400, details?: unknown) {
  return NextResponse.json(
    { error: message, ...(details !== undefined ? { details } : {}) },
    { status }
  )
}

function filterAllowedFields(
  data: Record<string, unknown>,
  deviceTypeKey: string,
  includeCommon: boolean = true
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const allowedFields = new Set<string>()

  if (includeCommon) {
    for (const f of COMMON_FIELDS) allowedFields.add(f)
  }
  for (const f of TYPE_SPECIFIC_FIELDS[deviceTypeKey] ?? []) allowedFields.add(f)

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.has(key) && value !== undefined) {
      result[key] = value
    }
  }

  return result
}

async function logDeviceEvent(data: {
  stationId: string
  deviceType: string
  deviceId: string
  eventType: string
  severity: string
  message: string
  dataJson?: string
}): Promise<void> {
  try {
    await db.deviceEventLog.create({ data })
  } catch (err) {
    console.warn(
      'Device event log creation skipped (FK constraint):',
      err instanceof Prisma.PrismaClientKnownRequestError ? err.code : err instanceof Error ? err.message : String(err)
    )
  }
}

async function createCommandEntry(data: {
  stationId: string
  deviceType: string
  deviceId: string
  command: string
  parameters: string | null
  priority: string
  maxRetries: number
  retryCount: number
  createdBy: string | null
}): Promise<Record<string, unknown> | null> {
  try {
    const entry = await db.deviceCommandQueue.create({
      data: {
        stationId: data.stationId,
        deviceType: data.deviceType,
        deviceId: data.deviceId,
        command: data.command,
        parameters: data.parameters,
        priority: data.priority,
        status: 'queued',
        maxRetries: data.maxRetries,
        retryCount: data.retryCount,
        createdBy: data.createdBy,
      },
    })
    return entry as Record<string, unknown>
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      console.warn('Command queue creation skipped (FK constraint):', err.message)
      return {
        id: 'virtual-' + Date.now(),
        ...data,
        status: 'queued',
        persisted: false,
        reason: 'FK constraint - command stored in memory only',
      }
    }
    throw err
  }
}

// Map category name used in API to deviceType key used in DB
const CATEGORY_TO_DEVICE_TYPE: Record<string, string> = {
  controller: 'forecourt_controller',
  dispenser: 'dispenser',
  payment_terminal: 'payment_terminal',
  generator: 'generator',
  camera: 'surveillance_camera',
  fire_alarm: 'fire_alarm',
  utility_meter: 'utility_meter',
  weather_station: 'weather_station',
  tanker_tracker: 'tanker_tracker',
  car_wash: 'car_wash',
  air_compressor: 'air_compressor',
  vacuum_station: 'vacuum_station',
  atg: 'atg',
  price_board: 'price_board',
}

// =====================================================
// GET HANDLER
// =====================================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      // ────────────────────────────────────────────
      // CATALOG - Search the HardwareCatalog
      // ────────────────────────────────────────────
      case 'catalog': {
        const id = searchParams.get('id')
        if (id) {
          // Single catalog item
          const item = await db.hardwareCatalog.findUnique({
            where: { id },
          })
          if (!item) {
            return errorResponse('Catalog item not found', 404)
          }
          return NextResponse.json({ item })
        }

        // Search with filters
        const category = searchParams.get('category')
        const manufacturer = searchParams.get('manufacturer')
        const q = searchParams.get('q')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = { isActive: true }
        if (category) where.category = category
        if (manufacturer) where.manufacturer = { contains: manufacturer }
        if (q) {
          where.OR = [
            { modelName: { contains: q } },
            { manufacturer: { contains: q } },
            { description: { contains: q } },
            { modelCode: { contains: q } },
          ]
        }

        const [items, total] = await Promise.all([
          db.hardwareCatalog.findMany({
            where,
            orderBy: [
              { popularity: 'desc' },
              { manufacturer: 'asc' },
              { modelName: 'asc' },
            ],
            skip,
            take: limit,
          }),
          db.hardwareCatalog.count({ where }),
        ])

        return NextResponse.json({
          items,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        })
      }

      // ────────────────────────────────────────────
      // CONTROLLERS - List all ForecourtControllers
      // ────────────────────────────────────────────
      case 'controllers': {
        const id = searchParams.get('id')
        if (id) {
          // Single controller with dispensers, config, recent events
          const controller = await db.forecourtController.findUnique({
            where: { id },
            include: {
              station: { select: { id: true, name: true, code: true, city: true } },
              configs: { orderBy: { configKey: 'asc' } },
              eventLogs: {
                orderBy: { createdAt: 'desc' },
                take: 20,
              },
            },
          })
          if (!controller) {
            return errorResponse('Forecourt controller not found', 404)
          }

          // Fetch dispensers separately (avoids Prisma relation include issue)
          const controllerDispensers = await db.dispenser.findMany({
            where: { forecourtControllerId: id, isActive: true },
            include: {
              nozzles: {
                where: { isActive: true },
                orderBy: { nozzleNumber: 'asc' },
              },
            },
            orderBy: { pumpAddress: 'asc' },
          })

          return NextResponse.json({ controller, dispensers: controllerDispensers })
        }

        // List all controllers
        const stationId = searchParams.get('stationId')
        const status = searchParams.get('status')
        const controllerType = searchParams.get('controllerType')

        const where: Record<string, unknown> = { isActive: true }
        if (stationId) where.stationId = stationId
        if (status) where.status = status
        if (controllerType) where.controllerType = controllerType

        const controllers = await db.forecourtController.findMany({
          where,
          include: {
            station: { select: { id: true, name: true, code: true } },
          },
          orderBy: { name: 'asc' },
        })

        // Fetch all dispensers linked to these controllers in one query
        const controllerIds = controllers.map(c => c.id)
        const allDispensers = await db.dispenser.findMany({
          where: {
            forecourtControllerId: { in: controllerIds },
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            code: true,
            pumpAddress: true,
            nozzleCount: true,
            status: true,
            manufacturer: true,
            model: true,
            forecourtControllerId: true,
          },
          orderBy: { pumpAddress: 'asc' },
        })

        // Group dispensers by controller
        const dispensersByController = new Map<string, typeof allDispensers>()
        for (const d of allDispensers) {
          const cId = d.forecourtControllerId || 'unassigned'
          if (!dispensersByController.has(cId)) dispensersByController.set(cId, [])
          dispensersByController.get(cId)!.push(d)
        }

        // Attach dispensers to controllers
        const controllersWithDispensers = controllers.map(c => ({
          ...c,
          dispensers: dispensersByController.get(c.id) || [],
        }))

        // Stats
        const totalControllers = controllers.length
        const onlineControllers = controllers.filter(c => c.status === 'online').length
        const offlineControllers = controllers.filter(c => c.status === 'offline').length
        const errorControllers = controllers.filter(c => c.status === 'error').length

        return NextResponse.json({
          controllers: controllersWithDispensers,
          stats: {
            total: totalControllers,
            online: onlineControllers,
            offline: offlineControllers,
            error: errorControllers,
            totalDispensers: allDispensers.length,
          },
        })
      }

      // ────────────────────────────────────────────
      // DISPENSERS - List all dispensers
      // ────────────────────────────────────────────
      case 'dispensers': {
        const id = searchParams.get('id')
        if (id) {
          // Single dispenser with nozzles, controller info, config
          const dispenser = await db.dispenser.findUnique({
            where: { id },
            include: {
              station: { select: { id: true, name: true, code: true } },
              forecourtController: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  controllerType: true,
                  status: true,
                  manufacturer: true,
                  model: true,
                  ipAddress: true,
                  port: true,
                  protocol: true,
                },
              },
              nozzles: {
                where: { isActive: true },
                orderBy: { nozzleNumber: 'asc' },
              },
            },
          })
          if (!dispenser) {
            return errorResponse('Dispenser not found', 404)
          }

          // Get configs for dispenser
          const configs = await db.deviceConfig.findMany({
            where: { deviceType: 'dispenser', deviceId: id },
            orderBy: { configKey: 'asc' },
          })

          return NextResponse.json({ dispenser, configs })
        }

        // List all dispensers
        const stationId = searchParams.get('stationId')
        const status = searchParams.get('status')
        const manufacturer = searchParams.get('manufacturer')
        const controllerId = searchParams.get('controllerId')

        const where: Record<string, unknown> = { isActive: true }
        if (stationId) where.stationId = stationId
        if (status) where.status = status
        if (manufacturer) where.manufacturer = manufacturer
        if (controllerId) where.forecourtControllerId = controllerId

        const dispensers = await db.dispenser.findMany({
          where,
          include: {
            station: { select: { id: true, name: true, code: true } },
            forecourtController: {
              select: {
                id: true,
                name: true,
                code: true,
                controllerType: true,
                status: true,
              },
            },
            nozzles: {
              where: { isActive: true },
              select: {
                id: true,
                nozzleNumber: true,
                fuelType: true,
                fuelGrade: true,
                meterReading: true,
                status: true,
              },
              orderBy: { nozzleNumber: 'asc' },
            },
          },
          orderBy: [{ pumpLane: 'asc' }, { pumpAddress: 'asc' }],
        })

        // Stats
        const totalDispensers = dispensers.length
        const dispensersByStatus: Record<string, number> = {}
        for (const d of dispensers) {
          const s = (d as Record<string, unknown>).status as string
          dispensersByStatus[s] = (dispensersByStatus[s] || 0) + 1
        }

        return NextResponse.json({
          dispensers,
          stats: { total: totalDispensers, byStatus: dispensersByStatus },
        })
      }

      // ────────────────────────────────────────────
      // CONTROLLER PROFILES
      // ────────────────────────────────────────────
      case 'controller_profiles': {
        const controllerType = searchParams.get('controllerType')
        const where: Record<string, unknown> = { isActive: true }
        if (controllerType) where.controllerType = controllerType

        const profiles = await db.controllerProfile.findMany({
          where,
          orderBy: [{ manufacturer: 'asc' }, { modelName: 'asc' }],
        })

        return NextResponse.json({ profiles })
      }

      // ────────────────────────────────────────────
      // DISPENSER PROFILES
      // ────────────────────────────────────────────
      case 'dispenser_profiles': {
        const manufacturer = searchParams.get('manufacturer')
        const where: Record<string, unknown> = { isActive: true }
        if (manufacturer) where.manufacturer = manufacturer

        const profiles = await db.dispenserProfile.findMany({
          where,
          orderBy: [{ manufacturer: 'asc' }, { modelName: 'asc' }],
        })

        return NextResponse.json({ profiles })
      }

      // ────────────────────────────────────────────
      // ATG PROFILES
      // ────────────────────────────────────────────
      case 'atg_profiles': {
        const manufacturer = searchParams.get('manufacturer')
        const where: Record<string, unknown> = { isActive: true }
        if (manufacturer) where.manufacturer = manufacturer

        const profiles = await db.aTGProfile.findMany({
          where,
          orderBy: [{ manufacturer: 'asc' }, { modelName: 'asc' }],
        })

        return NextResponse.json({ profiles })
      }

      // ────────────────────────────────────────────
      // OVERVIEW - Dashboard overview
      // ────────────────────────────────────────────
      case 'overview': {
        try {
          // Simplified counts - use fewer parallel queries to avoid memory issues
          const controllerCount = await db.forecourtController.count({ where: { isActive: true } })
          const dispenserCount = await db.dispenser.count({ where: { isActive: true } })
          const paymentTerminalCount = await db.paymentTerminal.count({ where: { isActive: true } })
          const generatorCount = await db.generator.count({ where: { isActive: true } })
          const cameraCount = await db.surveillanceCamera.count({ where: { isActive: true } })
          const fireAlarmCount = await db.fireAlarmSystem.count({ where: { isActive: true } })

          const countsByCategory = {
            forecourt_controllers: controllerCount,
            dispensers: dispenserCount,
            payment_terminals: paymentTerminalCount,
            generators: generatorCount,
            surveillance_cameras: cameraCount,
            fire_alarm_systems: fireAlarmCount,
            utility_meters: await db.utilityMeter.count({ where: { isActive: true } }),
            weather_stations: await db.weatherStation.count({ where: { isActive: true } }),
            tanker_trackers: await db.tankerTracker.count({ where: { isActive: true } }),
            car_wash_systems: await db.carWashSystem.count({ where: { isActive: true } }),
            air_compressors: await db.airCompressor.count({ where: { isActive: true } }),
            vacuum_stations: await db.vacuumStation.count({ where: { isActive: true } }),
          }

          // Controller/dispenser stats
          const onlineControllers = await db.forecourtController.count({ where: { isActive: true, status: 'online' } })
          const offlineControllers = controllerCount - onlineControllers
          const idleDispensers = await db.dispenser.count({ where: { isActive: true, status: 'idle' } })
          const fuelingDispensers = await db.dispenser.count({ where: { isActive: true, status: 'fueling' } })

          // Recent events (limited)
          const recentEvents = await db.deviceEventLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 15,
          })

          // Pending commands
          const pendingCommands = await db.deviceCommandQueue.count({
            where: { status: 'queued' },
          })

          return NextResponse.json({
            countsByCategory,
            totalDevices: Object.values(countsByCategory).reduce((sum: number, c) => sum + c, 0),
            controllerStats: {
              online: onlineControllers,
              offline: offlineControllers,
              error: 0,
              total: controllerCount,
            },
            dispenserStats: {
              idle: idleDispensers,
              fueling: fuelingDispensers,
              error: 0,
              offline: dispenserCount - idleDispensers - fuelingDispensers,
              total: dispenserCount,
            },
            recentEvents,
            pendingCommands,
          })
        } catch (err) {
          console.error('Overview error:', err)
          return NextResponse.json({
            countsByCategory: {},
            totalDevices: 0,
            controllerStats: { online: 0, offline: 0, error: 0, total: 0 },
            dispenserStats: { idle: 0, fueling: 0, error: 0, offline: 0, total: 0 },
            recentEvents: [],
            pendingCommands: 0,
          })
        }
      }

      // ────────────────────────────────────────────
      // EVENT LOGS
      // ────────────────────────────────────────────
      case 'event_logs': {
        const deviceType = searchParams.get('deviceType')
        const deviceId = searchParams.get('deviceId')
        const severity = searchParams.get('severity')
        const eventType = searchParams.get('eventType')
        const stationId = searchParams.get('stationId')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {}
        if (stationId) where.stationId = stationId
        if (deviceType) where.deviceType = deviceType
        if (deviceId) where.deviceId = deviceId
        if (severity) where.severity = severity
        if (eventType) where.eventType = eventType

        const [logs, total] = await Promise.all([
          db.deviceEventLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          db.deviceEventLog.count({ where }),
        ])

        return NextResponse.json({
          logs,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        })
      }

      // ────────────────────────────────────────────
      // COMMAND QUEUE
      // ────────────────────────────────────────────
      case 'command_queue': {
        const deviceType = searchParams.get('deviceType')
        const deviceId = searchParams.get('deviceId')
        const status = searchParams.get('status')
        const priority = searchParams.get('priority')
        const stationId = searchParams.get('stationId')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {}
        if (stationId) where.stationId = stationId
        if (deviceType) where.deviceType = deviceType
        if (deviceId) where.deviceId = deviceId
        if (status) where.status = status
        if (priority) where.priority = priority

        const [commands, total] = await Promise.all([
          db.deviceCommandQueue.findMany({
            where,
            orderBy: [
              { priority: 'desc' },
              { createdAt: 'asc' },
            ],
            skip,
            take: limit,
          }),
          db.deviceCommandQueue.count({ where }),
        ])

        return NextResponse.json({
          commands,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        })
      }

      // ────────────────────────────────────────────
      // CONFIGS - Get device configs
      // ────────────────────────────────────────────
      case 'configs': {
        const deviceType = searchParams.get('deviceType')
        const deviceId = searchParams.get('deviceId')

        if (!deviceType || !deviceId) {
          return errorResponse('deviceType and deviceId are required')
        }

        const configs = await db.deviceConfig.findMany({
          where: { deviceType, deviceId },
          orderBy: { configKey: 'asc' },
        })

        return NextResponse.json({ configs })
      }

      // ────────────────────────────────────────────
      // SEARCH - Advanced search across all hardware
      // ────────────────────────────────────────────
      case 'search': {
        const q = searchParams.get('q')
        const category = searchParams.get('category')

        if (!q) {
          return errorResponse('Search query (q) is required')
        }

        const results: Record<string, unknown[]> = {}

        // Search catalog
        if (!category || category === 'catalog') {
          const catalogResults = await db.hardwareCatalog.findMany({
            where: {
              isActive: true,
              OR: [
                { modelName: { contains: q } },
                { manufacturer: { contains: q } },
                { description: { contains: q } },
                { modelCode: { contains: q } },
              ],
            },
            take: 20,
          })
          results.catalog = catalogResults
        }

        // Search controllers
        if (!category || category === 'controller') {
          const controllers = await db.forecourtController.findMany({
            where: {
              isActive: true,
              OR: [
                { name: { contains: q } },
                { code: { contains: q } },
                { manufacturer: { contains: q } },
                { model: { contains: q } },
                { controllerType: { contains: q } },
                { ipAddress: { contains: q } },
                { serialNumber: { contains: q } },
              ],
            },
            take: 20,
          })
          results.controllers = controllers
        }

        // Search dispensers
        if (!category || category === 'dispenser') {
          const dispensers = await db.dispenser.findMany({
            where: {
              isActive: true,
              OR: [
                { name: { contains: q } },
                { code: { contains: q } },
                { manufacturer: { contains: q } },
                { model: { contains: q } },
                { serialNumber: { contains: q } },
                { ipAddress: { contains: q } },
              ],
            },
            include: {
              forecourtController: {
                select: { id: true, name: true, code: true, controllerType: true, status: true },
              },
            },
            take: 20,
          })
          results.dispensers = dispensers
        }

        // Search other device types
        if (!category || CATEGORY_TO_DEVICE_TYPE[category || '']) {
          const typesToSearch = category
            ? [CATEGORY_TO_DEVICE_TYPE[category]].filter(Boolean)
            : ALL_DEVICE_TYPE_KEYS

          for (const dtKey of typesToSearch) {
            if (dtKey === 'forecourt_controller' || dtKey === 'dispenser') continue // Already handled above
            const info = DEVICE_TYPE_MAP.get(dtKey)
            if (!info) continue

            try {
              const devices = await info.getModel().findMany({
                where: {
                  isActive: true,
                  OR: [
                    { name: { contains: q } },
                    { code: { contains: q } },
                    { manufacturer: { contains: q } },
                    { model: { contains: q } },
                    { serialNumber: { contains: q } },
                  ],
                } as Record<string, unknown>,
                take: 20,
              })
              if (devices.length > 0) {
                results[dtKey] = devices as Record<string, unknown>[]
              }
            } catch {
              // Skip device types that might have query issues
            }
          }
        }

        return NextResponse.json({ results, query: q })
      }

      // ────────────────────────────────────────────
      // ATGS - List tanks with ATG info
      // ────────────────────────────────────────────
      case 'atgs': {
        const tanks = await db.tank.findMany({
          where: { isActive: true },
          include: { station: { select: { id: true, name: true, code: true } } },
          orderBy: { name: 'asc' },
        })
        const atgProfs = await db.aTGProfile.findMany({
          where: { isActive: true },
          orderBy: [{ manufacturer: 'asc' }, { modelName: 'asc' }],
        })
        return NextResponse.json({ tanks, atgProfiles: atgProfs })
      }

      // ────────────────────────────────────────────
      // PAYMENT_TERMINALS - List payment terminals
      // ────────────────────────────────────────────
      case 'payment_terminals': {
        const terminals = await db.paymentTerminal.findMany({
          where: { isActive: true },
          include: { station: { select: { id: true, name: true, code: true } } },
          orderBy: { name: 'asc' },
        })
        return NextResponse.json({ terminals })
      }

      // ────────────────────────────────────────────
      // GENERIC DEVICE TYPE LIST ACTIONS
      // ────────────────────────────────────────────
      case 'generators':
      case 'cameras':
      case 'fire_alarms':
      case 'utility_meters':
      case 'weather_stations':
      case 'tanker_trackers':
      case 'car_washes':
      case 'air_compressors':
      case 'vacuum_stations': {
        const deviceTypeKey = action === 'cameras' ? 'surveillance_camera'
          : action === 'fire_alarms' ? 'fire_alarm'
          : action === 'utility_meters' ? 'utility_meter'
          : action === 'weather_stations' ? 'weather_station'
          : action === 'tanker_trackers' ? 'tanker_tracker'
          : action === 'car_washes' ? 'car_wash'
          : action === 'air_compressors' ? 'air_compressor'
          : action === 'vacuum_stations' ? 'vacuum_station'
          : action
        const info = DEVICE_TYPE_MAP.get(deviceTypeKey)
        if (!info) return errorResponse(`Device type "${deviceTypeKey}" not found`, 400)
        const devices = await info.getModel().findMany({
          where: { isActive: true } as Record<string, unknown>,
          orderBy: { name: 'asc' },
        })
        return NextResponse.json({ devices })
      }

      // ────────────────────────────────────────────
      // COMMANDS - Alias for command_queue
      // ────────────────────────────────────────────
      case 'commands':
      case 'events': {
        const isEvents = action === 'events'
        const deviceType = searchParams.get('deviceType')
        const severity = searchParams.get('severity')
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        if (isEvents) {
          const where: Record<string, unknown> = {}
          if (deviceType) where.deviceType = deviceType
          if (severity) where.severity = severity

          const [logs, total] = await Promise.all([
            db.deviceEventLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
            db.deviceEventLog.count({ where }),
          ])
          return NextResponse.json({ logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
        } else {
          const where: Record<string, unknown> = {}
          if (deviceType) where.deviceType = deviceType
          if (status) where.status = status

          const [cmds, total] = await Promise.all([
            db.deviceCommandQueue.findMany({ where, orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }], skip, take: limit }),
            db.deviceCommandQueue.count({ where }),
          ])
          return NextResponse.json({ commands: cmds, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
        }
      }

      // ────────────────────────────────────────────
      // TEST_CONNECTION - GET alias (redirects to POST logic)
      // ────────────────────────────────────────────
      case 'test_connection': {
        const deviceType = searchParams.get('deviceType')
        const id = searchParams.get('id')
        if (!deviceType || !id) return errorResponse('deviceType and id are required')

        let device: Record<string, unknown> | null = null
        if (deviceType === 'forecourt_controller') {
          const dev = await db.forecourtController.findUnique({ where: { id } })
          if (!dev) return errorResponse('Device not found', 404)
          device = dev as unknown as Record<string, unknown>
        } else if (deviceType === 'dispenser') {
          const dev = await db.dispenser.findUnique({ where: { id } })
          if (!dev) return errorResponse('Device not found', 404)
          device = dev as unknown as Record<string, unknown>
        } else {
          const info = DEVICE_TYPE_MAP.get(deviceType)
          if (!info) return errorResponse(`Unknown device type: "${deviceType}"`)
          const dev = await info.getModel().findUnique({ where: { id } })
          if (!dev) return errorResponse('Device not found', 404)
          device = dev as Record<string, unknown>
        }

        const isReachable = ['online', 'idle', 'fueling', 'running', 'normal', 'recording'].includes(device.status as string)
        return NextResponse.json({
          success: true,
          testResult: {
            deviceId: id, deviceType,
            deviceName: device.name,
            status: device.status,
            ipAddress: device.ipAddress,
            port: device.port,
            communicationType: device.communicationType,
            reachable: !!isReachable,
            latency: isReachable ? Math.floor(Math.random() * 30 + 5) : 0,
            message: isReachable ? `Device "${device.name}" appears reachable (status: ${device.status})` : `Device "${device.name}" appears unreachable (status: ${device.status})`,
          },
        })
      }

      default:
        return errorResponse(
          `Unknown action: "${action}". Valid GET actions: catalog, controllers, dispensers, atgs, payment_terminals, generators, cameras, fire_alarms, utility_meters, weather_stations, tanker_trackers, car_washes, air_compressors, vacuum_stations, controller_profiles, dispenser_profiles, atg_profiles, overview, event_logs, events, command_queue, commands, configs, search, test_connection`,
          400
        )
    }
  } catch (error) {
    console.error('Hardware API GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// =====================================================
// POST HANDLER
// =====================================================

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      // ────────────────────────────────────────────
      // ADD_CONTROLLER - Create a new ForecourtController
      // ────────────────────────────────────────────
      case 'add_controller': {
        const { stationId, name, code, controllerType, manufacturer, model, serialNumber, firmwareVersion, communicationType, ipAddress, port, baudRate, comPort, protocol, pollingInterval, timeout, maxDispensers, configJson } = body

        if (!stationId || !name || !code || !controllerType) {
          return errorResponse('stationId, name, code, and controllerType are required')
        }

        // Verify station exists
        const station = await db.station.findUnique({ where: { id: stationId } })
        if (!station) {
          return errorResponse('Station not found', 404)
        }

        // Check for duplicate code
        const existing = await db.forecourtController.findFirst({
          where: { stationId, code },
        })
        if (existing) {
          return errorResponse(`Controller with code "${code}" already exists at this station`, 409)
        }

        const controller = await db.forecourtController.create({
          data: {
            stationId,
            name,
            code,
            controllerType,
            manufacturer,
            model,
            serialNumber,
            firmwareVersion,
            communicationType: communicationType || 'tcpip',
            ipAddress,
            port,
            baudRate,
            comPort,
            protocol,
            pollingInterval: pollingInterval || 1000,
            timeout: timeout || 5000,
            maxDispensers: maxDispensers || 32,
            connectedDispensers: 0,
            status: 'offline',
            isActive: true,
            configJson,
          },
          include: {
            station: { select: { id: true, name: true, code: true } },
            dispensers: true,
          },
        })

        // Log event
        await logDeviceEvent({
          stationId,
          deviceType: 'forecourt_controller',
          deviceId: controller.id,
          eventType: 'status_change',
          severity: 'info',
          message: `Forecourt controller "${name}" (${controllerType}) created and registered`,
          dataJson: JSON.stringify({ controllerType, ipAddress, port, protocol }),
        })

        return NextResponse.json({ controller }, { status: 201 })
      }

      // ────────────────────────────────────────────
      // ADD_DISPENSER - Create a new Dispenser linked to a controller
      // ────────────────────────────────────────────
      case 'add_dispenser': {
        const { stationId, name, code, manufacturer, model, serialNumber, forecourtControllerId, communicationType, ipAddress, port, pumpLane, pumpAddress, protocol, nozzleCount, flowRate, supportedFuels, firmwareVersion, configJson } = body

        if (!stationId || !name || !code) {
          return errorResponse('stationId, name, and code are required')
        }

        if (!forecourtControllerId) {
          return errorResponse('forecourtControllerId is required. All dispensers must be linked to a forecourt controller. ERP never communicates directly with pumps.')
        }

        // Verify controller exists and is active
        const controller = await db.forecourtController.findUnique({
          where: { id: forecourtControllerId },
        })
        if (!controller) {
          return errorResponse('Forecourt controller not found', 404)
        }
        if (!controller.isActive) {
          return errorResponse('Forecourt controller is inactive. Cannot add dispensers to an inactive controller.')
        }

        // Check controller capacity
        if (controller.connectedDispensers >= controller.maxDispensers) {
          return errorResponse(`Controller "${controller.name}" has reached its maximum capacity of ${controller.maxDispensers} dispensers`)
        }

        // Check for duplicate code
        const existing = await db.dispenser.findFirst({
          where: { stationId, code },
        })
        if (existing) {
          return errorResponse(`Dispenser with code "${code}" already exists at this station`, 409)
        }

        // Validate pump address within controller range
        if (pumpAddress && (pumpAddress < 1 || pumpAddress > controller.maxDispensers)) {
          return errorResponse(`pumpAddress must be between 1 and ${controller.maxDispensers}`)
        }

        // Validate protocol compatibility with controller
        if (protocol && controller.protocol) {
          const controllerProtocols = JSON.parse(controller.protocol || '[]')
          if (Array.isArray(controllerProtocols) && controllerProtocols.length > 0 && !controllerProtocols.includes(protocol)) {
            return errorResponse(`Protocol "${protocol}" is not supported by controller "${controller.name}". Supported protocols: ${controllerProtocols.join(', ')}`)
          }
        }

        const dispenser = await db.dispenser.create({
          data: {
            stationId,
            name,
            code,
            manufacturer,
            model,
            serialNumber,
            forecourtControllerId,
            communicationType: communicationType || 'tcpip',
            ipAddress,
            port,
            pumpLane: pumpLane || 1,
            pumpAddress,
            protocol,
            nozzleCount: nozzleCount || 2,
            flowRate,
            supportedFuels: typeof supportedFuels === 'object' ? JSON.stringify(supportedFuels) : supportedFuels,
            firmwareVersion,
            lastMeterReading: 0,
            status: 'idle',
            isActive: true,
            configJson,
          },
          include: {
            station: { select: { id: true, name: true, code: true } },
            forecourtController: {
              select: { id: true, name: true, code: true, controllerType: true, status: true },
            },
            nozzles: true,
          },
        })

        // Update controller's connected dispenser count
        await db.forecourtController.update({
          where: { id: forecourtControllerId },
          data: { connectedDispensers: { increment: 1 } },
        })

        // Log event
        await logDeviceEvent({
          stationId,
          deviceType: 'forecourt_controller',
          deviceId: forecourtControllerId,
          eventType: 'status_change',
          severity: 'info',
          message: `Dispenser "${name}" (pump address ${pumpAddress || 'N/A'}) added to controller "${controller.name}"`,
          dataJson: JSON.stringify({ dispenserId: dispenser.id, pumpAddress, manufacturer, model }),
        })

        return NextResponse.json({ dispenser }, { status: 201 })
      }

      // ────────────────────────────────────────────
      // ADD_HARDWARE - Generic add for any device type
      // ────────────────────────────────────────────
      case 'add_hardware': {
        const { category, stationId, name, code, ...rest } = body

        if (!category || !stationId || !name || !code) {
          return errorResponse('category, stationId, name, and code are required')
        }

        // Verify station exists
        const station = await db.station.findUnique({ where: { id: stationId } })
        if (!station) {
          return errorResponse('Station not found', 404)
        }

        // Handle dispenser specially (must have forecourtControllerId)
        if (category === 'dispenser') {
          if (!rest.forecourtControllerId) {
            return errorResponse('forecourtControllerId is required for dispensers. All dispensers must be linked to a forecourt controller.')
          }
          const controller = await db.forecourtController.findUnique({
            where: { id: rest.forecourtControllerId },
          })
          if (!controller) {
            return errorResponse('Forecourt controller not found', 404)
          }
        }

        const deviceTypeKey = CATEGORY_TO_DEVICE_TYPE[category]
        if (!deviceTypeKey) {
          return errorResponse(`Unknown category: "${category}". Valid categories: ${Object.keys(CATEGORY_TO_DEVICE_TYPE).join(', ')}`)
        }

        // Handle dispenser with special Prisma model
        if (category === 'dispenser') {
          const filteredData = filterAllowedFields({ name, code, ...rest }, 'forecourt_controller', false)
          const dispenserData: Record<string, unknown> = {
            stationId,
            name,
            code,
            status: 'idle',
            isActive: true,
            ...rest,
            supportedFuels: typeof rest.supportedFuels === 'object' ? JSON.stringify(rest.supportedFuels) : rest.supportedFuels,
          }
          const dispenser = await db.dispenser.create({
            data: dispenserData as Record<string, unknown>,
            include: {
              station: { select: { id: true, name: true, code: true } },
              forecourtController: {
                select: { id: true, name: true, code: true, controllerType: true, status: true },
              },
              nozzles: true,
            },
          })

          // Update controller count
          if (rest.forecourtControllerId) {
            await db.forecourtController.update({
              where: { id: rest.forecourtControllerId as string },
              data: { connectedDispensers: { increment: 1 } },
            })
          }

          return NextResponse.json({ device: dispenser, category }, { status: 201 })
        }

        // Handle other device types
        const info = DEVICE_TYPE_MAP.get(deviceTypeKey)
        if (!info) {
          return errorResponse(`Device type "${deviceTypeKey}" is not supported`)
        }

        const filteredData = filterAllowedFields(rest, deviceTypeKey)
        const createData: Record<string, unknown> = {
          stationId,
          name,
          code,
          status: rest.status || 'offline',
          isActive: true,
          ...filteredData,
        }

        const device = await info.getModel().create({ data: createData })

        // Log event
        await logDeviceEvent({
          stationId,
          deviceType: deviceTypeKey,
          deviceId: (device as Record<string, unknown>).id as string,
          eventType: 'status_change',
          severity: 'info',
          message: `${info.label.slice(0, -1)} "${name}" created and registered`,
          dataJson: JSON.stringify({ category, manufacturer: rest.manufacturer, model: rest.model }),
        })

        return NextResponse.json({ device, category }, { status: 201 })
      }

      // ────────────────────────────────────────────
      // UPDATE_DEVICE - Update any device
      // ────────────────────────────────────────────
      case 'update_device': {
        const { deviceType, id, ...updateFields } = body

        if (!deviceType || !id) {
          return errorResponse('deviceType and id are required')
        }

        // Handle forecourt_controller type
        if (deviceType === 'forecourt_controller') {
          const existing = await db.forecourtController.findUnique({ where: { id } })
          if (!existing) {
            return errorResponse('Forecourt controller not found', 404)
          }

          const filteredData = filterAllowedFields(updateFields, 'forecourt_controller')
          const controller = await db.forecourtController.update({
            where: { id },
            data: filteredData,
            include: {
              station: { select: { id: true, name: true } },
              dispensers: { where: { isActive: true }, select: { id: true, name: true, code: true, status: true } },
            },
          })

          await logDeviceEvent({
            stationId: existing.stationId,
            deviceType: 'forecourt_controller',
            deviceId: id,
            eventType: 'status_change',
            severity: 'info',
            message: `Forecourt controller "${existing.name}" updated`,
            dataJson: JSON.stringify({ updatedFields: Object.keys(filteredData) }),
          })

          return NextResponse.json({ device: controller })
        }

        // Handle dispenser type
        if (deviceType === 'dispenser') {
          const existing = await db.dispenser.findUnique({ where: { id } })
          if (!existing) {
            return errorResponse('Dispenser not found', 404)
          }

          const allowedDispenserFields = [
            'name', 'code', 'manufacturer', 'model', 'serialNumber', 'controllerType',
            'forecourtControllerId', 'communicationType', 'ipAddress', 'port',
            'pumpLane', 'pumpAddress', 'protocol', 'nozzleCount', 'flowRate',
            'supportedFuels', 'firmwareVersion', 'lastMeterReading', 'status',
            'isActive', 'lastCommunication', 'configJson',
          ]
          const filteredData: Record<string, unknown> = {}
          for (const key of allowedDispenserFields) {
            if (updateFields[key] !== undefined) {
              filteredData[key] = updateFields[key]
            }
          }

          // If changing forecourtControllerId, validate the new controller
          if (filteredData.forecourtControllerId && filteredData.forecourtControllerId !== existing.forecourtControllerId) {
            const newController = await db.forecourtController.findUnique({
              where: { id: filteredData.forecourtControllerId as string },
            })
            if (!newController) {
              return errorResponse('New forecourt controller not found', 404)
            }
          }

          if (filteredData.supportedFuels && typeof filteredData.supportedFuels === 'object') {
            filteredData.supportedFuels = JSON.stringify(filteredData.supportedFuels)
          }

          const dispenser = await db.dispenser.update({
            where: { id },
            data: filteredData,
            include: {
              station: { select: { id: true, name: true } },
              forecourtController: { select: { id: true, name: true, code: true, controllerType: true } },
              nozzles: { where: { isActive: true }, orderBy: { nozzleNumber: 'asc' } },
            },
          })

          return NextResponse.json({ device: dispenser })
        }

        // Handle other device types
        const info = DEVICE_TYPE_MAP.get(deviceType)
        if (!info) {
          return errorResponse(`Unknown device type: "${deviceType}". Valid types: ${ALL_DEVICE_TYPE_KEYS.join(', ')}`)
        }

        const existing = await info.getModel().findUnique({ where: { id } })
        if (!existing) {
          return errorResponse(`${info.label.slice(0, -1)} not found`, 404)
        }

        const filteredData = filterAllowedFields(updateFields, deviceType)
        const device = await info.getModel().update({
          where: { id },
          data: filteredData,
        })

        return NextResponse.json({ device })
      }

      // ────────────────────────────────────────────
      // REMOVE_DEVICE - Delete/deactivate a device
      // ────────────────────────────────────────────
      case 'remove_device': {
        const { deviceType, id, permanent } = body

        if (!deviceType || !id) {
          return errorResponse('deviceType and id are required')
        }

        // Handle forecourt_controller type - check for connected dispensers
        if (deviceType === 'forecourt_controller') {
          const controller = await db.forecourtController.findUnique({
            where: { id },
            include: { dispensers: { where: { isActive: true } } },
          })
          if (!controller) {
            return errorResponse('Forecourt controller not found', 404)
          }
          if (controller.dispensers.length > 0) {
            return errorResponse(
              `Cannot deactivate controller "${controller.name}" - it has ${controller.dispensers.length} active dispenser(s) connected. Please reassign or deactivate dispensers first.`,
              409
            )
          }

          if (permanent) {
            await db.forecourtController.delete({ where: { id } })
          } else {
            await db.forecourtController.update({
              where: { id },
              data: { isActive: false, status: 'offline' },
            })
          }

          await logDeviceEvent({
            stationId: controller.stationId,
            deviceType: 'forecourt_controller',
            deviceId: id,
            eventType: 'status_change',
            severity: 'warning',
            message: `Forecourt controller "${controller.name}" ${permanent ? 'permanently deleted' : 'deactivated'}`,
          })

          return NextResponse.json({ success: true, action: permanent ? 'deleted' : 'deactivated' })
        }

        // Handle dispenser type
        if (deviceType === 'dispenser') {
          const dispenser = await db.dispenser.findUnique({
            where: { id },
          })
          if (!dispenser) {
            return errorResponse('Dispenser not found', 404)
          }

          if (permanent) {
            await db.dispenser.delete({ where: { id } })
          } else {
            await db.dispenser.update({
              where: { id },
              data: { isActive: false, status: 'offline' },
            })
          }

          // Update controller's connected dispenser count
          if (dispenser.forecourtControllerId) {
            await db.forecourtController.update({
              where: { id: dispenser.forecourtControllerId },
              data: { connectedDispensers: { decrement: 1 } },
            })
          }

          return NextResponse.json({ success: true, action: permanent ? 'deleted' : 'deactivated' })
        }

        // Handle other device types
        const info = DEVICE_TYPE_MAP.get(deviceType)
        if (!info) {
          return errorResponse(`Unknown device type: "${deviceType}". Valid types: ${ALL_DEVICE_TYPE_KEYS.join(', ')}`)
        }

        const existing = await info.getModel().findUnique({ where: { id } })
        if (!existing) {
          return errorResponse(`${info.label.slice(0, -1)} not found`, 404)
        }

        if (permanent) {
          await info.getModel().delete({ where: { id } })
        } else {
          await info.getModel().update({
            where: { id },
            data: { isActive: false, status: 'offline' } as Record<string, unknown>,
          })
        }

        return NextResponse.json({ success: true, action: permanent ? 'deleted' : 'deactivated' })
      }

      // ────────────────────────────────────────────
      // SEND_COMMAND - Queue a command for a device
      // ────────────────────────────────────────────
      case 'send_command': {
        const { deviceType, deviceId, command, params, priority, maxRetries, createdBy } = body

        if (!deviceType || !deviceId || !command) {
          return errorResponse('deviceType, deviceId, and command are required')
        }

        // Get station ID from device
        let stationId: string | null = null
        if (deviceType === 'forecourt_controller') {
          const dev = await db.forecourtController.findUnique({ where: { id: deviceId } })
          if (!dev) return errorResponse('Forecourt controller not found', 404)
          stationId = dev.stationId
          if (dev.status === 'offline') {
            return errorResponse(`Controller "${dev.name}" is offline. Cannot send commands.`, 400)
          }
        } else if (deviceType === 'dispenser') {
          const dev = await db.dispenser.findUnique({ where: { id: deviceId } })
          if (!dev) return errorResponse('Dispenser not found', 404)
          stationId = dev.stationId
        } else {
          const info = DEVICE_TYPE_MAP.get(deviceType)
          if (!info) return errorResponse(`Unknown device type: "${deviceType}"`)
          const dev = await info.getModel().findUnique({ where: { id: deviceId } })
          if (!dev) return errorResponse('Device not found', 404)
          stationId = (dev as Record<string, unknown>).stationId as string
        }

        const entry = await createCommandEntry({
          stationId: stationId || '',
          deviceType,
          deviceId,
          command,
          parameters: params ? JSON.stringify(params) : null,
          priority: priority || 'normal',
          maxRetries: maxRetries || 3,
          retryCount: 0,
          createdBy: createdBy || null,
        })

        await logDeviceEvent({
          stationId: stationId || '',
          deviceType,
          deviceId,
          eventType: 'command',
          severity: 'info',
          message: `Command "${command}" queued for ${deviceType}`,
          dataJson: JSON.stringify({ command, params, priority }),
        })

        return NextResponse.json({ command: entry }, { status: 201 })
      }

      // ────────────────────────────────────────────
      // UPDATE_CONFIG - Set device configuration
      // ────────────────────────────────────────────
      case 'update_config': {
        const { deviceType, deviceId, key, value, dataType, description, isEditable, updatedBy } = body

        if (!deviceType || !deviceId || !key || value === undefined) {
          return errorResponse('deviceType, deviceId, key, and value are required')
        }

        // Check if config already exists
        const existing = await db.deviceConfig.findFirst({
          where: { deviceType, deviceId, configKey: key },
        })

        if (existing) {
          const config = await db.deviceConfig.update({
            where: { id: existing.id },
            data: {
              configValue: String(value),
              dataType: dataType || existing.dataType,
              description: description ?? existing.description,
              isEditable: isEditable ?? existing.isEditable,
              updatedBy: updatedBy || null,
            },
          })
          return NextResponse.json({ config })
        }

        // Create new config - handle FK constraint issues
        try {
          const config = await db.deviceConfig.create({
            data: {
              deviceType,
              deviceId,
              configKey: key,
              configValue: String(value),
              dataType: dataType || 'string',
              description: description || null,
              isEditable: isEditable !== undefined ? isEditable : true,
              updatedBy: updatedBy || null,
            },
          })
          return NextResponse.json({ config }, { status: 201 })
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
            // FK constraint - return virtual config
            return NextResponse.json({
              config: {
                id: 'virtual-' + Date.now(),
                deviceType,
                deviceId,
                configKey: key,
                configValue: String(value),
                dataType: dataType || 'string',
                description: description || null,
                isEditable: isEditable !== undefined ? isEditable : true,
                persisted: false,
                reason: 'FK constraint - config not persisted to database',
              },
            }, { status: 201 })
          }
          throw err
        }
      }

      // ────────────────────────────────────────────
      // AUTHORIZE_PUMP - Authorize a pump through its forecourt controller
      // Architecture: ERP → Forecourt Controller → Pump
      // ────────────────────────────────────────────
      case 'authorize_pump': {
        const { controllerId, pumpAddress, nozzleNumber, presetVolume, presetAmount, createdBy } = body

        if (!controllerId) {
          return errorResponse('controllerId is required. Pumps can only be authorized through their forecourt controller.')
        }
        if (!pumpAddress || pumpAddress < 1) {
          return errorResponse('pumpAddress is required and must be >= 1')
        }

        // Verify controller exists and is online
        const controller = await db.forecourtController.findUnique({
          where: { id: controllerId },
        })
        if (!controller) {
          return errorResponse('Forecourt controller not found', 404)
        }
        if (controller.status === 'offline') {
          return errorResponse(`Controller "${controller.name}" is offline. Cannot authorize pumps.`, 400)
        }
        if (controller.status === 'error') {
          return errorResponse(`Controller "${controller.name}" is in error state. Cannot authorize pumps.`, 400)
        }

        // Find the dispenser at this pump address on this controller
        const dispenser = await db.dispenser.findFirst({
          where: {
            forecourtControllerId: controllerId,
            pumpAddress,
            isActive: true,
          },
          include: {
            nozzles: { where: { isActive: true }, orderBy: { nozzleNumber: 'asc' } },
          },
        })

        if (!dispenser) {
          return errorResponse(`No active dispenser found at pump address ${pumpAddress} on controller "${controller.name}"`, 404)
        }

        // Check dispenser status
        if (dispenser.status === 'fueling') {
          return errorResponse(`Dispenser "${dispenser.name}" is currently fueling. Cannot authorize.`, 409)
        }
        if (dispenser.status === 'locked' || dispenser.status === 'maintenance') {
          return errorResponse(`Dispenser "${dispenser.name}" is ${dispenser.status}. Cannot authorize.`, 409)
        }

        // Validate nozzle
        if (nozzleNumber && nozzleNumber > dispenser.nozzleCount) {
          return errorResponse(`Nozzle number ${nozzleNumber} exceeds dispenser's nozzle count of ${dispenser.nozzleCount}`)
        }

        // Build command parameters
        const commandParams: Record<string, unknown> = {
          pumpAddress,
          nozzleNumber: nozzleNumber || 0, // 0 = any nozzle
        }
        if (presetVolume) commandParams.presetVolume = presetVolume
        if (presetAmount) commandParams.presetAmount = presetAmount

        // Queue command to the CONTROLLER (not the dispenser)
        const command = await createCommandEntry({
          stationId: controller.stationId,
          deviceType: 'forecourt_controller',
          deviceId: controllerId,
          command: 'authorize_pump',
          parameters: JSON.stringify(commandParams),
          priority: 'high',
          maxRetries: 3,
          retryCount: 0,
          createdBy: createdBy || null,
        })

        // Log events
        await logDeviceEvent({
          stationId: controller.stationId,
          deviceType: 'forecourt_controller',
          deviceId: controllerId,
          eventType: 'command',
          severity: 'info',
          message: `Pump authorization sent via controller "${controller.name}" for pump address ${pumpAddress}`,
          dataJson: JSON.stringify(commandParams),
        })

        await logDeviceEvent({
          stationId: dispenser.stationId,
          deviceType: 'dispenser',
          deviceId: dispenser.id,
          eventType: 'command',
          severity: 'info',
          message: `Dispenser "${dispenser.name}" authorization requested via controller "${controller.name}"`,
          dataJson: JSON.stringify(commandParams),
        })

        return NextResponse.json({
          success: true,
          message: `Authorization command queued for pump address ${pumpAddress} via controller "${controller.name}"`,
          command,
          dispenser: { id: dispenser.id, name: dispenser.name, code: dispenser.code, status: dispenser.status },
          controller: { id: controller.id, name: controller.name, controllerType: controller.controllerType },
        }, { status: 201 })
      }

      // ────────────────────────────────────────────
      // STOP_PUMP - Stop a pump through its forecourt controller
      // Architecture: ERP → Forecourt Controller → Pump
      // ────────────────────────────────────────────
      case 'stop_pump': {
        const { controllerId, pumpAddress, createdBy } = body

        if (!controllerId) {
          return errorResponse('controllerId is required. Pumps can only be stopped through their forecourt controller.')
        }
        if (!pumpAddress || pumpAddress < 1) {
          return errorResponse('pumpAddress is required and must be >= 1')
        }

        // Verify controller exists
        const controller = await db.forecourtController.findUnique({
          where: { id: controllerId },
        })
        if (!controller) {
          return errorResponse('Forecourt controller not found', 404)
        }

        // Find the dispenser
        const dispenser = await db.dispenser.findFirst({
          where: {
            forecourtControllerId: controllerId,
            pumpAddress,
            isActive: true,
          },
        })

        if (!dispenser) {
          return errorResponse(`No active dispenser found at pump address ${pumpAddress} on controller "${controller.name}"`, 404)
        }

        // Queue stop command to the CONTROLLER
        const command = await createCommandEntry({
          stationId: controller.stationId,
          deviceType: 'forecourt_controller',
          deviceId: controllerId,
          command: 'stop_pump',
          parameters: JSON.stringify({ pumpAddress }),
          priority: 'urgent',
          maxRetries: 5,
          retryCount: 0,
          createdBy: createdBy || null,
        })

        // Log events
        await logDeviceEvent({
          stationId: controller.stationId,
          deviceType: 'forecourt_controller',
          deviceId: controllerId,
          eventType: 'command',
          severity: 'warning',
          message: `Stop command sent via controller "${controller.name}" for pump address ${pumpAddress}`,
          dataJson: JSON.stringify({ pumpAddress }),
        })

        await logDeviceEvent({
          stationId: dispenser.stationId,
          deviceType: 'dispenser',
          deviceId: dispenser.id,
          eventType: 'command',
          severity: 'warning',
          message: `Dispenser "${dispenser.name}" stop requested via controller "${controller.name}"`,
          dataJson: JSON.stringify({ pumpAddress }),
        })

        return NextResponse.json({
          success: true,
          message: `Stop command queued for pump address ${pumpAddress} via controller "${controller.name}"`,
          command,
          dispenser: { id: dispenser.id, name: dispenser.name, code: dispenser.code, status: dispenser.status },
          controller: { id: controller.id, name: controller.name, controllerType: controller.controllerType },
        }, { status: 201 })
      }

      // ────────────────────────────────────────────
      // CHANGE_PRICE - Change price on a pump via controller
      // Architecture: ERP → Forecourt Controller → Pump
      // ────────────────────────────────────────────
      case 'change_price': {
        const { controllerId, pumpAddress, fuelType, newPrice, createdBy } = body

        if (!controllerId) {
          return errorResponse('controllerId is required. Price changes must go through the forecourt controller.')
        }
        if (!pumpAddress || pumpAddress < 1) {
          return errorResponse('pumpAddress is required and must be >= 1')
        }
        if (!fuelType) {
          return errorResponse('fuelType is required')
        }
        if (!newPrice || newPrice <= 0) {
          return errorResponse('newPrice is required and must be > 0')
        }

        // Verify controller exists
        const controller = await db.forecourtController.findUnique({
          where: { id: controllerId },
        })
        if (!controller) {
          return errorResponse('Forecourt controller not found', 404)
        }

        // Find the dispenser
        const dispenser = await db.dispenser.findFirst({
          where: {
            forecourtControllerId: controllerId,
            pumpAddress,
            isActive: true,
          },
          include: {
            nozzles: {
              where: { fuelType, isActive: true },
            },
          },
        })

        if (!dispenser) {
          return errorResponse(`No active dispenser found at pump address ${pumpAddress} with fuel type "${fuelType}" on controller "${controller.name}"`, 404)
        }

        // Queue price change command to the CONTROLLER
        const command = await createCommandEntry({
          stationId: controller.stationId,
          deviceType: 'forecourt_controller',
          deviceId: controllerId,
          command: 'change_price',
          parameters: JSON.stringify({
            pumpAddress,
            fuelType,
            newPrice: parseFloat(String(newPrice)),
          }),
          priority: 'high',
          maxRetries: 3,
          retryCount: 0,
          createdBy: createdBy || null,
        })

        // Log events
        await logDeviceEvent({
          stationId: controller.stationId,
          deviceType: 'forecourt_controller',
          deviceId: controllerId,
          eventType: 'command',
          severity: 'info',
          message: `Price change command sent via controller "${controller.name}" for pump address ${pumpAddress}, ${fuelType}: ${newPrice}`,
          dataJson: JSON.stringify({ pumpAddress, fuelType, newPrice }),
        })

        await logDeviceEvent({
          stationId: dispenser.stationId,
          deviceType: 'dispenser',
          deviceId: dispenser.id,
          eventType: 'command',
          severity: 'info',
          message: `Price change for ${fuelType} on dispenser "${dispenser.name}" via controller "${controller.name}": ${newPrice}`,
          dataJson: JSON.stringify({ fuelType, newPrice }),
        })

        return NextResponse.json({
          success: true,
          message: `Price change command queued for pump address ${pumpAddress} (${fuelType}: ${newPrice}) via controller "${controller.name}"`,
          command,
          dispenser: { id: dispenser.id, name: dispenser.name, code: dispenser.code },
          controller: { id: controller.id, name: controller.name, controllerType: controller.controllerType },
        }, { status: 201 })
      }

      // ────────────────────────────────────────────
      // TEST_CONNECTION - Test device connectivity
      // ────────────────────────────────────────────
      case 'test_connection': {
        const { deviceType, id } = body

        if (!deviceType || !id) {
          return errorResponse('deviceType and id are required')
        }

        let device: Record<string, unknown> | null = null
        let stationId: string | null = null

        if (deviceType === 'forecourt_controller') {
          const dev = await db.forecourtController.findUnique({ where: { id } })
          if (!dev) return errorResponse('Forecourt controller not found', 404)
          device = dev as unknown as Record<string, unknown>
          stationId = dev.stationId
        } else if (deviceType === 'dispenser') {
          const dev = await db.dispenser.findUnique({ where: { id } })
          if (!dev) return errorResponse('Dispenser not found', 404)
          device = dev as unknown as Record<string, unknown>
          stationId = dev.stationId
        } else {
          const info = DEVICE_TYPE_MAP.get(deviceType)
          if (!info) return errorResponse(`Unknown device type: "${deviceType}"`)
          const dev = await info.getModel().findUnique({ where: { id } })
          if (!dev) return errorResponse('Device not found', 404)
          device = dev as Record<string, unknown>
          stationId = (dev as Record<string, unknown>).stationId as string
        }

        // Queue test connection command
        const command = await createCommandEntry({
          stationId: stationId || '',
          deviceType,
          deviceId: id,
          command: 'test_connection',
          parameters: JSON.stringify({
            ipAddress: device.ipAddress,
            port: device.port,
            communicationType: device.communicationType,
          }),
          priority: 'normal',
          maxRetries: 1,
          retryCount: 0,
          createdBy: null,
        })

        // Log event
        await logDeviceEvent({
          stationId: stationId || '',
          deviceType,
          deviceId: id,
          eventType: 'command',
          severity: 'info',
          message: `Connection test initiated for ${deviceType} "${device.name}"`,
          dataJson: JSON.stringify({ ipAddress: device.ipAddress, port: device.port }),
        })

        // Simulate connection test result
        const isReachable = device.status === 'online' || device.status === 'idle' || device.status === 'fueling' || device.status === 'running' || device.status === 'normal' || device.status === 'recording'

        return NextResponse.json({
          success: true,
          testResult: {
            deviceId: id,
            deviceType,
            deviceName: device.name,
            status: device.status,
            ipAddress: device.ipAddress,
            port: device.port,
            communicationType: device.communicationType,
            reachable: !!isReachable,
            lastCommunication: device.lastCommunication || device.lastHeartbeat || device.lastReading,
            message: isReachable
              ? `Device "${device.name}" appears reachable (current status: ${device.status})`
              : `Device "${device.name}" appears unreachable (current status: ${device.status})`,
          },
          command,
        })
      }

      // ────────────────────────────────────────────
      // SEED_CATALOG - Populate HardwareCatalog and ControllerProfile
      // ────────────────────────────────────────────
      case 'seed_catalog': {
        const stationId = await getFirstStationId()
        let catalogCreated = 0
        let controllersCreated = 0
        let dispenserProfilesCreated = 0

        // Seed ControllerProfiles
        for (const cp of SUPPORTED_FORECOURT_CONTROLLERS) {
          const existing = await db.controllerProfile.findFirst({
            where: { manufacturer: cp.manufacturer, modelName: cp.modelName },
          })
          if (!existing) {
            await db.controllerProfile.create({
              data: {
                manufacturer: cp.manufacturer,
                modelName: cp.modelName,
                controllerType: cp.controllerType,
                supportedProtocols: cp.supportedProtocols,
                supportedDispensers: cp.supportedDispensers,
                maxDispensers: cp.maxDispensers,
                maxNozzlesPerPump: cp.maxNozzlesPerPump,
                communicationTypes: cp.communicationTypes,
                defaultPort: cp.defaultPort,
                defaultPollingMs: cp.defaultPollingMs,
                features: cp.features,
                atgSupport: cp.atgSupport,
                atgBrands: cp.atgBrands,
                paymentIntegration: cp.paymentIntegration,
                mqttSupport: cp.mqttSupport,
                notes: cp.notes,
                isActive: true,
              },
            })
            controllersCreated++
          }
        }

        // Seed HardwareCatalog with dispensers
        for (const d of SUPPORTED_DISPENSERS) {
          const existing = await db.hardwareCatalog.findFirst({
            where: { category: d.category, manufacturer: d.manufacturer, modelName: d.modelName },
          })
          if (!existing) {
            await db.hardwareCatalog.create({
              data: {
                category: d.category,
                manufacturer: d.manufacturer,
                modelName: d.modelName,
                hardwareType: d.hardwareType,
                supportedFuels: d.supportedFuels,
                communicationTypes: d.communicationTypes,
                protocols: d.protocols,
                maxNozzles: d.maxNozzles,
                flowRate: d.flowRate,
                compatibleControllers: d.compatibleControllers,
                specifications: d.specifications,
                isActive: true,
                isVerified: true,
                popularity: d.manufacturer === 'gilbarco' || d.manufacturer === 'wayne' || d.manufacturer === 'tatsuno' ? 100 : 50,
              },
            })
            catalogCreated++
          }
        }

        // Seed HardwareCatalog with controllers
        for (const c of SUPPORTED_FORECOURT_CONTROLLERS) {
          const existing = await db.hardwareCatalog.findFirst({
            where: { category: 'controller', manufacturer: c.manufacturer, modelName: c.modelName },
          })
          if (!existing) {
            await db.hardwareCatalog.create({
              data: {
                category: 'controller',
                manufacturer: c.manufacturer,
                modelName: c.modelName,
                hardwareType: c.controllerType,
                supportedFuels: c.supportedDispensers,
                communicationTypes: c.communicationTypes,
                protocols: c.supportedProtocols,
                maxNozzles: c.maxNozzlesPerPump,
                specifications: JSON.stringify({
                  maxDispensers: c.maxDispensers,
                  maxNozzlesPerPump: c.maxNozzlesPerPump,
                  defaultPort: c.defaultPort,
                  defaultPollingMs: c.defaultPollingMs,
                  atgSupport: c.atgSupport,
                  paymentIntegration: c.paymentIntegration,
                  mqttSupport: c.mqttSupport,
                }),
                compatibleControllers: null,
                isActive: true,
                isVerified: true,
                popularity: c.manufacturer === 'pts' ? 200 : 80,
              },
            })
            catalogCreated++
          }
        }

        // Seed ATG entries into HardwareCatalog
        const atgEntries = [
          { manufacturer: 'veeder_root', modelName: 'TLS-450 Plus', atgType: 'magnetostrictive', maxProbes: 8, communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocol: 'ifsf', features: JSON.stringify(['leak_detection', 'overfill', 'water_detection', 'temperature']), popularity: 200 },
          { manufacturer: 'veeder_root', modelName: 'TLS-350', atgType: 'magnetostrictive', maxProbes: 8, communicationTypes: JSON.stringify(['tcpip', 'rs485', 'rs232']), protocol: 'ifsf', features: JSON.stringify(['leak_detection', 'overfill', 'water_detection', 'temperature']), popularity: 150 },
          { manufacturer: 'opw', modelName: 'SiteSentinel iSite', atgType: 'magnetostrictive', maxProbes: 16, communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocol: 'ifsf', features: JSON.stringify(['leak_detection', 'overfill', 'water_detection', 'temperature', 'statistical_inventory']), popularity: 160 },
          { manufacturer: 'franklin', modelName: 'Franklin Fueling TS-550', atgType: 'magnetostrictive', maxProbes: 8, communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocol: 'ifsf', features: JSON.stringify(['leak_detection', 'overfill', 'water_detection', 'temperature']), popularity: 120 },
          { manufacturer: 'hectronic', modelName: 'Hectronic Tank Control', atgType: 'capacitive', maxProbes: 6, communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocol: 'ifsf', features: JSON.stringify(['leak_detection', 'water_detection', 'temperature']), popularity: 80 },
        ]

        for (const atg of atgEntries) {
          const existing = await db.hardwareCatalog.findFirst({
            where: { category: 'atg', manufacturer: atg.manufacturer, modelName: atg.modelName },
          })
          if (!existing) {
            await db.hardwareCatalog.create({
              data: {
                category: 'atg',
                manufacturer: atg.manufacturer,
                modelName: atg.modelName,
                hardwareType: atg.atgType,
                communicationTypes: atg.communicationTypes,
                protocols: JSON.stringify([atg.protocol]),
                maxNozzles: atg.maxProbes,
                specifications: JSON.stringify({ atgType: atg.atgType, maxProbes: atg.maxProbes }),
                compatibleATGs: null,
                isActive: true,
                isVerified: true,
                popularity: atg.popularity,
              },
            })
            catalogCreated++
          }

          // Also seed ATGProfile
          const existingProfile = await db.aTGProfile.findFirst({
            where: { manufacturer: atg.manufacturer, modelName: atg.modelName },
          })
          if (!existingProfile) {
            await db.aTGProfile.create({
              data: {
                manufacturer: atg.manufacturer,
                modelName: atg.modelName,
                atgType: atg.atgType,
                maxProbes: atg.maxProbes,
                communicationTypes: atg.communicationTypes,
                protocol: atg.protocol,
                features: atg.features,
                isActive: true,
              },
            })
            dispenserProfilesCreated++
          }
        }

        // Seed DispenserProfiles
        for (const d of SUPPORTED_DISPENSERS) {
          const existing = await db.dispenserProfile.findFirst({
            where: { manufacturer: d.manufacturer, modelName: d.modelName },
          })
          if (!existing) {
            await db.dispenserProfile.create({
              data: {
                manufacturer: d.manufacturer,
                modelName: d.modelName,
                pumpTypes: JSON.stringify([d.hardwareType]),
                supportedFuels: d.supportedFuels,
                maxNozzles: d.maxNozzles,
                flowRate: d.flowRate,
                protocol: d.protocols ? JSON.parse(d.protocols)[0] || null : null,
                communicationTypes: d.communicationTypes,
                isActive: true,
              },
            })
            dispenserProfilesCreated++
          }
        }

        // Seed additional hardware categories into HardwareCatalog
        const additionalHardware = [
          // Payment Terminals
          { category: 'payment_terminal', manufacturer: 'ingenico', modelName: 'iCT250', hardwareType: 'pos', communicationTypes: JSON.stringify(['tcpip', 'rs232']), protocols: JSON.stringify(['iso8583']), specifications: JSON.stringify({ type: 'Countertop', cards: 'EMV, Contactless', display: 'Color LCD' }), popularity: 150 },
          { category: 'payment_terminal', manufacturer: 'verifone', modelName: 'Vx520', hardwareType: 'pos', communicationTypes: JSON.stringify(['tcpip', 'rs232']), protocols: JSON.stringify(['iso8583']), specifications: JSON.stringify({ type: 'Countertop', cards: 'EMV, Contactless' }), popularity: 140 },
          { category: 'payment_terminal', manufacturer: 'pax', modelName: 'A920', hardwareType: 'mpos', communicationTypes: JSON.stringify(['tcpip', 'wifi', 'bluetooth']), protocols: JSON.stringify(['iso8583']), specifications: JSON.stringify({ type: 'Mobile', cards: 'EMV, Contactless, NFC, QR' }), popularity: 120 },
          { category: 'payment_terminal', manufacturer: 'nexgo', modelName: 'N5', hardwareType: 'self_checkout', communicationTypes: JSON.stringify(['tcpip']), protocols: JSON.stringify(['iso8583']), specifications: JSON.stringify({ type: 'Self-checkout', cards: 'EMV, Contactless, NFC, QR' }), popularity: 100 },

          // Generators
          { category: 'generator', manufacturer: 'cummins', modelName: 'C200 D5', hardwareType: 'diesel', communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['modbus']), specifications: JSON.stringify({ capacity: '200 kVA', fuelType: 'Diesel', phase: '3-phase' }), popularity: 150 },
          { category: 'generator', manufacturer: 'caterpillar', modelName: 'C15 500 kVA', hardwareType: 'diesel', communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['modbus', 'snmp']), specifications: JSON.stringify({ capacity: '500 kVA', fuelType: 'Diesel', phase: '3-phase' }), popularity: 130 },
          { category: 'generator', manufacturer: 'perkins', modelName: '1106A-E66TA', hardwareType: 'diesel', communicationTypes: JSON.stringify(['rs485']), protocols: JSON.stringify(['modbus']), specifications: JSON.stringify({ capacity: '250 kVA', fuelType: 'Diesel' }), popularity: 110 },

          // Surveillance Cameras
          { category: 'camera', manufacturer: 'hikvision', modelName: 'DS-2CD2143G2-I', hardwareType: 'dome', communicationTypes: JSON.stringify(['tcpip']), protocols: JSON.stringify(['onvif', 'rtsp']), specifications: JSON.stringify({ resolution: '4MP', nightVision: true, analytics: 'AcuSense' }), popularity: 160 },
          { category: 'camera', manufacturer: 'dahua', modelName: 'IPC-HDW5442T-ZE', hardwareType: 'dome', communicationTypes: JSON.stringify(['tcpip']), protocols: JSON.stringify(['onvif', 'rtsp']), specifications: JSON.stringify({ resolution: '4MP', nightVision: true, analytics: 'AI SMD' }), popularity: 140 },
          { category: 'camera', manufacturer: 'axis', modelName: 'P3245-V', hardwareType: 'dome', communicationTypes: JSON.stringify(['tcpip']), protocols: JSON.stringify(['onvif', 'rtsp']), specifications: JSON.stringify({ resolution: '1080p', nightVision: true, analytics: 'Object Analytics' }), popularity: 130 },

          // Fire Alarm Systems
          { category: 'fire_alarm', manufacturer: 'honeywell', modelName: 'XLS100', hardwareType: 'addressable', communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['modbus']), specifications: JSON.stringify({ zones: 64, detectors: 252, type: 'Addressable' }), popularity: 140 },
          { category: 'fire_alarm', manufacturer: 'siemens', modelName: 'Cerberus PRO FC20', hardwareType: 'analog_addressable', communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['modbus', 'bacnet']), specifications: JSON.stringify({ zones: 512, detectors: 2032, type: 'Analog Addressable' }), popularity: 130 },

          // Utility Meters
          { category: 'utility_meter', manufacturer: 'abb', modelName: 'A44/B44', hardwareType: 'electricity', communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['modbus', 'dlms']), specifications: JSON.stringify({ type: 'Electricity', accuracy: '0.5S', display: 'LCD' }), popularity: 130 },
          { category: 'utility_meter', manufacturer: 'siemens', modelName: 'PAC4200', hardwareType: 'electricity', communicationTypes: JSON.stringify(['tcpip', 'rs485']), protocols: JSON.stringify(['modbus', 'snmp']), specifications: JSON.stringify({ type: 'Electricity', accuracy: '0.2S' }), popularity: 120 },
          { category: 'utility_meter', manufacturer: 'landis_gyr', modelName: 'E450', hardwareType: 'electricity', communicationTypes: JSON.stringify(['tcpip', 'gsm']), protocols: JSON.stringify(['dlms', 'mqtt']), specifications: JSON.stringify({ type: 'Electricity', smartMeter: true }), popularity: 110 },

          // Weather Stations
          { category: 'weather_station', manufacturer: 'davis', modelName: 'Vantage Pro2', hardwareType: 'professional', communicationTypes: JSON.stringify(['tcpip', 'rs232', 'usb']), protocols: JSON.stringify(['http', 'mqtt']), specifications: JSON.stringify({ sensors: 'Temp, Humidity, Wind, Rain, UV', wireless: true }), popularity: 150 },
          { category: 'weather_station', manufacturer: 'vaisala', modelName: 'WXT536', hardwareType: 'industrial', communicationTypes: JSON.stringify(['tcpip', 'rs485', 'rs232']), protocols: JSON.stringify(['modbus', 'mqtt', 'http']), specifications: JSON.stringify({ sensors: 'Temp, Humidity, Wind, Rain, Pressure', industrial: true }), popularity: 130 },
        ]

        for (const hw of additionalHardware) {
          const existing = await db.hardwareCatalog.findFirst({
            where: { category: hw.category, manufacturer: hw.manufacturer, modelName: hw.modelName },
          })
          if (!existing) {
            await db.hardwareCatalog.create({
              data: {
                category: hw.category,
                manufacturer: hw.manufacturer,
                modelName: hw.modelName,
                hardwareType: hw.hardwareType,
                communicationTypes: hw.communicationTypes,
                protocols: hw.protocols,
                specifications: hw.specifications,
                isActive: true,
                isVerified: true,
                popularity: hw.popularity,
              },
            })
            catalogCreated++
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Hardware catalog seeded successfully',
          results: {
            controllerProfilesCreated: controllersCreated,
            catalogItemsCreated: catalogCreated,
            dispenserProfilesCreated: dispenserProfilesCreated,
            totalControllerProfiles: SUPPORTED_FORECOURT_CONTROLLERS.length,
            totalCatalogDispensers: SUPPORTED_DISPENSERS.length,
            totalCatalogControllers: SUPPORTED_FORECOURT_CONTROLLERS.length,
            totalATGs: atgEntries.length,
            totalAdditionalHardware: additionalHardware.length,
          },
        }, { status: 201 })
      }

      // ────────────────────────────────────────────
      // ALIASES - Frontend-friendly action names
      // ────────────────────────────────────────────
      case 'create_controller': {
        // Auto-fill stationId and code if not provided
        if (!body.stationId) {
          const station = await db.station.findFirst({ select: { id: true } })
          if (station) body.stationId = station.id
        }
        if (!body.code) {
          body.code = (body.name as string || 'CTRL').toUpperCase().replace(/\s+/g, '_') + '_' + Date.now().toString(36).toUpperCase()
        }
        body.action = 'add_controller'
        return POST(request)
      }
      case 'create_dispenser': {
        // Auto-fill stationId and code if not provided
        if (!body.stationId) {
          const station = await db.station.findFirst({ select: { id: true } })
          if (station) body.stationId = station.id
        }
        if (!body.code) {
          body.code = (body.name as string || 'DSP').toUpperCase().replace(/\s+/g, '_') + '_' + Date.now().toString(36).toUpperCase()
        }
        body.action = 'add_dispenser'
        return POST(request)
      }
      case 'create_payment_terminal': {
        // Add payment terminal directly
        let { stationId, name, code, terminalType, manufacturer, model, serialNumber,
                firmwareVersion, communicationType, ipAddress, port, comPort, protocol,
                merchantId, terminalId, supportedCards, supportedMethods } = body

        if (!name) return errorResponse('name is required')
        if (!stationId) {
          const station = await db.station.findFirst({ select: { id: true } })
          if (station) stationId = station.id
        }
        if (!code) {
          code = (name || 'TERM').toUpperCase().replace(/\s+/g, '_') + '_' + Date.now().toString(36).toUpperCase()
        }
        if (!stationId) return errorResponse('No station available')

        const terminal = await db.paymentTerminal.create({
          data: {
            stationId, name, code,
            terminalType: terminalType || 'pos',
            manufacturer, model, serialNumber, firmwareVersion,
            communicationType: communicationType || 'tcpip',
            ipAddress, port, comPort, protocol,
            merchantId, terminalId,
            supportedCards: typeof supportedCards === 'object' ? JSON.stringify(supportedCards) : supportedCards,
            supportedMethods: typeof supportedMethods === 'object' ? JSON.stringify(supportedMethods) : supportedMethods,
            status: 'offline',
            isActive: true,
          },
        })
        return NextResponse.json({ terminal }, { status: 201 })
      }
      case 'update_controller': {
        body.deviceType = 'forecourt_controller'
        body.action = 'update_device'
        return POST(request)
      }
      case 'update_payment_terminal': {
        const { id, ...updateFields } = body
        if (!id) return errorResponse('id is required')

        const allowed = ['name', 'code', 'terminalType', 'manufacturer', 'model', 'serialNumber',
          'firmwareVersion', 'communicationType', 'ipAddress', 'port', 'comPort', 'protocol',
          'merchantId', 'terminalId', 'supportedCards', 'supportedMethods', 'status', 'isActive']
        const filteredData: Record<string, unknown> = {}
        for (const key of allowed) {
          if (updateFields[key] !== undefined) filteredData[key] = updateFields[key]
        }

        const terminal = await db.paymentTerminal.update({ where: { id }, data: filteredData })
        return NextResponse.json({ terminal })
      }
      case 'deactivate_controller': {
        body.deviceType = 'forecourt_controller'
        body.action = 'remove_device'
        return POST(request)
      }

      default:
        return errorResponse(
          `Unknown action: "${action}". Valid POST actions: add_controller, add_dispenser, add_hardware, update_device, remove_device, send_command, update_config, authorize_pump, stop_pump, change_price, test_connection, seed_catalog, create_controller, create_dispenser, create_payment_terminal, update_controller, update_payment_terminal, deactivate_controller`,
          400
        )
    }
  } catch (error) {
    console.error('Hardware API POST error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return errorResponse('A record with this unique constraint already exists', 409, { meta: error.meta })
      }
      if (error.code === 'P2003') {
        return errorResponse('Foreign key constraint failed - referenced record not found', 400, { meta: error.meta })
      }
      if (error.code === 'P2025') {
        return errorResponse('Record not found', 404)
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// =====================================================
// DELETE HANDLER
// =====================================================

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const id = searchParams.get('id')

    if (!id) return errorResponse('id is required', 400)

    switch (action) {
      case 'payment_terminal': {
        const terminal = await db.paymentTerminal.findUnique({ where: { id } })
        if (!terminal) return errorResponse('Payment terminal not found', 404)
        await db.paymentTerminal.update({ where: { id }, data: { isActive: false, status: 'offline' } })
        return NextResponse.json({ success: true, action: 'deactivated' })
      }
      case 'command': {
        await db.deviceCommandQueue.delete({ where: { id } }).catch(() => {})
        return NextResponse.json({ success: true, action: 'deleted' })
      }
      case 'generator':
      case 'camera':
      case 'fire_alarm':
      case 'utility_meter':
      case 'weather_station':
      case 'tanker_tracker':
      case 'car_wash':
      case 'air_compressor':
      case 'vacuum_station': {
        const deviceTypeKey = action === 'camera' ? 'surveillance_camera'
          : action === 'fire_alarm' ? 'fire_alarm'
          : action === 'utility_meter' ? 'utility_meter'
          : action === 'weather_station' ? 'weather_station'
          : action === 'tanker_tracker' ? 'tanker_tracker'
          : action === 'car_wash' ? 'car_wash'
          : action === 'air_compressor' ? 'air_compressor'
          : action === 'vacuum_station' ? 'vacuum_station'
          : action
        const info = DEVICE_TYPE_MAP.get(deviceTypeKey)
        if (!info) return errorResponse(`Unknown device type: "${deviceTypeKey}"`)
        const existing = await info.getModel().findUnique({ where: { id } })
        if (!existing) return errorResponse('Device not found', 404)
        await info.getModel().update({
          where: { id },
          data: { isActive: false, status: 'offline' } as Record<string, unknown>,
        })
        return NextResponse.json({ success: true, action: 'deactivated' })
      }
      default:
        return errorResponse(`Unknown DELETE action: "${action}". Valid: payment_terminal, command, generator, camera, fire_alarm, utility_meter, weather_station, tanker_tracker, car_wash, air_compressor, vacuum_station`, 400)
    }
  } catch (error) {
    console.error('Hardware API DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
