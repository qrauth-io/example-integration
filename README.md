# QRAuth Example Integration

A minimal demo showing two QRAuth features in a single page:

1. **Sign in with QRAuth** — QR-based passwordless authentication
2. **Verified QR Codes** — Cryptographically signed QR codes with tamper-proof verification

Live demo: [demo.qrauth.io](https://demo.qrauth.io)

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

```bash
npm start
# Open http://localhost:3000
```

## How It Works

### QR-Based Login (6 lines of frontend code)

```html
<script src="https://qrauth.io/sdk/qrauth-auth.js"></script>
<script>
  new QRAuth({
    clientId: 'qrauth_app_xxx',
    element: '#login',
    onSuccess: (result) => {
      // result.sessionId + result.signature
      // Send to your backend to verify
    },
  });
</script>
```

The backend verifies the session:

```js
const result = await qrauth.verifyAuthResult(sessionId, signature);
if (result.valid) {
  const { email, name } = result.session.user;
  // Issue your own JWT / session
}
```

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
server.js          — Fastify backend (~90 lines)
public/index.html  — Single-page frontend (vanilla JS, no build step)
.env.example       — Required environment variables
```

No database. No migrations. No build step.

## SDKs

- **Node.js**: [`@qrauth/node`](https://www.npmjs.com/package/@qrauth/node)
- **Python**: [`qrauth`](https://pypi.org/project/qrauth/)
- **Browser**: Load from CDN (`https://qrauth.io/sdk/qrauth-auth.js`)

## License

MIT
