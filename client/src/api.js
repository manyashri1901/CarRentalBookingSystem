import { useCallback, useEffect, useState } from 'react';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

function toQuery(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export async function apiRequest(path, { method = 'GET', params, body, signal } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}${toQuery(params)}`, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error('Cannot reach the server. Check your connection or that the API is running.');
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

/**
 * GET helper hook. Keeps the previous data while a new request is in flight
 * (so filters don't flash back to skeletons) and exposes reload() for retry.
 */
export function useApi(path, params) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  const key = path ? path + toQuery(params) : null;

  useEffect(() => {
    if (!key) return undefined;
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    apiRequest(path, { params, signal: ctrl.signal })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState((s) => ({ ...s, loading: false, error }));
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
