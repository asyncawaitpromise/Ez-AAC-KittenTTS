// Open Board Format (OBF v0.1) export/import. Maps an AAC board's
// categories + words onto OBF's grid/button structure so boards can be shared
// with other AAC apps (and round-trip back through this one).
import { uid } from './boards';

const COLORS = {
  pink: { background: 'rgb(252,231,243)', border: 'rgb(244,114,182)' },
  yellow: { background: 'rgb(254,249,195)', border: 'rgb(250,204,21)' },
  green: { background: 'rgb(220,252,231)', border: 'rgb(74,222,128)' },
  blue: { background: 'rgb(219,234,254)', border: 'rgb(96,165,250)' },
  orange: { background: 'rgb(255,237,213)', border: 'rgb(251,146,60)' },
  purple: { background: 'rgb(243,232,255)', border: 'rgb(192,132,252)' },
  red: { background: 'rgb(254,226,226)', border: 'rgb(248,113,113)' },
  default: { background: 'rgb(255,255,255)', border: 'rgb(0,0,0)' },
};

export function exportToObf(board) {
  const columns = Math.max(4, ...board.categories.map((c) => c.words.length));
  const buttons = [];
  const order = [];

  for (const category of board.categories) {
    const { background, border } = COLORS[category.color] ?? COLORS.default;

    const headerButton = {
      id: uid('btn'),
      label: category.label,
      border_color: border,
      background_color: background,
      ext_custom_data: {
        role: 'category',
        categoryId: category.id,
        label: category.label,
        color: category.color,
      },
    };
    buttons.push(headerButton);

    const headerRow = Array(columns).fill(null);
    headerRow[0] = headerButton.id;
    order.push(headerRow);

    const wordButtons = category.words.map((word) => {
      const button = {
        id: uid('btn'),
        label: word.label,
        border_color: border,
        background_color: background,
        ext_custom_data: {
          role: 'word',
          categoryId: category.id,
          categoryLabel: category.label,
          categoryColor: category.color,
          emoji: word.emoji,
        },
      };
      buttons.push(button);
      return button;
    });

    for (let i = 0; i < wordButtons.length; i += columns) {
      const row = Array(columns).fill(null);
      wordButtons.slice(i, i + columns).forEach((wb, j) => {
        row[j] = wb.id;
      });
      order.push(row);
    }
  }

  return {
    format: 'open-board-0.1',
    id: board.id,
    locale: 'en',
    name: board.name,
    description: '',
    grid: { rows: order.length, columns, order },
    buttons,
    images: [],
    sounds: [],
  };
}

export function importObf(jsonString) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid OBF file');
  }
  if (!parsed || typeof parsed.format !== 'string' || !parsed.format.startsWith('open-board')) {
    throw new Error('Invalid OBF file');
  }

  const name = parsed.name || 'Imported board';
  const buttons = Array.isArray(parsed.buttons) ? parsed.buttons : [];

  const groups = new Map();
  const getGroup = (key) => {
    if (!groups.has(key)) groups.set(key, { label: 'Imported', color: 'orange', words: [] });
    return groups.get(key);
  };

  // First pass: pre-seed groups from category header buttons so empty
  // categories survive a round-trip even when they have no words.
  for (const button of buttons) {
    const ext = button?.ext_custom_data ?? {};
    if (ext.role !== 'category') continue;
    const key = ext.categoryId ? `id:${ext.categoryId}` : `label:${ext.label ?? 'Imported'}`;
    const group = getGroup(key);
    if (ext.label) group.label = ext.label;
    if (ext.color) group.color = ext.color;
  }

  // Second pass: words. Skip category headers and folder/nav buttons (foreign
  // OBF files use `load_board` to navigate instead of speaking).
  for (const button of buttons) {
    if (!button || typeof button.label !== 'string' || button.label.trim() === '') continue;
    const ext = button.ext_custom_data ?? {};
    if (ext.role === 'category' || button.load_board) continue;

    const categoryId = ext.categoryId;
    const categoryLabel = ext.categoryLabel;
    const categoryColor = ext.categoryColor || 'orange';

    const key = categoryId
      ? `id:${categoryId}`
      : categoryLabel
        ? `label:${categoryLabel}`
        : 'fallback';

    const group = getGroup(key);
    if (categoryLabel) group.label = categoryLabel;
    if (categoryColor) group.color = categoryColor;

    group.words.push({
      id: uid('word'),
      label: button.label,
      emoji: ext.emoji || '💬',
    });
  }

  const categories = [...groups.values()].map((group) => ({
    id: uid('cat'),
    label: group.label,
    color: group.color,
    words: group.words,
  }));

  return { id: uid('board'), name, categories };
}
