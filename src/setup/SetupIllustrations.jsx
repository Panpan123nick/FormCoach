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

// A laptop seen from the side: its screen tilts back so the camera (red dot)
// can see the floor, shown by the dashed "view" lines.
export function PlaceLaptop() {
  return (
    <div className="illus">
      <svg className="illus-laptop" viewBox="0 0 240 180" aria-hidden="true">
        <line className="illus-table" x1="70" y1="151" x2="236" y2="151" />
        <line className="illus-table" x1="90" y1="151" x2="90" y2="178" />
        <line className="illus-table" x1="216" y1="151" x2="216" y2="178" />
        <rect className="illus-laptop-base" x="104" y="140" width="96" height="10" rx="3" />
        <g className="illus-laptop-lid">
          <line className="illus-view" x1="104" y1="52" x2="2" y2="176" />
          <line className="illus-view" x1="104" y1="52" x2="2" y2="40" />
          <rect className="illus-laptop-screen" x="104" y="44" width="9" height="100" rx="3" />
          <circle className="illus-camera" cx="104" cy="54" r="5" />
        </g>
      </svg>
      <div className="illus-laptop-person">
        <PoseFigure />
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
