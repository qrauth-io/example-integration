# QRAuth Example Integration

A minimal demo showing two QRAuth features in a single page:

1. **Sign in with QRAuth** — QR-based passwordless authentication via the `<qrauth-login>` web component
2. **Verified QR Codes** — Cryptographically signed QR codes with tamper-proof verification

Live demo: [qrauth.io/demo/integration](https://qrauth.io/demo/integration)

Docs: [docs.qrauth.io/guide/web-components.html](https://docs.qrauth.io/guide/web-components.html)

## Quick Start

```bash
git clone https://github.com/qrauth-io/example-integration.git
cd example-integration
npm install
```

Create a `.env` file with your [QRAuth credentials](https://qrauth.io/dashboard/settings):

```
QRAUTH_API_KEY=qrauth_...
QRAUTH_CLIENT_ID=qrauth_app_...
QRAUTH_CLIENT_SECRET=qrauth_secret_...
```

Register the redirect URI `http://localhost:3000/` on your app in the dashboard (Settings → Apps → Redirect URIs) so the `<qrauth-login>` mobile flow can return to the demo.

```bash
npm start
# Open http://localhost:3000
```

## How It Works

### QR-Based Login (drop-in web component)

```html
<!-- 1. Load the pinned, SRI-verified components bundle -->
<script
  src="https://cdn.qrauth.io/v1/components-0.4.0.js"
  integrity="sha384-ZsvnpXBK9tghmz/PCtZUtR+7qTF7XhR35/SGNfJuJgLOBxnIRi3JYhRt1oFxNtU6"
  crossorigin="anonymous"></script>

<!-- 2. Drop the element into your page. base-url="" routes through
     your backend proxy (see server.js). -->
<qrauth-login
  tenant="qrauth_app_xxx"
  base-url=""
  redirect-uri="http://localhost:3000/"
  scopes="identity email">
</qrauth-login>

<!-- 3. Listen for the qrauth:authenticated event -->
<script>
  document.querySelector('qrauth-login')
    .addEventListener('qrauth:authenticated', async (e) => {
      const { sessionId, signature } = e.detail;
      // Send to your backend for server-side verification.
      await fetch('/api/auth/qrauth-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, signature }),
      });
    });
</script>
```

The backend verifies the session server-side:

```js
const result = await qrauth.verifyAuthResult(sessionId, signature);
if (result.valid) {
  const { email, name } = result.session.user;
  // Issue your own JWT / session
}
```

### Why a backend proxy?

The QRAuth API doesn't allow browser-origin cross-origin requests. `base-url=""` makes `<qrauth-login>` hit your own backend at `/api/v1/auth-sessions*`, which forwards to `https://qrauth.io/api/v1/auth-sessions*` with your client secret attached. The `@qrauth/node` SDK provides `authSessionHandlers()` for exactly this — see `server.js`.

You also need a 307 redirect at `/a/:token` so the mobile approval CTA lands on the real `qrauth.io/a/:token` page. `server.js` shows the pattern.

### Verified QR Codes (3 lines of backend code)

```js
const qr = await qrauth.create({
  destination: 'https://your-site.com/page',
  expiresIn: '30d',
});
// qr.verification_url → https://qrauth.io/v/xK9m2pQ7
// Scanning shows: org identity, trust score, signature proof
```

## Project Structure

```
server.js          — Fastify backend (proxy + callback + /a redirect)
public/index.html  — Single-page frontend (vanilla, no build step)
.env.example       — Required environment variables
```

No database. No migrations. No build step.

## SDKs

- **Node.js**: [`@qrauth/node`](https://www.npmjs.com/package/@qrauth/node)
- **Python**: [`qrauth`](https://pypi.org/project/qrauth/)
- **Web Components**: CDN `https://cdn.qrauth.io/v1/components-0.4.0.js` (SRI-pinned) or `npm install @qrauth/web-components`

Current web-components version and integrity hashes are published at [`cdn.qrauth.io/v1/latest.json`](https://cdn.qrauth.io/v1/latest.json).

## License

MIT
