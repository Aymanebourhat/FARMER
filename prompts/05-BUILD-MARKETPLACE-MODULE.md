# Codex Prompt — 05 Build Marketplace Module

```text
Build the marketplace vertical slice.

Backend:
- marketplace_listings model/schema/routes/service/repository
- create listing from animal
- public listing search
- listing detail
- mark sold
- renew listing
- report listing
- trust score calculation
- listing expiry behavior

Frontend:
- /marketplace
- /marketplace/[id]
- /listings
- /listings/new?animalId=...
- filters by species, region, province, price, weight, sex, readiness
- phone/WhatsApp contact buttons
- report listing UI

Rules:
- listing requires animal photo
- one active listing per animal
- dead/sold/deleted animals cannot be listed
- no payments, escrow, delivery, or auctions

Run checks and report files changed.
```
