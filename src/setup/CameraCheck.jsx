import { Check, ChevronLeft, Lock } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/I18nProvider.jsx';
import { BODY_PARTS, checkFullBody } from '../pose/bodyCheck.js';
import { usePoseCamera } from '../pose/usePoseCamera.js';

// The whole body must stay in view this long before we call it good,
// so a single lucky frame doesn't count.
const HOLD_MS = 1500;

// Live camera check: shows the camera with the tracked skeleton on top, says
// which body parts it can see, and gives one tip at a time until the whole
// body is in frame. All processing happens on this device.
export default function CameraCheck() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [check, setCheck] = useState({ status: 'noPerson', seen: {} });
  const [ready, setReady] = useState(false);

  // Per-frame bookkeeping lives in a ref: it changes 30 times a second and
  // doesn't need to redraw the screen each time.
  const tracking = useRef({ okSince: null, lastKey: '', ready: false });

  const camera = usePoseCamera(videoRef, canvasRef, (pose, now) => {
    const state = tracking.current;
    if (state.ready) return;
    const next = checkFullBody(pose);

    if (next.status === 'ok') {
      state.okSince ??= now;
      if (now - state.okSince >= HOLD_MS) {
        state.ready = true;
        setReady(true);
      }
    } else {
      state.okSince = null;
    }
    // Only update React when the advice changes, not 30 times a second.
    const key = `${next.status}|${Object.values(next.seen).join()}`;
    if (key !== state.lastKey) {
      state.lastKey = key;
      setCheck(next);
    }
  });

  function retry() {
    tracking.current = { okSince: null, lastKey: '', ready: false };
    setReady(false);
    camera.retry();
  }

  const loading = camera.status === 'starting' || camera.status === 'loading';

  return (
    <div className="camera-screen">
      <div className="camera-stage">
        {/* playsInline + muted are required for live video on iPhones. */}
        <video ref={videoRef} className="camera-video" playsInline muted />
        <canvas ref={canvasRef} className="camera-overlay" aria-hidden="true" />
        {loading && (
          <div className="camera-loading" role="status">
            <span className="camera-spinner" aria-hidden="true" />
            {camera.status === 'starting' ? t('camera.starting') : t('camera.loading')}
          </div>
        )}
      </div>

      <header className="camera-top">
        <button type="button" className="back-button" onClick={() => navigate('/setup')}>
          <ChevronLeft size={20} aria-hidden="true" />
          <span className="kicker">{t('common.back')}</span>
        </button>
        <span className="camera-title kicker">{t('camera.title')}</span>
      </header>

      <section className="camera-panel" aria-live="polite">
        {camera.status === 'error' && (
          <>
            <p className="camera-message">{t(`camera.errors.${camera.error}`)}</p>
            <button type="button" className="primary" onClick={retry}>
              {t('camera.retry')}
            </button>
          </>
        )}

        {camera.status === 'running' && !ready && (
          <>
            <p className="camera-message">{t(`camera.status.${check.status}`)}</p>
            <ul className="body-parts">
              {Object.keys(BODY_PARTS).map((part) => (
                <li key={part} className={check.seen[part] ? 'seen' : ''}>
                  {check.seen[part] && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                  {t(`camera.parts.${part}`)}
                </li>
              ))}
            </ul>
          </>
        )}

        {ready && (
          <div className="camera-ready">
            <div className="stamp small">{t('camera.stamp')}</div>
            <p className="camera-message">{t('camera.readyTitle')}</p>
            <p className="camera-sub">{t('camera.readyBody')}</p>
            <button type="button" className="primary" onClick={() => navigate('/workout')}>
              {t('camera.startWorkout')}
            </button>
          </div>
        )}

        <p className="camera-privacy">
          <Lock size={13} aria-hidden="true" /> {t('camera.privacy')}
        </p>
      </section>
    </div>
  );
}
