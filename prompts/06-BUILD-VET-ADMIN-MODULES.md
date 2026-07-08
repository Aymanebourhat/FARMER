# Codex Prompt — 06 Build Vet and Admin Modules

```text
Build the vet verification and admin moderation modules.

Backend:
- vet_profiles model/schema/routes/service/repository
- vet application
- license document upload handling
- admin vet approval/rejection
- listing reports admin queue
- listing suspension/restoration
- user suspension
- basic admin stats
- audit logs

Frontend:
- /vets public directory
- vet application page or profile flow
- /admin dashboard
- /admin/vets
- /admin/reports
- /admin/listings
- /admin/users

Rules:
- only approved vets appear publicly
- unverified vets must not show verified badge
- only admins can approve/reject/suspend
- admin actions must be logged

Run checks and report files changed.
```
