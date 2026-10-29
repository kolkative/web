# Mulai di sini — KOLKATIVE STORE

## Apa yang sudah dibuat

- Home Store (dark editorial), 6 produk contoh, filter kategori, pencarian, keranjang, checkout.
- Backend Astro untuk mengirim pembayaran ke Mayar **API v2**.
- Penyimpanan order Cloudflare D1, pelacakan order, dan verifikasi pembayaran dari API Mayar.
- Webhook Mayar sebagai pemicu pengecekan pembayaran, **bukan** bukti pembayaran.

## Menjalankan di laptop

Persyaratan: Node.js minimal 22.12.

```bash
npm install
cp .dev.vars.example .dev.vars
```

Isi `MAYAR_API_KEY` di `.dev.vars` dengan **API key Mayar Sandbox** dari https://web.mayar.io/api-keys. Buat juga nilai rahasia `MAYAR_WEBHOOK_SECRET` minimal 24 karakter.

Kemudian:

```bash
npm run db:local
npm run dev
```

Buka `http://localhost:4321`.

## Test pembayaran

1. Tambahkan barang ke keranjang.
2. Masukkan nama, email, dan nomor WhatsApp.
3. Klik **CONTINUE TO PAYMENT** untuk membuat link pembayaran Mayar Sandbox.
4. Selesaikan simulasi pembayaran sesuai fasilitas akun Mayar Sandbox.
5. Kembali ke Store dan klik **TRACK ORDER ↗** di header untuk melihat status.

**Jangan gunakan key produksi sebelum tes sandbox lulus.** Harga dan barang masih contoh. Website ini belum menghitung ongkir atau mengumpulkan alamat pengiriman, jadi jangan dipakai untuk menjual barang fisik nyata sebelum menambah fitur tersebut.

## Rilis Cloudflare Workers

```bash
npx wrangler login
npx wrangler d1 create kolkative-store
```

Salin `database_id` dari output ke file `wrangler.jsonc` menggantikan UUID angka nol. Lalu:

```bash
npm run db:remote
npx wrangler secret put MAYAR_API_KEY
npx wrangler secret put MAYAR_WEBHOOK_SECRET
```

Untuk produksi, ubah `MAYAR_ENV` menjadi `production` di `wrangler.jsonc`, masukkan API key **production**, lalu:

```bash
npm run deploy
```

Sesudah punya domain publik, daftarkan webhook URL secara aman seperti instruksi lengkap di `README.md`.

## Mengubah konten

- Produk dan harga: `src/lib/products.ts`
- Teks dan susunan homepage: `src/pages/index.astro`
- Tampilan: `src/styles/global.css`
- Gambar: `public/products`
- Pengaturan Mayar: `src/lib/mayar.ts`

**Catatan:** ini starter yang perlu konfigurasi API, D1, dan pengujian transaksi asli/sandbox. Aku belum dapat menguji API Mayar memakai akun milikmu atau mempublikasikan website tanpa kredensialmu.
