import type { TagKey } from '../../data/node.ts';
import { useT } from '../../i18n/index.ts';

/** Epistemic status tag (§2.1). The visible word is translated; the meaning is in the title. */
export function Tag({ k }: { k: TagKey }) {
  const t = useT();
  return (
    <span className={`tag tag-${k}`} title={t.tagHelp[k]}>
      {t.tags[k]}
      <span className="sr-only">
        {' — '}
        {t.tagHelp[k]}
      </span>
    </span>
  );
}
