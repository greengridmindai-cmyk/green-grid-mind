import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ConfigKey } from '../../data/node.ts';

export type DetailId =
  'components' | 'principle' | 'rack' | 'configs' | 'conn' | 'fire' | 'open' | 'review' | 'legend';

interface Value {
  /** node class shared by "GGM-Node" (Konfigurationen) and the 3D scene; P0 exists only in the cabinet */
  config: ConfigKey;
  setConfig: (c: ConfigKey) => void;
  /** request to open one of the <details> groups below the 3D stage (e.g. from the status section) */
  detail: { id: DetailId; n: number } | null;
  openDetail: (id: DetailId) => void;
}

const Ctx = createContext<Value | null>(null);

export function NodeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfigKey>('L');
  const [detail, setDetail] = useState<Value['detail']>(null);
  const openDetail = useCallback((id: DetailId) => setDetail((d) => ({ id, n: (d?.n ?? 0) + 1 })), []);
  const v = useMemo(() => ({ config, setConfig, detail, openDetail }), [config, detail, openDetail]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useNode(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error('useNode outside NodeProvider');
  return v;
}
