import { beforeEach, describe, expect, it } from 'vitest';
import { clearAllData, createDefaultData, DATA_VERSION, loadData, saveData } from './storage.js';

beforeEach(() => localStorage.clear());

describe('storage', () => {
  it('returns defaults when nothing is saved', () => {
    expect(loadData()).toEqual(createDefaultData());
  });

  it('saves and loads the same data', () => {
    const data = createDefaultData();
    data.survey.answers.ageRange = '13to17';
    data.survey.step = 3;
    saveData(data);
    expect(loadData()).toEqual(data);
  });

  it('falls back to defaults if saved data is broken', () => {
    localStorage.setItem('formCoach', '{not valid json');
    expect(loadData()).toEqual(createDefaultData());
  });

  it('ignores saves from a different version', () => {
    localStorage.setItem('formCoach', JSON.stringify({ version: DATA_VERSION + 1, survey: {} }));
    expect(loadData()).toEqual(createDefaultData());
  });

  it('fills in settings that are missing from an older save', () => {
    localStorage.setItem(
      'formCoach',
      JSON.stringify({ version: DATA_VERSION, survey: {}, settings: { language: 'es' } }),
    );
    const data = loadData();
    expect(data.settings.language).toBe('es');
    expect(data.settings.voiceOn).toBe(true);
  });

  it('clearAllData removes everything', () => {
    saveData(createDefaultData());
    clearAllData();
    expect(localStorage.getItem('formCoach')).toBeNull();
  });
});
