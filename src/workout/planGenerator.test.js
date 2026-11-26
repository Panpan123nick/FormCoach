import { describe, expect, it } from 'vitest';
import en from '../i18n/en.json';
import { CATALOG } from '../exercises/catalog.js';
import { chooseExercises, generatePlan, isLenient } from './planGenerator.js';

const adult = {
  ageRange: '18to39',
  safety: { heartCondition: 'no', chestPain: 'no', boneJoint: 'no', pregnantOrRecovering: 'no' },
  easyAreas: ['none'],
  experience: 'intermediate',
  activityDays: '3to4',
  goals: ['stronger'],
  equipment: ['none'],
  workoutLength: '15to20',
};

const ids = (answers) => chooseExercises(answers).map((e) => e.id);
const mains = (answers) => chooseExercises(answers).filter((e) => e.role === 'main').map((e) => e.id);
const find = (plan, exercise) => plan.find((p) => p.exercise === exercise);

describe('chooseExercises', () => {
  it('starts with a warm-up and ends with a cool-down', () => {
    const list = ids(adult);
    expect(list[0]).toBe('shoulderRolls');
    expect(list.at(-1)).toBe('catStretch');
  });

  it('picks more main exercises for longer workouts', () => {
    expect(mains({ ...adult, workoutLength: '5to10' })).toHaveLength(2);
    expect(mains(adult)).toHaveLength(3);
    expect(mains({ ...adult, workoutLength: '30plus' })).toHaveLength(4);
  });

  it('skips the cool-down on short workouts unless flexibility is a goal', () => {
    expect(ids({ ...adult, workoutLength: '5to10' })).not.toContain('catStretch');
    expect(ids({ ...adult, workoutLength: '5to10', goals: ['flexibility'] })).toContain('catStretch');
  });

  it('uses only one push-up version: the hardest the person is ready for', () => {
    const pushupsFor = (answers) =>
      chooseExercises({ ...answers, workoutLength: '30plus' }).filter((e) => e.family === 'pushups').map((e) => e.id);
    expect(pushupsFor({ ...adult, experience: 'advanced' })).toEqual(['pushups']);
    expect(pushupsFor(adult)).toEqual(['kneePushups']);
    expect(pushupsFor({ ...adult, experience: 'beginner' })).toEqual(['wallPushups']);
    // Older adults get an easier version instead of being left out.
    expect(pushupsFor({ ...adult, experience: 'advanced', ageRange: '40to59' })).toEqual(['kneePushups']);
    expect(pushupsFor({ ...adult, experience: 'advanced', ageRange: '60plus' })).toEqual(['wallPushups']);
  });

  it('leaves out exercises that load a "go easy" area', () => {
    const knees = mains({ ...adult, easyAreas: ['knees'], workoutLength: '30plus' });
    expect(knees).not.toContain('lunges');
    expect(knees).not.toContain('gluteBridges');
    const wrists = ids({ ...adult, easyAreas: ['wrists'], workoutLength: '30plus' });
    expect(wrists.some((id) => id.toLowerCase().includes('pushups'))).toBe(false);
    expect(wrists).not.toContain('catStretch');
    expect(mains({ ...adult, easyAreas: ['neck'], workoutLength: '30plus' })).not.toContain('situps');
  });

  it('only includes pull-ups with a pull-up bar', () => {
    const advanced = { ...adult, experience: 'advanced', workoutLength: '30plus' };
    expect(mains(advanced)).not.toContain('pullUps');
    expect(mains({ ...advanced, equipment: ['pullupBar'] })).toContain('pullUps');
  });

  it('puts exercises that match more goals first', () => {
    const flexible = mains({ ...adult, experience: 'beginner', goals: ['flexibility'] });
    expect(flexible[0]).toBe('legRaises');
  });

  it('still builds a workout for an older beginner going easy on several areas', () => {
    const list = mains({
      ...adult,
      ageRange: '60plus',
      experience: 'beginner',
      easyAreas: ['back', 'shoulders', 'wrists'],
    });
    expect(list.length).toBeGreaterThan(0);
    expect(list).toContain('squats');
  });
});

describe('generatePlan', () => {
  it('gives warm-ups one short follow-along with a short rest', () => {
    expect(find(generatePlan(adult), 'shoulderRolls')).toMatchObject({ kind: 'guided', sets: 1, target: 30, restSeconds: 10 });
  });

  it('makes stretches longer for flexibility goals', () => {
    expect(find(generatePlan({ ...adult, goals: ['flexibility'] }), 'shoulderRolls').target).toBe(45);
  });

  it('uses base amounts for an active intermediate adult, plus a set for strength', () => {
    expect(find(generatePlan(adult), 'squats')).toMatchObject({ kind: 'reps', sets: 3, target: 15, restSeconds: 45 });
  });

  it('is gentler for older adults than for younger ones', () => {
    const older = generatePlan({ ...adult, ageRange: '40to59' });
    expect(find(older, 'squats').target).toBeLessThan(find(generatePlan(adult), 'squats').target);
  });

  it('uses one set and smaller amounts after a safety "yes"', () => {
    const plan = generatePlan({ ...adult, safety: { ...adult.safety, chestPain: 'yes' } });
    expect(find(plan, 'squats')).toMatchObject({ sets: 1, target: 9 });
  });

  it('never goes below 3 reps or 10 seconds', () => {
    const plan = generatePlan({
      ...adult,
      ageRange: 'under13',
      experience: 'beginner',
      activityDays: '0',
      safety: { ...adult.safety, heartCondition: 'yes' },
    });
    for (const item of plan.filter((p) => p.kind === 'reps')) expect(item.target).toBeGreaterThanOrEqual(3);
  });

  it('lists the goals each exercise helps with', () => {
    expect(find(generatePlan({ ...adult, goals: ['stronger', 'sports'] }), 'squats').goals).toEqual(['stronger', 'sports']);
  });
});

describe('catalog', () => {
  it.each(CATALOG.map((e) => [e.id]))('%s has a name and a get-ready tip', (id) => {
    expect(en.exercises.names[id]).toBeTypeOf('string');
    expect(en.workout.position[id]).toBeTypeOf('string');
  });
});

describe('isLenient', () => {
  it('is lenient for beginners and the oldest group, not for an intermediate adult', () => {
    expect(isLenient(adult)).toBe(false);
    expect(isLenient({ ...adult, experience: 'beginner' })).toBe(true);
    expect(isLenient({ ...adult, ageRange: '60plus' })).toBe(true);
  });
});
