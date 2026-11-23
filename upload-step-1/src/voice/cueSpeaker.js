// Decides WHEN to say a coaching cue, so the coach doesn't nag.
//   - At most one cue every `minGapMs` (so cues never pile up).
//   - The same cue isn't repeated within `repeatGapMs`.
//   - "Urgent" messages (rep counts, set done) skip the gaps.
// `speak(text)` and `now()` are passed in, which keeps this testable without a real voice.
export function createCueSpeaker({ speak, now, minGapMs = 2500, repeatGapMs = 8000 }) {
  let lastSpokenAt = -Infinity;
  const lastSaidAt = new Map(); // cue key -> time it was last spoken

  return {
    /** Returns true if the cue was spoken. */
    say(key, text, { urgent = false } = {}) {
      const time = now();
      if (!urgent) {
        if (time - lastSpokenAt < minGapMs) return false;
        if (time - (lastSaidAt.get(key) ?? -Infinity) < repeatGapMs) return false;
      }
      lastSpokenAt = time;
      lastSaidAt.set(key, time);
      speak(text, { interrupt: urgent });
      return true;
    },
  };
}
