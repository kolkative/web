// Endpoint API dummy untuk simulasi pembayaran dan generate token download

// Simulasi database order dan token
const orders = {};

export async function POST({ request }) {
  try {
    const { email, productId } = await request.json();
    
    // Simulasi: mapping produk ke file Google Drive
    const productFiles = {
      'produk-1': 'https://drive.google.com/uc?export=download&id=FILE_ID_1',
      'produk-2': 'https://drive.google.com/uc?export=download&id=FILE_ID_2',
    };
    
    const fileUrl = productFiles[productId] || productFiles['produk-1'];
    
    // Generate token unik (dummy)
    const token = Math.random().toString(36).substring(2, 10);
    orders[token] = { email, fileUrl };
    
    // Simulasi: langsung sukses (tanpa payment gateway)
    return new Response(JSON.stringify({ success: true, token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Untuk keperluan demo, expose orders (jangan lakukan di production!)
export function getOrder(token) {
  return orders[token];
}
