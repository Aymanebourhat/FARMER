# Implementation Roadmap — V1

## Phase 1 — Foundation

Build:

- repo scaffold,
- backend app skeleton,
- frontend app skeleton,
- PostgreSQL connection,
- Alembic setup,
- access-JWT auth models/schemas/routes,
- user roles: farmer, vet, admin,
- admin creation script,
- static Morocco region/province constants,
- basic farmer profile upsert,
- profile completion score calculation,
- localization setup.

Done means:

- farmer or vet can register/login,
- public registration rejects admin and buyer roles,
- admin can be created only through the backend script,
- farmer can complete profile through `PATCH /api/v1/farmers/me`,
- protected dashboard route exists,
- admin role exists but has no moderation UI yet.

Phase 1 explicitly excludes animals, marketplace, vets, uploads, and admin moderation.

## Phase 2 — Livestock Registry

Build:

- animal CRUD,
- animal list,
- animal detail,
- photo upload,
- weight records,
- health records.

Done means:

- farmer can add animals,
- farmer can upload photos,
- farmer can track weight,
- farmer can add health records.

## Phase 3 — Dashboard

Build:

- total animals,
- animals by species,
- active listings,
- ready-for-sale count,
- health reminders,
- recent activity.

Done means:

- dashboard uses real database values,
- no fake static stats,
- charts use real data.

## Phase 4 — Marketplace

Build:

- create listing from animal,
- public marketplace,
- listing filters,
- listing detail,
- phone/WhatsApp contact,
- listing expiry,
- report listing.

Done means:

- farmer can publish listing,
- public buyer/guest can browse/filter listings,
- public buyer/guest can contact seller,
- reported listings appear in admin panel.

## Phase 5 — Vet Directory

Build:

- vet application,
- document upload,
- admin verification,
- public vet listing.

Done means:

- vet can apply,
- admin can approve/reject,
- only approved vets appear publicly.

## Phase 6 — Admin and Hardening

Build:

- user management,
- listing moderation,
- report review,
- admin stats,
- audit logs,
- rate limiting,
- security pass.

Done means:

- admin can moderate platform,
- suspicious listings can be suspended,
- admin actions are logged.
