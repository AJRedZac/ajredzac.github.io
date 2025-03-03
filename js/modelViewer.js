import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Crear la escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Fondo oscuro

// Configurar la cámara
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 3); // Posición inicial de la cámara

// Renderizador
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth * 0.5, window.innerHeight * 0.5);
const canvasContainer = document.getElementById('canvas-container');
canvasContainer.appendChild(renderer.domElement);

// Luz ambiental y direccional
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Raycaster para detectar interacciones con el modelo
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Variable para almacenar el modelo
let model = null;
let isHovering = false;
let rotationSpeed = 0.00;
let rotationBoost = 0;
let originalQuaternion = null; // Quaternión original para evitar giros innecesarios

// Límites del zoom (ajustando el FOV de la cámara)
const minFOV = 40;
const maxFOV = 90;
camera.fov = 75; // Valor inicial
camera.updateProjectionMatrix();

// Cargar el modelo 3D
const loader = new GLTFLoader();
loader.load('models/alvaro_incube.glb', function (gltf) {
    model = gltf.scene;
    model.position.set(0, -1, 0);
    model.scale.set(2, 2, 2);
    scene.add(model);

    // Guardar la rotación original como un quaternión
    originalQuaternion = model.quaternion.clone();
});

// Animación: Rotación con interacción del usuario
function animate() {
    requestAnimationFrame(animate);

    if (model) {
        model.rotation.y += rotationSpeed + rotationBoost;

        if (rotationBoost > 0) {
            rotationBoost *= 0.95;
            if (rotationBoost < 0.01) rotationBoost = 0;
        }

        // Si el mouse NO está en hover, interpolar hacia la rotación original con el camino más corto
        if (!isHovering && originalQuaternion) {
            model.quaternion.slerp(originalQuaternion, 0.05); // Interpolación suave usando Quaterniones
        }
    }

    renderer.render(scene, camera);
}
animate();

// 📌 **Eventos dentro del `canvas-container`**
canvasContainer.addEventListener('mousemove', (event) => {
    const rect = canvasContainer.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    if (model) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(model, true);

        if (intersects.length > 0) {
            isHovering = true;
            rotationSpeed = 0.03;
        } else {
            isHovering = false;
            rotationSpeed = 0.00;
        }
    }
});

// Evento: Al hacer clic en el modelo, girar varias veces
canvasContainer.addEventListener('click', () => {
    if (isHovering) {
        rotationBoost = 0.5;
    }
});

// Evento: Detectar cuando el mouse sale del `canvas-container`
canvasContainer.addEventListener('mouseleave', () => {
    isHovering = false;
    rotationSpeed = 0.00;
});

// 📌 **Evento de zoom con la rueda del mouse**
canvasContainer.addEventListener('wheel', (event) => {
    camera.fov += event.deltaY * 0.05;
    camera.fov = Math.max(minFOV, Math.min(maxFOV, camera.fov));
    camera.updateProjectionMatrix();
});

// Ajustar tamaño al cambiar ventana
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth * 0.5, window.innerHeight * 0.5);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
