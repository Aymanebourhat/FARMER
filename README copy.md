# Morocco Livestock Platform — Codex CLI Project Seed

This folder is a **Codex-ready planning bundle** for the V1 Morocco livestock management and marketplace platform.

The bundle is intentionally documentation-first. Do not ask Codex to blindly generate the whole app in one shot. That produces garbage. Use the phase prompts in `prompts/` and force Codex to build one vertical slice at a time.

## Product in one sentence

A responsive web app for Moroccan livestock farmers to register animals, track growth/health, create national marketplace listings, and connect with buyers/vets, while preparing clean regional livestock data for a future government analytics layer.

## Recommended V1 stack

| Layer | Stack |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind CSS |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Backend | FastAPI + Pydantic |
| Database | PostgreSQL |
| ORM/Migrations | SQLAlchemy + Alembic |
| Auth | JWT access token + refresh token |
| Storage | Local uploads in dev, S3-compatible storage later |
| Deployment | Vercel frontend + Render/Fly/VPS backend |

## Root folder layout

```text
morocco-livestock-platform/
  AGENTS.md
  PLANS.md
  README.md
  .gitignore
  .codex/
    config.example.toml
  docs/
    00-PRODUCT-BRIEF.md
    01-SYSTEM-ARCHITECTURE-V1.md
    02-DOMAIN-MODEL.md
    03-DATABASE-SCHEMA.md
    04-API-SPEC.md
    05-FRONTEND-SPEC.md
    06-BACKEND-SPEC.md
    07-SECURITY-TRUST-MODERATION.md
    08-IMPLEMENTATION-ROADMAP.md
    09-ACCEPTANCE-CRITERIA.md
    10-OUT-OF-SCOPE.md
  prompts/
    00-CODEX-START-HERE.md
    01-GENERATE-PROJECT-SCAFFOLD.md
    02-BUILD-BACKEND-FOUNDATION.md
    03-BUILD-FRONTEND-FOUNDATION.md
    04-BUILD-LIVESTOCK-MODULE.md
    05-BUILD-MARKETPLACE-MODULE.md
    06-BUILD-VET-ADMIN-MODULES.md
  backend/
    AGENTS.md
    README.md
  frontend/
    AGENTS.md
    README.md
```

## How to use with Codex CLI

### 1. Unzip the bundle

Put the extracted folder somewhere clean, for example:

```powershell
cd $HOME\Documents
Expand-Archive .\morocco-livestock-platform-codex-bundle.zip -DestinationPath .
cd .\morocco-livestock-platform-codex-bundle
```

If you rename it, use:

```powershell
Rename-Item .\morocco-livestock-platform-codex-bundle .\morocco-livestock-platform
cd .\morocco-livestock-platform
```

### 2. Confirm you are in the root

```powershell
dir
```

You should see:

```text
AGENTS.md
README.md
PLANS.md
docs/
prompts/
backend/
frontend/
```

If you do not see `AGENTS.md`, you are in the wrong folder. Do not start Codex from the wrong folder.

### 3. Start Codex from this root folder

```powershell
codex
```

### 4. First Codex prompt

Paste this first:

```text
Read AGENTS.md, PLANS.md, docs/00-PRODUCT-BRIEF.md, docs/01-SYSTEM-ARCHITECTURE-V1.md, docs/04-API-SPEC.md, docs/03-DATABASE-SCHEMA.md, and docs/09-ACCEPTANCE-CRITERIA.md. Do not write code yet. Summarize the implementation plan, identify any conflicts, and propose Phase 1 files only.
```

If Codex tries to generate the whole project immediately, stop it. That is how you get a slop repo.

### 5. Then build in phases

Use the prompts in this order:

1. `prompts/01-GENERATE-PROJECT-SCAFFOLD.md`
2. `prompts/02-BUILD-BACKEND-FOUNDATION.md`
3. `prompts/03-BUILD-FRONTEND-FOUNDATION.md`
4. `prompts/04-BUILD-LIVESTOCK-MODULE.md`
5. `prompts/05-BUILD-MARKETPLACE-MODULE.md`
6. `prompts/06-BUILD-VET-ADMIN-MODULES.md`

## Non-negotiable V1 scope

Build:

- auth and roles,
- farmer profiles,
- animal registry,
- animal photos,
- weight records,
- health records,
- public marketplace,
- phone/WhatsApp contact,
- vet verification directory,
- admin moderation,
- basic farmer/admin analytics.

Do **not** build:

- payments,
- escrow,
- native mobile app,
- government dashboard,
- QR tagging,
- AI diagnosis,
- transport/logistics,
- insurance,
- blockchain.

## Codex working rule

When using Codex, require it to report:

- files changed,
- commands run,
- tests run,
- what was not implemented,
- manual verification steps.

If Codex says “done” without tests or verification, treat the work as incomplete.
