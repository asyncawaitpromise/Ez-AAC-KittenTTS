import { X } from 'lucide-react';
import { VOICES } from '../../lib/aac/vocabulary';

const VoiceSettings = ({ open, onClose, voice, onVoiceChange, speed, onSpeedChange, availableVoices }) => {
  if (!open) return null;
  const knownIds = new Set(availableVoices);
  const options = VOICES.filter((v) => knownIds.size === 0 || knownIds.has(v.id));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-base-100 p-4 sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Voice settings</h2>
          <button type="button" onClick={onClose} className="btn btn-square btn-ghost btn-sm" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium">Voice</span>
          <select
            className="select select-bordered w-full"
            value={voice}
            onChange={(e) => onVoiceChange(e.target.value)}
          >
            {options.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
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
      </div>
    </div>
  );
};

export default VoiceSettings;
