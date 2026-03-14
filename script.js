import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const viewer = document.getElementById("viewer");

const PRESETS = {
  rhino: {
    size: 5.2,
    curve: 0.25,
    twist: 0.0,
    texture: 0.55,
    branches: 0,
    color: "#bfa184"
  },
  devil: {
    size: 4.6,
    curve: 1.9,
    twist: 0.35,
    texture: 0.25,
    branches: 0,
    color: "#eadbc9"
  },
  spiral: {
    size: 5.8,
    curve: 0.8,
    twist: 2.4,
    texture: 0.4,
    branches: 0,
    color: "#d8cfbf"
  },
  antler: {
    size: 6.4,
    curve: 1.35,
    twist: 0.05,
    texture: 0.15,
    branches: 3,
    color: "#8c6b55"
  }
};

const defaultParams = { ...PRESETS.rhino };
const params = { ...defaultParams };

const inputs = {
  preset: document.getElementById("preset"),
  size: document.getElementById("size"),
  curve: document.getElementById("curve"),
  twist: document.getElementById("twist"),
  texture: document.getElementById("texture"),
  branches: document.getElementById("branches"),
  color: document.getElementById("color")
};

const labels = {
  size: document.getElementById("sizeValue"),
  curve: document.getElementById("curveValue"),
  twist: document.getElementById("twistValue"),
  texture: document.getElementById("textureValue"),
  branches: document.getElementById("branchesValue")
};

// -----------------------------
// Scene
// -----------------------------
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0b0d12, 10, 26);

const camera = new THREE.PerspectiveCamera(
  40,
  Math.max(1, viewer.clientWidth) / Math.max(1, viewer.clientHeight),
  0.1,
  100
);
camera.position.set(5.8, 3.8, 8.2);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(Math.max(1, viewer.clientWidth), Math.max(1, viewer.clientHeight));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 3;
controls.maxDistance = 16;
controls.target.set(0, 2.3, 0);
controls.update();

const ambient = new THREE.AmbientLight(0xffffff, 1.35);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
keyLight.position.set(5, 8, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xc9d8ff, 0.8);
fillLight.position.set(-6, 4, -4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffe4cf, 0.55);
rimLight.position.set(0, 6, -8);
scene.add(rimLight);

// 背景
const bgSphere = new THREE.Mesh(
  new THREE.SphereGeometry(40, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0x131927,
    side: THREE.BackSide
  })
);
scene.add(bgSphere);

// 影を受ける床
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(12, 64),
  new THREE.ShadowMaterial({ opacity: 0.18 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.001;
floor.receiveShadow = true;
scene.add(floor);

// 台座
const pedestal = new THREE.Mesh(
  new THREE.CylinderGeometry(1.45, 1.55, 0.28, 64),
  new THREE.MeshStandardMaterial({
    color: 0x171b23,
    roughness: 0.92,
    metalness: 0.03
  })
);
pedestal.position.y = 0.14;
pedestal.receiveShadow = true;
scene.add(pedestal);

let hornGroup = new THREE.Group();
scene.add(hornGroup);

// -----------------------------
// Helpers
// -----------------------------
function updateLabels() {
  labels.size.textContent = Number(params.size).toFixed(1);
  labels.curve.textContent = Number(params.curve).toFixed(2);
  labels.twist.textContent = Number(params.twist).toFixed(2);
  labels.texture.textContent = Number(params.texture).toFixed(2);
  labels.branches.textContent = params.branches;
}

function syncInputs() {
  Object.keys(inputs).forEach((key) => {
    if (inputs[key]) inputs[key].value = params[key];
  });
  updateLabels();
}

function clearGroup(group) {
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);

    child.traverse?.((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hornMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.84,
    metalness: 0.03
  });
}

// -----------------------------
// Geometry
// -----------------------------
function getPresetProfile() {
  const preset = params.preset || "rhino";

  if (preset === "rhino") {
    return {
      length: params.size,
      baseRadius: 0.42 * (params.size / 5),
      tipRadius: 0.02,
      forward: 1.15,
      curveFactor: 0.18
    };
  }

  if (preset === "devil") {
    return {
      length: params.size,
      baseRadius: 0.28 * (params.size / 5),
      tipRadius: 0.03,
      forward: 0.35,
      curveFactor: 1.0
    };
  }

  if (preset === "spiral") {
    return {
      length: params.size,
      baseRadius: 0.33 * (params.size / 5),
      tipRadius: 0.04,
      forward: 0.35,
      curveFactor: 0.55
    };
  }

  return {
    length: params.size,
    baseRadius: 0.16 * (params.size / 5),
    tipRadius: 0.025,
    forward: 0.65,
    curveFactor: 0.9
  };
}

function createMainCurve() {
  const profile = getPresetProfile();
  const L = profile.length;
  const C = params.curve * profile.curveFactor;
  const F = profile.forward;

  return new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(C * 0.15, L * 0.22, F * 0.08),
      new THREE.Vector3(C * 0.52, L * 0.55, F * 0.26),
      new THREE.Vector3(C * 0.88, L * 0.84, F * 0.58),
      new THREE.Vector3(C, L, F)
    ],
    false,
    "catmullrom",
    0.4
  );
}

function createTubeMesh(curve, options) {
  const {
    baseRadius,
    tipRadius,
    twist,
    texture,
    color,
    radialSegments = 24,
    heightSegments = 72
  } = options;

  const frames = curve.computeFrenetFrames(heightSegments, false);

  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  const ridgeCount = Math.round(4 + texture * 12);
  const ridgeStrength = texture * 0.12;

  for (let i = 0; i <= heightSegments; i++) {
    const t = i / heightSegments;
    const center = curve.getPointAt(t);
    const normal = frames.normals[i];
    const binormal = frames.binormals[i];

    let radius = lerp(baseRadius, tipRadius, t);
    radius *= 1 + Math.sin(t * Math.PI * 2 * ridgeCount) * ridgeStrength;
    radius = Math.max(0.003, radius);

    const twistAngle = twist * Math.PI * 2 * t;

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const angle = v * Math.PI * 2;

      const x0 = Math.cos(angle) * radius;
      const y0 = Math.sin(angle) * radius;

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

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, hornMaterial(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function getCurveFrame(curve, t) {
  const point = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t).normalize();
  const frames = curve.computeFrenetFrames(80, false);
  const idx = Math.min(80, Math.floor(t * 80));
  return {
    point,
    tangent,
    normal: frames.normals[idx],
    binormal: frames.binormals[idx]
  };
}

function createBranch(curve, index, count) {
  const profile = getPresetProfile();
  const t = Math.min(0.9, 0.42 + index * 0.14);

  const { point, tangent, normal, binormal } = getCurveFrame(curve, t);

  const spread = 0.45 + index * 0.16;
  const branchLength = profile.length * (0.24 + index * 0.08);

  const dir = new THREE.Vector3()
    .copy(tangent)
    .multiplyScalar(0.7)
    .addScaledVector(normal, spread)
    .addScaledVector(binormal, (index % 2 === 0 ? 1 : -1) * 0.12)
    .normalize();

  const p0 = point.clone();
  const p1 = point.clone().add(dir.clone().multiplyScalar(branchLength * 0.3));
  const p2 = point.clone()
    .add(dir.clone().multiplyScalar(branchLength * 0.7))
    .add(new THREE.Vector3(0, branchLength * 0.24, 0));
  const p3 = point.clone()
    .add(dir.clone().multiplyScalar(branchLength))
    .add(new THREE.Vector3(0, branchLength * 0.42, 0));

  const branchCurve = new THREE.CatmullRomCurve3([p0, p1, p2, p3], false, "catmullrom", 0.45);

  return createTubeMesh(branchCurve, {
    baseRadius: profile.baseRadius * (0.26 - index * 0.03),
    tipRadius: profile.tipRadius * 0.9,
    twist: params.twist * 0.15,
    texture: params.texture * 0.55,
    color: params.color,
    radialSegments: 16,
    heightSegments: 36
  });
}

function buildHorn() {
  const group = new THREE.Group();
  const profile = getPresetProfile();
  const curve = createMainCurve();

  const mainHorn = createTubeMesh(curve, {
    baseRadius: profile.baseRadius,
    tipRadius: profile.tipRadius,
    twist: params.twist,
    texture: params.texture,
    color: params.color,
    radialSegments: 28,
    heightSegments: 88
  });
  group.add(mainHorn);

  if (params.preset === "antler" || params.branches > 0) {
    for (let i = 0; i < params.branches; i++) {
      group.add(createBranch(curve, i, params.branches));
    }
  }

  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(Math.max(0.06, profile.baseRadius * 0.85), Math.max(0.015, profile.baseRadius * 0.12), 12, 32),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(params.color).multiplyScalar(0.72),
      roughness: 0.92,
      metalness: 0.02
    })
  );
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.03;
  baseRing.castShadow = true;
  baseRing.receiveShadow = true;
  group.add(baseRing);

  return group;
}

// -----------------------------
// Camera / Update
// -----------------------------
let cameraInitialized = false;

function frameOnce(object) {
  if (cameraInitialized) return;

  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.5;

  controls.target.set(center.x, Math.max(1.5, center.y * 0.6), center.z);
  camera.position.set(center.x + radius * 1.7, center.y + radius * 0.9, center.z + radius * 2.2);
  controls.update();

  cameraInitialized = true;
}

function updateHorn() {
  scene.remove(hornGroup);
  clearGroup(hornGroup);

  hornGroup = buildHorn();
  scene.add(hornGroup);

  frameOnce(hornGroup);
}

function applyPreset(name) {
  Object.assign(params, PRESETS[name]);
  params.preset = name;
  syncInputs();
  updateHorn();
}

function randomColor() {
  const colors = ["#e7d8c6", "#cfb69a", "#9d7357", "#efe9df", "#d0d7ea", "#7f5d48"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function randomize() {
  const presets = ["rhino", "devil", "spiral", "antler"];
  const preset = presets[Math.floor(Math.random() * presets.length)];

  Object.assign(params, PRESETS[preset]);
  params.preset = preset;
  params.size = THREE.MathUtils.randFloat(3.0, 7.8);
  params.curve = THREE.MathUtils.randFloat(-1.2, 2.4);
  params.twist = THREE.MathUtils.randFloat(-2.0, 2.8);
  params.texture = THREE.MathUtils.randFloat(0.0, 0.9);
  params.branches = preset === "antler" ? THREE.MathUtils.randInt(2, 4) : THREE.MathUtils.randInt(0, 2);
  params.color = randomColor();

  syncInputs();
  updateHorn();
}

function resetAll() {
  Object.assign(params, defaultParams);
  params.preset = "rhino";
  syncInputs();
  updateHorn();
}

// -----------------------------
// Events
// -----------------------------
inputs.preset.addEventListener("change", (e) => {
  params.preset = e.target.value;
});

inputs.size.addEventListener("input", (e) => {
  params.size = Number(e.target.value);
  updateLabels();
  updateHorn();
});

inputs.curve.addEventListener("input", (e) => {
  params.curve = Number(e.target.value);
  updateLabels();
  updateHorn();
});

inputs.twist.addEventListener("input", (e) => {
  params.twist = Number(e.target.value);
  updateLabels();
  updateHorn();
});

inputs.texture.addEventListener("input", (e) => {
  params.texture = Number(e.target.value);
  updateLabels();
  updateHorn();
});

inputs.branches.addEventListener("input", (e) => {
  params.branches = Number(e.target.value);
  updateLabels();
  updateHorn();
});

inputs.color.addEventListener("input", (e) => {
  params.color = e.target.value;
  updateHorn();
});

document.getElementById("presetBtn").addEventListener("click", () => {
  applyPreset(inputs.preset.value);
});

document.getElementById("randomBtn").addEventListener("click", randomize);
document.getElementById("resetBtn").addEventListener("click", resetAll);

// -----------------------------
// Init
// -----------------------------
params.preset = "rhino";
syncInputs();
updateHorn();

window.addEventListener("resize", () => {
  const width = Math.max(1, viewer.clientWidth);
  const height = Math.max(1, viewer.clientHeight);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
