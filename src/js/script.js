import * as THREE from 'three';
import fragmentShader from '../glsl/raymarching.fs.glsl';
import vertexShader from '../glsl/raymarching.vs.glsl';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const material = new THREE.ShaderMaterial({
  uniforms: {
    camPos: { value: new THREE.Vector3(0, 1, 3.2) },
    camMat: { value: new THREE.Matrix3() }, 
    resolution: { value: new THREE.Vector3(window.innerWidth, window.innerHeight, 0) },
    time: { value: 0 },
    sceneIndex: { value: 0 } // 0=sphere, 1=mandelbulb, 2=cube, 3=menger sponge
  },
  fragmentShader,
  vertexShader
});

const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
scene.add(mesh);
scene.background = new THREE.Color("teal");

const SCENE_NAMES = ['Sphere', 'Mandelbulb', 'Cube', 'Menger sponge'];

const label = document.createElement('div');
label.style.position = 'fixed';
label.style.top = '16px';
label.style.left = '50%';
label.style.transform = 'translateX(-50%)';
label.style.color = '#fff';
label.style.font = '600 20px system-ui, sans-serif';
label.style.textShadow = '0 1px 4px rgba(0,0,0,0.6)';
label.style.pointerEvents = 'none';
label.style.userSelect = 'none';
document.body.appendChild(label);

function updateLabel() {
  label.textContent = SCENE_NAMES[material.uniforms.sceneIndex.value];
}
updateLabel();

window.addEventListener('keydown', (e) => {
  if (e.key === 'f' || e.key === 'F') {
    material.uniforms.sceneIndex.value = (material.uniforms.sceneIndex.value + 1) % SCENE_NAMES.length;
    updateLabel();
  }
});

let yaw = 0.6, pitch = 0.35, dist = 3.2;
let dragging = false, lastX = 0, lastY = 0;

renderer.domElement.style.cursor = 'grab';

renderer.domElement.addEventListener('mousedown', (e) => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  renderer.domElement.style.cursor = 'grabbing';
});
window.addEventListener('mouseup', () => {
  dragging = false;
  renderer.domElement.style.cursor = 'grab';
});
window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  yaw -= (e.clientX - lastX) * 0.005;
  pitch += (e.clientY - lastY) * 0.005;
  pitch = Math.max(-1.4, Math.min(1.4, pitch));
  lastX = e.clientX;
  lastY = e.clientY;
});
renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  dist *= (1 + e.deltaY * 0.001);
  dist = Math.max(1.2, Math.min(8, dist));
}, { passive: false });

let touchLast = null;
renderer.domElement.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) touchLast = [e.touches[0].clientX, e.touches[0].clientY];
});
renderer.domElement.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1 && touchLast) {
    const dx = e.touches[0].clientX - touchLast[0];
    const dy = e.touches[0].clientY - touchLast[1];
    yaw -= dx * 0.005;
    pitch += dy * 0.005;
    pitch = Math.max(-1.4, Math.min(1.4, pitch));
    touchLast = [e.touches[0].clientX, e.touches[0].clientY];
    e.preventDefault();
  }
}, { passive: false });

const target = new THREE.Vector3(0, 0, 0);
const worldUp = new THREE.Vector3(0, 1, 0);

function updateCamera() {
  const camPos = material.uniforms.camPos.value;
  camPos.set(
    dist * Math.cos(pitch) * Math.sin(yaw),
    dist * Math.sin(pitch) + 0.2,
    dist * Math.cos(pitch) * Math.cos(yaw)
  );

  const fwd = new THREE.Vector3().subVectors(target, camPos).normalize();
  const right = new THREE.Vector3().crossVectors(fwd, worldUp).normalize();
  const up = new THREE.Vector3().crossVectors(right, fwd).normalize();

  material.uniforms.camMat.value.set(
    right.x, up.x, fwd.x,
    right.y, up.y, fwd.y,
    right.z, up.z, fwd.z
  );
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight, 0);
});

function animate(t) {
  requestAnimationFrame(animate);
  material.uniforms.time.value = t * 0.001;
  updateCamera();
  renderer.render(scene, camera);
}

animate();