// A tiny translation helper. Every piece of on-screen text lives in a JSON file
// per language. To add a language, add a JSON file and list it in DICTIONARIES.
import en from './en.json';

const DICTIONARIES = { en };

export const SUPPORTED_LANGUAGES = Object.keys(DICTIONARIES);

// Follow a dotted key like "questions.ageRange.title" through nested objects.
function lookup(dictionary, key) {
  const value = key.split('.').reduce((node, part) => node?.[part], dictionary);
  return typeof value === 'string' ? value : undefined;
}

/**
 * translate('en', 'common.stepOf', { current: 2, total: 9 }) -> "Question 2 of 9"
 * Falls back to English if a translation is missing, then to the key itself
 * (so a missing string is easy to spot on screen instead of showing nothing).
 */
export function translate(language, key, vars = {}) {
  const text = lookup(DICTIONARIES[language], key) ?? lookup(DICTIONARIES.en, key) ?? key;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}
