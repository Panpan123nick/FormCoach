import PoseFigure from '../components/PoseFigure.jsx';

// One small looping animation for each setup step, drawn in the poster style.
// The motion is all CSS (see setup.css); these just lay out the pieces.

// A phone that turns from upright to sideways, with a curved arrow.
export function RotatePhone() {
  return (
    <div className="illus">
      <svg className="illus-arrow" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M 30 25 A 45 45 0 0 1 100 55" />
        <path d="M 92 42 L 100 55 L 86 58" />
      </svg>
      <div className="illus-phone rotating">
        <div className="illus-phone-screen">
          <PoseFigure />
        </div>
      </div>
    </div>
  );
}

// The view through the phone: the mascot starts too close (cut off), then
// "steps back" until its whole body fits in the frame.
export function StepBack() {
  return (
    <div className="illus">
      <div className="illus-frame">
        <div className="illus-stepback">
          <PoseFigure />
        </div>
        <span className="illus-frame-corner tl" />
        <span className="illus-frame-corner tr" />
        <span className="illus-frame-corner bl" />
        <span className="illus-frame-corner br" />
      </div>
    </div>
  );
}

// The mascot squatting inside a dashed "safe space" ring that keeps clearing outward.
export function ClearSpace() {
  return (
    <div className="illus">
      <div className="illus-space">
        <span className="illus-ring" />
        <span className="illus-ring delayed" />
        <div className="illus-space-figure">
          <PoseFigure animate />
        </div>
      </div>
    </div>
  );
}
