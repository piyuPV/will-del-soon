import { NextRequest, NextResponse } from 'next/server';

export function middleware(request) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;// Log the pathname for debugging
    // Public routes that don't need authentication

    const publicRoutes = ['/', '/login', '/api/auth/google-callback', '/api/auth/logout'];

    // API routes that need authentication (excluding auth routes)
    // const protectedApiRoutes = pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/');

    // Protected pages (excluding login and api routes)
    const protectedPageRoutes = !pathname.startsWith('/api/') && !publicRoutes.includes(pathname);

    // Allow public routes without token
    if (publicRoutes.includes(pathname)) {
        // Redirect to dashboard if user is already logged in
        if (token && (pathname === '/auth' || pathname === '/login')) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.next();
    }

    // Check authentication for protected pages
    if (protectedPageRoutes) {
        if (!token) {
            return NextResponse.redirect(new URL('/auth', request.url));
        }
        return NextResponse.next();
    }

    // if (protectedApiRoutes) {
    //     if (!token) {
    //         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    //     }
    //     // Add token to request headers for API calls
    //     return NextResponse.next();
    // }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public files)
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',

        // Include API routes explicitly 
        '/api/:path*',
    ],
};
