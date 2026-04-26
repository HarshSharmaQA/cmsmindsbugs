'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

/**
 * Hook to safely handle client-side hydration
 * Avoids the setState-in-effect anti-pattern
 */
export function useHydration() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

/**
 * Hook to safely read from localStorage after hydration
 */
export function useLocalStorage<T>(key: string, defaultValue: T): T | null {
  const isHydrated = useHydration();
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    if (isHydrated) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          setValue(JSON.parse(stored) as T);
        } catch {
          setValue(stored as T);
        }
      } else {
        setValue(defaultValue);
      }
    }
  }, [isHydrated, key, defaultValue]);

  return value;
}
