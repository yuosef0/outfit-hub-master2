import { useEffect } from 'react';
import { useProductStore } from '@/store/productStore';

interface UseProductsOptions {
  autoFetch?: boolean;
  category?: string;
  gender?: string;
  storeId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Custom hook for product management
 * Provides easy access to products, filtering, and search
 */
export function useProducts(options: UseProductsOptions = {}) {
  const {
    products,
    filteredProducts,
    loading,
    error,
    filters,
    fetchProducts,
    setFilters,
    clearFilters,
    applyFilters,
    searchProducts,
    setProducts,
  } = useProductStore();

  const { autoFetch = true, ...initialFilters } = options;

  // Fetch products on mount if autoFetch is enabled
  useEffect(() => {
    if (autoFetch) {
      fetchProducts(initialFilters);
    }
  }, [autoFetch]);

  /**
   * Fetch products with filters
   */
  const fetch = async (customFilters?: typeof filters) => {
    await fetchProducts(customFilters || filters);
  };

  /**
   * Refresh products (refetch with current filters)
   */
  const refresh = async () => {
    await fetchProducts(filters);
  };

  /**
   * Filter by category
   */
  const filterByCategory = (category: string) => {
    setFilters({ category });
  };

  /**
   * Filter by gender
   */
  const filterByGender = (gender: string) => {
    setFilters({ gender });
  };

  /**
   * Filter by store
   */
  const filterByStore = (storeId: string) => {
    setFilters({ storeId });
  };

  /**
   * Filter by price range
   */
  const filterByPriceRange = (minPrice?: number, maxPrice?: number) => {
    setFilters({ minPrice, maxPrice });
  };

  /**
   * Search products by query
   */
  const search = (query: string) => {
    searchProducts(query);
  };

  /**
   * Clear all filters
   */
  const resetFilters = () => {
    clearFilters();
  };

  /**
   * Get unique categories from products
   */
  const getCategories = () => {
    const categories = new Set(products.map((p) => p.category));
    return Array.from(categories).filter(Boolean);
  };

  /**
   * Get unique genders from products
   */
  const getGenders = () => {
    const genders = new Set(products.map((p) => p.gender_filter));
    return Array.from(genders).filter(Boolean);
  };

  /**
   * Get price range from products
   */
  const getPriceRange = () => {
    if (products.length === 0) return { min: 0, max: 0 };

    const prices = products.map((p) => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  };

  /**
   * Get product by ID
   */
  const getProductById = (id: string) => {
    return products.find((p) => p.id === id);
  };

  return {
    // State
    products,
    filteredProducts,
    loading,
    error,
    filters,

    // Actions
    fetch,
    refresh,
    filterByCategory,
    filterByGender,
    filterByStore,
    filterByPriceRange,
    search,
    resetFilters,
    setFilters,
    applyFilters,
    setProducts,

    // Helpers
    getCategories,
    getGenders,
    getPriceRange,
    getProductById,

    // Computed
    hasProducts: products.length > 0,
    hasFilters: Object.keys(filters).length > 0,
    resultCount: filteredProducts.length,
  };
}
