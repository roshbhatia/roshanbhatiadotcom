import * as THREE from 'three';
import { noise } from '../shared/audio.js';
import { DESK_BOUNDS } from './cubicle.js';

const PIXELS_PER_UNIT = 16;
const CONTACT_HEIGHT = 0.28;
const SCRATCH_INTERVAL_MS = 45;

// A transparent canvas laid just above the desk top; pencil strokes are drawn into it in desk coordinates.
export function createDeskDrawing(scene) {
  const width = DESK_BOUNDS.maxX - DESK_BOUNDS.minX;
  const depth = DESK_BOUNDS.maxZ - DESK_BOUNDS.minZ;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * PIXELS_PER_UNIT);
  canvas.height = Math.round(depth * PIXELS_PER_UNIT);
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const layer = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.55, metalness: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
  );
  layer.rotation.x = -Math.PI / 2;
  layer.position.set((DESK_BOUNDS.minX + DESK_BOUNDS.maxX) / 2, DESK_BOUNDS.maxY + 0.01, (DESK_BOUNDS.minZ + DESK_BOUNDS.maxZ) / 2);
  layer.receiveShadow = true;
  layer.renderOrder = 1;
  scene.add(layer);

  let last = null;
  let lastScratchAt = 0;
  const toCanvas = (point) => ({ x: (point.x - DESK_BOUNDS.minX) * PIXELS_PER_UNIT, y: (point.z - DESK_BOUNDS.minZ) * PIXELS_PER_UNIT });

  // Graphite is a few overlapping, slightly offset thin lines: it reads as grainy rather than as a clean vector stroke.
  function stroke(from, to, speed) {
    const widthPx = THREE.MathUtils.clamp(3.2 - speed * 0.04, 1.4, 3.2);
    context.lineCap = 'round';
    for (let pass = 0; pass < 3; pass += 1) {
      const jitter = () => (Math.random() - 0.5) * widthPx * 0.6;
      // Graphite on dark walnut reads as a sheened mid grey, not near-black.
      context.strokeStyle = `rgba(150, 150, 160, ${0.35 + Math.random() * 0.25})`;
      context.lineWidth = widthPx * (0.5 + Math.random() * 0.5);
      context.beginPath();
      context.moveTo(from.x + jitter(), from.y + jitter());
      context.lineTo(to.x + jitter(), to.y + jitter());
      context.stroke();
    }
    texture.needsUpdate = true;
  }

  return {
    // Called every frame with the graphite tip of a held pencil (or null when nothing is drawing).
    update(tip, delta) {
      const touching = tip && tip.y <= DESK_BOUNDS.maxY + CONTACT_HEIGHT && tip.x > DESK_BOUNDS.minX && tip.x < DESK_BOUNDS.maxX && tip.z > DESK_BOUNDS.minZ && tip.z < DESK_BOUNDS.maxZ;
      if (!touching) {
        last = null;
        return;
      }
      const point = toCanvas(tip);
      if (last) {
        const distance = Math.hypot(point.x - last.point.x, point.y - last.point.y) / PIXELS_PER_UNIT;
        const speed = distance / Math.max(delta, 1 / 240);
        if (distance > 0.01) {
          stroke(last.point, point, speed);
          const now = performance.now();
          if (now - lastScratchAt > SCRATCH_INTERVAL_MS && speed > 1) {
            lastScratchAt = now;
            noise({ type: 'bandpass', frequency: 3500 + Math.random() * 2500, q: 1.2, duration: 0.05, gain: Math.min(0.02 + speed * 0.004, 0.14) });
          }
        }
      }
      last = { point };
    },
    clear() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      texture.needsUpdate = true;
      last = null;
    },
    // Exposed for checks: how many pixels hold graphite.
    countMarkedPixels() {
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let marked = 0;
      for (let index = 3; index < data.length; index += 4) if (data[index] > 0) marked += 1;
      return marked;
    },
  };
}
