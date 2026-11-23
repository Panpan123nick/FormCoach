import { useEffect, useState } from 'react';
import PoseFigure from '../components/PoseFigure.jsx';
import { useTranslation } from '../i18n/I18nProvider.jsx';

// How long the boot animation plays, then how long it takes to fade away.
// Kept short on purpose: people open this app to exercise, not to watch a logo.
const SHOW_MS = 2100;
const EXIT_MS = 500;

/**
 * The opening animation: the mascot's joints pop in, its bones draw in, it
 * hops, and the name appears. Tapping skips it.
 * onLeave() fires when the fade-out starts (so the next screen can appear
 * underneath), onDone() when it's fully gone.
 */
export default function BootScreen({ onLeave, onDone }) {
  const { t } = useTranslation();
  const [leaving, setLeaving] = useState(false);

  // Start fading out after SHOW_MS (or right away for reduced-motion users).
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setLeaving(true), reduceMotion ? 0 : SHOW_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    onLeave();
    const timer = setTimeout(onDone, EXIT_MS);
    return () => clearTimeout(timer);
  }, [leaving, onLeave, onDone]);

  const name = t('app.name');

  return (
    <div
      className={`boot${leaving ? ' leaving' : ''}`}
      onClick={() => setLeaving(true)}
      role="status"
      aria-label={t('boot.loading')}
    >
      <PoseFigure className="assemble" />
      <p className="boot-title" aria-hidden="true">
        {[...name].map((letter, i) => (
          <span key={i} style={{ '--i': i }}>
            {letter === ' ' ? ' ' : letter}
          </span>
        ))}
      </p>
      <div className="boot-bar">
        <span />
      </div>
    </div>
  );
}
