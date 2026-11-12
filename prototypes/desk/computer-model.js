import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { addMerged, addMesh, createAnchor, createPart, metal, place, plastic } from './geometry.js';
import { box, cylinder } from './physics.js';

export const SCREEN_WIDTH = 1024;
export const SCREEN_HEIGHT = 768;
const BEIGE = 0xd9cfb6;

// A rounded box whose back face shrinks toward backScale; openFront removes the front face to make a shell.
function taperedBox(width, height, depth, backScale, { openFront = false } = {}) {
  let geometry = new RoundedBoxGeometry(width, height, depth, 3, 0.4);
  if (openFront) {
    if (geometry.index) geometry = geometry.toNonIndexed();
    const normals = geometry.attributes.normal;
    const kept = [];
    for (let vertex = 0; vertex < normals.count; vertex += 3) {
      const front = [0, 1, 2].every((corner) => normals.getZ(vertex + corner) > 0.98);
      if (!front) kept.push(vertex, vertex + 1, vertex + 2);
    }
    const filtered = new THREE.BufferGeometry();
    for (const [name, attribute] of Object.entries(geometry.attributes)) {
      const values = new Float32Array(kept.length * attribute.itemSize);
      kept.forEach((source, target) => {
        for (let item = 0; item < attribute.itemSize; item += 1) values[target * attribute.itemSize + item] = attribute.array[source * attribute.itemSize + item];
      });
      filtered.setAttribute(name, new THREE.BufferAttribute(values, attribute.itemSize));
    }
    geometry = filtered;
  }
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const t = (depth / 2 - positions.getZ(index)) / depth;
    const scale = 1 - t * (1 - backScale);
    positions.setX(index, positions.getX(index) * scale);
    positions.setY(index, positions.getY(index) * scale);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function createCurvedScreenGeometry(width, height, bulge) {
  const geometry = new THREE.PlaneGeometry(width, height, 32, 24);
  const positions = geometry.attributes.position;
  const maxRadiusSquared = (width / 2) ** 2 + (height / 2) ** 2;
  for (let index = 0; index < positions.count; index += 1) {
    const radiusSquared = positions.getX(index) ** 2 + positions.getY(index) ** 2;
    positions.setZ(index, bulge * (1 - radiusSquared / maxRadiusSquared));
  }
  geometry.computeVertexNormals();
  return geometry;
}

function roundedRectPath(path, width, height, radius, centerY = 0) {
  const x = -width / 2;
  const y = centerY - height / 2;
  path.moveTo(x + radius, y);
  path.lineTo(x + width - radius, y);
  path.quadraticCurveTo(x + width, y, x + width, y + radius);
  path.lineTo(x + width, y + height - radius);
  path.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  path.lineTo(x + radius, y + height);
  path.quadraticCurveTo(x, y + height, x, y + height - radius);
  path.lineTo(x, y + radius);
  path.quadraticCurveTo(x, y, x + radius, y);
  return path;
}

function createBezelGeometry() {
  const shape = roundedRectPath(new THREE.Shape(), 17.6, 15.1, 0.8);
  shape.holes.push(roundedRectPath(new THREE.Path(), 15, 11.8, 0.7, 0.4));
  return new THREE.ExtrudeGeometry(shape, { depth: 1.6, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2, bevelSegments: 2, curveSegments: 6 });
}

function createFunnelGeometry() {
  const geometry = new THREE.CylinderGeometry(1, 8.5, 7.6, 4, 3, true);
  geometry.rotateY(Math.PI / 4);
  geometry.scale(1.13, 1, 0.87);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 9.6, 1.2);
  return geometry;
}

function createMaterials() {
  return {
    beige: plastic(BEIGE),
    beigeDark: plastic(0xc9bfa6),
    knob: plastic(0xb3a98f),
    trim: plastic(0x3b3a37),
    black: plastic(0x1d1c1a, 0.7),
    steel: metal(0xb9b8b2, 0.45),
    darkSteel: metal(0x6d6c68, 0.5),
    aluminium: metal(0xd4d6d8, 0.3),
    pcb: new THREE.MeshStandardMaterial({ color: 0x2f6b45, roughness: 0.6 }),
    chip: plastic(0x1f1f22, 0.4),
    connectorBlue: plastic(0x34497a, 0.5),
    copper: metal(0xb87333, 0.35),
    tubeGlass: new THREE.MeshStandardMaterial({ color: 0x34383a, roughness: 0.25, metalness: 0.35 }),
    label: new THREE.MeshStandardMaterial({ color: 0xf1efe8, roughness: 0.8 }),
    powerLight: new THREE.MeshStandardMaterial({ color: 0x1f2a1f, emissive: 0x62ff8a, emissiveIntensity: 2 }),
  };
}

function createSystemUnit(materials) {
  const { beige, beigeDark, trim, black, steel, darkSteel, aluminium, pcb, chip, connectorBlue, label, powerLight } = materials;
  const root = new THREE.Group();
  root.name = 'system unit';
  root.position.set(0, 0, -6);
  const parts = [];
  const anchors = {};

  const chassis = createPart(root, 'system unit chassis');
  addMerged(
    chassis,
    [
      place(new THREE.BoxGeometry(24.4, 0.3, 19.2), [0, 0.15, -0.4]),
      place(new THREE.BoxGeometry(24.4, 5.4, 0.25), [0, 2.95, -9.875]),
      place(new THREE.BoxGeometry(24.4, 0.6, 0.25), [0, 0.6, 8.9]),
    ],
    steel,
  );
  addMerged(
    chassis,
    [
      ...Array.from({ length: 6 }, (_, index) => place(new THREE.BoxGeometry(0.6, 3.4, 0.05), [-11.2 + index * 0.9, 2.9, -10.02])),
      place(new THREE.BoxGeometry(1.8, 0.7, 0.12), [-1.6, 2.6, -10.04]),
      place(new THREE.BoxGeometry(2.6, 0.7, 0.12), [-1.6, 3.6, -10.04]),
    ],
    darkSteel,
  );
  parts.push({
    object: chassis,
    material: 'metal',
    mass: 3,
    colliders: [box([24.4, 0.3, 19.2], [0, 0.15, -0.4]), box([24.4, 5.4, 0.25], [0, 2.95, -9.875])],
  });

  const psu = createPart(root, 'power supply', [7.75, 3.6, -6.3]);
  addMesh(psu, new THREE.BoxGeometry(7.4, 3.6, 6.6), steel);
  addMesh(psu, new THREE.PlaneGeometry(3.4, 2.2), label, [-0.8, 1.81, 0.6], [-Math.PI / 2, 0, 0]);
  addMerged(
    psu,
    [
      place(new THREE.TorusGeometry(1.25, 0.08, 6, 28), [-1.2, 0, -3.78]),
      place(new THREE.TorusGeometry(0.7, 0.06, 6, 20), [-1.2, 0, -3.78]),
      place(new THREE.BoxGeometry(2.5, 0.1, 0.08), [-1.2, 0, -3.78]),
      place(new THREE.BoxGeometry(0.1, 2.5, 0.08), [-1.2, 0, -3.78]),
      place(new THREE.BoxGeometry(1.1, 0.75, 0.25), [2.2, -0.9, -3.78]),
    ],
    black,
  );
  addMesh(psu, new RoundedBoxGeometry(0.6, 0.9, 0.2, 2, 0.05), plastic(0xc0392b), [2.2, 0.6, -3.78]);
  anchors.powerInlet = createAnchor(psu, [2.2, -0.9, -3.95], 'system unit power inlet');
  parts.push({ object: psu, material: 'metal', mass: 1.6 });

  const motherboard = createPart(root, 'motherboard', [-4, 0.55, -2.2]);
  addMesh(motherboard, new THREE.BoxGeometry(16, 0.14, 15), pcb);
  addMerged(
    motherboard,
    [
      place(new THREE.BoxGeometry(2.2, 0.3, 2.2), [-2, 0.22, -2]),
      place(new THREE.BoxGeometry(1.4, 0.2, 0.6), [3, 0.17, 3]),
      place(new THREE.BoxGeometry(1, 0.2, 1), [4.5, 0.17, -1]),
      place(new THREE.BoxGeometry(0.8, 0.2, 1.6), [1, 0.17, 5]),
      ...[0, 1, 2, 3].map((index) => place(new THREE.BoxGeometry(0.5, 0.45, 7), [-6.2 + index * 0.9, 0.3, -1.5])),
      ...[0, 1].map((index) => place(new THREE.BoxGeometry(5, 1.1, 0.08), [2.5, 0.62, -5 + index * 0.6])),
    ],
    chip,
  );
  addMerged(
    motherboard,
    Array.from({ length: 8 }, (_, index) => place(new THREE.BoxGeometry(0.12, 1.1, 2.2), [-3 + index * 0.28, 0.92, -2])),
    aluminium,
  );
  parts.push({
    object: motherboard,
    material: 'plastic',
    mass: 0.6,
    colliders: [box([16, 0.14, 15]), box([2.2, 1.4, 2.2], [-2, 0.75, -2])],
  });

  const expansionCard = createPart(root, 'video card', [-8.6, 2.6, -5.4]);
  addMesh(expansionCard, new THREE.BoxGeometry(0.1, 3, 8.6), pcb);
  addMesh(expansionCard, new THREE.BoxGeometry(0.7, 3.6, 0.08), steel, [0, 0.1, -4.6]);
  addMerged(expansionCard, [place(new THREE.BoxGeometry(0.2, 1, 1.4), [0.12, 0, -1]), place(new THREE.BoxGeometry(0.2, 0.8, 0.8), [0.12, 0.4, 1.8])], chip);
  addMesh(expansionCard, new RoundedBoxGeometry(0.55, 1.3, 0.25, 2, 0.06), connectorBlue, [0, 0.3, -4.75]);
  anchors.vgaPort = createAnchor(expansionCard, [0, 0.3, -4.95], 'video port');
  parts.push({ object: expansionCard, mass: 0.15 });

  const driveCage = createPart(root, 'drive cage', [6.5, 3.2, 5.6]);
  addMerged(
    driveCage,
    [
      place(new THREE.BoxGeometry(0.12, 4.2, 6.8), [-3.65, 0, 0]),
      place(new THREE.BoxGeometry(0.12, 4.2, 6.8), [3.65, 0, 0]),
      place(new THREE.BoxGeometry(7.4, 0.12, 6.8), [0, -2.16, 0]),
    ],
    steel,
  );
  parts.push({ object: driveCage, material: 'metal', mass: 0.5 });

  const drives = [];
  for (const [index, y] of [4.3, 2.1].entries()) {
    const drive = createPart(root, `floppy drive ${index + 1}`, [6.5, y, 0]);
    const activityLight = new THREE.MeshStandardMaterial({ color: 0x223322, emissive: 0x3cff6e, emissiveIntensity: 0 });
    drives.push({ object: drive, activityLight, letter: index === 0 ? 'A' : 'B' });
    addMesh(drive, new THREE.BoxGeometry(7, 1.4, 7.4), darkSteel, [0, 0, 6.2]);
    addMesh(drive, new RoundedBoxGeometry(7.5, 1.6, 0.3, 2, 0.1), beigeDark, [0, 0, 10.15]);
    addMesh(drive, new THREE.BoxGeometry(5.5, 0.18, 0.05), black, [0, 0.1, 10.31]);
    addMesh(drive, new THREE.CylinderGeometry(0.08, 0.08, 0.05, 10), activityLight, [-3.2, -0.45, 10.32], [Math.PI / 2, 0, 0]);
    parts.push({ object: drive, material: 'metal', mass: 0.6 });

    const door = createPart(root, `floppy door ${index + 1}`, [6.5, y + 0.12, 10.36], [-0.18, 0, 0]);
    addMesh(door, new THREE.BoxGeometry(5.6, 0.16, 0.05), trim);
    parts.push({ object: door, mass: 0.02 });

    const eject = createPart(root, `floppy eject button ${index + 1}`, [9.3, y - 0.45, 10.36]);
    addMesh(eject, new RoundedBoxGeometry(0.6, 0.35, 0.16, 2, 0.05), plastic(0xb3a98f));
    parts.push({ object: eject, mass: 0.01 });
  }

  const frontPanel = createPart(root, 'front panel');
  addMesh(frontPanel, new RoundedBoxGeometry(25, 6, 0.9, 3, 0.3), beige, [0, 3, 9.55]);
  addMerged(
    frontPanel,
    [
      ...[4.3, 2.1].map((y) => place(new THREE.BoxGeometry(7.8, 1.9, 0.05), [6.5, y, 10.0])),
      ...Array.from({ length: 7 }, (_, index) => place(new THREE.BoxGeometry(4, 0.12, 0.05), [-3.5, 0.7 + index * 0.28, 10.01])),
    ],
    trim,
  );
  addMesh(frontPanel, new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16), powerLight, [-9.5, 2, 10.05], [Math.PI / 2, 0, 0]);
  addMesh(frontPanel, new RoundedBoxGeometry(2.4, 0.5, 0.06, 2, 0.04), aluminium, [-9.5, 3.3, 10.02]);
  addMesh(frontPanel, new THREE.CylinderGeometry(0.22, 0.22, 0.12, 16), plastic(0xb3a98f), [-8.4, 2, 10.06], [Math.PI / 2, 0, 0]);
  // The keyboard socket is on the front so its plug can be reached from the desk.
  addMesh(frontPanel, new THREE.CylinderGeometry(0.42, 0.42, 0.14, 20), black, [-6.5, 1.1, 10.05], [Math.PI / 2, 0, 0]);
  anchors.keyboardPort = createAnchor(frontPanel, [-6.5, 1.1, 10.2], 'keyboard port');
  parts.push({ object: frontPanel, mass: 0.7 });

  // The big red paddle rocks about its horizontal axis: tilted up is on.
  const powerSwitch = createPart(root, 'power switch', [-9.5, 4.65, 10.25]);
  addMesh(powerSwitch, new RoundedBoxGeometry(2.2, 1.3, 0.45, 3, 0.15), plastic(0xc7463d, 0.4));
  addMesh(powerSwitch, new THREE.BoxGeometry(1.4, 0.12, 0.05), plastic(0xf2e6d8), [0, 0.3, 0.24]);
  parts.push({ object: powerSwitch, mass: 0.04 });

  const lid = createPart(root, 'system unit cover');
  addMerged(
    lid,
    [
      place(new RoundedBoxGeometry(25, 0.4, 19.4, 2, 0.15), [0, 5.8, -0.6]),
      place(new RoundedBoxGeometry(0.4, 5.6, 19.4, 2, 0.15), [-12.3, 2.9, -0.6]),
      place(new RoundedBoxGeometry(0.4, 5.6, 19.4, 2, 0.15), [12.3, 2.9, -0.6]),
    ],
    beige,
  );
  parts.push({
    object: lid,
    mass: 1.6,
    colliders: [box([25, 0.4, 19.4], [0, 5.8, -0.6]), box([0.4, 5.6, 19.4], [-12.3, 2.9, -0.6]), box([0.4, 5.6, 19.4], [12.3, 2.9, -0.6])],
  });

  return {
    spec: { name: 'system unit', root, parts, intactColliders: [box([25, 6, 20.4], [0, 3, 0.2])] },
    anchors,
    drives,
    powerSwitch,
    powerLight,
  };
}

function createMonitor(materials, screenMaterial) {
  const { beige, knob, trim, black, tubeGlass, copper, aluminium, label } = materials;
  const powerLight = materials.powerLight.clone();
  const root = new THREE.Group();
  root.name = 'monitor';
  root.position.set(0, 6, -4);
  const parts = [];
  const anchors = {};

  const swivelBase = createPart(root, 'swivel base');
  addMesh(swivelBase, new THREE.CylinderGeometry(4.6, 5, 0.6, 48), beige, [0, 0.3, 0.5]);
  parts.push({ object: swivelBase, mass: 1, colliders: [cylinder(4.8, 0.6, [0, 0.3, 0.5])] });

  const tiltYoke = createPart(root, 'tilt yoke');
  addMesh(tiltYoke, new THREE.CylinderGeometry(2.2, 3, 1, 32), beige, [0, 1.1, 0.5]);
  addMesh(tiltYoke, new RoundedBoxGeometry(7, 0.5, 6, 2, 0.2), beige, [0, 1.75, 0.5]);
  parts.push({ object: tiltYoke, mass: 0.6, colliders: [box([6, 1, 6], [0, 1.1, 0.5]), box([7, 0.5, 6], [0, 1.75, 0.5])] });

  const housingMaterial = beige.clone();
  housingMaterial.side = THREE.DoubleSide;
  const rearHousing = createPart(root, 'rear housing');
  addMesh(rearHousing, taperedBox(16.5, 14, 12, 0.62, { openFront: true }), housingMaterial, [0, 9, -1.2]);
  addMerged(
    rearHousing,
    [
      ...Array.from({ length: 12 }, (_, index) => place(new THREE.BoxGeometry(0.26, 2.4, 0.06), [-3.3 + index * 0.6, 11.4, -7.22])),
      place(new RoundedBoxGeometry(1.2, 0.8, 0.2, 2, 0.05), [3, 6.2, -7.28]),
    ],
    trim,
  );
  addMesh(rearHousing, new THREE.CylinderGeometry(0.4, 0.5, 0.3, 16), black, [-2.5, 6.2, -7.3], [Math.PI / 2, 0, 0]);
  addMesh(rearHousing, new THREE.PlaneGeometry(2.6, 1.4), label, [2.6, 8.2, -7.24], [0, Math.PI, 0]);
  anchors.monitorVga = createAnchor(rearHousing, [-2.5, 6.2, -7.5], 'monitor video cable');
  anchors.monitorPower = createAnchor(rearHousing, [3, 6.2, -7.45], 'monitor power inlet');
  parts.push({
    object: rearHousing,
    mass: 3,
    colliders: [
      box([13.6, 0.5, 11], [0, 14.6, -1.5]),
      box([13.6, 0.5, 11], [0, 3.4, -1.5]),
      box([0.5, 10.8, 11], [-6.9, 9, -1.5]),
      box([0.5, 10.8, 11], [6.9, 9, -1.5]),
      box([10.2, 8.7, 0.5], [0, 9, -7]),
    ],
  });

  const crtTube = createPart(root, 'crt tube');
  addMesh(crtTube, createFunnelGeometry(), tubeGlass);
  addMesh(crtTube, new THREE.CylinderGeometry(0.85, 0.85, 3.4, 20), tubeGlass, [0, 9.6, -4.2], [Math.PI / 2, 0, 0]);
  addMesh(crtTube, new THREE.CylinderGeometry(1.5, 2.3, 1.8, 24), copper, [0, 9.6, -2.6], [Math.PI / 2, 0, 0]);
  addMesh(crtTube, new THREE.CylinderGeometry(0.9, 0.9, 0.5, 16), black, [0, 9.6, -6.1], [Math.PI / 2, 0, 0]);
  addMesh(crtTube, new THREE.SphereGeometry(0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), black, [0, 13.2, 1.6]);
  parts.push({
    object: crtTube,
    material: 'glass',
    mass: 6,
    colliders: [box([12.8, 9.8, 3.6], [0, 9.6, 3.0]), box([7, 5.5, 3], [0, 9.6, -0.3]), box([1.8, 1.8, 4.2], [0, 9.6, -4])],
  });

  const screenGlass = createPart(root, 'screen glass');
  addMesh(screenGlass, new RoundedBoxGeometry(14.6, 11.4, 0.4, 3, 0.5), materials.screenMask, [0, 9.6, 6.4]);
  addMesh(screenGlass, new THREE.BoxGeometry(14.2, 11, 1.2), tubeGlass, [0, 9.6, 5.6]);
  const screen = new THREE.Mesh(createCurvedScreenGeometry(13.4, 10.05, 0.5), screenMaterial);
  screen.position.set(0, 9.6, 6.55);
  screenGlass.add(screen);
  const screenGlow = new THREE.PointLight(0x7dffb0, 6, 18, 1.8);
  screenGlow.position.set(0, 9.6, 9);
  screenGlass.add(screenGlow);
  parts.push({ object: screenGlass, material: 'glass', mass: 2.5, colliders: [box([14.6, 11.4, 1.8], [0, 9.6, 5.9])] });

  const frontBezel = createPart(root, 'front bezel', [0, 9.2, 4.7]);
  addMesh(frontBezel, createBezelGeometry(), beige);
  addMesh(frontBezel, new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), powerLight, [2.6, -6.8, 1.82], [Math.PI / 2, 0, 0]);
  addMesh(frontBezel, new RoundedBoxGeometry(2.2, 0.45, 0.05, 2, 0.04), aluminium, [0, -6.8, 1.81]);
  parts.push({
    object: frontBezel,
    mass: 1.5,
    colliders: [
      box([18, 1.65, 2], [0, 6.925, 0.8]),
      box([18, 2.45, 2], [0, -6.525, 0.8]),
      box([1.7, 11.4, 2], [-8.15, 0.4, 0.8]),
      box([1.7, 11.4, 2], [8.15, 0.4, 0.8]),
    ],
  });

  for (const [index, x] of [5.4, 6.6].entries()) {
    const controlKnob = createPart(root, `control knob ${index + 1}`, [x, 2.4, 6.7], [Math.PI / 2, 0, 0]);
    addMesh(controlKnob, new THREE.CylinderGeometry(0.35, 0.35, 0.4, 20), knob);
    parts.push({ object: controlKnob, mass: 0.02 });
  }
  const powerButton = createPart(root, 'monitor power button', [3.7, 2.4, 6.62]);
  addMesh(powerButton, new RoundedBoxGeometry(0.9, 0.5, 0.3, 2, 0.08), trim);
  parts.push({ object: powerButton, mass: 0.02 });


  return {
    spec: {
      name: 'monitor',
      root,
      parts,
      intactColliders: [
        box([9.4, 0.6, 9.4], [0, 0.3, 0.5]),
        box([7, 1.4, 6], [0, 1.3, 0.5]),
        box([16.5, 14, 6.3], [0, 9, 1.65]),
        box([12, 10.4, 5.7], [0, 9, -4.35]),
        box([18, 15.5, 2], [0, 9.2, 5.5]),
        box([13.4, 10, 0.6], [0, 9.6, 6.8]),
      ],
    },
    anchors,
    screen,
    screenGlow,
    powerButton,
    powerLight,
  };
}

export function createComputer() {
  const materials = createMaterials();
  materials.screenMask = plastic(0x24231f);

  const canvas = document.createElement('canvas');
  canvas.width = SCREEN_WIDTH;
  canvas.height = SCREEN_HEIGHT;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const screenMaterial = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
  screenMaterial.color.setScalar(1.35);

  const systemUnit = createSystemUnit(materials);
  const monitor = createMonitor(materials, screenMaterial);
  const group = new THREE.Group();
  group.add(systemUnit.spec.root, monitor.spec.root);

  return {
    group,
    systemUnit: systemUnit.spec,
    monitor: monitor.spec,
    anchors: { ...systemUnit.anchors, ...monitor.anchors },
    screen: monitor.screen,
    canvas,
    texture,
    screenGlow: monitor.screenGlow,
    screenMaterial,
    screenCenter: new THREE.Vector3(0, 15.6, 2.5),
    drives: systemUnit.drives,
    controls: {
      computerSwitch: systemUnit.powerSwitch,
      computerLight: systemUnit.powerLight,
      monitorButton: monitor.powerButton,
      monitorLight: monitor.powerLight,
    },
  };
}

export function createCrtOverlay() {
  const overlay = document.createElement('canvas');
  overlay.width = SCREEN_WIDTH;
  overlay.height = SCREEN_HEIGHT;
  const context = overlay.getContext('2d');
  context.fillStyle = 'rgba(0, 0, 0, 0.22)';
  for (let y = 0; y < SCREEN_HEIGHT; y += 3) context.fillRect(0, y, SCREEN_WIDTH, 1);
  const vignette = context.createRadialGradient(
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2,
    SCREEN_HEIGHT * 0.3,
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2,
    SCREEN_WIDTH * 0.7,
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  return overlay;
}
