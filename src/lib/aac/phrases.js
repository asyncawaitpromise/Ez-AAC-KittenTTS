// Persisted, user-created quick phrases — short pre-built sentences (e.g. "I
// need a break") that get inserted into the sentence bar in one tap instead
// of being built word-by-word. Stored client-side only (localStorage),
// mirroring boards.js.
const PHRASES_KEY = 'ez-aac-phrases-v1';

let counter = 0;
function uid() {
  counter += 1;
  return `phrase-${Date.now().toString(36)}-${counter.toString(36)}`;
}

function defaultPhrases() {
  return [
    { id: 'p-break', text: 'I need a break' },
    { id: 'p-help', text: 'Can you help me please' },
    { id: 'p-bathroom', text: 'I need to use the bathroom' },
    { id: 'p-more', text: 'I want more please' },
  ];
}

export function loadPhrases() {
  if (typeof window === 'undefined') return defaultPhrases();
  try {
    const raw = window.localStorage.getItem(PHRASES_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : defaultPhrases();
  } catch {
    return defaultPhrases();
  }
}

export function savePhrases(phrases) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PHRASES_KEY, JSON.stringify(phrases));
}

export function addPhrase(phrases, text) {
  return [...phrases, { id: uid(), text }];
}

export function removePhrase(phrases, id) {
  return phrases.filter((p) => p.id !== id);
}
