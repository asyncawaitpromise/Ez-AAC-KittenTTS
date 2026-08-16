// KittenTTS Mini v0.8 inference, running fully client-side via ONNX Runtime
// Web (WASM backend). Ported from the reference browser build at
// huggingworld/offline-kittentts-0.8-webgpu, which is the only known-working
// browser port of this exact model/format (KittenTTS 0.8 ships as "ONNX2",
// not yet supported by most ONNX tooling — see k2-fsa/sherpa-onnx#3196).
//
// Model card: https://huggingface.co/onnx-community/KittenTTS-Mini-v0.8-ONNX
// Base model: https://huggingface.co/KittenML/kitten-tts-mini-0.8 (StyleTTS 2, 80M params)
import { cachedFetchWithProgress } from './cache.js';
import { loadVoiceEmbeddings } from './npz.js';
import { chunkText, textToTokenIds } from './tokenizer.js';

const MODEL_BASE_URL = 'https://huggingface.co/onnx-community/KittenTTS-Mini-v0.8-ONNX/resolve/main';
const SAMPLE_RATE = 24000;

export class KittenTtsEngine {
  #session = null;
  #config = null;
  #voiceEmbeddings = {};
  #phonemize = null;

  get voices() {
    if (!this.#config) return [];
    return this.#config.voice_aliases
      ? Object.keys(this.#config.voice_aliases)
      : Object.keys(this.#voiceEmbeddings);
  }

  async load(onStatus) {
    onStatus?.({ phase: 'runtime', message: 'Loading speech runtime…' });
    const [ort, phonemizerModule] = await Promise.all([
      import('onnxruntime-web/wasm'),
      import('phonemizer'),
    ]);
    this.#phonemize = phonemizerModule.phonemize;
    // Single-threaded WASM avoids requiring cross-origin-isolation headers
    // (SharedArrayBuffer) that a static host may not send.
    ort.env.wasm.numThreads = 1;

    onStatus?.({ phase: 'config', message: 'Loading voice config…' });
    const configResponse = await cachedFetchWithProgress(`${MODEL_BASE_URL}/kitten_config.json`);
    this.#config = await configResponse.json();

    const modelBytesPromise = cachedFetchWithProgress(
      `${MODEL_BASE_URL}/onnx/model.onnx`,
      ({ loaded, total, cached }) =>
        onStatus?.({
          phase: 'model',
          message: cached ? 'Loading model from cache…' : 'Downloading speech model…',
          loaded,
          total,
        })
    ).then((r) => r.arrayBuffer());

    const voicesPromise = cachedFetchWithProgress(
      `${MODEL_BASE_URL}/voices.npz`,
      ({ loaded, total, cached }) =>
        onStatus?.({
          phase: 'voices',
          message: cached ? 'Loading voices from cache…' : 'Downloading voices…',
          loaded,
          total,
        })
    ).then((r) => r.arrayBuffer());

    const [modelBytes, voicesBytes] = await Promise.all([modelBytesPromise, voicesPromise]);
    this.#voiceEmbeddings = await loadVoiceEmbeddings(voicesBytes);

    onStatus?.({ phase: 'session', message: 'Starting speech engine…' });
    this.#session = await ort.InferenceSession.create(modelBytes, {
      executionProviders: ['wasm'],
    });

    onStatus?.({ phase: 'ready', message: 'Ready' });
    return { voices: this.voices, sampleRate: SAMPLE_RATE };
  }

  async generate(text, { voice, speed = 1, onChunk } = {}) {
    if (!this.#session || !this.#config) throw new Error('Engine not loaded yet');

    const voiceKey = this.#config.voice_aliases?.[voice] ?? voice;
    const embedding = this.#voiceEmbeddings[voiceKey];
    if (!embedding) throw new Error(`Unknown voice "${voice}"`);

    const effectiveSpeed = speed * (this.#config.speed_priors?.[voiceKey] ?? 1);

    const chunks = chunkText(text);
    const waveforms = [];
    for (let i = 0; i < chunks.length; i++) {
      const waveform = await this.#generateChunk(chunks[i], embedding, effectiveSpeed);
      waveforms.push(waveform);
      onChunk?.({ index: i, total: chunks.length });
    }

    const totalLength = waveforms.reduce((sum, w) => sum + w.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const waveform of waveforms) {
      merged.set(waveform, offset);
      offset += waveform.length;
    }
    return { audio: merged, sampleRate: SAMPLE_RATE };
  }

  async #generateChunk(text, embedding, speed) {
    const ort = await import('onnxruntime-web/wasm');
    const tokenIds = await textToTokenIds(text, this.#phonemize);

    // The model was trained with a style vector selected by row = original
    // (pre-phonemization) character count of the chunk, clamped to the
    // embedding table's row count — not a fixed "one style per voice" vector.
    const [rowCount, styleDim] = embedding.shape;
    const row = Math.min(text.length, rowCount - 1);
    const style = embedding.data.slice(row * styleDim, (row + 1) * styleDim);

    const inputs = {
      input_ids: new ort.Tensor('int64', BigInt64Array.from(tokenIds.map(BigInt)), [1, tokenIds.length]),
      style: new ort.Tensor('float32', style, [1, styleDim]),
      speed: new ort.Tensor('float32', new Float32Array([speed]), [1]),
    };

    const results = await this.#session.run(inputs);
    const output = results[this.#session.outputNames[0]].data;

    if (output.length > 0 && Number.isNaN(output[0])) {
      console.warn('[KittenTTS] Model produced NaN audio for this WASM session.');
    }
    // The graph appends a short trailing artifact past ~1s of audio; the
    // reference build trims it unconditionally once the chunk is long enough.
    return output.length > SAMPLE_RATE ? output.slice(0, output.length - 5000) : output;
  }
}
