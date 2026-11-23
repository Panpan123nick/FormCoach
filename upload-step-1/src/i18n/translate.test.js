import { describe, expect, it } from 'vitest';
import { translate } from './translate.js';

describe('translate', () => {
  it('finds nested text', () => {
    expect(translate('en', 'questions.ageRange.options.60plus')).toBe('60+');
  });

  it('fills in {placeholders}', () => {
    expect(translate('en', 'common.stepOf', { current: 2, total: 9 })).toBe('Question 2 of 9');
  });

  it('falls back to English for an unknown language', () => {
    expect(translate('xx', 'common.next')).toBe('Next');
  });

  it('shows the key itself when text is missing', () => {
    expect(translate('en', 'does.not.exist')).toBe('does.not.exist');
  });
});
