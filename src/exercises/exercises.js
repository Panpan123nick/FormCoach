// How each exercise is measured and judged. ALL the form thresholds live here,
// so tuning them after real-world testing means editing just this file.
//
// Angles are in degrees. Most exercises are watched side-on to the camera;
// side-lying leg raises and the warm-up/cool-down face the camera.
// `lenient` (beginners, under-13s, 60+, safety concerns) relaxes the depth and
// form limits a little.
import { angleAt, bodySide, createSmoother, nearSide, tiltFromHorizontal } from '../pose/angles.js';
import { LANDMARK as L } from '../pose/landmarks.js';
import { createRepTracker } from './repTracker.js';

const MIN_VISIBILITY = 0.5;
// For exercises that watch BOTH legs, the far leg is partly hidden, so accept
// it with less confidence.
const BOTH_LEGS_VISIBILITY = 0.3;

const legVisible = (s) =>
  ['hip', 'knee', 'ankle'].every((j) => (s[j]?.visibility ?? 0) >= BOTH_LEGS_VISIBILITY);

// The smaller of the two legs' angles: whichever leg is doing the work.
function workingLegAngle(landmarks, measure) {
  const angles = ['left', 'right']
    .map((name) => bodySide(landmarks, name))
    .filter(legVisible)
    .map(measure);
  return angles.length ? Math.min(...angles) : measure(nearSide(landmarks));
}

const elbowBend = (s) => angleAt(s.shoulder, s.elbow, s.wrist);
const lyingDown = (s) => tiltFromHorizontal(s.shoulder, s.ankle) < 40;

// The rep tracker counts movements that START with a big number, go DOWN past
// a target, and come back UP. Each exercise's `measure` is chosen to work that way.
const REP_EXERCISES = {
  pushups: {
    // Elbow bend: ~170 with straight arms, under 100 at the bottom.
    joints: ['shoulder', 'elbow', 'wrist', 'hip', 'ankle'],
    measure: elbowBend,
    thresholds: (lenient) => ({ restAbove: 150, moveBelow: 140, targetBelow: lenient ? 110 : 100 }),
    inPosition: lyingDown, // body roughly flat, not standing or kneeling up
    // Shoulder–hip–ankle should be a straight line (180). Less means hips sagging or piking.
    faults: (s, lenient) => (angleAt(s.shoulder, s.hip, s.ankle) < (lenient ? 145 : 155) ? ['backStraight'] : []),
    shallowCue: 'goLower',
  },
  kneePushups: {
    // Same elbow bend, but the straight line runs shoulder–hip–KNEE.
    joints: ['shoulder', 'elbow', 'wrist', 'hip', 'knee'],
    measure: elbowBend,
    thresholds: (lenient) => ({ restAbove: 150, moveBelow: 140, targetBelow: lenient ? 110 : 100 }),
    inPosition: (s) => tiltFromHorizontal(s.shoulder, s.knee) < 45,
    faults: (s, lenient) => (angleAt(s.shoulder, s.hip, s.knee) < (lenient ? 145 : 155) ? ['backStraight'] : []),
    shallowCue: 'goLower',
  },
  wallPushups: {
    // Standing, leaning on a wall: body is tilted, nowhere near flat.
    joints: ['shoulder', 'elbow', 'wrist', 'hip', 'ankle'],
    measure: elbowBend,
    thresholds: (lenient) => ({ restAbove: 150, moveBelow: 140, targetBelow: lenient ? 115 : 105 }),
    inPosition: (s) => tiltFromHorizontal(s.shoulder, s.ankle) > 45,
    faults: (s) => (angleAt(s.shoulder, s.hip, s.ankle) < 150 ? ['backStraight'] : []),
    shallowCue: 'goLower',
  },
  squats: {
    // Knee bend: ~175 standing, under 100 near thighs-parallel.
    joints: ['shoulder', 'hip', 'knee', 'ankle'],
    measure: (s) => angleAt(s.hip, s.knee, s.ankle),
    thresholds: (lenient, options) => ({
      restAbove: 160,
      moveBelow: 145,
      // Shallower target for lenient users and anyone going easy on their knees.
      targetBelow: lenient || options.easyKnees ? 115 : 100,
    }),
    inPosition: () => true,
    // Chest up: the torso (hip → shoulder) shouldn't fold too far forward.
    faults: (s, lenient) => (90 - tiltFromHorizontal(s.hip, s.shoulder) > (lenient ? 60 : 50) ? ['chestUp'] : []),
    shallowCue: 'goLower',
  },
  lunges: {
    // The front knee bends to ~90. Legs alternate, so watch both and use the more bent one.
    joints: ['shoulder', 'hip', 'knee', 'ankle'],
    measure: (s, landmarks) => workingLegAngle(landmarks, (leg) => angleAt(leg.hip, leg.knee, leg.ankle)),
    thresholds: (lenient) => ({ restAbove: 160, moveBelow: 145, targetBelow: lenient ? 115 : 105 }),
    inPosition: () => true,
    faults: (s, lenient) => (90 - tiltFromHorizontal(s.hip, s.shoulder) > (lenient ? 40 : 30) ? ['chestUp'] : []),
    shallowCue: 'goLower',
  },
  situps: {
    // Hip angle (shoulder–hip–knee): ~130 lying with knees bent, under 75 sitting up.
    joints: ['shoulder', 'hip', 'knee', 'ankle'],
    measure: (s) => angleAt(s.shoulder, s.hip, s.knee),
    thresholds: (lenient) => ({ restAbove: 115, moveBelow: 105, targetBelow: lenient ? 85 : 75 }),
    inPosition: () => true,
    // Knees should stay bent (straight-leg sit-ups strain the lower back).
    faults: (s) => (angleAt(s.hip, s.knee, s.ankle) > 150 ? ['kneesBent'] : []),
    shallowCue: 'comeUpHigher',
  },
  gluteBridges: {
    // Lying with knees bent, then lifting the hips until shoulder–hip–knee is
    // nearly straight. We measure the hip BEND (180 minus that angle): ~50 lying,
    // under 18 at the top, so it fits the "start big, go down" tracker.
    joints: ['shoulder', 'hip', 'knee', 'ankle'],
    measure: (s) => 180 - angleAt(s.shoulder, s.hip, s.knee),
    thresholds: (lenient) => ({ restAbove: 35, moveBelow: 30, targetBelow: lenient ? 25 : 18 }),
    inPosition: (s) => tiltFromHorizontal(s.shoulder, s.ankle) < 30, // shoulders and feet on the floor
    faults: () => [],
    shallowCue: 'hipsHigher',
  },
  legRaises: {
    // Lying on your side FACING the camera. The raised leg makes a smaller
    // shoulder–hip–ankle angle: ~175 with legs together, ~145 lifted.
    joints: ['shoulder', 'hip', 'ankle'],
    measure: (s, landmarks) => workingLegAngle(landmarks, (leg) => angleAt(leg.shoulder, leg.hip, leg.ankle)),
    thresholds: (lenient) => ({ restAbove: 168, moveBelow: 162, targetBelow: lenient ? 153 : 148 }),
    inPosition: (s) => tiltFromHorizontal(s.shoulder, s.hip) < 35, // torso lying flat
    faults: () => [],
    shallowCue: 'liftHigher',
  },
  pullUps: {
    // Elbow bend while hanging: ~170 at the bottom, under 75 with the chin at the bar.
    joints: ['shoulder', 'elbow', 'wrist'],
    measure: elbowBend,
    thresholds: (lenient) => ({ restAbove: 145, moveBelow: 130, targetBelow: lenient ? 85 : 75 }),
    // Hanging means the hands are above the head.
    inPosition: (s, landmarks) => s.wrist.y < (landmarks[L.NOSE]?.y ?? 1),
    faults: () => [],
    shallowCue: 'pullHigher',
  },
};

const visible = (side, joints) => joints.every((j) => (side[j]?.visibility ?? 0) >= MIN_VISIBILITY);

/**
 * Watches one exercise. Call update(landmarks, nowMs) on every video frame.
 * Returns { reps, missed, cue, inPosition, holdMs } where:
 *   reps    – good reps so far (rep exercises)
 *   missed  – reps that didn't count
 *   holdMs  – time held with good form (plank) or followed along (warm-up/cool-down)
 *   cue     – a short message key to show/say right now, or null
 */
export function createExerciseAnalyzer(exercise, { lenient = false, easyKnees = false, targetSeconds = 30 } = {}) {
  if (exercise === 'plank') return createPlankAnalyzer({ lenient });
  if (GUIDED[exercise]) return createGuidedAnalyzer(GUIDED[exercise], targetSeconds);

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
      if (!config.inPosition(side, landmarks)) {
        return { reps, missed, cue: 'getInPosition', inPosition: false };
      }

      const frameFaults = config.faults(side, lenient, landmarks);
      const event = tracker.update(smooth(config.measure(side, landmarks)), frameFaults);

      let cue = frameFaults[0] ?? null; // warn about form problems as they happen
      if (event?.type === 'rep') {
        reps += 1;
        cue = 'goodRep';
      } else if (event?.type === 'shallow') {
        missed += 1;
        cue = config.shallowCue;
      } else if (event?.type === 'fault') {
        missed += 1;
        cue = event.fault;
      }
      return { reps, missed, cue, inPosition: true, repEvent: event?.type ?? null };
    },
  };
}

// ---------- Warm-up and cool-down: follow-along timers ----------
// The camera can't measure spine curves or small shoulder circles reliably,
// so these don't count reps. The timer runs while you're in view, and the
// coach talks you through the movement.
const GUIDED = {
  shoulderRolls: {
    joints: ['shoulder'],
    everyMs: 8000,
    // Forward for the first half, backward for the second.
    prompt: (heldMs, totalMs) => (heldMs < totalMs / 2 ? 'rollForward' : 'rollBackward'),
  },
  catStretch: {
    joints: ['shoulder', 'hip'],
    everyMs: 5000,
    // Alternate: round the back up, then let it sink down.
    prompt: (heldMs, totalMs, step) => (step % 2 === 0 ? 'catUp' : 'catDown'),
  },
};

function createGuidedAnalyzer(config, targetSeconds) {
  const totalMs = targetSeconds * 1000;
  let holdMs = 0;
  let lastTime = null;
  let lastStep = -1;

  return {
    update(landmarks, now) {
      const elapsed = lastTime === null ? 0 : Math.min(now - lastTime, 200);
      lastTime = now;
      if (!landmarks || !visible(nearSide(landmarks), config.joints)) {
        return { holdMs, cue: 'stayInView', inPosition: false };
      }
      holdMs += elapsed;

      // A new instruction every `everyMs`; null in between (so it isn't repeated every frame).
      const step = Math.floor(holdMs / config.everyMs);
      const cue = step !== lastStep ? config.prompt(holdMs, totalMs, step) : null;
      lastStep = step;
      return { holdMs, cue, inPosition: true };
    },
  };
}

// ---------- Plank: a timer that only runs while the body is in a straight line ----------

/**
 * How far the hip is from the straight line between shoulder and ankle, as a
 * fraction of body length: positive = hips sagging, negative = hips too high.
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
