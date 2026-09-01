import { createClient } from '@supabase/supabase-js';

const CASHFREE_API = 'https://api.cashfree.com/pg';

export const CASHFREE_ORDER_PREFIX = 'LMS';

export function createServiceClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase credentials not configured');
  return createClient(supabaseUrl, serviceKey);
}

export function getCashfreeHeaders(auth = false) {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Cashfree credentials not configured');
  const headers = {
    'Content-Type': 'application/json',
    'x-api-version': '2022-09-01',
    'Accept': 'application/json',
  };
  if (auth) {
    headers['x-client-id'] = clientId;
    headers['x-client-secret'] = clientSecret;
  }
  return { clientId, clientSecret, headers };
}

// Create a Cashfree order and return its payment_session_id (for the Drop-in checkout SDK).
export async function createCashfreeOrder({ orderId, amount, customer, planName }) {
  const { headers } = getCashfreeHeaders(true);
  const body = {
    order_id: orderId,
    order_amount: Number(amount),
    order_currency: 'INR',
    order_note: `Purchase - ${planName}`,
    customer_details: {
      customer_id: customer.id,
      customer_name: customer.name || 'Student',
      customer_email: customer.email,
      customer_phone: customer.phone || '9000000000',
    },
    order_meta: {
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/student/buy-courses?status=return`,
    },
  };
  const res = await fetch(`${CASHFREE_API}/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to create Cashfree order');
  }
  return data;
}
