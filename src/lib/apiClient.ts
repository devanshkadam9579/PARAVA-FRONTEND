/**
 * PARAVA CUSTOMER FRONTEND — AUTHENTICATED API CLIENT
 * Attaches verified Firebase ID token to all backend requests.
 */

import { getAuthInstance } from './firebase';

export async function getAuthToken(): Promise<string | null> {
  try {
    const auth = getAuthInstance();
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch (err) {
    console.warn('[Customer ApiClient] Failed to acquire ID token:', err);
    return null;
  }
}

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers
  });
}
