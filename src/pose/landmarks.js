// MediaPipe Pose finds 33 points ("landmarks") on the body, always in the same
// order. These names make the code readable: LANDMARK.LEFT_KNEE instead of 25.
// Each landmark has x and y from 0 to 1 (fractions of the image width/height,
// with 0,0 at the top-left), a depth z, and `visibility`: how sure the model
// is (0 to 1) that the point is actually visible.
export const LANDMARK = {
  NOSE: 0,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT: 31,
  RIGHT_FOOT: 32,
};

// Points 0 to 10 are on the face. We skip them when drawing the skeleton
// so the overlay stays clean; the nose alone stands in for the head.
export const FIRST_BODY_LANDMARK = 11;
