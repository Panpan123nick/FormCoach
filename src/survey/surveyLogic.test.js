import { describe, expect, it } from 'vitest';
import en from '../i18n/en.json';
import { QUESTIONS } from './questions.js';
import { firstUnansweredIndex, isAnswered, needsDoctorCheck, sanitizeAnswers, toggleMulti } from './surveyLogic.js';

const byId = (id) => QUESTIONS.find((q) => q.id === id);

describe('toggleMulti', () => {
  it('adds and removes options', () => {
    expect(toggleMulti([], 'knees')).toEqual(['knees']);
    expect(toggleMulti(['knees'], 'back')).toEqual(['knees', 'back']);
    expect(toggleMulti(['knees', 'back'], 'knees')).toEqual(['back']);
  });

  it('picking the exclusive option clears everything else', () => {
    expect(toggleMulti(['knees', 'back'], 'none', 'none')).toEqual(['none']);
  });

  it('picking another option clears the exclusive one', () => {
    expect(toggleMulti(['none'], 'knees', 'none')).toEqual(['knees']);
  });

  it('handles a missing (undefined) answer', () => {
    expect(toggleMulti(undefined, 'squats')).toEqual(['squats']);
  });
});

describe('isAnswered', () => {
  it('single: needs one of the listed options', () => {
    const q = byId('ageRange');
    expect(isAnswered(q, undefined)).toBe(false);
    expect(isAnswered(q, 'not-an-option')).toBe(false);
    expect(isAnswered(q, '18to39')).toBe(true);
  });

  it('multi: needs at least one choice', () => {
    const q = byId('goals');
    expect(isAnswered(q, [])).toBe(false);
    expect(isAnswered(q, ['stronger'])).toBe(true);
  });

  it('yesno: needs every item answered', () => {
    const q = byId('safety');
    expect(isAnswered(q, { heartCondition: 'no' })).toBe(false);
    const all = Object.fromEntries(q.items.map((item) => [item, 'no']));
    expect(isAnswered(q, all)).toBe(true);
  });
});

describe('needsDoctorCheck', () => {
  it('is false when every safety answer is no', () => {
    expect(needsDoctorCheck({ safety: { heartCondition: 'no', chestPain: 'no' } })).toBe(false);
  });

  it('is true when any safety answer is yes', () => {
    expect(needsDoctorCheck({ safety: { heartCondition: 'no', chestPain: 'yes' } })).toBe(true);
  });

  it('is false before the safety question is answered', () => {
    expect(needsDoctorCheck({})).toBe(false);
  });
});

describe('firstUnansweredIndex', () => {
  it('finds the first gap, or -1 when complete', () => {
    expect(firstUnansweredIndex(QUESTIONS, {})).toBe(0);
    expect(firstUnansweredIndex(QUESTIONS, { ageRange: '60plus' })).toBe(1);
  });
});

// Catches typos: every question and option must have English text,
// otherwise the screen would show a raw key like "questions.goals.options.x".
describe('translations', () => {
  const get = (key) => key.split('.').reduce((node, part) => node?.[part], en);

  it.each(QUESTIONS)('$id has all its text in en.json', (q) => {
    const base = `questions.${q.id}`;
    expect(get(`${base}.title`)).toBeTypeOf('string');
    expect(get(`${base}.summaryLabel`)).toBeTypeOf('string');
    if (q.hint) expect(get(`${base}.hint`)).toBeTypeOf('string');
    for (const option of q.options ?? []) {
      expect(get(`${base}.options.${option}`)).toBeTypeOf('string');
    }
    for (const item of q.items ?? []) {
      expect(get(`${base}.items.${item}`)).toBeTypeOf('string');
    }
  });
});

describe('sanitizeAnswers', () => {
  it('drops options that no longer exist and keeps the rest', () => {
    const clean = sanitizeAnswers(QUESTIONS, { goals: ['loseWeight', 'stronger'], ageRange: '18to39' });
    expect(clean).toEqual({ goals: ['stronger'], ageRange: '18to39' });
  });

  it('makes a question unanswered if nothing valid is left', () => {
    expect(sanitizeAnswers(QUESTIONS, { goals: ['loseWeight'] })).toEqual({});
  });
});
