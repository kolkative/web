export type Product = {
  id: string;
  name: string;
  category: 'Apparel' | 'Accessories' | 'Prints';
  price: number;
  image: string;
  color: string;
  tag?: string;
  description: string;
};

// DEMO PRODUCTS. Replace with your own products, images and actual prices.
export const products: Product[] = [
  { id: 'signal-tee', name: 'Signal / Oversized Tee', category: 'Apparel', price: 185000, image: '/products/tee.svg', color: 'sage', tag: 'BESTSELLER', description: 'Heavyweight cotton. Relaxed fit. Everyday uniform.' },
  { id: 'after-hours', name: 'After Hours Hoodie', category: 'Apparel', price: 375000, image: '/products/hoodie.svg', color: 'plum', tag: 'NEW DROP', description: 'Fleece interior, bold back graphic, midnight comfort.' },
  { id: 'carry-all', name: 'Everywhere Tote', category: 'Accessories', price: 89000, image: '/products/tote.svg', color: 'sand', description: 'Canvas heavyweight. Carry good things everywhere.' },
  { id: 'field-cap', name: 'Field Notes Cap', category: 'Accessories', price: 135000, image: '/products/cap.svg', color: 'blue', description: 'Unstructured six-panel cap with small embroidered mark.' },
  { id: 'no-signal', name: 'No Signal / A3 Print', category: 'Prints', price: 75000, image: '/products/poster.svg', color: 'orange', tag: 'LIMITED', description: 'Art print on premium matte paper. A3 size.' },
  { id: 'sticker-kit', name: 'Studio Sticker Pack', category: 'Accessories', price: 39000, image: '/products/stickers.svg', color: 'lemon', description: 'Six small reminders that ordinary is overrated.' },
];

export const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

export function resolveCart(input: unknown) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 20) throw new Error('Keranjang tidak valid.');
  const counts = new Map<string, number>();
  for (const entry of input) {
    if (!entry || typeof entry !== 'object') throw new Error('Item tidak valid.');
    const { id, qty } = entry as { id?: unknown; qty?: unknown };
    if (typeof id !== 'string' || !Number.isInteger(qty) || (qty as number) < 1 || (qty as number) > 10) {
      throw new Error('Jumlah produk tidak valid (maks. 10 per item).');
    }
    if (!products.some(p => p.id === id)) throw new Error('Produk tidak ditemukan.');
    const next = (counts.get(id) ?? 0) + (qty as number);
    if (next > 10) throw new Error('Maksimal 10 per produk.');
    counts.set(id, next);
  }
  const items = [...counts].map(([id, qty]) => {
    const product = products.find(p => p.id === id)!;
    return { id, name: product.name, price: product.price, qty, subtotal: product.price * qty };
  });
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  if (!Number.isSafeInteger(total) || total <= 0) throw new Error('Total pesanan tidak valid.');
  return { items, total };
}
