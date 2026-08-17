import { useEffect, useState } from 'react';
import { Settings, Download } from 'lucide-react';
import { useTts } from '../../lib/tts/useTts';
import { useSettings } from '../../lib/aac/useSettings';
import { useBoards } from '../../lib/aac/useBoards';
import { CATEGORY_COLOR_CLASSES } from '../../lib/aac/vocabulary';
import Tile from './Tile';
import SentenceBar from './SentenceBar';
import SettingsPanel from './SettingsPanel';

function formatBytes(n) {
  if (!n) return '';
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const LoadGate = ({ status, progress, error, onLoad }) => (
  <div className="flex h-svh flex-col items-center justify-center gap-4 p-6 text-center">
    <h1 className="text-2xl font-bold">Ez AAC · KittenTTS</h1>
    <p className="max-w-xs text-base-content/70">
      This board speaks entirely on your device — nothing you type or tap ever leaves it. The first
      launch downloads the ~80MB speech model once; after that it works fully offline.
    </p>

    {status === 'loading' && (
      <div className="w-full max-w-xs">
        <progress
          className="progress progress-primary w-full"
          value={progress?.total ? progress.loaded : undefined}
          max={progress?.total || undefined}
        />
        <p className="mt-1 text-sm text-base-content/60">
          {progress?.message || 'Loading…'}
          {progress?.total ? ` (${formatBytes(progress.loaded)} / ${formatBytes(progress.total)})` : ''}
        </p>
      </div>
    )}

    {status === 'error' && <p className="max-w-xs text-error">{error}</p>}

    {status !== 'loading' && (
      <button type="button" onClick={onLoad} className="btn btn-primary gap-2">
        <Download size={18} />
        {status === 'error' ? 'Try again' : 'Load speech engine'}
      </button>
    )}
  </div>
);

const AacBoard = () => {
  const { status, progress, error, speakingId, load, speak } = useTts();
  const { voice, speed, setSpeed } = useSettings();
  const boardsApi = useBoards();
  const { activeBoard } = boardsApi;

  const [sentence, setSentence] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Jump to the new board's first goal whenever the active board changes
  // (switching boards, or the very first board load).
  useEffect(() => {
    setActiveCategoryId(activeBoard.categories[0]?.id ?? null);
  }, [activeBoard.id]);

  if (status !== 'ready') {
    return <LoadGate status={status} progress={progress} error={error} onLoad={load} />;
  }

  const category = activeBoard.categories.find((c) => c.id === activeCategoryId);

  const addWord = (word) => {
    // KittenTTS reads tone/prosody across a whole sentence, so speech only
    // ever happens once on the full sentence (via the Speak button below) —
    // never per-tile, which would produce disconnected, flat-sounding words.
    setSentence((s) => [...s, word]);
  };

  const speakSentence = () => {
    const text = sentence.map((w) => w.label).join(' ');
    speak(text, { voice, speed });
  };

  return (
    <div className="flex h-svh flex-col gap-2 p-2">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-lg font-bold">Ez AAC</h1>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
          className="btn btn-square btn-ghost btn-sm"
        >
          <Settings size={20} />
        </button>
      </div>

      <SentenceBar
        words={sentence}
        onSpeak={speakSentence}
        onBackspace={() => setSentence((s) => s.slice(0, -1))}
        onClear={() => setSentence([])}
        speaking={speakingId !== null}
      />

      <div className="flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Word categories">
        {activeBoard.categories.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={c.id === activeCategoryId}
            onClick={() => setActiveCategoryId(c.id)}
            className={`shrink-0 rounded-full border-2 px-3 py-1 text-sm font-semibold ${
              c.id === activeCategoryId ? CATEGORY_COLOR_CLASSES[c.color] : 'border-base-300 bg-base-100'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
        {!category && (
          <p className="col-span-full self-start text-base-content/50">
            This board has no goals yet — open Settings to add some.
          </p>
        )}
        {category?.words.map((word) => (
          <Tile key={word.id} word={word} color={category.color} onPress={addWord} />
        ))}
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        voice={voice}
        speed={speed}
        onSpeedChange={setSpeed}
        boardsApi={boardsApi}
      />
    </div>
  );
};

export default AacBoard;
