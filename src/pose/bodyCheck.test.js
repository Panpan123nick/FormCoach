import { describe, expect, it } from 'vitest';
import { checkFullBody } from './bodyCheck.js';
import { LANDMARK as L } from './landmarks.js';

// Build a fake set of 33 landmarks for a person standing in the middle of the
// frame, head near the top and feet near the bottom, then apply changes.
function person(changes = {}) {
  const points = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }));
  const place = (index, y) => {
    points[index] = { ...points[index], y };
  };
  [L.NOSE, L.LEFT_EAR, L.RIGHT_EAR].forEach((i) => place(i, 0.15));
  [L.LEFT_SHOULDER, L.RIGHT_SHOULDER].forEach((i) => place(i, 0.25));
  [L.LEFT_HIP, L.RIGHT_HIP].forEach((i) => place(i, 0.5));
  [L.LEFT_KNEE, L.RIGHT_KNEE].forEach((i) => place(i, 0.7));
  [L.LEFT_ANKLE, L.RIGHT_ANKLE].forEach((i) => place(i, 0.9));
  for (const [index, change] of Object.entries(changes)) {
    points[index] = { ...points[index], ...change };
  }
  return points;
}

const hidden = { visibility: 0.1 };

describe('checkFullBody', () => {
  it('says ok when the whole body is clearly visible', () => {
    expect(checkFullBody(person()).status).toBe('ok');
  });

  it('reports nobody when there are no landmarks', () => {
    expect(checkFullBody(undefined).status).toBe('noPerson');
    expect(checkFullBody([]).status).toBe('noPerson');
  });

  it('asks to step back when the feet are hidden', () => {
    const result = checkFullBody(person({ [L.LEFT_ANKLE]: hidden, [L.RIGHT_ANKLE]: hidden }));
    expect(result.status).toBe('stepBack');
    expect(result.seen.feet).toBe(false);
    expect(result.seen.head).toBe(true);
  });

  it('treats points at the very edge of the image as cut off', () => {
    const atBottomEdge = { y: 0.995 };
    const result = checkFullBody(person({ [L.LEFT_ANKLE]: atBottomEdge, [L.RIGHT_ANKLE]: atBottomEdge }));
    expect(result.status).toBe('stepBack');
  });

  it('asks to show the head when only the head is cut off', () => {
    const result = checkFullBody(
      person({ [L.NOSE]: hidden, [L.LEFT_EAR]: hidden, [L.RIGHT_EAR]: hidden }),
    );
    expect(result.status).toBe('showHead');
  });

  it('accepts one side of the body (standing side-on to the camera)', () => {
    const result = checkFullBody(
      person({
        [L.RIGHT_SHOULDER]: hidden,
        [L.RIGHT_HIP]: hidden,
        [L.RIGHT_KNEE]: hidden,
        [L.RIGHT_ANKLE]: hidden,
      }),
    );
    expect(result.status).toBe('ok');
  });

  it('asks to come closer when the body is tiny in the frame', () => {
    const near = (y) => ({ y });
    const result = checkFullBody(
      person({
        [L.NOSE]: near(0.4),
        [L.LEFT_EAR]: near(0.4),
        [L.RIGHT_EAR]: near(0.4),
        [L.LEFT_ANKLE]: near(0.6),
        [L.RIGHT_ANKLE]: near(0.6),
      }),
    );
    expect(result.status).toBe('comeCloser');
  });
});
