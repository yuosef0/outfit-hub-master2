import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/debug',
    '/merchant/signup',
    '/auth/callback',
    '/auth/callback-handler',
    '/select-governorate'
  ];
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith('/auth/'));

  // Get the authenticated user (more secure than getSession)
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // If no user and trying to access protected route, redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated, check role-based access
  if (user) {
    // Get user profile to check role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // Get store info (to determine merchant status and check store activation)
    const { data: store } = await supabase
      .from('stores')
      .select('id, is_active')
      .eq('merchant_id', user.id)
      .maybeSingle();

    let userRole: 'admin' | 'merchant' | 'customer' = 'customer';
    if (profile?.role === 'admin') {
      userRole = 'admin';
    } else if (store) {
      userRole = 'merchant';
    }

    console.log('Middleware - User:', user.id, 'Role:', userRole, 'Path:', pathname);

    // Admin routes - only admin can access
    if (pathname.startsWith('/admin')) {
      if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      return response;
    }

    // Admin can access any page freely
    if (userRole === 'admin') {
      // If admin tries to access login/signup, redirect to admin dashboard
      if (pathname === '/login' || pathname === '/signup') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return response;
    }

    // Merchant routes - handle access
    if (pathname.startsWith('/merchant')) {
      // Allow setup and pending pages for merchants (they don't need a store yet or can have inactive store)
      if (pathname === '/merchant/setup' || pathname === '/merchant/pending') {
        if (userRole !== 'merchant' && profile?.role !== 'merchant') {
          console.log('Non-merchant trying to access setup/pending - redirecting to home');
          return NextResponse.redirect(new URL('/', request.url));
        }
        // Merchant can access setup/pending
        console.log('Merchant accessing setup/pending - allowed');
        return response;
      }

      // Other merchant routes - need to be merchant with active store
      if (userRole !== 'merchant') {
        console.log('Non-merchant trying to access merchant area - redirecting to home');
        return NextResponse.redirect(new URL('/', request.url));
      }

      if (!store) {
        console.log('Merchant without store - redirecting to setup');
        return NextResponse.redirect(new URL('/merchant/setup', request.url));
      }

      if (!store.is_active) {
        console.log('Merchant with inactive store - redirecting to pending');
        return NextResponse.redirect(new URL('/merchant/pending', request.url));
      }

      // Merchant has active store - allow access
      console.log('Merchant with active store - allowed');
    }

    // Merchant should not access customer pages - redirect to merchant dashboard
    if (userRole === 'merchant' && store?.is_active && !pathname.startsWith('/merchant')) {
      const merchantAllowedPaths = ['/login', '/signup', '/auth/', '/select-governorate', '/debug'];
      const isMerchantAllowed = merchantAllowedPaths.some(p => pathname === p || pathname.startsWith(p));
      if (!isMerchantAllowed) {
        console.log('Merchant accessing customer page - redirecting to dashboard');
        return NextResponse.redirect(new URL('/merchant/dashboard', request.url));
      }
    }

    // If logged in and trying to access login or signup page, redirect to appropriate dashboard
    if (pathname === '/login' || pathname === '/signup') {
      if (userRole === 'merchant') {
        if (!store) {
          return NextResponse.redirect(new URL('/merchant/setup', request.url));
        } else if (!store.is_active) {
          return NextResponse.redirect(new URL('/merchant/pending', request.url));
        } else {
          return NextResponse.redirect(new URL('/merchant/dashboard', request.url));
        }
      } else {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
