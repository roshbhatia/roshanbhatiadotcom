import * as THREE from 'three';
import { noise, tone } from '../shared/audio.js';
import { GRAVITY } from './physics.js';
import { DESK_BOUNDS, FLOOR_Y } from './cubicle.js';

// Mug interior in its body-part frame (see mug.js): the floor of the cup, the full line, and the rim.
const INTERIOR_BOTTOM = 0.34;
const FULL_LEVEL = 3.5;
const RIM_HEIGHT = 3.6;
const RIM_RADIUS = 1.37;
const interiorRadius = (y) => THREE.MathUtils.lerp(1.19, 1.35, THREE.MathUtils.clamp((y - INTERIOR_BOTTOM) / (FULL_LEVEL - INTERIOR_BOTTOM), 0, 1));
const START_FILL = 0.8;
const POUR_RATE = 0.55;
const DROPS_PER_FILL = 120;
const MAX_DROPLETS = 100;
const DROPLET_LIFETIME = 3;
const SLOSH_ACCELERATION = 900;
const SLOSH_RANGE = 3000;
const SIP_AMOUNT = 0.08;
const PIXELS_PER_UNIT = 16;
const MAX_PUDDLES = 60;
const MERGE_DISTANCE = 0.4;
const PUDDLE_RADIUS_PER_DROP = 0.35;
const MAX_PUDDLE_RADIUS = 4.5;
const POUR_SOUND_INTERVAL_MS = 140;
const SPLASH_SOUND_INTERVAL_MS = 60;

function playPour(level) {
  const frequency = 170 + Math.random() * 90;
  tone({ frequency, endFrequency: frequency * 0.7, duration: 0.09, gain: Math.min(0.03 + level * 0.05, 0.1), type: 'sine' });
  noise({ frequency: 500 + Math.random() * 300, q: 2, duration: 0.08, gain: Math.min(0.03 + level * 0.04, 0.08) });
}

function playSplash(gain = 0.05) {
  noise({ frequency: 1800 + Math.random() * 1500, q: 2, duration: 0.03, gain });
}

function playSip() {
  noise({ type: 'lowpass', frequency: 900, q: 0.7, duration: 0.25, gain: 0.08 });
  tone({ frequency: 190, endFrequency: 120, duration: 0.12, gain: 0.06, type: 'sine', delay: 0.18 });
}

// The puddle layer: coffee stains drawn into a canvas laid just above the desk. Each puddle grows toward a radius
// set by how much coffee landed in it, with soft edges and the darker ring a drying coffee stain gets.
function createStainLayer(scene) {
  const width = DESK_BOUNDS.maxX - DESK_BOUNDS.minX;
  const depth = DESK_BOUNDS.maxZ - DESK_BOUNDS.minZ;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * PIXELS_PER_UNIT);
  canvas.height = Math.round(depth * PIXELS_PER_UNIT);
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const layer = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.15, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }),
  );
  layer.rotation.x = -Math.PI / 2;
  layer.position.set((DESK_BOUNDS.minX + DESK_BOUNDS.maxX) / 2, DESK_BOUNDS.maxY + 0.012, (DESK_BOUNDS.minZ + DESK_BOUNDS.maxZ) / 2);
  layer.receiveShadow = true;
  layer.renderOrder = 2;
  scene.add(layer);

  const puddles = [];
  let dirty = false;

  function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const puddle of puddles) {
      const x = (puddle.x - DESK_BOUNDS.minX) * PIXELS_PER_UNIT;
      const y = (puddle.z - DESK_BOUNDS.minZ) * PIXELS_PER_UNIT;
      const radius = Math.max(puddle.radius * PIXELS_PER_UNIT, 1);
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(72, 38, 16, 0.5)');
      gradient.addColorStop(0.78, 'rgba(72, 38, 16, 0.45)');
      gradient.addColorStop(0.92, 'rgba(42, 19, 7, 0.7)');
      gradient.addColorStop(1, 'rgba(42, 19, 7, 0)');
      context.fillStyle = gradient;
      context.beginPath();
      for (let step = 0; step <= 32; step += 1) {
        const angle = (step / 32) * Math.PI * 2;
        const wobble = 1 + 0.07 * Math.sin(angle * 3 + puddle.phase) + 0.04 * Math.sin(angle * 5 + puddle.phase * 2);
        const px = x + Math.cos(angle) * radius * wobble;
        const py = y + Math.sin(angle) * radius * wobble;
        if (step === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      }
      context.fill();
    }
    texture.needsUpdate = true;
  }

  return {
    get count() {
      return puddles.length;
    },
    add(x, z, drops) {
      let target = null;
      let nearest = Infinity;
      for (const puddle of puddles) {
        const distance = Math.hypot(puddle.x - x, puddle.z - z);
        if (distance < nearest) {
          nearest = distance;
          target = puddle;
        }
      }
      if (!target || (nearest > target.radius + MERGE_DISTANCE && puddles.length < MAX_PUDDLES)) {
        target = { x, z, drops: 0, radius: 0.15, phase: Math.random() * Math.PI * 2 };
        puddles.push(target);
      }
      target.drops += drops;
    },
    update(delta) {
      for (const puddle of puddles) {
        const goal = Math.min(PUDDLE_RADIUS_PER_DROP * Math.sqrt(puddle.drops), MAX_PUDDLE_RADIUS);
        if (Math.abs(goal - puddle.radius) < 0.002) continue;
        puddle.radius += (goal - puddle.radius) * Math.min(1, delta * 2.5);
        dirty = true;
      }
      if (dirty) {
        dirty = false;
        draw();
      }
    },
    clear() {
      puddles.length = 0;
      draw();
    },
  };
}

// Coffee in the mug: a fill level, a surface that stays level in world space as the mug tilts, and droplets that
// pour from the lowest point of the rim once the surface reaches it. Droplets are ballistic, not simulated fluid.
export function createCoffee({ scene, physics, mug, getObstacles }) {
  const bodyPart = mug.parts.find((part) => part.name === 'mug body');
  const surface = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3b2213, roughness: 0.1 }));
  scene.add(surface);
  const dropletMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshStandardMaterial({ color: 0x4a2a14, roughness: 0.15 }), MAX_DROPLETS);
  dropletMesh.count = 0;
  dropletMesh.frustumCulled = false;
  scene.add(dropletMesh);
  const droplets = [];
  const stains = createStainLayer(scene);

  let fill = START_FILL;
  let pendingDrops = 0;
  let lastPourSoundAt = 0;
  let lastSplashAt = 0;
  let previousVelocity = null;
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const localUp = new THREE.Vector3();
  const axis = new THREE.Vector3();
  const instanceMatrix = new THREE.Matrix4();
  const local = new THREE.Vector3();

  const levelHeight = () => INTERIOR_BOTTOM + fill * (FULL_LEVEL - INTERIOR_BOTTOM);
  const currentBody = () => (mug.state === 'intact' ? mug.body : mug.state === 'broken' ? bodyPart.body : null);

  function emit(origin, velocity, count) {
    for (let index = 0; index < count && droplets.length < MAX_DROPLETS; index += 1) {
      droplets.push({
        position: origin.clone(),
        velocity: velocity.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.6)),
        age: 0,
      });
    }
  }

  // Pours `amount` of fill from the rim point lying furthest along `outwardLocal` (in the mug frame).
  function spill(amount, outwardLocal, speed, body) {
    const spilled = Math.min(fill, amount);
    if (spilled <= 0) return 0;
    fill -= spilled;
    pendingDrops += spilled * DROPS_PER_FILL;
    const count = Math.floor(pendingDrops);
    pendingDrops -= count;
    if (count > 0) {
      const lip = new THREE.Vector3(outwardLocal.x * RIM_RADIUS, RIM_HEIGHT, outwardLocal.z * RIM_RADIUS).applyMatrix4(matrix);
      const outward = outwardLocal.clone().applyQuaternion(quaternion).multiplyScalar(speed);
      emit(lip, new THREE.Vector3(body.velocity.x, body.velocity.y, body.velocity.z).add(outward), count);
    }
    return spilled;
  }

  function land(droplet) {
    const { x, z } = droplet.position;
    const onDesk = x > DESK_BOUNDS.minX && x < DESK_BOUNDS.maxX && z > DESK_BOUNDS.minZ && z < DESK_BOUNDS.maxZ;
    if (onDesk) stains.add(x, z, 1);
    const now = performance.now();
    if (now - lastSplashAt > SPLASH_SOUND_INTERVAL_MS) {
      lastSplashAt = now;
      playSplash();
    }
  }

  function hitsObject(point, obstacles) {
    for (const obstacle of obstacles) {
      local.copy(point).applyMatrix4(obstacle.inverse);
      if (local.x > obstacle.min.x && local.x < obstacle.max.x && local.y > obstacle.min.y && local.y < obstacle.max.y + 0.1 && local.z > obstacle.min.z && local.z < obstacle.max.z) return true;
    }
    return false;
  }

  function updateDroplets(delta) {
    const obstacles = droplets.length ? getObstacles() : [];
    for (let index = droplets.length - 1; index >= 0; index -= 1) {
      const droplet = droplets[index];
      droplet.age += delta;
      droplet.velocity.y -= GRAVITY * delta;
      droplet.position.addScaledVector(droplet.velocity, delta);
      const { x, y, z } = droplet.position;
      const overDesk = x > DESK_BOUNDS.minX && x < DESK_BOUNDS.maxX && z > DESK_BOUNDS.minZ && z < DESK_BOUNDS.maxZ;
      let done = droplet.age > DROPLET_LIFETIME || y < FLOOR_Y;
      if (!done && droplet.velocity.y < 0 && hitsObject(droplet.position, obstacles)) {
        // Lands on the keyboard, computer or monitor: a splash, then gone.
        done = true;
        playSplash(0.03);
      } else if (!done && overDesk && y <= DESK_BOUNDS.maxY + 0.05) {
        done = true;
        land(droplet);
      }
      if (done) droplets.splice(index, 1);
    }
    droplets.forEach((droplet, index) => dropletMesh.setMatrixAt(index, instanceMatrix.makeTranslation(droplet.position.x, droplet.position.y, droplet.position.z)));
    dropletMesh.count = droplets.length;
    dropletMesh.instanceMatrix.needsUpdate = true;
  }

  function updateMug(delta) {
    const body = currentBody();
    if (!body || fill <= 0) {
      surface.visible = false;
      previousVelocity = null;
      return;
    }
    bodyPart.object.updateWorldMatrix(true, false);
    matrix.copy(bodyPart.object.matrixWorld);
    matrix.decompose(position, quaternion, scale);
    localUp.set(0, 1, 0).applyQuaternion(quaternion.clone().invert());
    const horizontal = Math.hypot(localUp.x, localUp.z);
    const downhill = horizontal > 1e-4 ? new THREE.Vector3(-localUp.x / horizontal, 0, -localUp.z / horizontal) : new THREE.Vector3(1, 0, 0);

    // Throwing or shaking hard sloshes a little out, in the direction the liquid is flung.
    const velocity = new THREE.Vector3(body.velocity.x, body.velocity.y, body.velocity.z);
    if (previousVelocity && delta > 0) {
      const change = velocity.clone().sub(previousVelocity);
      const acceleration = change.length() / delta;
      if (acceleration > SLOSH_ACCELERATION) {
        const flung = change.negate().applyQuaternion(quaternion.clone().invert()).setY(0);
        const direction = flung.lengthSq() > 1e-6 ? flung.normalize() : downhill;
        spill(Math.min(((acceleration - SLOSH_ACCELERATION) / SLOSH_RANGE) * 0.04, 0.05), direction, 2, body);
      }
    }
    previousVelocity = velocity;

    // The level surface meets the rim once the tilt is past what the fill level allows; the excess pours out.
    const height = levelHeight();
    const clearance = localUp.y * (RIM_HEIGHT - height) - RIM_RADIUS * horizontal;
    if (clearance < 0) {
      const overflow = -clearance;
      spill(POUR_RATE * overflow * delta, downhill, 2 + overflow * 3, body);
      const now = performance.now();
      if (now - lastPourSoundAt > POUR_SOUND_INTERVAL_MS) {
        lastPourSoundAt = now;
        playPour(overflow);
      }
    }

    const level = levelHeight();
    surface.visible = fill > 0.02 && localUp.y > 0.3;
    if (!surface.visible) return;
    surface.position.set(0, level, 0).applyMatrix4(matrix);
    axis.set(0, 1, 0).applyQuaternion(quaternion);
    const axisHorizontal = Math.hypot(axis.x, axis.z);
    surface.rotation.set(0, axisHorizontal > 1e-4 ? Math.atan2(-axis.z, axis.x) : 0, 0);
    const radius = interiorRadius(level);
    surface.scale.set(radius / Math.max(localUp.y, 0.3), 1, radius);
  }

  return {
    get fill() {
      return fill;
    },
    get dropletCount() {
      return droplets.length;
    },
    get puddleCount() {
      return stains.count;
    },
    update(delta) {
      updateMug(delta);
      updateDroplets(delta);
      stains.update(delta);
    },
    // Single click on an upright mug.
    sip() {
      if (mug.state !== 'intact' || fill < 0.05) return false;
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(mug.root.quaternion);
      if (up.y < 0.95) return false;
      fill = Math.max(0, fill - SIP_AMOUNT);
      playSip();
      return true;
    },
    // When the mug shatters, what is left comes out at once: a burst of droplets and a puddle where it broke.
    dump() {
      if (fill <= 0) return;
      bodyPart.object.updateWorldMatrix(true, false);
      bodyPart.object.matrixWorld.decompose(position, quaternion, scale);
      const center = new THREE.Vector3(0, levelHeight() * 0.5, 0).applyMatrix4(bodyPart.object.matrixWorld);
      for (let index = 0; index < 50; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        emit(center, new THREE.Vector3(Math.cos(angle) * (3 + Math.random() * 7), 3 + Math.random() * 6, Math.sin(angle) * (3 + Math.random() * 7)), 1);
      }
      if (center.x > DESK_BOUNDS.minX && center.x < DESK_BOUNDS.maxX && center.z > DESK_BOUNDS.minZ && center.z < DESK_BOUNDS.maxZ && center.y < 6) {
        stains.add(center.x, center.z, fill * DROPS_PER_FILL * 0.6);
      }
      playSplash(0.2);
      noise({ type: 'lowpass', frequency: 700, q: 0.7, duration: 0.2, gain: 0.2 });
      fill = 0;
    },
    refill() {
      fill = START_FILL;
      pendingDrops = 0;
      previousVelocity = null;
    },
    clearStains() {
      droplets.length = 0;
      dropletMesh.count = 0;
      stains.clear();
    },
  };
}
