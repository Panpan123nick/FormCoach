// Geometry helpers for turning landmark positions into joint angles.
import { LANDMARK as L } from './landmarks.js';

/**
 * The angle at point b (in degrees, 0 to 180) formed by a–b–c.
 * Example: angleAt(shoulder, elbow, wrist) is the elbow bend:
 * about 180 with a straight arm, about 90 at the bottom of a push-up.
 */
export function angleAt(a, b, c) {
  const ab = Math.atan2(a.y - b.y, a.x - b.x);
  const cb = Math.atan2(c.y - b.y, c.x - b.x);
  let degrees = Math.abs(((ab - cb) * 180) / Math.PI);
  if (degrees > 180) degrees = 360 - degrees;
  return degrees;
}

/** How far the line from a to b tilts away from horizontal (0 = flat, 90 = upright). */
export function tiltFromHorizontal(a, b) {
  const degrees = Math.abs((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI);
  return degrees > 90 ? 180 - degrees : degrees;
}

// The landmarks for each side of the body, so exercise code can say
// side.knee instead of choosing between LEFT_KNEE and RIGHT_KNEE.
const SIDES = {
  left: {
    shoulder: L.LEFT_SHOULDER,
    elbow: L.LEFT_ELBOW,
    wrist: L.LEFT_WRIST,
    hip: L.LEFT_HIP,
    knee: L.LEFT_KNEE,
    ankle: L.LEFT_ANKLE,
  },
  right: {
    shoulder: L.RIGHT_SHOULDER,
    elbow: L.RIGHT_ELBOW,
    wrist: L.RIGHT_WRIST,
    hip: L.RIGHT_HIP,
    knee: L.RIGHT_KNEE,
    ankle: L.RIGHT_ANKLE,
  },
};

/**
 * When someone is side-on to the camera, one side of the body is hidden.
 * Pick the side the model is more confident about, and return its points:
 * { shoulder, elbow, wrist, hip, knee, ankle } (each an {x, y, visibility}).
 */
export function nearSide(landmarks) {
  const confidence = (side) =>
    Object.values(SIDES[side]).reduce((sum, i) => sum + (landmarks[i]?.visibility ?? 0), 0);
  return bodySide(landmarks, confidence('left') >= confidence('right') ? 'left' : 'right');
}

/** The points for one named side ('left' or 'right'), for exercises that watch both legs. */
export function bodySide(landmarks, side) {
  return Object.fromEntries(Object.entries(SIDES[side]).map(([name, i]) => [name, landmarks[i]]));
}

/**
 * Exponential smoothing: blends each new reading with the previous one, so
 * small jitters in the tracking don't count as movement. `amount` near 1
 * follows the new value quickly; near 0 changes slowly.
 */
export function createSmoother(amount = 0.5) {
  let value = null;
  return (next) => {
    value = value === null ? next : value + (next - value) * amount;
    return value;
  };
}
