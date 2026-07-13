# Frontend Spec — V1

## App type

Responsive web app with PWA-ready structure. Not a native mobile app.

## Routes

Canonical V1 routing uses `app/[locale]/...` with `ar` and `fr` only. Unlocalized routes may redirect to the default locale, but the canonical app files live under `[locale]`.

### Public routes

| Route | Purpose |
|---|---|
| `/[locale]` | Landing page |
| `/[locale]/marketplace` | Public livestock listings |
| `/[locale]/marketplace/[id]` | Listing detail |
| `/[locale]/vets` | Verified vet directory |
| `/[locale]/login` | Login |
| `/[locale]/register` | Register farmer or vet account |

### Farmer routes

| Route | Purpose |
|---|---|
| `/[locale]/dashboard` | Farmer dashboard |
| `/[locale]/animals` | Livestock list |
| `/[locale]/animals/new` | Add animal |
| `/[locale]/animals/[id]` | Animal profile |
| `/[locale]/animals/[id]/growth` | Growth chart |
| `/[locale]/animals/[id]/health` | Health records |
| `/[locale]/listings` | Farmer listing management |
| `/[locale]/listings/new?animalId=...` | Create listing from animal |
| `/[locale]/profile` | Farmer profile |

### Admin routes

| Route | Purpose |
|---|---|
| `/[locale]/admin` | Admin overview |
| `/[locale]/admin/users` | User management |
| `/[locale]/admin/vets` | Vet verification queue |
| `/[locale]/admin/reports` | Listing reports |
| `/[locale]/admin/listings` | Listing moderation |

## Suggested structure

```text
frontend/
  app/
    [locale]/
      page.tsx
      login/
      register/
      marketplace/
      vets/
      dashboard/
      animals/
      listings/
      profile/
      admin/
  components/
    ui/
    layout/
    forms/
    charts/
    marketplace/
    animals/
    vets/
    admin/
  lib/
    api-client.ts
    auth.ts
    constants.ts
    i18n.ts
    validators.ts
    morocco-regions.ts
  types/
    user.ts
    animal.ts
    listing.ts
    vet.ts
```

## Phase 1 frontend boundary

Phase 1 builds only the localized app shell, landing route, register, login, protected dashboard placeholder, and farmer profile screen. Do not build animals, marketplace, vets, uploads, or admin moderation screens in Phase 1.

## Location inputs

Farmer profile region/province inputs must use selects backed by `frontend/lib/morocco-regions.ts`. Do not use free-text region/province inputs in V1.

## UI requirements

Every major screen must include:

- loading state,
- error state,
- empty state,
- success state where relevant,
- validation messages,
- mobile layout,
- slow-network handling,
- image loading fallback.

## Localization

Use `/ar/...` and `/fr/...` routing. These are the only V1 locales.

Translation files:

```text
frontend/messages/ar.json
frontend/messages/fr.json
```

Darija should be helper/onboarding text, not a full formal locale in V1.

## Frontend performance rules

- Paginate marketplace lists.
- Optimize images.
- Lazy-load heavy charts.
- Avoid unnecessary client-side rendering.
- Keep cards and forms usable on low-end mobile browsers.
- Do not add heavy animation libraries in V1.

## Phase 6 admin frontend

Localized admin routes extend the existing application shell: `/[locale]/admin`, `/users`, `/users/[userId]`, `/listings`, `/listings/[listingId]`, `/reports`, `/reports/[reportId]`, `/audit-logs`, plus the existing `/vets` verification routes. Every route performs a direct admin-role check, supports loading/error/empty/success states, and uses the centralized authenticated API client.

The shared admin navigation is responsive and contains Overview, Users, Marketplace listings, Listing reports, Vet verification, and Audit logs. List filters and pagination are URL synchronized. Critical changes use keyboard-accessible confirmation dialogs with required reasons or notes; audit logs remain read-only.
