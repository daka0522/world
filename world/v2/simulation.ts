// --- Type Definitions ---
type Point = { x: number; y: number };
type RgbColor = { r: number; g: number; b: number };

// --- Canvas Setup ---
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!; // Non-null assertion: we know the canvas exists

// --- Info Display ---
const cellCountSpan = document.getElementById('cellCount')!;
const foodCountSpan = document.getElementById('foodCount')!;


// --- World Configuration ---
const GRID_SIZE = 30;       // Matches Python World(30)
const CANVAS_SIZE = 500;    // Matches Pygame size
const TILE_WIDTH = CANVAS_SIZE / GRID_SIZE;
const TILE_HEIGHT = CANVAS_SIZE / GRID_SIZE;
const MAX_CELLS = 30;       // Target number of cells
const MAX_FOOD = 30;        // Target number of food items
const CELL_MAX_AGE = 15;    // Increased max age slightly
const CELL_AGE_INTERVAL_MS = 3000; // How often age increases (e.g., 3 seconds)

// class World {
//     constructor() {

//     }
// }

canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

// --- Colors (using CSS color strings & RGB objects for manipulation) ---
const CELL_COLOR_STRINGS = [
    'rgb(255, 0, 0)',   // RED
    'rgb(0, 0, 255)',   // BLUE
    'rgb(0, 255, 0)',   // GREEN
    'rgb(255, 128, 0)', // ORANGE
    'rgb(128, 0, 128)'  // PURPLE
];
const FOOD_COLOR_STRING = 'rgb(255, 255, 0)'; // YELLOW
const BLACK = 'rgb(0, 0, 0)';
const WHITE = 'rgb(255, 255, 255)';

// --- World State ---
// Grid stores Cell, Food, or null (empty)
let worldSpaces: (Cell | Food | null)[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
let livingCells: Cell[] = [];
let livingFoods: Food[] = [];
let lifesEver: number = 0;
let foodsEver: number = 0;

// --- Utility Functions ---
function getRandomInt(max: number): number {
    return Math.floor(Math.random() * max);
}

function getRandomElement<T>(arr: T[]): T | null {
    if (!arr || arr.length === 0) return null;
    return arr[getRandomInt(arr.length)];
}

function parseRGB(rgbString: string): RgbColor | null {
    const result = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(rgbString);
    return result ? { r: parseInt(result[1]), g: parseInt(result[2]), b: parseInt(result[3]) } : null;
}

function formatRGB(rgbObject: RgbColor): string {
    // Clamp values between 0 and 255 and round
    const r = Math.max(0, Math.min(255, Math.round(rgbObject.r)));
    const g = Math.max(0, Math.min(255, Math.round(rgbObject.g)));
    const b = Math.max(0, Math.min(255, Math.round(rgbObject.b)));
    return `rgb(${r}, ${g}, ${b})`;
}

function getAvailableSpaces(): Point[] {
    const available: Point[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (worldSpaces[y][x] === null) {
                available.push({ y, x }); // Use y, x order consistent with grid access
            }
        }
    }
    return available;
}

// --- Base Entity Class (Optional, for common properties) ---
class Entity {
    x: number | null = null;
    y: number | null = null;
    alive: boolean = false;
    color: string = BLACK;
    name: string = "Entity";

    render() {
        if (!this.alive || this.x === null || this.y === null) return;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x * TILE_WIDTH, this.y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
    }
}

// --- Food Class ---
class Food extends Entity {
    constructor() {
        super(); // Call Entity constructor
        this.color = FOOD_COLOR_STRING;

        const available = getAvailableSpaces();
        const space = getRandomElement(available);

        if (space) {
            this.born(space.x, space.y);
        } else {
            console.warn("No available space for new Food");
            // Don't add if creation failed
        }
    }

    born(x: number, y: number): void {
        foodsEver++;
        this.name = `Food_${foodsEver}`;
        this.x = x;
        this.y = y;
        this.alive = true;
        worldSpaces[y][x] = this; // Place self in the world grid (y, x)
        livingFoods.push(this);
    }

    die(): void {
        if (!this.alive || this.x === null || this.y === null) return;

        // Remove from grid only if this food item is actually there
        if (worldSpaces[this.y][this.x] === this) {
            worldSpaces[this.y][this.x] = null;
        }

        this.alive = false;
        this.x = null;
        this.y = null;

        // Remove from the livingFoods list
        const index = livingFoods.indexOf(this);
        if (index > -1) {
            livingFoods.splice(index, 1);
        }
        // console.log(`${this.name} was eaten/removed.`);
    }
}


// --- Cell Class ---
class Cell extends Entity {
    age: number = 0;
    bornTime: number = performance.now();
    lastAgeUpdate: number = this.bornTime;
    // 0: up (-y), 1: right (+x), 2: down (+y), 3: left (-x)
    face: number = getRandomInt(4);

    constructor() {
        super();
        this.color = getRandomElement(CELL_COLOR_STRINGS) || RED; // Default to RED if random fails

        const available = getAvailableSpaces();
        const space = getRandomElement(available);

        if (space) {
            this.born(space.x, space.y);
        } else {
            console.warn("No available space for new Cell");
        }
    }

    born(x: number, y: number): void {
        lifesEver++;
        this.name = `Cell_${lifesEver}`;
        this.x = x;
        this.y = y;
        this.alive = true;
        this.bornTime = performance.now();
        this.lastAgeUpdate = this.bornTime;
        this.face = getRandomInt(4);
        worldSpaces[y][x] = this; // Place self in the world grid (y, x)
        livingCells.push(this);
    }

    die(): void {
        if (!this.alive || this.x === null || this.y === null) return;

        // console.log(`${this.name} dying at age ${this.age}`);
        if (worldSpaces[this.y][this.x] === this) {
            worldSpaces[this.y][this.x] = null;
        }
        this.alive = false;
        this.x = null;
        this.y = null;

        const index = livingCells.indexOf(this);
        if (index > -1) {
            livingCells.splice(index, 1);
        }
    }

    aging(): void {
        if (!this.alive) return;

        const now = performance.now();
        if (now - this.lastAgeUpdate >= CELL_AGE_INTERVAL_MS) {
            this.age++;
            this.lastAgeUpdate = now;

            // Fade color
            const rgb = parseRGB(this.color);
            if (rgb) {
                rgb.r *= 0.9;
                rgb.g *= 0.9;
                rgb.b *= 0.9;
                this.color = formatRGB(rgb);
            }

            // Check for death by old age
            if (this.age > CELL_MAX_AGE) {
                this.die();
            }
        }
    }

    searchToMove(): Point {
        let nextX = this.x!; // Use non-null assertion as cell must be alive to move
        let nextY = this.y!;

        if (this.face === 0) nextY--;      // Up
        else if (this.face === 1) nextX++; // Right
        else if (this.face === 2) nextY++; // Down
        else if (this.face === 3) nextX--; // Left

        return { x: nextX, y: nextY };
    }

    askNextMove(): void {
        if (!this.alive || this.x === null || this.y === null) return;

        const { x: nextX, y: nextY } = this.searchToMove();

        // 1. Check boundaries
        if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
            this.turnFace();
            return;
        }

        // 2. Check target space content
        const targetContent = worldSpaces[nextY][nextX];

        if (targetContent === null) { // Empty space -> Move
            this.move(nextX, nextY);
        } else if (targetContent instanceof Food) { // Food -> Eat
            this.eat(targetContent);
            // Note: The cell does NOT move onto the food square in the same turn it eats.
            // It consumes the food, the space becomes null, maybe it moves next turn.
            // If you want it to move *immediately* after eating, call this.move(nextX, nextY) here.
        } else { // Blocked by another cell (or unknown object) -> Turn
            this.turnFace();
        }
    }

    move(newX: number, newY: number): void {
        if (!this.alive || this.x === null || this.y === null) return;

        // Clear old position ONLY if it currently holds this cell
        if (worldSpaces[this.y][this.x] === this) {
            worldSpaces[this.y][this.x] = null;
        }

        // Update coordinates
        this.x = newX;
        this.y = newY;

        // Place in new position
        worldSpaces[newY][newX] = this;
    }

    turnFace(): void {
        if (!this.alive) return;
        let newFace = this.face;
        // Ensure the new face is different
        while (newFace === this.face) {
            newFace = getRandomInt(4);
        }
        this.face = newFace;
    }

    eat(food: Food): void {
        if (!this.alive) return;
        // console.log(`${this.name} eats ${food.name}`);
        food.die(); // Food removes itself from grid and list
        // Optional: Cell gains benefits (e.g., reset age, gain energy)
        // this.age = Math.max(0, this.age - 5); // Example: get younger
        // this.lastAgeUpdate = performance.now(); // Reset age timer
    }

    // Override render to potentially add cell-specific details later
    render() {
        super.render(); // Call base class render (draws the rectangle)

        // Optional: Render debug info like face direction
        // if (this.alive && this.x !== null && this.y !== null) {
        //     ctx.fillStyle = WHITE;
        //     ctx.font = "8px Arial";
        //     ctx.textAlign = "center";
        //     ctx.textBaseline = "middle";
        //     const centerX = (this.x + 0.5) * TILE_WIDTH;
        //     const centerY = (this.y + 0.5) * TILE_HEIGHT;
        //     let arrow = '?';
        //     if (this.face === 0) arrow = '^';
        //     else if (this.face === 1) arrow = '>';
        //     else if (this.face === 2) arrow = 'v';
        //     else if (this.face === 3) arrow = '<';
        //     ctx.fillText(arrow, centerX, centerY);
        // }
    }
}


// --- Game Loop & Simulation Logic ---
let lastTime = 0;
let simulationTimeAccumulator = 0;
const simulationUpdateInterval = 100; // Update simulation logic every 100ms (10 times per second)

function gameLoop(timestamp: number) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    simulationTimeAccumulator += deltaTime;

    // --- Update Simulation Logic (Throttled) ---
    while (simulationTimeAccumulator >= simulationUpdateInterval) {
        simulationTimeAccumulator -= simulationUpdateInterval;

        // Spawn new entities if below max count
        while (livingCells.length < MAX_CELLS && getAvailableSpaces().length > 0) {
            new Cell();
        }
        while (livingFoods.length < MAX_FOOD && getAvailableSpaces().length > 0) {
            new Food();
        }

        // Update living cells (use slice to iterate over a copy)
        livingCells.slice().forEach(cell => {
            if (cell.alive) { // Check if it didn't die during this update cycle
                cell.aging();
                 // Check alive status again after aging (might die of old age)
                if (cell.alive) {
                    cell.askNextMove();
                }
            }
        });

        // Update Food (if food had any active logic like rotting)
        // livingFoods.slice().forEach(food => { /* ... */ });

        // Update Info Display
        cellCountSpan.textContent = livingCells.length.toString();
        foodCountSpan.textContent = livingFoods.length.toString();
    }

    // --- Rendering (Every Frame) ---
    // Clear canvas
    ctx.fillStyle = BLACK;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Render Food first (so cells draw over them if overlapping temporarily)
    livingFoods.forEach(food => food.render());

    // Render Cells
    livingCells.forEach(cell => cell.render());


    // Request next frame
    requestAnimationFrame(gameLoop);
}

// --- Start the simulation ---
console.log("Starting simulation...");
requestAnimationFrame(gameLoop); // Start the loop