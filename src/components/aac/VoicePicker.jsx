import { useEffect } from 'react';
import { ArrowLeft, Check, Download, Loader2, Play, Square } from 'lucide-react';
import { useTts } from '../../lib/tts/useTts';
import { useSettings } from '../../lib/aac/useSettings';
import { VOICES } from '../../lib/aac/vocabulary';

const demoLine = (name) => `Hi, I'm ${name}. This is how I sound speaking a full sentence.`;

function formatBytes(n) {
  if (!n) return '';
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const VoicePicker = () => {
  const { status, progress, error, synthesizingVoice, speakingVoice, load, loadIfCached, speak, stop } = useTts();
  const { voice, setVoice } = useSettings();

  useEffect(() => {
    loadIfCached();
  }, [loadIfCached]);

  return (
    <div className="flex h-svh flex-col gap-3 overflow-y-auto p-4">
      <a href="/" className="btn btn-ghost btn-sm w-fit gap-1">
        <ArrowLeft size={16} /> Back to board
      </a>
      <h1 className="text-xl font-bold">Choose a voice</h1>
      <p className="text-sm text-base-content/60">
        Play each voice to hear a full-sentence demo, then pick the one you want the board to speak with.
      </p>

      {status !== 'ready' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
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
            <button type="button" onClick={load} className="btn btn-primary gap-2">
              <Download size={18} />
              {status === 'error' ? 'Try again' : 'Load speech engine'}
            </button>
          )}
        </div>
      )}

      {status === 'ready' && (
        <div className="grid gap-2 sm:grid-cols-2">
          {VOICES.map((v) => {
            const selected = voice === v.id;
            const synthesizing = synthesizingVoice === v.id;
            const playing = speakingVoice === v.id;
            const busy = synthesizing || playing;
            return (
              <div
                key={v.id}
                className={`flex items-center justify-between rounded-xl border-2 p-3 ${
                  selected ? 'border-primary bg-primary/5' : 'border-base-300'
                }`}
              >
                <span className="font-semibold">{v.label}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => (busy ? stop() : speak(demoLine(v.label), { voice: v.id, speed: 1 }))}
                    aria-label={
                      synthesizing
                        ? `Preparing demo for ${v.label}`
                        : playing
                          ? `Stop demo for ${v.label}`
                          : `Play demo for ${v.label}`
                    }
                    className="btn btn-square btn-sm"
                  >
                    {synthesizing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : playing ? (
                      <Square size={16} />
                    ) : (
                      <Play size={16} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoice(v.id)}
                    className={`btn btn-sm gap-1 ${selected ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {selected && <Check size={16} />}
                    {selected ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VoicePicker;
