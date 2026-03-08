import { NextRequest, NextResponse } from 'next/server';

function getPublicOrigin(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');

  if (forwardedHost) {
    return `${forwardedProto || 'https'}://${forwardedHost}`;
  }

  const host = request.headers.get('host');
  if (host) {
    return `${forwardedProto || 'https'}://${host}`;
  }

  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const origin = getPublicOrigin(request);
  const response = NextResponse.redirect(`${origin}/admin`);

  response.cookies.set('kitten-soup-admin', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
