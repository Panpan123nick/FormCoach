// How each exercise is measured and judged. ALL the form thresholds live here,
// so tuning them after real-world testing means editing just this file.
//
// Angles are in degrees. Every exercise is watched side-on to the camera.
// `lenient` (beginners, under-13s, 60+, safety concerns) relaxes the depth and
// form limits a little.
import { angleAt, createSmoother, nearSide, tiltFromHorizontal } from '../pose/angles.js';
import { createRepTracker } from './repTracker.js';

const MIN_VISIBILITY = 0.5;

// Each rep exercise says which angle to watch, the rep thresholds, and which
// form checks to run while moving.
const REP_EXERCISES = {
  pushups: {
    // Elbow bend: ~170 with straight arms, under 100 at the bottom.
    joints: ['shoulder', 'elbow', 'wrist', 'hip', 'ankle'],
    angle: (s) => angleAt(s.shoulder, s.elbow, s.wrist),
    thresholds: (lenient) => ({ restAbove: 150, moveBelow: 140, targetBelow: lenient ? 110 : 100 }),
    // A push-up only counts with the body roughly flat (not standing or kneeling up).
    inPosition: (s) => tiltFromHorizontal(s.shoulder, s.ankle) < 40,
    faults: (s, lenient) =>
      // Shoulder–hip–ankle should be a straight line (180). Less means hips sagging or piking.
      angleAt(s.shoulder, s.hip, s.ankle) < (lenient ? 145 : 155) ? ['backStraight'] : [],
  },
  squats: {
    // Knee bend: ~175 standing, under 100 near thighs-parallel.
    joints: ['shoulder', 'hip', 'knee', 'ankle'],
    angle: (s) => angleAt(s.hip, s.knee, s.ankle),
    thresholds: (lenient, options) => ({
      restAbove: 160,
      moveBelow: 145,
      // Shallower target for lenient users and anyone going easy on their knees.
      targetBelow: lenient || options.easyKnees ? 115 : 100,
    }),
    inPosition: () => true,
    // Chest up: the torso (hip → shoulder) shouldn't fold too far forward.
    faults: (s, lenient) =>
      90 - tiltFromHorizontal(s.hip, s.shoulder) > (lenient ? 60 : 50) ? ['chestUp'] : [],
  },
  situps: {
    // Hip angle (shoulder–hip–knee): ~130 lying with knees bent, under 75 sitting up.
    joints: ['shoulder', 'hip', 'knee', 'ankle'],
    angle: (s) => angleAt(s.shoulder, s.hip, s.knee),
    thresholds: (lenient) => ({ restAbove: 115, moveBelow: 105, targetBelow: lenient ? 85 : 75 }),
    inPosition: () => true,
    // Knees should stay bent (straight-leg sit-ups strain the lower back).
    faults: (s) => (angleAt(s.hip, s.knee, s.ankle) > 150 ? ['kneesBent'] : []),
  },
};

// What to say when a rep didn't count because it wasn't deep enough.
const SHALLOW_CUE = { pushups: 'goLower', squats: 'goLower', situps: 'comeUpHigher' };

const visible = (side, joints) => joints.every((j) => (side[j]?.visibility ?? 0) >= MIN_VISIBILITY);

/**
 * Watches one exercise. Call update(landmarks, nowMs) on every video frame.
 * Returns { reps, missed, cue, inPosition, holdMs } where:
 *   reps    – good reps so far (or, for the plank, holdMs = time held with good form)
 *   missed  – reps that didn't count
 *   cue     – a short message key to show/say right now, or null
 */
export function createExerciseAnalyzer(exercise, { lenient = false, easyKnees = false } = {}) {
  if (exercise === 'plank') return createPlankAnalyzer({ lenient });

  const config = REP_EXERCISES[exercise];
  const tracker = createRepTracker(config.thresholds(lenient, { easyKnees }));
  const smooth = createSmoother(0.5);
  let reps = 0;
  let missed = 0;

  return {
    update(landmarks) {
      if (!landmarks) return { reps, missed, cue: 'stayInView', inPosition: false };
      const side = nearSide(landmarks);
      if (!visible(side, config.joints)) {
        return { reps, missed, cue: 'stayInView', inPosition: false };
      }
      if (!config.inPosition(side)) {
        return { reps, missed, cue: 'getInPosition', inPosition: false };
      }

      const frameFaults = config.faults(side, lenient);
      const event = tracker.update(smooth(config.angle(side)), frameFaults);

      let cue = frameFaults[0] ?? null; // warn about form problems as they happen
      if (event?.type === 'rep') {
        reps += 1;
        cue = 'goodRep';
      } else if (event?.type === 'shallow') {
        missed += 1;
        cue = SHALLOW_CUE[exercise];
      } else if (event?.type === 'fault') {
        missed += 1;
        cue = event.fault;
      }
      return { reps, missed, cue, inPosition: true, repEvent: event?.type ?? null };
    },
  };
}

/**
 * The plank: a timer that only runs while the body is in a straight line.
 * We measure how far the hip is from the straight line between shoulder and
 * ankle, as a fraction of body length: positive = hips sagging, negative = hips too high.
 */
export function hipOffset(side) {
  const { shoulder, hip, ankle } = side;
  const run = ankle.x - shoulder.x;
  if (Math.abs(run) < 1e-6) return 0;
  // Where the line would be at the hip's x position (image y grows downward).
  const lineY = shoulder.y + ((ankle.y - shoulder.y) * (hip.x - shoulder.x)) / run;
  const bodyLength = Math.hypot(run, ankle.y - shoulder.y);
  return (hip.y - lineY) / bodyLength;
}

function createPlankAnalyzer({ lenient }) {
  const smooth = createSmoother(0.4);
  const sagLimit = lenient ? 0.09 : 0.07;
  const highLimit = lenient ? 0.11 : 0.09;
  let holdMs = 0;
  let lastTime = null;

  return {
    update(landmarks, now) {
      const elapsed = lastTime === null ? 0 : Math.min(now - lastTime, 200); // ignore long pauses
      lastTime = now;
      if (!landmarks) return { holdMs, cue: 'stayInView', inPosition: false };

      const side = nearSide(landmarks);
      if (!visible(side, ['shoulder', 'hip', 'ankle'])) {
        return { holdMs, cue: 'stayInView', inPosition: false };
      }
      if (tiltFromHorizontal(side.shoulder, side.ankle) > 40) {
        return { holdMs, cue: 'getInPosition', inPosition: false };
      }

      const offset = smooth(hipOffset(side));
      let cue = null;
      if (offset > sagLimit) cue = 'hipsSag';
      else if (offset < -highLimit) cue = 'hipsHigh';
      else holdMs += elapsed; // only good-form time counts

      return { holdMs, cue, inPosition: true };
    },
  };
}
