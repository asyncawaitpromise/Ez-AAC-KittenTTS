import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

// Quick phrases: whole pre-built sentences a tap inserts into the sentence
// bar in one go, instead of building them word-by-word from the board.
const PhrasesView = ({ phrases, onAddPhrase, onRemovePhrase, onUsePhrase }) => {
  const [text, setText] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddPhrase(text.trim());
    setText('');
  };

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="New phrase, e.g. I need a break"
          className="input input-bordered flex-1"
        />
        <button type="submit" className="btn btn-square btn-primary" aria-label="Save phrase">
          <Plus size={18} />
        </button>
      </form>

      {phrases.length === 0 ? (
        <p className="flex-1 self-start text-base-content/50">
          No saved phrases yet — type one above to get started.
        </p>
      ) : (
        <div className="grid flex-1 content-start grid-cols-2 gap-2 sm:grid-cols-3">
          {phrases.map((p) => (
            <div
              key={p.id}
              className="flex items-center rounded-2xl border-2 border-base-300 bg-base-100"
            >
              <button
                type="button"
                onClick={() => onUsePhrase(p)}
                className="flex-1 truncate px-3 py-4 text-left font-semibold"
              >
                {p.text}
              </button>
              <button
                type="button"
                onClick={() => onRemovePhrase(p.id)}
                aria-label={`Delete phrase: ${p.text}`}
                className="btn btn-square btn-ghost btn-sm mr-1 text-base-content/50 hover:text-error"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhrasesView;
