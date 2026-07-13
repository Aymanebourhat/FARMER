# Acceptance Criteria — V1

## Farmer

- Farmer can register and log in.
- Farmer can create profile with region/province.
- Farmer can add animal.
- Farmer can upload animal photo.
- Farmer can add weight record.
- Farmer can add health record.
- Farmer can create listing from animal.
- Farmer can mark listing sold.

## Public Buyer/Guest

- Public buyer/guest can browse listings without logging in.
- Public buyer/guest can filter listings.
- Public buyer/guest can open listing detail.
- Public buyer/guest can contact seller by phone/WhatsApp.
- Registered buyer accounts are not supported in V1.

## Vet

- Vet can apply.
- Vet can upload verification document.
- Vet is hidden until admin approval.
- Approved vet appears in directory.

## Admin

- Admin can see users.
- Admin can verify vets.
- Admin can review reported listings.
- Admin can suspend listings.
- Admin can see basic stats.

## Technical

- Role permissions work for farmer, vet, and admin accounts; buyer is not an account role.
- File upload validation works.
- Animal ownership checks work.
- Marketplace pagination works.
- Listing expiration works.
- Arabic/French routing works.
- Mobile layout works.
- No fake static dashboard data.

## Phase 6 V1 acceptance checklist

- Farmer: register/login, create profile, register animal, upload photo, add weight and health records, view dashboard, create/edit/sell listing.
- Guest: browse/filter/view marketplace, contact seller, report listing, browse and view approved vets.
- Vet: register, apply with private document, view pending/rejection, correct and resubmit, appear after approval, disappear after document replacement until reapproved.
- Admin: view real statistics and private vet document, approve/reject vet, inspect users, suspend/reactivate farmer or vet, inspect/suspend/restore listing, dismiss/resolve report, view read-only audit logs.
- Security: direct role guards, suspended-token rejection, public hiding, spoofed/oversized upload rejection, authenticated private document retrieval, invalid bearer rejection, rate-limit `429`, safe error bodies, restricted CORS/hosts.
- Release: compile, full backend tests, migration upgrade/downgrade/upgrade when introduced, frontend lint/typecheck/tests/build, Compose config/build/health, and persistent-volume restart check.
