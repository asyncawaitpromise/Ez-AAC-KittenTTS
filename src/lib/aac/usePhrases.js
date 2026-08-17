import { useCallback, useEffect, useState } from 'react';
import * as store from './phrases';

export function usePhrases() {
  const [phrases, setPhrases] = useState(store.loadPhrases);

  useEffect(() => store.savePhrases(phrases), [phrases]);

  const addPhrase = useCallback((text) => setPhrases((p) => store.addPhrase(p, text)), []);
  const removePhrase = useCallback((id) => setPhrases((p) => store.removePhrase(p, id)), []);

  return { phrases, addPhrase, removePhrase };
}
