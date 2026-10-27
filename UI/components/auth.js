import { createInternalNeonAuth } from '@neondatabase/auth';

/*
  Cura AI auth client.
  createInternalNeonAuth keeps the Neon adapter's getJWTToken() alongside the
  vanilla Better Auth client — createAuthClient() would silently drop it.
*/
const AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL || "https://ep-ancient-smoke-aokvpvx2.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth";

const neonAuth = createInternalNeonAuth(AUTH_URL);

export const authClient = neonAuth.adapter;

/**
 * Returns a Bearer token for API calls (RS256 JWT verified against
 * Neon Auth's JWKS). Chain of truth:
 *  1. session token if the server already issued a JWT
 *  2. GET /token (better-auth JWT plugin) for a freshly signed token
 * Returns null when there is no active session.
 */
export async function getBearerToken() {
  try {
    const token = await neonAuth.getJWTToken();
    if (token) return token;
  } catch { /* fall through to the /token endpoint */ }
  try {
    const res = await fetch(`${AUTH_URL}/token`, { credentials: 'include' });
    if (res.ok) {
      const body = await res.json();
      if (body?.token) return body.token;
    }
  } catch { /* no session — return null */ }
  return null;
}