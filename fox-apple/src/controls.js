import * as THREE from 'three';

const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

export function createCameraRig(camera, domElement) {
  const target = new THREE.Vector3(-0.9, 0.85, 0);
  const pointers = new Map();

  let theta = 1.02;
  let phi = 1.14;
  let radius = 8.2;
  let userRadius = false;
  let idle = 0;
  let pinchStart = 0;
  let pinchRadius = 0;

  const fitRadius = () => (domElement.clientWidth / domElement.clientHeight < 0.85 ? 9.6 : 8.2);
  radius = fitRadius();

  domElement.style.touchAction = 'none';

  function spread() {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  domElement.addEventListener('pointerdown', (event) => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    domElement.setPointerCapture(event.pointerId);
    idle = 0;
    if (pointers.size === 2) {
      pinchStart = spread();
      pinchRadius = radius;
    }
  });

  domElement.addEventListener('pointermove', (event) => {
    const point = pointers.get(event.pointerId);
    if (!point) return;
    idle = 0;

    if (pointers.size >= 2) {
      point.x = event.clientX;
      point.y = event.clientY;
      if (pinchStart > 0) {
        radius = clamp((pinchRadius * pinchStart) / Math.max(1, spread()), 5, 14);
        userRadius = true;
      }
      return;
    }

    const dx = event.clientX - point.x;
    const dy = event.clientY - point.y;
    point.x = event.clientX;
    point.y = event.clientY;
    theta -= dx * 0.006;
    phi = clamp(phi - dy * 0.005, 0.62, 1.42);
  });

  function release(event) {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchStart = 0;
  }
  domElement.addEventListener('pointerup', release);
  domElement.addEventListener('pointercancel', release);

  domElement.addEventListener('wheel', (event) => {
    event.preventDefault();
    radius = clamp(radius + event.deltaY * 0.0016, 5, 14);
    userRadius = true;
    idle = 0;
  }, { passive: false });

  function update(dt) {
    idle += dt;
    if (idle > 2.5 && pointers.size === 0) theta += dt * 0.07;

    const sinPhi = Math.sin(phi);
    camera.position.set(
      target.x + radius * sinPhi * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * sinPhi * Math.cos(theta)
    );
    camera.lookAt(target);
  }

  function resize() {
    if (!userRadius) radius = fitRadius();
  }

  update(0);

  return { update, resize };
}
