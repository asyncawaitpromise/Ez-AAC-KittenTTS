import { useCallback, useEffect, useState } from 'react';
import * as store from './recents';

export function useRecents() {
  const [recents, setRecents] = useState(store.loadRecents);

  useEffect(() => store.saveRecents(recents), [recents]);

  const addRecent = useCallback((item) => setRecents((r) => store.addRecent(r, item)), []);

  return { recents, addRecent };
}
