import { noise, tone } from '../shared/audio.js';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './computer-model.js';

const WARM_UP_SECONDS = 1.4;
const SIGNAL_FADE_SECONDS = 0.5;
const COLLAPSE_SECONDS = 0.9;
const GLOW_INTENSITY = 5.5;

function playDegauss() {
  tone({ frequency: 62, endFrequency: 48, duration: 0.7, gain: 0.22, type: 'sawtooth', filterFrequency: 260 });
  noise({ type: 'lowpass', frequency: 180, q: 0.8, duration: 0.12, gain: 0.45 });
  tone({ frequency: 15700, duration: 1.6, gain: 0.006, attack: 0.3 });
}

function playCollapse() {
  tone({ frequency: 900, endFrequency: 120, duration: 0.35, gain: 0.05, type: 'triangle' });
  noise({ type: 'highpass', frequency: 5000, q: 0.6, duration: 0.05, gain: 0.05 });
}

// The apps draw into an off-screen buffer; this composites it onto the CRT according to the monitor's power
// and whether a signal arrives: picture, dark raster, warm-up after degauss, or the collapse to a bright dot.
export function createScreenOutput({ canvas, overlay, glow }) {
  const context = canvas.getContext('2d');
  const buffer = document.createElement('canvas');
  buffer.width = SCREEN_WIDTH;
  buffer.height = SCREEN_HEIGHT;
  const bufferContext = buffer.getContext('2d');
  let display = true;
  let signal = true;
  let warmStart = -Infinity;
  let signalStart = -Infinity;
  let collapseStart = -Infinity;
  let now = 0;

  function drawCollapse(elapsed) {
    context.fillStyle = '#000';
    context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2;
    if (elapsed < 0.12) {
      const height = Math.max(SCREEN_HEIGHT * (1 - elapsed / 0.12), 4);
      context.drawImage(buffer, 0, centerY - height / 2, SCREEN_WIDTH, height);
      context.fillStyle = `rgba(220, 255, 235, ${elapsed / 0.12 * 0.6})`;
      context.fillRect(0, centerY - height / 2, SCREEN_WIDTH, height);
      return 1;
    }
    if (elapsed < 0.26) {
      const width = Math.max(SCREEN_WIDTH * (1 - (elapsed - 0.12) / 0.14), 8);
      context.fillStyle = 'rgba(230, 255, 240, 0.95)';
      context.fillRect(centerX - width / 2, centerY - 2, width, 4);
      return 0.8;
    }
    const fade = 1 - (elapsed - 0.26) / (COLLAPSE_SECONDS - 0.26);
    const dot = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 26);
    dot.addColorStop(0, `rgba(255, 255, 255, ${fade})`);
    dot.addColorStop(0.3, `rgba(190, 255, 220, ${fade * 0.6})`);
    dot.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = dot;
    context.fillRect(centerX - 30, centerY - 30, 60, 60);
    return fade * 0.5;
  }

  return {
    get bufferContext() {
      return bufferContext;
    },
    setDisplay(on) {
      if (on === display) return;
      display = on;
      if (on) {
        warmStart = now;
        playDegauss();
      } else {
        collapseStart = now;
        playCollapse();
      }
    },
    setSignal(on) {
      if (on === signal) return;
      signal = on;
      if (on) signalStart = now;
    },
    get showingPicture() {
      return display && signal;
    },
    // drawApp renders the active app into the buffer; it only runs while there is a picture to show.
    draw(seconds, drawApp) {
      now = seconds;
      let brightness = 0;
      if (display) {
        const warm = Math.min((now - warmStart) / WARM_UP_SECONDS, 1);
        context.fillStyle = '#020403';
        context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        if (signal) {
          drawApp(bufferContext, seconds);
          const fade = Math.min(warm, (now - signalStart) / SIGNAL_FADE_SECONDS, 1);
          // A warming tube blooms slightly before settling.
          context.globalAlpha = Math.max(fade, 0);
          context.drawImage(buffer, 0, 0);
          context.globalAlpha = 1;
          brightness = fade;
        } else {
          // Powered but no signal: an empty raster with a faint phosphor glow.
          const raster = context.createRadialGradient(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 40, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH * 0.6);
          raster.addColorStop(0, `rgba(40, 90, 60, ${0.18 * warm})`);
          raster.addColorStop(1, 'rgba(10, 30, 20, 0.05)');
          context.fillStyle = raster;
          context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
          brightness = 0.12 * warm;
        }
      } else if (now - collapseStart < COLLAPSE_SECONDS) {
        brightness = drawCollapse(now - collapseStart);
      } else {
        context.fillStyle = '#000';
        context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      }
      context.shadowBlur = 0;
      context.drawImage(overlay, 0, 0);
      glow.intensity = (GLOW_INTENSITY + Math.sin(seconds * 60) * 0.15) * brightness;
    },
  };
}
