// Persisted, user-editable AAC boards. A "board" is a named set of
// categories (goals) — e.g. a caregiver might keep separate boards for
// "Mealtime", "Classroom", or a specific IEP/therapy goal — each with its
// own tiles. Stored client-side only (localStorage): there's no account
// system, and this data should never leave the device.
import { CATEGORIES } from './vocabulary';

const BOARDS_KEY = 'ez-aac-boards-v1';
const ACTIVE_BOARD_KEY = 'ez-aac-active-board-v1';

let counter = 0;
export function uid(prefix) {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

function defaultBoards() {
  return [{ id: 'default', name: 'Core Words', categories: CATEGORIES }];
}

export function loadBoards() {
  if (typeof window === 'undefined') return defaultBoards();
  try {
    const raw = window.localStorage.getItem(BOARDS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultBoards();
  } catch {
    return defaultBoards();
  }
}

export function saveBoards(boards) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
}

export function loadActiveBoardId(boards) {
  if (typeof window === 'undefined') return boards[0].id;
  const stored = window.localStorage.getItem(ACTIVE_BOARD_KEY);
  return boards.some((b) => b.id === stored) ? stored : boards[0].id;
}

export function saveActiveBoardId(id) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACTIVE_BOARD_KEY, id);
}

export function renameBoard(boards, boardId, name) {
  return boards.map((b) => (b.id === boardId ? { ...b, name } : b));
}

export function addCategory(boards, boardId, { label, color }) {
  return boards.map((b) =>
    b.id === boardId
      ? { ...b, categories: [...b.categories, { id: uid('cat'), label, color, words: [] }] }
      : b
  );
}

export function removeCategory(boards, boardId, categoryId) {
  return boards.map((b) =>
    b.id === boardId ? { ...b, categories: b.categories.filter((c) => c.id !== categoryId) } : b
  );
}

export function addWord(boards, boardId, categoryId, { label, emoji }) {
  return boards.map((b) =>
    b.id === boardId
      ? {
          ...b,
          categories: b.categories.map((c) =>
            c.id === categoryId ? { ...c, words: [...c.words, { id: uid('word'), label, emoji }] } : c
          ),
        }
      : b
  );
}

export function removeWord(boards, boardId, categoryId, wordId) {
  return boards.map((b) =>
    b.id === boardId
      ? {
          ...b,
          categories: b.categories.map((c) =>
            c.id === categoryId ? { ...c, words: c.words.filter((w) => w.id !== wordId) } : c
          ),
        }
      : b
  );
}
