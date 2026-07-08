# AGENTS.md — Morocco Livestock Platform

## Project identity

PROJECT_NAME: Morocco Livestock Platform
PROJECT_TYPE: Startup MVP web app
PRIMARY_GOAL: Help Moroccan livestock farmers register animals, track growth/health, list animals for sale, and connect with buyers/vets while preparing clean regional supply data for a future government analytics layer.
PRIMARY_USERS: Farmers, public buyers/guests, verified vets, admins.

## Source of truth

Before coding, read these files:

1. `docs/00-PRODUCT-BRIEF.md`
2. `docs/01-SYSTEM-ARCHITECTURE-V1.md`
3. `docs/03-DATABASE-SCHEMA.md`
4. `docs/04-API-SPEC.md`
5. `docs/05-FRONTEND-SPEC.md`
6. `docs/06-BACKEND-SPEC.md`
7. `docs/07-SECURITY-TRUST-MODERATION.md`
8. `docs/09-ACCEPTANCE-CRITERIA.md`

Do not invent requirements beyond these docs.

## Stack

FRONTEND_STACK: Next.js, TypeScript, Tailwind CSS, React Hook Form, Zod, Recharts.
BACKEND_STACK: FastAPI, Pydantic, SQLAlchemy, Alembic.
DATABASE: PostgreSQL.
AUTH_SYSTEM: JWT access token in Phase 1. Refresh tokens require an explicit schema decision before implementation.
API_STYLE: REST under `/api/v1`.
FILE_STORAGE: Local uploads in development; S3-compatible storage later.
DEPLOYMENT_TARGET: Vercel frontend + Render/Fly/VPS backend.

## V1 scope

Implement only:

- auth and roles,
- farmer profiles,
- livestock registry,
- animal photos,
- weight records,
- health records,
- marketplace listings,
- phone/WhatsApp seller contact,
- verified vet directory,
- admin moderation,
- basic farmer/admin analytics,
- Arabic/French-ready UI.

V1 role accounts are limited to farmers, vets, and admins. Buyers are public/guest users only in V1.

## Explicitly out of scope

Do not build these unless the user explicitly changes scope:

- online payments,
- escrow,
- native mobile app,
- government dashboard,
- QR tagging,
- AI animal diagnosis,
- transport/logistics,
- insurance,
- auctions,
- IoT sensors,
- blockchain.

## Architecture rules

- Use a modular monolith.
- Do not create microservices.
- Keep backend modules separated by domain.
- Keep route/controller, schema/DTO, service, repository, and model responsibilities separate.
- Use database constraints for ownership, status, uniqueness, and referential integrity.
- Do not store image binaries in PostgreSQL.
- Use migrations for schema changes.
- Keep API contracts aligned with `docs/04-API-SPEC.md`.

## Frontend rules

- Use real API endpoints only.
- Centralize API calls in a typed client/service layer.
- Every major screen must include loading, error, empty, and success states.
- Every form must include validation messages.
- Mobile browser support is mandatory.
- Keep UI lightweight for weak laptops and slow rural connections.
- Do not add decorative animation that hurts performance.

## Security rules

- Farmers can only edit their own animals and listings.
- Admin can moderate public content.
- Unverified vets must not appear as verified.
- Animal sale listings require at least one photo.
- Listing data is farmer-reported unless explicitly verified later.
- Do not expose exact farm address publicly.
- Validate file MIME type and size.
- Never hardcode secrets.

## Work style

For every implementation task:

1. Inspect current files first.
2. State the smallest implementation plan.
3. Implement one module or vertical slice at a time.
4. Run relevant lint/typecheck/tests/build commands when available.
5. Report files changed, tests run, and manual verification steps.
6. State clearly what remains incomplete.

If the repo has no code yet, scaffold the smallest correct structure. Do not generate a huge fake app in one pass.
