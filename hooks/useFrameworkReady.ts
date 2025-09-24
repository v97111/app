import { useEffect } from 'react';

type FrameworkReadyScope = typeof globalThis & { frameworkReady?: () => void };

export function useFrameworkReady() {
  useEffect(() => {
    if (typeof globalThis !== 'undefined') {
      (globalThis as FrameworkReadyScope).frameworkReady?.();
    }
  }, []);
}
