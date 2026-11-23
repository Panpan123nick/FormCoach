import { useEffect, useRef, useState } from 'react';
import { drawSkeleton } from './drawSkeleton.js';
import { loadPoseLandmarker } from './poseDetector.js';

function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

/**
 * Starts the front camera, loads the pose model, and on every new video frame
 * finds the pose, draws the skeleton on `canvasRef`, then calls
 * onFrame(landmarks, nowMs). Used by both the camera check and the workout.
 *
 * Returns { status, error, retry }:
 *   status: 'starting' (asking for camera) → 'loading' (pose model) → 'running', or 'error'
 *   error:  'denied' | 'noCamera' | 'insecure' | 'model'
 * The camera turns off automatically when the screen using this closes.
 */
export function usePoseCamera(videoRef, canvasRef, onFrame) {
  const [status, setStatus] = useState('starting');
  const [error, setError] = useState(null);
  // Changing this number restarts everything (used by "Try again").
  const [attempt, setAttempt] = useState(0);

  // Keep the newest onFrame in a ref, so the screen can change it freely
  // without restarting the camera.
  const onFrameRef = useRef(onFrame);
  useEffect(() => {
    onFrameRef.current = onFrame;
  });

  useEffect(() => {
    let cancelled = false; // set when the screen closes, so async steps stop
    let stream = null;
    let frame = null;

    const fail = (reason) => {
      if (cancelled) return;
      setError(reason);
      setStatus('error');
    };

    async function run() {
      setStatus('starting');
      setError(null);

      // Browsers only offer the camera on secure (https or localhost) pages.
      if (!navigator.mediaDevices?.getUserMedia) return fail('insecure');

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (err) {
        return fail(err.name === 'NotAllowedError' ? 'denied' : 'noCamera');
      }
      if (cancelled) return stopStream(stream);

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play().catch(() => {});

      setStatus('loading');
      let landmarker;
      try {
        landmarker = await loadPoseLandmarker();
      } catch {
        return fail('model');
      }
      if (cancelled) return;
      setStatus('running');

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      let lastVideoTime = -1;

      // Runs once per screen refresh, but only does work when the camera has
      // a new frame (cameras are often 30 frames a second, screens 60).
      const loop = () => {
        if (cancelled) return;
        if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          const now = performance.now();
          const pose = landmarker.detectForVideo(video, now).landmarks[0];
          drawSkeleton(ctx, pose);
          onFrameRef.current(pose, now);
        }
        frame = requestAnimationFrame(loop);
      };
      loop();
    }

    run();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stopStream(stream);
    };
  }, [attempt, videoRef, canvasRef]);

  return { status, error, retry: () => setAttempt((n) => n + 1) };
}
