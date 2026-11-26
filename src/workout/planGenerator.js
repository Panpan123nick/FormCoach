// Builds a workout plan from the survey answers. It's a set of plain, cautious
// rules (not AI): easy to explain, easy to check, and it can only ever make a
// workout gentler when there's a reason to be careful.
//
// 1. Keep the exercises that suit the person's age, level, equipment and pain areas.
// 2. Rank them by how many of the person's goals they help with.
// 3. Take as many as the workout length allows, plus a warm-up and (often) a cool-down.
// 4. Work out sets and reps for each.
import { CATALOG } from '../exercises/catalog.js';

const AGE_FACTOR = { under13: 0.7, '13to17': 0.9, '18to39': 1, '40to59': 0.9, '60plus': 0.7 };
const ACTIVITY_FACTOR = { 0: 0.8, '1to2': 0.9, '3to4': 1, '5plus': 1.1 };
const SETS_FOR_LENGTH = { '5to10': 1, '15to20': 2, '30plus': 3 };
const MAIN_EXERCISES_FOR_LENGTH = { '5to10': 2, '15to20': 3, '30plus': 4 };
const REST_SECONDS = { beginner: 60, intermediate: 45, advanced: 30 };
const GUIDED_REST_SECONDS = 10;

// Exercises that are still allowed but made easier for some "go easy on" areas.
const EASY_AREA_FACTOR = {
  knees: { squats: 0.7 },
  back: { plank: 0.8, squats: 0.9 },
};

/** True if the user said yes to any safety question. */
const safetyFlagged = (answers) => Object.values(answers.safety ?? {}).includes('yes');

/** Does this exercise suit this person? */
function suits(exercise, answers) {
  const level = answers.experience ?? 'beginner';
  const easyAreas = answers.easyAreas ?? [];
  const equipment = answers.equipment ?? [];
  return (
    exercise.ages.includes(answers.ageRange ?? '18to39') &&
    exercise.levels.includes(level) &&
    !exercise.avoid.some((area) => easyAreas.includes(area)) &&
    (!exercise.equipment || equipment.includes(exercise.equipment))
  );
}

/** The goals (from the survey) that this exercise helps with. */
const matchedGoals = (exercise, answers) =>
  exercise.goals.filter((goal) => (answers.goals ?? []).includes(goal));

/** Which exercises go in the plan, in order: warm-up, main exercises, cool-down. */
export function chooseExercises(answers) {
  const fits = CATALOG.filter((e) => suits(e, answers));

  // Only one version per family (e.g. just one kind of push-up): the first
  // that fits, which is the hardest one allowed (the catalog lists them hardest first).
  const seenFamilies = new Set();
  const main = fits.filter((e) => {
    if (e.role !== 'main') return false;
    if (!e.family) return true;
    if (seenFamilies.has(e.family)) return false;
    seenFamilies.add(e.family);
    return true;
  });

  // Most goal matches first. Exercises that use the person's own equipment get a
  // bonus point (they told us they have it, so they'll expect to use it).
  // sort() keeps catalog order for ties.
  const score = (e) => matchedGoals(e, answers).length + (e.equipment ? 1 : 0);
  main.sort((a, b) => score(b) - score(a));
  const count = MAIN_EXERCISES_FOR_LENGTH[answers.workoutLength] ?? 2;
  const chosen = main.slice(0, count);

  const warmup = fits.filter((e) => e.role === 'warmup');
  const wantsCooldown =
    answers.workoutLength !== '5to10' || (answers.goals ?? []).includes('flexibility');
  const cooldown = wantsCooldown ? fits.filter((e) => e.role === 'cooldown') : [];

  return [...warmup, ...chosen, ...cooldown];
}

/**
 * Returns a list like:
 *   [{ exercise: 'squats', kind: 'reps', role: 'main', sets: 2, target: 12,
 *      restSeconds: 45, goals: ['stronger'] }, ...]
 * `target` is reps per set, or seconds for 'hold' and 'guided' exercises.
 * `goals` lists which of the person's goals the exercise helps with (shown as "Good for").
 */
export function generatePlan(answers) {
  const level = answers.experience ?? 'beginner';
  const careful = safetyFlagged(answers);
  const flexibilityGoal = (answers.goals ?? []).includes('flexibility');

  let sets = SETS_FOR_LENGTH[answers.workoutLength] ?? 1;
  if (answers.goals?.includes('stronger')) sets += 1;
  if (level === 'beginner' || careful) sets = Math.min(sets, 2);
  if (careful) sets = 1;

  return chooseExercises(answers).map((exercise) => {
    const item = {
      exercise: exercise.id,
      kind: exercise.kind,
      role: exercise.role,
      goals: matchedGoals(exercise, answers),
    };

    // Warm-up and cool-down: one gentle follow-along, a bit longer for flexibility goals.
    if (exercise.kind === 'guided') {
      const seconds = exercise.base[level] + (flexibilityGoal ? 15 : 0);
      return { ...item, sets: 1, target: seconds, restSeconds: GUIDED_REST_SECONDS };
    }

    let amount = exercise.base[level];
    amount *= AGE_FACTOR[answers.ageRange] ?? 1;
    amount *= ACTIVITY_FACTOR[answers.activityDays] ?? 1;
    if (answers.goals?.includes('endurance')) amount *= 1.2;
    for (const area of answers.easyAreas ?? []) {
      amount *= EASY_AREA_FACTOR[area]?.[exercise.id] ?? 1;
    }
    if (careful) amount *= 0.6;

    // Reps: whole numbers, at least 3 (1 for pull-ups, which are hard).
    // Plank: multiples of 5 seconds, at least 10.
    const minimum = exercise.id === 'pullUps' ? 1 : 3;
    const target =
      exercise.kind === 'hold'
        ? Math.max(10, Math.round(amount / 5) * 5)
        : Math.max(minimum, Math.round(amount));

    return { ...item, sets, target, restSeconds: REST_SECONDS[level] };
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
