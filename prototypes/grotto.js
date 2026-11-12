import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createStage, createClock, glossyPlastic, toNormalizedDeviceCoordinates } from './shared/stage.js';
import { noise, tone, chime, arpeggio, startPad, onAudioUnlock, PENTATONIC, midiToFrequency } from './shared/audio.js';

const ROOM = { width: 12, height: 6, depth: 12 };

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 60);
const cameraHome = new THREE.Vector3(0, 2.6, 5.4);
camera.position.copy(cameraHome);
const stage = createStage({
  camera,
  background: ['#cbbcff', '#e9e0ff', '#f7f2ff'],
  bloom: { strength: 0.7, radius: 0.8, threshold: 0.95 },
  haze: 0.3,
  hazeColor: [0.95, 0.93, 1.0],
  environmentIntensity: 0.35,
});
const { scene } = stage;
scene.fog = new THREE.Fog(0xe4dcff, 7, 20);
scene.add(new THREE.HemisphereLight(0xf2eeff, 0xb7a6e8, 0.9));

function createStoneTexture(tints, repeatX, repeatY) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = '#d6d0ec';
  context.fillRect(0, 0, 256, 256);
  const rows = 8;
  const rowHeight = 256 / rows;
  for (let row = 0; row < rows; row += 1) {
    const offset = (row % 2) * 32;
    for (let column = -1; column < 5; column += 1) {
      context.fillStyle = tints[Math.floor(Math.random() * tints.length)];
      const x = column * 64 + offset + 3;
      const y = row * rowHeight + 3;
      context.beginPath();
      context.roundRect(x, y, 58, rowHeight - 6, 8);
      context.fill();
      context.fillStyle = 'rgba(255, 255, 255, 0.35)';
      context.fillRect(x + 6, y + 3, 40, 3);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  return texture;
}

const WALL_TINTS = ['#e7e1ff', '#ded6fb', '#efe9ff', '#d9e6ff', '#f1e4fb'];
const FLOOR_TINTS = ['#f4f0ff', '#e9e3ff', '#e3eefc', '#f6eaf8'];

function addSurface(width, height, position, rotation, tints) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map: createStoneTexture(tints, width / 4, height / 4), roughness: 0.7 }),
  );
  mesh.position.copy(position);
  mesh.rotation.copy(rotation);
  scene.add(mesh);
}
addSurface(ROOM.width, ROOM.depth, new THREE.Vector3(0, 0, 0), new THREE.Euler(-Math.PI / 2, 0, 0), FLOOR_TINTS);
addSurface(ROOM.width, ROOM.height, new THREE.Vector3(0, ROOM.height / 2, -ROOM.depth / 2), new THREE.Euler(), WALL_TINTS);
addSurface(ROOM.depth, ROOM.height, new THREE.Vector3(-ROOM.width / 2, ROOM.height / 2, 0), new THREE.Euler(0, Math.PI / 2, 0), WALL_TINTS);
addSurface(ROOM.depth, ROOM.height, new THREE.Vector3(ROOM.width / 2, ROOM.height / 2, 0), new THREE.Euler(0, -Math.PI / 2, 0), WALL_TINTS);

const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
world.defaultContactMaterial.restitution = 0.35;
world.defaultContactMaterial.friction = 0.3;

function addStaticBox(halfExtents, position) {
  const body = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(...halfExtents)) });
  body.position.set(...position);
  world.addBody(body);
  return body;
}
addStaticBox([ROOM.width, 0.5, ROOM.depth], [0, -0.5, 0]);
addStaticBox([ROOM.width, ROOM.height, 0.5], [0, ROOM.height / 2, -ROOM.depth / 2 - 0.5]);
addStaticBox([ROOM.width, ROOM.height, 0.5], [0, ROOM.height / 2, ROOM.depth / 2 + 0.5]);
addStaticBox([0.5, ROOM.height, ROOM.depth], [-ROOM.width / 2 - 0.5, ROOM.height / 2, 0]);
addStaticBox([0.5, ROOM.height, ROOM.depth], [ROOM.width / 2 + 0.5, ROOM.height / 2, 0]);

const CRYSTAL_COLORS = [0x6fe3ff, 0xff9be0, 0xb69bff];
const crystals = [];
[
  [-4.2, 0, -4.4],
  [4.4, 0, -3.8],
  [0.6, 0, -5.2],
].forEach(([x, y, z], index) => {
  const color = CRYSTAL_COLORS[index];
  const cluster = new THREE.Group();
  cluster.position.set(x, y, z);
  const material = glossyPlastic(color, {
    emissive: color,
    emissiveIntensity: 1.6,
    transmission: 0.4,
    thickness: 0.8,
    flatShading: true,
  });
  for (let shard = 0; shard < 5; shard += 1) {
    const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), material);
    const height = 1.2 + Math.random() * 1.4;
    mesh.scale.set(1, height, 1);
    mesh.position.set((Math.random() - 0.5) * 0.9, height * 0.3, (Math.random() - 0.5) * 0.6);
    mesh.rotation.set((Math.random() - 0.5) * 0.6, Math.random() * Math.PI, (Math.random() - 0.5) * 0.6);
    mesh.userData.crystalIndex = index;
    cluster.add(mesh);
  }
  const light = new THREE.PointLight(color, 9, 12, 1.6);
  light.position.set(0, 1.4, 0.6);
  cluster.add(light);
  scene.add(cluster);
  crystals.push({ cluster, material, light, pulse: 0, note: PENTATONIC[index * 2 + 4] });
  addStaticBox([0.5, 1.2, 0.4], [x, 1.2, z]);
});
const crystalMeshes = crystals.flatMap(({ cluster }) => cluster.children.filter((child) => child.isMesh));

const dynamicObjects = [];
const PROP_COLORS = [0xffc4ea, 0xbfe6ff, 0xd8ccff, 0xc9f5d9, 0xfff1b8];

function addProp(mesh, shape, mass, position, kind) {
  const body = new CANNON.Body({ mass, shape, linearDamping: 0.05, angularDamping: 0.1 });
  body.position.set(...position);
  body.quaternion.setFromEuler(0, Math.random() * Math.PI, 0);
  world.addBody(body);
  scene.add(mesh);
  mesh.userData.body = body;
  const entry = { mesh, body, kind, lastSoundAt: 0 };
  body.addEventListener('collide', (event) => playImpact(entry, Math.abs(event.contact.getImpactVelocityAlongNormal())));
  dynamicObjects.push(entry);
}

for (let index = 0; index < 7; index += 1) {
  const radius = 0.3 + Math.random() * 0.2;
  const color = PROP_COLORS[index % PROP_COLORS.length];
  addProp(
    new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 24), glossyPlastic(color, { iridescence: 0.6 })),
    new CANNON.Sphere(radius),
    1,
    [(Math.random() - 0.5) * 7, 1 + index * 0.5, -1 - Math.random() * 3],
    'orb',
  );
}
for (let index = 0; index < 6; index += 1) {
  const size = 0.55 + Math.random() * 0.25;
  addProp(
    new THREE.Mesh(
      new RoundedBoxGeometry(size, size, size, 4, 0.08),
      glossyPlastic(PROP_COLORS[(index + 2) % PROP_COLORS.length], { transmission: 0.75, thickness: 0.8, roughness: 0.12 }),
    ),
    new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2)),
    1.4,
    [(Math.random() - 0.5) * 6, 0.5 + index * 0.9, -0.4 - Math.random()],
    'cube',
  );
}

let audioClock = 0;
function playImpact(entry, impact) {
  const now = performance.now();
  if (impact < 0.5 || now - entry.lastSoundAt < 60 || now - audioClock < 15) return;
  entry.lastSoundAt = now;
  audioClock = now;
  const gain = Math.min(0.22, impact * 0.04);
  const pan = entry.body.position.x / 6;
  if (entry.kind === 'orb') {
    chime({ frequency: 1100 + Math.random() * 600, gain: gain * 0.6, duration: 0.5, pan });
    tone({ frequency: 260, endFrequency: 160, duration: 0.06, gain: gain * 0.8, pan });
  } else {
    noise({ frequency: 3000, q: 3, duration: 0.03, gain: gain * 0.7, pan });
    chime({ frequency: 1800 + Math.random() * 900, gain: gain * 0.5, duration: 0.35, pan });
  }
}

const box = new THREE.Group();
box.position.set(0, 0, -2.2);
scene.add(box);
const pearl = glossyPlastic(0xfdf6ff, { iridescence: 1, iridescenceIOR: 1.4, roughness: 0.12 });
const boxBase = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.7, 0.9, 4, 0.1), pearl);
boxBase.position.y = 0.35;
box.add(boxBase);
const lidPivot = new THREE.Group();
lidPivot.position.set(0, 0.7, -0.45);
box.add(lidPivot);
const lid = new THREE.Mesh(new RoundedBoxGeometry(1.44, 0.22, 0.94, 4, 0.1), pearl);
lid.position.set(0, 0.11, 0.47);
lidPivot.add(lid);
const boxGlow = new THREE.PointLight(0xffffff, 0, 5, 1.5);
boxGlow.position.set(0, 1.0, 0);
box.add(boxGlow);
addStaticBox([0.7, 0.35, 0.45], [0, 0.35, -2.2]);
const boxMeshes = [boxBase, lid];
const boxState = { open: false, angle: 0, velocity: 0 };
const links = document.getElementById('links');

function toggleBox() {
  boxState.open = !boxState.open;
  links.classList.toggle('visible', boxState.open);
  const notes = [67, 71, 74, 79, 83].map(midiToFrequency);
  arpeggio(boxState.open ? notes : notes.reverse(), { gain: 0.07 });
  tone({ frequency: 140, endFrequency: 190, duration: 0.5, gain: 0.04, type: 'sawtooth', filterFrequency: 600 });
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const parallax = new THREE.Vector2();

window.addEventListener('pointermove', (event) => toNormalizedDeviceCoordinates(event, parallax));
window.addEventListener('pointerdown', (event) => {
  if (event.target !== stage.renderer.domElement) return;
  raycaster.setFromCamera(toNormalizedDeviceCoordinates(event, pointer), camera);
  const propMeshes = dynamicObjects.map(({ mesh }) => mesh);
  const [hit] = raycaster.intersectObjects([...propMeshes, ...crystalMeshes, ...boxMeshes], false);
  if (!hit) return;
  if (boxMeshes.includes(hit.object)) {
    toggleBox();
    return;
  }
  if (hit.object.userData.crystalIndex !== undefined) {
    const crystal = crystals[hit.object.userData.crystalIndex];
    crystal.pulse = 1;
    chime({ frequency: crystal.note, gain: 0.14, duration: 2.2, pan: crystal.cluster.position.x / 6 });
    chime({ frequency: crystal.note * 1.5, gain: 0.05, duration: 1.6, delay: 0.05 });
    return;
  }
  const body = hit.object.userData.body;
  const direction = raycaster.ray.direction.clone().setY(0.35).normalize().multiplyScalar(5 * body.mass);
  const relativePoint = new CANNON.Vec3(
    hit.point.x - body.position.x,
    hit.point.y - body.position.y,
    hit.point.z - body.position.z,
  );
  body.applyImpulse(new CANNON.Vec3(direction.x, direction.y, direction.z), relativePoint);
  tone({ frequency: 420, endFrequency: 900, duration: 0.06, gain: 0.08 });
});

onAudioUnlock(() => {
  startPad({ frequencies: [55, 62, 67, 71].map((note) => midiToFrequency(note - 12)), gain: 0.03 });
  const shimmer = () => {
    const crystal = crystals[Math.floor(Math.random() * crystals.length)];
    chime({ frequency: crystal.note * 2, gain: 0.012, duration: 1.8, pan: crystal.cluster.position.x / 6 });
    setTimeout(shimmer, 1800 + Math.random() * 3200);
  };
  shimmer();
});

const tick = createClock();
const lookTarget = new THREE.Vector3();
function animate() {
  const { delta, seconds } = tick();
  world.step(1 / 60, delta, 4);
  for (const { mesh, body } of dynamicObjects) {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  }
  crystals.forEach((crystal, index) => {
    crystal.pulse = Math.max(0, crystal.pulse - delta * 0.8);
    const shimmer = 0.85 + Math.sin(seconds * 1.7 + index * 2) * 0.15;
    crystal.light.intensity = 9 * shimmer + crystal.pulse * 25;
    crystal.material.emissiveIntensity = 1.4 * shimmer + crystal.pulse * 3;
    crystal.cluster.rotation.y = Math.sin(seconds * 0.3 + index) * 0.08;
  });
  const targetAngle = boxState.open ? -1.9 : 0;
  boxState.velocity += (120 * (targetAngle - boxState.angle) - 14 * boxState.velocity) * delta;
  boxState.angle += boxState.velocity * delta;
  lidPivot.rotation.x = boxState.angle;
  boxGlow.intensity = (boxState.angle / -1.9) * 6;
  camera.position.x += (cameraHome.x + parallax.x * 1.2 - camera.position.x) * 0.04;
  camera.position.y += (cameraHome.y + parallax.y * 0.6 - camera.position.y) * 0.04;
  lookTarget.set(parallax.x * 0.6, 1.1, -3);
  camera.lookAt(lookTarget);
  stage.render(seconds);
  requestAnimationFrame(animate);
}
animate();
