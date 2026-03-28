// ─── Crypto Utilities for Client-Side Auth ───
// NOTE: True security requires a backend. This provides client-side
// hashing and session management as the frontend security layer.

// SHA-256 hash using Web Crypto API
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a secure random session token
export function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Session management
const SESSION_KEY = 'qrdine_session';

export function createSession(user, expiryHours = 24) {
  const session = {
    token: generateToken(),
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    restaurantId: user.restaurantId || null,
    createdAt: Date.now(),
    expiresAt: Date.now() + (expiryHours * 60 * 60 * 1000),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function updateSession(updates) {
  const session = getSession();
  if (!session) return null;
  const updated = { ...session, ...updates };
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  return updated;
}

// Validate email format
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
