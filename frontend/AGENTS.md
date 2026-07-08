# frontend/AGENTS.md

## Frontend-specific rules

- Use Next.js, TypeScript, Tailwind CSS, React Hook Form, Zod, and Recharts.
- Use API endpoints from `docs/04-API-SPEC.md` only.
- Centralize API calls in `lib/api-client.ts` or equivalent.
- Every screen must handle loading, error, empty, and success states.
- Every form must show validation messages.
- Mobile-first behavior is mandatory.
- Keep UI lightweight for low-end devices.
- Do not invent backend data fields.
- Do not add heavy animation libraries in V1.
