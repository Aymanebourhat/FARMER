# Codex Prompt — 04 Build Livestock Module

```text
Build the livestock registry vertical slice.

Backend:
- animals model/schema/routes/service/repository
- animal photos model and upload validation
- weight_records model/routes
- health_records model/routes
- ownership permissions
- tests for ownership and validation

Frontend:
- /animals
- /animals/new
- /animals/[id]
- /animals/[id]/growth
- /animals/[id]/health
- image upload UI with validation
- loading/error/empty/success states

Rules:
- farmer can only access own animals
- animal must have birth_date or estimated_age_months
- no listing logic yet except status fields

Run checks and report files changed.
```
