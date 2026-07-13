# Frontend

Next.js frontend extending the existing localized application shell for farmers, guests, vets, and admins.

## Setup and validation

Copy `.env.example` to an untracked environment file when needed, then:

```powershell
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

The API origin is centralized through `NEXT_PUBLIC_API_BASE_URL`. Admin pages use the existing token/session handling and direct role guards. Supported locale routes remain Arabic, Moroccan Darija, French, and English; Arabic and Darija retain RTL layout.

The production Docker image uses Next.js standalone output and contains no backend secrets or private uploads.
