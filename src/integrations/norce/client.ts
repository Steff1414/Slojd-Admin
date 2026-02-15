import { supabase } from '@/integrations/supabase/client';
import type {
  NorceODataResponse,
  NorceProduct,
  NorceCustomer,
  NorceOrder,
  NorceCategory,
  NorceQueryParams,
} from '@/types/norce';

const FUNCTION_NAME = 'norce-proxy';

async function queryNorce<T>(
  endpoint: string,
  params?: NorceQueryParams,
  applicationId?: number,
): Promise<NorceODataResponse<T>> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: { endpoint, params, applicationId },
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
  return queryNorce<NorceProduct>('Products', {
    $top: 50,
    $orderby: 'Name',
    ...params,
  });
}

export async function fetchNorceOrders(
  params?: NorceQueryParams,
): Promise<NorceODataResponse<NorceOrder>> {
  return queryNorce<NorceOrder>('Orders', {
    $top: 50,
    $orderby: 'OrderDate desc',
    ...params,
  });
}

export async function fetchNorceCustomers(
  params?: NorceQueryParams,
): Promise<NorceODataResponse<NorceCustomer>> {
  return queryNorce<NorceCustomer>('Customers', {
    $top: 50,
    $orderby: 'Name',
    ...params,
  });
}

export async function fetchNorceCategories(
  params?: NorceQueryParams,
): Promise<NorceODataResponse<NorceCategory>> {
  return queryNorce<NorceCategory>('Categories', {
    $top: 100,
    $orderby: 'Name',
    ...params,
  });
}
