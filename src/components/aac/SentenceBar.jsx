import { Volume2, Delete, Trash2, Loader2, Square } from 'lucide-react';

const SentenceBar = ({ words, onSpeak, onBackspace, onClear, synthesizing, speaking, disabled }) => (
  <div className="flex flex-col gap-2 rounded-2xl border-2 border-base-300 bg-base-100 p-2">
    <div
      className="flex min-h-[5rem] flex-1 flex-wrap content-start items-start gap-1 overflow-y-auto px-2"
      aria-live="polite"
      aria-label="Sentence being built"
    >
      {words.length === 0 ? (
        <span className="text-base-content/40">Tap words to build a sentence…</span>
      ) : (
        words.map((word, i) => (
          <span key={`${word.id}-${i}`} className="rounded-lg bg-base-200 px-2 py-1 text-lg font-medium">
            {word.label}
          </span>
        ))
      )}
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onBackspace}
        disabled={disabled || words.length === 0}
        aria-label="Remove last word"
        className="btn btn-square btn-ghost"
      >
        <Delete size={22} />
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={disabled || words.length === 0}
        aria-label="Clear sentence"
        className="btn btn-square btn-ghost"
      >
        <Trash2 size={22} />
      </button>
      <button
        type="button"
        onClick={onSpeak}
        disabled={disabled || words.length === 0}
        aria-label={synthesizing ? 'Generating speech…' : speaking ? 'Speaking…' : 'Speak sentence'}
        className={`btn btn-primary btn-lg flex-1 gap-2 ${speaking ? 'animate-pulse' : ''}`}
      >
        {synthesizing ? (
          <Loader2 size={22} className="animate-spin" />
        ) : speaking ? (
          <Square size={22} />
        ) : (
          <Volume2 size={22} />
        )}
        Speak
      </button>
    </div>
  </div>
);

export default SentenceBar;
