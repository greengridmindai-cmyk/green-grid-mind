import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ConfigKey } from '../../data/node.ts';

export type DetailId = 'principle' | 'rack' | 'configs' | 'conn' | 'room' | 'open' | 'legend';

interface Value {
  config: ConfigKey;
  setConfig: (c: ConfigKey) => void;
  /** request to open one of the <details> groups below the 3D stage (e.g. from the status section) */
  detail: { id: DetailId; n: number } | null;
  openDetail: (id: DetailId) => void;
}

const Ctx = createContext<Value | null>(null);

/** Shared state between "GGM-Node" (configuration table) and the 3D model. */
export function CabinetProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfigKey>('L');
  const [detail, setDetail] = useState<Value['detail']>(null);
  const openDetail = useCallback((id: DetailId) => setDetail((d) => ({ id, n: (d?.n ?? 0) + 1 })), []);
  const v = useMemo(() => ({ config, setConfig, detail, openDetail }), [config, detail, openDetail]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useCabinet(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCabinet outside CabinetProvider');
  return v;
}
