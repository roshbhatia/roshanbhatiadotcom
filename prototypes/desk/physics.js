import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// Scene units are roughly 2 cm, so gravity is scaled down from 490 to keep falls readable.
export const GRAVITY = 160;
const FIXED_STEP = 1 / 120;
const MAX_SUBSTEPS = 6;
const BREAK_GRACE_SECONDS = 0.3;
const BREAK_SPEED = 7;
const PART_COLLIDER_SCALE = 0.94;
const MIN_HALF_EXTENT = 0.05;
const PUNCH_IMPULSE = 42;
const STATIC_GROUP = 1;
// Above the fastest throw; stops any residual solver ejection from launching bodies out of the room.
const MAX_SPEED = 160;
const REST_VOLUME_MARGIN = 0.3;
const DENSITY = { plastic: 0.006, metal: 0.02, glass: 0.012, ceramic: 0.01, paper: 0.002, rubber: 0.006, wood: 0.005 };

const scratchPosition = new THREE.Vector3();
const scratchQuaternion = new THREE.Quaternion();
const scratchScale = new THREE.Vector3();
const scratchOffset = new THREE.Vector3();
const scratchZero = new THREE.Vector3();

export function box(size, position = [0, 0, 0], rotation = [0, 0, 0]) {
  return {
    type: 'box',
    center: new THREE.Vector3(...position),
    halfExtents: new THREE.Vector3(size[0] / 2, size[1] / 2, size[2] / 2),
    quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
  };
}

export function cylinder(radius, height, position = [0, 0, 0], rotation = [0, 0, 0]) {
  return {
    type: 'cylinder',
    center: new THREE.Vector3(...position),
    radius,
    height,
    quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
  };
}

export function sphere(radius, position = [0, 0, 0]) {
  return { type: 'sphere', center: new THREE.Vector3(...position), radius, quaternion: new THREE.Quaternion() };
}

function colliderVolume(collider) {
  if (collider.type === 'cylinder') return Math.PI * collider.radius ** 2 * collider.height;
  if (collider.type === 'sphere') return (4 / 3) * Math.PI * collider.radius ** 3;
  const { x, y, z } = collider.halfExtents;
  return 8 * Math.max(x, MIN_HALF_EXTENT) * Math.max(y, MIN_HALF_EXTENT) * Math.max(z, MIN_HALF_EXTENT);
}

function transformCollider(collider, position, quaternion) {
  return {
    ...collider,
    center: collider.center.clone().applyQuaternion(quaternion).add(position),
    quaternion: quaternion.clone().multiply(collider.quaternion),
  };
}

// Union of the object's mesh bounding boxes, expressed in the object's own frame.
export function boundingCollider(object) {
  object.updateMatrixWorld(true);
  const inverse = object.matrixWorld.clone().invert();
  const relative = new THREE.Matrix4();
  const corner = new THREE.Vector3();
  const bounds = new THREE.Box3();
  object.traverse((child) => {
    if (!child.isMesh) return;
    if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
    relative.multiplyMatrices(inverse, child.matrixWorld);
    const { min, max } = child.geometry.boundingBox;
    for (let index = 0; index < 8; index += 1) {
      corner.set(index & 1 ? max.x : min.x, index & 2 ? max.y : min.y, index & 4 ? max.z : min.z).applyMatrix4(relative);
      bounds.expandByPoint(corner);
    }
  });
  return {
    type: 'box',
    center: bounds.getCenter(new THREE.Vector3()),
    halfExtents: bounds.getSize(new THREE.Vector3()).multiplyScalar(0.5),
    quaternion: new THREE.Quaternion(),
  };
}

function colliderCenter(colliders) {
  const center = new THREE.Vector3();
  let total = 0;
  for (const collider of colliders) {
    const volume = colliderVolume(collider);
    center.addScaledVector(collider.center, volume);
    total += volume;
  }
  return total > 0 ? center.divideScalar(total) : center;
}

function createShape(collider, scale) {
  if (collider.type === 'sphere') return new CANNON.Sphere(Math.max(collider.radius * scale, MIN_HALF_EXTENT));
  if (collider.type === 'cylinder') {
    const radius = Math.max(collider.radius * scale, MIN_HALF_EXTENT);
    return new CANNON.Cylinder(radius, radius, Math.max(collider.height * scale, MIN_HALF_EXTENT * 2), 14);
  }
  const { x, y, z } = collider.halfExtents;
  return new CANNON.Box(
    new CANNON.Vec3(Math.max(x * scale, MIN_HALF_EXTENT), Math.max(y * scale, MIN_HALF_EXTENT), Math.max(z * scale, MIN_HALF_EXTENT)),
  );
}

function addShapes(body, colliders, com, scale) {
  for (const collider of colliders) {
    const offset = collider.center.clone().sub(com);
    const { x, y, z, w } = collider.quaternion;
    body.addShape(createShape(collider, scale), new CANNON.Vec3(offset.x, offset.y, offset.z), new CANNON.Quaternion(x, y, z, w));
  }
}

// Places an object so that its local point `com` sits at the body's position.
function syncObject(object, body, com) {
  const { x, y, z, w } = body.quaternion;
  object.quaternion.set(x, y, z, w);
  scratchOffset.copy(com).applyQuaternion(object.quaternion);
  object.position.set(body.position.x - scratchOffset.x, body.position.y - scratchOffset.y, body.position.z - scratchOffset.z);
}

export function createPhysics(scene) {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -GRAVITY, 0) });
  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = true;
  world.solver.iterations = 12;
  world.defaultContactMaterial.friction = 0.4;
  // cannon-es clamps each step's friction impulse against a force (mu * |g| * m) without the timestep, which
  // makes friction ~120x too strong here. Scaling by the step and the usual four box contacts restores Coulomb.
  world.frictionGravity = new CANNON.Vec3(0, (GRAVITY * FIXED_STEP) / 4, 0);
  world.defaultContactMaterial.restitution = 0.12;
  const surfaceMaterial = new CANNON.Material('surface');
  const bouncyMaterial = new CANNON.Material('bouncy');
  world.addContactMaterial(new CANNON.ContactMaterial(bouncyMaterial, surfaceMaterial, { friction: 0.6, restitution: 0.72 }));

  const assemblies = [];
  const deferred = [];
  const impactListeners = [];
  const resetListeners = [];
  const graceBodies = new Map();
  let elapsed = 0;
  let muted = false;

  const jointBody = new CANNON.Body({ mass: 0 });
  jointBody.collisionFilterGroup = 0;
  jointBody.collisionFilterMask = 0;
  world.addBody(jointBody);
  let grab = null;

  function addStaticBox(size, position, rotation = [0, 0, 0]) {
    const body = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(size[0] / 2, size[1] / 2, size[2] / 2)) });
    body.position.set(...position);
    body.quaternion.setFromEuler(...rotation);
    body.material = surfaceMaterial;
    body.collisionFilterGroup = STATIC_GROUP;
    world.addBody(body);
    return body;
  }

  function addStaticPlane(height) {
    const body = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
    body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    body.position.set(0, height, 0);
    body.material = surfaceMaterial;
    body.collisionFilterGroup = STATIC_GROUP;
    world.addBody(body);
    return body;
  }

  function onCollide(event) {
    if (muted) return;
    const self = event.target;
    const other = event.body;
    const contact = event.contact;
    // Two dynamic bodies both receive the event; report the pair once.
    if (other.owner && contact.bi !== self) return;
    const speed = Math.abs(contact.getImpactVelocityAlongNormal());
    const point = contact.bi.position.vadd(contact.ri);
    for (const listener of impactListeners) listener({ body: self, other, speed, point, owner: self.owner, otherOwner: other.owner });
  }

  function configureDynamic(body, owner) {
    body.allowSleep = true;
    body.sleepSpeedLimit = 0.8;
    body.sleepTimeLimit = 0.5;
    body.linearDamping = 0.04;
    body.angularDamping = 0.08;
    body.owner = owner;
    body.addEventListener('collide', onCollide);
  }

  // Sibling parts start nested inside each other; they only collide once separated, or the solver ejects them.
  function overlapsSibling(body) {
    const { assembly } = body.owner;
    body.updateAABB();
    for (const sibling of [...assembly.parts.map((part) => part.body), ...assembly.debris.map((entry) => entry.body)]) {
      if (!sibling || sibling === body) continue;
      sibling.updateAABB();
      if (sibling.aabb.overlaps(body.aabb)) return true;
    }
    return false;
  }

  function startGrace(body, groupBit) {
    body.collisionFilterGroup = groupBit;
    body.collisionFilterMask = ~groupBit;
    graceBodies.set(body, elapsed + BREAK_GRACE_SECONDS);
  }

  function removeBody(body) {
    if (!body) return;
    if (grab?.body === body) grab.cancel();
    graceBodies.delete(body);
    world.removeBody(body);
  }

  function wakeAll() {
    for (const body of world.bodies) if (body.type === CANNON.Body.DYNAMIC) body.wakeUp();
  }

  function spawnIntactBody(assembly) {
    const body = new CANNON.Body({ mass: assembly.mass });
    addShapes(body, assembly.intactColliders, assembly.com, 1);
    scratchOffset.copy(assembly.com).applyQuaternion(assembly.root.quaternion).add(assembly.root.position);
    body.position.set(scratchOffset.x, scratchOffset.y, scratchOffset.z);
    const { x, y, z, w } = assembly.root.quaternion;
    body.quaternion.set(x, y, z, w);
    body.collisionFilterGroup = assembly.groupBit;
    if (assembly.bounce) body.material = bouncyMaterial;
    configureDynamic(body, { assembly, part: null, material: assembly.material });
    world.addBody(body);
    assembly.body = body;
  }

  // Mass, centre of mass and the intact compound shape cover only the parts still attached.
  function updateMassProperties(assembly) {
    const present = assembly.parts.filter((part) => !part.removed);
    assembly.mass = present.reduce((sum, part) => sum + part.mass, 0);
    assembly.com.set(0, 0, 0);
    for (const part of present) {
      assembly.com.addScaledVector(part.com.clone().applyQuaternion(part.localQuaternion).add(part.localPosition), part.mass / assembly.mass);
    }
    assembly.intactColliders =
      assembly.explicitIntactColliders ??
      present.filter((part) => part.intact).flatMap((part) => part.colliders.map((collider) => transformCollider(collider, part.localPosition, part.localQuaternion)));
  }

  function createAssembly(spec) {
    const root = spec.root;
    scene.attach(root);
    root.updateMatrixWorld(true);
    const parts = spec.parts.map((partSpec) => {
      const material = partSpec.material ?? spec.material ?? 'plastic';
      const colliders = partSpec.colliders ?? [boundingCollider(partSpec.object)];
      const volume = colliders.reduce((sum, collider) => sum + colliderVolume(collider), 0);
      return {
        name: partSpec.name ?? partSpec.object.name,
        object: partSpec.object,
        material,
        colliders,
        mass: partSpec.mass ?? Math.max(0.01, volume * DENSITY[material]),
        com: colliderCenter(colliders),
        intact: partSpec.intact !== false,
        removed: false,
        localPosition: partSpec.object.position.clone(),
        localQuaternion: partSpec.object.quaternion.clone(),
        body: null,
      };
    });
    const assembly = {
      name: spec.name,
      root,
      parts,
      mass: 0,
      com: new THREE.Vector3(),
      material: spec.material ?? 'plastic',
      bounce: Boolean(spec.bounce),
      punchLever: spec.punchLever ?? 0.35,
      punchTorque: spec.punchTorque ?? 1,
      explicitIntactColliders: spec.intactColliders ?? null,
      intactColliders: [],
      groupBit: 1 << (assemblies.length + 1),
      state: 'intact',
      body: null,
      debris: [],
      dependents: [],
      restPosition: root.position.clone(),
      restQuaternion: root.quaternion.clone(),
      onBreak: spec.onBreak,
      onReset: spec.onReset,
    };
    updateMassProperties(assembly);
    for (const part of parts) part.object.traverse((child) => (child.userData.owner = { assembly, part }));
    spawnIntactBody(assembly);
    assemblies.push(assembly);
    return assembly;
  }

  function syncAssembly(assembly) {
    if (assembly.state === 'held') return;
    if (assembly.state === 'intact') syncObject(assembly.root, assembly.body, assembly.com);
    else for (const part of assembly.parts) if (part.body) syncObject(part.object, part.body, part.com);
    for (const entry of assembly.debris) syncObject(entry.object, entry.body, entry.com);
  }

  function breakAssembly(assembly) {
    if (assembly.state !== 'intact') return false;
    const intactBody = assembly.body;
    syncAssembly(assembly);
    assembly.root.updateMatrixWorld(true);
    const center = intactBody.position;
    const worldCom = new THREE.Vector3();
    const velocity = new CANNON.Vec3();
    for (const part of assembly.parts) {
      if (part.removed) continue;
      part.object.matrixWorld.decompose(scratchPosition, scratchQuaternion, scratchScale);
      scene.attach(part.object);
      const body = new CANNON.Body({ mass: part.mass });
      addShapes(body, part.colliders, part.com, PART_COLLIDER_SCALE);
      worldCom.copy(part.com).applyQuaternion(scratchQuaternion).add(scratchPosition);
      body.position.set(worldCom.x, worldCom.y, worldCom.z);
      body.quaternion.set(scratchQuaternion.x, scratchQuaternion.y, scratchQuaternion.z, scratchQuaternion.w);
      intactBody.getVelocityAtWorldPoint(body.position, velocity);
      const outward = new THREE.Vector3(worldCom.x - center.x, worldCom.y - center.y, worldCom.z - center.z).normalize();
      const speed = BREAK_SPEED * (0.6 + Math.random() * 0.8);
      body.velocity.set(velocity.x + outward.x * speed, velocity.y + outward.y * speed + 3 + Math.random() * 5, velocity.z + outward.z * speed);
      body.angularVelocity.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
      startGrace(body, assembly.groupBit);
      if (assembly.bounce) body.material = bouncyMaterial;
      configureDynamic(body, { assembly, part, material: part.material });
      world.addBody(body);
      part.body = body;
    }
    removeBody(intactBody);
    assembly.body = null;
    assembly.state = 'broken';
    assembly.onBreak?.();
    wakeAll();
    return true;
  }

  function spawnDebris(assembly, pieces) {
    for (const piece of pieces) {
      const body = new CANNON.Body({ mass: piece.mass });
      const com = new THREE.Vector3();
      addShapes(body, [piece.collider], com, 1);
      body.position.set(piece.object.position.x, piece.object.position.y, piece.object.position.z);
      const { x, y, z, w } = piece.object.quaternion;
      body.quaternion.set(x, y, z, w);
      body.velocity.set(piece.velocity.x, piece.velocity.y, piece.velocity.z);
      body.angularVelocity.set(piece.angularVelocity.x, piece.angularVelocity.y, piece.angularVelocity.z);
      const entry = { object: piece.object, body, com };
      startGrace(body, assembly.groupBit);
      configureDynamic(body, { assembly, debris: entry, material: piece.material });
      body.sleepSpeedLimit = 1.2;
      world.addBody(body);
      piece.object.userData.owner = { assembly, debris: entry };
      scene.add(piece.object);
      assembly.debris.push(entry);
    }
  }

  function partSource(assembly, part) {
    const body = part.body ?? assembly.body;
    const velocity = new CANNON.Vec3();
    part.object.updateMatrixWorld(true);
    part.object.matrixWorld.decompose(scratchPosition, scratchQuaternion, scratchScale);
    body.getVelocityAtWorldPoint(new CANNON.Vec3(scratchPosition.x, scratchPosition.y, scratchPosition.z), velocity);
    return { name: part.name, matrixWorld: part.object.matrixWorld.clone(), velocity: new THREE.Vector3(velocity.x, velocity.y, velocity.z) };
  }

  // Replaces one part with debris (e.g. a frame's glass) while the rest of the assembly stays as it is.
  function detachPart(assembly, part, createDebris) {
    if (part.removed || assembly.state === 'shattered') return false;
    syncAssembly(assembly);
    assembly.root.updateMatrixWorld(true);
    const source = partSource(assembly, part);
    part.removed = true;
    part.object.visible = false;
    if (assembly.state === 'intact') {
      const previous = assembly.body;
      updateMassProperties(assembly);
      spawnIntactBody(assembly);
      assembly.body.velocity.copy(previous.velocity);
      assembly.body.angularVelocity.copy(previous.angularVelocity);
      removeBody(previous);
    } else {
      removeBody(part.body);
      part.body = null;
    }
    spawnDebris(assembly, createDebris([source]));
    wakeAll();
    return true;
  }

  // createDebris receives each part's current world matrix and velocity and returns debris pieces placed in world space.
  function shatterAssembly(assembly, createDebris) {
    if (assembly.state === 'shattered') return false;
    syncAssembly(assembly);
    assembly.root.updateMatrixWorld(true);
    for (const part of assembly.parts) part.object.updateMatrixWorld(true);
    const sources = assembly.parts.filter((part) => !part.removed).map((part) => partSource(assembly, part));
    removeBody(assembly.body);
    assembly.body = null;
    for (const part of assembly.parts) {
      removeBody(part.body);
      part.body = null;
      part.object.visible = false;
    }
    spawnDebris(assembly, createDebris(sources));
    assembly.state = 'shattered';
    wakeAll();
    return true;
  }

  function restoreAssembly(assembly, visited) {
    if (visited.has(assembly)) return;
    visited.add(assembly);
    if (assembly.root.parent !== scene) scene.attach(assembly.root);
    removeBody(assembly.body);
    assembly.body = null;
    for (const entry of assembly.debris) {
      removeBody(entry.body);
      scene.remove(entry.object);
      entry.object.geometry?.dispose();
    }
    assembly.debris.length = 0;
    for (const part of assembly.parts) {
      removeBody(part.body);
      part.body = null;
      assembly.root.add(part.object);
      part.object.position.copy(part.localPosition);
      part.object.quaternion.copy(part.localQuaternion);
      part.object.visible = true;
      part.removed = false;
    }
    updateMassProperties(assembly);
    assembly.root.position.copy(assembly.restPosition);
    assembly.root.quaternion.copy(assembly.restQuaternion);
    spawnIntactBody(assembly);
    assembly.state = 'intact';
    assembly.onReset?.();
    for (const dependent of assembly.dependents) restoreAssembly(dependent, visited);
  }

  // Anything left inside a restored object's rest volume is lifted onto it, instead of being ejected by the solver.
  // The margin keeps bodies merely resting against it where they are, and objects in the same family
  // (the cup and its pencils, the system unit and its monitor) are expected to share space.
  function clearRestVolumes(restored) {
    const family = new Set(restored);
    for (const assembly of assemblies) {
      if (![assembly, ...assembly.dependents].some((member) => restored.has(member))) continue;
      family.add(assembly);
      for (const dependent of assembly.dependents) family.add(dependent);
    }
    const restoredBodies = new Set([...restored].map((assembly) => assembly.body));
    const inner = new CANNON.AABB();
    const margin = new CANNON.Vec3(REST_VOLUME_MARGIN, REST_VOLUME_MARGIN, REST_VOLUME_MARGIN);
    for (const body of restoredBodies) {
      body.updateAABB();
      inner.lowerBound.copy(body.aabb.lowerBound).vadd(margin, inner.lowerBound);
      inner.upperBound.copy(body.aabb.upperBound).vsub(margin, inner.upperBound);
      for (const other of world.bodies) {
        if (other.type !== CANNON.Body.DYNAMIC || restoredBodies.has(other) || family.has(other.owner?.assembly)) continue;
        other.updateAABB();
        if (!inner.overlaps(other.aabb)) continue;
        other.position.y += body.aabb.upperBound.y - other.aabb.lowerBound.y + 0.05;
        other.velocity.set(0, 0, 0);
        other.angularVelocity.set(0, 0, 0);
        other.updateAABB();
      }
    }
  }

  // Takes an intact assembly out of the simulation, e.g. a floppy disk sitting inside a drive.
  function holdAssembly(assembly) {
    if (assembly.state !== 'intact') return false;
    removeBody(assembly.body);
    assembly.body = null;
    assembly.state = 'held';
    return true;
  }

  // Puts a held assembly back into the simulation at its current world pose.
  function releaseAssembly(assembly, velocity) {
    if (assembly.state !== 'held') return false;
    scene.attach(assembly.root);
    assembly.state = 'intact';
    spawnIntactBody(assembly);
    if (velocity) assembly.body.velocity.set(velocity.x, velocity.y, velocity.z);
    assembly.body.wakeUp();
    return true;
  }

  // Restores several assemblies as one group, so they do not displace each other at their shared rest poses.
  function resetAssemblies(list) {
    const restored = new Set();
    for (const assembly of list) restoreAssembly(assembly, restored);
    wakeAll();
    for (const assembly of restored) for (const listener of resetListeners) listener(assembly);
  }

  function resetAssembly(assembly) {
    const restored = new Set();
    restoreAssembly(assembly, restored);
    clearRestVolumes(restored);
    wakeAll();
    for (const listener of resetListeners) listener(assembly);
  }

  // The camera looks down at the desk, so most of the ray's vertical component is dropped;
  // otherwise punches press objects into the surface and friction swallows them. The lever arm's
  // height is reduced (per assembly) so tall objects slide back instead of only rocking on their base.
  function punch(body, point, direction, scale = 1) {
    const assembly = body.owner?.assembly;
    const strength = scale * PUNCH_IMPULSE * Math.pow(THREE.MathUtils.clamp(body.mass, 0.05, 40), 0.8);
    const push = new CANNON.Vec3(direction.x, direction.y * 0.3, direction.z);
    push.normalize();
    push.scale(strength, push);
    const lever = new CANNON.Vec3(point.x - body.position.x, (point.y - body.position.y) * (assembly?.punchLever ?? 0.35), point.z - body.position.z);
    body.wakeUp();
    body.applyImpulse(push, lever);
    // Light, wide objects such as the pencil cup slide rather than tip; extra spin lets a punch knock them over.
    const extraSpin = (assembly?.punchTorque ?? 1) - 1;
    if (extraSpin > 0) {
      const spin = lever.cross(push);
      body.invInertiaWorld.vmult(spin, spin);
      body.angularVelocity.addScaledVector(extraSpin, spin, body.angularVelocity);
    }
  }


  // Small free pieces that belong to no assembly, such as staples dropped by the stapler.
  const looseBodies = new Set();
  function spawnLoose(piece) {
    const body = new CANNON.Body({ mass: piece.mass });
    addShapes(body, [piece.collider], new THREE.Vector3(), 1);
    body.position.set(piece.object.position.x, piece.object.position.y, piece.object.position.z);
    const { x, y, z, w } = piece.object.quaternion;
    body.quaternion.set(x, y, z, w);
    if (piece.velocity) body.velocity.set(piece.velocity.x, piece.velocity.y, piece.velocity.z);
    configureDynamic(body, { assembly: null, loose: true, material: piece.material });
    world.addBody(body);
    scene.add(piece.object);
    const entry = { object: piece.object, body };
    looseBodies.add(entry);
    return entry;
  }
  function removeLoose(entry) {
    looseBodies.delete(entry);
    removeBody(entry.body);
    scene.remove(entry.object);
  }

  function startGrab(body, point) {
    grab?.release();
    jointBody.position.set(point.x, point.y, point.z);
    const pivot = body.pointToLocalFrame(new CANNON.Vec3(point.x, point.y, point.z));
    const constraint = new CANNON.PointToPointConstraint(body, pivot, jointBody, new CANNON.Vec3(), body.mass * 2500 + 20);
    world.addConstraint(constraint);
    const damping = { linear: body.linearDamping, angular: body.angularDamping };
    body.linearDamping = 0.3;
    body.angularDamping = 0.7;
    body.allowSleep = false;
    body.wakeUp();
    const finish = () => {
      world.removeConstraint(constraint);
      body.linearDamping = damping.linear;
      body.angularDamping = damping.angular;
      body.allowSleep = true;
      if (grab === handle) grab = null;
    };
    const handle = {
      body,
      move(target) {
        jointBody.position.set(target.x, target.y, target.z);
        body.wakeUp();
      },
      release(velocity) {
        finish();
        if (velocity) body.velocity.set(velocity.x, velocity.y, velocity.z);
      },
      cancel: finish,
      get active() {
        return grab === handle;
      },
    };
    grab = handle;
    return handle;
  }

  return {
    world,
    assemblies,
    addStaticBox,
    addStaticPlane,
    createAssembly,
    breakAssembly,
    shatterAssembly,
    detachPart,
    holdAssembly,
    releaseAssembly,
    resetAssembly,
    resetAssemblies,
    punch,
    startGrab,
    spawnLoose,
    removeLoose,
    grabbedBody: () => grab?.body ?? null,
    defer: (callback) => deferred.push(callback),
    onImpact: (listener) => impactListeners.push(listener),
    onReset: (listener) => resetListeners.push(listener),
    // Runs before every fixed substep, for forces such as the paper airplane's lift.
    onStep: (listener) => world.addEventListener('preStep', () => listener(FIXED_STEP)),
    bodyFor(owner) {
      if (owner.debris) return owner.debris.body;
      return owner.assembly.state === 'intact' ? owner.assembly.body : owner.part?.body ?? null;
    },
    ownerOf(object) {
      for (let current = object; current; current = current.parent) if (current.userData.owner) return current.userData.owner;
      return null;
    },
    pickRoots() {
      const roots = [];
      for (const assembly of assemblies) {
        if (assembly.state === 'intact' || assembly.state === 'held') roots.push(assembly.root);
        else for (const part of assembly.parts) if (part.body) roots.push(part.object);
        for (const entry of assembly.debris) roots.push(entry.object);
      }
      return roots;
    },
    bodiesOf(assembly) {
      const debris = assembly.debris.map((entry) => entry.body);
      if (assembly.state === 'held') return debris;
      if (assembly.state === 'intact') return [assembly.body, ...debris];
      return [...assembly.parts.map((part) => part.body).filter(Boolean), ...debris];
    },
    settle(steps) {
      muted = true;
      for (let step = 0; step < steps; step += 1) world.step(FIXED_STEP);
      for (const assembly of assemblies) {
        syncAssembly(assembly);
        assembly.restPosition.copy(assembly.root.position);
        assembly.restQuaternion.copy(assembly.root.quaternion);
        assembly.body.sleep();
      }
      muted = false;
    },
    step(delta) {
      world.step(FIXED_STEP, delta, MAX_SUBSTEPS);
      elapsed += delta;
      for (const [body, until] of graceBodies) {
        if (elapsed < until || overlapsSibling(body)) continue;
        body.collisionFilterMask = -1;
        graceBodies.delete(body);
      }
      for (const body of world.bodies) {
        const speed = body.velocity.length();
        if (speed > MAX_SPEED) body.velocity.scale(MAX_SPEED / speed, body.velocity);
      }
      deferred.splice(0).forEach((callback) => callback());
      for (const assembly of assemblies) syncAssembly(assembly);
      for (const entry of looseBodies) syncObject(entry.object, entry.body, scratchZero);
    },
  };
}
