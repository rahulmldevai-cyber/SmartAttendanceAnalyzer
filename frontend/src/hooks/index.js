import { useState, useEffect, useCallback, useRef } from 'react';

// ─── useApi: Generic data fetching hook ───────────────────────────────────────
export function useApi(apiFn, { immediate = true, params = null, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (overrideParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(overrideParams ?? params);
      if (mountedRef.current) {
        setData(res.data);
        setLoading(false);
      }
      return res.data;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
        setLoading(false);
      }
      throw err;
    }
  }, [apiFn, ...deps]); // eslint-disable-line

  useEffect(() => {
    if (immediate) execute();
  }, [execute]); // eslint-disable-line

  return { data, loading, error, refetch: execute };
}

// ─── useDebounce ──────────────────────────────────────────────────────────────
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// ─── useLocalStorage ──────────────────────────────────────────────────────────
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (err) {
      console.error(err);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

// ─── usePagination ────────────────────────────────────────────────────────────
export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);

  const reset = () => setPage(1);

  return { page, setPage, limit, reset };
}

// ─── useClickOutside ──────────────────────────────────────────────────────────
export function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}
