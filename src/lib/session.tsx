import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ApiClient } from './api';
import type { AuthResponse } from './types';

const KEY = 'pw_session';
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://pricewatch-api.gustavohdev.com.br/api';

interface SessionValue {
  ready: boolean;
  user: { name: string; email: string } | null;
  api: ApiClient;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionValue['user']>(null);
  const tokenRef = useRef<string | null>(null);

  const clear = useCallback(async () => {
    tokenRef.current = null;
    setUser(null);
    await SecureStore.deleteItemAsync(KEY).catch(() => undefined);
  }, []);

  const api = useMemo(
    () => new ApiClient({ baseUrl: API_URL, getToken: () => tokenRef.current, onUnauthorized: () => void clear() }),
    [clear],
  );

  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(KEY);
        if (raw) {
          const saved = JSON.parse(raw) as { token: string; name: string; email: string };
          tokenRef.current = saved.token;
          setUser({ name: saved.name, email: saved.email });
        }
      } catch {
        // armazenamento ilegível: segue deslogado
      }
      setReady(true);
    })();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res: AuthResponse = await api.login({ email: email.trim(), password });
      tokenRef.current = res.token;
      await SecureStore.setItemAsync(KEY, JSON.stringify({ token: res.token, name: res.name, email: res.email }));
      setUser({ name: res.name, email: res.email });
    },
    [api],
  );

  const value = useMemo(() => ({ ready, user, api, signIn, signOut: clear }), [ready, user, api, signIn, clear]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession fora do SessionProvider');
  return ctx;
}
