# Frontend Development Guide

## Prerequisites

- Node.js compatible with Angular 21
- npm 11 (the project declares npm 11.6.2)
- A running backend API, normally on port 8585 for local Docker use

## Commands

```powershell
cd frontend
npm install
npm start
npm run build
npm test
npx tsc --noEmit -p tsconfig.app.json
```

## Configuration

`src/app/config.ts` holds the active API location. Use the local URL during development and the HTTPS public URL for deployed builds. A frontend build is static: changing its API URL normally requires a rebuild and redeployment.

## Form checklist

- Use `required`, correct input types, and disabled submit buttons for basic user feedback.
- Convert numeric fields with `Number(value)` before calling APIs when a form control can produce strings.
- Use `FormData` for uploads and do not set the `Content-Type` header manually.
- Leave server-side validation enabled; browser checks are only a convenience.

## Quality checks

Before delivery, run the type check and production build. Manually test login, logout, a permitted page, a forbidden page, one create/edit workflow, an upload, and a download.
