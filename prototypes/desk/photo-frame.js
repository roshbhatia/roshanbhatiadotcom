import * as THREE from 'three';
import { addMesh, createPart } from './geometry.js';
import { box } from './physics.js';

const PHOTO_URL = './assets/frida-1024.jpg';
const PHOTO_ASPECT = 599 / 1024;
const PHOTO_WIDTH = 4.6;
const PHOTO_HEIGHT = PHOTO_WIDTH / PHOTO_ASPECT;
const WINDOW = { width: 4.4, height: 4.4 / PHOTO_ASPECT };
const MAT_BORDER = 0.8;
const OPENING = { width: WINDOW.width + MAT_BORDER * 2, height: WINDOW.height + MAT_BORDER * 2 };
const REBATE = 0.3;
const PANEL = { width: OPENING.width + REBATE * 2, height: OPENING.height + REBATE * 2 };
const RAIL_WIDTH = 0.8;
const RAIL_DEPTH = 0.8;
const OUTER = { width: OPENING.width + RAIL_WIDTH * 2, height: OPENING.height + RAIL_WIDTH * 2 };
const GLASS_THICKNESS = 0.06;
const GLASS_Z = 0.56;
const TILT = 0.26;
const GLASS_COLUMNS = 5;
const GLASS_ROWS = 8;

// One mitred moulding rail: a trapezoid with 45 degree ends, outer edge at +y, extruded toward the front (+z).
function createRailGeometry(length) {
  const shape = new THREE.Shape();
  shape.moveTo(-length / 2, RAIL_WIDTH / 2);
  shape.lineTo(length / 2, RAIL_WIDTH / 2);
  shape.lineTo(length / 2 - RAIL_WIDTH, -RAIL_WIDTH / 2);
  shape.lineTo(-length / 2 + RAIL_WIDTH, -RAIL_WIDTH / 2);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: RAIL_DEPTH - 0.16, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 3 }).translate(0, 0, 0.08);
}

function createMatGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-PANEL.width / 2, -PANEL.height / 2);
  shape.lineTo(PANEL.width / 2, -PANEL.height / 2);
  shape.lineTo(PANEL.width / 2, PANEL.height / 2);
  shape.lineTo(-PANEL.width / 2, PANEL.height / 2);
  shape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-WINDOW.width / 2, -WINDOW.height / 2);
  hole.lineTo(-WINDOW.width / 2, WINDOW.height / 2);
  hole.lineTo(WINDOW.width / 2, WINDOW.height / 2);
  hole.lineTo(WINDOW.width / 2, -WINDOW.height / 2);
  hole.closePath();
  shape.holes.push(hole);
  // The bevel stands in for the 45 degree bevel cut of a real mat window.
  return new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.05, bevelSegments: 1 });
}

function loadPhotoTexture() {
  const texture = new THREE.TextureLoader().load(PHOTO_URL);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createPhotoFrame() {
  const root = new THREE.Group();
  root.name = 'photo frame';
  root.position.set(-18.5, 0.05, -7.5);
  root.rotation.set(-TILT, 0.42, 0, 'YXZ');
  const parts = [];
  const centerY = OUTER.height / 2;
  const wood = new THREE.MeshStandardMaterial({ color: 0xc89f74, roughness: 0.45 });

  const rails = [
    ['frame rail top', OUTER.width, [0, centerY + OUTER.height / 2 - RAIL_WIDTH / 2], 0],
    ['frame rail bottom', OUTER.width, [0, centerY - OUTER.height / 2 + RAIL_WIDTH / 2], Math.PI],
    ['frame rail left', OUTER.height, [-OUTER.width / 2 + RAIL_WIDTH / 2, centerY], Math.PI / 2],
    ['frame rail right', OUTER.height, [OUTER.width / 2 - RAIL_WIDTH / 2, centerY], -Math.PI / 2],
  ];
  for (const [name, length, [x, y], rotation] of rails) {
    const rail = createPart(root, name, [x, y, 0], [0, 0, rotation]);
    addMesh(rail, createRailGeometry(length), wood);
    parts.push({ object: rail, material: 'wood', mass: 0.08 });
  }

  const glass = createPart(root, 'frame glass', [0, centerY, GLASS_Z]);
  const glassMesh = addMesh(
    glass,
    new THREE.BoxGeometry(PANEL.width, PANEL.height, GLASS_THICKNESS),
    new THREE.MeshStandardMaterial({ color: 0xeef6ff, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.16, depthWrite: false }),
  );
  glassMesh.castShadow = false;
  parts.push({ object: glass, material: 'glass', mass: 0.12 });

  const mat = createPart(root, 'frame mat', [0, centerY, 0.48]);
  addMesh(mat, createMatGeometry(), new THREE.MeshStandardMaterial({ color: 0xf6f1e7, roughness: 0.9 }));
  parts.push({ object: mat, material: 'paper', mass: 0.03, colliders: [box([PANEL.width, PANEL.height, 0.06], [0, 0, 0.01])] });

  const photo = createPart(root, 'frame photo', [0, centerY, 0.44]);
  addMesh(photo, new THREE.PlaneGeometry(PHOTO_WIDTH, PHOTO_HEIGHT), new THREE.MeshStandardMaterial({ map: loadPhotoTexture(), roughness: 0.55 })).castShadow = false;
  parts.push({ object: photo, material: 'paper', mass: 0.01, colliders: [box([PHOTO_WIDTH, PHOTO_HEIGHT, 0.04])] });

  const backing = createPart(root, 'frame backing board', [0, centerY, 0.25]);
  addMesh(backing, new THREE.BoxGeometry(PANEL.width, PANEL.height, 0.3), new THREE.MeshStandardMaterial({ color: 0x7a5a3e, roughness: 0.85 }));
  addMesh(backing, new THREE.BoxGeometry(1.2, 0.5, 0.06), new THREE.MeshStandardMaterial({ color: 0xb8b8b8, metalness: 0.6, roughness: 0.4 }), [0, PANEL.height / 2 - 1, -0.18]);
  parts.push({ object: backing, material: 'wood', mass: 0.15 });

  // The easel leg hinges near the top of the backing and reaches the desk behind the tilted frame.
  const hinge = new THREE.Vector3(0, 7, 0.05);
  const foot = new THREE.Vector3(0, 1.23, -4.64);
  const legDirection = hinge.clone().sub(foot);
  const legLength = legDirection.length();
  const legAngle = Math.atan2(legDirection.z, legDirection.y);
  const easel = createPart(root, 'frame easel stand', hinge.clone().add(foot).multiplyScalar(0.5).toArray(), [legAngle, 0, 0]);
  addMesh(easel, new THREE.BoxGeometry(1.4, legLength, 0.2), new THREE.MeshStandardMaterial({ color: 0x6b4c34, roughness: 0.85 }));
  addMesh(easel, new THREE.BoxGeometry(0.9, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: 0xa8a8a8, metalness: 0.6, roughness: 0.4 }), [0, legLength / 2 - 0.2, 0.15]);
  parts.push({ object: easel, material: 'wood', mass: 0.06 });

  return { spec: { name: 'photo frame', root, parts, material: 'wood' }, glass };
}

// Splits the pane into jittered triangles; each becomes a thin prism with its own box collider.
export function createGlassShards([source]) {
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  source.matrixWorld.decompose(position, quaternion, scale);
  const material = new THREE.MeshStandardMaterial({ color: 0xeef6ff, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
  const lattice = [];
  for (let row = 0; row <= GLASS_ROWS; row += 1) {
    lattice.push([]);
    for (let column = 0; column <= GLASS_COLUMNS; column += 1) {
      const interior = row > 0 && row < GLASS_ROWS && column > 0 && column < GLASS_COLUMNS;
      const jitter = interior ? 0.38 : 0;
      lattice[row].push(
        new THREE.Vector2(
          ((column + (Math.random() - 0.5) * jitter) / GLASS_COLUMNS - 0.5) * PANEL.width,
          ((row + (Math.random() - 0.5) * jitter) / GLASS_ROWS - 0.5) * PANEL.height,
        ),
      );
    }
  }
  const triangles = [];
  for (let row = 0; row < GLASS_ROWS; row += 1) {
    for (let column = 0; column < GLASS_COLUMNS; column += 1) {
      const a = lattice[row][column];
      const b = lattice[row][column + 1];
      const c = lattice[row + 1][column + 1];
      const d = lattice[row + 1][column];
      if (Math.random() < 0.5) triangles.push([a, b, c], [a, c, d]);
      else triangles.push([a, b, d], [b, c, d]);
    }
  }
  const half = GLASS_THICKNESS / 2;
  return triangles.map((corners) => {
    const centroid = corners.reduce((sum, corner) => sum.add(corner), new THREE.Vector2()).divideScalar(3);
    const local = corners.map((corner) => corner.clone().sub(centroid));
    const vertices = [];
    const push = (point, z) => vertices.push(point.x, point.y, z);
    const [p, q, r] = local;
    push(p, half), push(q, half), push(r, half);
    push(p, -half), push(r, -half), push(q, -half);
    for (const [from, to] of [
      [p, q],
      [q, r],
      [r, p],
    ]) {
      push(from, half), push(from, -half), push(to, -half);
      push(from, half), push(to, -half), push(to, half);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(centroid.x, centroid.y, 0).applyQuaternion(quaternion).add(position);
    mesh.quaternion.copy(quaternion);
    const xs = local.map((point) => point.x);
    const ys = local.map((point) => point.y);
    const outward = new THREE.Vector3(centroid.x, centroid.y, 0.6).normalize().applyQuaternion(quaternion);
    return {
      object: mesh,
      collider: box([Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), GLASS_THICKNESS], [(Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2, 0]),
      mass: 0.004,
      material: 'glass',
      velocity: source.velocity.clone().multiplyScalar(0.4).addScaledVector(outward, 3 + Math.random() * 6),
      angularVelocity: new THREE.Vector3((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20),
    };
  });
}
