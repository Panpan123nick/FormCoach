import { Check } from 'lucide-react';

// A big, easy-to-tap answer button.
// We use real <button>s (not divs) so they work with keyboards and screen readers.
// `role` is "radio" for pick-one questions and "checkbox" for pick-many.
// `index` staggers the slide-in animation so options appear one after another.
export default function OptionButton({
  label,
  selected,
  onClick,
  role = 'radio',
  tag,
  icon: Icon,
  index = 0,
}) {
  return (
    <button
      type="button"
      className={`option${selected ? ' selected' : ''}`}
      role={role}
      aria-checked={selected}
      onClick={onClick}
      style={{ '--i': index }}
    >
      <span className="option-label">
        {Icon && <Icon className="option-icon" aria-hidden="true" />}
        {label}
        {tag && <span className="tag">{tag}</span>}
      </span>
      <span className={`option-mark ${role}`} aria-hidden="true">
        <Check strokeWidth={3.5} />
      </span>
    </button>
  );
}
