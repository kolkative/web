import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getOrder, publicOrder, verifyAndUpdateOrder } from '../../../lib/orders';

export const prerender = false;
export const GET: APIRoute = async ({ params }) => {
  const id = params.id ?? '';
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(JSON.stringify({ error: 'ID tidak valid.' }), { status: 400, headers });
  try {
    let order = await getOrder(env.DB, id);
    if (!order) return new Response(JSON.stringify({ error: 'Order tidak ditemukan.' }), { status: 404, headers });
    if (order.status === 'pending') {
      try { order = await verifyAndUpdateOrder(env.DB, env, order); }
      catch (e) { console.warn('Unable to verify order yet', e); }
    }
    return new Response(JSON.stringify(publicOrder(order)), { headers });
  } catch (error) {
    console.error('Order lookup error', error);
    return new Response(JSON.stringify({ error: 'Gagal memuat pesanan.' }), { status: 500, headers });
  }
};
