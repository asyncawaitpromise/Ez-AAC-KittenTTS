// Persisted history of completed sentences, used to seed the word-prediction
// n-gram model so predictions adapt to what the user actually says. Stored
// client-side only (localStorage), mirroring phrases.js and boards.js.
const HISTORY_KEY = 'ez-aac-history-v1';

export function loadHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(history) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

export function recordSentence(history, text) {
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (!trimmed) return history;

  const last = history[history.length - 1];
  const next = last === trimmed ? history : [...history, trimmed];

  if (next.length > 200) return next.slice(next.length - 200);
  return next;
}
