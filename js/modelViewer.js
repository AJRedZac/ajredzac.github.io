import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Crear la escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Fondo oscuro

// Configurar la cámara
//const camera = new THREE.PerspectiveCamera(75, window.innerWidth/2 / window.innerHeight, 0.1, 1000);
//const camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000 );
//camera.position.set(0, 0, 0); // Posición inicial de la cámara
const aspect = window.innerWidth/2 / window.innerHeight;
const cameraSize = 2; // Ajusta el tamaño de la proyección ortográfica

const camera = new THREE.OrthographicCamera(
    -cameraSize * aspect, // Left
    cameraSize * aspect,  // Right
    cameraSize,           // Top
    -cameraSize,          // Bottom
    0.1,                 // Near
    1000                 // Far
);

// Posicionar la cámara para que vea los modelos
camera.position.set(0, 1, 5); // Mueve la cámara hacia adelante en Z
camera.lookAt(0, 1, 0); // Asegura que está mirando al centro de la escena


// Renderizador
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth/2, window.innerHeight);
const canvasContainer = document.getElementById('canvas-container');
canvasContainer.appendChild(renderer.domElement);

// Luz ambiental y direccional
//const ambientLight = new THREE.AmbientLight(0x6647ff, 5);
//scene.add(ambientLight);
//const directionalLight = new THREE.DirectionalLight(0x6647ff, 1);
//directionalLight.position.set(5, 5, 5);
//scene.add(directionalLight);
const pointLight = new THREE.PointLight(0xFFFFFF, 3, 4);
pointLight.position.set(1, 1, 2);
scene.add(pointLight);
const pointLight2 = new THREE.PointLight(0x6647ff, 3, 4);
pointLight2.position.set(-1, 1, 2);
scene.add(pointLight2);
// Raycaster para detectar interacciones con el myselfModelo
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Variable para almacenar el myselfModelo
let myselfModel = null;
let consolesModel = null;
let isHovering = false;
let myRotationSpeed = 0.00;
let rotationBoost = 0;
let originalQuaternion = null; // Quaternión original para evitar giros innecesarios
let consolesmyRotationSpeed = -0.0025; // Velocidad de giro del segundo modelo

// Límites del zoom (ajustando el FOV de la cámara)
const minFOV = 40;
const maxFOV = 90;
//camera.fov = 75; // Valor inicial
//camera.updateProjectionMatrix();

// Cargar el myselfModel 
const loader = new GLTFLoader();
loader.load('models/alvaro_incube.glb', function (gltf) {
    myselfModel = gltf.scene;
    myselfModel.position.set(0, -.35, 0);
    myselfModel.scale.set(.9, .9, .9);
    scene.add(myselfModel);

    // Guardar la rotación original como un quaternión
    originalQuaternion = myselfModel.quaternion.clone();
});

// Cargar el consolasModel 3D
loader.load('models/consoles.glb', function (gltf) {
    consolesModel = gltf.scene;
    consolesModel.position.set(0, -.35, 0); // Ajusta su posición al lado del primer modelo
    consolesModel.scale.set(.9, .9, .9);
    scene.add(consolesModel);
});

// Animación: Rotación con interacción del usuario
function animate() {
    requestAnimationFrame(animate);

    if (myselfModel) {
        myselfModel.rotation.y += myRotationSpeed;
		consolesModel.rotation.y += consolesmyRotationSpeed  - rotationBoost; 
        if (rotationBoost > 0) {
            rotationBoost *= 0.85;
            if (rotationBoost < 0.01) rotationBoost = 0;
        }

        // Si el mouse NO está en hover, interpolar hacia la rotación original con el camino más corto
        if (!isHovering && originalQuaternion) {
            myselfModel.quaternion.slerp(originalQuaternion, 0.05); // Interpolación suave usando Quaterniones
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

    if (myselfModel) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(myselfModel, true);

        if (intersects.length > 0) {
            isHovering = true;
            myRotationSpeed = 0.005;
			consolesmyRotationSpeed = 0; // Velocidad de giro del segundo modelo
        } else {
            isHovering = false;
            myRotationSpeed = 0.00;
			consolesmyRotationSpeed = -0.0025; // Velocidad de giro del segundo modelo
        }
    }
});

// Evento: Al hacer clic en el myselfModelo, girar varias veces
canvasContainer.addEventListener('click', () => {
    if (isHovering) {
        rotationBoost = 0.5;
    }
});

// Evento: Detectar cuando el mouse sale del `canvas-container`
canvasContainer.addEventListener('mouseleave', () => {
    isHovering = false;
    myRotationSpeed = 0.00;
	consolesmyRotationSpeed = -0.0025; // Velocidad de giro del segundo modelo
});

// 📌 **Evento de zoom con la rueda del mouse**
/*
canvasContainer.addEventListener('wheel', (event) => {
    camera.fov += event.deltaY * 0.05;
    camera.fov = Math.max(minFOV, Math.min(maxFOV, camera.fov));
    camera.updateProjectionMatrix();
});*/

// Ajustar tamaño al cambiar ventana
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth /2, window.innerHeight);
    camera.aspect = window.innerWidth/2 / window.innerHeight;
    camera.updateProjectionMatrix();
});
