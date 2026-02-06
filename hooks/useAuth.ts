import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

/**
 * Custom hook for authentication
 * Provides easy access to auth state and actions
 */
export function useAuth() {
  const {
    user,
    session,
    loading,
    error,
    initialized, // Added initialized
    signup,
    login,
    logout,
    fetchUser,
    setUser,
    clearError,
  } = useAuthStore();

  const router = useRouter();

  // Check if user is authenticated
  const isAuthenticated = !!user && !!session;

  // Check if user is a merchant
  const isMerchant = user?.role === 'merchant';

  // Check if user is a customer
  const isCustomer = user?.role === 'customer';

  // Initialize auth state on mount
  useEffect(() => {
    if (!initialized && !loading) {
      fetchUser();
    }
  }, [initialized, loading, fetchUser]);

  /**
   * Sign up a new user
   */
  const handleSignup = async (
    email: string,
    password: string,
    fullName: string,
    role: 'customer' | 'merchant' = 'customer'
  ) => {
    try {
      await signup(email, password, fullName, role);
      // Redirect based on role
      if (role === 'merchant') {
        router.push('/merchant/dashboard');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  /**
   * Log in an existing user
   */
  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      // Get the updated user to check role
      const currentUser = useAuthStore.getState().user;

      // Redirect based on role
      if (currentUser?.role === 'merchant') {
        router.push('/merchant/dashboard');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  /**
   * Log out the current user
   */
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  /**
   * Require authentication - redirect to login if not authenticated
   */
  const requireAuth = () => {
    if (initialized && !loading && !isAuthenticated) {
      router.push('/login');
      return false;
    }
    return true;
  };

  /**
   * Require merchant role - redirect if not a merchant
   */
  const requireMerchant = () => {
    if (initialized && !loading && !isMerchant) {
      router.push('/');
      return false;
    }
    return true;
  };

  return {
    // State
    user,
    session,
    loading,
    error,
    isAuthenticated,
    isMerchant,
    isCustomer,

    // Actions
    signup: handleSignup,
    login: handleLogin,
    logout: handleLogout,
    fetchUser,
    setUser,
    clearError,
    requireAuth,
    requireMerchant,
    initialized, // Added initialized
  };
}
