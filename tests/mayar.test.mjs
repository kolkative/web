import test from 'node:test';
import assert from 'node:assert/strict';
import { createPayment, getTransaction } from '../src/lib/mayar.ts';

test('Mayar sandbox payment uses v2 URL, Bearer secret, and expected payload', async () => {
  const before = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return new Response(JSON.stringify({ statusCode: 200, messages: 'success', data: { id: 'payment-id', transactionId: 'trx-id', link: 'https://testingmayar.myr.id/pl/abc' } }), { status: 200 });
  };
  try {
    const data = await createPayment({ MAYAR_ENV: 'sandbox', MAYAR_API_KEY: 'test-secret' }, { name: 'Order test', amount: 185000 });
    assert.equal(captured.url, 'https://api.mayar.io/hl/v2/payments/create');
    assert.equal(captured.options.headers.Authorization, 'Bearer test-secret');
    assert.equal(JSON.parse(captured.options.body).amount, 185000);
    assert.equal(data.transactionId, 'trx-id');
  } finally { globalThis.fetch = before; }
});

test('Production verification fetches transaction detail by ID', async () => {
  const before = globalThis.fetch;
  let endpoint;
  globalThis.fetch = async url => {
    endpoint = url;
    return new Response(JSON.stringify({ statusCode: 200, data: { id: 'my-trx', status: 'paid', amount: 75000 } }), { status: 200 });
  };
  try {
    const trx = await getTransaction({ MAYAR_ENV: 'production', MAYAR_API_KEY: 'test-secret' }, 'my-trx');
    assert.equal(endpoint, 'https://api.mayar.id/hl/v2/transactions/my-trx');
    assert.equal(trx.status, 'paid');
  } finally { globalThis.fetch = before; }
});

test('API request with missing key fails safely', async () => {
  await assert.rejects(() => createPayment({ MAYAR_ENV: 'sandbox', MAYAR_API_KEY: '' }, {}));
});
