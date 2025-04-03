// Equivalent to main.py [cite: uploaded:py_version/main.py]

import { World, Cell, Food, Matter } from './core';
import { Color, ColorTuple } from './params';

// --- Simulation Setup ---
let worldSize = 10
let initialCells = 10
let initialFood = 0

let world = new World(worldSize);

// --- Visualization Setup (Placeholder) ---
const canvas = document.getElementById("worldCanvas") as HTMLCanvasElement

let tileWidth = canvas.width / world.width;
let tileHeight = canvas.height / world.height;

const worldSizeInput = document.getElementById("worldSizeCount") as HTMLInputElement;
const cellInput = document.getElementById("cellCount") as HTMLInputElement;
const foodInput = document.getElementById("foodCount") as HTMLInputElement;

let ctx: CanvasRenderingContext2D = canvas.getContext("2d")
let animationFrameId: number | null = null; // To stop the loop

let running = false; // Control the animation loop

function setupVisualization() {
    if (!canvas) {
        console.error("Canvas element with id 'worldCanvas' not found!");
        return;
    }
    // Get the device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width *=  dpr 
    canvas.height *= dpr

    if (!ctx) {
        console.error("Could not get 2D rendering context!");
        return;
    }

    ctx.scale(dpr, dpr)
    console.log("Canvas setup complete.");
}


function updateWorld() {
    worldSize = parseInt(worldSizeInput.value, 10) || 0
    world = new World(worldSize);
    tileWidth = canvas.width / world.width
    tileHeight = canvas.height / world.height
}

// Function to update the initial population based on user input
function updatePopulation() {
    // Parse user input and update initialCells and initialFood
    initialCells = parseInt(cellInput.value, 10) || 0;
    initialFood = parseInt(foodInput.value, 10) || 0;

    console.log(`Updated population: Cells = ${initialCells}, Food = ${initialFood}`);
}

function drawGrid() {
    if (!ctx) return

    ctx.strokeStyle = `rgb(${Color.WHITE.join(',')})`; // White lines
    ctx.lineWidth = 0.5; // Thin lines

    for (let x = 0; x <= canvas.width; x += tileWidth) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.width);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += tileHeight) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.height, y);
        ctx.stroke();
    }
}


function drawMatter(matter: Matter, colorOverride?: ColorTuple, renderDetails: boolean = false) {
    if (!ctx || !matter.isAlive || !matter.currentLocation) return;

    const [row, col] = matter.currentLocation;
    const x = col * tileWidth;
    const y = row * tileHeight;
    const matterColor = colorOverride || matter.color;

    // Draw rectangle for the matter
    ctx.fillStyle = `rgb(${matterColor.join(',')})`;
    ctx.fillRect(x, y, tileWidth, tileHeight);

    // Render details like name, energy, face (if Cell and requested)
    if (renderDetails && matter instanceof Cell) {
        ctx.fillStyle = `rgb(${Color.WHITE.join(',')})`; 
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        ctx.fillText(`${matter.name}`, x + 2, y + 2); // Show partial name if needed
        // ctx.fillText(`E:${matter.energy}`, x + 2, y + 14);
        // Optional: Draw face indicator
        drawFaceIndicator(ctx, x, y, tileWidth, tileHeight, matter.face);
    }
}

// Optional: Helper function to draw a direction indicator
function drawFaceIndicator(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, face: number | null) {
    if (face === null) return;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; // Semi-transparent black
    const cx = x + w / 2;
    const cy = y + h / 2;
    const indicatorSize = Math.min(w, h) / 4;
    switch (face) {
        case 0: ctx.fillRect(cx - indicatorSize/2, y + 1, indicatorSize, indicatorSize); break; // Top
        case 1: ctx.fillRect(x + w - indicatorSize - 1, cy - indicatorSize/2, indicatorSize, indicatorSize); break; // Right
        case 2: ctx.fillRect(cx - indicatorSize/2, y + h - indicatorSize - 1, indicatorSize, indicatorSize); break; // Bottom
        case 3: ctx.fillRect(x + 1, cy - indicatorSize/2, indicatorSize, indicatorSize); break; // Left
    }
}


// --- Simulation Logic ---

function populateWorld() {
    console.log("Populating world...");
    for (let i = 0; i < initialCells; i++) {
        new Cell(world); // Constructor handles placement
    }
    for (let i = 0; i < initialFood; i++) {
        new Food(world);
    }
    console.log(`World populated. Cells: ${world.matter["Cell"]?.length || 0}, Food: ${world.matter["Food"]?.length || 0}`);
}

function renderWrold(renderGrid: boolean = false) {
    // 1. Clear Canvas
    ctx.fillStyle = `rgb(${Color.BLACK.join(',')})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    if (renderGrid) {
        // drawGrid()÷
    }
}

function gameLoop() {
    if (!running || !ctx) {
         console.log("Stopping game loop.");
         if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
         }
        return;
    };

    // 1. Clear Canvas
    ctx.fillStyle = `rgb(${Color.BLACK.join(',')})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 2. Update game state
    // Iterate through a *copy* of the matter lists if elements might be removed during iteration
    const cellsToUpdate = [...(world.matter["Cell"] || [])];
    for (const matter of cellsToUpdate) {
        if (matter instanceof Cell && matter.isAlive) {
            matter.simpleAction(); // Use simple logic OR
            // matter.stepRL();     // Use RL logic
            // matter.aging();      // Apply aging
        }
    }

    // 3. Render
    // drawGrid();

    // Draw food first
    (world.matter["Food"] || []).forEach(food => {
        if (food instanceof Food) drawMatter(food, Color.YELLOW);
    });

    // Draw cells
    (world.matter["Cell"] || []).forEach(cell => {
        if (cell instanceof Cell) drawMatter(cell, cell.color, false)
    })

    // 4. Request next frame
    animationFrameId = requestAnimationFrame(gameLoop);
}


// --- Start/Stop Controls --- (Called from HTML)
setupVisualization(); // Ensure canvas is ready

function startGame() {
    if (running) return; // Prevent multiple starts
    console.log("Starting simulation...");

    // Update population values from user input
    updatePopulation();
    updateWorld()

    running = true;
    populateWorld();      // Initialize world state
    gameLoop();           // Start the animation loop
}

function stopGame() {
    console.log("Requesting simulation stop...");
    running = false; // Signal the loop to stop
    // The loop will stop itself on the next frame check
}

// --- Make functions accessible globally for HTML buttons ---
// If using modules (ES6 import/export), you need to explicitly attach them to the window object
declare global {
    interface Window {
        startGame: () => void;
        stopGame: () => void;
    }
}
window.startGame = startGame;
window.stopGame = stopGame;


// Optional: Automatically start on load, or wait for button click
// window.onload = startGame; // Example: Start automatically
console.log("main.ts loaded. Call startGame() to begin.");