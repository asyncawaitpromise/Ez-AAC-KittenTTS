// Persists KittenTTS's model + voice files in the browser's Cache Storage so
// the ~80MB download only ever happens once per device — after that, this AAC
// board has to work with no network at all. Cache Storage (not IndexedDB) is
// used because it's built to hold Response bodies and is what the PWA's own
// service worker already relies on for the same offline guarantee.
const CACHE_NAME = 'kitten-tts-assets-v1';

export const MODEL_BASE_URL =
  'https://huggingface.co/onnx-community/KittenTTS-Mini-v0.8-ONNX/resolve/main';

// Every asset the engine downloads before it can speak. Used to tell whether
// the model is already on-device so first launch can avoid downloading the
// ~80MB model without an explicit tap.
const TTS_ASSET_PATHS = ['kitten_config.json', 'onnx/model.onnx', 'voices.npz'];

export async function isTtsCached() {
  const cache = await caches.open(CACHE_NAME);
  const urls = new Set((await cache.keys()).map((r) => r.url));
  return TTS_ASSET_PATHS.every((p) => urls.has(`${MODEL_BASE_URL}/${p}`));
}

export async function cachedFetchWithProgress(url, onProgress) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(url);
  if (cached) {
    onProgress?.({ loaded: 1, total: 1, cached: true });
    return cached;
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);

  const total = parseInt(response.headers.get('content-length') || '0', 10);
  if (!response.body || !total) {
    const buffered = await response.arrayBuffer();
    await cache.put(url, new Response(buffered, { headers: response.headers }));
    onProgress?.({ loaded: buffered.byteLength, total: buffered.byteLength, cached: false });
    return cache.match(url);
  }

  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress?.({ loaded, total, cached: false });
  }
  const merged = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  await cache.put(url, new Response(merged, { headers: response.headers }));
  return cache.match(url);
}

export async function clearTtsCache() {
  await caches.delete(CACHE_NAME);
}
