export type MayarConfig = { MAYAR_API_KEY: string; MAYAR_ENV: string };
export type MayarResponse<T> = { statusCode: number; messages?: string; message?: string; data: T };
export type CreatePaymentData = { id: string; transactionId: string; link: string };
export type TransactionData = {
  id: string;
  status: string;
  amount: number;
  paymentLink?: { id?: string };
};

const baseURL = (env: MayarConfig) =>
  env.MAYAR_ENV === 'production' ? 'https://api.mayar.id/hl/v2' : 'https://api.mayar.io/hl/v2';

export async function mayarRequest<T>(env: MayarConfig, path: string, options: RequestInit = {}): Promise<T> {
  if (!env.MAYAR_API_KEY || env.MAYAR_API_KEY.includes('PASTE_')) throw new Error('API key Mayar belum dikonfigurasi.');
  const response = await fetch(`${baseURL(env)}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.MAYAR_API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
    signal: AbortSignal.timeout(12000),
  });
  let payload: MayarResponse<T> | undefined;
  try { payload = await response.json() as MayarResponse<T>; } catch { /* Mayar may return a non-JSON error */ }
  if (!response.ok || !payload || (payload.statusCode && payload.statusCode >= 400) || !payload.data) {
    throw new Error(`Mayar API gagal (${response.status}): ${payload?.messages || payload?.message || 'Unknown error'}`);
  }
  return payload.data;
}

export const createPayment = (env: MayarConfig, body: Record<string, unknown>) =>
  mayarRequest<CreatePaymentData>(env, '/payments/create', { method: 'POST', body: JSON.stringify(body) });

export const getTransaction = (env: MayarConfig, transactionId: string) =>
  mayarRequest<TransactionData>(env, `/transactions/${encodeURIComponent(transactionId)}`);
