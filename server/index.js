const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const cors = require('cors');

// Load VAPID keys from env
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.warn('VAPID keys not set. Run gen-keys.js or set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY env vars.');
}

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails('mailto:admin@example.com', VAPID_PUBLIC, VAPID_PRIVATE);
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory subscriptions store (for demo). Use DB in production.
const SUBSCRIPTIONS = [];

app.get('/vapidPublicKey', (req, res) => {
  if (!VAPID_PUBLIC) return res.status(500).json({ error: 'VAPID not configured' });
  res.json({ publicKey: VAPID_PUBLIC });
});

app.post('/subscribe', (req, res) => {
  const { subscription, profile } = req.body;
  if (!subscription) return res.status(400).json({ error: 'Missing subscription' });
  SUBSCRIPTIONS.push({ subscription, profile, createdAt: Date.now() });
  res.json({ success: true });
});

app.post('/send', async (req, res) => {
  const { title, body, url } = req.body;
  const payload = JSON.stringify({ title, body, url });
  const results = [];
  for (const s of SUBSCRIPTIONS) {
    try {
      await webpush.sendNotification(s.subscription, payload);
      results.push({ ok: true });
    } catch (e) {
      results.push({ ok: false, error: e.message });
    }
  }
  res.json({ results });
});

app.post('/send-to', async (req, res) => {
  // send to subscriptions matching profile (degree/year/batch)
  const { degree, year, batch, title, body, url } = req.body;
  const payload = JSON.stringify({ title, body, url });
  const results = [];
  for (const s of SUBSCRIPTIONS) {
    if (s.profile && s.profile.degree === degree && s.profile.year === year && s.profile.batch === batch) {
      try {
        await webpush.sendNotification(s.subscription, payload);
        results.push({ ok: true });
      } catch (e) {
        results.push({ ok: false, error: e.message });
      }
    }
  }
  res.json({ results });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Push server listening on ${port}`));
