import { Stethoscope } from 'lucide-react';
import { useTranslation } from '../i18n/I18nProvider.jsx';

// Shown after the safety check if any answer was "Yes".
// We advise, but don't block: the user can still explore the app.
export default function SafetyNotice() {
  const { t } = useTranslation();
  return (
    <section className="notice" role="alert">
      <div className="notice-tape" aria-hidden="true" />
      <div className="notice-body">
        <div className="notice-icon" aria-hidden="true">
          <Stethoscope />
        </div>
        <h1>{t('survey.safetyNotice.title')}</h1>
        <p>{t('survey.safetyNotice.body')}</p>
        <p className="fine-print">{t('app.disclaimer')}</p>
      </div>
    </section>
  );
}
