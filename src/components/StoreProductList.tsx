import { h } from 'preact';
import { useState } from 'preact/hooks';
import type { JSX } from 'preact';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

const products = [
  {
    id: 'produk-1',
    name: 'Ebook Kolkative',
    desc: 'Ebook digital seputar komunitas Kolkative.',
    price: 100000,
  },
  {
    id: 'produk-2',
    name: 'Template Desain',
    desc: 'Template desain siap pakai untuk branding.',
    price: 50000,
  },
];

export default function StoreProductList(): JSX.Element {
  const [loading, setLoading] = useState(''); // loading id produk
  const [error, setError] = useState('');

  const handleOrder = async (productId: string) => {
    setLoading(productId);
    setError('');
    const res = await fetch('/api/dummy-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@dummy.com', productId }),
    });
    const data = await res.json();
    setLoading('');
    if (data.token) {
      window.location.href = '/download?token=' + data.token;
    } else {
      setError('Gagal membuat order.');
    }
  };

  return (
    <div class="max-w-2xl mx-auto space-y-8">
      {products.map(product => (
        <div class="border p-6 rounded shadow" key={product.id}>
          <h2 class="text-xl font-bold">{product.name}</h2>
          <p class="mb-2">{product.desc}</p>
          <p class="mb-4 font-semibold">Rp {product.price.toLocaleString()}</p>
          <button
            class="px-4 py-2 bg-primary text-white rounded"
            disabled={loading === product.id}
            onClick={() => handleOrder(product.id)}
          >
            {loading === product.id ? 'Memproses...' : 'Order & Download'}
          </button>
          {error && <p class="text-red-500 mt-2">{error}</p>}
        </div>
      ))}
    </div>
  );
} 