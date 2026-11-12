import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { addMesh, canvasTexture, createAnchor, merge, metal, place, plastic, speckle } from './geometry.js';

export const FLOOR_Y = -36;
export const DESK_BOUNDS = { minX: -46, maxX: 46, minY: -2, maxY: 0, minZ: -20, maxZ: 28 };
export const WALL_BOUNDS = { backZ: -21, sideX: 46, top: 45 };
const PANEL_THICKNESS = 2.5;
const PANEL_FRONT_Z = 32;

// Box-projected UVs in world units so one repeating texture tiles evenly across merged pieces.
function worldUv(geometry, unitsPerRepeat) {
  const positions = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  const uvs = new Float32Array(positions.count * 2);
  for (let index = 0; index < positions.count; index += 1) {
    const nx = Math.abs(normals.getX(index));
    const ny = Math.abs(normals.getY(index));
    const nz = Math.abs(normals.getZ(index));
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const [u, v] = nx >= ny && nx >= nz ? [z, y] : ny >= nz ? [x, z] : [x, y];
    uvs[index * 2] = u / unitsPerRepeat;
    uvs[index * 2 + 1] = v / unitsPerRepeat;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  return geometry;
}

function colorize(geometry, color) {
  const tint = new THREE.Color(color);
  const colors = new Float32Array(geometry.attributes.position.count * 3);
  for (let index = 0; index < colors.length; index += 3) colors.set([tint.r, tint.g, tint.b], index);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function staticMesh(group, geometries, material, { castShadow = true } = {}) {
  const mesh = new THREE.Mesh(merge(geometries), material);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function createFabricTexture() {
  return canvasTexture(
    256,
    256,
    (context, width, height) => {
      context.fillStyle = '#a9b1c9';
      context.fillRect(0, 0, width, height);
      for (let y = 0; y < height; y += 2) {
        context.fillStyle = `rgba(255, 255, 255, ${0.02 + Math.random() * 0.04})`;
        context.fillRect(0, y, width, 1);
      }
      for (let x = 0; x < width; x += 2) {
        context.fillStyle = `rgba(40, 50, 90, ${0.02 + Math.random() * 0.04})`;
        context.fillRect(x, 0, 1, height);
      }
      speckle(context, width, height, 2600, ['rgba(70, 80, 120, 0.18)', 'rgba(255, 255, 255, 0.16)', 'rgba(150, 120, 170, 0.15)']);
    },
    { repeat: [1, 1] },
  );
}

function createCarpetTexture() {
  return canvasTexture(
    256,
    256,
    (context, width, height) => {
      context.fillStyle = '#6f7891';
      context.fillRect(0, 0, width, height);
      speckle(context, width, height, 9000, ['#5d6680', '#848da6', '#6a6488', '#7b8aa0'], [1, 2.5]);
    },
    { repeat: [1, 1] },
  );
}

// Walnut: warm dark brown with long wavy grain, darker figure lines and a few lighter streaks.
function createWoodTexture() {
  return canvasTexture(2048, 1024, (context, width, height) => {
    const base = context.createLinearGradient(0, 0, 0, height);
    base.addColorStop(0, '#5b3a25');
    base.addColorStop(0.5, '#4e301e');
    base.addColorStop(1, '#583823');
    context.fillStyle = base;
    context.fillRect(0, 0, width, height);
    for (let band = 0; band < 14; band += 1) {
      context.fillStyle = `rgba(${Math.random() < 0.5 ? '120, 78, 46' : '40, 22, 12'}, ${0.06 + Math.random() * 0.08})`;
      context.fillRect(0, Math.random() * height, width, 20 + Math.random() * 90);
    }
    for (let line = 0; line < 420; line += 1) {
      const y = Math.random() * height;
      const dark = Math.random() < 0.7;
      context.strokeStyle = dark ? `rgba(28, 14, 6, ${0.08 + Math.random() * 0.18})` : `rgba(160, 108, 66, ${0.05 + Math.random() * 0.1})`;
      context.lineWidth = 0.8 + Math.random() * (dark ? 2.5 : 1.5);
      const amplitude = 3 + Math.random() * 10;
      const frequency = 0.002 + Math.random() * 0.004;
      const phase = Math.random() * Math.PI * 2;
      context.beginPath();
      context.moveTo(0, y);
      for (let x = 0; x <= width; x += 32) context.lineTo(x, y + Math.sin(x * frequency + phase) * amplitude);
      context.stroke();
    }
    speckle(context, width, height, 6000, ['rgba(20, 10, 4, 0.25)', 'rgba(150, 100, 60, 0.15)'], [1, 2]);
  });
}

function createCeilingTexture() {
  return canvasTexture(
    256,
    256,
    (context, width, height) => {
      context.fillStyle = '#eeece6';
      context.fillRect(0, 0, width, height);
      speckle(context, width, height, 1800, ['rgba(120, 115, 105, 0.25)', 'rgba(160, 155, 145, 0.2)'], [1, 2]);
      context.fillStyle = '#d4d6da';
      context.fillRect(0, 0, width, 6);
      context.fillRect(0, 0, 6, height);
    },
    { repeat: [1, 1] },
  );
}

const HANDWRITING = '"Marker Felt", "Comic Sans MS", "Bradley Hand", cursive';

// Each paper is drawn into one atlas so every pinned sheet renders in a single draw call.
const PAPERS = [
  {
    size: [7.2, 9.3],
    position: [-27, 25, 0],
    tilt: 0.03,
    draw(context, width, height) {
      context.fillStyle = '#fbfaf5';
      context.fillRect(0, 0, width, height);
      context.fillStyle = '#e98aa6';
      context.fillRect(0, 0, width, 70);
      context.fillStyle = '#ffffff';
      context.font = `700 40px "Helvetica Neue", Arial, sans-serif`;
      context.fillText('NOVEMBER 1994', 24, 50);
      context.strokeStyle = '#c9c4ba';
      context.lineWidth = 2;
      const cellWidth = (width - 30) / 7;
      const cellHeight = (height - 110) / 5;
      context.font = `500 18px "Helvetica Neue", Arial, sans-serif`;
      context.fillStyle = '#5b5750';
      for (let row = 0; row < 5; row += 1) {
        for (let column = 0; column < 7; column += 1) {
          const x = 15 + column * cellWidth;
          const y = 90 + row * cellHeight;
          context.strokeRect(x, y, cellWidth, cellHeight);
          const day = row * 7 + column - 1;
          if (day > 0 && day <= 30) context.fillText(String(day), x + 6, y + 22);
        }
      }
      context.strokeStyle = '#d6455d';
      context.lineWidth = 4;
      context.beginPath();
      context.arc(15 + 4.5 * cellWidth, 90 + 1.5 * cellHeight, 30, 0, Math.PI * 2);
      context.stroke();
    },
  },
  {
    size: [4.4, 5.2],
    position: [-17.5, 30, 0.04],
    tilt: 0.09,
    draw(context, width, height) {
      context.fillStyle = '#fdfdfb';
      context.fillRect(0, 0, width, height);
      const gradient = context.createLinearGradient(0, 16, 0, height - 70);
      gradient.addColorStop(0, '#9fd6ff');
      gradient.addColorStop(1, '#ffd7e8');
      context.fillStyle = gradient;
      context.fillRect(16, 16, width - 32, height - 90);
      context.fillStyle = '#fff3b0';
      context.beginPath();
      context.arc(width * 0.66, height * 0.32, 34, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#9ad7b8';
      context.beginPath();
      context.moveTo(16, height - 74);
      context.quadraticCurveTo(width * 0.35, height * 0.42, width - 16, height - 74);
      context.fill();
      context.fillStyle = '#3d3a6b';
      context.font = `400 26px ${HANDWRITING}`;
      context.fillText('maui 93', 30, height - 28);
    },
  },
  {
    size: [8, 6.2],
    position: [27, 26, 0],
    tilt: -0.02,
    draw(context, width, height) {
      context.fillStyle = '#f9f8f3';
      context.fillRect(0, 0, width, height);
      context.strokeStyle = '#4a5a8a';
      context.fillStyle = '#4a5a8a';
      context.lineWidth = 3;
      context.font = `600 18px "Helvetica Neue", Arial, sans-serif`;
      context.fillText('ORG CHART', 24, 36);
      const boxes = [
        [width / 2 - 60, 60, 'CEO'],
        [60, 180, 'SALES'],
        [width / 2 - 60, 180, 'R&D'],
        [width - 180, 180, 'ME'],
      ];
      for (const [x, y, label] of boxes) {
        context.strokeRect(x, y, 120, 54);
        context.fillText(label, x + 22, y + 34);
      }
      context.beginPath();
      context.moveTo(width / 2, 114);
      context.lineTo(width / 2, 150);
      context.moveTo(120, 150);
      context.lineTo(width - 120, 150);
      for (const x of [120, width / 2, width - 120]) {
        context.moveTo(x, 150);
        context.lineTo(x, 180);
      }
      context.stroke();
      context.strokeStyle = '#e04a6a';
      context.beginPath();
      context.arc(width - 120, 207, 78, 0, Math.PI * 2);
      context.stroke();
    },
  },
];

function createPinnedPapers(group) {
  const pixelsPerUnit = 64;
  const atlasWidth = 2048;
  const regions = [];
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;
  for (const paper of PAPERS) {
    const width = Math.round(paper.size[0] * pixelsPerUnit);
    const height = Math.round(paper.size[1] * pixelsPerUnit);
    if (cursorX + width > atlasWidth) {
      cursorX = 0;
      cursorY += rowHeight + 4;
      rowHeight = 0;
    }
    regions.push({ x: cursorX, y: cursorY, width, height });
    cursorX += width + 4;
    rowHeight = Math.max(rowHeight, height);
  }
  const atlasHeight = THREE.MathUtils.ceilPowerOfTwo(cursorY + rowHeight);
  const texture = canvasTexture(atlasWidth, atlasHeight, (context) => {
    PAPERS.forEach((paper, index) => {
      const region = regions[index];
      context.save();
      context.translate(region.x, region.y);
      context.beginPath();
      context.rect(0, 0, region.width, region.height);
      context.clip();
      paper.draw(context, region.width, region.height);
      context.restore();
    });
  });

  const sheets = [];
  const pins = [];
  const pinColors = [0xe85a71, 0x4fa3e0, 0x6cc48a, 0xf2c14e];
  PAPERS.forEach((paper, index) => {
    const region = regions[index];
    const geometry = new THREE.PlaneGeometry(...paper.size);
    const uvs = geometry.attributes.uv;
    for (let vertex = 0; vertex < uvs.count; vertex += 1) {
      uvs.setXY(
        vertex,
        (region.x + uvs.getX(vertex) * region.width) / atlasWidth,
        1 - (region.y + (1 - uvs.getY(vertex)) * region.height) / atlasHeight,
      );
    }
    const [x, y, offset] = paper.position;
    const z = WALL_BOUNDS.backZ + 0.06 + offset;
    sheets.push(place(geometry, [x, y, z], [0, 0, paper.tilt]));
    const pinHeight = y + paper.size[1] / 2 - 0.5;
    const pinGeometry = merge([place(new THREE.SphereGeometry(0.32, 12, 8), [0, 0, 0.35]), place(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6), [0, 0, 0.1], [Math.PI / 2, 0, 0])]);
    pins.push(colorize(place(pinGeometry, [x - Math.sin(paper.tilt) * paper.size[1] * 0.45, pinHeight, z]), pinColors[index % pinColors.length]));
  });
  const paperMesh = staticMesh(group, sheets, new THREE.MeshStandardMaterial({ map: texture, roughness: 0.92 }), { castShadow: false });
  paperMesh.castShadow = false;
  staticMesh(group, pins, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35 }));
}

function addLights(scene) {
  const hemisphere = new THREE.HemisphereLight(0xfffaf0, 0xc8b89a, 0.7);
  scene.add(hemisphere);
  const ceilingLight = new THREE.DirectionalLight(0xfff3e0, 1.35);
  ceilingLight.position.set(-14, 90, 38);
  ceilingLight.castShadow = true;
  ceilingLight.shadow.mapSize.set(2048, 2048);
  Object.assign(ceilingLight.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 10, far: 200 });
  ceilingLight.shadow.bias = -0.0004;
  ceilingLight.shadow.normalBias = 0.02;
  ceilingLight.shadow.radius = 4;
  scene.add(ceilingLight);
  const fluorescentFill = new THREE.DirectionalLight(0xeef2ff, 0.3);
  fluorescentFill.position.set(20, 80, -10);
  scene.add(fluorescentFill);
  const binLight = new THREE.SpotLight(0xfff1dc, 18, 70, 1.25, 1, 1.2);
  binLight.position.set(0, 30, -9);
  binLight.target.position.set(0, 0, -4);
  scene.add(binLight, binLight.target);
  return [hemisphere, ceilingLight, fluorescentFill, binLight];
}

function createCreditTexture(text) {
  return canvasTexture(512, 40, (context, width, height) => {
    context.fillStyle = '#fbfaf6';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#4a4a4a';
    context.font = '500 22px "Helvetica Neue", Arial, sans-serif';
    context.textAlign = 'right';
    context.fillText(text, width - 8, 28);
  });
}

// A print on paper, pinned at both top corners; the image keeps its own aspect ratio, with an optional credit line.
function addPrint(group, { url, size: [pixelWidth, pixelHeight], width, center: [x, y], credit, pinColors }) {
  const object = new THREE.Group();
  object.name = `print ${url}`;
  object.position.set(x, y, WALL_BOUNDS.backZ + 0.07);
  object.rotation.z = (Math.random() - 0.5) * 0.02;
  group.add(object);
  const height = (width * pixelHeight) / pixelWidth;
  const creditHeight = credit ? 0.55 : 0;
  const texture = new THREE.TextureLoader().load(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  addMesh(object, new THREE.PlaneGeometry(width + 0.5, height + 0.5 + creditHeight), new THREE.MeshStandardMaterial({ color: 0xfbfaf6, roughness: 0.92 }), [0, -creditHeight / 2, 0]).castShadow = false;
  addMesh(object, new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 }), [0, 0, 0.01]).castShadow = false;
  if (credit) {
    addMesh(object, new THREE.PlaneGeometry(width, creditHeight * 0.8), new THREE.MeshStandardMaterial({ map: createCreditTexture(credit), roughness: 0.9 }), [0, -height / 2 - creditHeight / 2, 0.01]).castShadow = false;
  }
  const pins = [-1, 1].map((side) =>
    colorize(
      merge([
        place(new THREE.SphereGeometry(0.32, 12, 8), [side * (width / 2 - 0.1), height / 2 - 0.05, 0.38]),
        place(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6), [side * (width / 2 - 0.1), height / 2 - 0.05, 0.12], [Math.PI / 2, 0, 0]),
      ]),
      pinColors[side < 0 ? 0 : 1],
    ),
  );
  staticMesh(object, pins, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35 }));
  return object;
}

const PRINTS = [
  { key: 'cloud', url: './assets/the-cloud.png', size: [740, 236], width: 11, center: [32, 11.2], pinColors: [0xe85a71, 0x4fa3e0] },
  {
    key: 'tar',
    url: './assets/xkcd-1168.png',
    size: [713, 229],
    width: 11,
    center: [32, 6.3],
    credit: 'xkcd.com/1168 \u00b7 CC BY-NC 2.5',
    link: 'https://xkcd.com/1168/',
    pinColors: [0x6cc48a, 0xf2c14e],
  },
  {
    key: 'realProgrammers',
    url: './assets/xkcd-378.png',
    size: [740, 406],
    width: 9.5,
    center: [-32.5, 9.4],
    credit: 'xkcd.com/378 \u00b7 CC BY-NC 2.5',
    link: 'https://xkcd.com/378/',
    pinColors: [0x4fa3e0, 0xe85a71],
  },
];

// A duplex receptacle low on the partition behind the power strip; the strip's cord plugs into its upper socket.
function addWallOutlet(group) {
  const outlet = new THREE.Group();
  outlet.name = 'wall outlet';
  outlet.position.set(17, 4.5, WALL_BOUNDS.backZ + 0.12);
  group.add(outlet);
  addMesh(outlet, new RoundedBoxGeometry(2.6, 4.2, 0.24, 2, 0.08), plastic(0xefe9da, 0.45));
  const faces = [0.9, -0.9].map((y) => place(new RoundedBoxGeometry(1.6, 1.3, 0.2, 2, 0.25), [0, y, 0.18]));
  addMesh(outlet, merge(faces), plastic(0xf6f1e4, 0.4));
  const slots = [0.9, -0.9].flatMap((y) => [
    place(new THREE.BoxGeometry(0.12, 0.45, 0.05), [-0.3, y + 0.15, 0.29]),
    place(new THREE.BoxGeometry(0.12, 0.45, 0.05), [0.3, y + 0.15, 0.29]),
    place(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 10), [0, y - 0.32, 0.29], [Math.PI / 2, 0, 0]),
  ]);
  addMesh(outlet, merge(slots), plastic(0x161616, 0.8));
  return createAnchor(outlet, [0, 0.9, 0.45], 'wall outlet socket');
}

export function createCubicle(scene, physics) {
  const group = new THREE.Group();
  group.name = 'cubicle';
  scene.add(group);
  const overheadLights = addLights(scene);

  const fabric = new THREE.MeshStandardMaterial({ map: createFabricTexture(), roughness: 0.95 });
  const aluminium = metal(0xc9ccd1, 0.35);
  const raceway = plastic(0x7d8292, 0.7);
  const laminate = plastic(0xdcd7cd, 0.6);
  const steelGrey = metal(0xb4b6bd, 0.5);

  const panelHeight = WALL_BOUNDS.top - FLOOR_Y;
  const panelCenterY = (WALL_BOUNDS.top + FLOOR_Y) / 2;
  const backCenterZ = WALL_BOUNDS.backZ - PANEL_THICKNESS / 2;
  const sideLength = PANEL_FRONT_Z - WALL_BOUNDS.backZ;
  const sideCenterZ = (PANEL_FRONT_Z + WALL_BOUNDS.backZ) / 2;
  const backWidth = (WALL_BOUNDS.sideX + PANEL_THICKNESS) * 2;
  const fabricPieces = [place(new THREE.BoxGeometry(backWidth, panelHeight - 4, PANEL_THICKNESS), [0, panelCenterY + 1.5, backCenterZ])];
  const trimPieces = [
    place(new RoundedBoxGeometry(backWidth + 0.4, 0.9, PANEL_THICKNESS + 0.4, 2, 0.3), [0, WALL_BOUNDS.top + 0.45, backCenterZ]),
    place(new THREE.BoxGeometry(WALL_BOUNDS.sideX * 2, 0.4, 0.15), [0, 20, WALL_BOUNDS.backZ + 0.02]),
  ];
  const racewayPieces = [place(new THREE.BoxGeometry(backWidth, 3, PANEL_THICKNESS + 0.3), [0, FLOOR_Y + 1.5, backCenterZ])];
  for (const side of [-1, 1]) {
    const x = side * (WALL_BOUNDS.sideX + PANEL_THICKNESS / 2);
    fabricPieces.push(place(new THREE.BoxGeometry(PANEL_THICKNESS, panelHeight - 4, sideLength), [x, panelCenterY + 1.5, sideCenterZ]));
    trimPieces.push(
      place(new RoundedBoxGeometry(PANEL_THICKNESS + 0.4, 0.9, sideLength + 0.4, 2, 0.3), [x, WALL_BOUNDS.top + 0.45, sideCenterZ]),
      place(new RoundedBoxGeometry(PANEL_THICKNESS + 0.4, panelHeight + 0.9, 0.9, 2, 0.3), [x, panelCenterY + 0.45, PANEL_FRONT_Z + 0.45]),
      place(new THREE.BoxGeometry(0.15, 0.4, sideLength), [side * (WALL_BOUNDS.sideX - 0.02), 20, sideCenterZ]),
    );
    racewayPieces.push(place(new THREE.BoxGeometry(PANEL_THICKNESS + 0.3, 3, sideLength), [x, FLOOR_Y + 1.5, sideCenterZ]));
    physics.addStaticBox([PANEL_THICKNESS, panelHeight, sideLength], [x, panelCenterY, sideCenterZ]);
  }
  physics.addStaticBox([backWidth, panelHeight, PANEL_THICKNESS], [0, panelCenterY, backCenterZ]);

  // Neighbouring cubicle rows so the view over the partitions reads as an open office.
  for (const z of [-75, -125]) {
    for (let x = -140; x <= 140; x += 48) {
      fabricPieces.push(place(new THREE.BoxGeometry(46, panelHeight, PANEL_THICKNESS), [x, panelCenterY, z]));
      trimPieces.push(place(new THREE.BoxGeometry(46.4, 0.9, PANEL_THICKNESS + 0.4), [x, WALL_BOUNDS.top + 0.45, z]));
    }
  }
  for (const x of [-100, 100]) fabricPieces.push(place(new THREE.BoxGeometry(PANEL_THICKNESS, panelHeight, 90), [x, panelCenterY, -10]));
  staticMesh(group, fabricPieces.map((geometry) => worldUv(geometry, 14)), fabric);
  staticMesh(group, trimPieces, aluminium);
  staticMesh(group, racewayPieces, raceway);

  const desk = addMesh(
    group,
    new RoundedBoxGeometry(DESK_BOUNDS.maxX - DESK_BOUNDS.minX, 2, DESK_BOUNDS.maxZ - DESK_BOUNDS.minZ, 3, 0.3),
    new THREE.MeshStandardMaterial({ map: createWoodTexture(), roughness: 0.42 }),
    [0, -1, (DESK_BOUNDS.minZ + DESK_BOUNDS.maxZ) / 2],
  );
  desk.castShadow = false;
  physics.addStaticBox([DESK_BOUNDS.maxX - DESK_BOUNDS.minX, 2, DESK_BOUNDS.maxZ - DESK_BOUNDS.minZ], [0, -1, (DESK_BOUNDS.minZ + DESK_BOUNDS.maxZ) / 2]);

  const bracketShape = new THREE.Shape();
  bracketShape.moveTo(0, 0);
  bracketShape.lineTo(18, 0);
  bracketShape.lineTo(0, -10);
  bracketShape.closePath();
  const bracket = new THREE.ExtrudeGeometry(bracketShape, { depth: 0.6, bevelEnabled: false });
  const underDesk = [
    place(bracket, [-30, -2, WALL_BOUNDS.backZ], [0, -Math.PI / 2, 0]),
    place(bracket, [10, -2, WALL_BOUNDS.backZ], [0, -Math.PI / 2, 0]),
    ...Array.from({ length: 13 }, (_, index) => place(new THREE.BoxGeometry(0.15, 0.15, 5), [-30 + index * 5, -6, -17.5])),
    place(new THREE.BoxGeometry(60, 0.15, 0.15), [0, -6, -15]),
    place(new THREE.BoxGeometry(60, 0.15, 0.15), [0, -6, -20]),
    place(new THREE.BoxGeometry(60, 0.15, 0.15), [0, -3.6, -15]),
    ...Array.from({ length: 13 }, (_, index) => place(new THREE.BoxGeometry(0.15, 2.4, 0.15), [-30 + index * 5, -4.8, -15])),
  ];
  staticMesh(group, underDesk, steelGrey);

  const drawers = [
    [-7.5, 8.6],
    [-17, 8.6],
    [-29, 13],
  ];
  staticMesh(
    group,
    [place(new THREE.BoxGeometry(17, 33.6, 23), [36, FLOOR_Y + 16.8, 14]), ...drawers.map(([y, height]) => place(new RoundedBoxGeometry(16.4, height, 0.6, 2, 0.2), [36, y, 25.8]))],
    plastic(0xc8cbd6, 0.5),
  );
  staticMesh(
    group,
    drawers.map(([y, height]) => place(new RoundedBoxGeometry(5, 0.6, 0.8, 2, 0.25), [36, y + height / 2 - 1.4, 26.4])),
    aluminium,
  );
  physics.addStaticBox([17, 33.6, 23], [36, FLOOR_Y + 16.8, 14]);

  const grommetPosition = new THREE.Vector3(14, 0, -17.5);
  addMesh(group, new THREE.CylinderGeometry(1.4, 1.4, 0.1, 32), plastic(0x2c2b29, 0.6), [grommetPosition.x, 0.05, grommetPosition.z]);
  addMesh(group, new THREE.CylinderGeometry(0.9, 0.9, 0.12, 24), plastic(0x0d0d0c, 0.9), [grommetPosition.x, 0.06, grommetPosition.z]);
  const grommet = createAnchor(group, [grommetPosition.x, 0.05, grommetPosition.z], 'desk grommet');

  const jackPosition = [41, 4, WALL_BOUNDS.backZ + 0.1];
  addMesh(group, new RoundedBoxGeometry(1.8, 2.6, 0.25, 2, 0.08), plastic(0xe8e1cf), jackPosition);
  addMesh(group, new THREE.BoxGeometry(0.6, 0.5, 0.05), plastic(0x161616), [jackPosition[0], jackPosition[1] - 0.4, jackPosition[2] + 0.14]);
  const phoneJack = createAnchor(group, [jackPosition[0], jackPosition[1] - 0.4, jackPosition[2] + 0.3], 'phone jack');

  const binLaminate = laminate;
  const bin = [
    place(new THREE.BoxGeometry(72, 0.6, 14), [0, 44.4, -14]),
    place(new THREE.BoxGeometry(72, 0.6, 14), [0, 31.3, -14]),
    place(new THREE.BoxGeometry(0.6, 13.7, 14), [-35.7, 37.85, -14]),
    place(new THREE.BoxGeometry(0.6, 13.7, 14), [35.7, 37.85, -14]),
    place(new RoundedBoxGeometry(70.6, 10.6, 0.6, 2, 0.25), [0, 38.6, -7.1], [0.06, 0, 0]),
    place(new THREE.BoxGeometry(50, 0.9, 2.4), [0, 30.55, -9]),
  ];
  staticMesh(group, bin, binLaminate);
  addMesh(group, new RoundedBoxGeometry(30, 0.5, 0.7, 2, 0.2), aluminium, [0, 33.6, -6.6]);
  const diffuser = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4e4, emissiveIntensity: 1.6 });
  addMesh(group, new THREE.BoxGeometry(48, 0.1, 1.8), diffuser, [0, 30.06, -9]).castShadow = false;
  physics.addStaticBox([72, 14, 14], [0, 37.85, -14]);

  createPinnedPapers(group);
  const prints = PRINTS.map((print) => ({ ...print, object: addPrint(group, print) }));
  const wallOutlet = addWallOutlet(group);

  const carpet = createCarpetTexture();
  carpet.repeat.set(40, 40);
  const floor = addMesh(group, new THREE.PlaneGeometry(320, 320), new THREE.MeshStandardMaterial({ map: carpet, roughness: 1 }), [0, FLOOR_Y, 0], [-Math.PI / 2, 0, 0]);
  floor.castShadow = false;
  physics.addStaticPlane(FLOOR_Y);

  const ceilingTexture = createCeilingTexture();
  ceilingTexture.repeat.set(26, 26);
  addMesh(group, new THREE.PlaneGeometry(320, 320), new THREE.MeshStandardMaterial({ map: ceilingTexture, roughness: 1 }), [0, 82, 0], [Math.PI / 2, 0, 0]).castShadow = false;
  const troffer = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf3f7ff, emissiveIntensity: 1.4 });
  const troffers = [];
  for (let x = -96; x <= 96; x += 48) for (let z = -96; z <= 96; z += 48) troffers.push(place(new THREE.BoxGeometry(12, 0.4, 24), [x, 81.8, z]));
  staticMesh(group, troffers, troffer, { castShadow: false });
  addMesh(group, new THREE.BoxGeometry(320, 120, 320), new THREE.MeshStandardMaterial({ color: 0xe9e5ee, roughness: 1, side: THREE.BackSide }), [0, 23, 0]).castShadow = false;

  return {
    group,
    grommet,
    phoneJack,
    wallOutlet,
    prints,
    desk,
    // Everything the overhead switch controls, with each item's full brightness.
    overhead: {
      lights: overheadLights.map((light) => ({ light, full: light.intensity })),
      emissives: [diffuser, troffer].map((material) => ({ material, full: material.emissiveIntensity })),
    },
  };
}
