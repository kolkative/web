// Endpoint API dummy untuk mengambil link download berdasarkan token
export async function GET({ url }) {
  const token = url.searchParams.get('token');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Token tidak ditemukan' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Simulasi data order (dummy)
  const orders = {
    'demo123': { fileUrl: 'https://drive.google.com/uc?export=download&id=DEMO_FILE_ID' },
    'test456': { fileUrl: 'https://drive.google.com/uc?export=download&id=TEST_FILE_ID' }
  };
  
  const order = orders[token];
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
}
