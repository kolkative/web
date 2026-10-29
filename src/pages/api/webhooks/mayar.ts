import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getOrder, verifyAndUpdateOrder } from '../../../lib/orders';

export const prerender = false;

const json = (obj: unknown, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
export const POST: APIRoute = async ({ request, url }) => {
  // Mayar v2's public documentation does not specify a mandatory signed header.
  // Protect the callback with an unguessable URL secret, AND ALWAYS verify with Mayar API.
  const expected = env.MAYAR_WEBHOOK_SECRET;
  const provided = url.searchParams.get('token') ?? '';
  if (!expected || expected.length < 24 || provided.length !== expected.length) return json({ error: 'Unauthorized' }, 401);
  const enc = new TextEncoder();
  const a = enc.encode(expected), b = enc.encode(provided);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff !== 0) return json({ error: 'Unauthorized' }, 401);

  if (Number(request.headers.get('content-length') || 0) > 30000) return json({ error: 'Too large' }, 413);
  let payload: { event?: string; data?: { transactionId?: string } };
  try { payload = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  if (payload.event !== 'payment.received') return json({ received: true, ignored: true });
  const transactionId = payload.data?.transactionId;
  if (!transactionId || !/^[0-9a-f-]{36}$/i.test(transactionId)) return json({ received: true, ignored: true });
  const row = await env.DB.prepare('SELECT id FROM orders WHERE mayar_transaction_id = ?').bind(transactionId).first<{ id: string }>();
  if (!row) return json({ received: true, ignored: true });
  const order = await getOrder(env.DB, row.id);
  if (order) {
    try { await verifyAndUpdateOrder(env.DB, env, order); }
    catch (error) { console.error('Mayar verification failed:', error); return json({ error: 'Verification temporarily unavailable' }, 503); }
  }
  return json({ received: true });
};
