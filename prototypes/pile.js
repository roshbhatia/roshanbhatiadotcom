import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createStage, createClock, glossyPlastic, toNormalizedDeviceCoordinates } from './shared/stage.js';
import { noise, tone, chime, startPad, onAudioUnlock, PENTATONIC, midiToFrequency } from './shared/audio.js';

const TRAY = { width: 11, depth: 6.5, wallHeight: 1.2 };
const NAME = 'roshanbhatia';
const MAX_LETTERS = 90;
const CAP_SIZE = { width: 0.95, height: 0.6, depth: 0.95 };

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
const cameraHome = new THREE.Vector3(0, 10, 9);
camera.position.copy(cameraHome);
camera.lookAt(0, 0, 0.4);
const stage = createStage({
  camera,
  background: ['#a8f0e4', '#d9f4ff', '#fff4fb'],
  bloom: { strength: 0.35 },
});
const { scene } = stage;
scene.add(new THREE.HemisphereLight(0xffffff, 0xcdeeff, 1.1));
const sun = new THREE.DirectionalLight(0xffffff, 1.8);
sun.position.set(-4, 10, 6);
scene.add(sun);

const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -14, 0) });
world.defaultContactMaterial.restitution = 0.25;
world.defaultContactMaterial.friction = 0.35;

const glass = glossyPlastic(0xe6f7ff, { transmission: 0.92, thickness: 0.4, roughness: 0.28, ior: 1.4 });
function addTrayPart(width, height, depth, x, y, z) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 3, Math.min(height, depth, width) * 0.45), glass);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  const body = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2)) });
  body.position.set(x, y, z);
  world.addBody(body);
}
const wallThickness = 0.3;
addTrayPart(TRAY.width + wallThickness * 2, 0.3, TRAY.depth + wallThickness * 2, 0, -0.15, 0);
addTrayPart(TRAY.width + wallThickness * 2, TRAY.wallHeight, wallThickness, 0, TRAY.wallHeight / 2, -TRAY.depth / 2 - wallThickness / 2);
addTrayPart(TRAY.width + wallThickness * 2, TRAY.wallHeight, wallThickness, 0, TRAY.wallHeight / 2, TRAY.depth / 2 + wallThickness / 2);
addTrayPart(wallThickness, TRAY.wallHeight, TRAY.depth, -TRAY.width / 2 - wallThickness / 2, TRAY.wallHeight / 2, 0);
addTrayPart(wallThickness, TRAY.wallHeight, TRAY.depth, TRAY.width / 2 + wallThickness / 2, TRAY.wallHeight / 2, 0);

const CANDY_COLORS = ['#ff9fd8', '#8fd8ff', '#b9a6ff', '#9ff0c8', '#ffd98a', '#ffb3a7'];
const materialCache = new Map();
function letterMaterial(letter, color) {
  const cacheKey = `${letter}${color}`;
  if (materialCache.has(cacheKey)) return materialCache.get(cacheKey);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = color;
  context.fillRect(0, 0, 128, 128);
  context.fillStyle = '#ffffff';
  context.font = '400 64px Michroma, "Helvetica Neue", sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(letter, 64, 68);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = glossyPlastic(0xffffff, { map: texture, transmission: 0.35, thickness: 0.6, roughness: 0.12, iridescence: 0.3 });
  materialCache.set(cacheKey, material);
  return material;
}

const capGeometry = new RoundedBoxGeometry(CAP_SIZE.width, CAP_SIZE.height, CAP_SIZE.depth, 4, 0.16);
const capShape = new CANNON.Box(new CANNON.Vec3(CAP_SIZE.width / 2, CAP_SIZE.height / 2, CAP_SIZE.depth / 2));
const letters = [];
let audioClock = 0;

function playClack(entry, impact) {
  const now = performance.now();
  if (impact < 0.7 || now - entry.lastSoundAt < 50 || now - audioClock < 12) return;
  entry.lastSoundAt = now;
  audioClock = now;
  const gain = Math.min(0.25, impact * 0.035);
  const pan = entry.body.position.x / (TRAY.width / 2);
  noise({ frequency: 2400 + Math.random() * 1400, q: 2.5, duration: 0.025, gain, pan });
  tone({ frequency: entry.pitch, endFrequency: entry.pitch * 0.8, duration: 0.05, gain: gain * 0.6, type: 'triangle', pan });
  if (impact > 3) chime({ frequency: entry.note, gain: gain * 0.25, duration: 0.6, pan });
}

function spawnLetter(letter, x = (Math.random() - 0.5) * (TRAY.width - 2), z = (Math.random() - 0.5) * (TRAY.depth - 2)) {
  if (letters.length >= MAX_LETTERS) {
    const oldest = letters.shift();
    scene.remove(oldest.mesh);
    world.removeBody(oldest.body);
  }
  const color = CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)];
  const mesh = new THREE.Mesh(capGeometry, letterMaterial(letter, color));
  const body = new CANNON.Body({ mass: 1, shape: capShape, linearDamping: 0.02, angularDamping: 0.05 });
  body.position.set(x, 6 + Math.random() * 2, z);
  body.quaternion.setFromEuler(Math.random() * 0.6, Math.random() * Math.PI, Math.random() * 0.6);
  body.angularVelocity.set((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
  world.addBody(body);
  scene.add(mesh);
  mesh.userData.body = body;
  const letterIndex = letter.charCodeAt(0) - 97;
  const entry = {
    mesh,
    body,
    lastSoundAt: 0,
    pitch: 520 + ((letterIndex * 37) % 260),
    note: PENTATONIC[((letterIndex % PENTATONIC.length) + PENTATONIC.length) % PENTATONIC.length],
  };
  body.addEventListener('collide', (event) => playClack(entry, Math.abs(event.contact.getImpactVelocityAlongNormal())));
  letters.push(entry);
  bubbleIn(entry);
}

function bubbleIn(entry) {
  tone({ frequency: entry.note, endFrequency: entry.note * 2, duration: 0.08, gain: 0.05, pan: entry.body.position.x / 6 });
}

document.fonts.load('400 52px Michroma').finally(() => {
  [...NAME].forEach((letter, index) => {
    setTimeout(() => spawnLetter(letter, -4.4 + (index % 6) * 1.7, index < 6 ? -1 : 1.2), 300 + index * 140);
  });
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pointerWorld = new THREE.Vector3();
const dragPlane = new THREE.Plane();
const jointBody = new CANNON.Body({ mass: 0 });
jointBody.collisionFilterGroup = 0;
jointBody.collisionFilterMask = 0;
world.addBody(jointBody);
let constraint = null;
let draggedEntry = null;

window.addEventListener('pointerdown', (event) => {
  if (event.target !== stage.renderer.domElement) return;
  raycaster.setFromCamera(toNormalizedDeviceCoordinates(event, pointer), camera);
  const [hit] = raycaster.intersectObjects(
    letters.map(({ mesh }) => mesh),
    false,
  );
  if (!hit) {
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    if (raycaster.ray.intersectPlane(floorPlane, pointerWorld)) {
      const x = THREE.MathUtils.clamp(pointerWorld.x, -TRAY.width / 2 + 1, TRAY.width / 2 - 1);
      const z = THREE.MathUtils.clamp(pointerWorld.z, -TRAY.depth / 2 + 1, TRAY.depth / 2 - 1);
      spawnLetter(NAME[Math.floor(Math.random() * NAME.length)], x, z);
    }
    return;
  }
  draggedEntry = letters.find(({ mesh }) => mesh === hit.object);
  const { body } = draggedEntry;
  dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(), hit.point);
  jointBody.position.set(hit.point.x, hit.point.y, hit.point.z);
  const pivot = body.pointToLocalFrame(new CANNON.Vec3(hit.point.x, hit.point.y, hit.point.z));
  constraint = new CANNON.PointToPointConstraint(body, pivot, jointBody, new CANNON.Vec3(0, 0, 0));
  world.addConstraint(constraint);
  body.wakeUp();
  tone({ frequency: draggedEntry.note, endFrequency: draggedEntry.note * 1.5, duration: 0.1, gain: 0.08 });
});

window.addEventListener('pointermove', (event) => {
  if (!constraint) return;
  raycaster.setFromCamera(toNormalizedDeviceCoordinates(event, pointer), camera);
  if (!raycaster.ray.intersectPlane(dragPlane, pointerWorld)) return;
  jointBody.position.set(pointerWorld.x, Math.max(pointerWorld.y, 0.4), pointerWorld.z);
});

window.addEventListener('pointerup', () => {
  if (!constraint) return;
  world.removeConstraint(constraint);
  tone({ frequency: draggedEntry.note * 1.5, endFrequency: draggedEntry.note, duration: 0.12, gain: 0.06 });
  constraint = null;
  draggedEntry = null;
});

window.addEventListener('keydown', (event) => {
  if (event.repeat || event.metaKey || event.ctrlKey || !/^[a-z]$/i.test(event.key)) return;
  spawnLetter(event.key.toLowerCase());
});

onAudioUnlock(() => startPad({ frequencies: [60, 64, 67, 72].map((note) => midiToFrequency(note - 12)), gain: 0.02 }));

const tick = createClock();
function animate() {
  const { delta, seconds } = tick();
  world.step(1 / 60, delta, 4);
  for (const entry of letters) {
    const { mesh, body } = entry;
    if (body.position.y < -10) {
      body.position.set((Math.random() - 0.5) * 6, 7, (Math.random() - 0.5) * 3);
      body.velocity.set(0, 0, 0);
    }
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  }
  stage.render(seconds);
  requestAnimationFrame(animate);
}
animate();
