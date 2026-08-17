import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'ez-aac-settings-v1';
const DEFAULTS = { voice: 'Bella', speed: 1, speakOnTap: false };

function read() {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      voice: typeof parsed.voice === 'string' ? parsed.voice : DEFAULTS.voice,
      speed: typeof parsed.speed === 'number' && Number.isFinite(parsed.speed) ? parsed.speed : DEFAULTS.speed,
      speakOnTap: typeof parsed.speakOnTap === 'boolean' ? parsed.speakOnTap : DEFAULTS.speakOnTap,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

// Shared voice + speed prefs, persisted to localStorage so a choice made on
// the /voices demo page is what the main board actually speaks with.
export function useSettings() {
  const [settings, setSettings] = useState(read);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // localStorage can throw in private/Safari or on quota errors — the
      // setting just won't persist, but the app keeps working.
    }
  }, [settings]);

  const setVoice = useCallback((voice) => setSettings((s) => ({ ...s, voice })), []);
  const setSpeed = useCallback((speed) => setSettings((s) => ({ ...s, speed })), []);
  const setSpeakOnTap = useCallback((speakOnTap) => setSettings((s) => ({ ...s, speakOnTap })), []);

  return { ...settings, setVoice, setSpeed, setSpeakOnTap };
}
