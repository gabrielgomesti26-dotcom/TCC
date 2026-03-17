console.log("JS carregou");

// =========================
// IMPORTS
// =========================
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// =========================
// UI
// =========================
const streetContainer = document.getElementById("street-view");
const btnFechar = document.getElementById("fecharSV");

btnFechar.addEventListener("click", () => {
  streetContainer.style.display = "none";
});

// =========================
// CENA
// =========================
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 10;
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";

document.body.appendChild(renderer.domElement);

// =========================
// TERRA
// =========================
const geometry = new THREE.SphereGeometry(5, 64, 64);

const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load("/textures/earth.jpg"); // sua imagem

const material = new THREE.MeshBasicMaterial({
  map: earthTexture
});

const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// 🔥 AJUSTE IMPORTANTE (alinha textura)
sphere.rotation.y = Math.PI / 2;

// =========================
// CONTROLES
// =========================
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

// =========================
// ANIMAÇÃO
// =========================
function animate() {
  requestAnimationFrame(animate);

  sphere.rotation.y += 0.0008;

  renderer.render(scene, camera);
}

animate();

// =========================
// RAYCAST
// =========================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let bloqueado = false; // evita spam de clique

window.addEventListener("click", (event) => {

  if (bloqueado) return;

  console.log("clicou geral");

  if (isDragging) return;

  const rect = renderer.domElement.getBoundingClientRect();

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(sphere);

  if (intersects.length > 0) {

    console.log("ACERTOU A ESFERA");

    const point = intersects[0].point;

    const coords = converterParaLatLng(point);

    console.log("Coords:", coords);

    abrirStreetView(coords.lat, coords.lng);
  }
});

// =========================
// CONVERSÃO (AGORA CERTA)
// =========================
function converterParaLatLng(point) {
  const radius = sphere.geometry.parameters.radius;

  const lat = Math.asin(point.y / radius) * (180 / Math.PI);

  let lng = Math.atan2(point.z, point.x) * (180 / Math.PI);

  return { lat, lng };
}

// =========================
// STREET VIEW (COM PROTEÇÃO)
// =========================
function abrirStreetView(lat, lng) {

  if (!window.google || !google.maps) {
    alert("Google Maps não carregou!");
    return;
  }

  bloqueado = true;

  const service = new google.maps.StreetViewService();

  service.getPanorama(
    { location: { lat, lng }, radius: 50000 },
    (data, status) => {

      bloqueado = false;

      if (status === "OK") {

        streetContainer.style.display = "block";

        new google.maps.StreetViewPanorama(streetContainer, {
          position: data.location.latLng,
          pov: { heading: 0, pitch: 0 },
          zoom: 1,
        });

      } else {
        alert("Não tem Street View aqui 😢");
      }
    }
  );
}

// =========================
// TESTE (opcional)
// =========================
// abrirStreetView(-15.7942, -47.8822);