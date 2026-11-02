import * as THREE from 'three';

const GRASS = '#a7cf87';
const SOIL = '#bd8f63';

function makeSky() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color('#79c2ea') },
      bottomColor: { value: new THREE.Color('#eef9ff') },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vPos;
      void main() {
        float h = clamp(normalize(vPos).y * 1.7 + 0.16, 0.0, 1.0);
        gl_FragColor = vec4(mix(bottomColor, topColor, h), 1.0);
      }
    `,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(36, 24, 16), material);
}

function makeTree(height) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14 * height, 0.2 * height, 2.6 * height, 6),
    new THREE.MeshStandardMaterial({ color: '#8b5a3c', flatShading: true })
  );
  trunk.position.y = 1.3 * height;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const leafMaterial = new THREE.MeshStandardMaterial({ color: '#6bae5b', flatShading: true });
  const lightLeafMaterial = new THREE.MeshStandardMaterial({ color: '#83c46b', flatShading: true });
  const layers = [
    { r: 1.02, y: 2.72, m: leafMaterial },
    { r: 0.82, y: 3.48, m: lightLeafMaterial },
    { r: 0.58, y: 4.14, m: leafMaterial },
  ];
  for (const layer of layers) {
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(layer.r * height, 0), layer.m);
    crown.position.y = layer.y * height;
    crown.rotation.y = Math.random() * Math.PI;
    crown.castShadow = true;
    crown.receiveShadow = true;
    tree.add(crown);
  }
  return tree;
}

function makeCloud() {
  const cloud = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 1 });
  const puffs = [
    [0, 0, 0, 0.95],
    [0.95, -0.16, 0.1, 0.68],
    [-0.92, -0.12, -0.08, 0.72],
    [0.34, 0.35, -0.2, 0.6],
  ];
  for (const [x, y, z, r] of puffs) {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), material);
    puff.position.set(x, y, z);
    cloud.add(puff);
  }
  return cloud;
}

function makeTufts(count) {
  const tuftMaterial = new THREE.MeshStandardMaterial({ color: '#97c274', flatShading: true });
  const tufts = new THREE.Group();
  for (let i = 0; i < count; i += 1) {
    const h = 0.1 + Math.random() * 0.07;
    const clump = new THREE.Group();
    for (let j = 0; j < 3; j += 1) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.09, h, 4), tuftMaterial);
      blade.position.set((Math.random() - 0.5) * 0.16, h / 2, (Math.random() - 0.5) * 0.16);
      blade.rotation.z = (Math.random() - 0.5) * 0.35;
      blade.castShadow = true;
      clump.add(blade);
    }
    const angle = Math.random() * Math.PI * 2;
    const radius = 2.4 + Math.random() * 8.6;
    clump.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius * 0.9 - 0.6);
    clump.rotation.y = Math.random() * Math.PI;
    tufts.add(clump);
  }
  return tufts;
}

export function createWorld() {
  const group = new THREE.Group();
  group.add(makeSky());

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(13, 48),
    new THREE.MeshStandardMaterial({ color: GRASS, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(13, 12.2, 0.9, 48),
    new THREE.MeshStandardMaterial({ color: SOIL, roughness: 1, flatShading: true })
  );
  soil.position.y = -0.46;
  soil.receiveShadow = true;
  group.add(soil);

  group.add(makeTufts(26));

  const trees = [
    [-4.9, -3.2, 1.0],
    [4.4, -2.4, 0.86],
    [-3.0, -5.6, 0.72],
    [3.9, -5.9, 1.08],
    [-6.4, -0.4, 0.62],
  ];
  for (const [x, z, h] of trees) {
    const tree = makeTree(h);
    tree.position.set(x, 0, z);
    group.add(tree);
  }

  const clouds = [];
  const cloudSpots = [
    [-4.4, 5.8, -9.5, 1.0],
    [3.2, 6.6, -11.5, 0.82],
    [-0.6, 7.4, -13.5, 1.15],
  ];
  for (const [x, y, z, s] of cloudSpots) {
    const cloud = makeCloud();
    cloud.position.set(x, y, z);
    cloud.scale.setScalar(s);
    group.add(cloud);
    clouds.push(cloud);
  }

  const hemi = new THREE.HemisphereLight('#dff1ff', '#8d9c69', 1.55);
  group.add(hemi);

  const sun = new THREE.DirectionalLight('#fff1d6', 2.1);
  sun.position.set(5.5, 9, 4.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -7;
  sun.shadow.camera.right = 7;
  sun.shadow.camera.top = 7;
  sun.shadow.camera.bottom = -7;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 26;
  sun.shadow.bias = -0.0007;
  group.add(sun);

  const fill = new THREE.DirectionalLight('#cfe3ff', 0.42);
  fill.position.set(-6, 4, -5);
  group.add(fill);

  return { group, sun, clouds };
}
