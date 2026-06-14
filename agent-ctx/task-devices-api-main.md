# Task: Create Comprehensive Device Integration API Route

## Summary
Created `/home/z/my-project/src/app/api/devices/route.ts` — a comprehensive API route for the FuelFlow OS device integration system, handling all 11 device types plus event logs, command queue, and device configs.

## API Endpoints Implemented

### GET /api/devices?type=...
1. **`?type=overview`** — Returns summary counts of all device types, status breakdowns, recent critical events, and pending commands
2. **`?type=forecourt_controller`** (or any device type) — Fetches all devices of that type with related event logs, command queue, and configs
3. **`?type=event_logs`** — Fetches recent DeviceEventLog entries with optional filters (deviceType, severity, eventType, deviceId)
4. **`?type=command_queue`** — Fetches DeviceCommandQueue entries with optional filters (deviceType, status, priority, deviceId)
5. **`?type=configs&deviceType=X&deviceId=Y`** — Fetches DeviceConfig entries for a specific device

### POST /api/devices
6. **Create device** — `{ deviceType, data }` — Creates a new device with field whitelisting
7. **`action=send_command`** — `{ action, deviceType, deviceId, command, parameters, priority, createdBy }` — Queues a command
8. **`action=update_config`** — `{ action, deviceType, deviceId, configKey, configValue, dataType, description }` — Sets a device config

### PUT /api/devices
9. **Update device** — `{ deviceType, deviceId, data }` — Updates device fields with status change logging

### DELETE /api/devices
10. **Delete device** — `{ deviceType, deviceId }` — Deletes device and all related records

## Device Types Supported
forecourt_controller, payment_terminal, generator, surveillance_camera, fire_alarm, utility_meter, weather_station, tanker_tracker, car_wash, air_compressor, vacuum_station

## Key Design Decisions
- **Lazy model accessors** (`getModel()`) to avoid Prisma client initialization timing issues in Next.js
- **Field whitelisting** for create/update operations to prevent injection
- **Graceful FK constraint handling** for polymorphic relations in DeviceEventLog, DeviceCommandQueue, and DeviceConfig (SQLite enforces all FK constraints simultaneously, which fails when deviceId only exists in one device type table)
- **Non-blocking event logging** — failures in event log creation never break main operations
- **Pagination** support on all list endpoints
- **Proper error responses** with HTTP status codes (400, 404, 409, 500)

## Testing Results
All endpoints verified working:
- Overview: ✅ Returns device counts, status breakdowns, pending commands
- Device list: ✅ Returns devices with related records
- Event logs: ✅ Returns filtered event logs
- Command queue: ✅ Returns filtered command queue entries
- Configs: ✅ Returns device configs
- Create: ✅ Creates devices with proper field filtering
- Update: ✅ Updates devices with status change logging
- Delete: ✅ Deletes devices with cascading related records
- Send command: ✅ Queues commands (with FK graceful handling)
- Update config: ✅ Sets configs (with FK graceful handling)
- Error handling: ✅ Proper 400/404/409/500 responses
