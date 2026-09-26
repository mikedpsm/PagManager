import {
  type AuthResponse,
  type User,
  userSchema,
} from '@pagmanager/contracts';

const TOKEN_KEY = 'pagmanager.token';
const USER_KEY = 'pagmanager.user';
export const AUTH_CHANGE_EVENT = 'pagmanager:auth-change';

export function getAccessToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const token = getAccessToken();
  const value = window.localStorage.getItem(USER_KEY);
  if (!token || !value) return null;
  try {
    const user = userSchema.safeParse(JSON.parse(value));
    return user.success ? user.data : null;
  } catch {
    return null;
  }
}

export function storeSession(session: AuthResponse) {
  window.localStorage.setItem(TOKEN_KEY, session.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}
