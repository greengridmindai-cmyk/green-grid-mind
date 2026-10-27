/**
 * Website wrapper around the node3d site scene (siteScene.js → mountSite, levels object → building → room → cabinet).
 * Thin: every number and text comes from siteData.js / cabinetData.js (translated by ./i18n) or from the scene
 * state (`onChange`). The engine is loaded lazily; without WebGL the tables below still render.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ConfigKey } from '../../data/node.ts';
import { fmtQ, n } from '../../i18n/format.ts';
import { R, plain, useI18n } from '../../i18n/index.ts';
import type { Lang } from '../../config.ts';
import { Segmented } from '../ui/Segmented.tsx';
import { useMedia } from '../../hooks/useMedia.ts';
import type { CabinetHandle, CabinetLayer, CabinetView } from './cabinetScene.d.ts';
import type { NodeConfig, Season, SiteHandle, SiteLevel, SiteState } from './siteScene.d.ts';
import type { MarkerId, SiteDef } from './siteData.d.ts';
import { CABINET, SEASONS, SITE, localizeModules } from './i18n/localize.ts';
import { installSceneText } from './sceneText.ts';
import { ModText } from './ModText.tsx';
import { Node3dDetails } from './Node3dDetails.tsx';
import { useNode } from './NodeContext.tsx';

const LEVELS: SiteLevel[] = ['site', 'building', 'room', 'cabinet'];
const SEASON_KEYS: Season[] = ['summer', 'equinox', 'winter'];
const VIEWS: CabinetView[] = ['iso', 'front', 'rack', 'hydro', 'fire', 'system'];
const LAYERS: CabinetLayer[] = ['air', 'water', 'power', 'signals', 'fire', 'explode', 'scale'];
/** components that exist only in some configurations (rack layout of cabinetData.js) */
const ONLY_IN: Record<string, ConfigKey[]> = { loadbank: ['P0'], brick2: ['M', 'L'], cpu: ['M', 'L'] };
/** legend keys of siteData.legend → site colour tokens */
const SITE_COLOR: Record<string, string> = {
  pv: 'var(--sun)',
  farm: 'var(--farm)',
  grid: 'var(--grid)',
  bess: 'var(--battery)',
  node: 'var(--node)',
  heat: 'var(--heat)',
};

const siteCfg = (c: ConfigKey): NodeConfig => (c === 'M' ? 'M' : 'L');
const hhmm = (h: number) =>
  `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

interface Resume {
  site: string;
  level: SiteLevel;
  hour: number;
  season: Season;
}

export default function SiteViewer({ poster }: { poster: string }) {
  const { t, lang } = useI18n();
  const m = t.modell;
  const { config, setConfig } = useNode();
  const coarse = useMedia('(pointer: coarse)');
  useMemo(() => localizeModules(lang), [lang]);

  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<SiteHandle | null>(null);
  const resume = useRef<Resume | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [webgl] = useState(hasWebGL);
  const [st, setSt] = useState<SiteState | null>(null);

  const kw = useCallback((v: number) => fmtQ(n(v, 'kW', { d: Math.abs(v) < 10 ? 1 : 0 }), lang), [lang]);

  // mount (again on language change: the module texts are baked into the scene at mount time)
  useEffect(() => {
    const el = host.current;
    if (!webgl || !el) return;
    let disposed = false;
    let h: SiteHandle | null = null;
    let raf = 0;
    const offs: (() => void)[] = [];
    import('./siteScene.js').then(({ mountSite }) => {
      if (disposed) return;
      localizeModules(lang);
      offs.push(installSceneText(el, sceneTextOptions(lang)));
      const r = resume.current;
      h = mountSite(el, {
        site: r?.site ?? SITE.sites[0]?.id,
        config: siteCfg(config),
        hour: r?.hour ?? 13,
        season: r?.season ?? 'summer',
      });
      handle.current = h;
      let latest: SiteState | null = null;
      let restored = !r || r.level === 'site';
      offs.push(
        h.onChange((s) => {
          latest = s;
          if (!restored && s.siteData && !s.busy) {
            restored = true;
            void h?.setLevel(r?.level ?? 'site', { instant: true });
          }
          if (!raf)
            raf = requestAnimationFrame(() => {
              raf = 0;
              setSt(latest);
            });
        }),
      );
      if (new URLSearchParams(window.location.search).has('e2e'))
        (window as unknown as { __ggm: SiteHandle }).__ggm = h;
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      if (h) {
        const s = h.getState();
        resume.current = { site: s.site, level: s.level, hour: s.hour, season: s.season };
        offs.forEach((f) => f());
        h.dispose();
      }
      handle.current = null;
      setSt(null);
    };
    // config is synchronised by the effect below; remount only for WebGL/language
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webgl, lang]);

  const ready = !!st?.siteData;
  const level = st?.level;
  const cab = (): CabinetHandle | null => handle.current?.cabinet() ?? null;

  // node class shared with "GGM-Node": M/L drive the scene, P0 exists only in the cabinet
  useEffect(() => {
    const h = handle.current;
    if (!h || !ready) return;
    if (h.getState().config !== siteCfg(config)) h.setConfig(siteCfg(config));
    const c = h.cabinet();
    if (c && level === 'cabinet' && c.getState().config !== config) c.setConfig(config);
  }, [config, ready, level]);

  // Esc = one level up (or end the tour) while the stage is on screen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const h = handle.current;
      if (e.key !== 'Escape' || !h || dialog.current?.open || e.defaultPrevented) return;
      const r = host.current?.getBoundingClientRect();
      if (!r || r.bottom < 0 || r.top > window.innerHeight) return;
      const s = h.getState();
      if (s.touring) return h.tour('stop');
      const i = LEVELS.indexOf(s.level);
      if (i > 0 && !s.busy) void h.setLevel(LEVELS[i - 1] ?? 'site');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function sceneTextOptions(l: Lang) {
    if (l === 'ru') return null;
    const text = localizeModules(l);
    return {
      map: text.scene,
      decimal: l === 'en' ? ('.' as const) : (',' as const),
      aria: (raw: string) => {
        let x = /^3D-сцена GGM: (.*), уровень (\w+), узел (\w+), (\d+):00$/.exec(raw);
        if (x)
          return plain(m.canvas, l, {
            name: x[1] ?? '',
            level: SITE.levels[x[2] as SiteLevel]?.title ?? x[2] ?? '',
            config: x[3] ?? '',
            hour: x[4] ?? '',
          });
        x = /^3D-модель шкафа GGM-Node, конфигурация (\w+), вид (\w+)$/.exec(raw);
        if (x)
          return plain(m.cabCanvas, l, {
            config: x[1] ?? '',
            view: m.views[x[2] as keyof typeof m.views] ?? x[2] ?? '',
          });
        return null;
      },
    };
  }

  const site = (st?.siteData ?? null) as SiteDef | null;
  const nodeB = site?.buildings.find((b) => b.node);
  const go = (l: SiteLevel) => {
    const h = handle.current;
    if (!h || h.getState().busy) return;
    h.tour('stop');
    void h.setLevel(l);
  };

  return (
    <div className="n3d">
      <div className="n3d-toolbar wrap-wide" role="toolbar" aria-label={m.toolbar.label}>
        <div className="n3d-ctl">
          <span className="t-label muted">{m.toolbar.site}</span>
          <Segmented
            label={m.toolbar.site}
            value={st?.site ?? SITE.sites[0]?.id ?? ''}
            onChange={(id) => {
              handle.current?.tour('stop');
              void handle.current?.setSite(id);
            }}
            options={SITE.sites.map((s) => ({ value: s.id, label: s.short }))}
          />
        </div>
        <div className="n3d-ctl">
          <span className="t-label muted">{m.toolbar.node}</span>
          <Segmented
            label={m.toolbar.node}
            value={siteCfg(config)}
            onChange={(c) => setConfig(c)}
            options={(['M', 'L'] as const).map((c) => ({ value: c, label: SITE.node[c].label }))}
          />
        </div>
        <div className="n3d-ctl n3d-time">
          <span className="t-label muted">{m.toolbar.time}</span>
          <button
            type="button"
            className="n3d-play"
            aria-pressed={!!st?.playing}
            aria-label={st?.playing ? m.toolbar.pause : m.toolbar.play}
            disabled={!ready}
            onClick={() => handle.current?.play(!handle.current.getState().playing)}
          >
            <span aria-hidden="true">{st?.playing ? '❚❚' : '▶'}</span>
          </button>
          <input
            type="range"
            min={0}
            max={23.75}
            step={0.25}
            value={st?.hour ?? 13}
            disabled={!ready}
            aria-label={m.toolbar.time}
            aria-valuetext={hhmm(st?.hour ?? 13)}
            onChange={(e) => {
              handle.current?.play(false);
              handle.current?.setTime(Number(e.target.value));
            }}
          />
          <output className="mono tnum">{hhmm(st?.hour ?? 13)}</output>
          <Segmented
            label={m.toolbar.season}
            value={st?.season ?? 'summer'}
            onChange={(s) => handle.current?.setTime(handle.current.getState().hour, s)}
            options={SEASON_KEYS.map((k) => ({ value: k, label: SEASONS[k].label }))}
          />
        </div>
        <div className="n3d-ctl n3d-actions">
          <button
            type="button"
            className="btn btn-sm"
            disabled={!ready}
            onClick={() => handle.current?.tour(st?.touring ? 'stop' : 'start')}
          >
            {st?.touring ? m.toolbar.tourStop : m.toolbar.tour}
            <span aria-hidden="true">{st?.touring ? '' : ' →'}</span>
          </button>
          <button type="button" className="btn-ghost" onClick={() => dialog.current?.showModal()}>
            {site?.farm.profile === 'commercial' ? m.toolbar.hostBuilding : m.toolbar.host}
            <span aria-hidden="true">{' →'}</span>
          </button>
        </div>
      </div>

      <nav className="n3d-crumbs wrap-wide" aria-label={m.levelsNav}>
        {LEVELS.map((l, i) => {
          const names = [
            site?.short ?? SITE.sites[0]?.short,
            nodeB?.label ?? SITE.levels.building.title,
            m.crumbs.room,
            m.crumbs.cabinet,
          ];
          const cur = level ? LEVELS.indexOf(level) : 0;
          return (
            <span key={l} className="n3d-crumb">
              {i ? <i aria-hidden="true">{'›'}</i> : null}
              <button
                type="button"
                className={i < cur ? 'is-done' : ''}
                aria-current={i === cur ? 'step' : undefined}
                disabled={!ready || st?.busy}
                onClick={() => go(l)}
              >
                {names[i]}
              </button>
            </span>
          );
        })}
      </nav>

      <div className="n3d-grid wrap-wide">
        <div className="n3d-col">
          <div className={`n3d-stage ${level === 'cabinet' ? 'is-cab' : ''}`}>
            <div className="n3d-host" ref={host} />
            {!ready ? (
              <div className="n3d-poster">
                <img src={poster} alt={plain(m.posterAlt, lang)} width={1440} height={900} decoding="async" />
                <p className="t-label n3d-loading">{webgl ? m.loading : m.noWebgl}</p>
              </div>
            ) : null}
            {ready ? <Legend cabinet={level === 'cabinet'} consumer={site?.consumer ?? ''} /> : null}
            {st?.touring && st.tourStep >= 0 && SITE.tour[st.tourStep] ? (
              <div className="n3d-tour" aria-live="polite">
                <p className="t-label n3d-tour-step">
                  <R s={m.tour.step} v={{ n: String(st.tourStep + 1), total: String(SITE.tour.length) }} />
                </p>
                <h3 className="t-h3">{SITE.tour[st.tourStep]?.title}</h3>
                <p>
                  <ModText s={SITE.tour[st.tourStep]?.text ?? ''} />
                </p>
                <div className="n3d-tour-nav">
                  <button type="button" className="chip" onClick={() => handle.current?.tour('prev')}>
                    <span aria-hidden="true">{'← '}</span>
                    {m.tour.prev}
                  </button>
                  <button type="button" className="chip" onClick={() => handle.current?.tour('next')}>
                    {m.tour.next}
                    <span aria-hidden="true">{' →'}</span>
                  </button>
                  <button type="button" className="chip" onClick={() => handle.current?.tour('stop')}>
                    {m.tour.exit}
                  </button>
                </div>
              </div>
            ) : null}
            {ready ? (
              <p className="n3d-hint t-label" aria-hidden="true">
                {coarse ? m.hintTouch : m.hint}
              </p>
            ) : null}
          </div>
          {st && site ? <EnergyBar st={st} site={site} kw={kw} /> : null}
        </div>
        <aside className="n3d-panel" aria-live="polite">
          {st && site ? (
            <Panel st={st} site={site} cab={cab} config={config} />
          ) : (
            <p className="muted t-small">{webgl ? m.loading : m.noWebgl}</p>
          )}
        </aside>
      </div>

      <div className="wrap">
        <p className="t-small muted n3d-note">
          <R s={m.stamp} v={{ site: SITE.revision.rev, rev: CABINET.revision.rev }} /> <ModText s="[МОД]" />{' '}
          {m.note}
        </p>
        <Node3dDetails config={config} />
      </div>

      <dialog ref={dialog} className="n3d-dialog" aria-labelledby="n3d-host-title">
        <form method="dialog">
          <button className="n3d-dialog-close chip" aria-label={m.host.close}>
            <span aria-hidden="true">{'×'}</span>
          </button>
        </form>
        <h2 id="n3d-host-title" className="t-h3">
          {SITE.hostCard.title}
        </h2>
        <div className="n3d-dialog-cols">
          <div>
            <h3 className="t-label muted">{m.host.gets}</h3>
            <ul className="ref-list">
              {SITE.hostCard.gets.map((x) => (
                <li key={x}>
                  <ModText s={x} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="t-label muted">{m.host.needs}</h3>
            <ul className="ref-list">
              {SITE.hostCard.needs.map((x) => (
                <li key={x}>
                  <ModText s={x} />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="t-small muted">{m.host.note}</p>
      </dialog>
    </div>
  );
}

function Legend({ cabinet, consumer }: { cabinet: boolean; consumer: string }) {
  const [flow, setFlow] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    if (cabinet && !flow) void import('./cabinetScene.js').then((x) => setFlow(x.FLOW));
  }, [cabinet, flow]);
  const items: [string, string, string][] = cabinet
    ? CABINET.text.legend.map(([k, label]) => [
        k,
        label,
        flow?.[k] != null ? `#${flow[k].toString(16).padStart(6, '0')}` : 'var(--muted)',
      ])
    : [
        ['pv', SITE.legend.find((l) => l[0] === 'pv')?.[1] ?? '', SITE_COLOR.pv ?? ''],
        ['farm', consumer, SITE_COLOR.farm ?? ''],
        ...SITE.legend
          .filter((l) => l[0] !== 'pv')
          .map(([k, label]): [string, string, string] => [k, label, SITE_COLOR[k] ?? 'var(--muted)']),
      ];
  return (
    <ul className="n3d-legend">
      {items.map(([k, label, color]) => (
        <li key={k}>
          <i style={{ background: color }} aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}

function EnergyBar({ st, site, kw }: { st: SiteState; site: SiteDef; kw: (v: number) => string }) {
  const { t, lang } = useI18n();
  const e = t.modell.energy;
  const f = st.flows;
  const pct = (v: number) => fmtQ(n(Math.round(v * 100), '%'), lang);
  const bess = !site.bess
    ? '—'
    : f.bessCharge > 0.05
      ? `+${kw(f.bessCharge)}`
      : f.bessDischarge > 0.05
        ? `−${kw(f.bessDischarge)}`
        : kw(0);
  const exp = f.gridExport > 0.05;
  const cells: [string, string, string, string][] = [
    ['pv', plain(e.pv, lang), kw(f.pv), fmtQ(n(site.pvKWp, 'kWp'), lang)],
    ['farm', site.consumer, kw(f.farm), e.priority],
    ['bess', e.bess, bess, site.bess ? plain(e.soc, lang, { q: pct(f.soc ?? 0) }) : e.none],
    ['node', plain(e.node, lang), kw(f.node), plain(e.it, lang, { q: kw(f.nodeIT), c: st.config })],
    [
      'grid',
      e.grid,
      `${exp ? '→' : '←'} ${kw(exp ? f.gridExport : f.gridImport)}`,
      exp ? e.export : e.import,
    ],
  ];
  return (
    <dl className="n3d-energy" aria-label={e.label}>
      {cells.map(([k, label, v, sub]) => (
        <div key={k}>
          <dt className="t-label">
            <i style={{ background: SITE_COLOR[k] }} aria-hidden="true" />
            {label}
          </dt>
          <dd className="tnum">{v}</dd>
          <dd className="muted t-small">{sub}</dd>
        </div>
      ))}
    </dl>
  );
}

interface PanelProps {
  st: SiteState;
  site: SiteDef;
  cab: () => CabinetHandle | null;
  config: ConfigKey;
}

function Panel({ st, site, cab, config }: PanelProps) {
  const { t, lang } = useI18n();
  const { setConfig } = useNode();
  const m = t.modell;
  const lv = SITE.levels[st.level];
  const marker = st.selected && st.selected in SITE.markers ? SITE.markers[st.selected as MarkerId] : null;
  const kv = (rows: [string, string][]) => (
    <table className="n3d-kv">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <th scope="row">{k}</th>
            <td>
              <ModText s={v} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="n3d-panel-in">
      {marker ? (
        <div className="n3d-info">
          <p className="t-label">
            {st.selected}
            {' · '}
            {marker.label}
          </p>
          <p className="t-small">
            <ModText s={marker.text} />
          </p>
        </div>
      ) : null}
      <p className="t-label muted">{lv.title}</p>

      {st.level === 'site' ? (
        <>
          <h3 className="t-h3">{site.name}</h3>
          <p className="t-small muted">
            <ModText s={lv.lead} />
          </p>
          {kv(site.facts)}
          <h4 className="t-label muted">{m.panel.next}</h4>
          <p className="t-small">{m.panel.siteNext}</p>
        </>
      ) : null}

      {st.level === 'building' ? (
        <>
          <h3 className="t-h3">
            <R s={m.panel.building} v={{ b: site.buildings.find((b) => b.node)?.label ?? '' }} />
          </h3>
          <p className="t-small muted">
            <ModText s={lv.lead} />
          </p>
          <Segmented
            label={m.toolbar.node}
            value={st.config}
            onChange={(c) => setConfig(c)}
            options={(['M', 'L'] as const).map((c) => ({ value: c, label: SITE.node[c].label }))}
          />
          <h4 className="t-label muted">{m.panel.reserve}</h4>
          <Gauge need={st.flows.reserveNeed} avail={st.flows.reserveAvail} config={st.config} />
          <h4 className="t-label muted">{m.panel.compare}</h4>
          <table className="n3d-kv n3d-cmp tnum">
            <thead>
              <tr>
                <td />
                <th scope="col" className={st.config === 'M' ? 'is-active' : ''}>
                  {'M'}
                </th>
                <th scope="col" className={st.config === 'L' ? 'is-active' : ''}>
                  {'L'}
                </th>
              </tr>
            </thead>
            <tbody>
              {CABINET.configs.M.rows.map(([k, v], i) => (
                <tr key={k}>
                  <th scope="row">{k}</th>
                  <td className={st.config === 'M' ? 'is-active' : ''}>
                    <ModText s={v} />
                  </td>
                  <td className={st.config === 'L' ? 'is-active' : ''}>
                    <ModText s={CABINET.configs.L.rows[i]?.[1] ?? ''} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h4 className="t-label muted">
            <R s={m.panel.today} v={{ season: SEASONS[st.season].label }} /> <ModText s="[МОД]" />
          </h4>
          <table className="n3d-kv tnum">
            <tbody>
              <tr>
                <th scope="row">{m.panel.dayKWh}</th>
                <td>{fmtQ(n(Math.round(st.flows.nodeDayKWh), 'kWh'), lang)}</td>
              </tr>
              <tr>
                <th scope="row">{m.panel.pvShare}</th>
                <td>{fmtQ(n(Math.round(st.flows.pvShareNodeDay * 100), '%'), lang)}</td>
              </tr>
              <tr>
                <th scope="row">{m.panel.recommend}</th>
                <td>{SITE.node[site.recommend].label}</td>
              </tr>
            </tbody>
          </table>
        </>
      ) : null}

      {st.level === 'room' ? (
        <>
          <h3 className="t-h3">{lv.title}</h3>
          <p className="t-small muted">
            <ModText s={lv.lead} />
          </p>
          {kv(SITE.roomFacts)}
          <h4 className="t-label muted">{m.panel.next}</h4>
          <p className="t-small">{m.panel.roomNext}</p>
        </>
      ) : null}

      {st.level === 'cabinet' ? <CabinetPanel st={st} cab={cab} config={config} /> : null}
    </div>
  );
}

function Gauge({ need, avail, config }: { need: number; avail: number | null; config: NodeConfig }) {
  const { t, lang } = useI18n();
  const m = t.modell.panel;
  const max = Math.max(need, avail ?? 0) * 1.25;
  const ok = avail == null || need <= avail;
  const q = (v: number, cmp?: '≥') => fmtQ(n(v, 'kW', cmp ? { cmp } : {}), lang);
  return (
    <div className="n3d-gauge">
      <div className="n3d-gauge-bar" aria-hidden="true">
        <div className={`n3d-gauge-fill ${ok ? '' : 'is-bad'}`} style={{ width: `${(need / max) * 100}%` }} />
        {avail != null ? (
          <div className="n3d-gauge-avail" style={{ left: `${(avail / max) * 100}%` }} />
        ) : null}
      </div>
      <p className="n3d-gauge-cap t-small tnum">
        <span>
          <R s={m.need} v={{ q: q(need, '≥'), c: config }} />
        </span>
        <span>
          <R s={m.avail} v={{ q: avail != null ? q(avail) : m.unknown }} /> <ModText s="[ДОП]" />
        </span>
      </p>
      <p className={`t-small ${ok ? 'n3d-ok' : 'n3d-bad'}`}>
        <span aria-hidden="true">{ok ? '✓ ' : '✕ '}</span>
        {ok ? m.ok : m.bad}
      </p>
    </div>
  );
}

function CabinetPanel({
  st,
  cab,
  config,
}: {
  st: SiteState;
  cab: () => CabinetHandle | null;
  config: ConfigKey;
}) {
  const { t } = useI18n();
  const m = t.modell;
  const cs = st.cabinet;
  const sel = cs?.selected ? CABINET.components.find((c) => c.id === cs.selected) : null;
  const shown = CABINET.components.filter((c) => ONLY_IN[c.id]?.includes(config) ?? true);
  return (
    <>
      <h3 className="t-h3">
        <R s={m.panel.cabinet} v={{ c: cs?.config ?? config }} />
      </h3>
      <p className="t-small muted">
        <ModText s={SITE.levels.cabinet.lead} />
      </p>
      <h4 className="t-label muted">{m.panel.view}</h4>
      <Segmented
        label={m.panel.view}
        value={cs?.view && VIEWS.includes(cs.view) ? cs.view : 'iso'}
        onChange={(v) => cab()?.setView(v)}
        options={VIEWS.map((v) => ({ value: v, label: m.views[v as keyof typeof m.views] }))}
        className="n3d-seg-wrap"
      />
      <h4 className="t-label muted">{m.panel.layers}</h4>
      <div className="n3d-chips" role="group" aria-label={m.panel.layers}>
        {LAYERS.map((l) => (
          <button
            key={l}
            type="button"
            className="chip"
            aria-pressed={!!cs?.layers[l]}
            onClick={() => {
              const c = cab();
              if (c) c.setLayer(l, !c.getState().layers[l]);
            }}
          >
            {m.layers[l as keyof typeof m.layers]}
          </button>
        ))}
      </div>
      {sel ? (
        <article className="n3d-card" data-comp={sel.id}>
          <div className="n3d-card-head">
            <span className="t-label muted">{sel.g}</span>
            <button type="button" className="chip" onClick={() => cab()?.select(null)}>
              {m.panel.close}
            </button>
          </div>
          <h4 className="t-h3 n3d-card-title">
            <span className="n3d-num tnum">{sel.n}</span>
            <span>{sel.name}</span> <ModText s={`[${sel.st}]`} />
          </h4>
          <p className="t-small">
            <ModText s={sel.f} />
          </p>
          <table className="n3d-kv">
            <tbody>
              {sel.s.map(([k, v]) => (
                <tr key={k}>
                  <th scope="row">{k}</th>
                  <td>
                    <ModText s={v} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h5 className="t-label muted">{m.panel.links}</h5>
          <ul className="n3d-links t-small">
            {sel.l.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </article>
      ) : (
        <p className="t-small muted n3d-empty">{m.panel.empty}</p>
      )}
      <nav className="n3d-list" aria-label={m.panel.components}>
        <h4 className="t-label muted">{m.panel.components}</h4>
        {CABINET.groups.map((g) => (
          <div key={g.key}>
            <p className="t-label dim">{g.name}</p>
            <ul>
              {shown
                .filter((c) => c.group === g.key)
                .map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      data-id={c.id}
                      aria-current={cs?.selected === c.id ? 'true' : undefined}
                      aria-label={`${c.n}. ${c.name}`}
                      onClick={() => cab()?.select(c.id, { fly: true })}
                    >
                      <span className="n3d-num-sm tnum">{c.n}</span>
                      <span>{c.name}</span>
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}
