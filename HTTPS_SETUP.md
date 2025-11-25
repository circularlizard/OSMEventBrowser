# Local HTTPS Development Setup

This project uses HTTPS in local development to match production OAuth requirements.

## Setup

The SSL certificates have been generated using `mkcert`. To run the development server with HTTPS:

```bash
npm run dev:https
```

The app will be available at: **https://localhost:3000**

## Regenerating Certificates

If you need to regenerate the certificates:

```bash
cd .cert
mkcert localhost 127.0.0.1 ::1
```

## OAuth Configuration

Make sure your OSM OAuth redirect URI is set to:
```
https://localhost:3000/api/oauth-callback
```

For production deployment on Vercel, update to:
```
https://your-app.vercel.app/api/oauth-callback
```
