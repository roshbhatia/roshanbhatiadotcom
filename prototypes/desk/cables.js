import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GRAVITY } from './physics.js';
import { DESK_BOUNDS, FLOOR_Y, WALL_BOUNDS } from './cubicle.js';

const RADIAL_SEGMENTS = 7;
const SEGMENT_LENGTH = 1.1;
const ITERATIONS = 14;
const DAMPING = 0.985;
const UNPLUG_STRETCH = 1.04;
const RECONNECT_REACH = 0.92;
const UNPLUG_DROP = new THREE.Vector3(0, 0.8, 2.4);
const FORWARD = new THREE.Vector3(0, 0, 1);

const PLUG_GEOMETRY = {
  din: new THREE.CylinderGeometry(0.42, 0.42, 1.3, 16).rotateX(Math.PI / 2).translate(0, 0, -0.55),
  vga: new RoundedBoxGeometry(1.5, 0.75, 1.3, 2, 0.12).translate(0, 0, -0.55),
  iec: new RoundedBoxGeometry(1.0, 0.75, 1.4, 2, 0.12).translate(0, 0, -0.6),
  nema: new RoundedBoxGeometry(0.8, 1.0, 1.1, 2, 0.15).translate(0, 0, -0.45),
  rj11: new RoundedBoxGeometry(0.45, 0.35, 0.8, 1, 0.05).translate(0, 0, -0.3),
  strain: new THREE.CylinderGeometry(0.2, 0.28, 0.6, 12).rotateX(Math.PI / 2).translate(0, 0, -0.25),
};

function resample(path, count) {
  const lengths = [0];
  for (let index = 1; index < path.length; index += 1) lengths.push(lengths[index - 1] + path[index].distanceTo(path[index - 1]));
  const total = lengths[lengths.length - 1];
  const points = [];
  let segment = 1;
  for (let index = 0; index < count; index += 1) {
    const distance = (index / (count - 1)) * total;
    while (segment < path.length - 1 && lengths[segment] < distance) segment += 1;
    const span = lengths[segment] - lengths[segment - 1] || 1;
    points.push(path[segment - 1].clone().lerp(path[segment], (distance - lengths[segment - 1]) / span));
  }
  return { points, total };
}

// Returns 0 when the point is outside, 1 when it was pushed out, 2 when it was pushed out through the top face.
function pushOutOfBox(point, min, max) {
  if (point.x <= min.x || point.x >= max.x || point.y <= min.y || point.y >= max.y || point.z <= min.z || point.z >= max.z) return 0;
  const exits = [
    [min.x - point.x, 'x'],
    [max.x - point.x, 'x'],
    [min.y - point.y, 'y'],
    [max.y - point.y, 'y'],
    [min.z - point.z, 'z'],
    [max.z - point.z, 'z'],
  ];
  let [best, axis] = exits[0];
  for (const [distance, candidateAxis] of exits) {
    if (Math.abs(distance) < Math.abs(best)) [best, axis] = [distance, candidateAxis];
  }
  point[axis] += best;
  return axis === 'y' && best > 0 ? 2 : 1;
}

function createTubeMesh(count, radius, material) {
  const ring = RADIAL_SEGMENTS + 1;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * ring * 3), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * ring * 3), 3));
  const indices = [];
  for (let index = 0; index < count - 1; index += 1) {
    for (let side = 0; side < RADIAL_SEGMENTS; side += 1) {
      const a = index * ring + side;
      const b = (index + 1) * ring + side;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  geometry.setIndex(indices);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  mesh.userData.radius = radius;
  return mesh;
}

// getObstacles returns oriented boxes ({ inverse, matrix, min, max }) that cables drape over.
export function createCableSystem({ scene, getObstacles }) {
  const cables = [];
  const tangent = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const offset = new THREE.Vector3();
  const local = new THREE.Vector3();
  const deskMin = new THREE.Vector3();
  const deskMax = new THREE.Vector3();

  function anchorPosition(end, target) {
    end.anchor.updateWorldMatrix(true, false);
    return target.setFromMatrixPosition(end.anchor.matrixWorld);
  }

  function initialize(cable) {
    const path = [anchorPosition(cable.ends[0], new THREE.Vector3()), ...cable.waypoints, anchorPosition(cable.ends[1], new THREE.Vector3())];
    const { points } = resample(path, cable.count);
    cable.points = points;
    cable.previous = points.map((point) => point.clone());
  }

  function add({ name, color, radius, a, b, waypoints = [], slack = 1.15, length }) {
    const ends = [a, b].map((end) => ({ ...end, attached: true, rest: null }));
    const pathLength = resample(
      [anchorPosition(ends[0], new THREE.Vector3()), ...waypoints, anchorPosition(ends[1], new THREE.Vector3())],
      2,
    ).total;
    const cableLength = length ?? pathLength * slack;
    const count = THREE.MathUtils.clamp(Math.round(cableLength / SEGMENT_LENGTH), 10, 64);
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
    const plugMaterial = new THREE.MeshStandardMaterial({ color: a.plugColor ?? color, roughness: 0.5 });
    const cable = {
      name,
      ends,
      waypoints,
      count,
      length: cableLength,
      segment: cableLength / (count - 1),
      mesh: createTubeMesh(count, radius, material),
      radius,
    };
    cable.plugs = ends.map((end) => {
      const plug = new THREE.Mesh(PLUG_GEOMETRY[end.plug ?? 'strain'], end.plugColor ? new THREE.MeshStandardMaterial({ color: end.plugColor, roughness: 0.5 }) : plugMaterial);
      plug.castShadow = true;
      scene.add(plug);
      return plug;
    });
    for (const end of ends) end.rest = anchorPosition(end, new THREE.Vector3());
    initialize(cable);
    scene.add(cable.mesh);
    cables.push(cable);
    return cable;
  }

  function collide(point, previous, radius, obstacles) {
    let resting = false;
    if (point.y < FLOOR_Y + radius) {
      point.y = FLOOR_Y + radius;
      resting = true;
    }
    if (point.z < WALL_BOUNDS.backZ + radius && point.y < WALL_BOUNDS.top) point.z = WALL_BOUNDS.backZ + radius;
    if (point.y < WALL_BOUNDS.top && point.z < 32) point.x = THREE.MathUtils.clamp(point.x, -WALL_BOUNDS.sideX + radius, WALL_BOUNDS.sideX - radius);
    deskMin.set(DESK_BOUNDS.minX - radius, DESK_BOUNDS.minY - radius, DESK_BOUNDS.minZ - radius);
    deskMax.set(DESK_BOUNDS.maxX + radius, DESK_BOUNDS.maxY + radius, DESK_BOUNDS.maxZ + radius);
    if (pushOutOfBox(point, deskMin, deskMax) === 2) resting = true;
    for (const obstacle of obstacles) {
      local.copy(point).applyMatrix4(obstacle.inverse);
      deskMin.copy(obstacle.min).subScalar(radius);
      deskMax.copy(obstacle.max).addScalar(radius);
      const result = pushOutOfBox(local, deskMin, deskMax);
      if (!result) continue;
      point.copy(local.applyMatrix4(obstacle.matrix));
      if (result === 2) resting = true;
    }
    if (resting) {
      previous.x = THREE.MathUtils.lerp(previous.x, point.x, 0.35);
      previous.z = THREE.MathUtils.lerp(previous.z, point.z, 0.35);
    }
  }

  function simulate(cable, delta, obstacles) {
    const { points, previous, ends, segment, radius } = cable;
    const last = points.length - 1;
    const gravityStep = GRAVITY * delta * delta;
    const anchors = ends.map((end) => (end.attached ? anchorPosition(end, new THREE.Vector3()) : null));
    for (let index = 0; index <= last; index += 1) {
      if ((index === 0 && anchors[0]) || (index === last && anchors[1])) continue;
      const point = points[index];
      offset.subVectors(point, previous[index]).multiplyScalar(DAMPING);
      previous[index].copy(point);
      point.add(offset);
      point.y -= gravityStep;
    }
    for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
      for (let index = 0; index < last; index += 1) {
        const a = points[index];
        const b = points[index + 1];
        offset.subVectors(b, a);
        const distance = offset.length() || 1e-6;
        const correction = (distance - segment) / distance;
        const pinnedA = index === 0 && anchors[0];
        const pinnedB = index + 1 === last && anchors[1];
        if (pinnedA && pinnedB) continue;
        if (pinnedA) b.addScaledVector(offset, -correction);
        else if (pinnedB) a.addScaledVector(offset, correction);
        else {
          a.addScaledVector(offset, correction * 0.5);
          b.addScaledVector(offset, -correction * 0.5);
        }
      }
      if (anchors[0]) points[0].copy(anchors[0]);
      if (anchors[1]) points[last].copy(anchors[1]);
      if (iteration % 3 === 2) for (let index = 1; index < last; index += 1) collide(points[index], previous[index], radius, obstacles);
    }
    for (const index of [0, last]) if (!anchors[index === 0 ? 0 : 1]) collide(points[index], previous[index], radius, obstacles);
  }

  function checkUnplug(cable) {
    const [first, second] = cable.ends;
    if (!first.attached || !second.attached) return;
    const a = anchorPosition(first, new THREE.Vector3());
    const b = anchorPosition(second, new THREE.Vector3());
    if (a.distanceTo(b) < cable.length * UNPLUG_STRETCH) return;
    // The end whose object travelled farther from where it was plugged in is the one that comes loose.
    const moved = [a.distanceTo(first.rest), b.distanceTo(second.rest)];
    const end = moved[0] >= moved[1] ? first : second;
    end.attached = false;
    end.onUnplug?.();
  }

  function updateMesh(cable) {
    const { points, mesh, radius, plugs } = cable;
    const positions = mesh.geometry.attributes.position;
    const normals = mesh.geometry.attributes.normal;
    const ring = RADIAL_SEGMENTS + 1;
    normal.set(0, 1, 0);
    for (let index = 0; index < points.length; index += 1) {
      const before = points[Math.max(0, index - 1)];
      const after = points[Math.min(points.length - 1, index + 1)];
      tangent.subVectors(after, before).normalize();
      normal.addScaledVector(tangent, -normal.dot(tangent));
      if (normal.lengthSq() < 1e-6) normal.set(1, 0, 0).addScaledVector(tangent, -tangent.x);
      normal.normalize();
      binormal.crossVectors(tangent, normal);
      for (let side = 0; side <= RADIAL_SEGMENTS; side += 1) {
        const angle = (side / RADIAL_SEGMENTS) * Math.PI * 2;
        offset.copy(normal).multiplyScalar(Math.cos(angle)).addScaledVector(binormal, Math.sin(angle));
        const vertex = index * ring + side;
        normals.setXYZ(vertex, offset.x, offset.y, offset.z);
        positions.setXYZ(vertex, points[index].x + offset.x * radius, points[index].y + offset.y * radius, points[index].z + offset.z * radius);
      }
    }
    positions.needsUpdate = true;
    normals.needsUpdate = true;
    plugs.forEach((plug, endIndex) => {
      const tip = endIndex === 0 ? points[0] : points[points.length - 1];
      const inner = endIndex === 0 ? points[1] : points[points.length - 2];
      plug.position.copy(tip);
      tangent.subVectors(tip, inner);
      if (tangent.lengthSq() > 1e-8) plug.quaternion.setFromUnitVectors(FORWARD, tangent.normalize());
    });
  }

  return {
    cables,
    add,
    update(delta) {
      const obstacles = getObstacles();
      for (const cable of cables) {
        checkUnplug(cable);
        simulate(cable, delta, obstacles);
        updateMesh(cable);
      }
    },
    // Re-seats any loose end whose socket is back within reach, e.g. after an object reset.
    // Ends the user pulled out by hand stay out until they are plugged back in or the whole scene resets.
    reconnect() {
      for (const cable of cables) {
        if (cable.ends.every((end) => end.attached) || cable.ends.some((end) => end.unpluggedByHand)) continue;
        const [a, b] = cable.ends.map((end) => anchorPosition(end, new THREE.Vector3()));
        if (a.distanceTo(b) > cable.length * RECONNECT_REACH) continue;
        for (const end of cable.ends) end.attached = true;
        initialize(cable);
      }
    },
    reconnectAll() {
      for (const cable of cables) {
        for (const end of cable.ends) {
          end.attached = true;
          end.unpluggedByHand = false;
        }
        initialize(cable);
      }
    },
    isConnected: (cable) => cable.ends.every((end) => end.attached),
    // Pulls a plug out (it drops back along its cable) or pushes it back in if its socket is within reach.
    // Returns the new attached state, or null when the socket is too far away to reach.
    toggleEnd(cable, index) {
      const end = cable.ends[index];
      const last = cable.points.length - 1;
      const tip = index === 0 ? 0 : last;
      if (end.attached) {
        end.attached = false;
        end.unpluggedByHand = true;
        // Drop the plug just in front of its socket, toward the viewer, so it stays visible and clickable.
        cable.points[tip].add(UNPLUG_DROP);
        cable.previous[tip].copy(cable.points[tip]);
        return false;
      }
      const [a, b] = cable.ends.map((other) => anchorPosition(other, new THREE.Vector3()));
      if (a.distanceTo(b) > cable.length * RECONNECT_REACH) return null;
      end.attached = true;
      end.unpluggedByHand = false;
      return true;
    },
    settle(steps, delta = 1 / 60) {
      const obstacles = getObstacles();
      for (let step = 0; step < steps; step += 1) for (const cable of cables) simulate(cable, delta, obstacles);
      for (const cable of cables) updateMesh(cable);
    },
  };
}

