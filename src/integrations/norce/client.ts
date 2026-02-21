import { supabase } from '@/integrations/supabase/client';
import type {
  NorceODataResponse,
  NorceProduct,
  NorceProductSku,
  NorceCustomer,
  NorceOrder,
  NorceQueryParams,
} from '@/types/norce';

const appIdFromEnv = Number(import.meta.env.VITE_NORCE_APPLICATION_ID ?? '1042');
const DEFAULT_APP_ID = Number.isFinite(appIdFromEnv) ? appIdFromEnv : 1042;

function escapeODataString(value: string): string {
  return value.replace(/'/g, "''");
}

async function queryNorce<T>(
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

export async function fetchNorceCustomerByCode(customerCode: string): Promise<NorceCustomer | null> {
  const code = customerCode.trim();
  if (!code) return null;

  const res = await queryNorce<NorceCustomer>('Customers/Customers', {
    $top: 1,
    $filter: `CustomerCode eq '${escapeODataString(code)}'`,
  });

  return res.value?.[0] ?? null;
}
