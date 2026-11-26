// Every exercise the app can recommend, and who it suits. The plan generator
// (workout/planGenerator.js) picks from this list using the survey answers.
// To add an exercise: add it here, add its tracker to exercises.js, and add its
// name, position tip and cues to i18n/en.json.
//
//   kind     'reps' (counted), 'hold' (form timer), or 'guided' (follow-along timer, no counting)
//   role     'main', or 'warmup' / 'cooldown' (added around the main exercises)
//   family   versions of the same exercise; a plan gets only the hardest one that fits
//   ages     age groups it's suitable for
//   levels   experience levels it's suitable for
//   goals    survey goals it helps with (more matches = picked first)
//   avoid    "go easy on" areas that rule it out
//   equipment  needed equipment, if any
//   base     reps (or seconds) per set for beginner / intermediate / advanced
//   tape     false = leave off the title screen's scrolling exercise list

const ALL_AGES = ['under13', '13to17', '18to39', '40to59', '60plus'];
const UNDER_40 = ['under13', '13to17', '18to39'];
const UNDER_60 = ['under13', '13to17', '18to39', '40to59'];
const ALL_LEVELS = ['beginner', 'intermediate', 'advanced'];

export const CATALOG = [
  // ---- Warm-up and cool-down (follow-along timers) ----
  {
    id: 'shoulderRolls',
    kind: 'guided',
    role: 'warmup',
    ages: ALL_AGES,
    levels: ALL_LEVELS,
    goals: ['flexibility'],
    avoid: [],
    base: { beginner: 30, intermediate: 30, advanced: 30 },
    tape: false,
  },
  {
    id: 'catStretch',
    kind: 'guided',
    role: 'cooldown',
    ages: ALL_AGES,
    levels: ALL_LEVELS,
    goals: ['flexibility'],
    avoid: ['wrists'], // you lean on your hands
    base: { beginner: 40, intermediate: 40, advanced: 40 },
    tape: false,
  },

  // ---- Main exercises ----
  // Push-ups come in three versions. Listed hardest first: the plan uses the
  // first one the person's age and level allow.
  {
    id: 'pushups',
    family: 'pushups',
    kind: 'reps',
    role: 'main',
    ages: UNDER_40,
    levels: ['advanced'],
    goals: ['stronger', 'endurance', 'sports', 'healthy', 'moreActive'],
    avoid: ['wrists', 'shoulders'],
    base: { beginner: 5, intermediate: 8, advanced: 15 },
  },
  {
    id: 'kneePushups',
    family: 'pushups',
    kind: 'reps',
    role: 'main',
    ages: UNDER_60,
    levels: ['intermediate', 'advanced'],
    goals: ['stronger', 'endurance', 'sports', 'healthy', 'moreActive'],
    avoid: ['wrists', 'shoulders'],
    base: { beginner: 6, intermediate: 10, advanced: 14 },
    tape: false,
  },
  {
    id: 'wallPushups',
    family: 'pushups',
    kind: 'reps',
    role: 'main',
    ages: ALL_AGES,
    levels: ALL_LEVELS,
    goals: ['stronger', 'endurance', 'healthy', 'moreActive'],
    avoid: ['wrists', 'shoulders'],
    base: { beginner: 8, intermediate: 12, advanced: 15 },
    tape: false,
  },
  {
    id: 'squats',
    kind: 'reps',
    role: 'main',
    ages: ALL_AGES,
    levels: ALL_LEVELS,
    goals: ['stronger', 'endurance', 'sports', 'healthy', 'moreActive'],
    avoid: [], // "go easy on knees" makes them shallower instead
    base: { beginner: 10, intermediate: 15, advanced: 20 },
  },
  {
    id: 'gluteBridges',
    kind: 'reps',
    role: 'main',
    ages: ALL_AGES,
    levels: ['beginner', 'intermediate'],
    goals: ['stronger', 'healthy', 'moreActive'],
    avoid: ['back', 'knees'],
    base: { beginner: 8, intermediate: 12, advanced: 15 },
  },
  {
    id: 'legRaises',
    kind: 'reps',
    role: 'main',
    ages: ALL_AGES,
    levels: ['beginner', 'intermediate'],
    goals: ['flexibility', 'healthy', 'moreActive'],
    avoid: [],
    base: { beginner: 10, intermediate: 14, advanced: 18 }, // total, switching sides halfway
  },
  {
    id: 'situps',
    kind: 'reps',
    role: 'main',
    ages: UNDER_60,
    levels: ['intermediate', 'advanced'],
    goals: ['stronger', 'endurance', 'sports', 'healthy'],
    avoid: ['back', 'neck'], // sit-ups often strain the neck
    base: { beginner: 8, intermediate: 12, advanced: 18 },
  },
  {
    id: 'lunges',
    kind: 'reps',
    role: 'main',
    ages: UNDER_60,
    levels: ['intermediate', 'advanced'],
    goals: ['stronger', 'endurance', 'sports', 'healthy', 'moreActive'],
    avoid: ['knees'],
    base: { beginner: 8, intermediate: 12, advanced: 16 }, // total, alternating legs
  },
  {
    id: 'plank',
    kind: 'hold',
    role: 'main',
    ages: UNDER_60,
    levels: ['intermediate', 'advanced'],
    goals: ['stronger', 'endurance', 'sports'],
    avoid: ['shoulders'], // on forearms, so wrists are fine
    base: { beginner: 20, intermediate: 35, advanced: 50 },
  },
  {
    id: 'pullUps',
    kind: 'reps',
    role: 'main',
    ages: UNDER_40,
    levels: ['advanced'],
    goals: ['stronger', 'endurance', 'sports', 'healthy'],
    avoid: ['shoulders', 'wrists'],
    equipment: 'pullupBar',
    base: { beginner: 2, intermediate: 4, advanced: 6 },
  },
];

export const EXERCISE = Object.fromEntries(CATALOG.map((e) => [e.id, e]));
