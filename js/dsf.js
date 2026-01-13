const ROWS = 12;
const COLS = 12;

const gridElement = document.getElementById("dfsGrid");
const runButton = document.getElementById("runDfs");
const resetButton = document.getElementById("resetGrid");
const speedSlider = document.getElementById("speedSlider");
const speedValue = document.getElementById("speedValue");

let animationDelay = mapSpeedToDelay(speedSlider.value);


let image = [];
let cells = [];
let start = null;
let running = false;

/* Crear imagen */
function createImage() {
    gridElement.innerHTML = "";
    image = [];
    cells = [];

    for (let r = 0; r < ROWS; r++) {
        const row = [];
        const cellRow = [];

        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement("div");
            cell.classList.add("dfs-cell");

            const color = randomColor();
            cell.style.backgroundColor = color;

            cell.dataset.row = r;
            cell.dataset.col = c;

            cell.addEventListener("click", () => selectStart(cell, r, c));

            gridElement.appendChild(cell);

            row.push(color);
            cellRow.push(cell);
        }

        image.push(row);
        cells.push(cellRow);
    }
}

/* Colores de tu paleta */
function randomColor() {
    const palette = [
        "#C7E8F3", "#BF9ACA"
    ];
    return palette[Math.floor(Math.random() * palette.length)];
}


/* Seleccionar punto inicial */
function selectStart(cell, r, c) {
    if (running) return;

    clearMarks();
    start = { r, c };

    cell.classList.add("start");
    runButton.disabled = false;
}

/* Limpiar estados visuales */
function clearMarks() {
    document.querySelectorAll(".dfs-cell").forEach(c => {
        c.classList.remove("start", "visited", "active");
    });
}

/* Ejecutar flood fill */
async function runFloodFill() {
    if (!start || running) return;

    running = true;
    runButton.disabled = true;

    const ogColor = image[start.r][start.c];
    const newColor = "#5540BF";

    if (ogColor === newColor) {
        running = false;
        return;
    }

    await dfs(start.r, start.c, ogColor, newColor);

    running = false;
}

/* Tu DFS real con animación */
async function dfs(r, c, og, color) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    if (image[r][c] !== og) return;

    image[r][c] = color;

    const cell = cells[r][c];
    cell.classList.add("active");

    await delay();

    cell.classList.remove("active");
    cell.classList.add("visited");
    cell.style.backgroundColor = color;

    await dfs(r - 1, c, og, color);
    await dfs(r + 1, c, og, color);
    await dfs(r, c - 1, og, color);
    await dfs(r, c + 1, og, color);
}

/* Delay visual */
function delay() {
    return new Promise(resolve => setTimeout(resolve, animationDelay));
}


function resetGrid() {
    if (running) return;

    start = null;
    runButton.disabled = true;
    createImage();
}

function mapSpeedToDelay(speed) {
    // speed: 1 (lento) → 10 (rápido)
    return 550 - (speed * 50);
}


runButton.addEventListener("click", runFloodFill);
resetButton.addEventListener("click", resetGrid);
speedSlider.addEventListener("input", () => {
    speedValue.textContent = speedSlider.value;
    animationDelay = mapSpeedToDelay(speedSlider.value);
});



createImage();
