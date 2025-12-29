const PORTRAIT_BASE_PATH = '/riders/portraits';

export const PORTRAIT_FALLBACK_URL = `${PORTRAIT_BASE_PATH}/silhouette.svg`;

export function getRiderPortraitUrl(portraitKey) {
  if (!portraitKey) return null;
  return `${PORTRAIT_BASE_PATH}/${portraitKey}.webp`;
}
