import { Link, Navigate } from 'react-router-dom';
import Paper from '../components/Paper.jsx';
import { useTranslation } from '../i18n/I18nProvider.jsx';
import { needsDoctorCheck } from '../survey/surveyLogic.js';

// Confetti pieces: where each one flies (dx, dy), how much it spins, and its color.
// Spread evenly around a circle so the burst looks balanced.
const CONFETTI_COLORS = ['var(--red)', 'var(--ink)'];
const CONFETTI = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2;
  const distance = 70 + (i % 3) * 18;
  return {
    dx: `${Math.round(Math.cos(angle) * distance)}px`,
    dy: `${Math.round(Math.sin(angle) * distance)}px`,
    r: `${(i % 2 ? 1 : -1) * (120 + i * 25)}deg`,
    c: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  };
});

// Placeholder home screen for Phase 1. Camera setup and workouts get linked here later.
export default function Home({ survey }) {
  const { t } = useTranslation();

  // Nobody should land here before finishing the survey.
  if (!survey.completed) return <Navigate to="/survey" replace />;

  const { answers } = survey;

  return (
    <>
      <Paper />
      <div className="screen">
        <main className="screen-body fade-in">
          <section className="home">
            <div className="celebrate" aria-hidden="true">
              {CONFETTI.map((piece, i) => (
                <span
                  key={i}
                  className="confetti"
                  style={{ '--dx': piece.dx, '--dy': piece.dy, '--r': piece.r, '--c': piece.c }}
                />
              ))}
              <div className="stamp">{t('home.stamp')}</div>
            </div>
            <h1>{t('home.title')}</h1>
            <p>{t('home.body')}</p>

            {needsDoctorCheck(answers) && (
              <p className="callout warn">{t('survey.safetyNotice.body')}</p>
            )}
            {answers.ageRange === 'under13' && <p className="callout">{t('home.guardian')}</p>}

            <p className="fine-print">{t('app.privacy')}</p>
            <p className="fine-print">{t('app.disclaimer')}</p>
          </section>
        </main>
        <footer className="screen-footer home-actions">
          <Link to="/workout" className="primary">
            {t('home.start')}
          </Link>
          <Link to="/setup" className="secondary">
            {t('home.setup')}
          </Link>
          <Link to="/survey" className="secondary">
            {t('home.review')}
          </Link>
        </footer>
      </div>
    </>
  );
}
