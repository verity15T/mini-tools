import * as THREE from 'three';
import { createWorld } from './scene.js';
import { createFox } from './fox.js';
import { createApple } from './apple.js';
import { createAnimation } from './animation.js';
import { createCameraRig } from './controls.js';

const stage = document.getElementById('stage');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#e2f3ff', 15, 30);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 90);

const world = createWorld();
scene.add(world.group);

const fox = createFox();
scene.add(fox.root);

const apple = createApple();
scene.add(apple.group);

const anim = createAnimation(fox, apple);
const rig = createCameraRig(camera, renderer.domElement);

const pauseButton = document.getElementById('btn-pause');
const replayButton = document.getElementById('btn-replay');
const rateButton = document.getElementById('btn-rate');

const RATES = [0.5, 1, 1.5];
let rateIndex = 1;
let paused = false;

pauseButton.addEventListener('click', () => {
  paused = !paused;
  pauseButton.textContent = paused ? '继续' : '暂停';
});

replayButton.addEventListener('click', () => {
  anim.reset();
  paused = false;
  pauseButton.textContent = '暂停';
});

rateButton.addEventListener('click', () => {
  rateIndex = (rateIndex + 1) % RATES.length;
  rateButton.textContent = `${RATES[rateIndex].toFixed(1)}×`;
});

const clock = new THREE.Clock();

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!paused) anim.update(dt * RATES[rateIndex]);
  rig.update(dt);

  world.clouds.forEach((cloud, index) => {
    cloud.position.x += dt * (0.12 + index * 0.03);
    if (cloud.position.x > 15) cloud.position.x = -15;
  });

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  rig.resize();
});
