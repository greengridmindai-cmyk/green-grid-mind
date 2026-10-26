/** Site-wide configuration. Every `TODO:` value must be replaced before `npm run build:prod`. */
export const CONTACT_EMAIL = 'TODO:kontakt@domain.tld';
/** Empty → the contact form falls back to a mailto: link. */
export const FORM_ENDPOINT = '';
export const HERO_VIDEO = {
  mp4: 'media/hero.mp4',
  webm: 'media/hero.webm',
  poster: 'media/hero-poster.jpg',
} as const;
export const SITE_URL = 'https://greengridmindai-cmyk.github.io/green-grid-mind/';
export const LANGUAGES = ['de', 'en', 'ru'] as const;
export type Lang = (typeof LANGUAGES)[number];
