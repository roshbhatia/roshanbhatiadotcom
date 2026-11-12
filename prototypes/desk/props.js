import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { addMerged, addMesh, canvasTexture, createAnchor, createPart, metal, place, plastic, rodBetween } from './geometry.js';
import { box, cylinder } from './physics.js';

const UP = new THREE.Vector3(0, 1, 0);

function createRoot(name, position, rotationY = 0) {
  const root = new THREE.Group();
  root.name = name;
  root.position.set(...position);
  root.rotation.y = rotationY;
  return root;
}

function orientAlong(object, direction) {
  object.quaternion.setFromUnitVectors(UP, direction.clone().normalize());
}

export function createLamp() {
  const root = createRoot('desk lamp', [-36, 0, -11], -0.7);
  const enamel = new THREE.MeshStandardMaterial({ color: 0x9fd8c4, roughness: 0.35 });
  const chrome = metal(0xdfe2e5, 0.22);
  const parts = [];
  const shoulder = new THREE.Vector3(0, 1.1, 0);
  const elbow = new THREE.Vector3(2.5, 13, 0);
  const wrist = new THREE.Vector3(10.5, 14.5, 0);
  const shadeDirection = new THREE.Vector3(0.45, -1, 0).normalize();

  const base = createPart(root, 'lamp base');
  addMesh(base, new THREE.CylinderGeometry(2.4, 2.8, 0.7, 40), enamel, [0, 0.35, 0]);
  addMesh(base, new THREE.CylinderGeometry(0.5, 0.6, 0.6, 16), chrome, [0, 1.0, 0]);
  parts.push({ object: base, material: 'metal', mass: 2.4, colliders: [cylinder(2.8, 0.7, [0, 0.35, 0]), box([1.2, 0.6, 1.2], [0, 1, 0])] });

  // A push switch on top of the shade, where it stays in view from the desk camera.
  const lampSwitch = createPart(root, 'lamp switch', [wrist.x - 0.4, wrist.y + 0.95, 0]);
  addMesh(lampSwitch, new THREE.CylinderGeometry(0.42, 0.42, 0.35, 16), plastic(0x3b3a37));
  parts.push({ object: lampSwitch, mass: 0.02 });

  const arm = (name, from, to, mass) => {
    const object = createPart(root, name);
    const offsets = [-0.35, 0.35];
    addMerged(
      object,
      [
        ...offsets.map((z) => rodBetween([from.x, from.y, z], [to.x, to.y, z], 0.14)),
        rodBetween([from.x + 0.55, from.y + 0.6, 0], [to.x + 0.4, to.y - 1, 0], 0.07, 8),
        place(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 16), [to.x, to.y, 0], [Math.PI / 2, 0, 0]),
      ],
      chrome,
    );
    parts.push({ object, material: 'metal', mass });
    return object;
  };
  arm('lamp lower arm', shoulder, elbow, 0.25);
  arm('lamp upper arm', elbow, wrist, 0.2);

  const head = createPart(root, 'lamp head', [wrist.x, wrist.y, 0]);
  const shadeCenter = shadeDirection.clone().multiplyScalar(1.9);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 2.6, 3.4, 32, 1, true), enamel.clone());
  shade.material.side = THREE.DoubleSide;
  shade.position.copy(shadeCenter);
  orientAlong(shade, shadeDirection.clone().negate());
  shade.castShadow = true;
  head.add(shade);
  const cap = addMesh(head, new THREE.CylinderGeometry(0.95, 0.95, 0.5, 24), enamel, [0, 0, 0]);
  orientAlong(cap, shadeDirection);
  parts.push({ object: head, material: 'metal', mass: 0.35 });

  const bulbPosition = shadeDirection.clone().multiplyScalar(1.7).add(wrist);
  const bulb = createPart(root, 'lamp bulb', bulbPosition.toArray());
  const bulbMaterial = new THREE.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0xffe9b8, emissiveIntensity: 2.4 });
  const glass = addMesh(bulb, new THREE.SphereGeometry(0.8, 20, 14), bulbMaterial);
  glass.castShadow = false;
  const light = new THREE.SpotLight(0xffe2b0, 14, 45, 0.8, 0.75, 1.2);
  light.target.position.copy(shadeDirection).multiplyScalar(10);
  bulb.add(light, light.target);
  parts.push({ object: bulb, material: 'glass', mass: 0.05 });

  const anchors = { cord: createAnchor(base, [-2.7, 0.3, 0], 'lamp cord') };
  return { spec: { name: 'desk lamp', root, parts, material: 'metal' }, anchors, light, bulbMaterial, lampSwitch };
}

function createPencil() {
  const object = new THREE.Group();
  addMesh(object, new THREE.CylinderGeometry(0.16, 0.16, 5.4, 6), plastic(0xf4c542, 0.5));
  addMesh(object, new THREE.CylinderGeometry(0.17, 0.17, 0.4, 12), metal(0xc9c3b0), [0, 2.9, 0]);
  addMesh(object, new THREE.CylinderGeometry(0.16, 0.16, 0.5, 12), plastic(0xf2a0b0, 0.8), [0, 3.35, 0]);
  addMesh(object, new THREE.ConeGeometry(0.16, 0.7, 6), plastic(0xe8c9a0, 0.8), [0, -3.05, 0], [Math.PI, 0, 0]);
  return object;
}

export function createPhone() {
  const root = createRoot('desk phone', [31, 0, 5], -0.35);
  const shell = plastic(0xd6d0c2, 0.5);
  const parts = [];

  const base = createPart(root, 'phone base');
  addMerged(
    base,
    [
      place(new RoundedBoxGeometry(8, 1.6, 7, 3, 0.4), [0, 0.8, 0]),
      place(new RoundedBoxGeometry(4.4, 0.8, 5.6, 2, 0.3), [1.6, 1.75, 0.4], [0.18, 0, 0]),
      place(new RoundedBoxGeometry(2.6, 0.9, 1.7, 2, 0.3), [-2.4, 1.95, -2.5]),
      place(new RoundedBoxGeometry(2.6, 0.9, 1.7, 2, 0.3), [-2.4, 1.95, 2.5]),
    ],
    shell,
  );
  addMesh(base, new THREE.BoxGeometry(2.8, 0.1, 1.1), new THREE.MeshStandardMaterial({ color: 0x9fb39a, emissive: 0x3d5a3a, emissiveIntensity: 0.4, roughness: 0.3 }), [1.6, 2.13, -1.7], [0.18, 0, 0]);
  addMesh(base, new THREE.CylinderGeometry(0.22, 0.22, 0.3, 12), plastic(0x8e877a), [-2.4, 1.6, 0]);
  parts.push({ object: base, mass: 0.9 });

  const keypad = createPart(root, 'phone keypad', [1.6, 2.25, 1.2], [0.18, 0, 0]);
  const keys = [];
  for (let row = 0; row < 4; row += 1) for (let column = 0; column < 3; column += 1) keys.push(place(new RoundedBoxGeometry(0.8, 0.25, 0.62, 2, 0.08), [(column - 1) * 1.05, 0, (row - 1.5) * 0.85]));
  addMerged(keypad, keys, plastic(0xefece4, 0.45));
  parts.push({ object: keypad, mass: 0.05 });

  const handset = createPart(root, 'phone handset', [-2.4, 2.95, 0]);
  addMerged(
    handset,
    [
      place(new RoundedBoxGeometry(1.6, 0.8, 7.4, 3, 0.35), [0, 0.25, 0]),
      place(new RoundedBoxGeometry(2.2, 1.2, 2.0, 3, 0.45), [0, -0.1, -2.8]),
      place(new RoundedBoxGeometry(2.2, 1.2, 2.0, 3, 0.45), [0, -0.1, 2.8]),
    ],
    shell,
  );
  parts.push({ object: handset, mass: 0.25 });

  const anchors = {
    handsetCord: createAnchor(handset, [0, -0.5, 3.75], 'handset cord'),
    baseCoil: createAnchor(base, [-4.05, 0.5, 2.6], 'base coil socket'),
    lineCord: createAnchor(base, [2.6, 0.5, -3.55], 'phone line socket'),
  };
  return { spec: { name: 'desk phone', root, parts }, anchors };
}

export function createPowerStrip() {
  const root = createRoot('power strip', [26, 0, -17.2]);
  const parts = [];
  const housing = createPart(root, 'power strip housing');
  addMesh(housing, new RoundedBoxGeometry(13, 0.7, 2.6, 2, 0.25), plastic(0xeeeae0, 0.5), [0, 0.35, 0]);
  parts.push({ object: housing, mass: 0.35 });

  const cover = createPart(root, 'power strip cover', [0, 0.95, 0]);
  addMesh(cover, new RoundedBoxGeometry(13, 0.5, 2.6, 2, 0.22), plastic(0xeeeae0, 0.5));
  const outletX = [-4.6, -2.8, -1, 0.8, 2.6, 4.4];
  addMerged(
    cover,
    outletX.flatMap((x) => [
      place(new THREE.BoxGeometry(0.12, 0.05, 0.5), [x - 0.25, 0.26, -0.15]),
      place(new THREE.BoxGeometry(0.12, 0.05, 0.5), [x + 0.25, 0.26, -0.15]),
      place(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 10), [x, 0.26, 0.5]),
    ]),
    plastic(0x1a1a1a, 0.8),
  );
  parts.push({ object: cover, mass: 0.15 });

  const rocker = createPart(root, 'power strip switch', [5.75, 1.25, 0]);
  const rockerMaterial = new THREE.MeshStandardMaterial({ color: 0xd8473f, emissive: 0xff3b2f, emissiveIntensity: 1.3, roughness: 0.3 });
  addMesh(rocker, new RoundedBoxGeometry(0.9, 0.35, 1.4, 2, 0.1), rockerMaterial);
  parts.push({ object: rocker, mass: 0.01 });

  const anchors = {
    outlets: outletX.map((x, index) => createAnchor(cover, [x, 0.3, 0.15], `outlet ${index + 1}`)),
    cord: createAnchor(housing, [-6.6, 0.4, 0], 'power strip cord'),
  };
  return { spec: { name: 'power strip', root, parts }, anchors, rocker, rockerMaterial };
}

export function createNotepad() {
  const root = createRoot('notepad', [-27, 0, 19], 0.25);
  const parts = [];
  const pageTexture = canvasTexture(256, 336, (context, width, height) => {
    context.fillStyle = '#fbf3b6';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#9cc3e6';
    for (let y = 46; y < height; y += 14) context.fillRect(0, y, width, 1.4);
    context.fillStyle = '#e79aa6';
    context.fillRect(34, 0, 1.6, height);
    context.fillStyle = '#3a3f8f';
    context.font = '600 20px "Marker Felt", "Comic Sans MS", cursive';
    context.fillText('todo:', 44, 40);
    ['- fix printer', '- water plant', '- learn the DAW'].forEach((line, index) => context.fillText(line, 44, 74 + index * 28));
  });
  const pad = createPart(root, 'notepad pad');
  const paperSide = plastic(0xf6efd0, 0.9);
  const top = new THREE.MeshStandardMaterial({ map: pageTexture, roughness: 0.9 });
  addMesh(pad, new THREE.BoxGeometry(8, 0.35, 10.5), [paperSide, paperSide, top, paperSide, paperSide, paperSide], [0, 0.175, 0]);
  addMesh(pad, new THREE.BoxGeometry(8.1, 0.5, 1.2), plastic(0xc95d5d, 0.6), [0, 0.25, -5.3]);
  parts.push({ object: pad, material: 'paper', mass: 0.15 });

  const pencil = createPencil();
  pencil.name = 'notepad pencil';
  pencil.position.set(1.5, 0.52, 0.5);
  pencil.rotation.set(Math.PI / 2, 0, 0.5);
  root.add(pencil);
  parts.push({ object: pencil, mass: 0.02 });
  return { spec: { name: 'notepad', root, parts, material: 'paper' } };
}

export function createStapler() {
  const root = createRoot('stapler', [19, 0, -7], 0.45);
  const parts = [];
  const base = createPart(root, 'stapler base');
  addMesh(base, new RoundedBoxGeometry(1.7, 0.4, 7, 2, 0.15), plastic(0x3b3d48, 0.5), [0, 0.2, 0]);
  addMesh(base, new THREE.BoxGeometry(1.1, 0.06, 1.2), metal(0xcfd2d6), [0, 0.42, 3]);
  parts.push({ object: base, material: 'metal', mass: 0.3 });
  const arm = createPart(root, 'stapler arm', [0, 0.95, -0.1], [0.04, 0, 0]);
  addMesh(arm, new RoundedBoxGeometry(1.5, 0.9, 6.6, 3, 0.35), plastic(0xe57373, 0.35));
  parts.push({ object: arm, mass: 0.2 });
  return { spec: { name: 'stapler', root, parts, material: 'metal' } };
}
