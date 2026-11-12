import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { addMesh, canvasTexture, createPart, metal, plastic } from './geometry.js';

export const RELEASES = [
  { title: 'LIVE @ S1', url: 'https://ccqqcc.bandcamp.com/track/live-s1', color: 0x8ec5ef },
  { title: 'SUSTAIN', url: 'https://ccqqcc.bandcamp.com/track/sustain', color: 0xf4a7c3 },
  { title: 'BACKHAND/FRONTHAND SPLIT', url: 'https://ccqqcc.bandcamp.com/album/backhand-fronthand-split', color: 0x3a3a3f },
];
const DISK = { width: 4.4, thickness: 0.16, depth: 4.6 };
// Drive-local poses: the slot face sits at z 10.31; a seated disk leaves 0.3 of its front edge showing.
const SEATED = new THREE.Vector3(0, 0.1, 10.6 - DISK.depth / 2);
const ENTRY = new THREE.Vector3(0, 0.1, 10.6 + DISK.depth / 2 + 0.6);
// Like a real 3.5" drive, eject pops the disk part of the way out; it stays in the slot until taken.
const EJECTED = new THREE.Vector3(0, 0.1, 10.6 + 2.4 - DISK.depth / 2);
const INSERT_SECONDS = 0.55;
const EJECT_SECONDS = 0.2;
const REMOVE_SECONDS = 0.5;
const SNAP_DISTANCE = 4.5;

function createLabelTexture(title) {
  return canvasTexture(320, 208, (context, width, height) => {
    context.fillStyle = '#fbfaf4';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#e46a7e';
    context.fillRect(0, 0, width, 22);
    context.fillStyle = '#c9cbd6';
    for (let y = 92; y < height; y += 26) context.fillRect(14, y, width - 28, 2);
    context.fillStyle = '#1f2440';
    context.font = '700 30px "Helvetica Neue", Arial, sans-serif';
    context.fillText('CQC', 16, 62);
    const words = title.split('/');
    let size = 30;
    context.font = `700 ${size}px "Marker Felt", "Comic Sans MS", cursive`;
    while (words.some((word) => context.measureText(word).width > width - 32) && size > 14) {
      size -= 2;
      context.font = `700 ${size}px "Marker Felt", "Comic Sans MS", cursive`;
    }
    words.forEach((word, index) => context.fillText(index < words.length - 1 ? `${word}/` : word, 16, 112 + index * (size + 8)));
  });
}

export function createFloppies() {
  const shutter = metal(0xcfd2d6, 0.3);
  return RELEASES.map((release, index) => {
    const root = new THREE.Group();
    root.name = `floppy ${release.title}`;
    root.position.set(20.6 + index * 0.35, DISK.thickness / 2 + index * DISK.thickness * 1.1, 14 - index * 0.25);
    root.rotation.y = -0.35 + index * 0.18;
    const shell = createPart(root, `${root.name} shell`);
    addMesh(shell, new RoundedBoxGeometry(DISK.width, DISK.thickness, DISK.depth, 2, 0.06), plastic(release.color, 0.5));
    const metalShutter = createPart(root, `${root.name} shutter`, [0.2, 0, -1.55]);
    addMesh(metalShutter, new THREE.BoxGeometry(1.9, DISK.thickness + 0.01, 1.5), shutter);
    const label = createPart(root, `${root.name} label`, [0, DISK.thickness / 2 + 0.006, 0.95], [-Math.PI / 2, 0, 0]);
    addMesh(label, new THREE.PlaneGeometry(3.4, 2.2), new THREE.MeshStandardMaterial({ map: createLabelTexture(release.title), roughness: 0.85 })).castShadow = false;
    return {
      release,
      spec: {
        name: root.name,
        root,
        material: 'plastic',
        parts: [
          { object: shell, mass: 0.025 },
          { object: metalShutter, material: 'metal', mass: 0.004 },
          { object: label, material: 'paper', mass: 0.001 },
        ],
      },
    };
  });
}

// Moves disks between the desk and the system unit's drives. While a disk is in a drive it is out of the
// simulation and parented to the drive part, so it follows the system unit (and the drive if it breaks off).
export function createFloppyDrives({ scene, physics, drives, disks, isComputerOn, onRead, playClunk }) {
  const animations = new Map();
  const driveFor = (assembly) => drives.find((drive) => drive.disk === assembly) ?? null;
  const scratchMatrix = new THREE.Matrix4();
  const scratchPosition = new THREE.Vector3();
  const scratchScale = new THREE.Vector3();

  function drivePose(drive, local, position, quaternion) {
    drive.object.updateWorldMatrix(true, false);
    scratchMatrix.copy(drive.object.matrixWorld).decompose(scratchPosition, quaternion, scratchScale);
    position.copy(local).applyMatrix4(drive.object.matrixWorld);
    return { position, quaternion };
  }

  function insert(assembly, drive = drives.find((candidate) => !candidate.disk)) {
    if (!drive || drive.disk || driveFor(assembly) || assembly.state !== 'intact') return false;
    if (!physics.holdAssembly(assembly)) return false;
    drive.disk = assembly;
    animations.set(assembly, {
      kind: 'insert',
      drive,
      elapsed: 0,
      startPosition: assembly.root.position.clone(),
      startQuaternion: assembly.root.quaternion.clone(),
    });
    playClunk();
    const disk = disks.find((candidate) => candidate.assembly === assembly);
    // Reading starts immediately so window.open stays inside the click that caused it.
    if (isComputerOn()) onRead(drive, disk.release);
    return true;
  }

  function eject(drive) {
    const assembly = drive.disk;
    if (!assembly || drive.ejected || animations.has(assembly)) return false;
    drive.ejected = true;
    animations.set(assembly, { kind: 'eject', drive, elapsed: 0 });
    playClunk();
    return true;
  }

  // Takes a popped-out disk from its drive and puts it back where it started on the desk.
  function remove(assembly) {
    const drive = driveFor(assembly);
    if (!drive?.ejected || animations.has(assembly)) return false;
    scene.attach(assembly.root);
    animations.set(assembly, {
      kind: 'remove',
      drive,
      elapsed: 0,
      startPosition: assembly.root.position.clone(),
      startQuaternion: assembly.root.quaternion.clone(),
    });
    return true;
  }

  return {
    insert,
    eject,
    remove,
    driveFor,
    isEjected: (assembly) => Boolean(driveFor(assembly)?.ejected),
    // Inserts a thrown or dragged disk released close enough to a free slot.
    snapIfNearSlot(assembly) {
      if (assembly.state !== 'intact') return false;
      const position = new THREE.Vector3(assembly.body.position.x, assembly.body.position.y, assembly.body.position.z);
      for (const drive of drives) {
        if (drive.disk) continue;
        const { position: entry } = drivePose(drive, ENTRY, new THREE.Vector3(), new THREE.Quaternion());
        if (entry.distanceTo(position) < SNAP_DISTANCE) return insert(assembly, drive);
      }
      return false;
    },
    // A disk restored by a reset is back on the desk, so its drive is free again.
    forget(assembly) {
      animations.delete(assembly);
      for (const drive of drives) {
        if (drive.disk !== assembly) continue;
        drive.disk = null;
        drive.ejected = false;
      }
    },
    update(delta) {
      const targetPosition = new THREE.Vector3();
      const targetQuaternion = new THREE.Quaternion();
      for (const [assembly, animation] of animations) {
        animation.elapsed += delta;
        const { drive } = animation;
        const root = assembly.root;
        if (animation.kind === 'insert') {
          const t = Math.min(animation.elapsed / INSERT_SECONDS, 1);
          const approach = Math.min(t / 0.6, 1);
          drivePose(drive, ENTRY, targetPosition, targetQuaternion);
          if (t < 0.6) {
            const eased = approach * approach * (3 - 2 * approach);
            root.position.lerpVectors(animation.startPosition, targetPosition, eased);
            root.position.y += Math.sin(eased * Math.PI) * 3;
            root.quaternion.slerpQuaternions(animation.startQuaternion, targetQuaternion, eased);
          } else {
            const slide = (t - 0.6) / 0.4;
            const seated = drivePose(drive, SEATED, new THREE.Vector3(), new THREE.Quaternion()).position;
            root.position.lerpVectors(targetPosition, seated, slide);
            root.quaternion.copy(targetQuaternion);
          }
          if (t >= 1) {
            animations.delete(assembly);
            drive.object.attach(root);
          }
        } else if (animation.kind === 'eject') {
          const t = Math.min(animation.elapsed / EJECT_SECONDS, 1);
          root.position.lerpVectors(SEATED, EJECTED, 1 - (1 - t) ** 3);
          if (t >= 1) animations.delete(assembly);
        } else {
          const t = Math.min(animation.elapsed / REMOVE_SECONDS, 1);
          const eased = t * t * (3 - 2 * t);
          root.position.lerpVectors(animation.startPosition, assembly.restPosition, eased);
          root.position.y += Math.sin(eased * Math.PI) * 4;
          root.quaternion.slerpQuaternions(animation.startQuaternion, assembly.restQuaternion, eased);
          if (t >= 1) {
            animations.delete(assembly);
            drive.disk = null;
            drive.ejected = false;
            physics.releaseAssembly(assembly);
          }
        }
      }
    },
  };
}
