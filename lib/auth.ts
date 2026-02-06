import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

// Create Supabase client helper
function getSupabaseClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

/**
 * Sign in with Google OAuth and set user role
 */
export async function signInWithGoogle(role: 'customer' | 'merchant') {
    const supabase = getSupabaseClient();

    // Store role in session storage for retrieval after OAuth callback
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('pending_role', role);
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });

    if (error) throw error;
    return data;
}

/**
 * Sign out current user
 */
export async function signOut() {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    // Clear any stored session data
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pending_role');
    }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        console.error('Error getting current user:', error);
        return null;
    }

    return user;
}

/**
 * Get user's role from database
 */
export async function getUserRole(userId: string): Promise<'customer' | 'merchant' | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user role:', error);
        return null;
    }

    return data?.role || 'customer';
}

/**
 * Update user role in database
 */
export async function updateUserRole(userId: string, role: 'customer' | 'merchant'): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('users')
        .update({
            role,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (error) throw error;
}

/**
 * Create user record in database after OAuth
 */
export async function createUserRecord(authUser: User, role: 'customer' | 'merchant') {
    const supabase = getSupabaseClient();

    const { error } = await supabase.from('users').insert({
        id: authUser.id,
        email: authUser.email!,
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
        role: role,
    });

    if (error) throw error;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const user = await getCurrentUser();
    return user !== null;
}

/**
 * Get user data with role
 */
export async function getUserData(userId: string) {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user data:', error);
        return null;
    }

    return data;
}
