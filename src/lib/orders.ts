import { getTransaction } from './mayar';
import type { MayarConfig } from './mayar';

export type OrderRow = {
  id: string;
  status: 'creating' | 'pending' | 'paid' | 'expired' | 'failed';
  total: number;
  items_json: string;
  mayar_payment_id: string | null;
  mayar_transaction_id: string | null;
  payment_url: string | null;
  created_at: string;
  paid_at: string | null;
};

export async function getOrder(db: D1Database, id: string): Promise<OrderRow | null> {
  return db.prepare('SELECT id, status, total, items_json, mayar_payment_id, mayar_transaction_id, payment_url, created_at, paid_at FROM orders WHERE id = ?')
    .bind(id).first<OrderRow>();
}

export async function verifyAndUpdateOrder(db: D1Database, env: MayarConfig, order: OrderRow) {
  if (order.status === 'paid' || !order.mayar_transaction_id) return order;
  const transaction = await getTransaction(env, order.mayar_transaction_id);
  // Never treat browser state, webhooks, or Mayar redirects as proof of payment.
  // Cross-check the transaction ID and its server-side authoritative amount.
  if (transaction.id !== order.mayar_transaction_id || transaction.amount !== order.total) {
    throw new Error('Mayar transaction identity/amount mismatch');
  }
  if (transaction.paymentLink?.id && order.mayar_payment_id && transaction.paymentLink.id !== order.mayar_payment_id) {
    throw new Error('Mayar payment link mismatch');
  }
  const next = transaction.status === 'paid' ? 'paid' : transaction.status === 'expired' ? 'expired' : 'pending';
  if (next !== order.status) {
    await db.prepare(`UPDATE orders SET status = ?, paid_at = CASE WHEN ? = 'paid' THEN datetime('now') ELSE paid_at END, updated_at = datetime('now') WHERE id = ? AND status != 'paid'`)
      .bind(next, next, order.id).run();
  }
  return (await getOrder(db, order.id)) ?? order;
}

export function publicOrder(order: OrderRow) {
  return {
    id: order.id,
    status: order.status,
    total: order.total,
    items: JSON.parse(order.items_json) as { id: string; name: string; qty: number; subtotal: number }[],
    paymentUrl: order.payment_url,
    createdAt: order.created_at,
    paidAt: order.paid_at,
  };
}
