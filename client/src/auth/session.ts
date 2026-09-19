// The session lives in localStorage so it survives a reload. The trade-off is that any script
// running on the page could read the token; the server's CSP and the 8-hour expiry limit that.

const STORAGE_KEY = 'ledgerline.session';

export interface StoredSession {
  token: string;
  expiresAt: string;
}

function isStoredSession(value: unknown): value is StoredSession {
  return (
    typeof value === 'object' &&
    value !== null &&
    'token' in value &&
    typeof value.token === 'string' &&
    'expiresAt' in value &&
    typeof value.expiresAt === 'string'
  );
}

function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    // An expired token would only earn a 401, so it's dropped before it's ever sent.
    if (isStoredSession(parsed) && new Date(parsed.expiresAt).getTime() > Date.now()) {
      return parsed;
    }
  } catch {
    // Storage blocked (private mode, disabled cookies) or corrupt: start signed out.
  }
  return null;
}

let current: StoredSession | null = readStoredSession();

export function getToken(): string | null {
  return current?.token ?? null;
}

export function saveSession(session: StoredSession): void {
  current = session;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Still signed in for this tab; the session just won't survive a reload.
  }
}

export function clearSession(): void {
  current = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored to remove.
  }
}
