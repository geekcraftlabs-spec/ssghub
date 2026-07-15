import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// SIMPLIFIED - Allows all access for now
// Will add SSO later when main site is ready
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function proxy(request: NextRequest) {
  // Just let everything through
  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    '/student/:path*',
    '/parent/:path*', 
    '/teacher/:path*',
    '/api/student/:path*',
    '/api/parent/:path*',
    '/api/teacher/:path*'
  ]
};