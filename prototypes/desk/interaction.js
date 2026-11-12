import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { toNormalizedDeviceCoordinates } from '../shared/stage.js';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './computer-model.js';

const DRAG_THRESHOLD_PX = 6;
const HOLD_TO_GRAB_MS = 200;
const MULTI_CLICK_WINDOW_MS = 300;
const THROW_SAMPLE_MS = 90;
const MAX_THROW_SPEED = 140;

function isVisible(object) {
  for (let current = object; current; current = current.parent) if (!current.visible) return false;
  return true;
}

function findFixture(object) {
  for (let current = object; current; current = current.parent) if (current.userData.interactive) return current.userData.interactive;
  return null;
}

// Single click interacts (deferred until a second click can no longer arrive), double click punches, triple click
// breaks, press-and-hold or drag grabs and release throws, shift-click resets. Keycaps, fixtures such as plugs and
// switches, and the screen respond immediately.
export function createInteraction({ camera, canvas, physics, blockers, fixtures, screen, keyboard, keyboardAssembly, isLocked, screenAcceptsPointer, getApp, onPointerMove, events }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dragPlane = new THREE.Plane();
  const planeHit = new THREE.Vector3();
  let pending = null;
  let grab = null;
  let holdTimer = null;
  let samples = [];
  let screenPointerActive = false;
  let pressedKey = null;
  let clicks = { assembly: null, count: 0, entry: null, timer: null };

  function castRay(event) {
    raycaster.setFromCamera(toNormalizedDeviceCoordinates(event, pointer), camera);
  }

  function firstHit() {
    const hits = raycaster.intersectObjects([...physics.pickRoots(), ...fixtures(), ...blockers], true);
    return hits.find((hit) => hit.object.isMesh && isVisible(hit.object)) ?? null;
  }

  function screenPoint(hit) {
    return { x: hit.uv.x * SCREEN_WIDTH, y: (1 - hit.uv.y) * SCREEN_HEIGHT };
  }

  function screenHitFromEvent(event) {
    castRay(event);
    const [hit] = raycaster.intersectObject(screen, false);
    return hit ?? null;
  }

  function endScreenPointer(event) {
    if (!screenPointerActive) return;
    const hit = event ? screenHitFromEvent(event) : null;
    if (hit) {
      const { x, y } = screenPoint(hit);
      getApp().handlePointer('up', x, y, { shift: event.shiftKey });
    } else getApp().handlePointer('up');
    screenPointerActive = false;
  }

  function resolveClicks() {
    const { count, entry } = clicks;
    clearTimeout(clicks.timer);
    clicks = { assembly: null, count: 0, entry: null, timer: null };
    if (!entry) return;
    if (count === 1 && !entry.keycap) events.onSingle(entry);
    else if (count === 2 && !entry.keycap && entry.body.world) {
      physics.punch(entry.body, entry.point, entry.direction);
      events.onPunch?.(entry.owner, entry.point);
    }
  }

  function registerClick(entry) {
    const assembly = entry.owner.assembly;
    if (entry.shift && !entry.keycap) {
      resolveClicks();
      physics.resetAssembly(assembly);
      events.onReset?.(assembly);
      return;
    }
    if (clicks.assembly && clicks.assembly !== assembly) resolveClicks();
    clearTimeout(clicks.timer);
    clicks.assembly = assembly;
    clicks.count += 1;
    clicks.entry = entry;
    if (clicks.count >= 3) {
      clicks = { assembly: null, count: 0, entry: null, timer: null };
      if (assembly.state === 'intact' && physics.breakAssembly(assembly)) events.onBreak?.(assembly, entry.point);
      return;
    }
    clicks.timer = setTimeout(resolveClicks, MULTI_CLICK_WINDOW_MS);
  }

  function beginGrab() {
    clearTimeout(holdTimer);
    const { body, localPivot } = pending;
    if (!body.world) {
      pending = null;
      return;
    }
    endScreenPointer(null);
    const pivot = body.pointToWorldFrame(localPivot);
    const anchor = new THREE.Vector3(pivot.x, pivot.y, pivot.z);
    // Some objects drag over their own plane (a pencil writes over a horizontal one); others face the camera.
    const customPlane = events.grabPlane?.(pending);
    if (customPlane) dragPlane.copy(customPlane);
    else dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(), anchor);
    grab = physics.startGrab(body, anchor);
    samples = [{ time: performance.now(), point: anchor.clone() }];
    canvas.style.cursor = 'grabbing';
  }

  function throwVelocity() {
    const now = performance.now();
    const recent = samples.filter((sample) => now - sample.time <= THROW_SAMPLE_MS);
    if (recent.length < 2) return new THREE.Vector3();
    const first = recent[0];
    const last = recent[recent.length - 1];
    const seconds = Math.max((last.time - first.time) / 1000, 1 / 120);
    return last.point.clone().sub(first.point).divideScalar(seconds).clampLength(0, MAX_THROW_SPEED);
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || isLocked()) return;
    castRay(event);
    const hit = firstHit();
    if (!hit) return;
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic or already-released pointers cannot be captured; window listeners still receive the drag.
    }
    const fixture = findFixture(hit.object);
    if (fixture) {
      pending = { fixture, x: event.clientX, y: event.clientY, shift: event.shiftKey };
      return;
    }
    const owner = physics.ownerOf(hit.object);
    if (!owner) return;
    const onScreen = hit.object === screen && screenAcceptsPointer();
    if (onScreen) {
      screenPointerActive = true;
      const { x, y } = screenPoint(hit);
      getApp().handlePointer('down', x, y, { shift: event.shiftKey });
      // A showing screen belongs to the app; punching the monitor means hitting its bezel or case.
      return;
    }
    const code = hit.object.userData.code;
    const keycap = Boolean(code) && owner.assembly === keyboardAssembly && keyboardAssembly.state === 'intact';
    if (keycap) {
      pressedKey = code;
      keyboard.press(code);
      events.onKeycap(code, event.shiftKey);
    }
    const body = physics.bodyFor(owner);
    if (!body) {
      pending = { owner, heldAssembly: owner.assembly, x: event.clientX, y: event.clientY, shift: event.shiftKey, point: hit.point.clone() };
      return;
    }
    pending = {
      owner,
      body,
      keycap,
      point: hit.point.clone(),
      localPivot: body.pointToLocalFrame(new CANNON.Vec3(hit.point.x, hit.point.y, hit.point.z)),
      direction: raycaster.ray.direction.clone(),
      x: event.clientX,
      y: event.clientY,
      shift: event.shiftKey,
    };
    if (!event.shiftKey) {
      events.onPress?.(owner, hit.point);
      // Keys keep their own press-and-hold meaning; everything else picks up after a short hold.
      if (!keycap) holdTimer = setTimeout(() => pending?.body && !grab && beginGrab(), HOLD_TO_GRAB_MS);
    }
  });

  window.addEventListener('pointermove', (event) => {
    onPointerMove(event);
    if (screenPointerActive) {
      const hit = screenHitFromEvent(event);
      if (hit) {
        const { x, y } = screenPoint(hit);
        getApp().handlePointer('move', x, y, { shift: event.shiftKey });
      }
      if (!pending) return;
    }
    if (pending?.body && !grab && !pending.shift && Math.hypot(event.clientX - pending.x, event.clientY - pending.y) > DRAG_THRESHOLD_PX) beginGrab();
    if (!grab) return;
    if (!grab.active) {
      grab = null;
      canvas.style.cursor = '';
      return;
    }
    castRay(event);
    if (!raycaster.ray.intersectPlane(dragPlane, planeHit)) return;
    grab.move(planeHit);
    events.onDrag?.(pending?.owner, planeHit);
    samples.push({ time: performance.now(), point: planeHit.clone() });
    if (samples.length > 24) samples.shift();
  });

  function finishPointer(event, cancelled) {
    clearTimeout(holdTimer);
    endScreenPointer(cancelled ? null : event);
    if (pressedKey) keyboard.release(pressedKey);
    pressedKey = null;
    const entry = pending;
    pending = null;
    if (!entry) return;
    if (entry.owner) events.onRelease?.(entry.owner);
    if (grab) {
      const velocity = cancelled ? null : throwVelocity();
      if (grab.active) grab.release(velocity);
      grab = null;
      canvas.style.cursor = '';
      if (!cancelled) events.onThrow?.(entry);
      return;
    }
    if (cancelled) return;
    if (entry.fixture) {
      entry.fixture({ shift: entry.shift });
      return;
    }
    if (entry.heldAssembly) {
      if (entry.shift) {
        physics.resetAssembly(entry.heldAssembly);
        events.onReset?.(entry.heldAssembly);
      } else events.onSingle(entry);
      return;
    }
    registerClick(entry);
  }
  window.addEventListener('pointerup', (event) => finishPointer(event, false));
  window.addEventListener('pointercancel', (event) => finishPointer(event, true));

  window.addEventListener(
    'wheel',
    (event) => {
      const hit = screenHitFromEvent(event);
      if (!hit) return;
      event.preventDefault();
      if (isLocked()) return;
      const app = getApp();
      if (!screenAcceptsPointer() || typeof app.handleWheel !== 'function') return;
      const { x, y } = screenPoint(hit);
      app.handleWheel(x, y, event.deltaY);
    },
    { passive: false },
  );
}
