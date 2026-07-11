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
