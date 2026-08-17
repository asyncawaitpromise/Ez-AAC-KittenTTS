// Pure, offline n-gram word predictor. Works entirely on in-memory Maps and
// has no DOM or localStorage access, so it can be built and run anywhere
// (browser or server) and unit-tested without a window.
export function buildModel(sentences) {
  const unigram = new Map();
  const bigram = new Map();

  for (const sentence of sentences) {
    if (typeof sentence !== 'string') continue;
    const tokens = sentence.toLowerCase().split(/\s+/).filter(Boolean);
    let prev = null;
    for (const token of tokens) {
      unigram.set(token, (unigram.get(token) || 0) + 1);
      if (prev !== null) {
        let pairs = bigram.get(prev);
        if (!pairs) {
          pairs = new Map();
          bigram.set(prev, pairs);
        }
        pairs.set(token, (pairs.get(token) || 0) + 1);
      }
      prev = token;
    }
  }

  return { unigram, bigram };
}

export function predict(model, context, candidates, topN = 6) {
  // Single token -> original candidate label. Multi-word candidates ("thank
  // you") are indexed by each of their tokens so they can still be predicted
  // from a single-token bigram/unigram (first candidate wins a token tie).
  const allowed = new Map();
  for (const candidate of candidates) {
    const original = String(candidate);
    const tokens = original.toLowerCase().split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      if (!allowed.has(token)) allowed.set(token, original);
    }
  }

  const { unigram, bigram } = model;
  // Context is a list of sentence chips whose labels may be multi-word; use
  // only the final token of the final chip to drive the bigram.
  const lastChip = context.length ? String(context[context.length - 1]) : '';
  const prev = lastChip.toLowerCase().split(/\s+/).filter(Boolean).pop() || '';

  const ranked = [];
  const seen = new Set();
  const push = (token) => {
    if (seen.has(token)) return;
    seen.add(token);
    ranked.push(token);
  };

  const byUnigram = (a, b) =>
    (unigram.get(b) || 0) - (unigram.get(a) || 0) || (a < b ? -1 : a > b ? 1 : 0);

  if (prev) {
    const pairs = bigram.get(prev);
    if (pairs) {
      const bigramRanked = [];
      for (const [token, count] of pairs) {
        if (token === prev || !allowed.has(token)) continue;
        bigramRanked.push({ token, count });
      }
      bigramRanked.sort(
        (a, b) => b.count - a.count || byUnigram(a.token, b.token)
      );
      for (const { token } of bigramRanked) {
        if (ranked.length >= topN) break;
        push(token);
      }
    }

    if (ranked.length < topN) {
      const remaining = [...allowed.keys()]
        .filter((token) => token !== prev && !seen.has(token))
        .sort(byUnigram);
      for (const token of remaining) {
        if (ranked.length >= topN) break;
        push(token);
      }
    }
  } else {
    const remaining = [...allowed.keys()].sort(byUnigram);
    for (const token of remaining) {
      if (ranked.length >= topN) break;
      push(token);
    }
  }

  // Dedupe by the resolved original label (multiple tokens of a multi-word
  // candidate can otherwise map to the same label and appear twice).
  const result = [];
  const seenOriginal = new Set();
  for (const token of ranked) {
    const original = allowed.get(token);
    if (original && !seenOriginal.has(original)) {
      seenOriginal.add(original);
      result.push(original);
    }
  }
  return result;
}
