import { useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { CATEGORY_COLOR_CLASSES } from '../../lib/aac/vocabulary';

const COLOR_KEYS = Object.keys(CATEGORY_COLOR_CLASSES);

const CategoryEditor = ({ category, onAddWord, onRemoveWord, onRemoveCategory }) => {
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('');

  const submitWord = (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    onAddWord({ label: label.trim(), emoji: emoji.trim() || '💬' });
    setLabel('');
    setEmoji('');
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${CATEGORY_COLOR_CLASSES[category.color] ?? 'border-base-300'}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold">{category.label}</span>
        <button
          type="button"
          onClick={onRemoveCategory}
          aria-label={`Delete ${category.label} goal`}
          className="btn btn-square btn-ghost btn-xs"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mb-2 flex flex-wrap gap-1">
        {category.words.map((word) => (
          <span key={word.id} className="flex items-center gap-1 rounded-full bg-base-100/70 px-2 py-1 text-sm">
            {word.emoji} {word.label}
            <button
              type="button"
              onClick={() => onRemoveWord(word.id)}
              aria-label={`Remove ${word.label}`}
              className="text-base-content/50 hover:text-error"
            >
              ×
            </button>
          </span>
        ))}
        {category.words.length === 0 && <span className="text-sm text-base-content/50">No words yet</span>}
      </div>

      <form onSubmit={submitWord} className="flex gap-1">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="🙂"
          className="input input-bordered input-sm w-14 text-center"
          maxLength={4}
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="new word"
          className="input input-bordered input-sm flex-1"
        />
        <button type="submit" className="btn btn-square btn-sm" aria-label="Add word">
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
};

const BoardEditorView = ({ boardsApi, onBack }) => {
  const {
    boards,
    activeBoard,
    activeBoardId,
    setActiveBoardId,
    createBoard,
    deleteBoard,
    renameBoard,
    addCategory,
    removeCategory,
    addWord,
    removeWord,
  } = boardsApi;

  const [newBoardName, setNewBoardName] = useState('');
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(COLOR_KEYS[0]);

  const submitNewBoard = (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    createBoard(newBoardName);
    setNewBoardName('');
  };

  const submitNewCategory = (e) => {
    e.preventDefault();
    if (!newCategoryLabel.trim()) return;
    addCategory(activeBoard.id, { label: newCategoryLabel.trim(), color: newCategoryColor });
    setNewCategoryLabel('');
  };

  return (
    <div className="flex max-h-[80svh] flex-col gap-3 overflow-y-auto">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} aria-label="Back to settings" className="btn btn-square btn-ghost btn-sm">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-bold">Manage boards</h2>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Active board</span>
        <div className="flex gap-2">
          <select
            className="select select-bordered flex-1"
            value={activeBoardId}
            onChange={(e) => setActiveBoardId(e.target.value)}
          >
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => deleteBoard(activeBoard.id)}
            disabled={boards.length <= 1}
            aria-label="Delete this board"
            className="btn btn-square btn-ghost"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Board name</span>
        <input
          className="input input-bordered w-full"
          value={activeBoard.name}
          onChange={(e) => renameBoard(activeBoard.id, e.target.value)}
        />
      </label>

      <form onSubmit={submitNewBoard} className="flex gap-2">
        <input
          className="input input-bordered flex-1"
          placeholder="New board name (e.g. Mealtime)"
          value={newBoardName}
          onChange={(e) => setNewBoardName(e.target.value)}
        />
        <button type="submit" className="btn btn-outline gap-1">
          <Plus size={16} /> Board
        </button>
      </form>

      <div className="divider my-0" />

      <div className="flex flex-col gap-2">
        {activeBoard.categories.map((category) => (
          <CategoryEditor
            key={category.id}
            category={category}
            onAddWord={(word) => addWord(activeBoard.id, category.id, word)}
            onRemoveWord={(wordId) => removeWord(activeBoard.id, category.id, wordId)}
            onRemoveCategory={() => removeCategory(activeBoard.id, category.id)}
          />
        ))}
        {activeBoard.categories.length === 0 && (
          <p className="text-sm text-base-content/50">No goals yet — add one below to get started.</p>
        )}
      </div>

      <form onSubmit={submitNewCategory} className="flex gap-2">
        <select
          className="select select-bordered"
          value={newCategoryColor}
          onChange={(e) => setNewCategoryColor(e.target.value)}
        >
          {COLOR_KEYS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          className="input input-bordered flex-1"
          placeholder="New goal name (e.g. Mealtime)"
          value={newCategoryLabel}
          onChange={(e) => setNewCategoryLabel(e.target.value)}
        />
        <button type="submit" className="btn btn-outline gap-1">
          <Plus size={16} /> Goal
        </button>
      </form>
    </div>
  );
};

export default BoardEditorView;
