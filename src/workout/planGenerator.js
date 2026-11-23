// Builds a simple workout plan from the survey answers. It's a set of plain,
// cautious rules (not AI): easy to explain, easy to check, and it can only
// ever make a workout gentler when there's a reason to be careful.

// Starting amounts per set for an 18–39-year-old who is active 3–4 days a week.
// Reps for rep exercises, seconds for the plank.
const BASE = {
  pushups: { beginner: 6, intermediate: 10, advanced: 15 },
  situps: { beginner: 8, intermediate: 12, advanced: 18 },
  squats: { beginner: 10, intermediate: 15, advanced: 20 },
  plank: { beginner: 20, intermediate: 35, advanced: 50 },
};

const AGE_FACTOR = { under13: 0.7, '13to17': 0.9, '18to39': 1, '40to59': 0.9, '60plus': 0.7 };
const ACTIVITY_FACTOR = { 0: 0.8, '1to2': 0.9, '3to4': 1, '5plus': 1.1 };
const SETS_FOR_LENGTH = { '5to10': 1, '15to20': 2, '30plus': 3 };
const REST_SECONDS = { beginner: 60, intermediate: 45, advanced: 30 };

// Body areas to go easy on, and which exercises load them.
const EASY_AREA_FACTOR = {
  knees: { squats: 0.7 },
  back: { situps: 0.6, plank: 0.8 },
  shoulders: { pushups: 0.7, plank: 0.8 },
  wrists: { pushups: 0.7 },
  neck: { situps: 0.7 },
};

export const EXERCISE_KIND = { pushups: 'reps', situps: 'reps', squats: 'reps', plank: 'hold' };

/** True if the user said yes to any safety question. */
const safetyFlagged = (answers) => Object.values(answers.safety ?? {}).includes('yes');

/**
 * Returns a list like:
 *   [{ exercise: 'squats', kind: 'reps', sets: 2, target: 12, restSeconds: 45 }, ...]
 * `target` is reps per set, or seconds per set for the plank.
 */
export function generatePlan(answers) {
  const experience = answers.experience ?? 'beginner';
  const exercises = answers.exercises?.length ? answers.exercises : ['squats'];
  const careful = safetyFlagged(answers);

  let sets = SETS_FOR_LENGTH[answers.workoutLength] ?? 1;
  if (answers.goals?.includes('stronger')) sets += 1;
  if (experience === 'beginner' || careful) sets = Math.min(sets, 2);
  if (careful) sets = 1;

  return exercises.map((exercise) => {
    let amount = BASE[exercise][experience];
    amount *= AGE_FACTOR[answers.ageRange] ?? 1;
    amount *= ACTIVITY_FACTOR[answers.activityDays] ?? 1;
    if (answers.goals?.includes('endurance')) amount *= 1.2;
    for (const area of answers.easyAreas ?? []) {
      amount *= EASY_AREA_FACTOR[area]?.[exercise] ?? 1;
    }
    if (careful) amount *= 0.6;

    const kind = EXERCISE_KIND[exercise];
    // Reps: whole numbers, at least 3. Plank: multiples of 5 seconds, at least 10.
    const target =
      kind === 'hold' ? Math.max(10, Math.round(amount / 5) * 5) : Math.max(3, Math.round(amount));

    return { exercise, kind, sets, target, restSeconds: REST_SECONDS[experience] };
  });
}

/**
 * Should form checks be more forgiving? Yes for beginners, the youngest and
 * oldest age groups, and anyone who flagged a safety concern.
 */
export function isLenient(answers) {
  return (
    answers.experience === 'beginner' ||
    answers.ageRange === 'under13' ||
    answers.ageRange === '60plus' ||
    safetyFlagged(answers)
  );
}
