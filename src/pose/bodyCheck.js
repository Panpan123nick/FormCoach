// Decides whether the whole body is in the camera's view, and if not, what
// to tell the user. Plain functions with no camera or React, so it's easy to test.
import { LANDMARK as L } from './landmarks.js';

// The body parts we need to see, and which landmarks count for each.
// Seeing either side is enough: when someone stands side-on to the camera
// (which push-ups and planks need), their far arm and leg are hidden.
export const BODY_PARTS = {
  head: [L.NOSE, L.LEFT_EAR, L.RIGHT_EAR],
  shoulders: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER],
  hips: [L.LEFT_HIP, L.RIGHT_HIP],
  knees: [L.LEFT_KNEE, L.RIGHT_KNEE],
  feet: [L.LEFT_ANKLE, L.RIGHT_ANKLE],
};

// How sure the model must be that a point is visible (0 to 1).
const MIN_VISIBILITY = 0.6;
// Points this close to the edge (2% of the image) are probably cut off.
const EDGE = 0.02;
// If head-to-feet takes up less than 35% of the image height, the person is
// so small that joint angles get unreliable.
const MIN_BODY_HEIGHT = 0.35;

function isSeen(point) {
  return (
    point !== undefined &&
    point.visibility >= MIN_VISIBILITY &&
    point.x >= EDGE &&
    point.x <= 1 - EDGE &&
    point.y >= EDGE &&
    point.y <= 1 - EDGE
  );
}

/**
 * Check one frame's landmarks.
 * Returns { status, seen } where `seen` says which body parts are visible and
 * `status` is one of:
 *   'noPerson'   – nobody detected
 *   'stepBack'   – knees or feet are cut off
 *   'showHead'   – head is cut off
 *   'showBody'   – shoulders or hips can't be seen
 *   'comeCloser' – whole body visible but very small
 *   'ok'         – good to go
 */
export function checkFullBody(landmarks) {
  if (!landmarks || landmarks.length === 0) {
    return { status: 'noPerson', seen: {} };
  }

  const seen = {};
  for (const [part, indexes] of Object.entries(BODY_PARTS)) {
    seen[part] = indexes.some((i) => isSeen(landmarks[i]));
  }

  // Most helpful advice first: legs cut off almost always means "too close".
  if (!seen.feet || !seen.knees) return { status: 'stepBack', seen };
  if (!seen.head) return { status: 'showHead', seen };
  if (!seen.shoulders || !seen.hips) return { status: 'showBody', seen };

  // Body height in the image: from the highest visible head point to the lowest ankle.
  const top = Math.min(...BODY_PARTS.head.filter((i) => isSeen(landmarks[i])).map((i) => landmarks[i].y));
  const bottom = Math.max(...BODY_PARTS.feet.filter((i) => isSeen(landmarks[i])).map((i) => landmarks[i].y));
  if (bottom - top < MIN_BODY_HEIGHT) return { status: 'comeCloser', seen };

  return { status: 'ok', seen };
}
