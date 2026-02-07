import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options });
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: '', ...options });
                    },
                },
            }
        );

        // Exchange code for session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
            console.error('Error exchanging code for session:', exchangeError);
            return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
        }

        // Get the authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error('Error getting user:', userError);
            return NextResponse.redirect(new URL('/login?error=user_not_found', request.url));
        }

        // Check if user exists first to preserve role
        const { data: existingUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (existingUser) {
            // Update metadata but PRESERVE role
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (updateError) console.error('Error updating user:', updateError);
        } else {
            // Insert new user with default role
            const { error: insertError } = await supabase
                .from('users')
                .insert({
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
                    role: 'customer',
                    updated_at: new Date().toISOString(),
                });

            if (insertError) console.error('Error inserting user:', insertError);
        }


    }

    // Redirect to callback handler page that will handle role-based routing
    return NextResponse.redirect(new URL('/auth/callback-handler', request.url));
}
