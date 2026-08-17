import { useEffect, useMemo, useState } from 'react';
import { MessageSquarePlus, Plus, Search } from 'lucide-react';

// Search across the active board's tiles and the saved phrases, with a
// fallback to capture anything that isn't found: either as a new tile on the
// active board or as a saved phrase.
const SearchView = ({ boardsApi, phrases, addPhrase, onUseWord, onUsePhrase }) => {
  const categories = boardsApi.activeBoard?.categories ?? [];
  const [query, setQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id ?? '');
  const [emoji, setEmoji] = useState('💬');

  // Keep the "add as tile" target in sync when the active board changes.
  useEffect(() => {
    setSelectedCategoryId(boardsApi.activeBoard?.categories?.[0]?.id ?? '');
  }, [boardsApi.activeBoard?.id]);

  const q = query.trim().toLowerCase();

  const words = useMemo(
    () =>
      categories.flatMap((c) => (c.words ?? []).map((w) => ({ ...w, categoryId: c.id }))),
    [boardsApi.activeBoard]
  );

  const matchingWords = useMemo(
    () => (q ? words.filter((w) => w.label.toLowerCase().includes(q)) : []),
    [words, q]
  );

  const matchingPhrases = useMemo(
    () => (q ? phrases.filter((p) => p.text.toLowerCase().includes(q)) : []),
    [phrases, q]
  );

  const submitWord = (e) => {
    e.preventDefault();
    const label = query.trim();
    if (!label || !selectedCategoryId) return;
    boardsApi.addWord(boardsApi.activeBoard.id, selectedCategoryId, {
      label,
      emoji: emoji.trim() || '💬',
    });
    setShowAddForm(false);
    setQuery('');
    setEmoji('💬');
  };

  const savePhrase = () => {
    const text = query.trim();
    if (!text) return;
    addPhrase(text);
    setQuery('');
  };

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
      <label className="input input-bordered flex items-center gap-2">
        <Search size={18} className="text-base-content/50" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search words and phrases…"
          className="grow"
          autoFocus
        />
      </label>

      {q === '' ? (
        <>
          <p className="self-start text-base-content/50">
            Type to search words and phrases.
          </p>
          {phrases.length > 0 && (
            <div className="grid flex-1 content-start grid-cols-2 gap-2 sm:grid-cols-3">
              {phrases.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onUsePhrase(p)}
                  className="truncate rounded-2xl border-2 border-base-300 bg-base-100 px-3 py-4 text-left font-semibold hover:bg-base-200 active:scale-95"
                >
                  {p.text}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {matchingWords.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-base-content/60">Words</h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {matchingWords.map((word) => (
                  <button
                    key={word.id}
                    type="button"
                    onClick={() => onUseWord(word.label)}
                    aria-label={word.label}
                    className="flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-base-300 bg-base-100 p-2 aspect-square text-center hover:bg-base-200 active:scale-95"
                  >
                    {word.emoji && (
                      <span className="text-3xl leading-none" aria-hidden="true">
                        {word.emoji}
                      </span>
                    )}
                    <span className="text-sm font-semibold leading-tight">{word.label}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {matchingPhrases.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-base-content/60">Phrases</h2>
              <div className="grid flex-1 content-start grid-cols-2 gap-2 sm:grid-cols-3">
                {matchingPhrases.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onUsePhrase(p)}
                    className="truncate rounded-2xl border-2 border-base-300 bg-base-100 px-3 py-4 text-left font-semibold hover:bg-base-200 active:scale-95"
                  >
                    {p.text}
                  </button>
                ))}
              </div>
            </section>
          )}

          {matchingWords.length === 0 && (
            <div className="flex flex-col gap-2">
              {categories.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowAddForm((v) => !v)}
                  className="btn gap-2"
                >
                  <Plus size={18} /> Add “{query.trim()}” as a tile
                </button>
              ) : (
                <p className="text-sm text-base-content/50">
                  This board has no goals yet — add one in Settings to save tiles.
                </p>
              )}

              {showAddForm && categories.length > 0 && (
                <form onSubmit={submitWord} className="flex flex-col gap-2">
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="select select-bordered"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    placeholder="Emoji"
                    className="input input-bordered"
                  />
                  <button type="submit" className="btn btn-primary">
                    Add tile
                  </button>
                </form>
              )}

              <button type="button" onClick={savePhrase} className="btn gap-2">
                <MessageSquarePlus size={18} /> Save “{query.trim()}” as a phrase
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchView;
