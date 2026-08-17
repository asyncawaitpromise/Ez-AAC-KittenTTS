import { useEffect, useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import BoardEditorView from './BoardEditorView';

const SettingsPanel = ({ open, onClose, voice, speed, onSpeedChange, speakOnTap, onSpeakOnTapChange, boardsApi }) => {
  const [view, setView] = useState('root');

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setView('root');
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const close = () => {
    setView('root');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="w-full max-w-sm rounded-t-2xl bg-base-100 p-4 sm:rounded-2xl"
      >
        {view === 'root' ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Settings</h2>
              <button type="button" onClick={close} className="btn btn-square btn-ghost btn-sm" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <a href="/voices" className="mb-3 flex items-center justify-between rounded-xl border-2 border-base-300 p-3">
              <div>
                <div className="text-sm text-base-content/60">Voice</div>
                <div className="font-semibold">{voice}</div>
              </div>
              <ChevronRight size={20} />
            </a>

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium">Speed: {speed.toFixed(2)}x</span>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={speed}
                onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                className="range range-primary"
              />
            </label>

            <label className="mb-3 flex items-center justify-between rounded-xl border-2 border-base-300 p-3">
              <span className="text-sm font-medium">Speak each tile on tap</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={speakOnTap}
                onChange={(e) => onSpeakOnTapChange(e.target.checked)}
              />
            </label>

            <button
              type="button"
              onClick={() => setView('boards')}
              className="flex w-full items-center justify-between rounded-xl border-2 border-base-300 p-3"
            >
              <div>
                <div className="text-sm text-base-content/60">Board</div>
                <div className="font-semibold">{boardsApi.activeBoard.name}</div>
              </div>
              <ChevronRight size={20} />
            </button>
          </>
        ) : (
          <BoardEditorView boardsApi={boardsApi} onBack={() => setView('root')} />
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
