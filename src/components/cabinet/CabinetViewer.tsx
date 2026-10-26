import { useEffect, useMemo, useRef, useState } from 'react';
import { COMPONENTS, isAvailable, type CompId } from '../../data/cabinet/components.ts';
import { CONFIGS, IT_LOAD, ROW, SERVICE_ZONE } from '../../data/node.ts';
import { LEGEND } from '../../data/cabinet/legend.ts';
import { fmtQ, n } from '../../i18n/format.ts';
import { R, plain, useI18n } from '../../i18n/index.ts';
import { useMedia } from '../../hooks/useMedia.ts';
import { Segmented } from '../ui/Segmented.tsx';
import { useCabinet } from './CabinetContext.tsx';
import { CompCard, CompList } from './CabinetPanel.tsx';
import { CabinetDetails } from './CabinetDetails.tsx';
import { useCabText } from './text.ts';
import type { CabinetHandle, CabinetLayer, CabinetShell, CabinetView } from './cabinetScene.d.ts';

const VIEWS: CabinetView[] = ['iso', 'front', 'rear', 'top', 'rack', 'system'];
const SHELLS: CabinetShell[] = ['glass', 'solid', 'hidden'];
const LAYERS: CabinetLayer[] = ['explode', 'air', 'water', 'power', 'signals', 'numbers', 'dims'];
const DEFAULT_LAYERS: Record<CabinetLayer, boolean> = {
  explode: false,
  air: true,
  water: true,
  power: true,
  signals: true,
  numbers: true,
  dims: false,
};

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function CabinetViewer({ poster }: { poster: string }) {
  const { t, lang } = useI18n();
  const ct = useCabText();
  const { config, setConfig } = useCabinet();
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<CabinetHandle | null>(null);
  const [ready, setReady] = useState(false);
  const [webgl] = useState(hasWebGL);
  const [view, setView] = useState<CabinetView>('iso');
  const [shell, setShell] = useState<CabinetShell>('glass');
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [sel, setSel] = useState<CompId | null>(null);
  const coarse = useMedia('(pointer: coarse)');
  const wide = useMedia('(min-width: 1024px)');

  const names = useMemo(
    () => Object.fromEntries(COMPONENTS.map((c) => [c.id, plain(ct.comp[c.id].name, lang)])),
    [ct, lang],
  );
  const labels = useMemo(() => {
    const f = (v: number, u?: 'mm') => fmtQ(n(v, u), lang);
    const [ecab, , lcp] = ROW.sections;
    return {
      total: f(ROW.width, 'mm'),
      s800: f(ecab.w),
      s300: f(lcp.w),
      height: f(ROW.height, 'mm'),
      depth: f(ROW.depth, 'mm'),
      service: `${ct.scene.service} ${fmtQ(SERVICE_ZONE, lang)}`,
      wall: ct.scene.wall,
      outside: ct.scene.outside,
      room: ct.scene.room,
    };
  }, [ct, lang]);

  // mount once
  useEffect(() => {
    if (!webgl || !host.current) return;
    let disposed = false;
    let off = () => {};
    import('./cabinetScene.js').then(({ mountCabinet }) => {
      if (disposed || !host.current) return;
      const h = mountCabinet(host.current, { config, theme: 'dark', names, labels });
      handle.current = h;
      off = h.onSelect((id) => setSel(id as CompId | null));
      if (new URLSearchParams(window.location.search).has('e2e'))
        (window as unknown as { __ggm: CabinetHandle }).__ggm = h;
      setReady(true);
    });
    return () => {
      disposed = true;
      off();
      handle.current?.dispose();
      handle.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webgl]);

  useEffect(() => handle.current?.setConfig(config), [config, ready]);
  useEffect(() => handle.current?.setNames(names), [names, ready]);
  useEffect(() => handle.current?.setLabels(labels), [labels, ready]);
  useEffect(() => {
    if (sel && !isAvailable(sel, config)) setSel(null);
  }, [config, sel]);
  useEffect(() => {
    const c = handle.current?.canvas;
    if (c)
      c.setAttribute(
        'aria-label',
        plain(t.modell.canvas, lang, {
          config: plain(t.knoten.configs.names[config], lang),
          view: t.modell.views[view],
        }),
      );
  }, [t, lang, config, view, ready]);

  const select = (id: CompId | null) => {
    setSel(id);
    handle.current?.select(id);
  };

  return (
    <div className="cab">
      <div className="cab-toolbar wrap-wide" role="toolbar" aria-label={t.modell.toolbar.config}>
        <div className="cab-ctl">
          <span className="t-label muted">{t.modell.toolbar.config}</span>
          <Segmented
            label={t.modell.toolbar.config}
            value={config}
            onChange={setConfig}
            options={CONFIGS.map((k) => ({
              value: k,
              label: <R s={t.modell.configShort[k]} v={{ q: fmtQ(IT_LOAD[k], lang) }} />,
            }))}
          />
        </div>
        <div className="cab-ctl">
          <span className="t-label muted">{t.modell.toolbar.view}</span>
          <Segmented
            label={t.modell.toolbar.view}
            value={view}
            onChange={(v) => {
              setView(v);
              handle.current?.setView(v);
            }}
            options={VIEWS.map((v) => ({ value: v, label: t.modell.views[v] }))}
          />
        </div>
        <div className="cab-ctl">
          <span className="t-label muted">{t.modell.toolbar.shell}</span>
          <Segmented
            label={t.modell.toolbar.shell}
            value={shell}
            onChange={(s) => {
              setShell(s);
              handle.current?.setShell(s);
            }}
            options={SHELLS.map((s) => ({ value: s, label: t.modell.shells[s] }))}
          />
        </div>
        <div className="cab-ctl" role="group" aria-label={t.modell.toolbar.layers}>
          <span className="t-label muted">{t.modell.toolbar.layers}</span>
          <div className="cab-layers">
            {LAYERS.map((l) => (
              <button
                key={l}
                type="button"
                className="chip"
                aria-pressed={layers[l]}
                onClick={() => {
                  const on = !layers[l];
                  setLayers((s) => ({ ...s, [l]: on }));
                  handle.current?.setLayer(l, on);
                }}
              >
                {t.modell.layers[l]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="cab-grid wrap-wide">
        <div className="cab-stage" ref={host}>
          {!ready ? (
            <div className="cab-poster">
              <img
                src={poster}
                alt={plain(t.modell.posterAlt, lang)}
                width={1440}
                height={900}
                decoding="async"
              />
              <p className="t-label cab-loading">{webgl ? t.modell.loading : t.modell.noWebgl}</p>
            </div>
          ) : null}
          <p className="cab-hint t-label" aria-hidden="true">
            {coarse ? t.modell.hintTouch : t.modell.hint}
          </p>
          <ul className="cab-legend">
            {LEGEND.map((l) => (
              <li key={l.k}>
                <i style={{ background: l.color }} aria-hidden="true" />
                <R s={t.modell.legend[l.k]} v={{ q: l.q ? fmtQ(l.q, lang) : '' }} />
              </li>
            ))}
          </ul>
        </div>
        <aside className={`cab-side ${sel && !wide ? 'is-sheet' : ''}`}>
          <CompCard selected={sel} onSelect={select} />
          <CompList config={config} selected={sel} onSelect={select} />
        </aside>
      </div>

      <div className="wrap">
        <CabinetDetails config={config} />
      </div>
    </div>
  );
}
