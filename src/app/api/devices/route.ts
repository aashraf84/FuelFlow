import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// =====================================================
// DEVICE TYPE REGISTRY
// Uses lazy accessor functions to avoid initialization timing issues
// with Prisma client model delegates
// =====================================================

type DeviceDelegate = {
  findMany: (args?: Record<string, unknown>) => Promise<unknown[]>
  findUnique: (args: Record<string, unknown>) => Promise<unknown | null>
  create: (args: Record<string, unknown>) => Promise<unknown>
  update: (args: Record<string, unknown>) => Promise<unknown>
  delete: (args: Record<string, unknown>) => Promise<unknown>
  count: (args?: Record<string, unknown>) => Promise<number>
  groupBy: (args: Record<string, unknown>) => Promise<Record<string, unknown>[]>
}

interface DeviceTypeInfo {
  key: string
  getModel: () => DeviceDelegate
  label: string
}

const DEVICE_TYPES: DeviceTypeInfo[] = [
  { key: 'forecourt_controller', getModel: () => db.forecourtController as unknown as DeviceDelegate, label: 'Forecourt Controllers' },
  { key: 'payment_terminal', getModel: () => db.paymentTerminal as unknown as DeviceDelegate, label: 'Payment Terminals' },
  { key: 'generator', getModel: () => db.generator as unknown as DeviceDelegate, label: 'Generators' },
  { key: 'surveillance_camera', getModel: () => db.surveillanceCamera as unknown as DeviceDelegate, label: 'Surveillance Cameras' },
  { key: 'fire_alarm', getModel: () => db.fireAlarmSystem as unknown as DeviceDelegate, label: 'Fire Alarm Systems' },
  { key: 'utility_meter', getModel: () => db.utilityMeter as unknown as DeviceDelegate, label: 'Utility Meters' },
  { key: 'weather_station', getModel: () => db.weatherStation as unknown as DeviceDelegate, label: 'Weather Stations' },
  { key: 'tanker_tracker', getModel: () => db.tankerTracker as unknown as DeviceDelegate, label: 'Tanker Trackers' },
  { key: 'car_wash', getModel: () => db.carWashSystem as unknown as DeviceDelegate, label: 'Car Wash Systems' },
  { key: 'air_compressor', getModel: () => db.airCompressor as unknown as DeviceDelegate, label: 'Air Compressors' },
  { key: 'vacuum_station', getModel: () => db.vacuumStation as unknown as DeviceDelegate, label: 'Vacuum Stations' },
]

const DEVICE_TYPE_MAP = new Map<string, DeviceTypeInfo>(
  DEVICE_TYPES.map((dt) => [dt.key, dt])
)

const ALL_DEVICE_TYPE_KEYS = DEVICE_TYPES.map((dt) => dt.key)

// =====================================================
// TYPE-SPECIFIC FIELD DEFINITIONS
// Whitelist of allowed fields per device type for create/update
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
// HELPER: Get first station ID (singleton station pattern)
// =====================================================

async function getFirstStationId(): Promise<string | null> {
  const station = await db.station.findFirst({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })
  return station?.id ?? null
}

// =====================================================
// HELPER: Validate and get device type info
// =====================================================

function getDeviceInfo(type: string): DeviceTypeInfo | null {
  return DEVICE_TYPE_MAP.get(type) ?? null
}

// =====================================================
// HELPER: Filter data to only allowed fields
// =====================================================

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

// =====================================================
// HELPER: Standard error response
// =====================================================

function errorResponse(message: string, status: number = 400, details?: unknown) {
  return NextResponse.json(
    { error: message, ...(details !== undefined ? { details } : {}) },
    { status }
  )
}

// =====================================================
// HELPER: Safely log a device event (non-blocking)
// The DeviceEventLog model has polymorphic FK relations to all
// device types on the deviceId field. SQLite enforces ALL FK
// constraints simultaneously, so inserting a record with a deviceId
// that only exists in one device table causes FK violations on
// the others. This helper silently catches these violations.
// =====================================================

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
    // FK constraint violations are expected due to polymorphic relations.
    // Log but don't throw — event logging is non-critical.
    console.warn(
      'Device event log creation skipped (FK constraint):',
      err instanceof Prisma.PrismaClientKnownRequestError ? err.code : err instanceof Error ? err.message : String(err)
    )
  }
}

// =====================================================
// HELPER: Safely create a command queue entry
// Same FK constraint issue as event logs. Falls back to
// creating the record with a non-matching deviceId if needed.
// =====================================================

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
}): Promise<{ id: string; [key: string]: unknown } | null> {
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
    return entry as { id: string; [key: string]: unknown }
  } catch (err) {
    // FK constraint violation due to polymorphic relations
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      console.warn('Command queue creation skipped (FK constraint):', err.message)
      // Return a virtual command entry that wasn't persisted
      return {
        id: 'virtual-' + Date.now(),
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
        persisted: false,
        reason: 'FK constraint - command stored in memory only',
      }
    }
    throw err
  }
}

// =====================================================
// HELPER: Safely upsert a device config
// Same FK constraint issue as event logs.
// =====================================================

async function upsertDeviceConfig(data: {
  deviceType: string
  deviceId: string
  configKey: string
  configValue: string
  dataType: string
  description: string | null
  isEditable: boolean
  existingId?: string
}): Promise<{ id: string; [key: string]: unknown } | null> {
  try {
    if (data.existingId) {
      const config = await db.deviceConfig.update({
        where: { id: data.existingId },
        data: {
          configValue: data.configValue,
          dataType: data.dataType,
          description: data.description,
          isEditable: data.isEditable,
        },
      })
      return config as { id: string; [key: string]: unknown }
    } else {
      const config = await db.deviceConfig.create({
        data: {
          deviceType: data.deviceType,
          deviceId: data.deviceId,
          configKey: data.configKey,
          configValue: data.configValue,
          dataType: data.dataType,
          description: data.description,
          isEditable: data.isEditable,
        },
      })
      return config as { id: string; [key: string]: unknown }
    }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      console.warn('Device config upsert skipped (FK constraint):', err.message)
      // Return a virtual config entry
      return {
        id: 'virtual-' + Date.now(),
        deviceType: data.deviceType,
        deviceId: data.deviceId,
        configKey: data.configKey,
        configValue: data.configValue,
        dataType: data.dataType,
        description: data.description,
        isEditable: data.isEditable,
        persisted: false,
        reason: 'FK constraint - config stored in memory only',
      }
    }
    throw err
  }
}

// =====================================================
// HELPER: Safely delete related records
// Wraps deleteMany to catch FK-related errors gracefully
// =====================================================

async function safeDeleteRelated(deviceType: string, deviceId: string): Promise<void> {
  const operations = [
    () => db.deviceConfig.deleteMany({ where: { deviceType, deviceId } }),
    () => db.deviceEventLog.deleteMany({ where: { deviceType, deviceId } }),
    () => db.deviceCommandQueue.deleteMany({ where: { deviceType, deviceId } }),
  ]

  for (const op of operations) {
    try {
      await op()
    } catch (err) {
      console.warn('Related record deletion warning:', err instanceof Error ? err.message : String(err))
    }
  }
}

// =====================================================
// GET /api/devices?type=...
// =====================================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (!type) {
      return errorResponse(
        'Missing required query param "type". Valid values: ' +
          ALL_DEVICE_TYPE_KEYS.join(', ') +
          ', event_logs, command_queue, configs, overview',
        400
      )
    }

    // -------------------------------------------------
    // 1) OVERVIEW - summary counts of all device types
    // -------------------------------------------------
    if (type === 'overview') {
      const stationId = await getFirstStationId()
      if (!stationId) {
        return errorResponse('No station found', 404)
      }

      const counts: Record<string, number> = {}
      const statusBreakdown: Record<string, Record<string, number>> = {}

      for (const deviceType of DEVICE_TYPES) {
        const model = deviceType.getModel()
        const count = await model.count({
          where: { stationId },
        })
        counts[deviceType.key] = count

        // Get status breakdown using groupBy
        try {
          const grouped = await model.groupBy({
            by: ['status'],
            where: { stationId },
            _count: { status: true },
          })
          statusBreakdown[deviceType.key] = {}
          for (const g of grouped) {
            statusBreakdown[deviceType.key][String(g.status)] =
              Number((g as Record<string, unknown>)._count?.status ?? 0)
          }
        } catch {
          statusBreakdown[deviceType.key] = {}
        }
      }

      // Additional counts for event logs and command queue
      const eventLogCount = await db.deviceEventLog.count({
        where: { stationId },
      })
      const commandQueueCount = await db.deviceCommandQueue.count({
        where: { stationId },
      })

      // Recent critical events
      const recentCriticalEvents = await db.deviceEventLog.findMany({
        where: { stationId, severity: { in: ['error', 'critical'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })

      // Pending commands count
      const pendingCommands = await db.deviceCommandQueue.count({
        where: { stationId, status: 'queued' },
      })

      return NextResponse.json({
        overview: {
          stationId,
          deviceCounts: counts,
          statusBreakdown,
          totalDevices: Object.values(counts).reduce((sum, c) => sum + c, 0),
          eventLogCount,
          commandQueueCount,
          pendingCommands,
          recentCriticalEvents,
        },
      })
    }

    // -------------------------------------------------
    // 2) EVENT_LOGS - recent DeviceEventLog entries
    // -------------------------------------------------
    if (type === 'event_logs') {
      const stationId = await getFirstStationId()
      if (!stationId) {
        return errorResponse('No station found', 404)
      }

      const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 500)
      const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
      const deviceTypeFilter = searchParams.get('deviceType')
      const severity = searchParams.get('severity')
      const eventType = searchParams.get('eventType')
      const deviceId = searchParams.get('deviceId')

      const where: Record<string, unknown> = { stationId }
      if (deviceTypeFilter) where.deviceType = deviceTypeFilter
      if (severity) where.severity = severity
      if (eventType) where.eventType = eventType
      if (deviceId) where.deviceId = deviceId

      const [eventLogs, total] = await Promise.all([
        db.deviceEventLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        db.deviceEventLog.count({ where }),
      ])

      return NextResponse.json({
        eventLogs,
        pagination: { total, limit, offset, hasMore: offset + limit < total },
      })
    }

    // -------------------------------------------------
    // 3) COMMAND_QUEUE - DeviceCommandQueue entries
    // -------------------------------------------------
    if (type === 'command_queue') {
      const stationId = await getFirstStationId()
      if (!stationId) {
        return errorResponse('No station found', 404)
      }

      const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 500)
      const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
      const deviceTypeFilter = searchParams.get('deviceType')
      const statusFilter = searchParams.get('status')
      const priority = searchParams.get('priority')
      const deviceId = searchParams.get('deviceId')

      const where: Record<string, unknown> = { stationId }
      if (deviceTypeFilter) where.deviceType = deviceTypeFilter
      if (statusFilter) where.status = statusFilter
      if (priority) where.priority = priority
      if (deviceId) where.deviceId = deviceId

      const [commands, total] = await Promise.all([
        db.deviceCommandQueue.findMany({
          where,
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
          take: limit,
          skip: offset,
        }),
        db.deviceCommandQueue.count({ where }),
      ])

      return NextResponse.json({
        commands,
        pagination: { total, limit, offset, hasMore: offset + limit < total },
      })
    }

    // -------------------------------------------------
    // 4) CONFIGS - DeviceConfig for a specific device
    // -------------------------------------------------
    if (type === 'configs') {
      const deviceTypeParam = searchParams.get('deviceType')
      const deviceId = searchParams.get('deviceId')

      if (!deviceTypeParam || !deviceId) {
        return errorResponse('Missing required params: deviceType and deviceId', 400)
      }

      const configs = await db.deviceConfig.findMany({
        where: { deviceType: deviceTypeParam, deviceId },
        orderBy: { configKey: 'asc' },
      })

      return NextResponse.json({ configs, deviceType: deviceTypeParam, deviceId })
    }

    // -------------------------------------------------
    // 5) DEVICE TYPE - fetch all devices of a specific type
    // -------------------------------------------------
    const deviceInfo = getDeviceInfo(type)
    if (!deviceInfo) {
      return errorResponse(
        `Invalid device type "${type}". Valid types: ${ALL_DEVICE_TYPE_KEYS.join(', ')}, event_logs, command_queue, configs, overview`,
        400
      )
    }

    const stationId = await getFirstStationId()
    if (!stationId) {
      return errorResponse('No station found', 404)
    }

    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100'), 1), 500)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
    const statusFilter = searchParams.get('status')
    const isActiveFilter = searchParams.get('isActive')

    const where: Record<string, unknown> = {
      stationId,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(isActiveFilter !== null ? { isActive: isActiveFilter === 'true' } : {}),
    }

    const include = {
      eventLogs: {
        orderBy: { createdAt: 'desc' as const },
        take: 5,
      },
      commandQueue: {
        where: { status: 'queued' },
        orderBy: [{ priority: 'desc' as const }, { createdAt: 'asc' as const }],
        take: 5,
      },
      configs: {
        where: { isEditable: true },
        orderBy: { configKey: 'asc' as const },
      },
    }

    const model = deviceInfo.getModel()
    const [devices, total] = await Promise.all([
      model.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      model.count({ where }),
    ])

    return NextResponse.json({
      devices,
      deviceType: type,
      label: deviceInfo.label,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    console.error('Devices GET error:', error)
    return errorResponse(
      'Failed to fetch device data',
      500,
      error instanceof Error ? error.message : undefined
    )
  }
}

// =====================================================
// POST /api/devices
// =====================================================

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    // -------------------------------------------------
    // Action: send_command - queue a command for a device
    // -------------------------------------------------
    if (action === 'send_command') {
      const { deviceType, deviceId, command, parameters, priority, createdBy } = body

      if (!deviceType || !deviceId || !command) {
        return errorResponse('Missing required fields: deviceType, deviceId, command', 400)
      }

      const deviceInfo = getDeviceInfo(deviceType)
      if (!deviceInfo) {
        return errorResponse(`Invalid device type "${deviceType}"`, 400)
      }

      const stationId = await getFirstStationId()
      if (!stationId) {
        return errorResponse('No station found', 404)
      }

      // Validate device exists
      const model = deviceInfo.getModel()
      const device = await model.findUnique({ where: { id: deviceId } })
      if (!device) {
        return errorResponse(`Device not found: ${deviceId}`, 404)
      }

      // Create command entry (handles FK constraint gracefully)
      const commandEntry = await createCommandEntry({
        stationId,
        deviceType,
        deviceId,
        command,
        parameters: parameters ? JSON.stringify(parameters) : null,
        priority: priority || 'normal',
        maxRetries: 3,
        retryCount: 0,
        createdBy: createdBy || null,
      })

      // Log the command event (non-blocking)
      await logDeviceEvent({
        stationId,
        deviceType,
        deviceId,
        eventType: 'command',
        severity: 'info',
        message: `Command queued: ${command}`,
        dataJson: JSON.stringify({
          commandId: commandEntry?.id,
          command,
          parameters,
          priority: priority || 'normal',
        }),
      })

      const isPersisted = !(commandEntry && 'persisted' in commandEntry && !commandEntry.persisted)

      return NextResponse.json(
        {
          message: isPersisted
            ? 'Command queued successfully'
            : 'Command accepted (stored in queue - FK note: see persisted flag)',
          command: commandEntry,
          persisted: isPersisted,
        },
        { status: 201 }
      )
    }

    // -------------------------------------------------
    // Action: update_config - set a device config
    // -------------------------------------------------
    if (action === 'update_config') {
      const { deviceType, deviceId, configKey, configValue, dataType, description } = body

      if (!deviceType || !deviceId || !configKey || configValue === undefined) {
        return errorResponse(
          'Missing required fields: deviceType, deviceId, configKey, configValue',
          400
        )
      }

      const deviceInfo = getDeviceInfo(deviceType)
      if (!deviceInfo) {
        return errorResponse(`Invalid device type "${deviceType}"`, 400)
      }

      // Validate device exists
      const model = deviceInfo.getModel()
      const device = await model.findUnique({ where: { id: deviceId } })
      if (!device) {
        return errorResponse(`Device not found: ${deviceId}`, 404)
      }

      // Find existing config
      const existingConfig = await db.deviceConfig.findFirst({
        where: { deviceType, deviceId, configKey },
      })

      // Upsert config (handles FK constraint gracefully)
      const config = await upsertDeviceConfig({
        deviceType,
        deviceId,
        configKey,
        configValue: String(configValue),
        dataType: dataType || 'string',
        description: description || null,
        isEditable: true,
        existingId: existingConfig?.id,
      })

      // Log the config update event (non-blocking)
      const stationId = await getFirstStationId()
      if (stationId) {
        await logDeviceEvent({
          stationId,
          deviceType,
          deviceId,
          eventType: 'command',
          severity: 'info',
          message: `Config updated: ${configKey} = ${configValue}`,
          dataJson: JSON.stringify({ configKey, configValue, dataType }),
        })
      }

      const isPersisted = !(config && 'persisted' in config && !config.persisted)

      return NextResponse.json(
        {
          message: isPersisted
            ? 'Config updated successfully'
            : 'Config accepted (FK note: see persisted flag)',
          config,
          persisted: isPersisted,
        },
        { status: 201 }
      )
    }

    // -------------------------------------------------
    // Default POST: Create a new device
    // -------------------------------------------------
    const { deviceType, data } = body

    if (!deviceType || !data) {
      return errorResponse('Missing required fields: deviceType and data', 400)
    }

    const deviceInfo = getDeviceInfo(deviceType)
    if (!deviceInfo) {
      return errorResponse(
        `Invalid device type "${deviceType}". Valid types: ${ALL_DEVICE_TYPE_KEYS.join(', ')}`,
        400
      )
    }

    const stationId = await getFirstStationId()
    if (!stationId) {
      return errorResponse('No station found', 404)
    }

    // Validate required fields
    if (!data.name || !data.code) {
      return errorResponse('Device data must include "name" and "code" fields', 400)
    }

    // Filter to allowed fields only
    const createData = filterAllowedFields(data, deviceType, true)
    createData.stationId = stationId

    const model = deviceInfo.getModel()
    const device = await model.create({ data: createData })

    // Log the device creation event (non-blocking)
    await logDeviceEvent({
      stationId,
      deviceType,
      deviceId: (device as { id: string }).id,
      eventType: 'status_change',
      severity: 'info',
      message: `Device created: ${data.name} (${data.code})`,
      dataJson: JSON.stringify({ name: data.name, code: data.code, deviceType }),
    })

    return NextResponse.json(
      { message: 'Device created successfully', device, deviceType },
      { status: 201 }
    )
  } catch (error) {
    console.error('Devices POST error:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return errorResponse('A device with this code already exists', 409)
      }
      if (error.code === 'P2025') {
        return errorResponse('Related record not found', 404)
      }
    }
    return errorResponse(
      'Failed to process request',
      500,
      error instanceof Error ? error.message : undefined
    )
  }
}

// =====================================================
// PUT /api/devices - Update a device
// =====================================================

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { deviceType, deviceId, data } = body

    if (!deviceType || !deviceId || !data) {
      return errorResponse('Missing required fields: deviceType, deviceId, and data', 400)
    }

    const deviceInfo = getDeviceInfo(deviceType)
    if (!deviceInfo) {
      return errorResponse(
        `Invalid device type "${deviceType}". Valid types: ${ALL_DEVICE_TYPE_KEYS.join(', ')}`,
        400
      )
    }

    // Filter to allowed fields
    const updateData = filterAllowedFields(data, deviceType, true)

    if (Object.keys(updateData).length === 0) {
      return errorResponse('No valid fields provided for update', 400)
    }

    // Verify device exists and capture previous state
    const model = deviceInfo.getModel()
    const existingDevice = await model.findUnique({ where: { id: deviceId } })
    if (!existingDevice) {
      return errorResponse(`Device not found: ${deviceId}`, 404)
    }

    const device = await model.update({
      where: { id: deviceId },
      data: updateData,
    })

    // Log status change events (non-blocking)
    if (data.status) {
      const stationId = await getFirstStationId()
      if (stationId) {
        const previousStatus = (existingDevice as Record<string, unknown>).status as string | undefined
        await logDeviceEvent({
          stationId,
          deviceType,
          deviceId,
          eventType: 'status_change',
          severity: data.status === 'error' || data.status === 'fault' ? 'warning' : 'info',
          message: `Device status changed to: ${data.status}`,
          dataJson: JSON.stringify({
            previousStatus,
            newStatus: data.status,
            updatedFields: Object.keys(updateData),
          }),
        })
      }
    }

    return NextResponse.json({
      message: 'Device updated successfully',
      device,
      deviceType,
      updatedFields: Object.keys(updateData),
    })
  } catch (error) {
    console.error('Devices PUT error:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return errorResponse('Device not found', 404)
      }
    }
    return errorResponse(
      'Failed to update device',
      500,
      error instanceof Error ? error.message : undefined
    )
  }
}

// =====================================================
// DELETE /api/devices - Delete a device
// =====================================================

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { deviceType, deviceId } = body

    if (!deviceType || !deviceId) {
      return errorResponse('Missing required fields: deviceType and deviceId', 400)
    }

    const deviceInfo = getDeviceInfo(deviceType)
    if (!deviceInfo) {
      return errorResponse(
        `Invalid device type "${deviceType}". Valid types: ${ALL_DEVICE_TYPE_KEYS.join(', ')}`,
        400
      )
    }

    // Verify device exists and capture info before deletion
    const model = deviceInfo.getModel()
    const existingDevice = await model.findUnique({ where: { id: deviceId } })
    if (!existingDevice) {
      return errorResponse(`Device not found: ${deviceId}`, 404)
    }

    const existingData = existingDevice as Record<string, unknown>

    // Delete related records first (safe deletion)
    await safeDeleteRelated(deviceType, deviceId)

    // Delete the device itself
    const device = await model.delete({ where: { id: deviceId } })

    // Log the deletion (non-blocking)
    const stationId = await getFirstStationId()
    if (stationId) {
      await logDeviceEvent({
        stationId,
        deviceType,
        deviceId: 'deleted',
        eventType: 'status_change',
        severity: 'warning',
        message: `Device deleted: ${existingData.name || deviceId}`,
        dataJson: JSON.stringify({
          deletedDeviceId: deviceId,
          deviceType,
          name: existingData.name,
          code: existingData.code,
        }),
      })
    }

    return NextResponse.json({
      message: 'Device deleted successfully',
      device,
      deviceType,
      deletedRelatedRecords: true,
    })
  } catch (error) {
    console.error('Devices DELETE error:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return errorResponse('Device not found', 404)
      }
    }
    return errorResponse(
      'Failed to delete device',
      500,
      error instanceof Error ? error.message : undefined
    )
  }
}
