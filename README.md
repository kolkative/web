# KOLKATIVE STORE — Astro + Mayar API v2

Responsive merchandise store starter (Astro 6 + TypeScript + CSS, **no Tailwind**) using **Mayar Headless API v2**, **Cloudflare Workers**, and **Cloudflare D1**.

> **Status:** working starter, not a deployed real-money store. Sample products/prices and SVG illustrations are demos. Requires your own Mayar account, sandbox key, D1 database, webhook setup, test payments, and production hardening before accepting real orders.

## Features

- Custom responsive storefront, hero, categories, search, product cards.
- Persistent browser cart (localStorage), quantity controls, customer checkout form.
- Astro server endpoint to **recompute prices from trusted server catalog**, not browser totals.
- `POST /hl/v2/payments/create` with `Authorization: Bearer ...`, returns the Mayar hosted checkout URL.
- D1 orders with Mayar payment-request and transaction IDs.
- Order status page `/orders/<order-uuid>` and JSON `GET /api/orders/<order-uuid>` that **checks Mayar Transaction Detail** before marking the order paid.
- Mayar webhook event handler protected by a URL token, treating webhook content only as a notification and **always re-verifying with Mayar API**.
- Sandbox/production environment switch, secrets on server, no API key in client JS.

## 1. Prerequisites

- Node.js 22.12+ (Astro 6)
- Cloudflare account + Wrangler login
- Mayar sandbox account: https://web.mayar.io/ and **Read & Write** API key from https://web.mayar.io/api-keys
- Mayar production account + Read & Write API key later from https://web.mayar.id/api-keys

Documentation: https://docs.mayar.id/api-reference-v2/introduction

## 2. Start locally

```bash
npm install
cp .dev.vars.example .dev.vars
```

Fill in `.dev.vars`:

```ini
MAYAR_API_KEY=your_sandbox_api_key
MAYAR_WEBHOOK_SECRET=an_unpredictable_random_value_at_least_24_chars
```

The `wrangler.jsonc` template already uses `"MAYAR_ENV": "sandbox"`, which means `https://api.mayar.io/hl/v2`. Don't put secrets in `wrangler.jsonc` or Astro `PUBLIC_*` variables.

Create local schema:

```bash
npm run db:local
npm run dev
```

Open http://localhost:4321. You can browse the catalog without a Mayar key. The checkout needs an actual sandbox key and a D1 schema.

**Local D1 note:** The placeholder D1 ID in `wrangler.jsonc` is intended for local development only. Replace it with a real D1 database ID before publishing. If the Cloudflare local D1 binding is not initialized, run the local database command above before testing checkout.

## 3. Configure actual D1 for deployment

```bash
npx wrangler login
npx wrangler d1 create kolkative-store
```

Copy the printed `database_id` to `wrangler.jsonc`, replacing the all-zero UUID. Then initialize the production database:

```bash
npm run db:remote
```

## 4. Create Mayar sandbox payment

Set the key inside `.dev.vars` and run checkout. The server creates a Payment Request with:

```http
POST https://api.mayar.io/hl/v2/payments/create
Authorization: Bearer <YOUR_KEY>
Content-Type: application/json
```

Payload: `name`, `amount`, `email`, `mobile`, `description`, `notes`, `extraData`, `expiredAt`.

Mayar returns `data.id`, `data.transactionId`, `data.link`. These are stored in D1. The customer is redirected to `data.link`.

This implementation **does not pass `redirectUrl`** because Mayar's v2 reference says not every Payment Request record can persist it. The buyer can return to the store and click **TRACK ORDER ↗** in the header (saved within the same browser tab session), or open `/orders/<order-uuid>` from a bookmarked/merchant-provided link. If redirect support is confirmed for your account, you can adapt the payload and return route; always verify status independently.

## 5. Webhook (optional but recommended)

Mayar Register URL Hook endpoint:

```http
POST https://api.mayar.io/hl/v2/webhooks/update
Authorization: Bearer <YOUR_KEY>
Content-Type: application/json

{"urlHook":"https://YOUR-SHOP-DOMAIN/api/webhooks/mayar?token=YOUR_LONG_RANDOM_SECRET"}
```

Register this from the Mayar dashboard API client (or `curl`) **after deploying a public domain**. Keep the token secret and don't paste it into screenshots/logs or public repositories.

The callback listens for Mayar's documented `payment.received` event and reads `data.transactionId`. Since Mayar's public documentation does **not** specify a signed webhook header, this template requires a secret URL token and checks the transaction directly against Mayar API. Receipt alone cannot mark a sale paid. You may alternatively add Cloudflare WAF/rate limiting. Register webhooks per applicable Mayar environment/account.

**Important:** Mayar's callback might be sent in a way different from the sample or be subject to account-specific options. Validate a real sandbox callback via the Mayar test API and logs before relying on automated fulfillment.

## 6. Production deployment (Cloudflare Workers)

After sandbox testing:

1. Change `"MAYAR_ENV": "sandbox"` to `"production"` in `wrangler.jsonc`.
2. Set your production Mayar API key as an encrypted Workers secret (do not commit it).
3. Set the webhook secret as a Workers secret.
4. Deploy:

```bash
npx wrangler secret put MAYAR_API_KEY
npx wrangler secret put MAYAR_WEBHOOK_SECRET
npm run deploy
```

Cloudflare may require a production D1 migration as above and a custom domain configured for your Worker. Test the deployed payment flow end-to-end before accepting real money.

Mayar docs say new API keys can be needed after a merchant domain/subdomain change; regenerate and rotate appropriately.

## Edit the store

| What | File |
|---|---|
| Products, demo prices, category, descriptions | `src/lib/products.ts` |
| Home / Hero / Sections | `src/pages/index.astro` |
| Colors, responsive styles | `src/styles/global.css` |
| SVG product mockups | `public/products/*.svg` |
| Front-end cart and checkout | `src/scripts/store.ts` |
| Mayar fetch integration | `src/lib/mayar.ts` |
| Checkout server endpoint | `src/pages/api/checkout.ts` |
| Order verification | `src/lib/orders.ts` |
| Mayar webhook | `src/pages/api/webhooks/mayar.ts` |

## Important limits / next production steps

This starter implements **payment** and order records; it does **not** include stock management, shipping charges, physical delivery tracking, admin dashboard, invoices/receipts, refunds, couponing, or tax logic. Shipping is not charged or collected in this demo. Add address collection/shipping calculations before selling physical products and ensure the total matches the amount you charge via Mayar.

For a production launch, add durable create-payment idempotency/recovery for network failures, session-bound order access if order details are sensitive, per-IP rate limiting / Turnstile, admin authentication, email notifications, monitoring, and reconciliation jobs. Do not mark orders paid based solely on success URL or untrusted webhook payload. This template stores basic customer contact data in Cloudflare D1; establish a privacy policy and an appropriate retention policy.

### Technical footnotes

- Mayar Single Payment Request create: https://docs.mayar.id/api-reference-v2/reqpayment/create
- Mayar Transaction Detail: https://docs.mayar.id/api-reference-v2/transaction/detail
- Mayar Register Webhook: https://docs.mayar.id/api-reference-v2/webhook/registerurlhook
- Mayar Webhook History event example: https://docs.mayar.id/api-reference-v2/webhook/history
- Astro Cloudflare adapter: https://docs.astro.build/en/guides/integrations-guide/cloudflare/

