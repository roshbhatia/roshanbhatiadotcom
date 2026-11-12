import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const finishShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    grain: { value: 0.025 },
    haze: { value: 0.22 },
    hazeColor: { value: new THREE.Color(0.94, 0.98, 1.0) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float grain;
    uniform float haze;
    uniform vec3 hazeColor;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453); }
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float edge = smoothstep(0.35, 0.95, distance(vUv, vec2(0.5)));
      color.rgb = mix(color.rgb, hazeColor, edge * haze);
      color.rgb += (hash(vUv * 1000.0) - 0.5) * grain;
      gl_FragColor = color;
    }`,
};

export function createGradientTexture(stops) {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  stops.forEach((color, index) => gradient.addColorStop(index / (stops.length - 1), color));
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createStage({
  camera,
  background = ['#9fd6ff', '#dff2ff', '#ffffff'],
  bloom = {},
  exposure = 1,
  haze = 0.22,
  hazeColor = [0.94, 0.98, 1.0],
  environmentIntensity = 1,
} = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = exposure;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = createGradientTexture(background);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = environmentIntensity;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(
    new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      bloom.strength ?? 0.4,
      bloom.radius ?? 0.7,
      bloom.threshold ?? 1.0,
    ),
  );
  composer.addPass(new OutputPass());
  const finishPass = new ShaderPass(finishShader);
  finishPass.uniforms.haze.value = haze;
  finishPass.uniforms.hazeColor.value.setRGB(...hazeColor);
  composer.addPass(finishPass);

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  return {
    renderer,
    scene,
    render(seconds) {
      finishPass.uniforms.time.value = seconds % 100;
      composer.render();
    },
  };
}

export function toNormalizedDeviceCoordinates(event, target = new THREE.Vector2()) {
  return target.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
}

export function glossyPlastic(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    ...options,
  });
}

export function createClock() {
  let previous = performance.now();
  return () => {
    const now = performance.now();
    const delta = Math.min((now - previous) / 1000, 1 / 30);
    previous = now;
    return { delta, seconds: now / 1000 };
  };
}
