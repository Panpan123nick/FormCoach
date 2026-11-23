import { ChevronRight } from 'lucide-react';
import { useTranslation } from '../i18n/I18nProvider.jsx';
import { QUESTIONS } from './questions.js';
import { isAnswered, needsDoctorCheck } from './surveyLogic.js';

// Lists every answer. Tapping a row calls onEdit(index) to jump to that question.
export default function SurveySummary({ answers, onEdit }) {
  const { t } = useTranslation();

  // Turn a saved answer into readable text, e.g. ['knees', 'back'] -> "Knees, Back".
  function describe(question) {
    const answer = answers[question.id];
    const base = `questions.${question.id}`;
    if (!isAnswered(question, answer)) return t('survey.summary.notAnswered');
    if (question.type === 'single') return t(`${base}.options.${answer}`);
    if (question.type === 'multi') return answer.map((o) => t(`${base}.options.${o}`)).join(', ');
    // yesno (the safety check): show one overall result instead of four answers.
    return needsDoctorCheck(answers)
      ? t('survey.summary.safetyFlagged')
      : t('survey.summary.safetyClear');
  }

  return (
    <section className="summary">
      <h1>{t('survey.summary.title')}</h1>
      <p className="hint">{t('survey.summary.subtitle')}</p>
      <ul className="summary-list">
        {QUESTIONS.map((question, index) => {
          const flagged = question.type === 'yesno' && needsDoctorCheck(answers);
          return (
            <li key={question.id} style={{ '--i': index }}>
              <button type="button" className="summary-row" onClick={() => onEdit(index)}>
                {/* Numbered like a printed checklist: 01, 02, ... */}
                <span className="summary-num" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="summary-text">
                  <span className="summary-label kicker">
                    {t(`questions.${question.id}.summaryLabel`)}
                  </span>
                  <span className={`summary-value${flagged ? ' warn' : ''}`}>
                    {describe(question)}
                  </span>
                </span>
                <ChevronRight className="chevron" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
