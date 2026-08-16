// KittenTTS's phoneme vocabulary and text-processing pipeline, ported from the
// reference browser build (huggingworld/offline-kittentts-0.8-webgpu) so the
// tokenizer stays byte-for-byte compatible with the ONNX graph's embedding table.
// vocab.json was extracted programmatically from that build, not retyped, since
// it contains IPA symbols and combining marks that are easy to mistranscribe.
import VOCAB_CHARS from './vocab.json';

const CHAR_TO_ID = new Map(VOCAB_CHARS.map((ch, id) => [ch, id]));

// Splits into sentence-ish chunks capped at maxLen chars so a single inference
// call never processes an unbounded amount of text (long AAC utterances are rare,
// but a pasted paragraph shouldn't stall the worker on one giant tensor).
export function chunkText(text, maxLen = 400) {
  const sentences = text.match(/[^.!?]*[.!?]+|[^.!?]+$/g) || [text];
  const chunks = [];
  for (let sentence of sentences) {
    sentence = sentence.trim();
    if (!sentence) continue;
    if (sentence.length <= maxLen) {
      chunks.push(ensureTerminalPunctuation(sentence));
      continue;
    }
    const words = sentence.split(/\s+/);
    let current = '';
    for (const word of words) {
      if (current.length + word.length + 1 <= maxLen) {
        current += (current ? ' ' : '') + word;
      } else {
        if (current) chunks.push(ensureTerminalPunctuation(current));
        current = word;
      }
    }
    if (current) chunks.push(ensureTerminalPunctuation(current));
  }
  return chunks;
}

function ensureTerminalPunctuation(sentence) {
  sentence = sentence.trim();
  if (sentence && !'.!?,;:'.includes(sentence[sentence.length - 1])) {
    sentence += '.';
  }
  return sentence;
}

function wordTokenize(text) {
  return text.match(/[\p{L}\p{N}_]+|[^\p{L}\p{N}_\s]/gu) || [];
}

function charsToIds(text) {
  const ids = [];
  for (const ch of text) {
    const id = CHAR_TO_ID.get(ch);
    if (id !== undefined) ids.push(id);
  }
  return ids;
}

// Wraps the phoneme token stream with the model's boundary tokens: id 0 ("$")
// on both ends, plus id 10 (the trained end-of-utterance marker) before the
// closing "$". Order matters — the model was trained on exactly this framing.
function withBoundaryTokens(phonemeIds) {
  return [0, ...phonemeIds, 10, 0];
}

// Splits punctuation runs out from the words around them so the phonemizer
// (which only understands words) never sees raw punctuation, then re-joins
// everything and re-tokenizes at the character level for the model's vocab.
const PUNCTUATION_RUN = /(\s*[;:,.!?¡¿—…"«»""()[\]{}]+\s*)+/g;

export async function textToTokenIds(text, phonemize) {
  const segments = [];
  let cursor = 0;
  for (const match of text.matchAll(PUNCTUATION_RUN)) {
    if (cursor < match.index) {
      segments.push({ punctuation: false, text: text.slice(cursor, match.index) });
    }
    segments.push({ punctuation: true, text: match[0] });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) {
    segments.push({ punctuation: false, text: text.slice(cursor) });
  }

  const rendered = await Promise.all(
    segments.map(async (segment) => {
      if (segment.punctuation) return segment.text;
      const phonemes = await phonemize(segment.text, 'en-us');
      return phonemes.join(' ');
    })
  );

  const phonemeText = wordTokenize(rendered.join('')).join(' ');
  return withBoundaryTokens(charsToIds(phonemeText));
}
