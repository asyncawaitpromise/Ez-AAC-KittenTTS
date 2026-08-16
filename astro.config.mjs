// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  integrations: [
    tailwind(),
    react(),
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Ez AAC · KittenTTS',
        short_name: 'Ez AAC',
        description: 'Offline AAC communication board powered by on-device KittenTTS speech synthesis.',
        theme_color: '#18181b',
        background_color: '#18181b',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precaches the app shell plus the ONNX Runtime WASM binary (emitted
        // as a hashed static asset by Vite) so the speech *engine* works
        // offline from the first visit. The KittenTTS model/voice weights
        // (~80MB, fetched from Hugging Face at runtime) are intentionally
        // NOT part of this precache — see src/lib/tts/cache.js, which caches
        // them into Cache Storage itself after the user opts into the
        // one-time download.
        globPatterns: ['**/*.{css,js,mjs,wasm,html,svg,png,ico,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
      },
    }),
  ],
  output: 'static',
  vite: {
    // The TTS worker (src/workers/tts.worker.js) dynamically imports
    // onnxruntime-web and phonemizer, which requires ES module workers —
    // Vite's default IIFE worker format can't code-split.
    worker: {
      format: 'es',
    },
  },
});
