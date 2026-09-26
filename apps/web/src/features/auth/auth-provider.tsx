import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
} from '@pagmanager/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { api } from '@/lib/api';
import {
  AUTH_CHANGE_EVENT,
  clearSession,
  getStoredUser,
  storeSession,
} from '@/lib/auth-storage';

interface AuthContextValue {
  user: User | null;
  login(input: LoginInput): Promise<AuthResponse>;
  register(input: RegisterInput): Promise<AuthResponse>;
  logout(): void;
  updateUser(user: User): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    const syncAuth = () => {
      const storedUser = getStoredUser();
      setUser(storedUser);
      if (!storedUser) {
        queryClient.clear();
        if (
          window.location.pathname !== '/login' &&
          window.location.pathname !== '/register'
        ) {
          void router.navigate({ to: '/login', replace: true });
        }
      }
    };
    window.addEventListener(AUTH_CHANGE_EVENT, syncAuth);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, syncAuth);
  }, [queryClient, router]);

  const acceptSession = useCallback((session: AuthResponse) => {
    storeSession(session);
    setUser(session.user);
    return session;
  }, []);

  const login = useCallback(
    async (input: LoginInput) => acceptSession(await api.login(input)),
    [acceptSession],
  );
  const register = useCallback(
    async (input: RegisterInput) => acceptSession(await api.register(input)),
    [acceptSession],
  );
  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);
  const updateUser = useCallback((value: User) => {
    const token = window.localStorage.getItem('pagmanager.token');
    if (token) storeSession({ token, user: value });
    setUser(value);
  }, []);

  const value = useMemo(
    () => ({ user, login, register, logout, updateUser }),
    [user, login, register, logout, updateUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth precisa estar dentro de AuthProvider.');
  return value;
}
