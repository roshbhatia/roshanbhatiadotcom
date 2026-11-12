import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const euler = new THREE.Euler();
const quaternion = new THREE.Quaternion();
const matrix = new THREE.Matrix4();
const scaleVector = new THREE.Vector3();
const positionVector = new THREE.Vector3();

export function plastic(color, roughness = 0.55) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

export function metal(color, roughness = 0.4) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.75 });
}

// Returns a transformed, non-indexed copy so geometries of any kind can be merged together.
export function place(geometry, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const placed = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  placed.clearGroups();
  quaternion.setFromEuler(euler.set(...rotation));
  matrix.compose(positionVector.set(...position), quaternion, scaleVector.set(...scale));
  placed.applyMatrix4(matrix);
  for (const name of Object.keys(placed.attributes)) {
    if (!['position', 'normal', 'uv'].includes(name)) placed.deleteAttribute(name);
  }
  return placed;
}

export function merge(geometries) {
  return mergeGeometries(geometries, false);
}

export function addMesh(parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function addMerged(parent, entries, material) {
  return addMesh(parent, merge(entries), material);
}

export function createPart(parent, name, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const object = new THREE.Group();
  object.name = name;
  object.position.set(...position);
  object.rotation.set(...rotation);
  parent.add(object);
  return object;
}

export function createAnchor(parent, position, name) {
  const anchor = new THREE.Object3D();
  anchor.name = name;
  anchor.position.set(...position);
  parent.add(anchor);
  return anchor;
}

// A cylinder whose axis runs from point a to point b.
export function rodBetween(a, b, radius, radialSegments = 12) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const length = start.distanceTo(end);
  const geometry = new THREE.CylinderGeometry(radius, radius, length, radialSegments);
  const direction = end.clone().sub(start).normalize();
  const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  const placed = geometry.toNonIndexed();
  placed.applyMatrix4(new THREE.Matrix4().compose(start.clone().add(end).multiplyScalar(0.5), rotation, new THREE.Vector3(1, 1, 1)));
  return placed;
}

export function canvasTexture(width, height, draw, { repeat = null, anisotropy = 8 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  if (repeat) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(...repeat);
  }
  return texture;
}

export function speckle(context, width, height, count, colors, size = [1, 3]) {
  for (let index = 0; index < count; index += 1) {
    context.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    const s = size[0] + Math.random() * (size[1] - size[0]);
    context.fillRect(Math.random() * width, Math.random() * height, s, s);
  }
}
