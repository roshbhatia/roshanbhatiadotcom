import * as THREE from 'three';
import { noise, tone } from '../shared/audio.js';
import { merge, metal, place } from './geometry.js';
import { box } from './physics.js';

const NOSE = new THREE.Vector3(0, 0.45, 3.05);
const PRESS_SECONDS = 0.28;
const MAX_LOOSE_STAPLES = 20;
const MAX_DECALS = 40;
const PAPER_REACH = 0.8;

const staplePaint = metal(0xc9ccd2, 0.3);
const crownGeometry = new THREE.BoxGeometry(0.55, 0.04, 0.06);
// Two legs folded inward, the way a staple comes out with nothing to go through.
const bentGeometry = merge([
  place(new THREE.BoxGeometry(0.55, 0.04, 0.06)),
  place(new THREE.BoxGeometry(0.04, 0.04, 0.2), [-0.26, 0, 0.1], [0, 0.5, 0]),
  place(new THREE.BoxGeometry(0.04, 0.04, 0.2), [0.26, 0, 0.1], [0, -0.5, 0]),
]);

function playStaple() {
  noise({ type: 'lowpass', frequency: 900, q: 0.8, duration: 0.05, gain: 0.3 });
  tone({ frequency: 260, endFrequency: 150, duration: 0.05, gain: 0.15, type: 'triangle' });
  noise({ frequency: 2600, q: 3, duration: 0.04, gain: 0.25, delay: 0.07 });
  tone({ frequency: 180, endFrequency: 110, duration: 0.08, gain: 0.2, type: 'triangle', delay: 0.07 });
}

// papers: [{ object, contains(localPoint) -> local surface point | null }]. A staple on paper becomes a small
// decal parented to that paper; with nothing underneath, a bent staple drops out as a loose physics piece.
export function createStaplerAction({ physics, stapler, papers }) {
  const arm = stapler.parts.find((part) => part.name === 'stapler arm');
  const loose = [];
  const decals = [];
  let pressElapsed = Infinity;

  function staple() {
    if (stapler.state !== 'intact') return false;
    pressElapsed = 0;
    playStaple();
    stapler.root.updateMatrixWorld(true);
    const nose = NOSE.clone().applyMatrix4(stapler.root.matrixWorld);
    const crownDirection = new THREE.Vector3(1, 0, 0).applyQuaternion(stapler.root.quaternion);
    for (const paper of papers()) {
      paper.object.updateWorldMatrix(true, false);
      const local = paper.object.worldToLocal(nose.clone());
      const surface = paper.contains(local);
      if (!surface) continue;
      const decal = new THREE.Mesh(crownGeometry, staplePaint);
      decal.position.copy(surface);
      const localDirection = crownDirection.clone().transformDirection(paper.object.matrixWorld.clone().invert());
      decal.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), localDirection.normalize());
      paper.object.add(decal);
      decals.push(decal);
      if (decals.length > MAX_DECALS) decals.shift().removeFromParent();
      return true;
    }
    const object = new THREE.Mesh(bentGeometry, staplePaint);
    object.castShadow = true;
    object.position.copy(nose).add(new THREE.Vector3(0, -0.2, 0));
    object.quaternion.copy(stapler.root.quaternion);
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(stapler.root.quaternion);
    loose.push(physics.spawnLoose({ object, collider: box([0.6, 0.08, 0.25]), mass: 0.003, material: 'metal', velocity: forward.multiplyScalar(2).add(new THREE.Vector3(0, 1.5, 0)) }));
    if (loose.length > MAX_LOOSE_STAPLES) physics.removeLoose(loose.shift());
    return true;
  }

  return {
    staple,
    clear() {
      loose.splice(0).forEach((entry) => physics.removeLoose(entry));
      decals.splice(0).forEach((decal) => decal.removeFromParent());
    },
    get looseCount() {
      return loose.length;
    },
    get decalCount() {
      return decals.length;
    },
    // The arm snaps down and springs back up; it only moves while the stapler is in one piece.
    update(delta) {
      if (pressElapsed >= PRESS_SECONDS) return;
      pressElapsed += delta;
      if (stapler.state !== 'intact') return;
      const t = Math.min(pressElapsed / PRESS_SECONDS, 1);
      const press = t < 0.25 ? t / 0.25 : Math.max(0, 1 - (t - 0.25) / 0.75) * Math.cos((t - 0.25) * 9) ** 2;
      arm.object.position.y = arm.localPosition.y - press * 0.38;
      arm.object.rotation.x = 0.04 - press * 0.06;
    },
  };
}

export { PAPER_REACH };
