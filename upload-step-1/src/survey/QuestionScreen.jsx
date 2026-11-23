import OptionButton from '../components/OptionButton.jsx';
import { useTranslation } from '../i18n/I18nProvider.jsx';
import { OPTION_ICONS, QUESTION_ICONS } from './questionIcons.js';
import { toggleMulti } from './surveyLogic.js';

// Renders ONE question of any type. `answer` is the current saved answer;
// `onAnswer(newAnswer)` saves a change. For multi and yes/no questions we pass
// a function (latest => newAnswer) instead, so fast taps build on each other
// rather than on an answer that's already out of date.
export default function QuestionScreen({ question, answer, onAnswer }) {
  const { t } = useTranslation();
  const base = `questions.${question.id}`;
  const titleId = `q-${question.id}-title`;
  const BadgeIcon = QUESTION_ICONS[question.id];
  const optionIcons = OPTION_ICONS[question.id] ?? {};

  // Lines under the title: every multi-select question says "Select all that apply",
  // and some questions add their own hint as well (e.g. equipment).
  const hints = [];
  if (question.type === 'multi') hints.push(t('common.selectAll'));
  if (question.hint) hints.push(t(`${base}.hint`));

  return (
    <section className="question">
      {BadgeIcon && (
        <div className="q-badge" aria-hidden="true">
          <BadgeIcon />
        </div>
      )}
      <h1 id={titleId}>{t(`${base}.title`)}</h1>
      {hints.map((text) => (
        <p key={text} className="hint">
          {text}
        </p>
      ))}

      {question.type === 'single' && (
        <div className="options" role="radiogroup" aria-labelledby={titleId}>
          {question.options.map((option, i) => (
            <OptionButton
              key={option}
              index={i}
              label={t(`${base}.options.${option}`)}
              selected={answer === option}
              onClick={() => onAnswer(option)}
            />
          ))}
        </div>
      )}

      {question.type === 'multi' && (
        <div className="options" role="group" aria-labelledby={titleId}>
          {question.options.map((option, i) => (
            <OptionButton
              key={option}
              index={i}
              role="checkbox"
              icon={optionIcons[option]}
              label={t(`${base}.options.${option}`)}
              tag={question.comingSoon?.includes(option) ? t('common.comingSoon') : null}
              selected={answer?.includes(option) ?? false}
              onClick={() => onAnswer((latest) => toggleMulti(latest, option, question.exclusive))}
            />
          ))}
        </div>
      )}

      {question.type === 'yesno' && (
        <div className="yesno-list">
          {question.items.map((item, i) => {
            const itemId = `q-${question.id}-${item}`;
            return (
              <div className="yesno-item" key={item} style={{ '--i': i }}>
                <p id={itemId}>{t(`${base}.items.${item}`)}</p>
                <div className="yesno-buttons" role="radiogroup" aria-labelledby={itemId}>
                  {['yes', 'no'].map((value) => (
                    <OptionButton
                      key={value}
                      label={t(`common.${value}`)}
                      selected={answer?.[item] === value}
                      onClick={() => onAnswer((latest) => ({ ...latest, [item]: value }))}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
