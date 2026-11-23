import { ChevronLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Paper from '../components/Paper.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { useTranslation } from '../i18n/I18nProvider.jsx';
import { QUESTIONS } from './questions.js';
import QuestionScreen from './QuestionScreen.jsx';
import SafetyNotice from './SafetyNotice.jsx';
import SurveySummary from './SurveySummary.jsx';
import { firstUnansweredIndex, isAnswered, needsDoctorCheck } from './surveyLogic.js';

// After tapping a pick-one answer, wait this long before moving on,
// so the user sees their choice "pop".
const AUTO_ADVANCE_MS = 350;

const LAST_INDEX = QUESTIONS.length - 1;
const SAFETY_INDEX = QUESTIONS.findIndex((q) => q.id === 'safety');

// Controls the flow through the survey: which screen is showing,
// Back/Next, the safety notice, and the summary.
export default function Survey({ survey, setAnswer, updateSurvey }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { answers } = survey;

  // Which screen is showing:
  //   { type: 'question', index } – one survey question
  //   { type: 'safetyNotice' }    – the "check with a doctor" message
  //   { type: 'summary' }         – review all answers
  const [view, setView] = useState(() =>
    survey.completed
      ? { type: 'summary' }
      : { type: 'question', index: Math.min(survey.step, LAST_INDEX) },
  );

  // Which way the next screen slides in: 'forward' (from the right) or 'back' (from the left).
  const [direction, setDirection] = useState('forward');

  // True when the user tapped a row on the summary to change one answer.
  // Then Save/Back return to the summary instead of walking through every question.
  const [editing, setEditing] = useState(false);

  const advanceTimer = useRef(null);

  useEffect(() => {
    // Remember the current question, so closing the tab resumes here.
    if (view.type === 'question' && !survey.completed) updateSurvey({ step: view.index });
    // Phones keep the scroll position between screens; start each one at the top.
    window.scrollTo(0, 0);
    // If the screen changes (e.g. user hits Back) cancel any pending auto-advance.
    return () => clearTimeout(advanceTimer.current);
  }, [view, survey.completed, updateSurvey]);

  // Switch screens, remembering which way to slide.
  function go(nextView, dir = 'forward') {
    setDirection(dir);
    setView(nextView);
  }

  function showSummary(dir = 'forward') {
    setEditing(false);
    go({ type: 'summary' }, dir);
  }

  function goNext(index) {
    if (index === SAFETY_INDEX && needsDoctorCheck(answers)) {
      go({ type: 'safetyNotice' });
    } else if (editing || index === LAST_INDEX) {
      showSummary();
    } else {
      go({ type: 'question', index: index + 1 });
    }
  }

  function goBack() {
    if (view.type === 'safetyNotice') {
      go({ type: 'question', index: SAFETY_INDEX }, 'back');
    } else if (view.type === 'summary') {
      // A finished survey was opened from Home, so Back goes home.
      if (survey.completed) navigate('/home');
      else go({ type: 'question', index: LAST_INDEX }, 'back');
    } else if (editing) {
      showSummary('back');
    } else if (view.index > 0) {
      go({ type: 'question', index: view.index - 1 }, 'back');
    } else {
      // Back from the first question returns to the title screen.
      navigate('/');
    }
  }

  function continueAfterNotice() {
    if (editing) showSummary();
    else go({ type: 'question', index: SAFETY_INDEX + 1 });
  }

  function editQuestion(index) {
    setEditing(true);
    go({ type: 'question', index });
  }

  function finish() {
    // Safety net: if something is somehow unanswered, send the user there first.
    const missing = firstUnansweredIndex(QUESTIONS, answers);
    if (missing !== -1) {
      editQuestion(missing);
      return;
    }
    updateSurvey({ completed: true });
    navigate('/home');
  }

  const question = view.type === 'question' ? QUESTIONS[view.index] : null;

  function handleAnswer(newAnswer) {
    setAnswer(question.id, newAnswer);
    // Pick-one questions move on by themselves; others wait for the Next button.
    if (question.type === 'single') {
      clearTimeout(advanceTimer.current);
      const index = view.index;
      advanceTimer.current = setTimeout(() => goNext(index), AUTO_ADVANCE_MS);
    }
  }

  // How full the progress bar is: the safety notice counts as the safety question.
  let progress = QUESTIONS.length;
  if (view.type === 'question') progress = view.index + 1;
  if (view.type === 'safetyNotice') progress = SAFETY_INDEX + 1;

  const stepText = t('common.stepOf', { current: progress, total: QUESTIONS.length });

  return (
    <>
      <Paper />
      <div className="screen">
        <header className="screen-header fade-in">
          <div className="header-row">
            <button type="button" className="back-button" onClick={goBack}>
              <ChevronLeft size={20} aria-hidden="true" />
              <span className="kicker">{t('common.back')}</span>
            </button>
            {question && <span className="step-count kicker">{stepText}</span>}
          </div>
          <ProgressBar current={progress} total={QUESTIONS.length} label={stepText} />
        </header>

        {/* The key makes React rebuild this area on each screen, replaying the slide-in. */}
        <main className={`screen-body slide-${direction}`} key={question ? question.id : view.type}>
          {question && (
            <QuestionScreen
              question={question}
              answer={answers[question.id]}
              onAnswer={handleAnswer}
            />
          )}
          {view.type === 'safetyNotice' && <SafetyNotice />}
          {view.type === 'summary' && <SurveySummary answers={answers} onEdit={editQuestion} />}
        </main>

        <footer className="screen-footer">
          {question && (
            <button
              type="button"
              className="primary"
              disabled={!isAnswered(question, answers[question.id])}
              onClick={() => goNext(view.index)}
            >
              {editing ? t('common.save') : t('common.next')}
            </button>
          )}
          {view.type === 'safetyNotice' && (
            <button type="button" className="primary" onClick={continueAfterNotice}>
              {t('survey.safetyNotice.continue')}
            </button>
          )}
          {view.type === 'summary' && (
            <button type="button" className="primary" onClick={finish}>
              {t('survey.summary.done')}
            </button>
          )}
        </footer>
      </div>
    </>
  );
}
