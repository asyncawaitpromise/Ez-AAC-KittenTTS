// Runs KittenTTS inference off the main thread so tapping an AAC tile never
// stutters the UI — model loading and phoneme->waveform generation can both
// take real time on a low-end device, which is exactly the hardware this app
// is most likely to run on.
import { KittenTtsEngine } from '../lib/tts/engine.js';

const engine = new KittenTtsEngine();

self.addEventListener('message', async (event) => {
  const { type } = event.data;

  if (type === 'load') {
    try {
      const { voices, sampleRate } = await engine.load((status) => {
        self.postMessage({ type: 'status', ...status });
      });
      self.postMessage({ type: 'ready', voices, sampleRate });
    } catch (error) {
      self.postMessage({ type: 'error', error: error.message || String(error) });
    }
    return;
  }

  if (type === 'speak') {
    const { text, voice, speed, requestId } = event.data;
    try {
      const { audio, sampleRate } = await engine.generate(text, {
        voice,
        speed,
        onChunk: ({ index, total }) => self.postMessage({ type: 'progress', requestId, index, total }),
      });
      self.postMessage({ type: 'audio', requestId, audio: audio.buffer, sampleRate }, [audio.buffer]);
    } catch (error) {
      self.postMessage({ type: 'error', requestId, error: error.message || String(error) });
    }
  }
});
