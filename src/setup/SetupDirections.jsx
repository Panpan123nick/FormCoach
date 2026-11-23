import { Check, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Paper from '../components/Paper.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { useTranslation } from '../i18n/I18nProvider.jsx';
import { ClearSpace, RotatePhone, StepBack } from './SetupIllustrations.jsx';
import { useMediaQuery } from './useMediaQuery.js';

const STEPS = [
  { id: 'rotate', Illustration: RotatePhone },
  { id: 'stepBack', Illustration: StepBack },
  { id: 'space', Illustration: ClearSpace },
];

// Three animated "how to set up" cards, shown one at a time, before the camera check.
export default function SetupDirections() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState('forward');

  // "pointer: coarse" means a touch screen, a good sign this is a phone or tablet.
  const isTouch = useMediaQuery('(pointer: coarse)');
  const isLandscape = useMediaQuery('(orientation: landscape)');

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const base = `setup.steps.${step.id}`;

  function goBack() {
    if (index === 0) {
      navigate('/home');
    } else {
      setDirection('back');
      setIndex(index - 1);
    }
  }

  function goNext() {
    if (isLast) {
      navigate('/setup/camera');
    } else {
      setDirection('forward');
      setIndex(index + 1);
    }
  }

  // On the "turn sideways" step we can actually tell whether the phone is sideways.
  let rotateStatus = null;
  if (step.id === 'rotate') {
    if (!isTouch) rotateStatus = { done: false, text: t(`${base}.statusLaptop`) };
    else if (isLandscape) rotateStatus = { done: true, text: t(`${base}.statusLandscape`) };
    else rotateStatus = { done: false, text: t(`${base}.statusPortrait`) };
  }

  const stepText = t('setup.kicker', { current: index + 1, total: STEPS.length });

  return (
    <>
      <Paper />
      <div className="screen setup-screen">
        <header className="screen-header fade-in">
          <div className="header-row">
            <button type="button" className="back-button" onClick={goBack}>
              <ChevronLeft size={20} aria-hidden="true" />
              <span className="kicker">{t('common.back')}</span>
            </button>
            <span className="step-count kicker">{stepText}</span>
          </div>
          <ProgressBar current={index + 1} total={STEPS.length} label={stepText} />
        </header>

        <main className={`screen-body setup-step slide-${direction}`} key={step.id}>
          <step.Illustration />
          <h1>{t(`${base}.title`)}</h1>
          <p className="setup-body">{t(`${base}.body`)}</p>
          {rotateStatus && (
            <p className={`setup-status${rotateStatus.done ? ' done' : ''}`} role="status">
              {rotateStatus.done && <Check size={18} aria-hidden="true" />}
              {rotateStatus.text}
            </p>
          )}
        </main>

        <footer className="screen-footer">
          <button type="button" className="primary" onClick={goNext}>
            {isLast ? t('setup.startCheck') : t('common.next')}
          </button>
        </footer>
      </div>
    </>
  );
}
