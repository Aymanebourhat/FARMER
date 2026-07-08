# Database Schema — V1 PostgreSQL

Use PostgreSQL. Use Alembic migrations. Do not manually mutate production schema.

## Enums

```text
UserRole = farmer | vet | admin
UserStatus = active | suspended | deleted
Species = sheep | cow | goat | camel | other
Sex = male | female | unknown
AnimalHealthStatus = healthy | sick | recovering | unknown
AnimalOwnershipStatus = owned | listed | reserved | sold | dead
SaleReadiness = not_ready | ready | unknown
VerificationLevel = self_reported | admin_reviewed | vet_verified
HealthRecordType = vaccine | illness | treatment | checkup | note
HealthVerificationStatus = farmer_reported | vet_verified
ListingStatus = draft | active | expired | sold | suspended
ReportReason = fake | scam | wrong_price | sold | abusive | other
ReportStatus = pending | reviewed | dismissed | action_taken
VetVerificationStatus = pending | approved | rejected
Language = ar | fr
```

Buyer accounts are not stored in V1. Buyers are public/guest users only.

Admin users must be created only through `backend/app/scripts/create_admin.py`; public registration must reject `admin`.

## `users`

| Column | Type | Rule |
|---|---|---|
| id | UUID PK | Required |
| full_name | varchar | Required |
| phone | varchar unique | Required |
| email | varchar unique nullable | Optional |
| password_hash | varchar | Required |
| role | enum | farmer, vet, admin |
| phone_verified | boolean | default false |
| status | enum | active, suspended, deleted |
| preferred_language | enum | ar, fr |
| created_at | timestamp | Required |
| updated_at | timestamp | Required |

Indexes: phone, email, role, status.

## `farmer_profiles`

| Column | Type | Rule |
|---|---|---|
| id | UUID PK | Required |
| user_id | UUID FK users.id unique | Required |
| farm_name | varchar nullable | Optional |
| region | varchar | Required; selected from static Morocco regions constants |
| province | varchar | Required; selected from static province list for the selected region |
| commune | varchar nullable | Optional |
| main_livestock_type | varchar nullable | Optional |
| farm_size_label | varchar nullable | Optional |
| profile_completion_score | integer | 0-100 |
| created_at | timestamp | Required |
| updated_at | timestamp | Required |

Indexes: user_id, region+province.

Location rule:

- V1 uses static Morocco region/province constants, not free-text region/province inputs.
- The backend validates that `province` belongs to the selected `region`.
- No location lookup table is required in Phase 1.

Profile completion score formula:

| Field | Points |
|---|---:|
| region | 25 |
| province | 25 |
| farm_name | 20 |
| main_livestock_type | 15 |
| farm_size_label | 10 |
| commune | 5 |

Maximum score is 100. Missing or blank fields receive 0 points.

## `animals`

| Column | Type | Rule |
|---|---|---|
| id | UUID PK | Required |
| farmer_id | UUID FK farmer_profiles.id | Required |
| species | enum | Required |
| breed | varchar nullable | Optional |
| sex | enum | Required |
| birth_date | date nullable | Either this or estimated_age_months |
| estimated_age_months | integer nullable | Either this or birth_date |
| color | varchar nullable | Optional |
| identification_notes | text nullable | Optional |
| health_status | enum | Required |
| ownership_status | enum | Required |
| sale_readiness | enum | Required |
| verification_level | enum | default self_reported |
| created_at | timestamp | Required |
| updated_at | timestamp | Required |
| deleted_at | timestamp nullable | Soft delete |

Rules:

- Either `birth_date` or `estimated_age_months` must be provided.
- Dead, sold, or deleted animals cannot be listed.
- One active listing per animal.

Indexes: farmer_id, species, species+ownership_status, created_at.

## `animal_photos`

| Column | Type | Rule |
|---|---|---|
| id | UUID PK | Required |
| animal_id | UUID FK animals.id | Required |
| file_url | text | Required |
| file_key | text | Required |
| mime_type | varchar | image/jpeg, image/png, image/webp |
| size_bytes | integer | Required |
| is_primary | boolean | default false |
| uploaded_at | timestamp | Required |

Rules:

- Max 5 photos per animal in V1.
- At least 1 photo required before listing.

## `weight_records`

| Column | Type | Rule |
|---|---|---|
| id | UUID PK | Required |
| animal_id | UUID FK animals.id | Required |
| weight_kg | decimal | Positive |
| recorded_at | date | Required |
| note | text nullable | Optional |
| created_at | timestamp | Required |

Index: animal_id+recorded_at.

## `health_records`

| Column | Type | Rule |
|---|---|---|
| id | UUID PK | Required |
| animal_id | UUID FK animals.id | Required |
| record_type | enum | vaccine, illness, treatment, checkup, note |
| title | varchar | Required |
| description | text nullable | Optional |
| medicine_name | varchar nullable | Optional |
| vet_id | UUID FK vet_profiles.id nullable | Optional |
| verification_status | enum | farmer_reported default |
| recorded_at | date | Required |
| next_reminder_at | date nullable | Optional |
| created_at | timestamp | Required |

Indexes: animal_id+recorded_at, next_reminder_at.

## `marketplace_listings`

| Column | Type | Rule |
|---|---|---|
| id | UUID PK | Required |
| animal_id | UUID FK animals.id | Required |
| farmer_id | UUID FK farmer_profiles.id | Required |
| title | varchar | Required |
| description | text nullable | Optional |
| price_mad | decimal | Positive |
| region | varchar | Required; selected from static Morocco regions constants |
| province | varchar | Required; selected from static province list for the selected region |
| contact_phone | varchar | Required |
| contact_whatsapp | varchar nullable | Optional |
| status | enum | draft, active, expired, sold, suspended |
| trust_score | integer | 0-100 |
| expires_at | timestamp | Required |
| created_at | timestamp | Required |
| updated_at | timestamp | Required |

Indexes: status+created_at, region+province, price, expires_at.

## `vet_profiles`

| Column | Type | Rule |
|---|---|---|
| id | UUID PK | Required |
| user_id | UUID FK users.id unique | Required |
| clinic_name | varchar nullable | Optional |
| specialization | varchar nullable | Optional |
| region | varchar | Required; selected from static Morocco regions constants |
| province | varchar | Required; selected from static province list for the selected region |
| phone | varchar | Required |
| whatsapp | varchar nullable | Optional |
| license_document_url | text | Required for approval |
| verification_status | enum | pending, approved, rejected |
| rejection_reason | text nullable | Optional |
| verified_at | timestamp nullable | Optional |
| created_at | timestamp | Required |
| updated_at | timestamp | Required |

Indexes: region+province, verification_status.

## `listing_reports`

| Column | Type | Rule |
|---|---|---|
| id | UUID PK | Required |
| listing_id | UUID FK marketplace_listings.id | Required |
| reporter_user_id | UUID FK users.id nullable | Guests allowed |
| reason | enum | fake, scam, wrong_price, sold, abusive, other |
| description | text nullable | Optional |
| status | enum | pending, reviewed, dismissed, action_taken |
| created_at | timestamp | Required |

Indexes: listing_id, status.

## `audit_logs`

| Column | Type | Rule |
|---|---|---|
| id | UUID PK | Required |
| actor_user_id | UUID FK users.id nullable | Required for admin actions if possible |
| action | varchar | Example: vet.approved |
| entity_type | varchar | listing, user, vet |
| entity_id | UUID nullable | Target entity |
| metadata | jsonb nullable | Safe details only |
| created_at | timestamp | Required |
