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
  const formData = await request.formData();
  const submittedPassword = String(formData.get('password') || '').trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const origin = getPublicOrigin(request);

  if (!adminPassword) {
    return NextResponse.redirect(`${origin}/admin?setup=1`);
  }

  if (!submittedPassword || submittedPassword !== adminPassword) {
    return NextResponse.redirect(`${origin}/admin?error=1`);
  }

  const response = NextResponse.redirect(`${origin}/admin`);

  response.cookies.set('kitten-soup-admin', 'yes', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });

  return response;
}
