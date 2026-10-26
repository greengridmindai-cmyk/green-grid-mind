import { useMemo } from 'react';
import { CONFIGS, NODE_SPECS, ROW } from '../../data/node.ts';
import { fmtQ, n } from '../../i18n/format.ts';
import { R, plain, useI18n } from '../../i18n/index.ts';
import { SectionHead } from '../SectionHead.tsx';
import { Tag } from '../ui/Tag.tsx';
import { useQVars } from '../ui/QV.tsx';
import { ButtonLink } from '../ui/Button.tsx';
import { Segmented } from '../ui/Segmented.tsx';
import { FrontElevation } from '../charts/FrontElevation.tsx';
import { ConfigTable } from '../ConfigTable.tsx';
import { useCabinet } from '../cabinet/CabinetContext.tsx';

export function Knoten({ index }: { index: number }) {
  const { t, lang } = useI18n();
  const { config, setConfig } = useCabinet();
  const vars = useQVars();
  const k = t.knoten;
  const labels = useMemo(() => {
    const [ecab, , lcp] = ROW.sections;
    return {
      total: fmtQ(n(ROW.width, 'mm'), lang),
      height: fmtQ(n(ROW.height, 'mm'), lang),
      s800: fmtQ(n(ecab.w), lang),
      s300: fmtQ(n(lcp.w), lang),
      ecab: k.elevation.ecab,
      rack: plain(k.elevation.rack, lang),
      lcp: plain(k.elevation.lcp, lang),
    };
  }, [k, lang]);

  return (
    <section id="knoten" className="sec bg-night-2" aria-labelledby="knoten-title">
      <div className="wrap">
        <SectionHead index={index} label={<R s={t.nav.knoten} />} />
        <div className="sec-intro" data-reveal>
          <h2 id="knoten-title" className="t-h2">
            {k.title}
          </h2>
          <p className="t-lede">
            <R s={k.lede} />
          </p>
        </div>
        <div className="grid12 knoten-main">
          <div className="knoten-drawing" data-reveal>
            <FrontElevation config={config} labels={labels} title={k.elevation.label} />
          </div>
          <div className="knoten-specs" data-reveal>
            <dl>
              {NODE_SPECS.map((s) => {
                const [label = '', value = ''] = k.specs[s.id as keyof typeof k.specs];
                return (
                  <div key={s.id} className="spec-row">
                    <dt>
                      <R s={label} />
                    </dt>
                    <dd>
                      <span>
                        <R s={value} v={vars(s.q)} />
                      </span>
                      {s.tag ? <Tag k={s.tag} /> : null}
                    </dd>
                  </div>
                );
              })}
            </dl>
            <ButtonLink href="#modell" variant="ghost" className="knoten-3d">
              {k.open3d}
            </ButtonLink>
          </div>
        </div>
        <div className="knoten-configs" data-reveal>
          <div className="knoten-configs-head">
            <h3 className="t-h3">{k.configs.title}</h3>
            <Segmented
              label={k.configs.seg}
              value={config}
              onChange={setConfig}
              options={CONFIGS.map((c) => ({ value: c, label: <R s={k.configs.names[c]} /> }))}
            />
          </div>
          <ConfigTable active={config} />
        </div>
      </div>
    </section>
  );
}
