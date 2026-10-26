/** Marker of unfinished content. Built from parts so this file itself never trips scripts/check-launch.mjs. */
export const PLACEHOLDER = ['TODO', ':'].join('');
export const hasPlaceholder = (v: unknown) => JSON.stringify(v).includes(PLACEHOLDER);
