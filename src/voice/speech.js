// Talks to the browser's built-in voice (the Web Speech API). Everything is
// spoken on the device; no audio is sent anywhere.

const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Phones (especially iPhones) only allow speech that starts from a tap.
 * Call this inside a tap handler (e.g. the Start button) to "unlock" the voice.
 */
export function unlockSpeech() {
  if (!supported()) return;
  const silent = new SpeechSynthesisUtterance('');
  silent.volume = 0;
  window.speechSynthesis.speak(silent);
}

/**
 * Make a speak(text) function that uses the user's voice settings
 * (on/off, voice, speed, volume; the settings screen comes in Phase 4).
 */
export function createSpeaker(settings, language = 'en') {
  return (text, { interrupt = false } = {}) => {
    if (!supported() || !settings.voiceOn) return;
    const synth = window.speechSynthesis;
    if (interrupt) synth.cancel(); // urgent messages cut off whatever is playing
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = settings.voiceRate ?? 1;
    utterance.volume = settings.voiceVolume ?? 1;
    if (settings.voiceName) {
      const voice = synth.getVoices().find((v) => v.name === settings.voiceName);
      if (voice) utterance.voice = voice;
    }
    synth.speak(utterance);
  };
}

export function stopSpeaking() {
  if (supported()) window.speechSynthesis.cancel();
}
