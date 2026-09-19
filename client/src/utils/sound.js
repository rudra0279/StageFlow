/**
 * Synthesizes a clean two-tone alert chime using Web Audio API
 * Guaranteed to work without missing audio file dependencies!
 */
export const playAlertChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // Play high two-tone chime (E5 -> G5)
    playTone(659.25, 0, 0.25);
    playTone(783.99, 0.18, 0.4);
  } catch (err) {
    // Browsers may block audio before user gesture
    console.debug('Audio chime skipped due to browser autoplay policy');
  }
};
