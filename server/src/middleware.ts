import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const acceptedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000',
  'https://larson-air-conditioning.webflow.io',
  'https://poet.com',
  'https://www.poet.com',
];

function isAllowedOrigin(origin: string): boolean {
  if (acceptedOrigins.includes(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    // Webflow staging / branch previews: *.webflow.io
    if (host === 'webflow.io' || host.endsWith('.webflow.io')) return true;
  } catch {
    /* invalid origin */
  }
  return false;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    if (origin && isAllowedOrigin(origin)) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    return new NextResponse(null, { status: 204 });
  }

  if (origin && isAllowedOrigin(origin)) {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
    return response;
  }

  return NextResponse.next();
}
