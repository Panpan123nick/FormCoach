import { createContext, useContext, useEffect, useMemo } from 'react';
import { translate } from './translate.js';

// React "context" lets any component call useTranslation() without
// passing the language down through every component by hand.
const I18nContext = createContext({
  language: 'en',
  t: (key, vars) => translate('en', key, vars),
});

export function I18nProvider({ language, children }) {
  const value = useMemo(
    () => ({ language, t: (key, vars) => translate(language, key, vars) }),
    [language],
  );

  // Screen readers use the page's lang attribute to pick the right pronunciation.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  return useContext(I18nContext);
}
