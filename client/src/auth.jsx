import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, setAuthToken } from './api';

/**
 * Where the token lives: localStorage.
 *
 * Trade-offs (see the README for the long version):
 * - localStorage survives refreshes and works with the API on a different domain, but any
 *   script running on the page can read it, so an XSS bug means a stolen token.
 * - An httpOnly cookie cannot be read by JavaScript, but with the API on another origin it
 *   needs SameSite=None, Secure and CSRF protection on every write.
 * - Memory only is the safest against theft but signs the user out on every refresh.
 * We mitigate by keeping the token short-lived (2h) and holding no other data in storage.
 */
const TOKEN_KEY = 'ecar-token';

const read = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // private mode or storage blocked
  }
};
const write = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* the session still works, it just will not survive a refresh */
  }
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(read);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false); // false until we know whether the token is valid

  // Keep the api module in step so every request carries the token
  setAuthToken(token);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
    write(null);
    setAuthToken(null);
  }, []);

  // Confirm the stored token still works (it may have expired or the account may be gone)
  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setUser(null);
      setReady(true);
      return () => { cancelled = true; };
    }
    setReady(false);
    apiRequest('/api/auth/me')
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch((err) => {
        if (cancelled) return;
        // Only drop the token when the server actually rejected it; a network blip should not sign you out
        if (err.status === 401) signOut();
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => { cancelled = true; };
  }, [token, signOut]);

  const accept = useCallback(({ token: newToken, user: newUser }) => {
    write(newToken);
    setAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
    setReady(true);
  }, []);

  const signIn = useCallback(
    async (email, password) => accept(await apiRequest('/api/auth/login', { method: 'POST', body: { email, password } })),
    [accept]
  );

  const signUp = useCallback(
    async (name, email, password) => accept(await apiRequest('/api/auth/signup', { method: 'POST', body: { name, email, password } })),
    [accept]
  );

  // Sign out everywhere when another tab signs out
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === TOKEN_KEY && e.newValue !== token) setToken(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [token]);

  const value = useMemo(
    () => ({ user, token, ready, signIn, signUp, signOut, isAdmin: user?.role === 'admin' }),
    [user, token, ready, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
