import * as THREE from 'three';

const FLESH = '#f7d9a8';
const STEM = '#6b4a2f';
const LEAF = '#6fae5a';
const CORE = '#f2e3c9';

export function createApple() {
  const group = new THREE.Group();
  group.position.set(0.62, 0, 0);

  const stump = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.4, 0.32, 9),
    new THREE.MeshStandardMaterial({ color: '#a9794f', flatShading: true, roughness: 1 })
  );
  stump.position.y = 0.16;
  stump.castShadow = true;
  stump.receiveShadow = true;
  group.add(stump);

  const rings = new THREE.Mesh(
    new THREE.CircleGeometry(0.34, 9),
    new THREE.MeshStandardMaterial({ color: '#c99c6d', flatShading: true, roughness: 1 })
  );
  rings.rotation.x = -Math.PI / 2;
  rings.position.y = 0.321;
  rings.receiveShadow = true;
  group.add(rings);

  const apple = new THREE.Group();
  apple.position.y = 0.62;
  group.add(apple);

  const bodyGeometry = new THREE.SphereGeometry(0.3, 12, 10);
  const positions = bodyGeometry.attributes.position;
  const tints = [];
  const top = new THREE.Color('#ef5a4f');
  const bottom = new THREE.Color('#bb332d');
  for (let i = 0; i < positions.count; i += 1) {
    const t = THREE.MathUtils.clamp((positions.getY(i) / 0.3 + 1) / 2, 0, 1);
    const c = bottom.clone().lerp(top, t);
    tints.push(c.r, c.g, c.b);
  }
  bodyGeometry.setAttribute('color', new THREE.Float32BufferAttribute(tints, 3));

  const body = new THREE.Mesh(bodyGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.62 }));
  body.scale.set(1, 0.94, 1);
  body.castShadow = true;
  body.receiveShadow = true;
  apple.add(body);

  const basePositions = Float32Array.from(positions.array);
  const biteDir = new THREE.Vector3(-1, 0.45, 0).normalize();

  function carve(amount) {
    for (let i = 0; i < positions.count; i += 1) {
      const x = basePositions[i * 3];
      const y = basePositions[i * 3 + 1];
      const z = basePositions[i * 3 + 2];
      const len = Math.hypot(x, y, z) || 1;
      const facing = (x * biteDir.x + y * biteDir.y + z * biteDir.z) / len;
      const k = Math.max(0, (facing - 0.72) / 0.28);
      const shrink = 1 - amount * 0.45 * k * k;
      positions.setXYZ(i, x * shrink, y * shrink, z * shrink);
    }
    positions.needsUpdate = true;
    bodyGeometry.computeVertexNormals();
  }

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.026, 0.13, 5),
    new THREE.MeshStandardMaterial({ color: STEM, flatShading: true, roughness: 1 })
  );
  stem.position.set(0.02, 0.32, 0);
  stem.rotation.z = -0.22;
  stem.castShadow = true;
  apple.add(stem);

  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), new THREE.MeshStandardMaterial({ color: LEAF, flatShading: true, roughness: 0.9 }));
  leaf.position.set(0.14, 0.36, 0);
  leaf.scale.set(1.25, 0.28, 0.62);
  leaf.rotation.z = -0.5;
  leaf.castShadow = true;
  apple.add(leaf);

  const core = new THREE.Group();
  core.position.y = 0.42;
  core.visible = false;
  const coreBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.06, 0.2, 7),
    new THREE.MeshStandardMaterial({ color: CORE, flatShading: true, roughness: 1 })
  );
  coreBody.castShadow = true;
  core.add(coreBody);
  const coreStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.02, 0.1, 5),
    new THREE.MeshStandardMaterial({ color: STEM, flatShading: true, roughness: 1 })
  );
  coreStem.position.y = 0.14;
  coreStem.rotation.z = 0.2;
  core.add(coreStem);
  for (const z of [0.04, -0.04]) {
    const seed = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 5, 4),
      new THREE.MeshStandardMaterial({ color: '#4a3120', flatShading: true })
    );
    seed.position.set(0.06, 0.05, z);
    seed.scale.set(0.6, 1.3, 0.8);
    core.add(seed);
  }
  group.add(core);

  const crumbGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.06);
  const crumbs = [];
  for (let i = 0; i < 16; i += 1) {
    const piece = new THREE.Mesh(
      crumbGeometry,
      new THREE.MeshStandardMaterial({ color: FLESH, flatShading: true, transparent: true, opacity: 1 })
    );
    piece.castShadow = true;
    piece.visible = false;
    group.add(piece);
    crumbs.push({ mesh: piece, velocity: new THREE.Vector3(), life: 0, maxLife: 1 });
  }

  function setBite(level) {
    if (level <= 0) {
      apple.visible = true;
      apple.scale.set(1, 1, 1);
      apple.position.y = 0.62;
      apple.rotation.z = 0;
      body.scale.set(1, 0.94, 1);
      carve(0);
      core.visible = false;
    } else if (level === 1) {
      apple.visible = true;
      apple.scale.set(0.8, 0.82, 0.8);
      apple.position.y = 0.565;
      apple.rotation.z = -0.12;
      body.scale.set(0.92, 0.86, 0.92);
      carve(1);
      core.visible = false;
    } else {
      apple.visible = false;
      core.visible = true;
    }
  }

  function burst() {
    for (const crumb of crumbs) {
      crumb.mesh.position.set(0.1 + Math.random() * 0.3, 0.72 + Math.random() * 0.2, -0.16 + Math.random() * 0.32);
      crumb.velocity.set(-0.4 - Math.random() * 1.2, 1.4 + Math.random() * 1.6, -1 + Math.random() * 2);
      crumb.life = 0.45 + Math.random() * 0.35;
      crumb.maxLife = crumb.life;
      crumb.mesh.material.opacity = 1;
      crumb.mesh.scale.setScalar(0.7 + Math.random() * 0.8);
      crumb.mesh.visible = true;
    }
  }

  function update(dt) {
    for (const crumb of crumbs) {
      if (crumb.life <= 0) continue;
      crumb.life -= dt;
      if (crumb.life <= 0) {
        crumb.mesh.visible = false;
        continue;
      }
      crumb.velocity.y -= 7.5 * dt;
      crumb.mesh.position.addScaledVector(crumb.velocity, dt);
      crumb.mesh.rotation.x += dt * 6;
      crumb.mesh.rotation.z += dt * 4;
      const t = crumb.life / crumb.maxLife;
      crumb.mesh.material.opacity = Math.min(1, t * 1.6);
      crumb.mesh.scale.setScalar(0.35 + 0.75 * t);
      if (crumb.mesh.position.y < 0.03) {
        crumb.mesh.position.y = 0.03;
        crumb.velocity.set(0, 0, 0);
        crumb.life = Math.min(crumb.life, 0.12);
      }
    }
  }

  function reset() {
    setBite(0);
    for (const crumb of crumbs) {
      crumb.life = 0;
      crumb.mesh.visible = false;
      crumb.mesh.material.opacity = 1;
    }
  }

  return { group, setBite, burst, update, reset };
}
