import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Crear la escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Fondo oscuro

// Configurar la cámara
//const camera = new THREE.PerspectiveCamera(75, window.innerWidth/2 / window.innerHeight, 0.1, 1000);
//const camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000 );
//camera.position.set(0, 0, 0); // Posición inicial de la cámara
// El tamaño lo manda el contenedor, no la ventana. Con window.innerWidth/2 x
// window.innerHeight el canvas medía siempre media pantalla de ancho por una
// pantalla de alto: en móvil eso daba una franja vertical y empujaba el texto
// fuera del viewport.
const canvasContainer = document.getElementById('canvas-container');

function medirContenedor() {
    const rect = canvasContainer.getBoundingClientRect();
    return {
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height))
    };
}

const tamInicial = medirContenedor();
const aspect = tamInicial.width / tamInicial.height;
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
renderer.setSize(tamInicial.width, tamInicial.height);
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

// ── Carga diferida de los modelos ────────────────────────────────────────
// Los dos .glb pesan ~9.8 MB juntos y antes se pedían los dos al evaluar el
// módulo, también en móvil y antes de que el visor estuviera cerca de la
// pantalla. Ahora: nada se descarga hasta que el contenedor se aproxima al
// viewport; en pantallas pequeñas sólo el modelo principal; en modo ahorro de
// datos, ninguno — se muestra el retrato estático que ya vive en el repo
// (~169 KB) en lugar del visor.
const loader = new GLTFLoader();

const conexion = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const bolAhorroDatos = Boolean(conexion && conexion.saveData);
const bolPantallaPequena = window.matchMedia('(max-width: 900px)').matches;

function cargarModeloPrincipal() {
    loader.load('models/alvaro_incube.glb', function (gltf) {
        myselfModel = gltf.scene;
        myselfModel.position.set(0, -.35, 0);
        myselfModel.scale.set(.9, .9, .9);
        scene.add(myselfModel);

        // Guardar la rotación original como un quaternión
        originalQuaternion = myselfModel.quaternion.clone();
    });
}

function cargarModeloConsolas() {
    loader.load('models/consoles.glb', function (gltf) {
        consolesModel = gltf.scene;
        consolesModel.position.set(0, -.35, 0); // Ajusta su posición al lado del primer modelo
        consolesModel.scale.set(.9, .9, .9);
        scene.add(consolesModel);
    });
}

// Alternativa visual: ocupa el hueco que el contenedor ya tenía reservado por
// CSS, así que no provoca desplazamiento de layout.
function mostrarAlternativaEstatica() {
    if (canvasContainer.querySelector('.canvas-fallback')) {
        return;
    }
    renderer.domElement.style.display = 'none';
    const imgAlterna = document.createElement('img');
    imgAlterna.className = 'canvas-fallback';
    imgAlterna.src = 'images/myImage.jpg';
    imgAlterna.alt = 'Portrait of Alvaro J. Redondo.';
    canvasContainer.appendChild(imgAlterna);
}

function arrancarCargaModelos() {
    if (bolAhorroDatos) {
        mostrarAlternativaEstatica();
        return;
    }
    cargarModeloPrincipal();
    if (!bolPantallaPequena) {
        cargarModeloConsolas();
    }
}

if (typeof IntersectionObserver === 'function') {
    const observadorVisibilidad = new IntersectionObserver(function (entradas) {
        if (entradas.some((entrada) => entrada.isIntersecting)) {
            observadorVisibilidad.disconnect();
            arrancarCargaModelos();
        }
    }, { rootMargin: '200px' });
    observadorVisibilidad.observe(canvasContainer);
} else {
    arrancarCargaModelos();
}

// prefers-reduced-motion: se detiene la rotación autónoma. Los modelos siguen
// visibles y el hover/clic sigue respondiendo; sólo desaparece el movimiento
// continuo, que es lo que la preferencia pide evitar.
const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)');

// Animación: Rotación con interacción del usuario
function animate() {
    requestAnimationFrame(animate);

    if (myselfModel && !movimientoReducido.matches) {
        myselfModel.rotation.y += myRotationSpeed;

        // consoles.glb puede no haber terminado de cargar cuando el primer
        // modelo ya está en escena: sin esta guarda la animación lanzaba un
        // TypeError en cada frame hasta que llegaba el segundo glb.
        if (consolesModel) {
            consolesModel.rotation.y += consolesmyRotationSpeed - rotationBoost;
        }

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

// Ajustar tamaño cuando cambia el contenedor (resize, rotación del móvil o el
// cambio de layout de la media query). `camera.aspect` no existe en una cámara
// ortográfica: hay que recalcular el frustum left/right, que es lo que el
// handler anterior no hacía.
let intUltimoAncho = tamInicial.width;
let intUltimoAlto = tamInicial.height;
let bolAjustePendiente = false;

function ajustarTamano() {
    const tam = medirContenedor();

    // Salir sin escribir nada si el tamaño no cambió: `setSize` redimensiona el
    // canvas, que está DENTRO del elemento observado, así que llamarlo en cada
    // notificación realimentaba al observer y Chrome emitía
    // "ResizeObserver loop completed with undelivered notifications".
    if (tam.width === intUltimoAncho && tam.height === intUltimoAlto) {
        return;
    }
    intUltimoAncho = tam.width;
    intUltimoAlto = tam.height;

    renderer.setSize(tam.width, tam.height);

    const nuevoAspect = tam.width / tam.height;
    camera.left = -cameraSize * nuevoAspect;
    camera.right = cameraSize * nuevoAspect;
    camera.top = cameraSize;
    camera.bottom = -cameraSize;
    camera.updateProjectionMatrix();
}

// La escritura de layout se saca del callback del observer y se agrupa en el
// siguiente frame.
function programarAjuste() {
    if (bolAjustePendiente) {
        return;
    }
    bolAjustePendiente = true;
    requestAnimationFrame(function () {
        bolAjustePendiente = false;
        ajustarTamano();
    });
}

if (typeof ResizeObserver === 'function') {
    new ResizeObserver(programarAjuste).observe(canvasContainer);
} else {
    window.addEventListener('resize', programarAjuste);
}
