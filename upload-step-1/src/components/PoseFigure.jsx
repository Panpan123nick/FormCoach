import { useEffect, useRef } from 'react';

// A friendly "pose skeleton": dots for joints and lines for bones. It's the
// same idea as what the pose-tracking AI sees, so it doubles as our mascot.
//
// It can loop a squat. We blend every joint between two poses (standing and
// squatting) based on a number from 0 to 1. Pose tracking in Phase 3 works the
// same way in reverse: it reads joint positions and turns them into angles.

// Joint positions (x, y) inside a 200 x 260 box, front view.
const STAND = {
  head: [100, 38],
  neck: [100, 64],
  lShoulder: [76, 72],
  rShoulder: [124, 72],
  lElbow: [68, 108],
  rElbow: [132, 108],
  lWrist: [64, 142],
  rWrist: [136, 142],
  lHip: [86, 142],
  rHip: [114, 142],
  lKnee: [84, 192],
  rKnee: [116, 192],
  lAnkle: [82, 240],
  rAnkle: [118, 240],
};

const SQUAT = {
  head: [100, 84],
  neck: [100, 110],
  lShoulder: [76, 118],
  rShoulder: [124, 118],
  lElbow: [50, 112],
  rElbow: [150, 112],
  lWrist: [26, 106],
  rWrist: [174, 106],
  lHip: [84, 180],
  rHip: [116, 180],
  lKnee: [62, 198],
  rKnee: [138, 198],
  lAnkle: [80, 240],
  rAnkle: [120, 240],
};

const JOINTS = Object.keys(STAND);

const BONES = [
  ['neck', 'head'],
  ['lShoulder', 'rShoulder'],
  ['lShoulder', 'lElbow'],
  ['lElbow', 'lWrist'],
  ['rShoulder', 'rElbow'],
  ['rElbow', 'rWrist'],
  ['lShoulder', 'lHip'],
  ['rShoulder', 'rHip'],
  ['lHip', 'rHip'],
  ['lHip', 'lKnee'],
  ['lKnee', 'lAnkle'],
  ['rHip', 'rKnee'],
  ['rKnee', 'rAnkle'],
];

const TORSO = ['lShoulder', 'rShoulder', 'rHip', 'lHip'];

// Position of every joint when the squat is `amount` of the way down (0 to 1).
function blendPose(amount) {
  const pose = {};
  for (const joint of JOINTS) {
    const [x1, y1] = STAND[joint];
    const [x2, y2] = SQUAT[joint];
    pose[joint] = [x1 + (x2 - x1) * amount, y1 + (y2 - y1) * amount];
  }
  return pose;
}

const torsoPoints = (pose) => TORSO.map((j) => pose[j].join(',')).join(' ');

// Move the SVG shapes directly instead of re-rendering React 60 times a second.
function drawPose(svg, amount) {
  const pose = blendPose(amount);
  svg.querySelectorAll('[data-bone]').forEach((line) => {
    const [from, to] = line.dataset.bone.split('-');
    line.setAttribute('x1', pose[from][0]);
    line.setAttribute('y1', pose[from][1]);
    line.setAttribute('x2', pose[to][0]);
    line.setAttribute('y2', pose[to][1]);
  });
  svg.querySelectorAll('[data-joint]').forEach((dot) => {
    const [x, y] = pose[dot.dataset.joint];
    dot.setAttribute('cx', x);
    dot.setAttribute('cy', y);
  });
  svg.querySelector('[data-torso]').setAttribute('points', torsoPoints(pose));
  svg.querySelector('[data-face]').setAttribute('transform', `translate(${pose.head.join(' ')})`);
  svg.querySelector('[data-shadow]').setAttribute('rx', 44 + 10 * amount);
}

// `onRep(count)` (optional) is called each time the figure reaches the bottom of a squat.
export default function PoseFigure({ animate = false, seconds = 2.4, className = '', onRep }) {
  const svgRef = useRef(null);

  // Keep the latest onRep in a ref, so a new callback doesn't restart the animation.
  const onRepRef = useRef(onRep);
  useEffect(() => {
    onRepRef.current = onRep;
  }, [onRep]);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!animate || reduceMotion) return;

    let frame;
    let reps = 0;
    const start = performance.now();
    const tick = (now) => {
      const cycles = (now - start) / 1000 / seconds; // how many squats so far, e.g. 2.3
      const progress = cycles % 1;
      // Cosine wave: smoothly 0 -> 1 -> 0, slowing at the top and bottom like a real squat.
      const amount = (1 - Math.cos(progress * 2 * Math.PI)) / 2;
      drawPose(svgRef.current, amount);

      // The bottom of each squat is halfway through a cycle (0.5, 1.5, 2.5, ...).
      const bottoms = Math.floor(cycles + 0.5);
      if (bottoms > reps) {
        reps = bottoms;
        onRepRef.current?.(reps);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, seconds]);

  const pose = STAND;
  return (
    <svg
      ref={svgRef}
      className={`pose-figure ${className}`}
      viewBox="0 0 200 260"
      aria-hidden="true"
    >
      <ellipse data-shadow className="pf-shadow" cx="100" cy="248" rx="44" ry="7" />
      <polygon data-torso className="pf-torso" points={torsoPoints(pose)} />
      {BONES.map(([from, to], i) => (
        <line
          key={`${from}-${to}`}
          data-bone={`${from}-${to}`}
          className="pf-bone"
          style={{ '--i': i }}
          pathLength="1"
          x1={pose[from][0]}
          y1={pose[from][1]}
          x2={pose[to][0]}
          y2={pose[to][1]}
        />
      ))}
      {JOINTS.map((joint, i) => (
        <circle
          key={joint}
          data-joint={joint}
          className={joint === 'head' ? 'pf-head' : 'pf-joint'}
          style={{ '--i': i }}
          cx={pose[joint][0]}
          cy={pose[joint][1]}
          r={joint === 'head' ? 18 : 6.5}
        />
      ))}
      {/* A little face, drawn around (0, 0) and moved along with the head. */}
      <g data-face className="pf-face" transform={`translate(${pose.head.join(' ')})`}>
        <circle cx="-6" cy="-2" r="2.4" />
        <circle cx="6" cy="-2" r="2.4" />
        <path d="M -6 5 Q 0 10 6 5" />
      </g>
    </svg>
  );
}
