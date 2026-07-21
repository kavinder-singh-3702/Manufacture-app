// Client-side ad frequency guard — mirrors the app's adPopupStorage
// (app-frontend/src/services/adPopupStorage.ts) so both platforms enforce the
// same "don't annoy the visitor" contract:
//
//  - Per-day impression cap: the backend already enforces this server-side for
//    logged-in users (AdEvent counts). Anonymous visitors have no stable server
//    identity, so this module tracks the same cap client-side via localStorage.
//    Cheap to also consult it for logged-in users as an early, network-free bail.
//  - Popup cadence: purely a client-timing concern (don't show the interstitial
//    too often in one browsing session) — enforced client-side for everyone,
//    same as the app.
//
// SSR-safe: every read/write no-ops when `window` isn't available.

const IMPRESSIONS_KEY = "arvann_ad_impressions_v1";
const DISMISSED_KEY = "arvann_ad_dismissed_v1";
const POPUP_LAST_SHOWN_KEY = "arvann_ad_popup_last_shown_v1";

const isBrowser = () => typeof window !== "undefined";

const todayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

type ImpressionLog = Record<string, { day: string; count: number }>;

const readJson = <T,>(key: string, fallback: T): T => {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort — private browsing / storage-full shouldn't break the page.
  }
};

// ── Per-day impression cap (mirrors campaign.frequencyCapPerDay) ───────────────

const getImpressionCountToday = (campaignId: string): number => {
  const log = readJson<ImpressionLog>(IMPRESSIONS_KEY, {});
  const entry = log[campaignId];
  return entry && entry.day === todayKey() ? entry.count : 0;
};

/** Whether a campaign is still allowed to show today, given its per-day cap. */
export const canShowByCap = (campaignId: string, capPerDay: number): boolean =>
  getImpressionCountToday(campaignId) < Math.max(1, capPerDay);

export const recordImpression = (campaignId: string): void => {
  const log = readJson<ImpressionLog>(IMPRESSIONS_KEY, {});
  const day = todayKey();
  const current = log[campaignId];
  log[campaignId] = { day, count: current && current.day === day ? current.count + 1 : 1 };
  writeJson(IMPRESSIONS_KEY, log);
};

// ── Dismissed campaigns (mirrors server-side AdEvent "dismiss" suppression) ────

const getDismissedSet = (): Set<string> => new Set(readJson<string[]>(DISMISSED_KEY, []));

export const isDismissed = (campaignId: string): boolean => getDismissedSet().has(campaignId);

export const recordDismiss = (campaignId: string): void => {
  const set = getDismissedSet();
  set.add(campaignId);
  writeJson(DISMISSED_KEY, Array.from(set));
};

// ── Popup cadence (min minutes between interstitial showings) ──────────────────

export const getPopupLastShownAt = (): number | null => {
  const raw = readJson<number | null>(POPUP_LAST_SHOWN_KEY, null);
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
};

export const setPopupLastShownAt = (timestamp: number): void => writeJson(POPUP_LAST_SHOWN_KEY, timestamp);

/** Whether enough time has passed since the last popup, given this campaign's cadence. */
export const canShowPopupNow = (cooldownMinutes: number): boolean => {
  const last = getPopupLastShownAt();
  if (!last) return true;
  return Date.now() - last >= Math.max(1, cooldownMinutes) * 60_000;
};

// ── Combined gate used by every surface before rendering a card ────────────────

/** True when a feed card is eligible to render: not dismissed, and under its daily cap. */
export const canShowCard = (campaignId: string, capPerDay: number): boolean =>
  !isDismissed(campaignId) && canShowByCap(campaignId, capPerDay);
