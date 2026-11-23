import { describe, expect, it } from 'vitest';
import { generatePlan, isLenient } from './planGenerator.js';

const adult = {
  ageRange: '18to39',
  safety: { heartCondition: 'no', chestPain: 'no', boneJoint: 'no', pregnantOrRecovering: 'no' },
  easyAreas: ['none'],
  experience: 'intermediate',
  activityDays: '3to4',
  goals: ['healthy'],
  exercises: ['pushups', 'plank'],
  workoutLength: '15to20',
};

const find = (plan, exercise) => plan.find((p) => p.exercise === exercise);

describe('generatePlan', () => {
  it('gives the base amounts to an active intermediate adult', () => {
    const plan = generatePlan(adult);
    expect(find(plan, 'pushups')).toMatchObject({ kind: 'reps', sets: 2, target: 10, restSeconds: 45 });
    expect(find(plan, 'plank')).toMatchObject({ kind: 'hold', sets: 2, target: 35 });
  });

  it('only includes the exercises the user picked, in order', () => {
    expect(generatePlan(adult).map((p) => p.exercise)).toEqual(['pushups', 'plank']);
  });

  it('is gentler for older adults than for younger ones', () => {
    const older = generatePlan({ ...adult, ageRange: '60plus' });
    expect(find(older, 'pushups').target).toBeLessThan(find(generatePlan(adult), 'pushups').target);
  });

  it('goes easy on body areas the user asked about', () => {
    const wrists = generatePlan({ ...adult, easyAreas: ['wrists'] });
    expect(find(wrists, 'pushups').target).toBe(7);
    expect(find(wrists, 'plank').target).toBe(35); // planks don't load the wrists as much in our rules
  });

  it('uses one set and smaller amounts after a safety "yes"', () => {
    const plan = generatePlan({ ...adult, safety: { ...adult.safety, chestPain: 'yes' } });
    expect(find(plan, 'pushups')).toMatchObject({ sets: 1, target: 6 });
  });

  it('never goes below 3 reps or 10 seconds', () => {
    const plan = generatePlan({
      ...adult,
      ageRange: 'under13',
      experience: 'beginner',
      activityDays: '0',
      easyAreas: ['wrists', 'shoulders'],
      safety: { ...adult.safety, heartCondition: 'yes' },
    });
    expect(find(plan, 'pushups').target).toBeGreaterThanOrEqual(3);
    expect(find(plan, 'plank').target).toBeGreaterThanOrEqual(10);
    expect(find(plan, 'plank').target % 5).toBe(0);
  });

  it('adds a set for strength goals but caps beginners at 2', () => {
    expect(generatePlan({ ...adult, goals: ['stronger'] })[0].sets).toBe(3);
    expect(generatePlan({ ...adult, goals: ['stronger'], experience: 'beginner', workoutLength: '30plus' })[0].sets).toBe(2);
  });
});

describe('isLenient', () => {
  it('is lenient for beginners and the oldest group, not for an intermediate adult', () => {
    expect(isLenient(adult)).toBe(false);
    expect(isLenient({ ...adult, experience: 'beginner' })).toBe(true);
    expect(isLenient({ ...adult, ageRange: '60plus' })).toBe(true);
  });
});
