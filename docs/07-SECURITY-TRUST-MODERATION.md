# Security, Trust, and Moderation — V1

## V1 verification reality

Animal data is **farmer-reported**, not certified. The UI must label it honestly.

## Trust score

Suggested listing trust score:

| Signal | Points |
|---|---:|
| Farmer phone verified | +20 |
| Animal has at least 1 photo | +20 |
| Animal has 3+ photos | +10 |
| Animal has weight history | +15 |
| Animal has health record | +15 |
| Farmer profile complete | +10 |
| No reports on listing | +10 |

Trust levels:

| Score | Level |
|---:|---|
| 0-39 | Low |
| 40-69 | Medium |
| 70-100 | High |

## Anti-fraud controls

| Problem | Control |
|---|---|
| Fake account | Phone verification |
| Fake animal | Photos required for listings |
| Fake vet | Manual admin approval |
| Fake price | Outlier warning later |
| Dead listing | Auto-expiry after 30 days |
| Duplicate listing | One active listing per animal |
| Scam listing | Report + admin moderation |
| Spam | Listing limits for new/unverified users later |

## File upload safety

Animal photos:

- JPEG, PNG, WebP only.
- Max raw upload size: 10 MB.
- Max 5 photos per animal.
- Generate safe server-side file names.
- Do not trust original file names.

Vet documents:

- PDF, JPEG, PNG.
- Private by default.
- Admin-only viewing.

## Privacy rules

Public listing may show:

- animal data relevant to sale,
- region/province,
- seller contact.

Public listing must not show:

- exact farm address,
- private notes,
- internal admin flags,
- private vet documents,
- full farmer history.


## Vet verification documents — Phase 5A

Vet documents accept PDF, JPEG, and PNG only (maximum 10 MB). The API validates signatures/images, creates server-generated private keys, and stores files outside the public `/uploads` mount. Only authenticated admins can download a document through the protected admin-vet endpoint. Replacing evidence resets approval to pending. Public vet responses never contain storage keys, document metadata, or rejection reasons.

## Phase 6 security and moderation controls

Active-user status is checked on every authenticated request, so suspension blocks login and invalidates use of previously issued JWTs. Public marketplace queries join the listing owner and exclude non-active users; public vet queries likewise require an active approved vet. Optional authentication accepts an absent header but rejects invalid bearer tokens.

Admin user, listing, report, and vet decisions write safe structured records to `admin_audit_logs`. Audit metadata never contains passwords, tokens, authorization headers, upload bytes, document keys, or health histories. Report reviewer, timestamp, and bounded admin note are stored separately.

Sensitive auth, upload, listing/report creation, vet application, and admin mutation routes use a configurable in-process limiter and return `429` with `Retry-After`. It deliberately keys authenticated requests by verified JWT subject and otherwise uses the direct client IP; untrusted `X-Forwarded-For` is ignored. This limiter is single-instance only.

API responses include `nosniff`, no-referrer, frame denial, and restrictive camera/microphone/geolocation headers. Production startup rejects placeholder or short JWT secrets, debug mode, and wildcard credentialed CORS. Trusted hosts and docs exposure are configurable.
