// Persisted recently-used words/phrases — a short-lived strip of the most
// recent items the user tapped, so they can re-say them without hunting for
// the same board again. Stored client-side only (localStorage), mirroring
// phrases.js.
const RECENTS_KEY = 'ez-aac-recents-v1';

const MAX_RECENTS = 8;

export function loadRecents() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecents(recents) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
  } catch {}
}

export function addRecent(recents, { label, source = 'word' }) {
  const trimmed = (label ?? '').trim();
  if (!trimmed) return recents;

  const without = recents.filter((r) => r.label !== trimmed);
  const entry = { id: `recent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, label: trimmed, source };

  return [entry, ...without].slice(0, MAX_RECENTS);
}
