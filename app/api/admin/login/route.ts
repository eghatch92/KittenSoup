import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const submittedPassword = String(formData.get('password') || '').trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.redirect(new URL('/admin?setup=1', request.url));
  }

  if (!submittedPassword || submittedPassword !== adminPassword) {
    return NextResponse.redirect(new URL('/admin?error=1', request.url));
  }

  const response = NextResponse.redirect(new URL('/admin', request.url));

  response.cookies.set('kitten-soup-admin', 'yes', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });

  return response;
}
