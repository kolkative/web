type Product = { id: string; name: string; price: number; image: string; category: string; color: string; description: string };
type CartItem = { id: string; qty: number };
const productNode = document.getElementById('product-catalog');
const products = JSON.parse(productNode?.textContent || '[]') as Product[];
const catalog = new Map(products.map(p => [p.id, p]));
const key = 'kolkative-cart-v1';
const lastOrder = sessionStorage.getItem('kolkative-last-order');
const resumeLink = document.getElementById('resume-order-link') as HTMLAnchorElement | null;
if (lastOrder && /^[a-f0-9-]{36}$/i.test(lastOrder) && resumeLink) {
  resumeLink.href = `/orders/${encodeURIComponent(lastOrder)}`; resumeLink.hidden = false;
}
const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const overlay = byId('cart-overlay');
const panel = byId('cart-panel');
const list = byId('drawer-items');
const form = byId<HTMLFormElement>('checkout-form');
let cart: CartItem[] = [];
try {
  const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
  if (Array.isArray(parsed)) cart = parsed.filter((item): item is CartItem =>
    item && typeof item.id === 'string' && catalog.has(item.id) && Number.isInteger(item.qty) && item.qty >= 1 && item.qty <= 10).slice(0,20);
} catch { cart = []; }

function save() { localStorage.setItem(key, JSON.stringify(cart)); render(); }
function count() { return cart.reduce((n, item) => n + item.qty, 0); }
function subtotal() { return cart.reduce((n, item) => n + (catalog.get(item.id)?.price ?? 0) * item.qty, 0); }
let toastTimeout: ReturnType<typeof setTimeout>;
function toast(message: string) {
  const node = byId('toast'); node.textContent = message; node.classList.add('show');
  clearTimeout(toastTimeout); toastTimeout = setTimeout(() => node.classList.remove('show'), 2700);
}
function openCart() { overlay.hidden = false; panel.classList.add('open'); panel.setAttribute('aria-hidden','false'); document.body.classList.add('cart-is-open'); byId('close-cart').focus(); }
function closeCart() { overlay.hidden = true; panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); document.body.classList.remove('cart-is-open'); byId('open-cart').focus(); }
function addItem(id: string) {
  if (!catalog.has(id)) return;
  const item = cart.find(i => i.id === id);
  if (item) { if (item.qty >= 10) return toast('Maximum 10 pieces per item.'); item.qty++; }
  else cart.push({ id, qty: 1 });
  save(); toast('ADDED TO YOUR BAG ✳');
}
function render() {
  const quantity = count();
  byId('cart-count').textContent = String(quantity);
  byId('drawer-cart-count').textContent = `(${quantity})`;
  byId('drawer-total').textContent = rupiah(subtotal());
  byId<HTMLButtonElement>('checkout-button').disabled = !cart.length;
  list.replaceChildren();
  if (!cart.length) {
    const empty = document.createElement('div'); empty.className = 'cart-empty'; empty.innerHTML = '<span>✳</span><h3>YOUR BAG IS EMPTY.</h3><p>Great things start with a single good object.</p>';
    const link = document.createElement('button'); link.className = 'empty-shop-button'; link.textContent = 'KEEP EXPLORING ↗'; link.onclick = closeCart;
    empty.append(link); list.append(empty); return;
  }
  for (const item of cart) {
    const product = catalog.get(item.id)!;
    const row = document.createElement('div'); row.className = 'cart-line';
    const thumb = document.createElement('img'); thumb.src = product.image; thumb.alt = '';
    const thumbWrap = document.createElement('div'); thumbWrap.className = `cart-thumb bg-${product.color}`; thumbWrap.append(thumb);
    const info = document.createElement('div'); info.className = 'cart-info';
    const category = document.createElement('span'); category.className = 'cart-category'; category.textContent = product.category.toUpperCase();
    const name = document.createElement('strong'); name.textContent = product.name;
    const price = document.createElement('span'); price.className = 'cart-line-price'; price.textContent = rupiah(product.price * item.qty);
    const controls = document.createElement('div'); controls.className = 'quantity-controls';
    const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Kurangi ${product.name}`); minus.onclick = () => changeQty(item.id, -1);
    const qty = document.createElement('span'); qty.textContent = String(item.qty);
    const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Tambah ${product.name}`); plus.onclick = () => changeQty(item.id, 1);
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'REMOVE'; remove.className = 'remove-item'; remove.onclick = () => { cart = cart.filter(i => i.id !== item.id); save(); };
    controls.append(minus, qty, plus, remove); info.append(category, name, price, controls); row.append(thumbWrap, info); list.append(row);
  }
}
function changeQty(id: string, step: number) {
  const item = cart.find(i => i.id === id); if (!item) return;
  item.qty += step;
  if (item.qty > 10) { item.qty = 10; toast('Maximum 10 pieces per item.'); }
  if (item.qty < 1) cart = cart.filter(i => i.id !== id);
  save();
}
document.querySelectorAll<HTMLButtonElement>('[data-add]').forEach(button => button.addEventListener('click', () => addItem(button.dataset.add!)));
byId('open-cart').addEventListener('click', openCart);
byId('close-cart').addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && panel.classList.contains('open')) closeCart(); });

const filters = document.querySelectorAll<HTMLButtonElement>('.filter');
const search = byId<HTMLInputElement>('search-products');
let selected = 'All';
function filterProducts() {
  const q = search.value.toLowerCase().trim(); let visible = 0;
  document.querySelectorAll<HTMLElement>('.product-card').forEach(card => {
    const matches = (selected === 'All' || card.dataset.category === selected) && (card.dataset.search || '').includes(q);
    card.hidden = !matches; if (matches) visible++;
  });
  byId('empty-search').hidden = visible > 0;
}
filters.forEach(button => button.addEventListener('click', () => {
  selected = button.dataset.category ?? 'All';
  filters.forEach(btn => { btn.classList.toggle('active', btn === button); btn.setAttribute('aria-pressed', String(btn === button)); });
  filterProducts();
}));
search.addEventListener('input', filterProducts);

form.addEventListener('submit', async event => {
  event.preventDefault(); if (!cart.length) return toast('Your bag is empty.');
  const button = byId<HTMLButtonElement>('checkout-button');
  const error = byId('checkout-error'); error.hidden = true;
  button.disabled = true; button.textContent = 'CREATING PAYMENT...';
  try {
    const fields = new FormData(form);
    const response = await fetch('/api/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fields.get('name'), email: fields.get('email'), mobile: fields.get('mobile'), items: cart }),
    });
    const result = await response.json();
    if (!response.ok || !result.paymentUrl || !result.orderId) throw new Error(result.error || 'Gagal membuat pembayaran.');
    sessionStorage.setItem('kolkative-last-order', String(result.orderId));
    // Hosted Mayar checkout in the same tab. The order status page can be reopened using its ID.
    window.location.assign(String(result.paymentUrl));
  } catch (e) {
    error.textContent = e instanceof Error ? e.message : 'Terjadi kesalahan checkout.';
    error.hidden = false;
    button.disabled = false; button.innerHTML = 'CONTINUE TO PAYMENT <span>↗</span>';
  }
});
render();
