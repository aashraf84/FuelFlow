---
Task ID: 1
Agent: Main
Task: Register Super Admin with Lifetime Enterprise Subscription

Work Log:
- Read and analyzed entire Prisma schema, all API routes, LoginPage, OwnerModule, DeviceIntegrationModule
- Created `/api/auth/setup-super-admin` route for Super Admin registration
- Updated LoginPage with full Super Admin registration flow (4-step: serial-key → register-admin → registration-success → auto-login)
- Updated app shell (page.tsx) to show Super Admin role with orange Crown icon in sidebar and profile dropdown
- Created and ran `scripts/register-super-admin.ts` to register Ashraf Saagar as Super Admin
- Fixed FuelPrice model seeding (added tenantId, effectiveFrom fields)
- Seeded station, tanks, dispensers, and fuel prices for the new tenant
- Verified serial key validation API returns correct enterprise/lifetime response
- Verified demo login works correctly
- Added connect_timeout=30 to DATABASE_URL for Neon cold start resilience

Stage Summary:
- Super Admin registered successfully with LIFETIME Enterprise subscription
- Credentials:
  - Email: ashraf.saagar@gmail.com
  - Serial Key: FF-K9JV-9TYF-EZVT
  - API Key: ff_live_1gDYxNI4wBaB3RHD2AiXq8BGwJzd1JgN
  - License Key: FF-XV5E-JZLK-TH83
  - Role: superadmin
  - Plan: Enterprise (LIFETIME - Never Expires)
- New login flow supports: Serial Key → Credentials, Demo Login, and Register as Super Admin
- Note: Server has intermittent stability issues with Neon PostgreSQL cold starts
