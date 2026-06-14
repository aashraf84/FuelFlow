---
Task ID: 1
Agent: Main
Task: Register device as owner with credentials and serial key

Work Log:
- Added `passwordHash` and `apiKey` (unique) fields to `OwnerClient` model in Prisma schema
- Pushed schema changes to Neon PostgreSQL database
- Created `/api/owner/register` API route that:
  - Accepts company info, device details, and plan selection
  - Generates a secure random password (14 chars, mixed case + digits + special)
  - Generates a unique API key (`ff_live_*` format)
  - Generates a unique serial key (`FF-XXXX-XXXX-XXXX` format)
  - Creates OwnerClient record with hashed password
  - Creates LicenseKey record assigned to owner
  - Creates ClientDevice record linked to owner
  - Creates trial subscription (30 days)
  - Returns all credentials (plain password shown only once)
- Updated `/api/auth/validate-serial` to also check `LicenseKey` table (not just `SerialKey`)
  - This allows owner-registered serial keys to be used for login
- Added owner registration UI to DeviceIntegrationModule:
  - New "Owner Registration" tab with info cards
  - "Register as Device Owner" action card on Overview
  - OwnerRegistrationForm with company info, device details, plan selection
  - CredentialsDisplay component showing email, password, API key, serial key
  - Copy-to-clipboard buttons for each credential
  - Warning about saving credentials (password shown only once)
- Tested API successfully - registration returns full credentials + serial key
- Tested serial key validation - registered keys validate correctly

Stage Summary:
- Owner registration fully functional via API
- Generated credentials for user: ashraf.saagar@gmail.com
  - Serial Key: FF-XV5E-JZLK-TH83 (Professional plan)
  - API Key: ff_live_1gDYxNI4wBaB3RHD2AiXq8BGwJzd1JgN
- License keys from registration now validate at login screen
- UI added with registration form, plan picker, and credential display
