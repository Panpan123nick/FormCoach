// All saved data lives in ONE localStorage entry, so "clear all my data"
// is a single delete and nothing is ever sent off the device.

const STORAGE_KEY = 'formCoach';

// Bump this if the shape of saved data changes, so old saves don't break the app.
export const DATA_VERSION = 1;

export const DEFAULT_SETTINGS = {
  language: 'en',
  voiceOn: true,
  voiceName: null, // null = use the device's default voice
  voiceRate: 1,
  voiceVolume: 1,
  feedbackStyle: 'encouraging', // 'encouraging' | 'strict'
};

export function createDefaultData() {
  return {
    version: DATA_VERSION,
    survey: {
      answers: {}, // question id -> answer (see survey/questions.js)
      step: 0, // which question to resume on if the app is closed mid-survey
      completed: false,
    },
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();

    const saved = JSON.parse(raw);
    // Saves from an unknown version could have a different shape, so start fresh.
    // (When we change the format, we'll convert old saves here instead.)
    if (saved?.version !== DATA_VERSION) return createDefaultData();

    // Merge with defaults so settings added in later versions get a value.
    const defaults = createDefaultData();
    return {
      ...defaults,
      survey: { ...defaults.survey, ...saved.survey },
      settings: { ...defaults.settings, ...saved.settings },
    };
  } catch {
    // Broken JSON, or storage blocked (some private-browsing modes): use defaults.
    return createDefaultData();
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked. The app still works; it just won't remember.
  }
}

export function clearAllData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is blocked.
  }
}
