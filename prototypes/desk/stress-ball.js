import * as THREE from 'three';
import { noise, tone } from '../shared/audio.js';
import { addMesh, createPart } from './geometry.js';
import { box, sphere } from './physics.js';

const RADIUS = 1.35;
const STIFFNESS = 160;
const DAMPING = 7;
const PRESS_FALLOFF = 0.75;
const PRESS_DEPTH = 0.45;
const MAX_PULL = 0.8;
const CRUMB_COUNT = 28;
const CRUMB_SECONDS = 1.1;

function playSqueak(pitch = 1) {
  const start = 760 * pitch * (0.9 + Math.random() * 0.2);
  tone({ frequency: start, endFrequency: start * 1.7, duration: 0.14, gain: 0.07, type: 'triangle', filterFrequency: 2600 });
  tone({ frequency: start * 1.5, endFrequency: start * 2.1, duration: 0.09, gain: 0.025, type: 'sine', delay: 0.02 });
  noise({ frequency: 1800, q: 6, duration: 0.05, gain: 0.03 });
}

function createSoftSurface(geometry) {
  const positions = geometry.attributes.position;
  return {
    geometry,
    rest: Float32Array.from(positions.array),
    offsets: new Float32Array(positions.array.length),
    velocities: new Float32Array(positions.array.length),
  };
}

// Vertex springs pull each surface point back to rest; a press dents the area around the grab point and a drag stretches it.
export function createStressBall() {
  const root = new THREE.Group();
  root.name = 'stress ball';
  root.position.set(-16.5, RADIUS, 15.5);
  const material = new THREE.MeshPhysicalMaterial({ color: 0xc6b6f2, roughness: 0.62, sheen: 0.7, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.5 });
  const capMaterial = new THREE.MeshStandardMaterial({ color: 0xf3eccf, roughness: 0.95 });
  const halves = [0, Math.PI].map((phiStart, index) => {
    const part = createPart(root, `stress ball half ${index + 1}`);
    const geometry = new THREE.SphereGeometry(RADIUS, 40, 28, phiStart, Math.PI);
    addMesh(part, geometry, material);
    // The foam core only shows once the halves separate.
    addMesh(part, new THREE.CircleGeometry(RADIUS * 0.97, 32), capMaterial, [0, 0, 0], [0, index === 0 ? Math.PI : 0, 0]).castShadow = false;
    const side = index === 0 ? 1 : -1;
    return { part, surface: createSoftSurface(geometry), side };
  });
  const surfaces = halves.map((half) => half.surface);

  const press = { active: false, local: new THREE.Vector3(), normal: new THREE.Vector3(), pull: new THREE.Vector3(), dragStart: null };
  let energy = 0;
  let intact = true;

  const crumbs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.12, 0), capMaterial, CRUMB_COUNT);
  crumbs.count = 0;
  crumbs.frustumCulled = false;
  const crumbState = Array.from({ length: CRUMB_COUNT }, () => ({ position: new THREE.Vector3(), velocity: new THREE.Vector3() }));
  let crumbAge = Infinity;
  const crumbMatrix = new THREE.Matrix4();
  const crumbScale = new THREE.Vector3();

  function settleSurfaces() {
    for (const surface of surfaces) {
      surface.offsets.fill(0);
      surface.velocities.fill(0);
      surface.geometry.attributes.position.array.set(surface.rest);
      surface.geometry.attributes.position.needsUpdate = true;
      surface.geometry.computeVertexNormals();
    }
    energy = 0;
  }

  function stepSurfaces(delta) {
    const falloff = 2 * PRESS_FALLOFF * PRESS_FALLOFF;
    let total = 0;
    for (const { geometry, rest, offsets, velocities } of surfaces) {
      const positions = geometry.attributes.position.array;
      for (let base = 0; base < rest.length; base += 3) {
        let weight = 0;
        if (press.active) {
          const dx = rest[base] - press.local.x;
          const dy = rest[base + 1] - press.local.y;
          const dz = rest[base + 2] - press.local.z;
          weight = Math.exp(-(dx * dx + dy * dy + dz * dz) / falloff);
        }
        for (let axis = 0; axis < 3; axis += 1) {
          const target = weight * (press.pull.getComponent(axis) - press.normal.getComponent(axis) * PRESS_DEPTH);
          const acceleration = STIFFNESS * (target - offsets[base + axis]) - DAMPING * velocities[base + axis];
          velocities[base + axis] += acceleration * delta;
          offsets[base + axis] += velocities[base + axis] * delta;
          positions[base + axis] = rest[base + axis] + offsets[base + axis];
          total += Math.abs(velocities[base + axis]) + Math.abs(offsets[base + axis]);
        }
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    }
    energy = total;
  }

  function burst(center) {
    crumbAge = 0;
    crumbs.count = CRUMB_COUNT;
    for (const crumb of crumbState) {
      crumb.position.copy(center);
      crumb.velocity.set((Math.random() - 0.5) * 18, 6 + Math.random() * 14, (Math.random() - 0.5) * 18);
    }
  }

  return {
    spec: {
      name: 'stress ball',
      root,
      material: 'rubber',
      bounce: true,
      parts: halves.map(({ part, side }) => ({ object: part, material: 'rubber', mass: 0.06, colliders: [box([RADIUS * 2, RADIUS * 2, RADIUS], [0, 0, (side * RADIUS) / 2])] })),
      intactColliders: [sphere(RADIUS)],
      onBreak() {
        intact = false;
        press.active = false;
        settleSurfaces();
        root.updateMatrixWorld(true);
        burst(root.getWorldPosition(new THREE.Vector3()));
        noise({ type: 'lowpass', frequency: 900, q: 0.7, duration: 0.18, gain: 0.25 });
        playSqueak(0.6);
      },
      onReset() {
        intact = true;
        settleSurfaces();
      },
    },
    crumbs,
    press(point) {
      if (!intact) return;
      press.active = true;
      press.local.copy(root.worldToLocal(point.clone()));
      press.normal.copy(press.local).normalize();
      press.pull.set(0, 0, 0);
      press.dragStart = point.clone();
      playSqueak();
    },
    drag(target) {
      if (!press.active || !press.dragStart) return;
      const pull = target.clone().sub(press.dragStart).clampLength(0, MAX_PULL);
      press.pull.copy(pull.applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()).invert()));
    },
    release() {
      if (!press.active) return;
      press.active = false;
      playSqueak(1.25);
    },
    // A hit along a world-space direction squashes the facing side, which then rings out on the springs.
    impact(speed, direction) {
      if (!intact || speed < 2) return;
      const local = direction.clone().applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
      const strength = Math.min(speed * 0.12, 4);
      for (const { rest, velocities } of surfaces) {
        for (let base = 0; base < rest.length; base += 3) {
          const facing = (rest[base] * local.x + rest[base + 1] * local.y + rest[base + 2] * local.z) / RADIUS;
          if (facing <= 0) continue;
          velocities[base] -= local.x * facing * strength;
          velocities[base + 1] -= local.y * facing * strength;
          velocities[base + 2] -= local.z * facing * strength;
        }
      }
      energy = Infinity;
      if (speed > 12) playSqueak(0.8 + Math.random() * 0.3);
    },
    update(delta) {
      if (intact && (press.active || energy > 0.5)) stepSurfaces(delta);
      if (crumbAge < CRUMB_SECONDS) {
        crumbAge += delta;
        const shrink = Math.max(0, 1 - crumbAge / CRUMB_SECONDS);
        crumbState.forEach((crumb, index) => {
          crumb.velocity.y -= 60 * delta;
          crumb.position.addScaledVector(crumb.velocity, delta);
          if (crumb.position.y < 0.12 && crumb.position.y > -2) {
            crumb.position.y = 0.12;
            crumb.velocity.multiplyScalar(0.4);
          }
          crumbMatrix.compose(crumb.position, new THREE.Quaternion(), crumbScale.setScalar(shrink));
          crumbs.setMatrixAt(index, crumbMatrix);
        });
        crumbs.instanceMatrix.needsUpdate = true;
        if (crumbAge >= CRUMB_SECONDS) crumbs.count = 0;
      }
    },
  };
}
