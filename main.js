console.log("🚀 Inicializando...");

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// =========================
// CONFIGURAÇÕES
// =========================
const RAIO_TERRA = 5;
const TEXTURA_PATH = "/textures/earth.jpg";
const API_KEY = "AIzaSyCSP5XJE4ukwdTR1ca-QILJ5xZsThikzQc";

// =========================
// CENA 3D
// =========================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
document.body.appendChild(renderer.domElement);

// =========================
// TERRA
// =========================
const geometry = new THREE.SphereGeometry(RAIO_TERRA, 64, 64);
const textureLoader = new THREE.TextureLoader();
const material = new THREE.MeshBasicMaterial({ map: textureLoader.load(TEXTURA_PATH) });
const earth = new THREE.Mesh(geometry, material);
scene.add(earth);

// =========================
// MARCADOR (para mostrar onde clicou)
// =========================
const markerGeometry = new THREE.SphereGeometry(0.2, 16, 16);
const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff3333 });
const marker = new THREE.Mesh(markerGeometry, markerMaterial);
marker.visible = false;
scene.add(marker);

// =========================
// CONTROLES
// =========================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.05;

// =========================
// ANIMAÇÃO
// =========================
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// =========================
// STREET VIEW (IFRAME)
// =========================
function abrirStreetViewIframe(lat, lng) {
  console.log("Abrindo iframe Street View em:", lat, lng);

  const old = document.getElementById("street-view-iframe");
  if (old) old.remove();

  const container = document.createElement("div");
  container.id = "street-view-iframe";
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100vw";
  container.style.height = "100vh";
  container.style.zIndex = "9999";
  container.style.backgroundColor = "#000";

  const iframe = document.createElement("iframe");
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.src = `https://www.google.com/maps/embed/v1/streetview?key=${API_KEY}&location=${lat},${lng}&heading=0&pitch=0&fov=90`;

  const btn = document.createElement("button");
  btn.innerText = "FECHAR";
  btn.style.position = "absolute";
  btn.style.top = "20px";
  btn.style.right = "20px";
  btn.style.zIndex = "10000";
  btn.style.padding = "10px 20px";
  btn.style.background = "white";
  btn.style.border = "none";
  btn.style.cursor = "pointer";
  btn.onclick = () => container.remove();

  container.appendChild(iframe);
  container.appendChild(btn);
  document.body.appendChild(container);
}

// =========================
// CONVERSÃO UV → LAT/LNG
// =========================
function uvParaLatLng(uv) {
  const lng = (uv.x - 0.5) * 360;
  const lat = (uv.y - 0.5) * 180;
  return { lat, lng };
}

// =========================
// VERIFICAR E ABRIR STREET VIEW (COM RAIO AMPLIADO)
// =========================
function verificarEAbrirStreetView(lat, lng) {
  if (!window.google || !google.maps) {
    alert("Google Maps ainda não carregou.");
    return;
  }

  const service = new google.maps.StreetViewService();
  service.getPanorama(
    { location: { lat, lng }, radius: 50000, source: google.maps.StreetViewSource.OUTDOOR },
    (data, status) => {
      if (status === "OK") {
        const pos = data.location.latLng;
        console.log("✅ Panorama encontrado em:", pos.lat(), pos.lng());
        abrirStreetViewIframe(pos.lat(), pos.lng());
      } else {
        alert("❌ Não há Street View num raio de 200m deste ponto.");
      }
    }
  );
}

// =========================
// DETECTOR DE DUPLO CLIQUE
// =========================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let clickTimer = null;
const DUPLO_CLIQUE_INTERVALO = 250;

window.addEventListener("click", (event) => {
  if (clickTimer) {
    clearTimeout(clickTimer);
    clickTimer = null;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(earth);

    if (intersects.length > 0) {
      const uv = intersects[0].uv;
      if (!uv) return;

      const pontoMundo = intersects[0].point;
      marker.position.copy(pontoMundo);
      marker.visible = true;

      const { lat, lng } = uvParaLatLng(uv);
      console.log(`🌍 Duplo clique: lat ${lat.toFixed(4)}, lng ${lng.toFixed(4)}`);

      verificarEAbrirStreetView(lat, lng);
    }

    return;
  }

  clickTimer = setTimeout(() => {
    clickTimer = null;
  }, DUPLO_CLIQUE_INTERVALO);
});

// ==========================================
// MAPA AUXILIAR COM CAMADA DE COBERTURA
// ==========================================

let miniMapa = null;
let coberturaAtiva = false;

function ativarMapaCobertura() {
  const container = document.getElementById('mapa-cobertura');
  const miniMapaDiv = document.getElementById('mini-mapa');
  
  if (!miniMapa && window.google && google.maps) {
    // Cria o mapa auxiliar
    miniMapa = new google.maps.Map(miniMapaDiv, {
      center: { lat: -15.7942, lng: -47.8822 }, // Brasil como centro inicial
      zoom: 4,
      disableDefaultUI: true, // remove todos os controles
      gestureHandling: 'greedy', // permite arrastar
      backgroundColor: 'transparent'
    });
    
    // ADICIONA A CAMADA DE COBERTURA (LINHAS AZUIS DO STREET VIEW)
    const streetViewLayer = new google.maps.StreetViewCoverageLayer();
    streetViewLayer.setMap(miniMapa);
    
    console.log("✅ Camada de cobertura Street View ativada no mapa auxiliar");
  }
  
  container.classList.add('visivel');
  coberturaAtiva = true;
}

function desativarMapaCobertura() {
  const container = document.getElementById('mapa-cobertura');
  container.classList.remove('visivel');
  coberturaAtiva = false;
}

// Botões para controlar o mapa de cobertura
document.getElementById('fechar-cobertura').addEventListener('click', () => {
  desativarMapaCobertura();
});

// Opcional: botão para ativar (você pode criar um botão no canto)
// Se quiser um botão para mostrar/esconder as linhas:
const btnMostrarCobertura = document.createElement('button');
btnMostrarCobertura.innerText = '🗺️ Ver ruas com Street View';
btnMostrarCobertura.style.position = 'fixed';
btnMostrarCobertura.style.bottom = '20px';
btnMostrarCobertura.style.left = '20px';
btnMostrarCobertura.style.zIndex = '201';
btnMostrarCobertura.style.padding = '8px 12px';
btnMostrarCobertura.style.background = '#4285f4';
btnMostrarCobertura.style.color = 'white';
btnMostrarCobertura.style.border = 'none';
btnMostrarCobertura.style.borderRadius = '8px';
btnMostrarCobertura.style.cursor = 'pointer';
btnMostrarCobertura.style.fontSize = '12px';
btnMostrarCobertura.style.fontWeight = 'bold';
btnMostrarCobertura.onclick = () => {
  if (!coberturaAtiva) {
    ativarMapaCobertura();
  } else {
    desativarMapaCobertura();
  }
};
document.body.appendChild(btnMostrarCobertura);