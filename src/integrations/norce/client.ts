import { supabase } from '@/integrations/supabase/client';
import type {
  NorceODataResponse,
  NorceProduct,
  NorceProductSku,
  NorceCustomer,
  NorceOrder,
  NorceQueryParams,
} from '@/types/norce';

const IS_DEV = import.meta.env.DEV;

const CLIENT_ID = 'bbd0c062-2bd8-46f2-9b9b-6d13c4caf14e';
const CLIENT_SECRET = 'e152968f-cde7-4f88-ab21-57293a2ccda2';
const DEFAULT_APP_ID = 1042;

// In-memory token cache
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getDevToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 60_000) {
    return cachedToken;
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: 'playground',
  });

  const res = await fetch('/norce-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Norce token request failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;
  return cachedToken!;
}

// Dev mode: call Norce directly via Vite proxy
async function queryNorceDev<T>(
  endpoint: string,
  params?: NorceQueryParams,
): Promise<NorceODataResponse<T>> {
  const token = await getDevToken();

  const url = new URL(`/norce-query/${endpoint}`, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ApplicationId: String(DEFAULT_APP_ID),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Norce API error ${res.status}: ${errorText}`);
  }

  return (await res.json()) as NorceODataResponse<T>;
}

// Production: call via Supabase Edge Function proxy
async function queryNorceProd<T>(
  endpoint: string,
  params?: NorceQueryParams,
): Promise<NorceODataResponse<T>> {
  const { data, error } = await supabase.functions.invoke('norce-proxy', {
    body: { endpoint, params, applicationId: DEFAULT_APP_ID },
  });

  if (error) {
    throw new Error(`Norce proxy error: ${error.message}`);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as NorceODataResponse<T>;
}

async function queryNorce<T>(
  endpoint: string,
  params?: NorceQueryParams,
): Promise<NorceODataResponse<T>> {
  return IS_DEV
    ? queryNorceDev<T>(endpoint, params)
    : queryNorceProd<T>(endpoint, params);
}

export async function fetchNorceProducts(
  params?: NorceQueryParams,
): Promise<NorceODataResponse<NorceProduct>> {
  return queryNorce<NorceProduct>('Products/Products', {
    $top: 50,
    $orderby: 'DefaultName',
    ...params,
  });
}

export async function fetchNorceProductSkus(
  params?: NorceQueryParams,
): Promise<NorceODataResponse<NorceProductSku>> {
  return queryNorce<NorceProductSku>('Products/ProductSkus', {
    $top: 50,
    $orderby: 'PartNo',
    ...params,
  });
}

export async function fetchNorceOrders(
  params?: NorceQueryParams,
): Promise<NorceODataResponse<NorceOrder>> {
  return queryNorce<NorceOrder>('Orders/Orders', {
    $top: 50,
    $orderby: 'OrderDate desc',
    ...params,
  });
}

export async function fetchNorceCustomers(
  params?: NorceQueryParams,
): Promise<NorceODataResponse<NorceCustomer>> {
  return queryNorce<NorceCustomer>('Customers/Customers', {
    $top: 50,
    $orderby: 'Created desc',
    ...params,
  });
}
