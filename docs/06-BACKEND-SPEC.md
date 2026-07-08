# Backend Spec — V1

## Architecture style

FastAPI modular monolith.

## Suggested structure

```text
backend/
  app/
    main.py
    core/
      config.py
      security.py
      database.py
      exceptions.py
      pagination.py
      permissions.py
      regions.py
    modules/
      auth/
        models.py
        schemas.py
        routes.py
        service.py
        repository.py
      users/
      farmers/
      animals/
      weights/
      health/
      marketplace/
      vets/
      admin/
      media/
      analytics/
    migrations/
    scripts/
      create_admin.py
    tests/
```

## Layer responsibilities

| Layer | Responsibility |
|---|---|
| Routes | HTTP request/response and dependency injection |
| Schemas | Pydantic validation and serialization |
| Services | Business logic and transactions |
| Repositories | Database access |
| Models | SQLAlchemy models |
| Permissions | Role and ownership checks |

## Critical backend rules

- V1 account roles are `farmer`, `vet`, and `admin`; buyers are public/guest users only.
- Public registration accepts only `farmer` or `vet` and must reject `admin`.
- Admin users are created only through `backend/app/scripts/create_admin.py`.
- Phase 1 auth uses access JWTs only. Do not add refresh-token persistence/revocation unless a schema is explicitly added later.
- `phone_verified` remains `false` in Phase 1; `/auth/verify-phone` is deferred until SMS/OTP provider selection.
- `PATCH /api/v1/farmers/me` is an upsert endpoint.
- Region/province values must be validated against static Morocco constants in `backend/app/core/regions.py`.
- `profile_completion_score` is calculated from filled farmer profile fields using the formula in `docs/03-DATABASE-SCHEMA.md`.
- Use transactions when creating listings and updating animal status.
- Never allow farmer A to edit farmer B's animals/listings.
- Prevent active duplicate listings per animal.
- Reject listing creation if animal has no photo.
- Reject listing creation if animal is sold, dead, or deleted.
- Vet verification is admin-only.
- Public vet directory returns only approved vets.
- Public marketplace returns only active listings.
- Listing expiry must be handled either by query filtering or a scheduled job.

## Testing focus

Phase 1 must test:

- farmer/vet registration and login,
- admin registration rejection,
- admin creation script behavior,
- access-token protected `/auth/me`,
- farmer profile upsert,
- region/province validation,
- profile completion score calculation.

Later phases must test:

- ownership checks,
- listing creation rules,
- file upload validation,
- vet approval/rejection,
- listing reports,
- admin moderation.
