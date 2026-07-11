# API Spec — V1 REST API

Base path:

```text
/api/v1
```

All protected routes require JWT auth.

## Auth

### Phase 1 implemented endpoints

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

### Deferred auth endpoints

```text
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
POST /api/v1/auth/verify-phone
```

Deferred rules:

- `/auth/logout` only needs server behavior after token persistence/revocation exists. Phase 1 logout is client-side access-token discard.
- `/auth/refresh` must not be implemented with persistence/revocation until a refresh-token schema is explicitly added.
- `/auth/verify-phone` is documented but deferred until an SMS/OTP provider and verification storage model are selected.
- `phone_verified` remains `false` in Phase 1.

### Register request

```json
{
  "full_name": "string",
  "phone": "string",
  "password": "string",
  "role": "farmer",
  "preferred_language": "ar"
}
```

Registration role rules:

- Public registration accepts only `farmer` or `vet`.
- Public registration must reject `admin`.
- `buyer` is not a V1 account role.
- Admin users are created only through `backend/app/scripts/create_admin.py`.

### Login response

```json
{
  "access_token": "string",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "full_name": "string",
    "role": "farmer",
    "phone_verified": false
  }
}
```

## Farmers

```text
GET   /api/v1/farmers/me
PATCH /api/v1/farmers/me
GET   /api/v1/farmers/me/dashboard
```

`PATCH /api/v1/farmers/me` is an upsert endpoint in V1. It creates the farmer profile when one does not exist and updates it when it does.

Farmer profile `region` and `province` values must come from the static Morocco region/province constants. The backend must reject a province that does not belong to the selected region.

Profile completion score is calculated by the backend using the formula in `docs/03-DATABASE-SCHEMA.md`.

### Farmer dashboard response

GET /api/v1/farmers/me/dashboard is farmer-only and returns metrics scoped to the
authenticated farmer's non-deleted animals.

    {
      "total_animals": 3,
      "animals_by_species": {
        "sheep": 2,
        "cow": 0,
        "goat": 1,
        "camel": 0,
        "other": 0
      },
      "active_listings": 0,
      "ready_for_sale": 2,
      "health_alerts": 1,
      "latest_weight_updates": [
        {
          "animal_id": "uuid",
          "animal_label": "Sardi",
          "weight_kg": "42.50",
          "recorded_at": "2026-07-10",
          "note": "Monthly check"
        }
      ],
      "recent_activity": [
        {
          "type": "weight_recorded",
          "title": "42.50 kg · Sardi",
          "date": "2026-07-10",
          "animal_id": "uuid"
        }
      ]
    }

Rules:

- health_alerts counts reminders due on or before today.
- latest_weight_updates is limited to 5.
- recent_activity is limited to 10.
- active_listings is 0 until the marketplace tables are implemented.

## Animals

```text
GET    /api/v1/animals
POST   /api/v1/animals
GET    /api/v1/animals/{animal_id}
PATCH  /api/v1/animals/{animal_id}
DELETE /api/v1/animals/{animal_id}
GET    /api/v1/animals/{animal_id}/history
```

### Create animal request

```json
{
  "species": "sheep",
  "breed": "Sardi",
  "sex": "male",
  "birth_date": "2025-02-10",
  "estimated_age_months": null,
  "health_status": "healthy",
  "sale_readiness": "not_ready",
  "identification_notes": "White head, black mark on left leg"
}
```

## Animal photos

```text
POST   /api/v1/animals/{animal_id}/photos
GET    /api/v1/animals/{animal_id}/photos
DELETE /api/v1/animals/{animal_id}/photos/{photo_id}
PATCH  /api/v1/animals/{animal_id}/photos/{photo_id}/primary
```

Rules:

- Farmer can only upload photos for own animals.
- Accepted image types: JPEG, PNG, WebP.
- Max raw upload size: 10 MB.

## Weight records

```text
GET  /api/v1/animals/{animal_id}/weights
POST /api/v1/animals/{animal_id}/weights
```

### Create weight request

```json
{
  "weight_kg": 42.5,
  "recorded_at": "2026-07-08",
  "note": "Monthly weight check"
}
```

## Health records

```text
GET  /api/v1/animals/{animal_id}/health-records
POST /api/v1/animals/{animal_id}/health-records
```

### Create health record request

```json
{
  "record_type": "vaccine",
  "title": "Vaccination",
  "description": "Routine vaccination",
  "medicine_name": "string",
  "recorded_at": "2026-07-08",
  "next_reminder_at": "2026-10-08"
}
```

## Marketplace

```text
GET    /api/v1/marketplace/listings
POST   /api/v1/marketplace/listings
GET    /api/v1/marketplace/listings/{listing_id}
PATCH  /api/v1/marketplace/listings/{listing_id}
POST   /api/v1/marketplace/listings/{listing_id}/mark-sold
POST   /api/v1/marketplace/listings/{listing_id}/renew
POST   /api/v1/marketplace/listings/{listing_id}/report
```

### Search query params

```text
species=sheep
region=Marrakech-Safi
province=Marrakech
min_price=2000
max_price=6000
min_weight=30
max_weight=90
sex=male
sale_readiness=ready
sort=recent
page=1
page_size=20
```

### Create listing request

```json
{
  "animal_id": "uuid",
  "title": "Sardi sheep for sale",
  "description": "Healthy male sheep, good weight, available in Marrakech.",
  "price_mad": 4500,
  "contact_phone": "+212600000000",
  "contact_whatsapp": "+212600000000"
}
```

## Vets

```text
GET    /api/v1/vets
GET    /api/v1/vets/{vet_id}
POST   /api/v1/vets/apply
GET    /api/v1/vets/me
PATCH  /api/v1/vets/me
```

## Admin

```text
GET   /api/v1/admin/users
PATCH /api/v1/admin/users/{user_id}/suspend

GET   /api/v1/admin/vets/pending
PATCH /api/v1/admin/vets/{vet_id}/approve
PATCH /api/v1/admin/vets/{vet_id}/reject

GET   /api/v1/admin/listings/reported
PATCH /api/v1/admin/listings/{listing_id}/suspend
PATCH /api/v1/admin/listings/{listing_id}/restore

GET   /api/v1/admin/stats
```

## Required API behavior

- `401` for unauthenticated protected calls.
- `403` for authenticated but unauthorized calls.
- `404` for missing resources or resources not visible to the user.
- `409` for active duplicate listing on same animal.
- `422` for validation errors.
- `422` for public registration attempts using `admin`, `buyer`, or any unsupported role.
- Do not leak private farmer/admin data in public listing responses.
