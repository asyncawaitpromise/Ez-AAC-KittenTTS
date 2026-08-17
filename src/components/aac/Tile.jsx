import { CATEGORY_COLOR_CLASSES } from '../../lib/aac/vocabulary';

// Large, high-contrast, single-purpose button — the core interaction unit of
// an AAC board. Touch target is well above the 44px accessibility minimum
// since these are used by people with limited fine motor control.
const Tile = ({ word, color, onPress, disabled }) => (
  <button
    type="button"
    onClick={() => onPress(word)}
    disabled={disabled}
    aria-label={word.label}
    className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2 aspect-square text-center transition-transform active:scale-95 disabled:opacity-40 disabled:active:scale-100 ${CATEGORY_COLOR_CLASSES[color] ?? 'border-base-300 bg-base-100'}`}
  >
    <span className="text-3xl leading-none" aria-hidden="true">
      {word.emoji}
    </span>
    <span className="text-sm font-semibold leading-tight">{word.label}</span>
  </button>
);

export default Tile;
