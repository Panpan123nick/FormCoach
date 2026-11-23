import { describe, expect, it } from 'vitest';
import { createCueSpeaker } from './cueSpeaker.js';

function setup() {
  let time = 0;
  const spoken = [];
  const speaker = createCueSpeaker({ speak: (text) => spoken.push(text), now: () => time });
  return { speaker, spoken, advance: (ms) => (time += ms) };
}

describe('createCueSpeaker', () => {
  it('speaks the first cue right away', () => {
    const { speaker, spoken } = setup();
    expect(speaker.say('goLower', 'Go lower')).toBe(true);
    expect(spoken).toEqual(['Go lower']);
  });

  it('waits a moment between any two cues', () => {
    const { speaker, spoken, advance } = setup();
    speaker.say('goLower', 'Go lower');
    advance(1000);
    expect(speaker.say('backStraight', 'Keep your back straight')).toBe(false);
    advance(2000);
    expect(speaker.say('backStraight', 'Keep your back straight')).toBe(true);
    expect(spoken).toHaveLength(2);
  });

  it('does not repeat the same cue too often', () => {
    const { speaker, advance } = setup();
    speaker.say('goLower', 'Go lower');
    advance(4000);
    expect(speaker.say('goLower', 'Go lower')).toBe(false);
    advance(5000);
    expect(speaker.say('goLower', 'Go lower')).toBe(true);
  });

  it('always speaks urgent messages like rep counts', () => {
    const { speaker, spoken } = setup();
    speaker.say('goLower', 'Go lower');
    expect(speaker.say('count', '1', { urgent: true })).toBe(true);
    expect(speaker.say('count', '2', { urgent: true })).toBe(true);
    expect(spoken).toEqual(['Go lower', '1', '2']);
  });
});
