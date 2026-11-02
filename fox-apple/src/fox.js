import * as THREE from 'three';

const COLORS = {
  fur: '#e8743b',
  furDark: '#cd5b26',
  cream: '#fdf2e4',
  dark: '#3b2a22',
  innerEar: '#f6a988',
  tongue: '#ef8798',
  paw: '#5c3a28',
};

const materials = new Map();
function mat(color) {
  if (!materials.has(color)) {
    materials.set(color, new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.86 }));
  }
  return materials.get(color);
}

function box(w, h, d, color) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createFox() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = 1.0;
  root.add(body);

  const torso = box(1.32, 0.72, 0.78, COLORS.fur);
  body.add(torso);

  const chest = box(0.56, 0.66, 0.7, COLORS.cream);
  chest.position.set(0.44, -0.04, 0);
  body.add(chest);

  const hip = box(0.54, 0.68, 0.74, COLORS.furDark);
  hip.position.set(-0.52, -0.01, 0);
  body.add(hip);

  const headPivot = new THREE.Group();
  headPivot.position.set(0.74, 0.3, 0);
  body.add(headPivot);

  const head = box(0.62, 0.56, 0.6, COLORS.fur);
  head.position.set(0.04, 0.05, 0);
  headPivot.add(head);

  const cheekLeft = box(0.2, 0.22, 0.06, COLORS.cream);
  cheekLeft.position.set(0.24, -0.14, 0.285);
  cheekLeft.rotation.y = 0.3;
  headPivot.add(cheekLeft);

  const cheekRight = cheekLeft.clone();
  cheekRight.position.z = -0.285;
  cheekRight.rotation.y = -0.3;
  headPivot.add(cheekRight);

  const muzzle = box(0.36, 0.2, 0.26, COLORS.cream);
  muzzle.position.set(0.39, -0.07, 0);
  headPivot.add(muzzle);

  const nose = box(0.09, 0.07, 0.12, COLORS.dark);
  nose.position.set(0.56, -0.04, 0);
  headPivot.add(nose);

  const jawPivot = new THREE.Group();
  jawPivot.position.set(0.28, -0.2, 0);
  headPivot.add(jawPivot);

  const jaw = box(0.34, 0.09, 0.26, COLORS.cream);
  jaw.position.set(0.1, -0.02, 0);
  jawPivot.add(jaw);

  const tongue = box(0.17, 0.04, 0.15, COLORS.tongue);
  tongue.position.set(0.13, 0.03, 0);
  tongue.scale.set(0.001, 0.001, 0.001);
  jawPivot.add(tongue);

  const eyes = [];
  for (const side of [1, -1]) {
    const eye = box(0.09, 0.15, 0.09, COLORS.dark);
    eye.position.set(0.31, 0.14, 0.235 * side);
    headPivot.add(eye);
    eyes.push(eye);

    const glint = box(0.04, 0.045, 0.04, '#ffffff');
    glint.position.set(0.35, 0.18, 0.255 * side);
    headPivot.add(glint);
  }

  const ears = [];
  for (const side of [1, -1]) {
    const ear = new THREE.Group();
    ear.position.set(-0.06, 0.36, 0.19 * side);
    ear.rotation.z = 0.12;
    ear.rotation.x = -0.22 * side;

    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 4), mat(COLORS.fur));
    outer.castShadow = true;
    ear.add(outer);

    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 4), mat(COLORS.innerEar));
    inner.position.set(0.02, -0.01, 0.04 * side);
    ear.add(inner);

    headPivot.add(ear);
    ears.push(ear);
  }

  const tailPivot = new THREE.Group();
  tailPivot.position.set(-0.66, 0.14, 0);
  body.add(tailPivot);

  const tailSegments = [
    [0.44, 0.34, 0.34, -0.16, 0.02, 0, COLORS.fur, 0.26],
    [0.42, 0.32, 0.32, -0.44, 0.18, 0, COLORS.fur, 0.4],
    [0.32, 0.29, 0.29, -0.68, 0.35, 0, COLORS.cream, 0.48],
  ];
  for (const [w, h, d, x, y, z, color, tilt] of tailSegments) {
    const segment = box(w, h, d, color);
    segment.position.set(x, y, z);
    segment.rotation.z = tilt;
    tailPivot.add(segment);
  }

  const legs = [];
  const legSpots = [
    [0.42, 0.26],
    [0.42, -0.26],
    [-0.44, 0.26],
    [-0.44, -0.26],
  ];
  for (const [x, z] of legSpots) {
    const pivot = new THREE.Group();
    pivot.position.set(x, -0.32, z);

    const leg = box(0.17, 0.62, 0.17, COLORS.fur);
    leg.position.y = -0.29;
    pivot.add(leg);

    const paw = box(0.19, 0.12, 0.2, COLORS.paw);
    paw.position.set(0.015, -0.64, 0);
    pivot.add(paw);

    body.add(pivot);
    legs.push(pivot);
  }

  return { root, body, headPivot, jawPivot, tongue, eyes, ears, tailPivot, legs };
}
