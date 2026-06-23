import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "default_super_secret_key_for_dev_only";
const key = new TextEncoder().encode(secretKey);

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Paths that require authentication
  const isAdminRoute = path.startsWith('/admin');
  const isOfficerRoute = path.startsWith('/officer');

  if (isAdminRoute || isOfficerRoute) {
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      const { payload } = await jwtVerify(sessionCookie, key, {
        algorithms: ["HS256"],
      });

      // Role based protection
      if (isAdminRoute && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/officer', request.url));
      }

      if (isOfficerRoute && payload.role !== 'OFFICER') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }

    } catch (error) {
      // Invalid token
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/officer/:path*'],
}
