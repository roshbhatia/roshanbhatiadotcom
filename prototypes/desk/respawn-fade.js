import { tone } from '../shared/audio.js';

const FADE_SECONDS = 0.6;

// Fades a respawned object in. Materials are often shared between objects, so each mesh gets temporary
// transparent clones; the originals go back once the fade completes.
export function createRespawnFade() {
  const fades = new Map();

  function finish(root) {
    for (const { mesh, original, clones } of fades.get(root).meshes) {
      mesh.material = original;
      clones.forEach((clone) => clone.dispose());
    }
    fades.delete(root);
  }

  return {
    fadeIn(root) {
      if (fades.has(root)) finish(root);
      const meshes = [];
      root.traverse((child) => {
        if (!child.isMesh || child.isInstancedMesh) return;
        const original = child.material;
        const clones = (Array.isArray(original) ? original : [original]).map((material) => {
          const clone = material.clone();
          clone.transparent = true;
          clone.opacity = 0;
          return { clone, opacity: material.opacity };
        });
        child.material = Array.isArray(original) ? clones.map(({ clone }) => clone) : clones[0].clone;
        meshes.push({ mesh: child, original, clones: clones.map(({ clone }) => clone), targets: clones.map(({ opacity }) => opacity) });
      });
      fades.set(root, { elapsed: 0, meshes });
      tone({ frequency: 420, endFrequency: 880, duration: 0.12, gain: 0.05 });
    },
    update(delta) {
      for (const [root, fade] of fades) {
        fade.elapsed += delta;
        const t = Math.min(fade.elapsed / FADE_SECONDS, 1);
        for (const { clones, targets } of fade.meshes) clones.forEach((clone, index) => (clone.opacity = targets[index] * t));
        if (t >= 1) finish(root);
      }
    },
  };
}
