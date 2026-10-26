/**
 * Standort-Check evaluation (§9.1). Pure function, no side effects, unit-tested.
 * PV and battery answers never gate the result.
 */
export type YNU = 'yes' | 'no' | 'unsure';
export type ReserveAnswer = 'ge24' | '16to24' | 'lt16' | 'unknown';
export type DistanceAnswer = 'near' | 'far' | 'unsure';

export interface SiteInput {
  state?: 'by' | 'bw' | 'other';
  pv?: number | null;
  bess?: 'yes' | 'no';
  reserve?: ReserveAnswer;
  room?: YNU;
  floor?: YNU;
  distance?: DistanceAnswer;
  outdoor?: YNU;
  fire?: 'yes' | 'no';
}

export type CriterionId = 'state' | 'reserve' | 'room' | 'floor' | 'distance' | 'outdoor' | 'fire';
export type Mark = 'ok' | 'unknown' | 'fail';
export type NoteKey = 'outside' | 'lowReserve' | 'fixable' | 'pv' | 'unknown' | 'incomplete';
export type SiteStatus = 'suitable-L' | 'suitable-M' | 'check' | 'not-suitable' | 'outside' | 'incomplete';

export interface Criterion {
  id: CriterionId;
  mark: Mark;
  answered: boolean;
  note?: NoteKey;
}

export interface SiteResult {
  status: SiteStatus;
  candidate: 'L' | 'M' | null;
  criteria: Criterion[];
  /** hard-stop criteria that failed */
  failed: CriterionId[];
  notes: NoteKey[];
}

export const CRITERIA: CriterionId[] = ['state', 'reserve', 'room', 'floor', 'distance', 'outdoor', 'fire'];
const HARD_STOPS: CriterionId[] = ['room', 'outdoor', 'fire'];

function markOf(id: CriterionId, i: SiteInput): Criterion {
  const v = i[id];
  if (v === undefined) return { id, mark: 'unknown', answered: false };
  switch (id) {
    case 'state':
      return v === 'other'
        ? { id, mark: 'fail', answered: true, note: 'outside' }
        : { id, mark: 'ok', answered: true };
    case 'reserve':
      if (v === 'ge24' || v === '16to24') return { id, mark: 'ok', answered: true };
      if (v === 'lt16') return { id, mark: 'fail', answered: true, note: 'lowReserve' };
      return { id, mark: 'unknown', answered: true };
    case 'floor':
      if (v === 'no') return { id, mark: 'fail', answered: true, note: 'fixable' };
      return { id, mark: v === 'yes' ? 'ok' : 'unknown', answered: true };
    case 'distance':
      if (v === 'far') return { id, mark: 'fail', answered: true, note: 'fixable' };
      return { id, mark: v === 'near' ? 'ok' : 'unknown', answered: true };
    default:
      return { id, mark: v === 'yes' ? 'ok' : v === 'no' ? 'fail' : 'unknown', answered: true };
  }
}

export function evaluateSite(input: SiteInput): SiteResult {
  const criteria = CRITERIA.map((id) => markOf(id, input));
  const by = Object.fromEntries(criteria.map((c) => [c.id, c])) as Record<CriterionId, Criterion>;
  const notes: NoteKey[] = [];
  if (input.pv != null && input.pv > 0) notes.push('pv');

  const candidate: SiteResult['candidate'] =
    input.reserve === 'ge24' ? 'L' : input.reserve === '16to24' ? 'M' : null;

  if (input.state === 'other') {
    return { status: 'outside', candidate: null, criteria, failed: [], notes: ['outside', ...notes] };
  }

  const failed = HARD_STOPS.filter((id) => by[id].mark === 'fail');
  if (input.reserve === 'lt16') failed.push('reserve');
  if (failed.length) {
    const n: NoteKey[] = input.reserve === 'lt16' ? ['lowReserve'] : [];
    return { status: 'not-suitable', candidate: null, criteria, failed, notes: [...n, ...notes] };
  }

  if (criteria.some((c) => !c.answered)) {
    return { status: 'incomplete', candidate, criteria, failed: [], notes: ['incomplete', ...notes] };
  }

  const fixable = by.floor.mark === 'fail' || by.distance.mark === 'fail';
  const unknown = criteria.some((c) => c.mark === 'unknown');
  if (fixable || unknown) {
    const n: NoteKey[] = [];
    if (fixable) n.push('fixable');
    if (unknown) n.push('unknown');
    return { status: 'check', candidate, criteria, failed: [], notes: [...n, ...notes] };
  }

  return {
    status: candidate === 'L' ? 'suitable-L' : 'suitable-M',
    candidate,
    criteria,
    failed: [],
    notes,
  };
}
