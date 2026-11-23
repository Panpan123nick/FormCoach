// Draws the tracked skeleton on a <canvas> laid over the video, in the
// poster's colors: cream bones with red joints, which stand out on video.
import { PoseLandmarker } from '@mediapipe/tasks-vision';
import { FIRST_BODY_LANDMARK } from './landmarks.js';

const BONE_COLOR = 'rgba(246, 236, 220, 0.95)';
const OUTLINE_COLOR = 'rgba(38, 40, 90, 0.6)';
const JOINT_COLOR = '#c94f31';
const MIN_VISIBILITY = 0.5;

// Pairs of landmarks that are joined by a bone, minus the face.
const BODY_CONNECTIONS = PoseLandmarker.POSE_CONNECTIONS.filter(
  ({ start, end }) => start >= FIRST_BODY_LANDMARK && end >= FIRST_BODY_LANDMARK,
);

export function drawSkeleton(ctx, landmarks) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  if (!landmarks) return;

  // Landmarks are fractions (0 to 1), so multiply by the canvas size for pixels.
  const toPixels = (p) => [p.x * width, p.y * height];
  const visible = (p) => p && p.visibility >= MIN_VISIBILITY;
  const lineWidth = Math.max(4, width / 140);

  ctx.lineCap = 'round';
  // Each bone is drawn twice: a wider dark outline, then the cream line on top,
  // so it's readable on both light and dark backgrounds.
  for (const [color, widthScale] of [
    [OUTLINE_COLOR, 1.8],
    [BONE_COLOR, 1],
  ]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth * widthScale;
    for (const { start, end } of BODY_CONNECTIONS) {
      const a = landmarks[start];
      const b = landmarks[end];
      if (!visible(a) || !visible(b)) continue;
      ctx.beginPath();
      ctx.moveTo(...toPixels(a));
      ctx.lineTo(...toPixels(b));
      ctx.stroke();
    }
  }

  ctx.fillStyle = JOINT_COLOR;
  ctx.strokeStyle = BONE_COLOR;
  ctx.lineWidth = lineWidth / 2;
  for (let i = FIRST_BODY_LANDMARK; i < landmarks.length; i++) {
    if (!visible(landmarks[i])) continue;
    ctx.beginPath();
    ctx.arc(...toPixels(landmarks[i]), lineWidth * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
