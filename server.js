import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env if present (no dependency needed)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

import Fastify from 'fastify';
import { QRAuth } from '@qrauth/node';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const {
  QRAUTH_API_KEY,
  QRAUTH_CLIENT_ID,
  QRAUTH_CLIENT_SECRET,
  PORT = '3000',
} = process.env;

if (!QRAUTH_API_KEY || !QRAUTH_CLIENT_ID || !QRAUTH_CLIENT_SECRET) {
  console.error('Missing env vars. Copy .env.example to .env and fill in your QRAuth credentials.');
  process.exit(1);
}

const qrauth = new QRAuth({
  apiKey: QRAUTH_API_KEY,
  clientId: QRAUTH_CLIENT_ID,
  clientSecret: QRAUTH_CLIENT_SECRET,
});

const proxy = qrauth.authSessionHandlers();

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const app = Fastify({ logger: true });

// Serve the single-page frontend
const indexHtml = readFileSync(join(__dirname, 'public', 'index.html'), 'utf-8')
  .replace('__QRAUTH_CLIENT_ID__', QRAUTH_CLIENT_ID);

app.get('/', (_, reply) => {
  reply.type('text/html').send(indexHtml);
});

// ---------------------------------------------------------------------------
// Auth-session proxy (browser SDK needs these)
// ---------------------------------------------------------------------------

app.post('/api/v1/auth-sessions', async (request, reply) => {
  const { status, body } = await proxy.createSession(request.body);
  reply.status(status).send(body);
});

app.get('/api/v1/auth-sessions/:id', async (request, reply) => {
  const { id } = request.params;
  const { status, body } = await proxy.getSession(id, request.query);
  reply.status(status).send(body);
});

// Verify callback — called by frontend after SDK onSuccess
app.post('/api/auth/callback', async (request, reply) => {
  const { sessionId, signature } = request.body;
  const result = await qrauth.verifyAuthResult(sessionId, signature);

  if (!result.valid) {
    return reply.status(401).send({ error: 'Verification failed' });
  }

  // In a real app you'd issue a JWT or session here.
  // For the demo we just return the verified user.
  reply.send({
    message: 'Authenticated',
    user: result.session.user,
  });
});

// ---------------------------------------------------------------------------
// QR code generation
// ---------------------------------------------------------------------------

app.post('/api/qrcodes', async (request, reply) => {
  const { url, label } = request.body;

  if (!url) {
    return reply.status(400).send({ error: 'url is required' });
  }

  const qr = await qrauth.create({
    destination: url,
    label: label || undefined,
    expiresIn: '30d',
  });

  reply.send({
    token: qr.token,
    verification_url: qr.verification_url,
    qr_image_url: qr.qr_image_url,
    expires_at: qr.expires_at,
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen({ port: Number(PORT), host: '0.0.0.0' }, (err) => {
  if (err) { app.log.error(err); process.exit(1); }
  console.log(`\n  Demo running at http://localhost:${PORT}\n`);
});
