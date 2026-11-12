import * as THREE from 'three';
import { addMesh, createPart } from './geometry.js';
import { box, cylinder } from './physics.js';

const GLAZE = 0xf2b8c6;
const INNER_GLAZE = 0xf8dde3;
const BISQUE = 0xf1e9dc;
const HEIGHT = 3.6;
const BOTTOM_THICKNESS = 0.3;
const WALL_THICKNESS = 0.15;
const ANGULAR_CELLS = 16;
const VERTICAL_CELLS = 6;
const BOTTOM_WEDGES = 7;
const HANDLE_FRAGMENTS = 4;
const MIN_HALF_EXTENT = 0.07;
// Shards are heavier than a real fragment so they rest stably against much heavier bodies.
const SHARD_MASS = 0.012;

const outerRadius = (y) => THREE.MathUtils.lerp(1.33, 1.5, THREE.MathUtils.clamp(y / HEIGHT, 0, 1));
const surfacePoint = (theta, y, radius) => new THREE.Vector3(Math.cos(theta) * radius, y, -Math.sin(theta) * radius);

function createHandleCurve() {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.4, 3.0, 0),
    new THREE.Vector3(2.35, 2.85, 0),
    new THREE.Vector3(2.65, 2.0, 0),
    new THREE.Vector3(2.4, 1.15, 0),
    new THREE.Vector3(1.4, 0.85, 0),
  ]);
}

function createBodyGeometry() {
  const profile = [
    [0, 0.02],
    [1.24, 0],
    [1.33, 0.08],
    [1.5, HEIGHT - 0.05],
    [1.47, HEIGHT + 0.03],
    [1.39, HEIGHT + 0.03],
    [1.35, HEIGHT - 0.08],
    [1.19, BOTTOM_THICKNESS + 0.04],
    [0, BOTTOM_THICKNESS],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(profile, 48);
}

export function createMug() {
  const root = new THREE.Group();
  root.name = 'mug';
  root.position.set(-21, 0, 12);
  root.rotation.y = -2.2;
  const glaze = new THREE.MeshPhysicalMaterial({ color: GLAZE, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.15, side: THREE.DoubleSide });

  const body = createPart(root, 'mug body');
  addMesh(body, createBodyGeometry(), glaze);
  addMesh(body, new THREE.CircleGeometry(1.3, 32), new THREE.MeshStandardMaterial({ color: 0x4a2c1a, roughness: 0.12 }), [0, 2.9, 0], [-Math.PI / 2, 0, 0]);
  const handle = createPart(root, 'mug handle');
  addMesh(handle, new THREE.TubeGeometry(createHandleCurve(), 24, 0.2, 10, false), glaze);

  return {
    spec: {
      name: 'mug',
      root,
      material: 'ceramic',
      parts: [
        { object: body, material: 'ceramic', mass: 0.35, colliders: [cylinder(1.45, HEIGHT, [0, HEIGHT / 2, 0])] },
        { object: handle, material: 'ceramic', mass: 0.05, colliders: [box([1.3, 2.4, 0.4], [2.1, 1.95, 0])] },
      ],
    },
  };
}

// Builds a closed shard from triangles, flipping any face that points back toward the shard's centre.
class ShardBuilder {
  constructor() {
    this.positions = [];
    this.colors = [];
  }

  triangle(a, b, c, color) {
    this.positions.push(a, b, c);
    this.colors.push(color, color, color);
  }

  quad(a, b, c, d, color) {
    this.triangle(a, b, c, color);
    this.triangle(a, c, d, color);
  }

  build(frameRotation) {
    const center = new THREE.Vector3();
    for (const point of this.positions) center.add(point);
    center.divideScalar(this.positions.length);
    const inverse = frameRotation.clone().invert();
    const local = this.positions.map((point) => point.clone().sub(center).applyQuaternion(inverse));
    const positionArray = new Float32Array(local.length * 3);
    const colorArray = new Float32Array(local.length * 3);
    const edgeA = new THREE.Vector3();
    const edgeB = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const centroid = new THREE.Vector3();
    for (let index = 0; index < local.length; index += 3) {
      let [a, b, c] = [local[index], local[index + 1], local[index + 2]];
      normal.crossVectors(edgeA.subVectors(b, a), edgeB.subVectors(c, a));
      centroid.copy(a).add(b).add(c).divideScalar(3);
      if (normal.dot(centroid) < 0) [b, c] = [c, b];
      [a, b, c].forEach((point, corner) => {
        positionArray.set([point.x, point.y, point.z], (index + corner) * 3);
        const color = this.colors[index + corner];
        colorArray.set([color.r, color.g, color.b], (index + corner) * 3);
      });
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    const size = geometry.boundingBox.getSize(new THREE.Vector3());
    const middle = geometry.boundingBox.getCenter(new THREE.Vector3());
    geometry.translate(-middle.x, -middle.y, -middle.z);
    center.add(middle.applyQuaternion(frameRotation));
    return {
      geometry,
      center,
      frame: frameRotation,
      size: [Math.max(size.x, MIN_HALF_EXTENT * 2), Math.max(size.y, MIN_HALF_EXTENT * 2), Math.max(size.z, MIN_HALF_EXTENT * 2)],
    };
  }
}

const colors = { glaze: new THREE.Color(GLAZE), inner: new THREE.Color(INNER_GLAZE), bisque: new THREE.Color(BISQUE) };

function jitteredLattice() {
  const lattice = [];
  for (let row = 0; row <= VERTICAL_CELLS; row += 1) {
    const points = [];
    for (let column = 0; column < ANGULAR_CELLS; column += 1) {
      const angularJitter = row === 0 || row === VERTICAL_CELLS ? 0.12 : 0.32;
      const theta = ((column + (row % 2) * 0.5 + (Math.random() - 0.5) * angularJitter) / ANGULAR_CELLS) * Math.PI * 2;
      const verticalJitter = row === 0 || row === VERTICAL_CELLS ? 0 : (Math.random() - 0.5) * 0.55;
      const y = BOTTOM_THICKNESS + ((row + verticalJitter) / VERTICAL_CELLS) * (HEIGHT - BOTTOM_THICKNESS);
      points.push({ theta, y });
    }
    lattice.push(points);
  }
  return lattice;
}

function wallShard(corners) {
  const builder = new ShardBuilder();
  const steps = 2;
  const sample = (u, v) => {
    const theta = THREE.MathUtils.lerp(THREE.MathUtils.lerp(corners[0].theta, corners[1].theta, u), THREE.MathUtils.lerp(corners[3].theta, corners[2].theta, u), v);
    const y = THREE.MathUtils.lerp(THREE.MathUtils.lerp(corners[0].y, corners[1].y, u), THREE.MathUtils.lerp(corners[3].y, corners[2].y, u), v);
    return { theta, y };
  };
  const outer = [];
  const inner = [];
  for (let i = 0; i <= steps; i += 1) {
    outer.push([]);
    inner.push([]);
    for (let j = 0; j <= steps; j += 1) {
      const { theta, y } = sample(i / steps, j / steps);
      const radius = outerRadius(y);
      outer[i].push(surfacePoint(theta, y, radius));
      inner[i].push(surfacePoint(theta, y, radius - WALL_THICKNESS));
    }
  }
  for (let i = 0; i < steps; i += 1) {
    for (let j = 0; j < steps; j += 1) {
      builder.quad(outer[i][j], outer[i + 1][j], outer[i + 1][j + 1], outer[i][j + 1], colors.glaze);
      builder.quad(inner[i][j], inner[i][j + 1], inner[i + 1][j + 1], inner[i + 1][j], colors.inner);
    }
  }
  const rim = [];
  for (let i = 0; i <= steps; i += 1) rim.push([i, 0]);
  for (let j = 1; j <= steps; j += 1) rim.push([steps, j]);
  for (let i = steps - 1; i >= 0; i -= 1) rim.push([i, steps]);
  for (let j = steps - 1; j >= 0; j -= 1) rim.push([0, j]);
  for (let index = 0; index < rim.length - 1; index += 1) {
    const [i0, j0] = rim[index];
    const [i1, j1] = rim[index + 1];
    builder.quad(outer[i0][j0], outer[i1][j1], inner[i1][j1], inner[i0][j0], colors.bisque);
  }
  const midTheta = sample(0.5, 0.5).theta;
  return builder.build(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), midTheta));
}

function bottomWedge(startTheta, endTheta, hub) {
  const builder = new ShardBuilder();
  const radius = 1.24;
  const arc = [0, 0.5, 1].map((t) => THREE.MathUtils.lerp(startTheta, endTheta, t));
  const top = arc.map((theta) => surfacePoint(theta, BOTTOM_THICKNESS, radius - 0.04));
  const bottom = arc.map((theta) => surfacePoint(theta, 0.02, radius));
  const hubTop = new THREE.Vector3(hub.x, BOTTOM_THICKNESS, hub.z);
  const hubBottom = new THREE.Vector3(hub.x, 0.02, hub.z);
  for (let index = 0; index < 2; index += 1) {
    builder.triangle(hubTop, top[index], top[index + 1], colors.inner);
    builder.triangle(hubBottom, bottom[index + 1], bottom[index], colors.bisque);
    builder.quad(top[index], bottom[index], bottom[index + 1], top[index + 1], colors.glaze);
  }
  builder.quad(hubTop, hubBottom, bottom[0], top[0], colors.bisque);
  builder.quad(hubTop, top[2], bottom[2], hubBottom, colors.bisque);
  return builder.build(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (startTheta + endTheta) / 2));
}

function handleFragment(curve, start, end) {
  const points = Array.from({ length: 5 }, (_, index) => curve.getPoint(THREE.MathUtils.lerp(start, end, index / 4)));
  const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 6, 0.2, 8, false).toNonIndexed();
  const builder = new ShardBuilder();
  const positions = tube.attributes.position;
  for (let index = 0; index < positions.count; index += 3) {
    builder.triangle(
      new THREE.Vector3().fromBufferAttribute(positions, index),
      new THREE.Vector3().fromBufferAttribute(positions, index + 1),
      new THREE.Vector3().fromBufferAttribute(positions, index + 2),
      colors.glaze,
    );
  }
  [points[0], points[4]].forEach((cap, capIndex) => {
    const next = capIndex === 0 ? points[1] : points[3];
    const axis = next.clone().sub(cap).normalize();
    const side = new THREE.Vector3(0, 0, 1).cross(axis).normalize().multiplyScalar(0.2);
    const up = axis.clone().cross(side).normalize().multiplyScalar(0.2);
    const ring = Array.from({ length: 8 }, (_, index) => {
      const angle = (index / 8) * Math.PI * 2;
      return cap.clone().addScaledVector(side, Math.cos(angle) * 0.9).addScaledVector(up, Math.sin(angle) * 0.9);
    });
    for (let index = 0; index < 8; index += 1) builder.triangle(cap, ring[index], ring[(index + 1) % 8], colors.bisque);
  });
  tube.dispose();
  return builder.build(new THREE.Quaternion());
}

// Turns the mug parts' world poses into ~110 shards: wall cells, base wedges and handle fragments.
export function createMugShards(sources) {
  const bodySource = sources.find((source) => source.name === 'mug body');
  const handleSource = sources.find((source) => source.name === 'mug handle');
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0.02, side: THREE.DoubleSide });
  const pieces = [];
  const addPiece = (shard, source, mass) => {
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    source.matrixWorld.decompose(position, quaternion, scale);
    const mesh = new THREE.Mesh(shard.geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const localCenter = shard.center.clone();
    mesh.position.copy(localCenter.clone().applyQuaternion(quaternion).add(position));
    mesh.quaternion.copy(quaternion).multiply(shard.frame);
    const outward = localCenter.clone().setY(0).normalize().applyQuaternion(quaternion);
    const burst = 4 + Math.random() * 9;
    pieces.push({
      object: mesh,
      collider: box(shard.size),
      mass,
      material: 'ceramic',
      velocity: source.velocity.clone().multiplyScalar(0.35).addScaledVector(outward, burst).add(new THREE.Vector3(0, 2 + Math.random() * 7, 0)),
      angularVelocity: new THREE.Vector3((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 24, (Math.random() - 0.5) * 24),
    });
  };

  const lattice = jitteredLattice();
  for (let row = 0; row < VERTICAL_CELLS; row += 1) {
    for (let column = 0; column < ANGULAR_CELLS; column += 1) {
      const nextColumn = (column + 1) % ANGULAR_CELLS;
      const wrap = (point, reference) => ({ ...point, theta: point.theta + (point.theta < reference.theta - Math.PI ? Math.PI * 2 : 0) });
      const a = lattice[row][column];
      const d = lattice[row + 1][column];
      const corners = [a, wrap(lattice[row][nextColumn], a), wrap(lattice[row + 1][nextColumn], d), d];
      addPiece(wallShard(corners), bodySource, SHARD_MASS);
    }
  }

  const hub = new THREE.Vector3((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5);
  const wedgeAngles = Array.from({ length: BOTTOM_WEDGES + 1 }, (_, index) => ((index + (index % BOTTOM_WEDGES === 0 ? 0 : (Math.random() - 0.5) * 0.5)) / BOTTOM_WEDGES) * Math.PI * 2);
  for (let index = 0; index < BOTTOM_WEDGES; index += 1) {
    addPiece(bottomWedge(wedgeAngles[index], wedgeAngles[index + 1], hub), bodySource, SHARD_MASS);
  }

  const curve = createHandleCurve();
  for (let index = 0; index < HANDLE_FRAGMENTS; index += 1) {
    addPiece(handleFragment(curve, index / HANDLE_FRAGMENTS, (index + 1) / HANDLE_FRAGMENTS), handleSource, SHARD_MASS);
  }
  return pieces;
}
