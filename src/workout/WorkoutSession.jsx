import { Hand } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createExerciseAnalyzer } from '../exercises/exercises.js';
import { useTranslation } from '../i18n/I18nProvider.jsx';
import { usePoseCamera } from '../pose/usePoseCamera.js';
import { createCueSpeaker } from '../voice/cueSpeaker.js';
import { createSpeaker, stopSpeaking } from '../voice/speech.js';

// Seconds of "get into position" countdown before each set starts counting.
const READY_SECONDS = 5;
// How long a cue stays on screen after it was last triggered.
const BANNER_MS = 1600;

const pad = (n) => String(n).padStart(2, '0');
const clock = (seconds) => `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;

/**
 * Runs the whole workout on one live camera screen:
 *   'ready'  – countdown while the user gets into position
 *   'active' – counting reps (or plank seconds) and giving form cues
 *   'rest'   – countdown between sets
 * The STOP button is on screen the entire time.
 */
export default function WorkoutSession({ plan, options, settings, language, onStop, onDone }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Turn the plan into one entry per set, e.g. squats set 1, squats set 2, plank set 1...
  const sets = useMemo(
    () =>
      plan.flatMap((item) =>
        Array.from({ length: item.sets }, (_, i) => ({ ...item, setNumber: i + 1 })),
      ),
    [plan],
  );

  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState('ready');
  const [countdown, setCountdown] = useState(READY_SECONDS);
  const [display, setDisplay] = useState({ reps: 0, missed: 0, seconds: 0, banner: null });

  const current = sets[index];
  const exerciseName = (id) => t(`questions.exercises.options.${id}`);

  // Things the per-frame code reads and writes (refs don't redraw the screen).
  const live = useRef({ stage: 'ready', analyzer: null, banner: null, bannerAt: 0, lastReps: 0 });
  const results = useRef({}); // exercise -> { reps, missed, seconds }

  // One speaker for the session, plus a "don't nag" layer on top of it.
  const voice = useMemo(() => {
    const speak = createSpeaker(settings, language);
    return { speak, cues: createCueSpeaker({ speak, now: () => performance.now() }) };
  }, [settings, language]);

  // ---- Every camera frame ----
  const camera = usePoseCamera(videoRef, canvasRef, (pose, now) => {
    const state = live.current;
    if (state.stage !== 'active' || !state.analyzer) return;

    const result = state.analyzer.update(pose, now);

    // Speak: a count (and sometimes "Nice rep!") for good reps; otherwise the form cue.
    if (result.repEvent === 'rep') {
      const said = voice.cues.say('goodRep', `${result.reps}. ${t('workout.cues.goodRep')}`);
      if (!said) voice.cues.say('count', String(result.reps), { urgent: true });
    } else if (result.cue && result.cue !== 'goodRep') {
      voice.cues.say(result.cue, t(`workout.cues.${result.cue}`));
    }

    // Keep the latest cue on screen for a moment so it can be read.
    if (result.cue) {
      state.banner = result.cue;
      state.bannerAt = now;
    } else if (now - state.bannerAt > BANNER_MS) {
      state.banner = null;
    }

    const next = {
      reps: result.reps ?? 0,
      missed: result.missed ?? 0,
      seconds: Math.floor((result.holdMs ?? 0) / 1000),
      banner: state.banner,
    };
    // Only redraw when something visible changed.
    setDisplay((prev) =>
      prev.reps === next.reps &&
      prev.missed === next.missed &&
      prev.seconds === next.seconds &&
      prev.banner === next.banner
        ? prev
        : next,
    );

    const done =
      current.kind === 'hold' ? next.seconds >= current.target : next.reps >= current.target;
    if (done) {
      state.stage = 'finishing'; // stop counting immediately, before React catches up
      finishSet(result);
    }
  });

  useEffect(() => () => stopSpeaking(), []);

  // Keep the per-frame code in sync with the current stage.
  useEffect(() => {
    live.current.stage = stage;
  }, [stage]);

  // ---- Stage timers ----
  // 'ready': count down, then start a fresh analyzer and begin counting.
  useEffect(() => {
    // Wait for the camera, so nobody misses the countdown while the model loads.
    if (stage !== 'ready' || camera.status !== 'running') return;
    voice.speak(t('workout.say.getReady', { exercise: exerciseName(current.exercise) }), {
      interrupt: true,
    });
    setCountdown(READY_SECONDS);
    setDisplay({ reps: 0, missed: 0, seconds: 0, banner: null });

    let left = READY_SECONDS;
    const timer = setInterval(() => {
      left -= 1;
      if (left > 0) {
        setCountdown(left);
        if (left <= 3) voice.speak(String(left), { interrupt: true });
        return;
      }
      clearInterval(timer);
      live.current.analyzer = createExerciseAnalyzer(current.exercise, options);
      live.current.lastReps = 0;
      voice.speak(t('workout.say.go'), { interrupt: true });
      setStage('active');
    }, 1000);
    return () => clearInterval(timer);
    // We only want this to run when a new set starts (or the camera becomes ready).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, index, camera.status]);

  // 'rest': count down, then move on to the next set.
  useEffect(() => {
    if (stage !== 'rest') return;
    let left = current.restSeconds;
    setCountdown(left);
    const timer = setInterval(() => {
      left -= 1;
      setCountdown(left);
      if (left <= 0) {
        clearInterval(timer);
        nextSet();
      }
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, index]);

  function nextSet() {
    setIndex((i) => i + 1);
    setStage('ready');
  }

  function finishSet(result) {
    const totals = (results.current[current.exercise] ??= { reps: 0, missed: 0, seconds: 0 });
    totals.reps += result.reps ?? 0;
    totals.missed += result.missed ?? 0;
    totals.seconds += Math.floor((result.holdMs ?? 0) / 1000);

    if (index === sets.length - 1) {
      voice.speak(t('workout.say.allDone'), { interrupt: true });
      onDone(results.current);
      return;
    }
    voice.speak(`${t('workout.say.setDone')} ${t('workout.say.rest')}.`, { interrupt: true });
    setStage('rest');
  }

  function stop() {
    stopSpeaking();
    onStop();
  }

  const isHold = current.kind === 'hold';
  const loading = camera.status === 'starting' || camera.status === 'loading';
  const upNext = sets[index + 1];

  return (
    <div className="camera-screen workout-screen">
      <div className="camera-stage">
        <video ref={videoRef} className="camera-video" playsInline muted />
        <canvas ref={canvasRef} className="camera-overlay" aria-hidden="true" />
        {loading && (
          <div className="camera-loading" role="status">
            <span className="camera-spinner" aria-hidden="true" />
            {camera.status === 'starting' ? t('camera.starting') : t('camera.loading')}
          </div>
        )}
      </div>

      {/* Top: what you're doing, and the big counter. */}
      <header className="hud-top">
        <div className="hud-title">
          <span className="kicker">
            {t('workout.setLabel', { set: current.setNumber, sets: current.sets })}
          </span>
          <span className="hud-exercise">{exerciseName(current.exercise)}</span>
        </div>
        {stage === 'active' && (
          <div className="hud-counter" aria-live="polite">
            {isHold ? (
              <>
                <span className="hud-number">{clock(display.seconds)}</span>
                <span className="hud-target">/ {clock(current.target)}</span>
                <span className="kicker">{t('workout.goodForm')}</span>
              </>
            ) : (
              <>
                <span className="hud-number" key={display.reps}>
                  {pad(display.reps)}
                </span>
                <span className="hud-target">/ {pad(current.target)}</span>
                {display.missed > 0 && (
                  <span className="kicker">{t('workout.missed', { count: display.missed })}</span>
                )}
              </>
            )}
          </div>
        )}
      </header>

      {stage === 'active' && display.banner && (
        <p className={`cue-banner${display.banner === 'goodRep' ? ' good' : ''}`} role="status">
          {t(`workout.cues.${display.banner}`)}
        </p>
      )}

      {camera.status === 'error' && (
        <div className="workout-card">
          <p className="camera-message">{t(`camera.errors.${camera.error}`)}</p>
          <button type="button" className="primary" onClick={camera.retry}>
            {t('camera.retry')}
          </button>
        </div>
      )}

      {stage === 'ready' && camera.status === 'running' && (
        <div className="workout-card">
          <span className="kicker">{t('workout.getReady')}</span>
          <p className="workout-tip">{t(`workout.position.${current.exercise}`)}</p>
          <span className="big-countdown" key={countdown}>
            {countdown}
          </span>
        </div>
      )}

      {stage === 'rest' && (
        <div className="workout-card">
          <span className="kicker">{t('workout.restTitle')}</span>
          <span className="big-countdown">{countdown}</span>
          {upNext && (
            <p className="workout-tip">
              {t('workout.upNext', { exercise: exerciseName(upNext.exercise) })}
            </p>
          )}
          <button type="button" className="secondary" onClick={nextSet}>
            {t('workout.skipRest')}
          </button>
        </div>
      )}

      {/* Always on screen, whatever else is happening. */}
      <button type="button" className="stop-button" onClick={stop}>
        <Hand aria-hidden="true" />
        {t('workout.stop')}
      </button>
    </div>
  );
}
