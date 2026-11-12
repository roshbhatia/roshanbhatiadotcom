import * as THREE from 'three';
import { createStage, createClock, toNormalizedDeviceCoordinates } from './shared/stage.js';
import { tone, bubble, chime, startPad, onAudioUnlock, PENTATONIC, midiToFrequency } from './shared/audio.js';

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 2.6, 9);
camera.lookAt(0, 1.4, 0);
const stage = createStage({
  camera,
  background: ['#ffc6ec', '#e6dcff', '#cdeeff'],
  bloom: { strength: 0.5 },
  hazeColor: [1.0, 0.95, 0.99],
});
const { scene } = stage;

scene.add(new THREE.HemisphereLight(0xffffff, 0xffd6f0, 1.0));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(-3, 6, 5);
scene.add(key);

function createNameTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ff7ac8';
  context.font = '400 52px Michroma, "Helvetica Neue", sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('roshan bhatia  *', canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.x = 2;
  return texture;
}

const RADIUS = 1.6;
const nameTexture = createNameTexture();
document.fonts.load('400 52px Michroma').finally(() => {
  const updated = createNameTexture();
  nameTexture.image = updated.image;
  updated.dispose();
  nameTexture.needsUpdate = true;
});

const geometry = new THREE.SphereGeometry(RADIUS, 128, 96);
const blob = new THREE.Mesh(
  geometry,
  new THREE.MeshPhysicalMaterial({
    color: 0xffd9f1,
    map: nameTexture,
    roughness: 0.08,
    transmission: 0.55,
    thickness: 1.4,
    ior: 1.35,
    iridescence: 1,
    iridescenceIOR: 1.3,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    sheen: 0.4,
    sheenColor: new THREE.Color(0xbfe4ff),
  }),
);
blob.position.y = RADIUS;
scene.add(blob);

function createShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(150, 90, 170, 0.45)');
  gradient.addColorStop(1, 'rgba(150, 90, 170, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}
const shadow = new THREE.Mesh(
  new THREE.PlaneGeometry(4.2, 4.2),
  new THREE.MeshBasicMaterial({ map: createShadowTexture(), transparent: true, depthWrite: false }),
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = 0.01;
scene.add(shadow);

const positions = geometry.attributes.position;
const vertexCount = positions.count;
const rest = Float32Array.from(positions.array);
const offsets = new Float32Array(vertexCount * 3);
const velocities = new Float32Array(vertexCount * 3);

const STIFFNESS = 140;
const DAMPING = 5;
const GRAB_FALLOFF = 0.9;
const MAX_PULL = 2.4;

const grab = { active: false, local: new THREE.Vector3(), start: new THREE.Vector3(), pull: new THREE.Vector3(), plane: new THREE.Plane() };

function squish(strength) {
  for (let index = 0; index < vertexCount; index += 1) {
    const base = index * 3;
    velocities[base] += rest[base] * strength * 1.4;
    velocities[base + 1] -= (rest[base + 1] + RADIUS) * strength * 1.6;
    velocities[base + 2] += rest[base + 2] * strength * 1.4;
  }
}

function stepSoftBody(delta) {
  const falloffDenominator = 2 * GRAB_FALLOFF * GRAB_FALLOFF;
  for (let index = 0; index < vertexCount; index += 1) {
    const base = index * 3;
    let weight = 0;
    if (grab.active) {
      const dx = rest[base] - grab.local.x;
      const dy = rest[base + 1] - grab.local.y;
      const dz = rest[base + 2] - grab.local.z;
      weight = Math.exp(-(dx * dx + dy * dy + dz * dz) / falloffDenominator);
    }
    for (let axis = 0; axis < 3; axis += 1) {
      const target = weight * grab.pull.getComponent(axis);
      const acceleration = STIFFNESS * (target - offsets[base + axis]) - DAMPING * velocities[base + axis];
      velocities[base + axis] += acceleration * delta;
      offsets[base + axis] += velocities[base + axis] * delta;
      positions.array[base + axis] = rest[base + axis] + offsets[base + axis];
    }
    // Keep the bottom of the jelly from sinking into the floor.
    if (positions.array[base + 1] < -RADIUS) positions.array[base + 1] = -RADIUS;
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
}

const bubbles = [];
const bubbleMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  roughness: 0,
  transmission: 1,
  thickness: 0.2,
  iridescence: 1,
  iridescenceIOR: 1.25,
  transparent: true,
  opacity: 0.9,
});
function resetBubble(mesh, initial) {
  mesh.position.set((Math.random() - 0.5) * 9, initial ? Math.random() * 6 : -0.5, -1.5 - Math.random() * 3);
  mesh.scale.setScalar(0.12 + Math.random() * 0.25);
  mesh.userData.speed = 0.2 + Math.random() * 0.35;
  mesh.userData.phase = Math.random() * Math.PI * 2;
}
for (let index = 0; index < 16; index += 1) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), bubbleMaterial);
  resetBubble(mesh, true);
  scene.add(mesh);
  bubbles.push(mesh);
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pointerWorld = new THREE.Vector3();
let pointerDownAt = null;
let lastSqueakAt = 0;
let lastStretch = 0;

window.addEventListener('pointerdown', (event) => {
  raycaster.setFromCamera(toNormalizedDeviceCoordinates(event, pointer), camera);
  const [bubbleHit] = raycaster.intersectObjects(bubbles, false);
  const [blobHit] = raycaster.intersectObject(blob, false);
  if (bubbleHit && (!blobHit || bubbleHit.distance < blobHit.distance)) {
    const mesh = bubbleHit.object;
    bubble({ frequency: 700 + Math.random() * 500, gain: 0.18, pan: mesh.position.x / 5 });
    tone({ frequency: 2400, endFrequency: 1200, duration: 0.03, gain: 0.05 });
    resetBubble(mesh, false);
    return;
  }
  if (!blobHit) return;
  grab.active = true;
  grab.start.copy(blobHit.point);
  grab.local.copy(blob.worldToLocal(blobHit.point.clone()));
  grab.pull.set(0, 0, 0);
  grab.plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(), blobHit.point);
  pointerDownAt = { x: event.clientX, y: event.clientY };
  tone({ frequency: 320, endFrequency: 260, duration: 0.12, gain: 0.12, type: 'triangle', filterFrequency: 1200 });
});

window.addEventListener('pointermove', (event) => {
  if (!grab.active) return;
  raycaster.setFromCamera(toNormalizedDeviceCoordinates(event, pointer), camera);
  if (!raycaster.ray.intersectPlane(grab.plane, pointerWorld)) return;
  grab.pull.subVectors(pointerWorld, grab.start).clampLength(0, MAX_PULL);
  const stretch = grab.pull.length();
  const now = performance.now();
  if (Math.abs(stretch - lastStretch) > 0.12 && now - lastSqueakAt > 70) {
    const frequency = 500 + stretch * 420;
    tone({ frequency, endFrequency: frequency * 1.25, duration: 0.09, gain: 0.07, type: 'triangle', filterFrequency: 2200 });
    lastSqueakAt = now;
    lastStretch = stretch;
  }
});

window.addEventListener('pointerup', (event) => {
  if (!grab.active) return;
  const stretch = grab.pull.length();
  const moved = pointerDownAt && Math.hypot(event.clientX - pointerDownAt.x, event.clientY - pointerDownAt.y);
  grab.active = false;
  grab.pull.set(0, 0, 0);
  lastStretch = 0;
  if (moved < 6) {
    squish(1.6);
    tone({ frequency: 260, endFrequency: 520, duration: 0.18, gain: 0.16, type: 'triangle', filterFrequency: 1600 });
    chime({ frequency: PENTATONIC[Math.floor(Math.random() * 6) + 3], gain: 0.05 });
  } else {
    tone({ frequency: 180 + stretch * 60, endFrequency: 70, duration: 0.4, gain: 0.22 });
    chime({ frequency: PENTATONIC[Math.min(Math.round(stretch * 3), PENTATONIC.length - 1)], gain: 0.06 });
  }
});

onAudioUnlock(() => startPad({ frequencies: [57, 60, 64, 67].map((note) => midiToFrequency(note - 12)) }));

const tick = createClock();
function animate() {
  const { delta, seconds } = tick();
  stepSoftBody(delta);
  nameTexture.offset.x = seconds * 0.02;
  const breathe = 1 + Math.sin(seconds * 1.6) * 0.012;
  blob.scale.set(breathe, 2 - breathe, breathe);
  shadow.scale.setScalar(1 + grab.pull.length() * 0.08);
  for (const mesh of bubbles) {
    mesh.position.y += mesh.userData.speed * delta;
    mesh.position.x += Math.sin(seconds * 1.3 + mesh.userData.phase) * 0.003;
    if (mesh.position.y > 7) resetBubble(mesh, false);
  }
  stage.render(seconds);
  requestAnimationFrame(animate);
}
animate();
