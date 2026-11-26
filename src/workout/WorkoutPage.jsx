import { ChevronLeft, Hand, Phone } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Paper from '../components/Paper.jsx';
import { useTranslation } from '../i18n/I18nProvider.jsx';
import { needsDoctorCheck } from '../survey/surveyLogic.js';
import { unlockSpeech } from '../voice/speech.js';
import { generatePlan, isLenient } from './planGenerator.js';
import WorkoutSession from './WorkoutSession.jsx';

// How the amount is written for each kind of exercise, e.g. "2 × 12 reps".
const AMOUNT_TEXT = { reps: 'workout.sets', hold: 'workout.setsHold', guided: 'workout.setsGuided' };

// The workout route: shows today's plan, runs the session, then shows either
// the results or (if STOP was pressed) the safety message.
export default function WorkoutPage({ survey, settings }) {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [view, setView] = useState('plan'); // 'plan' | 'session' | 'stopped' | 'done'
  const [results, setResults] = useState(null);

  const { answers } = survey;
  const plan = useMemo(() => generatePlan(answers), [answers]);
  const options = useMemo(
    () => ({ lenient: isLenient(answers), easyKnees: answers.easyAreas?.includes('knees') }),
    [answers],
  );

  if (!survey.completed) return <Navigate to="/survey" replace />;

  if (view === 'session') {
    return (
      <WorkoutSession
        plan={plan}
        options={options}
        settings={settings}
        language={language}
        onStop={() => setView('stopped')}
        onDone={(r) => {
          setResults(r);
          setView('done');
        }}
      />
    );
  }

  if (view === 'stopped') return <StoppedScreen />;
  if (view === 'done') return <DoneScreen plan={plan} results={results} />;

  function start() {
    unlockSpeech(); // must happen during a tap, or phones keep the voice muted
    setView('session');
  }

  return (
    <>
      <Paper />
      <div className="screen">
        <header className="screen-header fade-in">
          <div className="header-row">
            <button type="button" className="back-button" onClick={() => navigate('/home')}>
              <ChevronLeft size={20} aria-hidden="true" />
              <span className="kicker">{t('common.back')}</span>
            </button>
          </div>
        </header>
        <main className="screen-body fade-in">
          <h1>{t('workout.planTitle')}</h1>
          <p className="hint">{t('workout.planSub')}</p>
          {needsDoctorCheck(answers) && (
            <p className="callout warn">{t('survey.safetyNotice.body')}</p>
          )}
          <ul className="summary-list">
            {plan.map((item, i) => (
              <li key={item.exercise} style={{ '--i': i }}>
                <div className="summary-row plan-row">
                  <span className="summary-num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="summary-text">
                    <span className="summary-value">
                      {t(`exercises.names.${item.exercise}`)}
                      {item.role !== 'main' && <span className="tag">{t(`workout.${item.role}`)}</span>}
                    </span>
                    <span className="summary-label kicker">
                      {t(AMOUNT_TEXT[item.kind], item)}
                    </span>
                    {item.role === 'main' && item.goals.length > 0 && (
                      <span className="plan-why">
                        {t('workout.goodFor', {
                          goals: item.goals.map((g) => t(`questions.goals.options.${g}`)).join(', '),
                        })}
                      </span>
                    )}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <p className="fine-print">
            {t('workout.rest', { seconds: plan.find((p) => p.role === 'main')?.restSeconds })}
          </p>
          <p className="callout">{t('workout.sideOn')}</p>
        </main>
        <footer className="screen-footer">
          <button type="button" className="primary" onClick={start}>
            {t('workout.start')}
          </button>
        </footer>
      </div>
    </>
  );
}

// Shown right after STOP / I feel pain. The camera is already off.
function StoppedScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Paper />
      <div className="screen">
        <main className="screen-body fade-in">
          <section className="notice stopped" role="alert">
            <div className="notice-tape" aria-hidden="true" />
            <div className="notice-body">
              <div className="notice-icon" aria-hidden="true">
                <Hand />
              </div>
              <h1>{t('workout.stopped.title')}</h1>
              <p>{t('workout.stopped.body')}</p>
              <p className="emergency">
                <Phone size={18} aria-hidden="true" />
                <span>{t('workout.stopped.emergency')}</span>
              </p>
              <p className="fine-print">{t('workout.stopped.doctor')}</p>
            </div>
          </section>
        </main>
        <footer className="screen-footer">
          <Link to="/home" className="primary">
            {t('workout.home')}
          </Link>
        </footer>
      </div>
    </>
  );
}

function DoneScreen({ plan, results }) {
  const { t } = useTranslation();
  return (
    <>
      <Paper />
      <div className="screen">
        <main className="screen-body fade-in home">
          <div className="celebrate" aria-hidden="true">
            <div className="stamp">{t('workout.done.stamp')}</div>
          </div>
          <h1>{t('workout.done.title')}</h1>
          <ul className="summary-list">
            {plan.map((item, i) => {
              const r = results?.[item.exercise] ?? { reps: 0, missed: 0, seconds: 0 };
              return (
                <li key={item.exercise} style={{ '--i': i }}>
                  <div className="summary-row plan-row">
                    <span className="summary-num" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="summary-text">
                      <span className="summary-value">
                        {t(`exercises.names.${item.exercise}`)}
                      </span>
                      <span className="summary-label kicker">
                        {item.kind === 'guided'
                          ? t('workout.done.followed', { seconds: r.seconds })
                          : item.kind === 'hold'
                          ? t('workout.done.held', { seconds: r.seconds })
                          : `${t('workout.done.reps', { reps: r.reps })}${
                              r.missed ? ` · ${t('workout.done.missed', { count: r.missed })}` : ''
                            }`}
                      </span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </main>
        <footer className="screen-footer">
          <Link to="/home" className="primary">
            {t('workout.home')}
          </Link>
        </footer>
      </div>
    </>
  );
}
