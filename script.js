import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const viewer = document.getElementById("viewer");

const PRESETS = {
  rhino: {
    length: 4.5,
    baseRadius: 0.55,
    tipRadius: 0.03,
    curve: 0.2,
    forward: 0.9,
    twist: 0.0,
    ridges: 10,
    ridgeStrength: 0.08,
    branchCount: 0,
    branchAngle: 0.35,
    branchStart: 0.55,
    color: "#bfa58a"
  },
  devil: {
    length: 4.2,
    baseRadius: 0.35,
    tipRadius: 0.04,
    curve: 1.8,
    forward: 0.4,
    twist: 0.5,
    ridges: 6,
    ridgeStrength: 0.04,
    branchCount: 0,
    branchAngle: 0.4,
    branchStart: 0.55,
    color: "#e9d8c7"
  },
  spiral: {
    length: 5.5,
    baseRadius: 0.42,
    tipRadius: 0.05,
    curve: 0.8,
    forward: 0.2,
    twist: 2.8,
    ridges: 14,
    ridgeStrength: 0.05,
    branchCount: 0,
    branchAngle: 0.55,
    branchStart: 0.5,
    color: "#d4cab8"
  },
  antler: {
    length: 5.8,
    baseRadius: 0.22,
    tipRadius: 0.03,
    curve: 1.2,
    forward: 0.6,
    twist: 0.15,
    ridges: 3,
    ridgeStrength: 0.02,
    branchCount: 3,
    branchAngle: 0.7,
    branchStart: 0.42,
    color: "#8f6b52"
  }
};

const defaultParams = { ...PRESETS.rhino };
const params = { ...defaultParams };

const inputIds = [
  "preset",
  "length",
  "baseRadius",
  "tipRadius",
  "curve",
  "forward",
  "twist",
  "ridges",
  "ridgeStrength",
  "branchCount",
  "branchAngle",
  "branchStart",
  "color"
];

const inputs = Object.fromEntries(
  inputIds.map((id) => [id, document.getElementById(id)])
);

const valueLabels = {
  length: document.getElementById("lengthValue"),
  baseRadius: document.getElementById("baseRadiusValue"),
  tipRadius: document.getElementById("tipRadiusValue"),
  curve: document.getElementById("curveValue"),
  forward: document.getElementById("forwardValue"),
  twist: document.getElementById("twistValue"),
  ridges: document.getElementById("ridgesValue"),
  ridgeStrength: document.getElementById("ridgeStrengthValue"),
  branchCount: document.getElementById("branchCountValue"),
  branchAngle: document.getElementById("branchAngleValue"),
  branchStart: document.getElementById("branchStartValue")
};

// --------------------
// scene
// --------------------
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0e1014, 12, 24);

const camera = new THREE.PerspectiveCamera(
  40,
  viewer.clientWidth / viewer.clientHeight,
  0.1,
  100
);
camera.position.set(5.5, 3.2, 7.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(viewer.clientWidth, viewer.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 3;
controls.maxDistance = 14;
controls.target.set(0, 2.1, 0);
controls.update();

scene.add(new THREE.AmbientLight(0xffffff, 1.3));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(5, 8, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xbecfff, 0.8);
fillLight.position.set(-6, 5, -4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffe2c2, 0.7);
rimLight.position.set(0, 6, -8);
scene.add(rimLight);

// 背景の大きい球
const bgGeo = new THREE.SphereGeometry(40, 32, 32);
const bgMat = new THREE.MeshBasicMaterial({
  color: 0x141923,
  side: THREE.BackSide
});
const bgSphere = new THREE.Mesh(bgGeo, bgMat);
scene.add(bgSphere);

// 床影だけ見せる透明床
const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.ShadowMaterial({ opacity: 0.16 })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -0.01;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

// 柔らかい台
const pedestal = new THREE.Mesh(
  new THREE.CylinderGeometry(1.35, 1.5, 0.22, 48),
  new THREE.MeshStandardMaterial({
    color: 0x1b2130,
    roughness: 0.9,
    metalness: 0.05
  })
);
pedestal.position.y = 0.1;
pedestal.receiveShadow = true;
pedestal.castShadow = false;
scene.add(pedestal);

let hornGroup = new THREE.Group();
scene.add(hornGroup);

// --------------------
// utility
// --------------------
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function updateLabels() {
  valueLabels.length.textContent = Number(params.length).toFixed(1);
  valueLabels.baseRadius.textContent = Number(params.baseRadius).toFixed(2);
  valueLabels.tipRadius.textContent = Number(params.tipRadius).toFixed(2);
  valueLabels.curve.textContent = Number(params.curve).toFixed(2);
  valueLabels.forward.textContent = Number(params.forward).toFixed(2);
  valueLabels.twist.textContent = Number(params.twist).toFixed(2);
  valueLabels.ridges.textContent = params.ridges;
  valueLabels.ridgeStrength.textContent = Number(params.ridgeStrength).toFixed(3);
  valueLabels.branchCount.textContent = params.branchCount;
  valueLabels.branchAngle.textContent = Number(params.branchAngle).toFixed(2);
  valueLabels.branchStart.textContent = Number(params.branchStart).toFixed(2);
}

function syncInputsFromParams() {
  Object.keys(params).forEach((key) => {
    if (inputs[key]) inputs[key].value = params[key];
  });
  updateLabels();
}

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children.pop();
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material.dispose();
    }
  }
}

function getHornMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0.05
  });
}

// --------------------
// geometry
// --------------------
function createHornCurve(p, options = {}) {
  const {
    lengthScale = 1,
    curveScale = 1,
    forwardScale = 1,
    lift = 0,
    sideBias = 0,
    tipLift = 0
  } = options;

  const L = p.length * lengthScale;
  const C = p.curve * curveScale;
  const F = p.forward * forwardScale;

  const pts = [
    new THREE.Vector3(sideBias * 0.02, 0 + lift, 0),
    new THREE.Vector3(C * 0.20 + sideBias * 0.08, L * 0.25 + lift, F * 0.10),
    new THREE.Vector3(C * 0.55 + sideBias * 0.18, L * 0.58 + lift, F * 0.32),
    new THREE.Vector3(C * 0.92 + sideBias * 0.25, L * 0.86 + lift + tipLift, F * 0.62),
    new THREE.Vector3(C + sideBias * 0.28, L + lift + tipLift, F)
  ];

  return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.35);
}

function buildTubeFromCurve(curve, options) {
  const {
    baseRadius,
    tipRadius,
    twist,
    ridges,
    ridgeStrength,
    color,
    radialSegments = 24,
    heightSegments = 64
  } = options;

  const frames = curve.computeFrenetFrames(heightSegments, false);
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= heightSegments; i++) {
    const t = i / heightSegments;
    const center = curve.getPointAt(t);
    const normal = frames.normals[i];
    const binormal = frames.binormals[i];

    let radius = lerp(baseRadius, tipRadius, t);

    if (ridges > 0) {
      const ridgeWave = Math.sin(t * Math.PI * 2 * ridges);
      radius *= 1 + ridgeWave * ridgeStrength;
    }

    radius = Math.max(radius, 0.003);

    const twistAngle = twist * Math.PI * 2 * t;

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const a = v * Math.PI * 2;

      const x0 = Math.cos(a) * radius;
      const y0 = Math.sin(a) * radius;

      const x = x0 * Math.cos(twistAngle) - y0 * Math.sin(twistAngle);
      const y = x0 * Math.sin(twistAngle) + y0 * Math.cos(twistAngle);

      const vertex = new THREE.Vector3()
        .copy(center)
        .addScaledVector(normal, x)
        .addScaledVector(binormal, y);

      positions.push(vertex.x, vertex.y, vertex.z);

      const n = new THREE.Vector3()
        .addScaledVector(normal, x)
        .addScaledVector(binormal, y)
        .normalize();

      normals.push(n.x, n.y, n.z);
      uvs.push(v, t);
    }
  }

  for (let i = 0; i < heightSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = a + radialSegments + 1;
      const c = b + 1;
      const d = a + 1;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, getHornMaterial(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createMainHorn(p) {
  const curve = createHornCurve(p);
  return buildTubeFromCurve(curve, {
    baseRadius: p.baseRadius,
    tipRadius: p.tipRadius,
    twist: p.twist,
    ridges: p.ridges,
    ridgeStrength: p.ridgeStrength,
    color: p.color,
    radialSegments: 28,
    heightSegments: 90
  });
}

function getPointAndFrameOnCurve(curve, t) {
  const tangent = curve.getTangentAt(t).normalize();
  const frames = curve.computeFrenetFrames(60, false);
  const idx = Math.min(60, Math.floor(t * 60));
  return {
    point: curve.getPointAt(t),
    tangent,
    normal: frames.normals[idx],
    binormal: frames.binormals[idx]
  };
}

function createBranchHorn(p, index, total) {
  const baseCurve = createHornCurve(p);
  const t = Math.min(0.95, p.branchStart + index * 0.12);

  const { point, tangent, normal, binormal } = getPointAndFrameOnCurve(baseCurve, t);

  const angle = p.branchAngle * (0.75 + index * 0.12);
  const dir = new THREE.Vector3()
    .copy(tangent)
    .multiplyScalar(0.8)
    .addScaledVector(normal, Math.cos(index * 1.7) * angle)
    .addScaledVector(binormal, Math.sin(index * 1.4) * angle * 0.5)
    .normalize();

  const branchLength = p.length * (0.22 + index * 0.08);
  const p0 = point.clone();
  const p1 = point.clone().add(dir.clone().multiplyScalar(branchLength * 0.28));
  const p2 = point.clone().add(dir.clone().multiplyScalar(branchLength * 0.75))
    .add(new THREE.Vector3(0, branchLength * 0.25, 0));
  const p3 = point.clone().add(dir.clone().multiplyScalar(branchLength))
    .add(new THREE.Vector3(0, branchLength * 0.42, 0));

  const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3], false, "catmullrom", 0.4);

  return buildTubeFromCurve(curve, {
    baseRadius: Math.max(0.03, p.baseRadius * (0.34 - index * 0.04)),
    tipRadius: Math.max(0.01, p.tipRadius * 0.8),
    twist: p.twist * 0.25,
    ridges: Math.max(0, Math.floor(p.ridges * 0.4)),
    ridgeStrength: p.ridgeStrength * 0.4,
    color: p.color,
    radialSegments: 18,
    heightSegments: 46
  });
}

function buildHornGroup(p) {
  const group = new THREE.Group();

  const mainHorn = createMainHorn(p);
  group.add(mainHorn);

  for (let i = 0; i < p.branchCount; i++) {
    const branch = createBranchHorn(p, i, p.branchCount);
    group.add(branch);
  }

  // 根元リング
  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(Math.max(0.08, p.baseRadius * 0.88), Math.max(0.02, p.baseRadius * 0.12), 12, 32),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(p.color).multiplyScalar(0.75),
      roughness: 0.9,
      metalness: 0.02
    })
  );
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.02;
  baseRing.castShadow = true;
  baseRing.receiveShadow = true;
  group.add(baseRing);

  return group;
}

// --------------------
// update
// --------------------
function frameObject(group) {
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.5;

  controls.target.copy(center);
  camera.position.set(center.x + radius * 1.8, center.y + radius * 0.9, center.z + radius * 2.3);
  controls.update();

  pedestal.position.set(center.x, 0.1, center.z);
}

function updateHorn() {
  scene.remove(hornGroup);
  clearGroup(hornGroup);

  hornGroup = buildHornGroup(params);
  scene.add(hornGroup);

  frameObject(hornGroup);
}

function applyPreset(name) {
  Object.assign(params, PRESETS[name]);
  syncInputsFromParams();
  updateHorn();
}

function randomColor() {
  const colors = ["#e6d7c3", "#d8c5aa", "#a06f52", "#f1eee8", "#d2d8ec", "#6f5546"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function randomizeParams() {
  params.length = THREE.MathUtils.randFloat(2.5, 8.0);
  params.baseRadius = THREE.MathUtils.randFloat(0.12, 0.8);
  params.tipRadius = THREE.MathUtils.randFloat(0.01, 0.12);
  params.curve = THREE.MathUtils.randFloat(-2.0, 2.5);
  params.forward = THREE.MathUtils.randFloat(-0.3, 1.5);
  params.twist = THREE.MathUtils.randFloat(-2.5, 3.0);
  params.ridges = THREE.MathUtils.randInt(0, 16);
  params.ridgeStrength = THREE.MathUtils.randFloat(0.0, 0.12);
  params.branchCount = THREE.MathUtils.randInt(0, 4);
  params.branchAngle = THREE.MathUtils.randFloat(0.2, 1.1);
  params.branchStart = THREE.MathUtils.randFloat(0.3, 0.75);
  params.color = randomColor();

  syncInputsFromParams();
  updateHorn();
}

function resetParams() {
  Object.assign(params, defaultParams);
  inputs.preset.value = "rhino";
  syncInputsFromParams();
  updateHorn();
}

// --------------------
// events
// --------------------
Object.entries(inputs).forEach(([key, el]) => {
  if (!el) return;

  if (key === "preset") return;

  el.addEventListener("input", (e) => {
    params[key] = key === "color" ? e.target.value : Number(e.target.value);
    updateLabels();
    updateHorn();
  });
});

document.getElementById("applyPresetBtn").addEventListener("click", () => {
  applyPreset(inputs.preset.value);
});

document.getElementById("randomBtn").addEventListener("click", randomizeParams);
document.getElementById("resetBtn").addEventListener("click", resetParams);

// --------------------
// init
// --------------------
inputs.preset.value = "rhino";
syncInputsFromParams();
updateHorn();

window.addEventListener("resize", () => {
  camera.aspect = viewer.clientWidth / viewer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(viewer.clientWidth, viewer.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
