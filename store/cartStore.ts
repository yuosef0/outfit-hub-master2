import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  storeId: string;
  storeName: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];

  // Computed values
  totalItems: number;
  totalAmount: number;

  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  clearStore: (storeId: string) => void;
  getItemsByStore: () => Record<string, CartItem[]>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      get totalItems() {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      get totalAmount() {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      addItem: (newItem) => {
        set((state) => {
          // Check if item already exists (same product, color, size)
          const existingItemIndex = state.items.findIndex(
            (item) =>
              item.productId === newItem.productId &&
              item.color === newItem.color &&
              item.size === newItem.size
          );

          if (existingItemIndex > -1) {
            // Update quantity of existing item
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += newItem.quantity;
            return { items: updatedItems };
          }

          // Add new item
          const cartItem: CartItem = {
            ...newItem,
            id: `${newItem.productId}-${newItem.color}-${newItem.size}-${Date.now()}`,
          };

          return { items: [...state.items, cartItem] };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      clearStore: (storeId) => {
        set((state) => ({
          items: state.items.filter((item) => item.storeId !== storeId),
        }));
      },

      getItemsByStore: () => {
        const items = get().items;
        return items.reduce((acc, item) => {
          if (!acc[item.storeId]) {
            acc[item.storeId] = [];
          }
          acc[item.storeId].push(item);
          return acc;
        }, {} as Record<string, CartItem[]>);
      },
    }),
    {
      name: 'outfit-hub-cart',
      // Persist cart to localStorage
      partialize: (state) => ({ items: state.items }),
    }
  )
);
