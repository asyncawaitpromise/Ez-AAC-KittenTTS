import { useCallback, useEffect, useRef, useState } from 'react';

let requestCounter = 0;

// Bridges the AAC UI to the TTS web worker: owns the worker's lifecycle, the
// load/ready state machine, and turning returned PCM into audible sound via
// the Web Audio API. The engine itself never touches React or the DOM.
export function useTts() {
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [progress, setProgress] = useState(null);
  const [voices, setVoices] = useState([]);
  const [error, setError] = useState(null);
  // Keyed by voice id (not a request counter) so callers can tell which
  // specific voice is mid-synthesis vs. actually playing audio.
  const [synthesizingVoice, setSynthesizingVoice] = useState(null);
  const [speakingVoice, setSpeakingVoice] = useState(null);

  const workerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const pendingRef = useRef(new Map());
  // requestId of the in-flight/playing speak() call; lets stale responses
  // from a superseded request (e.g. user hit Play on another voice) no-op.
  const activeRequestRef = useRef(null);

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../../workers/tts.worker.js', import.meta.url), {
        type: 'module',
      });
      workerRef.current.addEventListener('message', (event) => {
        const msg = event.data;
        if (msg.type === 'status') {
          setProgress(msg);
        } else if (msg.type === 'ready') {
          setVoices(msg.voices);
          setStatus('ready');
          setProgress(null);
        } else if (msg.type === 'progress') {
          pendingRef.current.get(msg.requestId)?.onProgress?.(msg);
        } else if (msg.type === 'audio') {
          pendingRef.current.get(msg.requestId)?.resolve(msg);
          pendingRef.current.delete(msg.requestId);
        } else if (msg.type === 'error') {
          if (msg.requestId && pendingRef.current.has(msg.requestId)) {
            pendingRef.current.get(msg.requestId).reject(new Error(msg.error));
            pendingRef.current.delete(msg.requestId);
          } else {
            setStatus('error');
            setError(msg.error);
          }
        }
      });
    }
    return workerRef.current;
  }, []);

  const load = useCallback(() => {
    if (status === 'loading' || status === 'ready') return;
    setStatus('loading');
    setError(null);
    getWorker().postMessage({ type: 'load' });
  }, [getWorker, status]);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const stop = useCallback(() => {
    activeRequestRef.current = null;
    sourceRef.current?.stop();
    sourceRef.current = null;
    setSynthesizingVoice(null);
    setSpeakingVoice(null);
  }, []);

  const speak = useCallback(
    async (text, { voice, speed = 1 } = {}) => {
      if (status !== 'ready' || !text.trim()) return;
      const requestId = ++requestCounter;
      stop();
      activeRequestRef.current = requestId;
      setSynthesizingVoice(voice);

      try {
        const { audio, sampleRate } = await new Promise((resolve, reject) => {
          pendingRef.current.set(requestId, { resolve, reject });
          getWorker().postMessage({ type: 'speak', requestId, text, voice, speed });
        });

        // A newer speak() call (or stop()) superseded this one while it was
        // synthesizing — drop the now-stale result instead of playing it.
        if (activeRequestRef.current !== requestId) return;

        const pcm = new Float32Array(audio);
        const ctx = getAudioContext();
        const buffer = ctx.createBuffer(1, pcm.length, sampleRate);
        buffer.copyToChannel(pcm, 0);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => {
          if (activeRequestRef.current === requestId) {
            activeRequestRef.current = null;
            setSpeakingVoice(null);
          }
        };
        sourceRef.current = source;
        setSynthesizingVoice(null);
        setSpeakingVoice(voice);
        source.start();
      } catch (err) {
        if (activeRequestRef.current === requestId) {
          activeRequestRef.current = null;
          setSynthesizingVoice(null);
        }
        throw err;
      }
    },
    [status, getWorker, getAudioContext, stop]
  );

  useEffect(() => () => workerRef.current?.terminate(), []);

  return { status, progress, voices, error, synthesizingVoice, speakingVoice, load, speak, stop };
}
