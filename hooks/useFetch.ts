import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

interface UseFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: HeadersInit;
  requireAuth?: boolean;
  autoFetch?: boolean;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Generic fetch hook for API calls
 * Handles loading, error states, and authentication
 */
export function useFetch<T = any>(
  url: string,
  options: UseFetchOptions = {}
): UseFetchResult<T> {
  const {
    method = 'GET',
    body,
    headers: customHeaders,
    requireAuth = false,
    autoFetch = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { session } = useAuthStore();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...customHeaders,
      };

      // Add auth token if required
      if (requireAuth && session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Build fetch options
      const fetchOptions: RequestInit = {
        method,
        headers,
      };

      // Add body for non-GET requests
      if (body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body);
      }

      // Make request
      const response = await fetch(url, fetchOptions);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }

      setData(responseData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  }, [url, method, body, customHeaders, requireAuth, session]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  // Refetch function
  const refetch = async () => {
    await fetchData();
  };

  return {
    data,
    loading,
    error,
    fetch: fetchData,
    refetch,
  };
}

/**
 * Hook for GET requests
 */
export function useGet<T = any>(url: string, options?: Omit<UseFetchOptions, 'method'>) {
  return useFetch<T>(url, { ...options, method: 'GET' });
}

/**
 * Hook for POST requests
 */
export function usePost<T = any>(url: string, options?: Omit<UseFetchOptions, 'method'>) {
  return useFetch<T>(url, { ...options, method: 'POST', autoFetch: false });
}

/**
 * Hook for PUT requests
 */
export function usePut<T = any>(url: string, options?: Omit<UseFetchOptions, 'method'>) {
  return useFetch<T>(url, { ...options, method: 'PUT', autoFetch: false });
}

/**
 * Hook for DELETE requests
 */
export function useDelete<T = any>(url: string, options?: Omit<UseFetchOptions, 'method'>) {
  return useFetch<T>(url, { ...options, method: 'DELETE', autoFetch: false });
}

/**
 * Hook for fetching a single product
 */
export function useProduct(productId: string) {
  return useGet(`/api/products/${productId}`);
}

/**
 * Hook for fetching a single store
 */
export function useStore(storeId: string) {
  return useGet(`/api/stores/${storeId}`);
}

/**
 * Hook for fetching orders
 */
export function useOrders() {
  return useGet('/api/orders', { requireAuth: true });
}

/**
 * Hook for fetching a single order
 */
export function useOrder(orderId: string) {
  return useGet(`/api/orders/${orderId}`, { requireAuth: true });
}

/**
 * Hook for fetching wishlist
 */
export function useWishlist() {
  return useGet('/api/wishlist', { requireAuth: true });
}

/**
 * Hook for fetching reviews
 */
export function useReviews(storeId?: string, productId?: string) {
  const params = new URLSearchParams();
  if (storeId) params.append('store_id', storeId);
  if (productId) params.append('product_id', productId);

  const url = `/api/reviews${params.toString() ? `?${params.toString()}` : ''}`;
  return useGet(url);
}
