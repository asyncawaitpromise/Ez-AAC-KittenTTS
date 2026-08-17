import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadHistory, saveHistory, recordSentence } from './history';
import { buildModel, predict } from './predictor';

export function usePrediction({ phrases, candidateWords, sentence }) {
  const [history, setHistory] = useState(loadHistory);

  useEffect(() => saveHistory(history), [history]);

  const model = useMemo(
    () => buildModel([...history, ...phrases.map((p) => p.text)]),
    [history, phrases]
  );

  const suggestions = useMemo(
    () => predict(model, sentence.map((w) => w.label), candidateWords, 6),
    [model, sentence, candidateWords]
  );

  const record = useCallback((text) => setHistory((h) => recordSentence(h, text)), []);

  return { suggestions, record };
}
