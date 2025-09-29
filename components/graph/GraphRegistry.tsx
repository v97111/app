import React, { createContext, useContext, useMemo, useRef, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';
import type { SharedValue } from 'react-native-reanimated';

type HandlerRef = RefObject<any> | undefined;
export type SVs = {
  x: SharedValue<number>;
  y: SharedValue<number>;
  w: SharedValue<number>;
  h: SharedValue<number>;
  panRef?: HandlerRef;
  tapRef?: HandlerRef;
};

type Ctx = {
  register: (id: string, svs: SVs) => void;
  unregister: (id: string) => void;
  get: (id: string) => SVs | undefined;
  getAll: () => Array<[string, SVs]>;
  subscribe: (cb: () => void) => () => void;
  getSnapshot: () => number;
};

const GraphCtx = createContext<Ctx | null>(null);

export function GraphProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef(new Map<string, SVs>());
  const listeners = useRef(new Set<() => void>());
  const versionRef = useRef(0);

  const notify = () => { versionRef.current++; listeners.current.forEach((l) => l()); };

  const value = useMemo<Ctx>(() => ({
    register: (id, svs) => { mapRef.current.set(id, svs); notify(); },
    unregister: (id) => { mapRef.current.delete(id); notify(); },
    get: (id) => mapRef.current.get(id),
    getAll: () => Array.from(mapRef.current.entries()),
    subscribe: (cb) => { listeners.current.add(cb); return () => listeners.current.delete(cb); },
    getSnapshot: () => versionRef.current,
  }), []);

  return <GraphCtx.Provider value={value}>{children}</GraphCtx.Provider>;
}

export function useGraphRegistry() {
  const ctx = useContext(GraphCtx);
  if (!ctx) throw new Error('useGraphRegistry must be used within <GraphProvider>');
  return ctx;
}

export function useGraphSnapshot() {
  const ctx = useGraphRegistry();
  // Re-render consumers (edges) when nodes register/unregister
  useSyncExternalStore(ctx.subscribe, ctx.getSnapshot, ctx.getSnapshot);
  return ctx;
}