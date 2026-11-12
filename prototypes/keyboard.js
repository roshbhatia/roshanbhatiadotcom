import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createStage, createClock, glossyPlastic, toNormalizedDeviceCoordinates } from './shared/stage.js';
import { noise, tone, chime, arpeggio, startPad, onAudioUnlock, PENTATONIC, midiToFrequency } from './shared/audio.js';

const LINKS = {
  github: 'https://github.com/roshbhatia',
  linkedin: 'https://www.linkedin.com/in/roshan-bhatia-2b1970a7/',
};

const letters = (codes) => codes.split('').map((character) => [`Key${character.toUpperCase()}`, character, 1]);
const digits = '1234567890'.split('').map((digit) => [`Digit${digit}`, digit, 1]);

const ROWS = [
  [['Escape', 'esc', 1], ...digits, ['Minus', '-', 1], ['Equal', '=', 1], ['Backspace', 'delete', 2]],
  [['Tab', 'tab', 1.5], ...letters('qwertyuiop'), ['BracketLeft', '[', 1], ['BracketRight', ']', 1], ['Backslash', '\\', 1.5]],
  [['CapsLock', 'caps', 1.75], ...letters('asdfghjkl'), ['Semicolon', ';', 1], ['Quote', "'", 1], ['Enter', 'return', 2.25]],
  [['ShiftLeft', 'shift', 2.25], ...letters('zxcvbnm'), ['Comma', ',', 1], ['Period', '.', 1], ['Slash', '/', 1], ['ShiftRight', 'shift', 2.75]],
  [
    ['ControlLeft', 'ctrl', 1.25],
    ['AltLeft', 'opt', 1.25],
    ['MetaLeft', 'cmd', 1.25],
    ['Space', '', 6.25],
    ['MetaRight', 'cmd', 1.25],
    ['AltRight', 'opt', 1.25],
    ['ArrowLeft', '<', 1.25],
    ['ControlRight', 'ctrl', 1.25],
  ],
];

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
const cameraHome = new THREE.Vector3(0, 13.5, 12.5);
camera.position.copy(cameraHome);
const stage = createStage({ camera, background: ['#5fb8f5', '#a9dcff', '#e3f4ff'], environmentIntensity: 0.7, haze: 0.15 });
const { scene } = stage;

scene.add(new THREE.HemisphereLight(0xffffff, 0x9fcfff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(4, 10, 6);
scene.add(sun);

const keyboard = new THREE.Group();
keyboard.rotation.x = 0.08;
scene.add(keyboard);

const shell = new THREE.Mesh(
  new RoundedBoxGeometry(16.2, 0.9, 6.2, 6, 0.4),
  glossyPlastic(0x9ddcff, { transmission: 0.85, thickness: 1.5, roughness: 0.22, ior: 1.4, iridescence: 0.25 }),
);
shell.position.y = -0.55;
keyboard.add(shell);

const plate = new THREE.Mesh(
  new RoundedBoxGeometry(15.4, 0.1, 5.4, 2, 0.05),
  new THREE.MeshStandardMaterial({ color: 0xf4f9ff, roughness: 0.4, metalness: 0.3 }),
);
plate.position.y = -0.1;
keyboard.add(plate);

const KEY_COLORS = {
  alpha: { cap: 0xf6f9ff, ink: '#2f6aa6' },
  modifier: { cap: 0xcfe9ff, ink: '#245d98' },
  accent: { cap: 0x7fd4ff, ink: '#ffffff' },
  space: { cap: 0xdcd2ff, ink: '#6a58c0' },
};

function keyStyle(code) {
  if (code === 'Escape' || code === 'Enter') return KEY_COLORS.accent;
  if (code === 'Space') return KEY_COLORS.space;
  if (code.startsWith('Key') || code.startsWith('Digit')) return KEY_COLORS.alpha;
  return KEY_COLORS.modifier;
}

function createLabelTexture(label, width, style) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(128 * width);
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = `#${style.cap.toString(16).padStart(6, '0')}`;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = style.ink;
  context.font = `500 ${label.length > 1 ? 34 : 58}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

const KEY_GAP = 0.1;
const KEY_HEIGHT = 0.5;
const PRESS_DEPTH = 0.24;
const keys = new Map();
const keyMeshes = [];
const sideMaterials = new Map();

ROWS.forEach((row, rowIndex) => {
  const rowWidth = row.reduce((sum, [, , width]) => sum + width, 0);
  let cursor = -rowWidth / 2;
  row.forEach(([code, label, width], columnIndex) => {
    const style = keyStyle(code);
    if (!sideMaterials.has(style)) sideMaterials.set(style, glossyPlastic(style.cap));
    const side = sideMaterials.get(style);
    const top = glossyPlastic(0xffffff, { map: createLabelTexture(label, width, style), roughness: 0.4, clearcoat: 0.35 });
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(width - KEY_GAP, KEY_HEIGHT, 1 - KEY_GAP, 4, 0.12), [
      side,
      side,
      top,
      side,
      side,
      side,
    ]);
    const restY = KEY_HEIGHT / 2;
    mesh.position.set(cursor + width / 2, restY, rowIndex - 2);
    mesh.userData.code = code;
    keyboard.add(mesh);
    keyMeshes.push(mesh);
    keys.set(code, {
      mesh,
      restY,
      offset: 0,
      velocity: 0,
      pressed: false,
      width,
      note: PENTATONIC[Math.min(columnIndex, PENTATONIC.length - 1)] / (rowIndex > 2 ? 2 : 1),
      pan: (cursor + width / 2) / 8,
    });
    cursor += width;
  });
});

const screen = document.createElement('div');
screen.className = 'glass';
Object.assign(screen.style, {
  position: 'fixed',
  left: '50%',
  bottom: '28px',
  transform: 'translateX(-50%)',
  padding: '12px 22px',
  minWidth: '240px',
  textAlign: 'center',
  fontFamily: 'Michroma, sans-serif',
  fontSize: '15px',
  letterSpacing: '0.12em',
  color: '#1d7fe0',
  transition: 'box-shadow 0.3s ease',
});
document.body.appendChild(screen);

let typed = '';
function renderScreen() {
  screen.textContent = `${typed.slice(-18)}_`;
}
renderScreen();

function handleCharacter(code) {
  if (code === 'Backspace') typed = typed.slice(0, -1);
  else if (code === 'Space') typed += ' ';
  else if (code.startsWith('Key')) typed += code.slice(3).toLowerCase();
  else if (code.startsWith('Digit')) typed += code.slice(5);
  else return;
  renderScreen();
  for (const [word, url] of Object.entries(LINKS)) {
    if (typed.endsWith(word)) {
      arpeggio([72, 76, 79, 84, 88].map(midiToFrequency));
      screen.style.boxShadow = '0 0 40px rgba(80, 180, 255, 0.9), inset 0 1px 0 #fff';
      setTimeout(() => (screen.style.boxShadow = ''), 600);
      window.open(url, '_blank', 'noopener');
      typed = '';
      setTimeout(renderScreen, 400);
    }
  }
}

function pressKey(code) {
  const key = keys.get(code);
  if (!key || key.pressed) return;
  key.pressed = true;
  const pitch = (1 / Math.sqrt(key.width)) * (0.96 + Math.random() * 0.08);
  noise({ frequency: 3800 * pitch, q: 2, duration: 0.014, gain: 0.12, pan: key.pan });
  tone({ frequency: 190 * pitch, endFrequency: 110 * pitch, duration: 0.08, gain: 0.22, delay: 0.01, pan: key.pan });
  noise({ frequency: 1100 * pitch, q: 1.4, duration: 0.05, gain: 0.12, delay: 0.01, pan: key.pan });
  chime({ frequency: key.note, gain: 0.045, duration: 0.8, pan: key.pan });
  handleCharacter(code);
}

function releaseKey(code) {
  const key = keys.get(code);
  if (!key || !key.pressed) return;
  key.pressed = false;
  noise({ frequency: 2600, q: 2, duration: 0.015, gain: 0.05, pan: key.pan });
}

window.addEventListener('keydown', (event) => {
  if (!keys.has(event.code) || event.metaKey) return;
  event.preventDefault();
  if (!event.repeat) pressKey(event.code);
});
window.addEventListener('keyup', (event) => releaseKey(event.code));
window.addEventListener('blur', () => keys.forEach((_, code) => releaseKey(code)));

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const parallax = new THREE.Vector2();
let pointerKey = null;

window.addEventListener('pointerdown', (event) => {
  raycaster.setFromCamera(toNormalizedDeviceCoordinates(event, pointer), camera);
  const [hit] = raycaster.intersectObjects(keyMeshes, false);
  if (!hit) return;
  pointerKey = hit.object.userData.code;
  pressKey(pointerKey);
});
window.addEventListener('pointerup', () => {
  if (pointerKey) releaseKey(pointerKey);
  pointerKey = null;
});
window.addEventListener('pointermove', (event) => toNormalizedDeviceCoordinates(event, parallax));

onAudioUnlock(() => startPad({ frequencies: [60, 64, 67, 71].map((note) => midiToFrequency(note - 12)) }));

const tick = createClock();
const lookTarget = new THREE.Vector3(0, -0.3, 0.6);
function animate() {
  const { delta, seconds } = tick();
  for (const key of keys.values()) {
    const target = key.pressed ? -PRESS_DEPTH : 0;
    key.velocity += (900 * (target - key.offset) - 34 * key.velocity) * delta;
    key.offset += key.velocity * delta;
    key.mesh.position.y = key.restY + key.offset;
  }
  keyboard.position.y = Math.sin(seconds * 0.8) * 0.08;
  camera.position.x += (cameraHome.x + parallax.x * 1.6 - camera.position.x) * 0.05;
  camera.position.y += (cameraHome.y + parallax.y * 1.0 - camera.position.y) * 0.05;
  camera.lookAt(lookTarget);
  stage.render(seconds);
  requestAnimationFrame(animate);
}
animate();
