import test from 'node:test';
import assert from 'node:assert/strict';
import { products, resolveCart } from '../src/lib/products.ts';

test('catalog has unique IDs and integer rupiah prices', () => {
  assert.equal(new Set(products.map(p => p.id)).size, products.length);
  for (const p of products) assert.ok(Number.isSafeInteger(p.price) && p.price > 0);
});

test('server computes total from catalog, never from client prices', () => {
  const result = resolveCart([{ id: 'signal-tee', qty: 2, price: 1 }]);
  assert.equal(result.total, 370000);
  assert.equal(result.items[0].price, 185000);
});

test('server combines repeated SKUs', () => {
  const result = resolveCart([{ id: 'sticker-kit', qty: 2 }, { id: 'sticker-kit', qty: 3 }]);
  assert.equal(result.total, 195000);
  assert.equal(result.items[0].qty, 5);
});

test('server rejects empty/invalid/unknown quantities and products', () => {
  for (const payload of [[], [{ id: 'fake', qty: 1 }], [{ id: 'signal-tee', qty: -1 }], [{ id: 'signal-tee', qty: 100 }], [{ id: 'signal-tee', qty: 1.5 }], [{ id: 'sticker-kit', qty: 10 }, { id: 'sticker-kit', qty: 1 }]]) {
    assert.throws(() => resolveCart(payload));
  }
});
