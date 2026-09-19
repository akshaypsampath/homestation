# Plan: server-side Google auth (unattended login)

## Problem
The app uses the Google Identity Services token flow in the browser. Access tokens last about an hour and
there is no refresh token. `LoginButton.tsx` renews silently with `prompt: 'none'`, but that opens a popup
that browsers can block when nothing was clicked. On an untouched wall display the login can lapse until
someone taps the screen.

## Goal
Sign in once, then the display keeps pulling Calendar and Drive data indefinitely with no interaction.

## Approach
Switch to the OAuth **authorization code flow** with `access_type=offline`. Google then returns a
**refresh token**, which can mint new access tokens with no browser involved. The refresh token and the
client secret must live on a server, never in the static GitHub Pages bundle.

```
Browser (GitHub Pages)  --GET /token-->  Small server  --refresh_token-->  Google
        ^                                     |  holds client secret + refresh token
        +------------- access token ----------+
```

## Pieces

### 1. Google Cloud
- Create a **Web application** client secret for the existing client (or a new client).
- Add the server callback as an **authorized redirect URI**, e.g. `https://<server>/auth/callback`.
- **Publish the consent screen (In production).** In Testing mode, refresh tokens for sensitive scopes expire
  after 7 days, which defeats the point. Personal use with the "unverified app" warning is fine.

### 2. Server (small, pick one)
| Option | Notes |
|---|---|
| Cloudflare Worker + KV | Free tier, no machine to keep running, KV stores the refresh token |
| Node/Express on the Raspberry Pi | Same box as the kiosk, refresh token in a file, needs HTTPS or a tunnel for the one-time consent |
| Vercel / Netlify function | Works, but needs a datastore for the refresh token |

Recommended: **Cloudflare Worker + KV**.

Endpoints:
- `GET /auth/start` redirects to Google consent with `access_type=offline&prompt=consent` and the same
  four scopes as today (`calendar.readonly`, `calendar.events`, `documents.readonly`, `drive.readonly`).
- `GET /auth/callback` exchanges the `code` for tokens using the client secret and stores the
  `refresh_token`. Run once by the owner.
- `GET /token` returns `{ access_token, expires_in }`. Uses the stored refresh token, caches the access
  token until shortly before expiry.

### 3. Protecting `/token`
`/token` hands out a live Google access token, so it must not be open:
- Require a long random shared key (`Authorization: Bearer <key>` or a header) that only the kiosk knows.
- Restrict CORS to `https://akshaypsampath.github.io` and `http://localhost:5174`.
- Read-only scopes limit the damage if the key leaks. Consider dropping `calendar.events` (write) since
  the app only reads.
- Rotating the key is one secret change on the server.

The kiosk key ends up in the browser, so anyone with the URL and key can read the same data. Acceptable for a
personal display. To avoid it, have the server proxy the Google calls instead of returning a token (more work).

### 4. Frontend changes
- `google-auth-service.ts`: replace `getAccessToken()` with a cached call to `/token`. Refresh when within a
  couple of minutes of `expires_in`, and retry once on a 401.
- `LoginButton.tsx`: no popup logic. Show a "server not connected" state, or remove it and do the one-time
  sign-in by visiting `/auth/start`.
- Remove `@react-oauth/google` and the `GoogleOAuthProvider` wrapper in `main.tsx`.
- Add `VITE_AUTH_SERVER_URL` and the kiosk key to the env and the deploy workflow. The client ID is no
  longer needed in the bundle.

### 5. Rollout
1. Stand up the server and complete `/auth/start` once. Verify `/token` returns a working token.
2. Point the frontend at it behind a flag, keeping the current popup flow as a fallback.
3. Leave the display up for 24 hours to confirm no lapse. Then delete the popup flow.

## Risks and open questions
- **Refresh token revocation:** changing your Google password, revoking app access, or 6 months of no use
  can invalidate it. The app should show a clear "re-authorize" message when `/token` returns an error.
- **Secrets on the server:** client secret, refresh token and kiosk key are all sensitive. Use the platform's
  secret store, not the repo.
- **Older Pi browser:** the frontend part gets simpler (just `fetch`), which should help compatibility.
- **Where to host:** decide between the Worker and the Pi. The Pi option needs a public HTTPS URL for the
  one-time consent redirect, or a temporary tunnel.

## Rough effort
About half a day: server, frontend swap and testing.
