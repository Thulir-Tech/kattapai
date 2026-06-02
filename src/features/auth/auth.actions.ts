"use server";

import { cookies } from 'next/headers';

/**
 * Sets an HTTP-only secure cookie indicating the user has a verified admin session
 */
export async function setAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set('admin-session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days session
  });
}

/**
 * Deletes the HTTP-only admin session cookie upon logout
 */
export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin-session');
}
