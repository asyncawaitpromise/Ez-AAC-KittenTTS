import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'ez-aac-settings-v1';
const DEFAULTS = { voice: 'Bella', speed: 1 };

function read() {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

// Shared voice + speed prefs, persisted to localStorage so a choice made on
// the /voices demo page is what the main board actually speaks with.
export function useSettings() {
  const [settings, setSettings] = useState(read);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setVoice = useCallback((voice) => setSettings((s) => ({ ...s, voice })), []);
  const setSpeed = useCallback((speed) => setSettings((s) => ({ ...s, speed })), []);

  return { ...settings, setVoice, setSpeed };
}
