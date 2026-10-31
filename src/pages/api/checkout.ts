import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createPayment } from '../../lib/mayar';
import { resolveCart } from '../../lib/products';

export const prerender = false;
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get('origin') && new URL(request.headers.get('origin')!).origin !== new URL(request.url).origin) {
    return json({ error: 'Origin tidak diizinkan.' }, 403);
  }
  if (!(request.headers.get('content-type') || '').includes('application/json')) {
    return json({ error: 'Content-Type harus JSON.' }, 415);
  }
  if (Number(request.headers.get('content-length') || 0) > 12000) return json({ error: 'Payload terlalu besar.' }, 413);

  let id = '';
  try {
    const payload = await request.json() as Record<string, unknown>;
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const mobile = typeof payload.mobile === 'string' ? payload.mobile.trim() : '';
    if (name.length < 2 || name.length > 90) return json({ error: 'Nama harus 2-90 karakter.' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) return json({ error: 'Email tidak valid.' }, 400);
    if (!/^\+?[0-9\s-]{9,18}$/.test(mobile)) return json({ error: 'Nomor WhatsApp tidak valid.' }, 400);
    const { items, total } = resolveCart(payload.items);
    id = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO orders (id, customer_name, customer_email, customer_phone, items_json, total) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(id, name, email, mobile, JSON.stringify(items), total).run();

    const payment = await createPayment(env, {
      name: `Order KOLKATIVE ${id.slice(0, 8).toUpperCase()}`,
      amount: total,
      email,
      mobile,
      description: items.map(i => `${i.name} x${i.qty}`).join(' / ').slice(0, 450),
      notes: `Order ID: ${id}`,
      extraData: { orderId: id },
      expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    if (!payment.id || !payment.transactionId || !payment.link || new URL(payment.link).protocol !== 'https:') {
      throw new Error('Mayar tidak mengembalikan informasi checkout lengkap.');
    }
    await env.DB.prepare(`UPDATE orders SET status = 'pending', mayar_payment_id = ?, mayar_transaction_id = ?, payment_url = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(payment.id, payment.transactionId, payment.link, id).run();
    return json({ orderId: id, paymentUrl: payment.link });
  } catch (error) {
    if (id) {
      try { await env.DB.prepare("UPDATE orders SET status = 'failed', updated_at = datetime('now') WHERE id = ? AND status = 'creating'").bind(id).run(); } catch { /* log only */ }
    }
    console.error('Checkout error:', error instanceof Error ? error.message : error);
    return json({ error: error instanceof Error && /Keranjang|produk|Produk|Jumlah|Total|Maksimal/.test(error.message) ? error.message : 'Checkout tidak dapat diproses. Pastikan konfigurasi Mayar dan database benar.' }, 502);
  }
};
