/// <reference types="astro/client" />
// Run `npm run types` after configuring Wrangler to generate Cloudflare Env types.
interface Env {
  DB: D1Database;
  MAYAR_API_KEY: string;
  MAYAR_ENV: 'sandbox' | 'production';
  MAYAR_WEBHOOK_SECRET: string;
}
