/**
 * Counts reps from a single joint angle, for any exercise that starts with a
 * joint open, closes it, and opens it again (push-ups, squats, sit-ups).
 *
 *   restAbove   – angle above this means "back at the start" (e.g. arms straight)
 *   moveBelow   – angle below this means a rep has started
 *   targetBelow – the rep must reach below this to be deep enough
 *
 * Having separate start and end lines ("hysteresis") stops tiny wobbles around
 * one line from counting as many reps.
 *
 * Call update(angle, faults) every frame. `faults` lists form problems seen in
 * this frame (e.g. ['backStraight']). When a rep finishes it returns one of:
 *   { type: 'rep' }                – deep enough and clean: counts
 *   { type: 'shallow' }            – didn't go deep enough: doesn't count
 *   { type: 'fault', fault }       – had a form problem: doesn't count
 * Otherwise it returns null.
 */
export function createRepTracker({ restAbove, moveBelow, targetBelow }) {
  let moving = false;
  let deepest = 180;
  let faults = [];

  return {
    update(angle, frameFaults = []) {
      if (!moving) {
        if (angle < moveBelow) {
          moving = true;
          deepest = angle;
          faults = [...frameFaults];
        }
        return null;
      }

      deepest = Math.min(deepest, angle);
      for (const fault of frameFaults) if (!faults.includes(fault)) faults.push(fault);

      if (angle <= restAbove) return null; // still in the middle of the rep

      // Back at the start: judge the whole rep.
      moving = false;
      if (deepest > targetBelow) return { type: 'shallow' };
      if (faults.length > 0) return { type: 'fault', fault: faults[0] };
      return { type: 'rep' };
    },
  };
}
