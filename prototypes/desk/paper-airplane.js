import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createPart } from './geometry.js';
import { box } from './physics.js';

// Nose along local +x, wings spread along z, keel hanging below.
const NOSE = [3.2, 0, 0];
const TAIL = [-3, 0, 0];
const KEEL = [-3, -0.85, 0];
const WING_SPAN = 2.3;
const DIHEDRAL = 0.35;
const NORMAL_COEFFICIENT = 0.012;
const DRAG_COEFFICIENT = 0.00015;
const WEATHERVANE = 0.03;
const MAX_FORCE = 40;
const MIN_FLIGHT_SPEED = 3;

// A folded panel: triangle fan with the fold edge shaded slightly darker, like a crease.
function createPanel(points, creaseIndex) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
  const shades = points.map((_, index) => (index === creaseIndex || index === 0 ? 0.86 : 1));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(shades.flatMap((shade) => [shade, shade, shade * 0.98]), 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createPaperAirplane() {
  const root = new THREE.Group();
  root.name = 'paper airplane';
  root.position.set(20.5, 0.9, 4.5);
  root.rotation.y = 0.55;
  const material = new THREE.MeshStandardMaterial({ color: 0xfbfaf4, roughness: 0.85, vertexColors: true, side: THREE.DoubleSide });
  const panels = [
    ['left wing', [NOSE, TAIL, [TAIL[0], DIHEDRAL, -WING_SPAN]], 1],
    ['right wing', [NOSE, [TAIL[0], DIHEDRAL, WING_SPAN], TAIL], 2],
    ['left keel', [NOSE, KEEL, [TAIL[0], 0, -0.02]], 2],
    ['right keel', [NOSE, [TAIL[0], 0, 0.02], KEEL], 1],
  ];
  const parts = panels.map(([name, points, creaseIndex]) => {
    const object = createPart(root, `paper airplane ${name}`);
    const mesh = new THREE.Mesh(createPanel(points, creaseIndex), material);
    mesh.castShadow = true;
    object.add(mesh);
    return { object, material: 'paper', mass: 0.005 };
  });
  return {
    spec: {
      name: 'paper airplane',
      root,
      parts,
      material: 'paper',
      intactColliders: [box([6, 0.2, WING_SPAN * 1.6], [0, DIHEDRAL / 2, 0]), box([6, 0.85, 0.1], [0, -0.42, 0])],
    },
  };
}

const forward = new CANNON.Vec3();
const up = new CANNON.Vec3();
const force = new CANNON.Vec3();
const torque = new CANNON.Vec3();

// Flat-plate aerodynamics: lift from the airflow hitting the wings, light drag, and a torque that turns the nose into the wind.
export function applyGlide(body) {
  if (!body || body.sleepState === CANNON.Body.SLEEPING) return;
  const velocity = body.velocity;
  const speed = velocity.length();
  if (speed < MIN_FLIGHT_SPEED) return;
  body.quaternion.vmult(new CANNON.Vec3(1, 0, 0), forward);
  body.quaternion.vmult(new CANNON.Vec3(0, 1, 0), up);
  const normalSpeed = velocity.dot(up);
  up.scale(-NORMAL_COEFFICIENT * normalSpeed * speed, force);
  force.vsub(velocity.scale(DRAG_COEFFICIENT * speed), force);
  const magnitude = force.length();
  if (magnitude > MAX_FORCE) force.scale(MAX_FORCE / magnitude, force);
  body.applyForce(force);
  forward.cross(velocity, torque);
  torque.scale(WEATHERVANE, torque);
  body.torque.vadd(torque, body.torque);
  body.angularVelocity.scale(0.985, body.angularVelocity);
}
