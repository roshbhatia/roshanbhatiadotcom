import * as THREE from 'three';
import { addMesh, canvasTexture, createPart, metal, plastic } from './geometry.js';
import { box } from './physics.js';

const CUP_POSITION = new THREE.Vector3(-27, 0, -3);
const CUP_RADIUS = 1.7;
const CUP_HEIGHT = 4.4;
const WALL_SEGMENTS = 12;
const PENCIL_COUNT = 10;
const PENCIL = { body: 6.2, cone: 0.7, tip: 0.22, ferrule: 0.45, eraser: 0.45, radius: 0.18 };
export const PENCIL_LENGTH = PENCIL.body + PENCIL.cone + PENCIL.tip + PENCIL.ferrule + PENCIL.eraser;
const UP = new THREE.Vector3(0, 1, 0);

function createMeshTexture() {
  const texture = canvasTexture(
    128,
    128,
    (context, width, height) => {
      context.clearRect(0, 0, width, height);
      context.strokeStyle = '#ffffff';
      context.lineWidth = 3;
      for (let offset = -width; offset < width * 2; offset += 16) {
        context.beginPath();
        context.moveTo(offset, 0);
        context.lineTo(offset + height, height);
        context.moveTo(offset + height, 0);
        context.lineTo(offset, height);
        context.stroke();
      }
    },
    { repeat: [6, 2] },
  );
  return texture;
}

function createCup() {
  const root = new THREE.Group();
  root.name = 'pencil cup';
  root.position.copy(CUP_POSITION);
  const parts = [];
  const wire = metal(0x34343a, 0.45);

  const wall = createPart(root, 'pencil cup mesh wall');
  addMesh(
    wall,
    new THREE.CylinderGeometry(CUP_RADIUS, CUP_RADIUS * 0.94, CUP_HEIGHT - 0.3, 36, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x34343a, metalness: 0.75, roughness: 0.45, alphaMap: createMeshTexture(), alphaTest: 0.5, side: THREE.DoubleSide }),
    [0, CUP_HEIGHT / 2 + 0.05, 0],
  );
  const wallColliders = Array.from({ length: WALL_SEGMENTS }, (_, index) => {
    const angle = (index / WALL_SEGMENTS) * Math.PI * 2;
    const radius = CUP_RADIUS - 0.08;
    return box([((2 * Math.PI * radius) / WALL_SEGMENTS) * 1.05, CUP_HEIGHT, 0.16], [Math.sin(angle) * radius, CUP_HEIGHT / 2, Math.cos(angle) * radius], [0, angle, 0]);
  });
  parts.push({ object: wall, material: 'metal', mass: 0.15, colliders: wallColliders });

  const rim = createPart(root, 'pencil cup rim', [0, CUP_HEIGHT, 0], [Math.PI / 2, 0, 0]);
  addMesh(rim, new THREE.TorusGeometry(CUP_RADIUS, 0.09, 8, 40), wire);
  parts.push({ object: rim, material: 'metal', mass: 0.05 });

  const base = createPart(root, 'pencil cup base');
  addMesh(base, new THREE.CylinderGeometry(CUP_RADIUS * 0.95, CUP_RADIUS * 0.95, 0.2, 36), wire, [0, 0.1, 0]);
  addMesh(base, new THREE.TorusGeometry(CUP_RADIUS * 0.94, 0.08, 8, 40), wire, [0, 0.2, 0], [Math.PI / 2, 0, 0]);
  parts.push({ object: base, material: 'metal', mass: 0.12, colliders: [box([CUP_RADIUS * 1.8, 0.2, CUP_RADIUS * 1.8], [0, 0.1, 0])] });

  return { name: 'pencil cup', root, parts, material: 'metal', punchLever: 1, punchTorque: 3, intactColliders: [...wallColliders, box([CUP_RADIUS * 1.8, 0.2, CUP_RADIUS * 1.8], [0, 0.1, 0])] };
}

const pencilMaterials = {
  body: plastic(0xf2c230, 0.45),
  wood: plastic(0xe6c49a, 0.85),
  graphite: metal(0x3a3a3c, 0.35),
  ferrule: metal(0xc9c4b2, 0.3),
  eraser: plastic(0xf29bb0, 0.85),
};

// A pencil standing along +y, centred on its length: graphite tip, sharpened cone, hex body, ferrule, eraser.
function createPencil(index, position, direction) {
  const root = new THREE.Group();
  root.name = `pencil ${index + 1}`;
  root.position.copy(position);
  root.quaternion.setFromUnitVectors(UP, direction);
  root.rotateY(Math.random() * Math.PI);
  const parts = [];
  let cursor = -PENCIL_LENGTH / 2;
  const segment = (name, length, geometry, material, partMaterial) => {
    const object = createPart(root, `${root.name} ${name}`, [0, cursor + length / 2, 0]);
    addMesh(object, geometry, material);
    parts.push({ object, material: partMaterial, mass: 0.004 + 0.002 * length });
    cursor += length;
  };
  segment('graphite', PENCIL.tip, new THREE.ConeGeometry(0.06, PENCIL.tip, 8).rotateX(Math.PI), pencilMaterials.graphite, 'wood');
  segment('cone', PENCIL.cone, new THREE.CylinderGeometry(PENCIL.radius, 0.06, PENCIL.cone, 6), pencilMaterials.wood, 'wood');
  segment('body', PENCIL.body, new THREE.CylinderGeometry(PENCIL.radius, PENCIL.radius, PENCIL.body, 6), pencilMaterials.body, 'wood');
  segment('ferrule', PENCIL.ferrule, new THREE.CylinderGeometry(PENCIL.radius + 0.015, PENCIL.radius + 0.015, PENCIL.ferrule, 12), pencilMaterials.ferrule, 'metal');
  segment('eraser', PENCIL.eraser, new THREE.CylinderGeometry(PENCIL.radius, PENCIL.radius, PENCIL.eraser, 12), pencilMaterials.eraser, 'rubber');
  return { name: root.name, root, parts, material: 'wood', intactColliders: [box([PENCIL.radius * 2, PENCIL_LENGTH - 0.15, PENCIL.radius * 2])] };
}

export function createPencilCup() {
  const pencils = Array.from({ length: PENCIL_COUNT }, (_, index) => {
    const angle = (index / PENCIL_COUNT) * Math.PI * 2 + 0.3;
    const outward = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
    const lean = 0.12 + Math.random() * 0.05;
    const direction = outward.clone().multiplyScalar(Math.sin(lean)).setY(Math.cos(lean)).normalize();
    const bottom = CUP_POSITION.clone().addScaledVector(outward, 0.85).setY(0.3);
    return createPencil(index, bottom.addScaledVector(direction, PENCIL_LENGTH / 2), direction);
  });
  return { cup: createCup(), pencils };
}
