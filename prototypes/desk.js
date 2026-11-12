import * as THREE from 'three';
import { createStage, createClock, toNormalizedDeviceCoordinates } from './shared/stage.js';
import { noise, tone, onAudioUnlock, startHum } from './shared/audio.js';
import { createKeyboard } from './desk/keyboard-model.js';
import { createComputer, createCrtOverlay } from './desk/computer-model.js';
import { createTerminal } from './desk/terminal.js';
import { createSequencer } from './desk/sequencer.js';
import { createPhysics } from './desk/physics.js';
import { createCubicle, WALL_SWITCH_HALF_SIZE, WALL_SWITCH_POSITION } from './desk/cubicle.js';
import { createMug, createMugShards } from './desk/mug.js';
import { createLamp, createPhone, createPowerStrip, createNotepad, createStapler } from './desk/props.js';
import { createFloppies, createFloppyDrives } from './desk/floppies.js';
import { createPowerSystem, playPlugSound, SWITCH_DEFAULTS } from './desk/power.js';
import { createScreenOutput } from './desk/screen-output.js';
import { createRespawnFade } from './desk/respawn-fade.js';
import { createDeskDrawing } from './desk/desk-drawing.js';
import { createStaplerAction, PAPER_REACH } from './desk/stapler-action.js';
import { createBallBoundary } from './desk/ball-boundary.js';
import { createCoffee } from './desk/coffee.js';
import { createPhotoFrame, createGlassShards } from './desk/photo-frame.js';
import { createPencilCup, PENCIL_LENGTH } from './desk/pencil-cup.js';
import { createStressBall } from './desk/stress-ball.js';
import { createPaperAirplane, applyGlide } from './desk/paper-airplane.js';
import { createCableSystem } from './desk/cables.js';
import { createInteraction } from './desk/interaction.js';
import { playBreak, playGlassShatter, playImpact, playPunch, playShatter } from './desk/impact-audio.js';

const FIELD_OF_VIEW = 44;
// The dense sequencer UI needs the screen at ~70% of the viewport width, viewed head-on with a narrower lens.
const DAW_FIELD_OF_VIEW = 34;
const DAW_SCREEN_WIDTH_FRACTION = 0.7;
const SCREEN_SIZE = { width: 13.4, height: 10.05 };
// The desk view looks down at the keyboard steeply enough to read legends while keeping the monitor in frame.
const DESK_VIEW = { direction: new THREE.Vector3(0, 0.75, 1).normalize(), target: new THREE.Vector3(0, 6.5, 8.5) };
const DESK_FRAME_POINTS = [
  [-12.6, 0, 17.6],
  [12.6, 0, 17.6],
  [-12.6, 0, 8],
  [12.6, 0, 8],
  [-9.2, 21, 2.5],
  [9.2, 21, 2.5],
].map((point) => new THREE.Vector3(...point));
const SHATTER_SPEED = 45;
const GLASS_SHATTER_SPEED = 35;
const GLASS_BREAKING_MASS = 0.3;
const OFFSCREEN_RESET_SECONDS = 5;
const TAP_STRENGTH = 0.12;
const BLACKOUT_FADE_SECONDS = 1.2;
const PENCIL_TILT_GAIN = 12;
// A held pencil leans with its tip down and away from the viewer, the way one writes.
const PENCIL_WRITING_AXIS = new THREE.Vector3(0, -1, -0.4).normalize();
const LAMP_INTENSITY = 14;
const BULB_GLOW = 2.4;
const LED_GLOW = 2;
const AMBIENT_WHEN_DARK = 0.06;
const ENVIRONMENT_INTENSITY = 0.45;
// Fluorescent tubes strike unevenly: [seconds after switching on, brightness].
const FLUORESCENT_STRIKE = [
  [0, 0],
  [0.09, 0.9],
  [0.15, 0],
  [0.32, 0.6],
  [0.37, 0.1],
  [0.52, 1],
];

// Keys clicked with the mouse produce the same unshifted character a physical press would.
const NAMED_CODE_KEYS = {
  Space: ' ',
  Enter: 'Enter',
  NumpadEnter: 'Enter',
  Backspace: 'Backspace',
  Escape: 'Escape',
  Tab: 'Tab',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  Minus: '-',
  Equal: '=',
  Backquote: '`',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  NumpadAdd: '+',
  NumpadSubtract: '-',
  NumpadMultiply: '*',
  NumpadDivide: '/',
  NumpadDecimal: '.',
};
function keyForCode(code) {
  if (code.startsWith('Key')) return code.slice(3).toLowerCase();
  if (code.startsWith('Digit')) return code.slice(5);
  if (/^Numpad\d$/.test(code)) return code.slice(6);
  return NAMED_CODE_KEYS[code] ?? '';
}

const camera = new THREE.PerspectiveCamera(FIELD_OF_VIEW, 1, 0.1, 400);
const stage = createStage({
  camera,
  background: ['#a9d8f5', '#e6eef7', '#f8efe6'],
  bloom: { strength: 0.45, radius: 0.6 },
  haze: 0.18,
  hazeColor: [0.97, 0.96, 0.94],
  environmentIntensity: 0.45,
});
const { scene, renderer } = stage;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const physics = createPhysics(scene);
const cubicle = createCubicle(scene, physics);
const computer = createComputer();
scene.add(computer.group);
const keyboard = createKeyboard();
keyboard.group.position.set(0, 2.15, 12.5);
keyboard.group.rotation.x = 0.097;
const mug = createMug();
const lamp = createLamp();
const phone = createPhone();
const powerStrip = createPowerStrip();
const floppies = createFloppies();
const photoFrame = createPhotoFrame();
const pencilCup = createPencilCup();
const stressBall = createStressBall();
scene.add(stressBall.crumbs);

const assemblies = {
  systemUnit: physics.createAssembly(computer.systemUnit),
  monitor: physics.createAssembly(computer.monitor),
  keyboard: physics.createAssembly(keyboard.assembly),
  mug: physics.createAssembly(mug.spec),
  lamp: physics.createAssembly(lamp.spec),
  phone: physics.createAssembly(phone.spec),
  powerStrip: physics.createAssembly(powerStrip.spec),
  pencilCup: physics.createAssembly(pencilCup.cup),
  ...Object.fromEntries(pencilCup.pencils.map((pencil, index) => [`pencil${index + 1}`, physics.createAssembly(pencil)])),
  photoFrame: physics.createAssembly(photoFrame.spec),
  stressBall: physics.createAssembly(stressBall.spec),
  paperAirplane: physics.createAssembly(createPaperAirplane().spec),
  notepad: physics.createAssembly(createNotepad().spec),
  ...Object.fromEntries(floppies.map((floppy, index) => [`floppy${index + 1}`, physics.createAssembly(floppy.spec)])),
  stapler: physics.createAssembly(createStapler().spec),
};
// The monitor rests on the system unit, so restoring the unit restores the monitor too.
assemblies.systemUnit.dependents.push(assemblies.monitor);
// Restoring the cup puts its pencils back in it.
assemblies.pencilCup.dependents.push(...Object.keys(assemblies).filter((key) => key.startsWith('pencil') && key !== 'pencilCup').map((key) => assemblies[key]));
const frameGlass = assemblies.photoFrame.parts.find((part) => part.name === 'frame glass');
physics.onStep(() => {
  if (assemblies.paperAirplane.state === 'intact') applyGlide(assemblies.paperAirplane.body);
});
physics.settle(150);

const OBSTACLES = [
  [assemblies.systemUnit, [-12.5, 0, -10], [12.5, 6, 10.4]],
  [assemblies.monitor, [-8.25, 2, -7.2], [8.25, 16.9, 6.5]],
  [assemblies.monitor, [-5, 0, -4.5], [5, 2, 5.5]],
  [assemblies.keyboard, [-12.2, -1.25, -4.1], [12.2, 0.8, 4.6]],
].map(([assembly, min, max]) => ({ assembly, min: new THREE.Vector3(...min), max: new THREE.Vector3(...max), inverse: new THREE.Matrix4() }));
function getObstacles() {
  const active = [];
  for (const obstacle of OBSTACLES) {
    if (obstacle.assembly.state !== 'intact') continue;
    obstacle.assembly.root.updateMatrixWorld();
    obstacle.matrix = obstacle.assembly.root.matrixWorld;
    obstacle.inverse.copy(obstacle.matrix).invert();
    active.push(obstacle);
  }
  return active;
}

const cables = createCableSystem({ scene, getObstacles });
const coffee = createCoffee({ scene, physics, mug: assemblies.mug, getObstacles });
const point = (x, y, z) => new THREE.Vector3(x, y, z);
const outlets = powerStrip.anchors.outlets;
cables.add({
  name: 'keyboard cable',
  color: 0xbdb5a2,
  radius: 0.17,
  a: { anchor: keyboard.anchors.cable, plug: 'strain', plugColor: 0x2f2d2a },
  b: { anchor: computer.anchors.keyboardPort, plug: 'din', plugColor: 0x3a3833 },
  waypoints: [point(-7, 0.3, 6.5), point(-9, 0.3, 5.6)],
  length: 14,
});
cables.add({
  name: 'video cable',
  color: 0x56565a,
  radius: 0.28,
  a: { anchor: computer.anchors.monitorVga, plug: 'strain', plugColor: 0x262626 },
  b: { anchor: computer.anchors.vgaPort, plug: 'vga', plugColor: 0x3d3f45 },
  waypoints: [point(-4, 8, -17.5), point(-8, 4.5, -18.5)],
  slack: 1.1,
});
cables.add({
  name: 'monitor power cord',
  color: 0x232323,
  radius: 0.2,
  a: { anchor: computer.anchors.monitorPower, plug: 'iec' },
  b: { anchor: outlets[0], plug: 'nema' },
  waypoints: [point(5, 7, -18.5), point(15, 0.4, -19.3), point(21, 3, -18)],
  slack: 1.12,
});
cables.add({
  name: 'system unit power cord',
  color: 0x232323,
  radius: 0.2,
  a: { anchor: computer.anchors.powerInlet, plug: 'iec' },
  b: { anchor: outlets[1], plug: 'nema' },
  waypoints: [point(12, 1.5, -18.5), point(19, 0.4, -19.3), point(23, 3, -18)],
  slack: 1.12,
});
cables.add({
  name: 'lamp cord',
  color: 0xe9e4da,
  radius: 0.14,
  a: { anchor: lamp.anchors.cord, plug: 'strain', plugColor: 0xd8d2c6 },
  b: { anchor: outlets[2], plug: 'nema', plugColor: 0xe9e4da },
  waypoints: [point(-40, 0.3, -18), point(-20, 0.3, -19.4), point(0, 0.3, -19.5), point(18, 0.3, -19.5), point(24.6, 3, -18)],
  slack: 1.08,
});
cables.add({
  name: 'phone line',
  color: 0xe6e0d0,
  radius: 0.1,
  a: { anchor: phone.anchors.lineCord, plug: 'rj11', plugColor: 0xd9e4ea },
  b: { anchor: cubicle.phoneJack, plug: 'rj11', plugColor: 0xd9e4ea },
  waypoints: [point(37, 0.2, -6), point(40, 0.3, -19.5)],
  slack: 1.15,
});
cables.add({
  name: 'handset cord',
  color: 0xcfc8b8,
  radius: 0.16,
  a: { anchor: phone.anchors.handsetCord, plug: 'strain', plugColor: 0xcfc8b8 },
  b: { anchor: phone.anchors.baseCoil, plug: 'rj11', plugColor: 0xcfc8b8 },
  length: 9,
});
cables.add({
  name: 'power strip cord',
  color: 0x232323,
  radius: 0.2,
  a: { anchor: powerStrip.anchors.cord, plug: 'strain' },
  b: { anchor: cubicle.wallOutlet, plug: 'nema', plugColor: 0x1d1d1d },
  waypoints: [point(18.5, 0.3, -19.5)],
  slack: 1.25,
});
cables.settle(180);

physics.onImpact(({ body, other, speed, point: contact, owner, otherOwner }) => {
  playImpact({ body, material: owner.material, speed, mass: body.mass, x: contact.x });
  if (otherOwner) playImpact({ body: other, material: otherOwner.material, speed, mass: other.mass, x: contact.x });
  for (const candidate of [owner, otherOwner]) {
    if (!candidate || candidate.debris) continue;
    if (candidate.assembly === assemblies.mug && speed >= SHATTER_SPEED) {
      physics.defer(() => {
        if (assemblies.mug.state === 'shattered') return;
        coffee.dump();
        if (physics.shatterAssembly(assemblies.mug, createMugShards)) playShatter(contact.x);
      });
    }
    // Light flying bits (a pencil, a shard) should not crack the pane; a drop, a throw or a heavy hit should.
    const struck = candidate === owner ? other : body;
    const struckMass = struck.mass === 0 ? Infinity : struck.mass;
    if (candidate.assembly === assemblies.photoFrame && speed >= GLASS_SHATTER_SPEED && struckMass >= GLASS_BREAKING_MASS && !frameGlass.removed) {
      physics.defer(() => {
        if (physics.detachPart(assemblies.photoFrame, frameGlass, createGlassShards)) playGlassShatter(contact.x);
      });
    }
    if (candidate.assembly === assemblies.stressBall && candidate.assembly.state === 'intact') {
      const ballBody = candidate.assembly.body;
      stressBall.impact(speed, new THREE.Vector3(contact.x - ballBody.position.x, contact.y - ballBody.position.y, contact.z - ballBody.position.z));
    }
  }
});
const cableNamed = (name) => cables.cables.find((cable) => cable.name === name);
const partNamed = (assembly, name) => assembly.parts.find((part) => part.name === name);
const powerCables = {
  strip: cableNamed('power strip cord'),
  computer: cableNamed('system unit power cord'),
  monitor: cableNamed('monitor power cord'),
  lamp: cableNamed('lamp cord'),
  keyboard: cableNamed('keyboard cable'),
  video: cableNamed('video cable'),
};

const screenOutput = createScreenOutput({ canvas: computer.canvas, overlay: createCrtOverlay(), glow: computer.screenGlow });
let cameraMode = 'desk';
const apps = {};
let activeApp = null;
let hum = null;

function playDiskSeek() {
  for (let index = 0; index < 7; index += 1) {
    const delay = index * 0.085 + Math.random() * 0.02;
    noise({ frequency: 500 + Math.random() * 300, q: 3, duration: 0.05, gain: 0.12, delay });
    tone({ frequency: 95, duration: 0.05, gain: 0.05, type: 'square', filterFrequency: 400, delay });
  }
}

// Launching an app only changes what the computer shows; the camera follows the overhead light instead.
function launch(name) {
  activeApp = apps[name];
  activeApp.open?.();
  if (name === 'daw') playDiskSeek();
}

function blinkDriveLight(drive) {
  drive.activityLight.emissiveIntensity = 1.4;
  setTimeout(() => (drive.activityLight.emissiveIntensity = 0), 700);
}

function onPowerChange(next, previous) {
  if (!cables.isConnected(powerCables.strip) && !blackout.active) startBlackout();
  if (next.computer !== previous.computer) {
    if (next.computer) {
      apps.terminal.reboot();
      activeApp = apps.terminal;
      playDiskSeek();
      computer.drives.forEach(blinkDriveLight);
      hum?.setLevel(1, 2);
    } else {
      apps.daw.stop();
      activeApp = apps.terminal;
      hum?.setLevel(0, 1.2);
    }
  }
  screenOutput.setDisplay(next.monitor);
  screenOutput.setSignal(next.video);
  if (next.overhead !== previous.overhead) setOverhead(next.overhead);
}
const power = createPowerSystem({ cables: powerCables, isConnected: cables.isConnected, onChange: onPowerChange });

const floppyDrives = createFloppyDrives({
  scene,
  physics,
  drives: computer.drives,
  disks: floppies.map((floppy, index) => ({ assembly: assemblies[`floppy${index + 1}`], release: floppy.release })),
  isComputerOn: () => power.state.computer,
  playClunk: () => {
    noise({ frequency: 700, q: 1.5, duration: 0.05, gain: 0.25 });
    tone({ frequency: 150, endFrequency: 90, duration: 0.07, gain: 0.15, type: 'triangle' });
  },
  onRead(drive, release) {
    playDiskSeek();
    blinkDriveLight(drive);
    apps.terminal.print(`${drive.letter}:\\> reading ${release.title}`, `opening ${release.url}`);
    window.open(release.url, '_blank', 'noopener');
  },
});
physics.onReset((assembly) => {
  floppyDrives.forget(assembly);
  if (assembly === assemblies.mug) coffee.refill();
  cables.reconnect();
});

// Restores the whole desk: every object and part, every cable, every switch, both lights, and the desk view.
function resetScene() {
  physics.resetAssemblies(Object.values(assemblies));
  cables.reconnectAll();
  power.setAll(SWITCH_DEFAULTS);
  deskDrawing.clear();
  staplerAction.clear();
  coffee.refill();
  coffee.clearStains();
}

// Pulling the surge protector's plug from the wall: everything loses power, the view fades to black, the desk
// is restored while dark, and it fades back in through the normal power-on sequence.
const blackoutOverlay = Object.assign(document.createElement('div'), { className: 'blackout' });
Object.assign(blackoutOverlay.style, { position: 'fixed', inset: '0', background: '#000', opacity: '0', pointerEvents: 'none', transition: `opacity ${BLACKOUT_FADE_SECONDS}s ease` });
document.body.appendChild(blackoutOverlay);
const blackout = { active: false, lightsOut: false };
function startBlackout() {
  blackout.active = true;
  blackout.lightsOut = true;
  keyboard.releaseAll();
  blackoutOverlay.style.pointerEvents = 'auto';
  blackoutOverlay.style.opacity = '1';
  setTimeout(() => {
    resetScene();
    apps.terminal.reboot();
    blackout.lightsOut = false;
    setOverhead(true);
    camera.position.copy(deskPose.position);
    lookTarget.copy(deskPose.target);
    blackoutOverlay.style.opacity = '0';
    setTimeout(() => {
      blackoutOverlay.style.pointerEvents = 'none';
      blackout.active = false;
    }, BLACKOUT_FADE_SECONDS * 1000);
  }, BLACKOUT_FADE_SECONDS * 1000);
}

apps.terminal = createTerminal({ launch, resetScene });
apps.daw = createSequencer({ exit: () => launch('terminal') });
activeApp = apps.terminal;

// Clicking one of the four power-relevant plugs pulls it out or pushes it back in.
const plugFixtures = [
  [powerCables.strip, 1],
  [powerCables.computer, 1],
  [powerCables.monitor, 1],
  [powerCables.lamp, 1],
  [powerCables.keyboard, 1],
].map(([cable, index]) => {
  const plug = cable.plugs[index];
  plug.userData.interactive = () => {
    const attached = cables.toggleEnd(cable, index);
    if (attached === null) {
      tone({ frequency: 180, duration: 0.08, gain: 0.05, type: 'square', filterFrequency: 600 });
      return;
    }
    playPlugSound(attached);
    power.refresh();
  };
  return plug;
});
cubicle.wallSwitch.fixture.userData.interactive = () => power.toggle('overhead');
// xkcd prints open their pages (CC BY-NC 2.5, credited on the print); the other print just gets a paper tap.
for (const print of cubicle.prints) {
  print.object.userData.interactive = () => {
    if (print.link) window.open(print.link, '_blank', 'noopener');
    else noise({ type: 'lowpass', frequency: 1400, q: 0.6, duration: 0.06, gain: 0.2 });
  };
}
const deskDrawing = createDeskDrawing(scene);
cubicle.desk.userData.interactive = ({ shift }) => {
  if (!shift) return;
  deskDrawing.clear();
  coffee.clearStains();
};

const staplerAction = createStaplerAction({
  physics,
  stapler: assemblies.stapler,
  papers: () => [
    ...(assemblies.notepad.state === 'intact' || partNamed(assemblies.notepad, 'notepad pad').body
      ? [{ object: partNamed(assemblies.notepad, 'notepad pad').object, contains: (local) => (Math.abs(local.x) < 4 && Math.abs(local.z) < 5.25 && local.y > -0.5 && local.y < 0.35 + PAPER_REACH ? new THREE.Vector3(local.x, 0.37, local.z) : null) }]
      : []),
    ...cubicle.prints.map((print) => {
      const height = (print.width * print.size[1]) / print.size[0];
      return { object: print.object, contains: (local) => (Math.abs(local.x) < print.width / 2 && Math.abs(local.y) < height / 2 && local.z > -0.5 && local.z < PAPER_REACH ? new THREE.Vector3(local.x, local.y, 0.03) : null) };
    }),
  ],
});

// Overhead fluorescents: the level eases toward the switch state, striking with a flicker when turned on.
let overheadLevel = 1;
let strikeStart = -Infinity;
function playBallastTick(delay) {
  noise({ type: 'highpass', frequency: 2500, q: 0.7, duration: 0.01, gain: 0.12, delay });
  tone({ frequency: 120, duration: 0.09, gain: 0.03, type: 'sawtooth', filterFrequency: 800, delay });
}
function setOverhead(on) {
  if (on) {
    strikeStart = performance.now() / 1000;
    FLUORESCENT_STRIKE.forEach(([time, level]) => level > 0.5 && playBallastTick(time));
  } else strikeStart = -Infinity;
}
function updateOverhead(delta) {
  let target = power.switches.overhead && !blackout.lightsOut ? 1 : 0;
  const sinceStrike = performance.now() / 1000 - strikeStart;
  if (target === 1 && sinceStrike < FLUORESCENT_STRIKE.at(-1)[0]) {
    target = FLUORESCENT_STRIKE.findLast(([time]) => time <= sinceStrike)[1];
    overheadLevel = target;
  } else overheadLevel += (target - overheadLevel) * (1 - Math.exp(-delta * 12));
  const lit = AMBIENT_WHEN_DARK + (1 - AMBIENT_WHEN_DARK) * overheadLevel;
  cubicle.overhead.lights.forEach(({ light, full }, index) => (light.intensity = full * (index === 0 ? lit : overheadLevel)));
  cubicle.overhead.emissives.forEach(({ material, full }) => (material.emissiveIntensity = full * overheadLevel));
  scene.environmentIntensity = ENVIRONMENT_INTENSITY * lit;
}

// Switch positions and indicator lights follow the power state; parts only move while their object is intact.
const switchParts = {
  strip: [assemblies.powerStrip, partNamed(assemblies.powerStrip, 'power strip switch'), (object, on) => object.rotation.set(0, 0, on ? -0.22 : 0.22)],
  computer: [assemblies.systemUnit, partNamed(assemblies.systemUnit, 'power switch'), (object, on) => object.rotation.set(on ? -0.28 : 0.28, 0, 0)],
  monitor: [assemblies.monitor, partNamed(assemblies.monitor, 'monitor power button'), (object, on, part) => (object.position.z = part.localPosition.z - (on ? 0.12 : 0))],
  lamp: [assemblies.lamp, partNamed(assemblies.lamp, 'lamp switch'), (object, on, part) => (object.position.y = part.localPosition.y - (on ? 0.1 : 0))],
};
function updateIndicators() {
  const { state, switches } = power;
  for (const [name, [assembly, part, pose]] of Object.entries(switchParts)) {
    if (assembly.state === 'intact') pose(part.object, switches[name], part);
  }
  cubicle.wallSwitch.toggle.rotation.x = switches.overhead ? -0.3 : 0.3;
  powerStrip.rockerMaterial.emissiveIntensity = state.strip ? 1.3 : 0;
  computer.controls.computerLight.emissiveIntensity = state.computer ? LED_GLOW : 0;
  computer.controls.monitorLight.emissiveIntensity = state.monitor ? LED_GLOW : 0;
  lamp.light.intensity = state.lamp ? LAMP_INTENSITY : 0;
  lamp.bulbMaterial.emissiveIntensity = state.lamp ? BULB_GLOW : 0;
}

function tap(entry) {
  if (!entry.body?.world) return;
  physics.punch(entry.body, entry.point, entry.direction, TAP_STRENGTH);
  playImpact({ body: entry.body, material: entry.owner.material, speed: 12, mass: entry.body.mass, x: entry.point.x });
}

function floppyAssembly(assembly) {
  return floppies.some((_, index) => assemblies[`floppy${index + 1}`] === assembly);
}

// Single clicks: switches toggle, eject buttons eject, floppies go in (or come out), anything else gets a tap.
function onSingleClick(entry) {
  const { assembly, part } = entry.owner;
  if (floppyAssembly(assembly)) {
    const drive = floppyDrives.driveFor(assembly);
    if (!drive) {
      if (!floppyDrives.insert(assembly)) tap(entry);
    } else if (drive.ejected) floppyDrives.remove(assembly);
    else floppyDrives.eject(drive);
    return;
  }
  if (assembly === assemblies.mug && coffee.sip()) return;
  if (assembly === assemblies.stapler && assembly.state === 'intact') {
    staplerAction.staple();
    return;
  }
  if (assembly.state === 'intact' && part) {
    const switchName = Object.entries(switchParts).find(([, [owner, switchPart]]) => owner === assembly && switchPart === part)?.[0];
    if (switchName) {
      power.toggle(switchName);
      return;
    }
    const eject = /^floppy eject button (\d)$/.exec(part.name);
    if (eject) {
      part.object.position.z = part.localPosition.z - 0.08;
      setTimeout(() => assembly.state === 'intact' && (part.object.position.z = part.localPosition.z), 150);
      floppyDrives.eject(computer.drives[Number(eject[1]) - 1]);
      return;
    }
  }
  tap(entry);
}

window.addEventListener('keydown', (event) => {
  // Cmd shortcuts stay with the browser; Ctrl and Alt combinations go to the computer.
  if (event.metaKey || blackout.active) return;
  const functionKey = /^F\d+$/.test(event.code);
  if ((keyboard.has(event.code) && !functionKey) || (event.ctrlKey && power.state.keyboard)) event.preventDefault();
  if (event.repeat && !['Backspace', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  keyboard.press(event.code);
  // The keys always click; text only reaches the computer while it is on and the keyboard is plugged in.
  if (power.state.keyboard) activeApp.handleKey({ key: event.key, code: event.code, shift: event.shiftKey, ctrl: event.ctrlKey, alt: event.altKey });
});
window.addEventListener('keyup', (event) => keyboard.release(event.code));
window.addEventListener('blur', () => keyboard.releaseAll());

const parallax = new THREE.Vector2();
createInteraction({
  camera,
  canvas: renderer.domElement,
  physics,
  blockers: [cubicle.group],
  fixtures: () => plugFixtures,
  screen: computer.screen,
  keyboard,
  keyboardAssembly: assemblies.keyboard,
  isLocked: () => blackout.active,
  screenAcceptsPointer: () => screenOutput.showingPicture,
  getApp: () => activeApp,
  // Captured pointers can report positions outside the window; keep the parallax offset bounded.
  onPointerMove: (event) => toNormalizedDeviceCoordinates(event, parallax).clampScalar(-1, 1),
  events: {
    onKeycap: (code, shift) => power.state.keyboard && activeApp.handleKey({ key: keyForCode(code), code, shift, ctrl: false, alt: false }),
    onSingle: onSingleClick,
    // A held pencil moves over a horizontal plane at the height where its tip just reaches the desk.
    grabPlane(entry) {
      if (!pencilAssemblies.has(entry.owner.assembly)) return null;
      const reach = PENCIL_LENGTH / 2 + entry.localPivot.y;
      return new THREE.Plane(new THREE.Vector3(0, 1, 0), -(reach * -PENCIL_WRITING_AXIS.y - 0.15));
    },
    onThrow: (entry) => floppyAssembly(entry.owner.assembly) && floppyDrives.snapIfNearSlot(entry.owner.assembly),
    onPunch: (owner, at) => playPunch(owner.material, at.x),
    onBreak: (assembly, at) => playBreak(at.x),
    onReset: () => tone({ frequency: 520, endFrequency: 780, duration: 0.12, gain: 0.06 }),
    onPress: (owner, at) => owner.assembly === assemblies.stressBall && stressBall.press(at),
    onDrag: (owner, target) => owner?.assembly === assemblies.stressBall && stressBall.drag(target),
    onRelease: (owner) => owner.assembly === assemblies.stressBall && stressBall.release(),
  },
});

onAudioUnlock(() => {
  hum = startHum();
  if (!power.state.computer) hum?.setLevel(0, 0.05);
});

// Finds the closest camera distance along a fixed direction that keeps every frame point inside the viewport,
// then slides the target so the framed points sit centred vertically.
const fitCamera = new THREE.PerspectiveCamera(FIELD_OF_VIEW, 1, 0.1, 400);
const projected = new THREE.Vector3();
const FRAME_LIMITS = { x: 0.94, top: 0.92, bottom: -0.96 };
function placeFitCamera(target, distance) {
  fitCamera.position.copy(target).addScaledVector(DESK_VIEW.direction, distance);
  fitCamera.lookAt(target);
  fitCamera.updateMatrixWorld();
}
function projectedRange(target, distance) {
  placeFitCamera(target, distance);
  const range = { minY: Infinity, maxY: -Infinity, maxX: 0, behind: false };
  for (const framePoint of DESK_FRAME_POINTS) {
    projected.copy(framePoint).project(fitCamera);
    range.minY = Math.min(range.minY, projected.y);
    range.maxY = Math.max(range.maxY, projected.y);
    range.maxX = Math.max(range.maxX, Math.abs(projected.x));
    range.behind ||= projected.z >= 1;
  }
  return range;
}
function fitDeskPose() {
  fitCamera.aspect = camera.aspect;
  fitCamera.updateProjectionMatrix();
  const target = DESK_VIEW.target.clone();
  const cameraUp = new THREE.Vector3();
  let distance = 60;
  for (let pass = 0; pass < 4; pass += 1) {
    let near = 10;
    let far = 300;
    for (let iteration = 0; iteration < 28; iteration += 1) {
      const middle = (near + far) / 2;
      const range = projectedRange(target, middle);
      const fits = !range.behind && range.maxX <= FRAME_LIMITS.x && range.maxY <= FRAME_LIMITS.top && range.minY >= FRAME_LIMITS.bottom;
      if (fits) far = middle;
      else near = middle;
    }
    distance = far;
    const range = projectedRange(target, distance);
    const centreOffset = (range.maxY + range.minY) / 2 - (FRAME_LIMITS.top + FRAME_LIMITS.bottom) / 2;
    const halfHeight = distance * Math.tan(THREE.MathUtils.degToRad(FIELD_OF_VIEW / 2));
    cameraUp.set(0, 1, 0).applyQuaternion(fitCamera.quaternion);
    target.addScaledVector(cameraUp, centreOffset * halfHeight * 0.9);
  }
  return { position: target.clone().addScaledVector(DESK_VIEW.direction, distance), target };
}
let deskPose = fitDeskPose();
window.addEventListener('resize', () => (deskPose = fitDeskPose()));
camera.position.copy(deskPose.position);
camera.lookAt(deskPose.target);

// The zoomed view sits head-on in front of the screen wherever the monitor ends up. Within that, it may shift
// sideways (keeping the same viewing direction) and back off a little so the wall light switch is in frame too.
// The pose is searched only when the monitor or the viewport changes; if the switch cannot be framed without
// losing the screen (the monitor was knocked away), the screen-only pose wins.
const ZOOM_SEARCH = { maxBackOff: 1.35, distanceSteps: 10, maxShift: 6, shiftStep: 0.5, maxRise: 3, riseStep: 0.75 };
const ZOOM_LIMITS = { screen: 0.95, switch: 0.72, minFill: 0.6 };
const screenPosition = new THREE.Vector3();
const screenQuaternion = new THREE.Quaternion();
const screenNormal = new THREE.Vector3();
const screenRight = new THREE.Vector3();
const screenUp = new THREE.Vector3();
const dawPose = { position: new THREE.Vector3(), target: new THREE.Vector3(), switchFramed: false };
const zoomCamera = new THREE.PerspectiveCamera(DAW_FIELD_OF_VIEW, 1, 0.1, 400);
const zoomProbe = new THREE.Vector3();
let zoomCacheKey = '';
// Screen glass corners and bezel corners in the screen's local frame (the bezel is centred 0.4 lower than the glass).
const SCREEN_CORNERS = [-1, 1].flatMap((sx) => [-1, 1].map((sy) => new THREE.Vector3((sx * SCREEN_SIZE.width) / 2, (sy * SCREEN_SIZE.height) / 2, 0.5)));
const BEZEL_CORNERS = [-1, 1].flatMap((sx) => [-1, 1].map((sy) => new THREE.Vector3(sx * 9, -0.4 + sy * 7.75, -0.05)));
const SWITCH_CORNERS = [-1, 1].flatMap((sx) => [-1, 1].map((sy) => new THREE.Vector3(sx * WALL_SWITCH_HALF_SIZE.width, sy * WALL_SWITCH_HALF_SIZE.height, 0).add(WALL_SWITCH_POSITION)));

function projectedBounds(points, toWorld) {
  const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, behind: false };
  for (const point of points) {
    zoomProbe.copy(point);
    if (toWorld) zoomProbe.applyMatrix4(computer.screen.matrixWorld);
    zoomProbe.project(zoomCamera);
    bounds.behind ||= zoomProbe.z > 1;
    bounds.minX = Math.min(bounds.minX, zoomProbe.x);
    bounds.maxX = Math.max(bounds.maxX, zoomProbe.x);
    bounds.minY = Math.min(bounds.minY, zoomProbe.y);
    bounds.maxY = Math.max(bounds.maxY, zoomProbe.y);
  }
  return bounds;
}

function evaluateZoom(distance, shift, rise) {
  const target = screenPosition.clone().addScaledVector(screenRight, shift).addScaledVector(screenUp, rise);
  zoomCamera.position.copy(target).addScaledVector(screenNormal, distance);
  zoomCamera.lookAt(target);
  zoomCamera.updateMatrixWorld();
  const glass = projectedBounds(SCREEN_CORNERS, true);
  const screenFits = !glass.behind && glass.minX >= -ZOOM_LIMITS.screen && glass.maxX <= ZOOM_LIMITS.screen && glass.minY >= -ZOOM_LIMITS.screen && glass.maxY <= ZOOM_LIMITS.screen;
  const fill = (glass.maxX - glass.minX) / 2;
  const wallSwitch = projectedBounds(SWITCH_CORNERS, false);
  const bezel = projectedBounds(BEZEL_CORNERS, true);
  const hiddenByMonitor = wallSwitch.maxX > bezel.minX && wallSwitch.minX < bezel.maxX && wallSwitch.maxY > bezel.minY && wallSwitch.minY < bezel.maxY;
  const switchFramed =
    !wallSwitch.behind && !hiddenByMonitor && Math.max(Math.abs(wallSwitch.minX), Math.abs(wallSwitch.maxX), Math.abs(wallSwitch.minY), Math.abs(wallSwitch.maxY)) <= ZOOM_LIMITS.switch;
  return { target, position: zoomCamera.position.clone(), screenFits, fill, switchFramed };
}

function updateDawPose() {
  computer.screen.updateWorldMatrix(true, false);
  const key = `${camera.aspect.toFixed(3)}|${computer.screen.matrixWorld.elements.map((value) => value.toFixed(2)).join(',')}`;
  if (key === zoomCacheKey) return dawPose;
  zoomCacheKey = key;
  computer.screen.matrixWorld.decompose(screenPosition, screenQuaternion, new THREE.Vector3());
  screenNormal.set(0, 0, 1).applyQuaternion(screenQuaternion);
  screenRight.set(1, 0, 0).applyQuaternion(screenQuaternion);
  screenUp.set(0, 1, 0).applyQuaternion(screenQuaternion);
  zoomCamera.aspect = camera.aspect;
  zoomCamera.updateProjectionMatrix();
  const halfTangent = Math.tan(THREE.MathUtils.degToRad(DAW_FIELD_OF_VIEW / 2));
  const widthFit = SCREEN_SIZE.width / 2 / (DAW_SCREEN_WIDTH_FRACTION * halfTangent * camera.aspect);
  const heightFit = SCREEN_SIZE.height / 2 / (0.92 * halfTangent);
  const baseDistance = Math.max(widthFit, heightFit);
  let best = evaluateZoom(baseDistance, 0, 0);
  let bestCost = Infinity;
  for (let step = 0; step <= ZOOM_SEARCH.distanceSteps; step += 1) {
    const distance = baseDistance * (1 + ((ZOOM_SEARCH.maxBackOff - 1) * step) / ZOOM_SEARCH.distanceSteps);
    for (let shift = -ZOOM_SEARCH.maxShift; shift <= ZOOM_SEARCH.maxShift; shift += ZOOM_SEARCH.shiftStep) {
      for (let rise = -ZOOM_SEARCH.maxRise; rise <= ZOOM_SEARCH.maxRise; rise += ZOOM_SEARCH.riseStep) {
        const candidate = evaluateZoom(distance, shift, rise);
        if (!candidate.screenFits || !candidate.switchFramed) continue;
        const cost = distance - baseDistance + 0.05 * (shift * shift + rise * rise) + (candidate.fill < ZOOM_LIMITS.minFill ? 40 * (ZOOM_LIMITS.minFill - candidate.fill) : 0);
        if (cost < bestCost) {
          bestCost = cost;
          best = candidate;
        }
      }
    }
  }
  dawPose.position.copy(best.position);
  dawPose.target.copy(best.target);
  dawPose.switchFramed = best.switchFramed;
  return dawPose;
}

// Anything knocked somewhere the desk camera cannot see comes back after a few seconds.
const viewFrustum = new THREE.Frustum();
const viewMatrix = new THREE.Matrix4();
const bodySphere = new THREE.Sphere(new THREE.Vector3(), 1.5);
const offscreenSeconds = new Map();
let offscreenCheckTimer = 0;
function resetLostObjects(delta) {
  offscreenCheckTimer += delta;
  if (offscreenCheckTimer < 0.25 || cameraMode !== 'desk') return;
  const elapsed = offscreenCheckTimer;
  offscreenCheckTimer = 0;
  fitCamera.position.copy(deskPose.position);
  fitCamera.lookAt(deskPose.target);
  fitCamera.updateMatrixWorld();
  viewFrustum.setFromProjectionMatrix(viewMatrix.multiplyMatrices(fitCamera.projectionMatrix, fitCamera.matrixWorldInverse));
  for (const assembly of Object.values(assemblies)) {
    // The stress ball never respawns; it is kept in play by its own boundary.
    if (assembly === assemblies.stressBall) continue;
    const atRest = assembly.state === 'held' || (assembly.state === 'intact' && assembly.root.position.distanceTo(assembly.restPosition) < 1);
    const visible =
      atRest ||
      physics.bodiesOf(assembly).some((body) => {
        if (!body || body.position.y < -12) return false;
        bodySphere.center.set(body.position.x, body.position.y, body.position.z);
        return viewFrustum.intersectsSphere(bodySphere);
      });
    const seconds = visible ? 0 : (offscreenSeconds.get(assembly) ?? 0) + elapsed;
    offscreenSeconds.set(assembly, seconds);
    if (seconds > OFFSCREEN_RESET_SECONDS) {
      offscreenSeconds.set(assembly, 0);
      physics.resetAssembly(assembly);
      for (const restored of [assembly, ...assembly.dependents]) respawnFade.fadeIn(restored.root);
    }
  }
}

const respawnFade = createRespawnFade();

function placeDeskCamera() {
  fitCamera.position.copy(deskPose.position);
  fitCamera.lookAt(deskPose.target);
  fitCamera.updateMatrixWorld();
  return fitCamera;
}
const deskViewFrustum = new THREE.Frustum();
const ballSphere = new THREE.Sphere(new THREE.Vector3(), 1.4);
const ballBoundary = createBallBoundary({
  camera,
  getBodies: () => physics.bodiesOf(assemblies.stressBall),
  isInDeskView(position) {
    const deskCamera = placeDeskCamera();
    deskViewFrustum.setFromProjectionMatrix(viewMatrix.multiplyMatrices(deskCamera.projectionMatrix, deskCamera.matrixWorldInverse));
    return deskViewFrustum.intersectsSphere(ballSphere.set(ballSphere.center.set(position.x, position.y, position.z), 1.4));
  },
  onBounce(speed, direction) {
    if (assemblies.stressBall.state === 'intact') stressBall.impact(speed * 2, direction);
  },
});

// While a pencil is held it is steered toward a writing angle; its graphite tip draws where it meets the desk.
const pencilAssemblies = new Set(pencilCup.pencils.map((_, index) => assemblies[`pencil${index + 1}`]));
const tipAxis = new THREE.Vector3();
const steer = new THREE.Vector3();
function heldPencilBody() {
  const body = physics.grabbedBody();
  return body && pencilAssemblies.has(body.owner?.assembly) && body.owner.assembly.state === 'intact' ? body : null;
}
physics.onStep(() => {
  ballBoundary.step();
  const body = heldPencilBody();
  if (!body) return;
  const { x, y, z, w } = body.quaternion;
  tipAxis.set(0, -1, 0).applyQuaternion(new THREE.Quaternion(x, y, z, w));
  steer.crossVectors(tipAxis, PENCIL_WRITING_AXIS).multiplyScalar(PENCIL_TILT_GAIN);
  body.angularVelocity.set(steer.x, steer.y, steer.z);
});
function pencilTip() {
  const body = heldPencilBody();
  if (!body) return null;
  const { x, y, z, w } = body.quaternion;
  tipAxis.set(0, -1, 0).applyQuaternion(new THREE.Quaternion(x, y, z, w));
  return new THREE.Vector3(body.position.x, body.position.y, body.position.z).addScaledVector(tipAxis, PENCIL_LENGTH / 2);
}

const stats = { fps: 0, frameMs: 0 };
let statsFrames = 0;
let statsStart = performance.now();
// Debug handle for console inspection and automated checks, only with ?debug in the URL.
if (new URLSearchParams(window.location.search).has('debug')) window.__desk = { camera, scene, renderer, physics, assemblies, cables, stats, power, floppyDrives, apps, resetScene, deskDrawing, staplerAction, cubicle, blackout, coffee, get activeApp() { return activeApp; } };

const tick = createClock();
const lookTarget = deskPose.target.clone();
const desiredPosition = new THREE.Vector3();
const parallaxOffset = new THREE.Vector3();
function animate() {
  const { delta, seconds } = tick();
  physics.step(delta);
  keyboard.update(delta);
  stressBall.update(delta);
  floppyDrives.update(delta);
  respawnFade.update(delta);
  coffee.update(delta);
  staplerAction.update(delta);
  ballBoundary.update(delta, placeDeskCamera());
  deskDrawing.update(pencilTip(), delta);
  cables.update(delta);
  power.refresh();
  updateIndicators();
  updateOverhead(delta);
  cameraMode = power.switches.overhead ? 'desk' : 'daw';
  resetLostObjects(delta);

  screenOutput.draw(seconds, (context, time) => activeApp.draw(context, time));
  computer.texture.needsUpdate = true;

  const pose = cameraMode === 'daw' ? updateDawPose() : deskPose;
  const parallaxScale = cameraMode === 'daw' ? 0.08 : 1;
  const fieldOfView = cameraMode === 'daw' ? DAW_FIELD_OF_VIEW : FIELD_OF_VIEW;
  if (Math.abs(camera.fov - fieldOfView) > 0.01) {
    camera.fov += (fieldOfView - camera.fov) * (1 - Math.exp(-delta * 4));
    camera.updateProjectionMatrix();
  }
  parallaxOffset.set(parallax.x * 2.2 * parallaxScale, parallax.y * 1.2 * parallaxScale, 0);
  desiredPosition.copy(pose.position).add(parallaxOffset);
  const ease = 1 - Math.exp(-delta * 4);
  camera.position.lerp(desiredPosition, ease);
  lookTarget.lerp(pose.target, ease);
  camera.lookAt(lookTarget);

  stage.render(seconds);

  statsFrames += 1;
  const now = performance.now();
  if (now - statsStart >= 1000) {
    stats.fps = (statsFrames * 1000) / (now - statsStart);
    stats.frameMs = (now - statsStart) / statsFrames;
    statsFrames = 0;
    statsStart = now;
  }
  requestAnimationFrame(animate);
}

document.fonts.load('32px VT323').finally(animate);
