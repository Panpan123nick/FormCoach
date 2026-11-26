import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PoseFigure from '../components/PoseFigure.jsx';
import { useTranslation } from '../i18n/I18nProvider.jsx';
import { CATALOG } from '../exercises/catalog.js';

// How long the ink-wipe transition plays before switching screens.
const WIPE_MS = 800;

// The exercises the app can coach, for the scrolling tape. Taken from the
// exercise catalog so the two lists can never disagree.
const TAPE_EXERCISES = CATALOG.filter((e) => e.tape !== false).map((e) => e.id);

// The title screen, designed like a two-color printed gym poster.
// The mascot squats and a counter ticks up with each rep, which shows
// what the app does without needing a paragraph to explain it.
// Tap anywhere (or the sticker) and colored bands wipe across into the survey.
export default function TitleScreen({ surveyDone }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [reps, setReps] = useState(0);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const destination = surveyDone ? '/home' : '/survey';

  function start() {
    if (starting) return; // ignore extra taps while the wipe plays

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      navigate(destination);
      return;
    }
    setStarting(true);
    timer.current = setTimeout(() => navigate(destination), WIPE_MS);
  }

  // On a laptop, Enter or Space starts too. (If the sticker button has focus,
  // the browser already turns Enter/Space into a click, so skip it here.)
  useEffect(() => {
    function onKey(event) {
      if ((event.key === 'Enter' || event.key === ' ') && !document.activeElement?.matches('button')) {
        event.preventDefault();
        start();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const nameLines = t('app.name').split(' ');
  const stickerText = surveyDone ? t('title.stickerContinue') : t('title.sticker');
  // Text that runs around the sticker's edge, repeated to fill the circle.
  const ringText = `${stickerText} • ${stickerText} • `.toUpperCase();
  // The tape text is written twice in a row; sliding it left by exactly one
  // copy and starting over makes the loop look endless.
  const tapeText = `${TAPE_EXERCISES.map((e) => t(`exercises.names.${e}`)).join('  /  ')}  /  `;

  return (
    <div className={`title-screen${starting ? ' starting' : ''}`} onClick={start}>
      <div className="poster">
        <header className="poster-top">
          <span>{t('title.kicker')}</span>
          <span>{t('title.issue')}</span>
        </header>

        <div className="poster-hero">
          <h1 className="poster-title" aria-label={t('app.name')}>
            {nameLines.map((line, i) => (
              <span key={line} className="poster-line" style={{ '--i': i }} aria-hidden="true">
                {/* data-text lets CSS print a second, offset copy in the other ink color. */}
                <span className="ink" data-text={line}>
                  {line}
                </span>
              </span>
            ))}
          </h1>

          {/* Under the title: the rep counter on the left, the mascot on the right. */}
          <div className="poster-stage">
            <div className="rep-counter" aria-hidden="true">
              <span className="rep-label">{t('title.reps')}</span>
              {/* Changing the key restarts the "pop" animation on every new rep. */}
              <span className="rep-number" key={reps}>
                {String(reps).padStart(2, '0')}
              </span>
            </div>

            <div className="poster-figure">
              <div className="halftone" aria-hidden="true" />
              <PoseFigure animate onRep={setReps} />
            </div>
          </div>
        </div>

        <div className="tape" aria-hidden="true">
          <div className="tape-track">
            <span>{tapeText}</span>
            <span>{tapeText}</span>
          </div>
        </div>

        <footer className="poster-bottom">
          <div>
            <ol className="poster-points">
              {['reps', 'form', 'voice'].map((key, i) => (
                <li key={key} style={{ '--i': i }}>
                  <span className="point-num">0{i + 1}</span>
                  {t(`title.points.${key}`)}
                </li>
              ))}
            </ol>
            <p className="poster-privacy">{t('title.privacy')}</p>
          </div>

          <button type="button" className="sticker" aria-label={stickerText}>
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <defs>
                {/* A circle-shaped path for the text to follow. */}
                <path id="sticker-ring" d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" />
              </defs>
              <text className="sticker-ring">
                <textPath href="#sticker-ring" textLength="280">
                  {ringText}
                </textPath>
              </text>
            </svg>
            <span className="sticker-go" aria-hidden="true">
              {t('title.go')}
            </span>
          </button>
        </footer>
      </div>

      {starting && (
        <div className="poster-wipe" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
