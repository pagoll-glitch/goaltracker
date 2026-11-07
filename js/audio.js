/**
 * Audio Engine using standard Web Audio API
 * Generates soft chimes, clicks, bells, and ambient sounds offline without external assets
 */
const AudioEngine = (() => {
  let ctx = null;
  let ambientNode = null;
  let isMuted = false;

  function getContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  return {
    setMuted(muted) {
      isMuted = muted;
      if (muted && ambientNode) {
        this.stopAmbient();
      }
    },
    isMuted() {
      return isMuted;
    },

    // Gentle tactile click when checking off a task or habit
    playPop() {
      if (isMuted) return;
      try {
        const c = getContext();
        if (!c) return;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, c.currentTime + 0.08);

        gain.gain.setValueAtTime(0.12, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start();
        osc.stop(c.currentTime + 0.09);
      } catch (e) {
        console.warn('Audio play failed', e);
      }
    },

    // Soft zen chime for habit completion or milestone
    playChime() {
      if (isMuted) return;
      try {
        const c = getContext();
        if (!c) return;
        const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        freqs.forEach((freq, idx) => {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, c.currentTime + idx * 0.06);

          gain.gain.setValueAtTime(0, c.currentTime + idx * 0.06);
          gain.gain.linearRampToValueAtTime(0.15, c.currentTime + idx * 0.06 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + idx * 0.06 + 0.8);

          osc.connect(gain);
          gain.connect(c.destination);

          osc.start(c.currentTime + idx * 0.06);
          osc.stop(c.currentTime + idx * 0.06 + 0.85);
        });
      } catch (e) {
        console.warn('Audio play failed', e);
      }
    },

    // Warm deep bell for Pomodoro timer finish
    playBell() {
      if (isMuted) return;
      try {
        const c = getContext();
        if (!c) return;
        const freqs = [440, 554.37, 659.25];
        freqs.forEach(freq => {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;

          gain.gain.setValueAtTime(0.2, c.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 2.5);

          osc.connect(gain);
          gain.connect(c.destination);

          osc.start();
          osc.stop(c.currentTime + 2.6);
        });
      } catch (e) {
        console.warn('Audio play failed', e);
      }
    },

    // Ambient noise for focus (rain / pink noise)
    toggleAmbient(enable) {
      if (!enable || isMuted) {
        this.stopAmbient();
        return;
      }
      try {
        const c = getContext();
        if (!c) return;
        this.stopAmbient();

        const bufferSize = 2 * c.sampleRate;
        const noiseBuffer = c.createBuffer(1, bufferSize, c.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
          b6 = white * 0.115926;
        }

        const whiteNoise = c.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = c.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        const gainNode = c.createGain();
        gainNode.gain.setValueAtTime(0.04, c.currentTime);

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(c.destination);

        whiteNoise.start();
        ambientNode = { source: whiteNoise, gain: gainNode };
      } catch (e) {
        console.warn('Ambient noise error', e);
      }
    },

    stopAmbient() {
      if (ambientNode) {
        try {
          ambientNode.source.stop();
          ambientNode.source.disconnect();
        } catch (e) {}
        ambientNode = null;
      }
    }
  };
})();

