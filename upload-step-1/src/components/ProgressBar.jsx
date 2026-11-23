// Survey progress as a row of tick boxes, one per question; finished ones are filled in.
// role="progressbar" + aria values let screen readers announce progress too.
export default function ProgressBar({ current, total, label }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={label}
      style={{ '--total': total }}
    >
      {Array.from({ length: total }, (_, i) => {
        const filled = i < current;
        const isCurrent = i === current - 1;
        return (
          <span
            key={i}
            className={`progress-seg${filled ? ' filled' : ''}${isCurrent ? ' current' : ''}`}
          />
        );
      })}
    </div>
  );
}
