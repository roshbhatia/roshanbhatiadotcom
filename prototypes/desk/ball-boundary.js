import * as THREE from 'three';
import { noise, tone } from '../shared/audio.js';
import { DESK_BOUNDS, FLOOR_Y } from './cubicle.js';

const FRAME_LIMIT = 1.15;
const RESTITUTION = 0.8;
const INWARD_NUDGE = 3;
const MIN_OUTWARD_SPEED = 0.5;
const DESK_MARGIN = 2;
const STUCK_SECONDS = 3;
const RETURN_SPEED = 28;
const BOING_INTERVAL_MS = 120;

function playBoing(speed) {
  const level = Math.min(0.05 + speed * 0.004, 0.22);
  tone({ frequency: 150, endFrequency: 95, duration: 0.18, gain: level, type: 'triangle', filterFrequency: 500 });
  tone({ frequency: 310, endFrequency: 240, duration: 0.12, gain: level * 0.4, type: 'sine', delay: 0.01 });
  noise({ type: 'lowpass', frequency: 400, q: 0.7, duration: 0.05, gain: level * 0.6 });
}

// An invisible elastic wall just outside the current camera frame (and past the desk edges) that the stress ball
// bounces off instead of leaving play. If it still ends up out of play, it is thrown back in from the nearest edge.
export function createBallBoundary({ camera, getBodies, isInDeskView, onBounce }) {
  const ndc = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const velocity = new THREE.Vector3();
  let lastBoingAt = 0;
  let outsideSeconds = 0;

  function reflect(body, direction) {
    velocity.set(body.velocity.x, body.velocity.y, body.velocity.z);
    const outward = velocity.dot(direction);
    if (outward < MIN_OUTWARD_SPEED) return false;
    velocity.addScaledVector(direction, -(1 + RESTITUTION) * outward - INWARD_NUDGE);
    body.velocity.set(velocity.x, velocity.y, velocity.z);
    const now = performance.now();
    if (now - lastBoingAt > BOING_INTERVAL_MS) {
      lastBoingAt = now;
      playBoing(outward);
      onBounce?.(outward, direction.clone());
    }
    return true;
  }

  return {
    // Runs every physics substep.
    step() {
      right.setFromMatrixColumn(camera.matrixWorld, 0);
      up.setFromMatrixColumn(camera.matrixWorld, 1);
      for (const body of getBodies()) {
        if (!body) continue;
        const { x, y, z } = body.position;
        ndc.set(x, y, z).project(camera);
        if (ndc.z <= 1) {
          if (ndc.x > FRAME_LIMIT) reflect(body, normal.copy(right));
          else if (ndc.x < -FRAME_LIMIT) reflect(body, normal.copy(right).negate());
          if (ndc.y > FRAME_LIMIT) reflect(body, normal.copy(up));
          else if (ndc.y < -FRAME_LIMIT) reflect(body, normal.copy(up).negate());
        }
        if (x > DESK_BOUNDS.maxX - DESK_MARGIN) reflect(body, normal.set(1, 0, 0));
        else if (x < DESK_BOUNDS.minX + DESK_MARGIN) reflect(body, normal.set(-1, 0, 0));
        if (z > DESK_BOUNDS.maxZ + DESK_MARGIN) reflect(body, normal.set(0, 0, 1));
      }
    },
    // Runs every frame: a body out of play for too long is thrown back in from the nearest frame edge.
    update(delta, deskCamera) {
      const bodies = getBodies().filter(Boolean);
      const lost = bodies.filter((body) => body.position.y < FLOOR_Y + 1 || !isInDeskView(body.position));
      outsideSeconds = lost.length ? outsideSeconds + delta : 0;
      if (outsideSeconds < STUCK_SECONDS) return;
      outsideSeconds = 0;
      for (const body of lost) {
        ndc.set(body.position.x, body.position.y, body.position.z).project(deskCamera);
        const depth = new THREE.Vector3(0, 2, 6).project(deskCamera).z;
        const edge = new THREE.Vector3(THREE.MathUtils.clamp(ndc.x, -0.85, 0.85), THREE.MathUtils.clamp(Number.isFinite(ndc.y) ? ndc.y : 0.85, -0.6, 0.85), depth).unproject(deskCamera);
        edge.y = Math.max(edge.y, 4);
        body.position.set(edge.x, edge.y, edge.z);
        const toward = new THREE.Vector3(0, 2, 6).sub(edge).setY(0).normalize().multiplyScalar(RETURN_SPEED * 0.6).add(new THREE.Vector3(0, RETURN_SPEED * 0.4, 0));
        body.velocity.set(toward.x, toward.y, toward.z);
        body.wakeUp();
      }
    },
  };
}
