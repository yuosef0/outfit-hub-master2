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
    // Get store info once (to determine role and check status)
    const { data: store } = await supabase
      .from('stores')
      .select('id, is_active')
      .eq('merchant_id', user.id)
      .maybeSingle();

    const userRole = store ? 'merchant' : 'customer';

    console.log('Middleware - User:', user.id, 'Role:', userRole, 'Path:', pathname);

    // Merchant routes - handle access
    if (pathname.startsWith('/merchant')) {
      // Allow setup and pending pages for merchants (they don't need a store yet or can have inactive store)
      if (pathname === '/merchant/setup' || pathname === '/merchant/pending') {
        if (userRole !== 'merchant') {
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
