// Minimal in-browser reader for NumPy's .npz format (a plain ZIP of .npy
// arrays), just enough to load KittenTTS's voices.npz. Ported from the
// reference browser build since there's no npm package that does this without
// pulling in a full ZIP/numpy stack.

const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;

async function readZipEntries(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error('Could not find End of Central Directory');

  const centralDirOffset = view.getUint32(eocdOffset + 16, true);
  const entryCount = view.getUint16(eocdOffset + 10, true);

  const entries = [];
  let cursor = centralDirOffset;
  for (let i = 0; i < entryCount && view.getUint32(cursor, true) === CENTRAL_DIRECTORY_SIGNATURE; i++) {
    const compressionMethod = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const uncompressedSize = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);
    const fileName = new TextDecoder().decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
    entries.push({ fileName, compressedSize, uncompressedSize, localHeaderOffset, compressionMethod });
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  const files = new Map();
  for (const entry of entries) {
    const nameLength = view.getUint16(entry.localHeaderOffset + 26, true);
    const extraLength = view.getUint16(entry.localHeaderOffset + 28, true);
    const dataStart = entry.localHeaderOffset + 30 + nameLength + extraLength;

    let data;
    if (entry.compressionMethod === 0) {
      data = bytes.slice(dataStart, dataStart + entry.uncompressedSize);
    } else if (entry.compressionMethod === 8) {
      const compressed = bytes.slice(dataStart, dataStart + entry.compressedSize);
      const stream = new DecompressionStream('deflate-raw');
      const writer = stream.writable.getWriter();
      writer.write(compressed);
      writer.close();
      const chunks = [];
      let total = 0;
      const reader = stream.readable.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        total += value.length;
      }
      data = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.length;
      }
    } else {
      console.warn(`Skipping ${entry.fileName}: unsupported ZIP compression method ${entry.compressionMethod}`);
      continue;
    }
    files.set(entry.fileName, data);
  }
  return files;
}

function parseNpyHeader(bytes) {
  if (bytes[0] !== 0x93 || String.fromCharCode(bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]) !== 'NUMPY') {
    throw new Error('Not a valid .npy file');
  }
  const majorVersion = bytes[6];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let headerLength, headerStart;
  if (majorVersion === 1) {
    headerLength = view.getUint16(8, true);
    headerStart = 10;
  } else {
    headerLength = view.getUint32(8, true);
    headerStart = 12;
  }
  const header = new TextDecoder().decode(bytes.slice(headerStart, headerStart + headerLength));
  const descrMatch = header.match(/'descr'\s*:\s*'([^']+)'/);
  const shapeMatch = header.match(/'shape'\s*:\s*\(([^)]*)\)/);
  if (!descrMatch) throw new Error(`Could not parse dtype from .npy header: ${header}`);
  const shape = shapeMatch
    ? shapeMatch[1].split(',').map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n))
    : [];
  return { descr: descrMatch[1], shape, dataOffset: headerStart + headerLength };
}

function parseNpy(bytes) {
  const { descr, shape, dataOffset } = parseNpyHeader(bytes);
  const payload = bytes.slice(dataOffset);
  const buffer = new ArrayBuffer(payload.length);
  new Uint8Array(buffer).set(payload);

  let data;
  if (descr === '<f4' || descr === 'float32') {
    data = new Float32Array(buffer);
  } else if (descr === '<f8' || descr === 'float64') {
    const doubles = new Float64Array(buffer);
    data = new Float32Array(doubles.length);
    for (let i = 0; i < doubles.length; i++) data[i] = doubles[i];
  } else {
    throw new Error(`Unsupported .npy dtype: ${descr}`);
  }
  return { data, shape };
}

// Returns { [voiceKey]: { data: Float32Array, shape: [rows, styleDim] } }
export async function loadVoiceEmbeddings(arrayBuffer) {
  const zipEntries = await readZipEntries(arrayBuffer);
  const voices = {};
  for (const [fileName, fileBytes] of zipEntries) {
    if (!fileName.endsWith('.npy')) continue;
    const voiceKey = fileName.replace(/\.npy$/, '');
    const { data, shape } = parseNpy(fileBytes);
    voices[voiceKey] = { data, shape: [shape[0] || 1, shape[1] || data.length] };
  }
  return voices;
}
