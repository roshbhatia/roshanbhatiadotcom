import { noise, tone } from '../shared/audio.js';

export const SWITCH_DEFAULTS = { strip: true, computer: true, monitor: true, lamp: true, overhead: true };

function playSwitchClick(heavy = false) {
  noise({ type: 'highpass', frequency: heavy ? 1800 : 3200, q: 0.8, duration: 0.012, gain: heavy ? 0.3 : 0.18 });
  tone({ frequency: heavy ? 140 : 900, endFrequency: heavy ? 90 : 700, duration: heavy ? 0.06 : 0.03, gain: heavy ? 0.18 : 0.06, type: 'triangle' });
}

export function playPlugSound(inserting) {
  noise({ frequency: inserting ? 1400 : 900, q: 2, duration: 0.03, gain: 0.25 });
  tone({ frequency: inserting ? 300 : 220, endFrequency: inserting ? 180 : 140, duration: 0.05, gain: 0.12, type: 'triangle' });
  if (inserting) noise({ type: 'highpass', frequency: 6000, q: 0.5, duration: 0.02, gain: 0.05, delay: 0.01 });
}

// Wall outlet -> surge protector (rocker) -> computer, monitor and lamp plugs; keyboard -> computer.
// Each consumer is powered only when every link upstream of it is connected and switched on.
export function createPowerSystem({ cables, isConnected, onChange }) {
  const switches = { ...SWITCH_DEFAULTS };
  let state = derive();

  function derive() {
    const strip = switches.strip && isConnected(cables.strip);
    const computer = strip && isConnected(cables.computer) && switches.computer;
    const monitor = strip && isConnected(cables.monitor) && switches.monitor;
    return {
      strip,
      computer,
      monitor,
      lamp: strip && isConnected(cables.lamp) && switches.lamp,
      keyboard: computer && isConnected(cables.keyboard),
      video: computer && isConnected(cables.video),
      overhead: switches.overhead,
    };
  }

  function refresh() {
    const next = derive();
    const previous = state;
    state = next;
    if (Object.keys(next).some((key) => next[key] !== previous[key])) onChange(next, previous);
  }

  return {
    switches,
    get state() {
      return state;
    },
    toggle(name) {
      switches[name] = !switches[name];
      playSwitchClick(name === 'computer' || name === 'strip');
      refresh();
    },
    setAll(values) {
      Object.assign(switches, values);
      refresh();
    },
    // Called every frame: cables can come loose through physics at any time.
    refresh,
  };
}
