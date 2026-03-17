import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.SphereGeometry(5, 32, 32);
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load('/textures/earth.jpg');

const material = new THREE.MeshBasicMaterial({
  map: earthTexture
});

const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

camera.position.z = 10;

const controls = new OrbitControls(camera, renderer.domElement);

let isDragging = false;

controls.addEventListener("start", () => {
  isDragging = true;
});

controls.addEventListener("end", () => {
  setTimeout(() => {
    isDragging = false;
  }, 50);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta(); // tempo desde o último frame

  sphere.rotation.y += 0.05 * delta; // 0.5 é a velocidade

  renderer.render(scene, camera);
}


animate();

// ===== INTERAÇÃO =====

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (event) => {

  if (isDragging) return; // impede abrir ao girar o planeta

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(sphere);

  if (intersects.length > 0) {
    const point = intersects[0].point;
    abrirStreetView(point);
  }
});
  
 window.addEventListener("click", (event) => {

  if (isDragging) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(sphere);

  if (intersects.length > 0) {
    const point = intersects[0].point;
    abrirStreetView(point);
  }

});


function abrirStreetView(point) {

  const radius = 5; // mesmo raio da esfera

  const lat = 90 - (Math.acos(point.y / radius) * 180 / Math.PI);
  const lon = ((270 + (Math.atan2(point.x, point.z) * 180 / Math.PI)) % 360) - 180;

  console.log("Latitude:", lat);
  console.log("Longitude:", lon);

  const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}`;

  window.open(url, "_blank");
}
