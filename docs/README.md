# IHSAN RMS Frontend Documentation

This folder documents the Angular administration application.

| Document | Purpose |
| --- | --- |
| [Architecture](ARCHITECTURE.md) | Application structure, routes, modules, state, and request flow. |
| [Development](DEVELOPMENT.md) | Local setup, useful commands, and code conventions. |
| [Deployment](DEPLOYMENT.md) | Production build and web-server deployment. |

## Quick start

```powershell
cd frontend
npm install
npm start
```

The development server runs at `http://localhost:4200`. For the local backend Docker configuration, set `serverUrl` and `apiBase` in `src/app/config.ts` to `http://localhost:8585` and `http://localhost:8585/api`.

Never put passwords, JWTs, SMTP credentials, or database credentials in frontend source or build output.
