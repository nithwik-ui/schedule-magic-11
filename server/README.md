# Push Server (demo)

This small Node server demonstrates how to accept push subscriptions and send pushes using `web-push`.

Setup

1. Install dependencies

```bash
cd server
npm install
```

2. Generate VAPID keys (one-time)

```bash
node gen-keys.js
```

Copy the printed `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` and set them in the environment when running the server.

Run server (example):

```bash
VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... node index.js
```

Endpoints

- `GET /vapidPublicKey` -> returns `{ publicKey }`
- `POST /subscribe` -> accept body `{ subscription, profile }` and stores it in-memory
- `POST /send` -> send to all subscriptions; body `{ title, body, url }`
- `POST /send-to` -> send to subscriptions matching `{ degree, year, batch }` with `{ title, body, url }`

Notes

- This server stores subscriptions in memory (for demo). For production, persist in a DB and handle unsubscribes and invalid subscriptions.
- You must serve your frontend over https (or localhost) for push to work.
