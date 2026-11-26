import { describe, expect, it } from 'vitest';
import en from '../i18n/en.json';
import { angleAt, tiltFromHorizontal } from '../pose/angles.js';
import { LANDMARK as L } from '../pose/landmarks.js';
import { createExerciseAnalyzer, hipOffset } from './exercises.js';
import { createRepTracker } from './repTracker.js';

describe('angleAt', () => {
  it('measures a right angle and a straight line', () => {
    expect(angleAt({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(90);
    expect(angleAt({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(180);
  });

  it('measures tilt from horizontal', () => {
    expect(tiltFromHorizontal({ x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(0);
    expect(tiltFromHorizontal({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(90);
    expect(tiltFromHorizontal({ x: 1, y: 0 }, { x: 0, y: 0.01 })).toBeLessThan(2);
  });
});

describe('createRepTracker', () => {
  const run = (angles, faultsAt = {}) => {
    const tracker = createRepTracker({ restAbove: 150, moveBelow: 140, targetBelow: 100 });
    return angles.map((a, i) => tracker.update(a, faultsAt[i] ?? [])).filter(Boolean);
  };

  it('counts a full rep once', () => {
    expect(run([170, 150, 120, 95, 90, 110, 140, 160, 170])).toEqual([{ type: 'rep' }]);
  });

  it('calls a rep that never got deep enough "shallow"', () => {
    expect(run([170, 130, 115, 130, 165])).toEqual([{ type: 'shallow' }]);
  });

  it('does not count wobbles near the start line', () => {
    expect(run([170, 145, 152, 145, 151, 149, 152])).toEqual([]);
  });

  it('rejects a deep rep with a form fault', () => {
    expect(run([170, 120, 95, 120, 165], { 2: ['backStraight'] })).toEqual([
      { type: 'fault', fault: 'backStraight' },
    ]);
  });

  it('counts several reps in a row', () => {
    const one = [170, 120, 90, 120, 170];
    expect(run([...one, ...one, ...one])).toHaveLength(3);
  });
});

// A fake side-on body: landmarks for the left side, right side hidden.
function body(points) {
  const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.1 }));
  const names = {
    shoulder: L.LEFT_SHOULDER,
    elbow: L.LEFT_ELBOW,
    wrist: L.LEFT_WRIST,
    hip: L.LEFT_HIP,
    knee: L.LEFT_KNEE,
    ankle: L.LEFT_ANKLE,
  };
  for (const [name, [x, y]] of Object.entries(points)) {
    landmarks[names[name]] = { x, y, visibility: 0.95 };
  }
  return landmarks;
}

// A side-on plank/push-up body: shoulder at the left, ankle at the right.
const flatBody = (hipY = 0.5, elbowAngle = 'straight') =>
  body({
    shoulder: [0.3, 0.5],
    elbow: elbowAngle === 'straight' ? [0.3, 0.6] : [0.38, 0.55],
    wrist: elbowAngle === 'straight' ? [0.3, 0.7] : [0.3, 0.6],
    hip: [0.5, hipY],
    knee: [0.6, 0.5],
    ankle: [0.7, 0.5],
  });

describe('push-up analyzer', () => {
  it('counts a push-up with a straight body', () => {
    const analyzer = createExerciseAnalyzer('pushups');
    let result;
    for (let i = 0; i < 4; i++) result = analyzer.update(flatBody(0.5, 'straight'));
    for (let i = 0; i < 6; i++) result = analyzer.update(flatBody(0.5, 'bent'));
    for (let i = 0; i < 6; i++) result = analyzer.update(flatBody(0.5, 'straight'));
    expect(result.reps).toBe(1);
  });

  it('asks to get into position when standing up', () => {
    const standing = body({
      shoulder: [0.5, 0.2],
      elbow: [0.5, 0.35],
      wrist: [0.5, 0.5],
      hip: [0.5, 0.5],
      knee: [0.5, 0.7],
      ankle: [0.5, 0.9],
    });
    expect(createExerciseAnalyzer('pushups').update(standing).cue).toBe('getInPosition');
  });

  it('asks to stay in view when nobody is tracked', () => {
    expect(createExerciseAnalyzer('pushups').update(undefined).cue).toBe('stayInView');
  });
});

describe('plank analyzer', () => {
  it('measures hip sag and pike', () => {
    expect(hipOffset({ shoulder: { x: 0.3, y: 0.5 }, hip: { x: 0.5, y: 0.5 }, ankle: { x: 0.7, y: 0.5 } })).toBeCloseTo(0);
    expect(hipOffset({ shoulder: { x: 0.3, y: 0.5 }, hip: { x: 0.5, y: 0.56 }, ankle: { x: 0.7, y: 0.5 } })).toBeGreaterThan(0.07);
    expect(hipOffset({ shoulder: { x: 0.3, y: 0.5 }, hip: { x: 0.5, y: 0.42 }, ankle: { x: 0.7, y: 0.5 } })).toBeLessThan(-0.09);
  });

  it('only counts time when the hips are in line', () => {
    const analyzer = createExerciseAnalyzer('plank');
    let result;
    for (let t = 0; t <= 1000; t += 100) result = analyzer.update(flatBody(0.5), t);
    expect(result.holdMs).toBe(1000);
    expect(result.cue).toBeNull();

    for (let t = 1100; t <= 3000; t += 100) result = analyzer.update(flatBody(0.58), t);
    expect(result.cue).toBe('hipsSag');
    expect(result.holdMs).toBeLessThan(1400); // the timer paused while sagging
  });
});

// Feed a list of body poses to an analyzer, each held for a few frames, and return the last result.
function play(analyzer, poses, framesEach = 6) {
  let result;
  let time = 0;
  for (const pose of poses) {
    for (let i = 0; i < framesEach; i++) result = analyzer.update(pose, (time += 100));
  }
  return result;
}

describe('glute bridge analyzer', () => {
  // Lying side-on, knees bent; then hips lifted into a straight shoulder–hip–knee line.
  const lying = body({ shoulder: [0.2, 0.7], elbow: [0.3, 0.72], wrist: [0.4, 0.72], hip: [0.45, 0.7], knee: [0.6, 0.55], ankle: [0.65, 0.7] });
  const bridge = body({ shoulder: [0.2, 0.7], elbow: [0.3, 0.72], wrist: [0.4, 0.72], hip: [0.45, 0.6], knee: [0.6, 0.55], ankle: [0.65, 0.7] });
  const halfway = body({ shoulder: [0.2, 0.7], elbow: [0.3, 0.72], wrist: [0.4, 0.72], hip: [0.45, 0.655], knee: [0.6, 0.55], ankle: [0.65, 0.7] });

  it('counts a full bridge', () => {
    expect(play(createExerciseAnalyzer('gluteBridges'), [lying, bridge, lying]).reps).toBe(1);
  });

  it('asks for higher hips when the bridge is too low', () => {
    const result = play(createExerciseAnalyzer('gluteBridges'), [lying, halfway, lying]);
    expect(result.reps).toBe(0);
    expect(result.missed).toBe(1);
  });
});

describe('push-up versions', () => {
  it('wall push-ups expect a standing body, regular push-ups a flat one', () => {
    const leaning = body({ shoulder: [0.5, 0.25], elbow: [0.6, 0.3], wrist: [0.7, 0.28], hip: [0.45, 0.55], knee: [0.42, 0.72], ankle: [0.4, 0.9] });
    expect(createExerciseAnalyzer('wallPushups').update(leaning).cue).not.toBe('getInPosition');
    expect(createExerciseAnalyzer('pushups').update(leaning).cue).toBe('getInPosition');
  });

  it('knee push-ups judge the straight line from shoulder to knee', () => {
    // Flat from shoulder to knee, with the shins bent up behind.
    const kneeling = body({ shoulder: [0.3, 0.5], elbow: [0.3, 0.6], wrist: [0.3, 0.7], hip: [0.45, 0.52], knee: [0.6, 0.54], ankle: [0.7, 0.4] });
    const result = createExerciseAnalyzer('kneePushups').update(kneeling);
    expect(result.inPosition).toBe(true);
    expect(result.cue).toBeNull();
  });
});

describe('lunge analyzer', () => {
  const stand = body({ shoulder: [0.5, 0.2], elbow: [0.5, 0.35], wrist: [0.5, 0.5], hip: [0.5, 0.5], knee: [0.5, 0.7], ankle: [0.5, 0.9] });
  const lunge = body({ shoulder: [0.5, 0.3], elbow: [0.5, 0.45], wrist: [0.5, 0.6], hip: [0.5, 0.6], knee: [0.65, 0.62], ankle: [0.65, 0.85] });

  it('counts a lunge from the bent front knee', () => {
    expect(play(createExerciseAnalyzer('lunges'), [stand, lunge, stand]).reps).toBe(1);
  });
});

describe('follow-along stretches', () => {
  it('times while you are in view and alternates the cat-stretch prompts', () => {
    const analyzer = createExerciseAnalyzer('catStretch', { targetSeconds: 20 });
    const pose = flatBody();
    const cues = [];
    let result;
    for (let t = 0; t <= 6000; t += 100) {
      result = analyzer.update(pose, t);
      if (result.cue) cues.push(result.cue);
    }
    expect(cues).toEqual(['catUp', 'catDown']);
    expect(result.holdMs).toBe(6000);
  });

  it('pauses the timer when you step out of view', () => {
    const analyzer = createExerciseAnalyzer('shoulderRolls', { targetSeconds: 30 });
    analyzer.update(flatBody(), 0);
    analyzer.update(flatBody(), 100);
    const result = analyzer.update(undefined, 200);
    expect(result.cue).toBe('stayInView');
    expect(result.holdMs).toBe(100);
  });

  it('switches shoulder rolls from forward to backward halfway', () => {
    const analyzer = createExerciseAnalyzer('shoulderRolls', { targetSeconds: 20 });
    const cues = [];
    for (let t = 0; t <= 17000; t += 100) {
      const { cue } = analyzer.update(flatBody(), t);
      if (cue) cues.push(cue);
    }
    expect(cues).toEqual(['rollForward', 'rollForward', 'rollBackward']);
  });
});

describe('cue text', () => {
  // Every message key the trackers can return. If you add a cue, add it here and to en.json.
  const CUES = [
    'goodRep', 'goLower', 'comeUpHigher', 'backStraight', 'chestUp', 'kneesBent', 'hipsSag',
    'hipsHigh', 'hipsHigher', 'liftHigher', 'pullHigher', 'stayInView', 'getInPosition',
    'rollForward', 'rollBackward', 'catUp', 'catDown',
  ];

  it.each(CUES)('"%s" has English text', (cue) => {
    expect(en.workout.cues[cue]).toBeTypeOf('string');
  });
});
