// Endpoint API dummy untuk mengambil link download berdasarkan token
import type { APIRoute } from 'astro';
import { getOrder } from './dummy-payment';

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Token tidak ditemukan' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const order = getOrder(token);
  if (!order) {
    return new Response(JSON.stringify({ error: 'Token tidak valid' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ fileUrl: order.fileUrl }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}; 