import { useCartStore, CartItem } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

/**
 * Custom hook for cart management
 * Provides easy access to cart state and actions
 */
export function useCart() {
  const {
    items,
    totalItems,
    totalAmount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    clearStore,
    getItemsByStore,
  } = useCartStore();

  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  /**
   * Add product to cart
   */
  const add = (
    productId: string,
    storeId: string,
    storeName: string,
    name: string,
    price: number,
    quantity: number = 1,
    options?: {
      color?: string;
      size?: string;
      imageUrl?: string;
    }
  ) => {
    addItem({
      productId,
      storeId,
      storeName,
      name,
      price,
      quantity,
      ...options,
    });
  };

  /**
   * Remove item from cart
   */
  const remove = (itemId: string) => {
    removeItem(itemId);
  };

  /**
   * Update item quantity
   */
  const update = (itemId: string, quantity: number) => {
    updateQuantity(itemId, quantity);
  };

  /**
   * Increase item quantity by 1
   */
  const increment = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      updateQuantity(itemId, item.quantity + 1);
    }
  };

  /**
   * Decrease item quantity by 1
   */
  const decrement = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      updateQuantity(itemId, item.quantity - 1);
    }
  };

  /**
   * Clear all items from cart
   */
  const clear = () => {
    clearCart();
  };

  /**
   * Remove all items from a specific store
   */
  const removeStore = (storeId: string) => {
    clearStore(storeId);
  };

  /**
   * Get items grouped by store
   */
  const itemsByStore = getItemsByStore();

  /**
   * Get item count for a specific product
   */
  const getItemCount = (productId: string, color?: string, size?: string) => {
    const item = items.find(
      (i) =>
        i.productId === productId &&
        (!color || i.color === color) &&
        (!size || i.size === size)
    );
    return item?.quantity || 0;
  };

  /**
   * Check if product is in cart
   */
  const isInCart = (productId: string, color?: string, size?: string) => {
    return getItemCount(productId, color, size) > 0;
  };

  /**
   * Get total items count for a specific store
   */
  const getStoreItemCount = (storeId: string) => {
    return items
      .filter((item) => item.storeId === storeId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  /**
   * Get total amount for a specific store
   */
  const getStoreTotal = (storeId: string) => {
    return items
      .filter((item) => item.storeId === storeId)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  /**
   * Navigate to cart page
   */
  const goToCart = () => {
    router.push('/cart');
  };

  /**
   * Navigate to checkout (requires auth)
   */
  const goToCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  /**
   * Create order from cart items
   */
  const createOrder = async (storeId: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    const storeItems = items.filter((item) => item.storeId === storeId);
    if (storeItems.length === 0) {
      throw new Error('No items for this store');
    }

    try {
      const { session } = useAuthStore.getState();
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          store_id: storeId,
          items: storeItems.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          total_amount: getStoreTotal(storeId),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      // Clear store items from cart after successful order
      clearStore(storeId);

      return data;
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  };

  return {
    // State
    items,
    totalItems,
    totalAmount,
    itemsByStore,

    // Actions
    add,
    remove,
    update,
    increment,
    decrement,
    clear,
    removeStore,

    // Helpers
    getItemCount,
    isInCart,
    getStoreItemCount,
    getStoreTotal,
    goToCart,
    goToCheckout,
    createOrder,

    // Computed
    isEmpty: items.length === 0,
    hasItems: items.length > 0,
    storeCount: Object.keys(itemsByStore).length,
  };
}
