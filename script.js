import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";

const viewer = document.getElementById("viewer");

const defaultParams = {
  length: 4.0,
  baseRadius: 0.6,
  tipRadius: 0.08,
  curveX: 1.2,
  curveZ: 0.6,
  twist: 1.2,
  ridges: 9,
  ridgeStrength: 0.08,
  color: "#d8d1c5"
};

const params = { ...defaultParams };

const inputs = {
  length: document.getElementById("length"),
  baseRadius: document.getElementById("baseRadius"),
  tipRadius: document.getElementById("tipRadius"),
  curveX: document.getElementById("curveX"),
  curveZ: document.getElementById("curveZ"),
  twist: document.getElementById("twist"),
  ridges: document.getElementById("ridges"),
  ridgeStrength: document.getElementById("ridgeStrength"),
  color: document.getElementById("color")
};

const valueLabels = {
  length: document.getElementById("lengthValue"),
  baseRadius: document.getElementById("baseRadiusValue"),
  tipRadius: document.getElementById("tipRadiusValue"),
  curveX: document.getElementById("curveXValue"),
  curveZ: document.getElementById("curveZValue"),
  twist: document.getElementById("twistValue"),
  ridges: document.getElementById("ridgesValue"),
  ridgeStrength: document.getElementById("ridgeStrengthValue")
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101010);

const camera = new THREE.PerspectiveCamera(
  45,
  viewer.clientWidth / viewer.clientHeight,
  0.1,
  100
);
camera.position.set(4, 3, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewer.clientWidth, viewer.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
viewer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 2, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
directionalLight.position.set(5, 8, 5);
scene.add(directionalLight);

const grid = new THREE.GridHelper(20, 20, 0x666666, 0x333333);
scene.add(grid);

const axes = new THREE.AxesHelper(2);
scene.add(axes);

let hornMesh = null;

function createHornCurve(p) {
  const p0 = new THREE.Vector3(0, 0, 0);
  const p1 = new THREE.Vector3(p.curveX * 0.25, p.length * 0.3, p.curveZ * 0.15);
  const p2 = new THREE.Vector3(p.curveX * 0.85, p.length * 0.72, p.curveZ * 0.45);
  const p3 = new THREE.Vector3(p.curveX, p.length, p.curveZ);

  return new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
}

function generateHornGeometry(p) {
  const radialSegments = 32;
  const heightSegments = 100;

  const curve = createHornCurve(p);
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

    let radius = THREE.MathUtils.lerp(p.baseRadius, p.tipRadius, t);

    const ridgeFactor =
      1 + Math.sin(t * Math.PI * p.ridges * 2) * p.ridgeStrength;
    radius *= ridgeFactor;

    const twistAngle = p.twist * Math.PI * 2 * t;
    const cosT = Math.cos(twistAngle);
    const sinT = Math.sin(twistAngle);

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const angle = v * Math.PI * 2;

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const localX = x * cosT - y * sinT;
      const localY = x * sinT + y * cosT;

      const vertex = new THREE.Vector3()
        .copy(center)
        .addScaledVector(normal, localX)
        .addScaledVector(binormal, localY);

      positions.push(vertex.x, vertex.y, vertex.z);

      const n = new THREE.Vector3()
        .addScaledVector(normal, localX)
        .addScaledVector(binormal, localY)
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

  const bottomCenterIndex = positions.length / 3;
  const bottomCenter = curve.getPointAt(0);
  positions.push(bottomCenter.x, bottomCenter.y, bottomCenter.z);
  normals.push(0, -1, 0);
  uvs.push(0.5, 0.5);

  for (let j = 0; j < radialSegments; j++) {
    const a = j;
    const b = j + 1;
    indices.push(bottomCenterIndex, b, a);
  }

  const topCenterIndex = positions.length / 3;
  const topCenter = curve.getPointAt(1);
  positions.push(topCenter.x, topCenter.y, topCenter.z);
  normals.push(0, 1, 0);
  uvs.push(0.5, 0.5);

  const lastRowStart = heightSegments * (radialSegments + 1);
  for (let j = 0; j < radialSegments; j++) {
    const a = lastRowStart + j;
    const b = lastRowStart + j + 1;
    indices.push(topCenterIndex, a, b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(normals, 3)
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
}

function createHornMesh(p) {
  const geometry = generateHornGeometry(p);
  const material = new THREE.MeshStandardMaterial({
    color: p.color,
    roughness: 0.75,
    metalness: 0.08
  });

  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

function updateHorn() {
  if (hornMesh) {
    scene.remove(hornMesh);
    hornMesh.geometry.dispose();
    hornMesh.material.dispose();
  }

  hornMesh = createHornMesh(params);
  scene.add(hornMesh);
}

function syncLabels() {
  valueLabels.length.textContent = Number(params.length).toFixed(1);
  valueLabels.baseRadius.textContent = Number(params.baseRadius).toFixed(2);
  valueLabels.tipRadius.textContent = Number(params.tipRadius).toFixed(2);
  valueLabels.curveX.textContent = Number(params.curveX).toFixed(2);
  valueLabels.curveZ.textContent = Number(params.curveZ).toFixed(2);
  valueLabels.twist.textContent = Number(params.twist).toFixed(2);
  valueLabels.ridges.textContent = params.ridges;
  valueLabels.ridgeStrength.textContent = Number(params.ridgeStrength).toFixed(3);
}

function bindInputs() {
  Object.keys(inputs).forEach((key) => {
    inputs[key].addEventListener("input", (e) => {
      params[key] = key === "color" ? e.target.value : Number(e.target.value);
      syncLabels();
      updateHorn();
    });
  });
}

function resetParams() {
  Object.keys(defaultParams).forEach((key) => {
    params[key] = defaultParams[key];
    inputs[key].value = defaultParams[key];
  });

  syncLabels();
  updateHorn();
}

function randomizeParams() {
  params.length = THREE.MathUtils.randFloat(2.5, 8.0);
  params.baseRadius = THREE.MathUtils.randFloat(0.25, 1.2);
  params.tipRadius = THREE.MathUtils.randFloat(0.03, 0.18);
  params.curveX = THREE.MathUtils.randFloat(-2.5, 2.5);
  params.curveZ = THREE.MathUtils.randFloat(-2.0, 2.0);
  params.twist = THREE.MathUtils.randFloat(-3.0, 3.0);
  params.ridges = Math.floor(THREE.MathUtils.randInt(0, 16));
  params.ridgeStrength = THREE.MathUtils.randFloat(0.0, 0.16);

  const colors = [
    "#d8d1c5",
    "#f5f1e8",
    "#6f6253",
    "#b98f6b",
    "#d4dff0",
    "#c8b6ff"
  ];
  params.color = colors[Math.floor(Math.random() * colors.length)];

  Object.keys(params).forEach((key) => {
    inputs[key].value = params[key];
  });

  syncLabels();
  updateHorn();
}

document.getElementById("resetBtn").addEventListener("click", resetParams);
document.getElementById("randomBtn").addEventListener("click", randomizeParams);

bindInputs();
syncLabels();
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
