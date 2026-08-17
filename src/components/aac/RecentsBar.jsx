import { Clock } from 'lucide-react';

export default function RecentsBar({ recents, onPick }) {
  if (!recents || recents.length === 0) return null;

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-1">
      <Clock size={16} className="shrink-0 text-base-content/40" aria-hidden="true" />
      {recents.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onPick(item)}
          aria-label={item.label}
          className="shrink-0 rounded-full border border-base-300 bg-base-100 px-3 py-1 text-sm font-medium hover:bg-base-200"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
