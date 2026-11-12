import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { noise, tone } from '../shared/audio.js';
import { addMerged, addMesh, createAnchor, createPart, merge, place } from './geometry.js';
import { box } from './physics.js';

// Full-size 101-key layout in key units. Row 0 is the function row; rows 1-5 are the main block.
const ROW_Z = [0, 1.5, 2.5, 3.5, 4.5, 5.5];
const ROW_TILT = [0.2, 0.16, 0.08, 0, -0.06, -0.1];
const GAP = (width) => [null, null, width];
const letters = (characters) => [...characters].map((character) => [`Key${character.toUpperCase()}`, character.toUpperCase()]);
const fKeys = (from, to) => Array.from({ length: to - from + 1 }, (_, index) => [`F${from + index}`, `F${from + index}`]);

const LAYOUT = [
  [0, 0, [['Escape', 'Esc'], GAP(1), ...fKeys(1, 4), GAP(0.5), ...fKeys(5, 8), GAP(0.5), ...fKeys(9, 12)]],
  [1, 0, [['Backquote', '`'], ...[...'1234567890'].map((digit) => [`Digit${digit}`, digit]), ['Minus', '-'], ['Equal', '='], ['Backspace', '←', 2]]],
  [2, 0, [['Tab', 'Tab', 1.5], ...letters('qwertyuiop'), ['BracketLeft', '['], ['BracketRight', ']'], ['Backslash', '\\', 1.5]]],
  [3, 0, [['CapsLock', 'Caps Lock', 1.75], ...letters('asdfghjkl'), ['Semicolon', ';'], ['Quote', "'"], ['Enter', 'Enter', 2.25]]],
  [4, 0, [['ShiftLeft', 'Shift', 2.25], ...letters('zxcvbnm'), ['Comma', ','], ['Period', '.'], ['Slash', '/'], ['ShiftRight', 'Shift', 2.75]]],
  [5, 0, [['ControlLeft', 'Ctrl', 1.5], GAP(1), ['AltLeft', 'Alt', 1.5], ['Space', '', 7], ['AltRight', 'Alt', 1.5], GAP(1), ['ControlRight', 'Ctrl', 1.5]]],
  [0, 15.5, [['PrintScreen', 'Prt Sc'], ['ScrollLock', 'Scroll'], ['Pause', 'Pause']]],
  [1, 15.5, [['Insert', 'Ins'], ['Home', 'Home'], ['PageUp', 'PgUp']]],
  [2, 15.5, [['Delete', 'Del'], ['End', 'End'], ['PageDown', 'PgDn']]],
  [4, 15.5, [GAP(1), ['ArrowUp', '↑']]],
  [5, 15.5, [['ArrowLeft', '←'], ['ArrowDown', '↓'], ['ArrowRight', '→']]],
  [1, 19, [['NumLock', 'Num'], ['NumpadDivide', '/'], ['NumpadMultiply', '*'], ['NumpadSubtract', '-']]],
  [2, 19, [['Numpad7', '7'], ['Numpad8', '8'], ['Numpad9', '9'], ['NumpadAdd', '+', 1, 2]]],
  [3, 19, [['Numpad4', '4'], ['Numpad5', '5'], ['Numpad6', '6']]],
  [4, 19, [['Numpad1', '1'], ['Numpad2', '2'], ['Numpad3', '3'], ['NumpadEnter', 'Enter', 1, 2]]],
  [5, 19, [['Numpad0', '0', 2], ['NumpadDecimal', '.']]],
];
const LAYOUT_WIDTH = 23;
const LAYOUT_DEPTH = 6.5;

const LIGHT_CODES = /^(Key|Digit|Numpad\d|Space|Backquote|Minus|Equal|Bracket|Backslash|Semicolon|Quote|Comma|Period|Slash|NumpadDecimal)/;
const COLORS = { case: 0xd9cfb6, light: 0xe8e1ce, dark: 0xb4ad9b, ink: '#14120e' };
const CAP_HEIGHT = 0.6;
const PRESS_DEPTH = 0.34;

function createCapGeometry(width, depth) {
  const geometry = new RoundedBoxGeometry(width - 0.08, CAP_HEIGHT, depth - 0.08, 3, 0.07);
  const positions = geometry.attributes.position;
  const topScaleX = (width - 0.34) / (width - 0.08);
  const topScaleZ = (depth - 0.34) / (depth - 0.08);
  for (let index = 0; index < positions.count; index += 1) {
    const t = (positions.getY(index) + CAP_HEIGHT / 2) / CAP_HEIGHT;
    positions.setX(index, positions.getX(index) * (1 - t * (1 - topScaleX)));
    positions.setZ(index, positions.getZ(index) * (1 - t * (1 - topScaleZ)));
  }
  return groupSidesAndTop(geometry);
}

// Reorders the six box-face groups into two (sides, then the +Y top) so each cap costs two draw calls, not six.
function groupSidesAndTop(geometry) {
  const source = geometry.index ? geometry.toNonIndexed() : geometry;
  const groups = [...geometry.groups].sort((a, b) => (a.materialIndex === 2) - (b.materialIndex === 2));
  const sorted = new THREE.BufferGeometry();
  for (const [name, attribute] of Object.entries(source.attributes)) {
    const values = new Float32Array(attribute.count * attribute.itemSize);
    let offset = 0;
    for (const group of groups) {
      const slice = attribute.array.subarray(group.start * attribute.itemSize, (group.start + group.count) * attribute.itemSize);
      values.set(slice, offset);
      offset += slice.length;
    }
    sorted.setAttribute(name, new THREE.BufferAttribute(values, attribute.itemSize));
  }
  const topCount = groups.filter((group) => group.materialIndex === 2).reduce((sum, group) => sum + group.count, 0);
  const total = groups.reduce((sum, group) => sum + group.count, 0);
  sorted.addGroup(0, total - topCount, 0);
  sorted.addGroup(total - topCount, topCount, 1);
  return sorted;
}

function createLabelTexture(label, width, depth, capColor) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(128 * width);
  canvas.height = Math.round(128 * depth);
  const context = canvas.getContext('2d');
  context.fillStyle = `#${capColor.toString(16).padStart(6, '0')}`;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = COLORS.ink;
  context.textBaseline = 'top';
  const single = [...label].length === 1;
  const fontSize = single ? 74 : label.length > 5 ? 32 : 40;
  context.font = `700 ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  context.fillText(label, single ? 24 : 20, single ? 16 : 24, canvas.width - 36);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createLed(color) {
  const material = new THREE.MeshStandardMaterial({ color: 0x2c3a2c, emissive: color, emissiveIntensity: 0 });
  return new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), material);
}

export function playBucklingSpring(key, phase) {
  const large = key.width >= 2;
  const pan = key.pan;
  const variation = 0.94 + Math.random() * 0.12;
  if (phase === 'down') {
    noise({ type: 'highpass', frequency: 3200 * variation, q: 0.7, duration: 0.018, gain: 0.3, pan });
    tone({ frequency: 2600 * variation, endFrequency: 2400 * variation, duration: 0.07, gain: 0.02, pan });
    tone({ frequency: (large ? 110 : 170) * variation, endFrequency: (large ? 70 : 110) * variation, duration: 0.07, gain: 0.24, delay: 0.004, pan });
    noise({ frequency: large ? 700 : 1300, q: 1.2, duration: 0.045, gain: 0.18, delay: 0.004, pan });
    if (large) noise({ frequency: 2000, q: 4, duration: 0.09, gain: 0.05, delay: 0.01, pan });
  } else {
    noise({ type: 'highpass', frequency: 2800 * variation, q: 0.7, duration: 0.012, gain: 0.15, pan });
    tone({ frequency: 2300 * variation, endFrequency: 2200 * variation, duration: 0.05, gain: 0.012, pan });
    tone({ frequency: 150, endFrequency: 100, duration: 0.05, gain: 0.08, pan });
  }
}

const CASE_WIDTH = LAYOUT_WIDTH + 1.4;
const CASE_DEPTH = LAYOUT_DEPTH + 2.2;
const CASE_CENTER_Z = 0.25;
const CASE_BOTTOM = -1.25;
const SEAM_Y = -0.55;
const CASE_TOP = 0.15;
const FOOT_HEIGHT = 0.8;

function createCaseRim() {
  const height = CASE_TOP - SEAM_Y;
  const centerY = (CASE_TOP + SEAM_Y) / 2;
  const wellHalfWidth = LAYOUT_WIDTH / 2 + 0.1;
  const wellHalfDepth = LAYOUT_DEPTH / 2 + 0.1;
  const front = CASE_CENTER_Z + CASE_DEPTH / 2;
  const back = CASE_CENTER_Z - CASE_DEPTH / 2;
  const bars = [
    [CASE_WIDTH, front - wellHalfDepth, 0, (front + wellHalfDepth) / 2],
    [CASE_WIDTH, -wellHalfDepth - back, 0, (back - wellHalfDepth) / 2],
    [CASE_WIDTH / 2 - wellHalfWidth, wellHalfDepth * 2, -(CASE_WIDTH / 2 + wellHalfWidth) / 2, 0],
    [CASE_WIDTH / 2 - wellHalfWidth, wellHalfDepth * 2, (CASE_WIDTH / 2 + wellHalfWidth) / 2, 0],
  ];
  const geometries = bars.map(([width, depth, x, z]) => place(new RoundedBoxGeometry(width, height, depth, 2, 0.12), [x, centerY, z]));
  const colliders = bars.map(([width, depth, x, z]) => box([width, height, depth], [x, centerY, z]));
  return { geometry: merge(geometries), colliders };
}

export function createKeyboard() {
  const group = new THREE.Group();
  group.name = 'keyboard';
  const keys = new Map();
  const meshes = [];
  const parts = [];
  const geometryCache = new Map();
  const sideMaterials = {
    light: new THREE.MeshStandardMaterial({ color: COLORS.light, roughness: 0.6 }),
    dark: new THREE.MeshStandardMaterial({ color: COLORS.dark, roughness: 0.6 }),
  };
  const caseMaterial = new THREE.MeshStandardMaterial({ color: COLORS.case, roughness: 0.55 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x2f2d2a, roughness: 0.9 });

  const bottomCase = createPart(group, 'keyboard bottom case');
  const bottomHeight = SEAM_Y - CASE_BOTTOM;
  addMesh(bottomCase, new RoundedBoxGeometry(CASE_WIDTH, bottomHeight, CASE_DEPTH, 3, 0.25), caseMaterial, [0, (SEAM_Y + CASE_BOTTOM) / 2, CASE_CENTER_Z]);
  const footZ = CASE_CENTER_Z - CASE_DEPTH / 2 + 0.9;
  const feet = [-1, 1].map((side) => place(new RoundedBoxGeometry(2.4, FOOT_HEIGHT, 1.2, 2, 0.15), [side * (CASE_WIDTH / 2 - 2.2), CASE_BOTTOM - FOOT_HEIGHT / 2, footZ]));
  addMerged(bottomCase, feet, rubber);
  parts.push({
    object: bottomCase,
    mass: 1.2,
    colliders: [
      box([CASE_WIDTH, bottomHeight, CASE_DEPTH], [0, (SEAM_Y + CASE_BOTTOM) / 2, CASE_CENTER_Z]),
      ...[-1, 1].map((side) => box([2.4, FOOT_HEIGHT, 1.2], [side * (CASE_WIDTH / 2 - 2.2), CASE_BOTTOM - FOOT_HEIGHT / 2, footZ])),
    ],
  });

  const topCase = createPart(group, 'keyboard top case');
  const rim = createCaseRim();
  addMesh(topCase, rim.geometry, caseMaterial);
  const badge = addMesh(
    topCase,
    new RoundedBoxGeometry(1.6, 0.06, 0.5, 2, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x3a3a40, metalness: 0.6, roughness: 0.3 }),
    [LAYOUT_WIDTH / 2 - 1.5, CASE_TOP + 0.01, LAYOUT_DEPTH / 2 + 0.9],
  );
  badge.castShadow = false;
  parts.push({ object: topCase, mass: 0.8, colliders: rim.colliders });

  const plate = createPart(group, 'keyboard steel plate');
  addMesh(
    plate,
    new THREE.BoxGeometry(LAYOUT_WIDTH + 0.2, 0.12, LAYOUT_DEPTH + 0.2),
    new THREE.MeshStandardMaterial({ color: 0x77736a, roughness: 0.7, metalness: 0.4 }),
    [0, 0.14, 0],
  );
  parts.push({ object: plate, material: 'metal', mass: 0.9 });

  for (const [row, startX, entries] of LAYOUT) {
    let cursor = startX;
    for (const [code, label, width = 1, depth = 1] of entries) {
      if (code) {
        const shade = LIGHT_CODES.test(code) ? 'light' : 'dark';
        const geometryKey = `${width}x${depth}`;
        if (!geometryCache.has(geometryKey)) geometryCache.set(geometryKey, createCapGeometry(width, depth));
        const top = new THREE.MeshStandardMaterial({
          map: createLabelTexture(label, width, depth, COLORS[shade]),
          roughness: 0.55,
        });
        const side = sideMaterials[shade];
        const x = cursor + width / 2 - LAYOUT_WIDTH / 2;
        const z = ROW_Z[row] + (depth - 1) / 2 - LAYOUT_DEPTH / 2 + 0.5;
        const pivot = createPart(group, `keycap ${code}`, [x, CAP_HEIGHT / 2 + 0.2, z], [ROW_TILT[row], 0, 0]);
        const mesh = new THREE.Mesh(geometryCache.get(geometryKey), [side, top]);
        mesh.castShadow = true;
        mesh.userData.code = code;
        pivot.add(mesh);
        meshes.push(mesh);
        parts.push({ object: pivot, mass: 0.03 * width, intact: false });
        keys.set(code, { mesh, offset: 0, velocity: 0, pressed: false, width, pan: x / (LAYOUT_WIDTH / 2) });
      }
      cursor += width;
    }
  }

  const indicatorPanel = createPart(group, 'keyboard indicator panel', [19.6 + 1.2 - LAYOUT_WIDTH / 2, 0.22, ROW_Z[0] - LAYOUT_DEPTH / 2 + 0.5]);
  addMesh(indicatorPanel, new RoundedBoxGeometry(3.6, 0.06, 0.9, 2, 0.03), new THREE.MeshStandardMaterial({ color: 0x2b2a27, roughness: 0.5 }));
  const leds = {};
  ['NumLock', 'CapsLock', 'ScrollLock'].forEach((name, index) => {
    const led = createLed(0x62ff8a);
    led.position.set((index - 1) * 1.2, 0.04, 0);
    indicatorPanel.add(led);
    leds[name] = led;
  });
  parts.push({ object: indicatorPanel, mass: 0.05 });

  const strainRelief = createPart(group, 'keyboard cable strain relief', [-6, -0.6, CASE_CENTER_Z - CASE_DEPTH / 2 - 0.3]);
  addMesh(strainRelief, new THREE.CylinderGeometry(0.22, 0.32, 0.8, 16), rubber, [0, 0, 0], [Math.PI / 2, 0, 0]);
  const cableAnchor = createAnchor(strainRelief, [0, 0, -0.4], 'keyboard cable');
  parts.push({ object: strainRelief, material: 'rubber', mass: 0.04 });

  const lockState = { NumLock: true, CapsLock: false, ScrollLock: false };
  const syncLeds = () => Object.entries(lockState).forEach(([name, on]) => (leds[name].material.emissiveIntensity = on ? 2.2 : 0));
  syncLeds();
  let animated = true;

  return {
    group,
    meshes,
    assembly: {
      name: 'keyboard',
      root: group,
      parts,
      intactColliders: [
        box([CASE_WIDTH, CASE_TOP - CASE_BOTTOM, CASE_DEPTH], [0, (CASE_TOP + CASE_BOTTOM) / 2, CASE_CENTER_Z]),
        box([LAYOUT_WIDTH, 0.62, LAYOUT_DEPTH], [0, CASE_TOP + 0.31, 0]),
        ...[-1, 1].map((side) => box([2.4, FOOT_HEIGHT, 1.2], [side * (CASE_WIDTH / 2 - 2.2), CASE_BOTTOM - FOOT_HEIGHT / 2, footZ])),
      ],
      onBreak: () => (animated = false),
      onReset: () => (animated = true),
    },
    anchors: { cable: cableAnchor },
    has: (code) => keys.has(code),
    press(code) {
      const key = keys.get(code);
      if (!key || key.pressed) return;
      key.pressed = true;
      playBucklingSpring(key, 'down');
      if (code in lockState) {
        lockState[code] = !lockState[code];
        syncLeds();
      }
    },
    release(code) {
      const key = keys.get(code);
      if (!key || !key.pressed) return;
      key.pressed = false;
      playBucklingSpring(key, 'up');
    },
    releaseAll() {
      keys.forEach((_, code) => this.release(code));
    },
    update(delta) {
      for (const key of keys.values()) {
        if (!animated) {
          key.offset = 0;
          key.velocity = 0;
          key.mesh.position.y = 0;
          continue;
        }
        const target = key.pressed ? -PRESS_DEPTH : 0;
        key.velocity += (1100 * (target - key.offset) - 38 * key.velocity) * delta;
        key.offset += key.velocity * delta;
        key.mesh.position.y = key.offset;
      }
    },
  };
}
