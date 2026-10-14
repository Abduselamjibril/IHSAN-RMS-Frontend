# Frontend Deployment

## Build

```powershell
cd frontend
npm ci
npm run build
```

Deploy the generated files from `dist/` to a static web server, CDN, or hosting service. The host must serve `index.html` for unknown application paths so Angular routing works after browser refresh.

## Production configuration

Before building, confirm `src/app/config.ts` uses the public HTTPS API URL:

```ts
serverUrl: 'https://example.com',
apiBase: 'https://example.com/api'
```

The API must enable credentialed CORS for the frontend origin. Because the application uses an HttpOnly session cookie, frontend and backend should normally use the same HTTPS domain.

## Nginx example

```nginx
server {
  listen 443 ssl;
  server_name admin.example.com;
  root /var/www/ihsan-rms;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

Use valid TLS certificates. Do not serve production login pages over HTTP.

## Release verification

1. Sign in successfully.
2. Refresh a deep route such as `/finance/collections`.
3. Confirm requests use the expected HTTPS `/api` URL.
4. Confirm protected file downloads work without a token in the URL.
5. Confirm logout invalidates the session.
