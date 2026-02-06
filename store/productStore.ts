import { create } from 'zustand';

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  gender_filter: string;
  image_urls: string[];
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  stores?: {
    id: string;
    name: string;
    logo_url?: string;
  };
}

interface ProductFilters {
  category?: string;
  gender?: string;
  storeId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface ProductState {
  products: Product[];
  filteredProducts: Product[];
  loading: boolean;
  error: string | null;
  filters: ProductFilters;

  // Actions
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  setFilters: (filters: Partial<ProductFilters>) => void;
  clearFilters: () => void;
  applyFilters: () => void;
  searchProducts: (query: string) => void;
  setProducts: (products: Product[]) => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  filteredProducts: [],
  loading: false,
  error: null,
  filters: {},

  fetchProducts: async (filters?: ProductFilters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();

      if (filters?.category) params.append('category', filters.category);
      if (filters?.gender) params.append('gender', filters.gender);
      if (filters?.storeId) params.append('store_id', filters.storeId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.minPrice !== undefined) params.append('min_price', filters.minPrice.toString());
      if (filters?.maxPrice !== undefined) params.append('max_price', filters.maxPrice.toString());

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      set({
        products: data.products,
        filteredProducts: data.products,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().applyFilters();
  },

  clearFilters: () => {
    set({ filters: {} });
    get().applyFilters();
  },

  applyFilters: () => {
    const { products, filters } = get();
    let filtered = [...products];

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter((p) => p.category === filters.category);
    }

    // Apply gender filter
    if (filters.gender) {
      filtered = filtered.filter((p) => p.gender_filter === filters.gender);
    }

    // Apply store filter
    if (filters.storeId) {
      filtered = filtered.filter((p) => p.store_id === filters.storeId);
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply price range filter
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
    }

    set({ filteredProducts: filtered });
  },

  searchProducts: (query) => {
    set((state) => ({
      filters: { ...state.filters, search: query },
    }));
    get().applyFilters();
  },

  setProducts: (products) => {
    set({ products, filteredProducts: products });
  },
}));
