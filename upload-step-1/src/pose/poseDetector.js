// Loads the MediaPipe pose model. Everything it needs (the engine files and
// the model) is served by our own app from public/, so nothing is fetched from
// other servers and no video ever leaves the device.
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

const BASE = import.meta.env.BASE_URL;

// Loading takes a moment, so we do it once and share the result (a "singleton").
let loading = null;

export function loadPoseLandmarker() {
  if (!loading) {
    loading = (async () => {
      const vision = await FilesetResolver.forVisionTasks(`${BASE}mediapipe/wasm`);
      const create = (delegate) =>
        PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: `${BASE}models/pose_landmarker_lite.task`, delegate },
          runningMode: 'VIDEO', // we feed it frames from a live video, one after another
          numPoses: 1, // track one person
        });
      // The GPU is much faster; fall back to the CPU on devices where the GPU path fails.
      try {
        return await create('GPU');
      } catch {
        return await create('CPU');
      }
    })();
    // If loading fails, forget it so "Try again" can start over.
    loading.catch(() => {
      loading = null;
    });
  }
  return loading;
}
