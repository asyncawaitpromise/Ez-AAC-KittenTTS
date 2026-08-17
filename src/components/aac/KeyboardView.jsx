import { useState } from 'react';
import { CornerDownLeft } from 'lucide-react';

// Free-text entry: anything typed here gets appended to the sentence bar as
// its own chip, so it can be combined with board tiles and phrases before
// speaking — same single whole-sentence speak flow as the rest of the app.
const KeyboardView = ({ onAddText }) => {
  const [text, setText] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddText(text.trim());
    setText('');
  };

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type anything to add it to your sentence…"
        className="textarea textarea-bordered flex-1 resize-none text-lg"
        autoFocus
      />
      <button type="submit" disabled={!text.trim()} className="btn btn-primary gap-2">
        <CornerDownLeft size={18} /> Add to sentence
      </button>
    </form>
  );
};

export default KeyboardView;
