---
Task ID: 1
Agent: Main Agent
Task: Change super admin credentials to admin@apexflow.cloud / Admin@180H

Work Log:
- Read current Prisma schema, auth API routes, LoginPage component, and app store
- Modified /api/auth/setup-super-admin/route.ts to accept optional custom password parameter
- Called API to create super admin with exact credentials: admin@apexflow.cloud / Admin@180H
- Verified login works with new credentials via API test
- Updated LoginPage.tsx to include password field in Super Admin registration form
- Added state variables: regPassword, regShowPassword
- Added password input field with show/hide toggle between Email and Phone fields
- Pass custom password to API during registration
- Ran lint check - all clean

Stage Summary:
- Super Admin account created with credentials:
  - Email: admin@apexflow.cloud
  - Password: Admin@180H
  - Role: superadmin
  - Subscription: LIFETIME Enterprise
  - Serial Key: FF-4K28-A73Y-T4NW
  - License Key: FF-Y6ES-P9D3-3X3V
  - API Key: ff_live_RtWYvwCvnmlGiEpFZoJBVJmOkKr67CAk
  - Tenant: ApexFlow Cloud (apexflow-cloud-db5047)
  - Station: ApexFlow Cloud - Main Station (HQ-001)
  - Device: Owner-MacBook-Pro (workstation)
- Login verified working via API
- Registration form now supports custom passwords
