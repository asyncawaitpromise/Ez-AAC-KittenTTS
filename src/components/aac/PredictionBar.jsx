// Horizontal strip of word predictions shown above/below the sentence bar.
// Each chip is a one-tap way to append the next word, reducing the taps
// needed to build a sentence.
const PredictionBar = ({ suggestions, onPick }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div role="group" aria-label="Word predictions">
      <div className="flex gap-1 overflow-x-auto py-1">
        {suggestions.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => onPick(label)}
            aria-label={label}
            className="shrink-0 rounded-full border-2 border-primary/40 bg-base-100 px-3 py-1 text-sm font-medium hover:bg-primary/10"
          >
            <span className="text-base-content/40" aria-hidden="true">
              +
            </span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PredictionBar;
