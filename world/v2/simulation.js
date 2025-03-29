var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
// --- Canvas Setup ---
var canvas = document.getElementById('gameCanvas');
var ctx = canvas.getContext('2d'); // Non-null assertion: we know the canvas exists
// --- Info Display ---
var cellCountSpan = document.getElementById('cellCount');
var foodCountSpan = document.getElementById('foodCount');
// --- World Configuration ---
var GRID_SIZE = 30; // Matches Python World(30)
var CANVAS_SIZE = 500; // Matches Pygame size
var TILE_WIDTH = CANVAS_SIZE / GRID_SIZE;
var TILE_HEIGHT = CANVAS_SIZE / GRID_SIZE;
var MAX_CELLS = 30; // Target number of cells
var MAX_FOOD = 30; // Target number of food items
var CELL_MAX_AGE = 15; // Increased max age slightly
var CELL_AGE_INTERVAL_MS = 3000; // How often age increases (e.g., 3 seconds)
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;
// --- Colors (using CSS color strings & RGB objects for manipulation) ---
var CELL_COLOR_STRINGS = [
    'rgb(255, 0, 0)', // RED
    'rgb(0, 0, 255)', // BLUE
    'rgb(0, 255, 0)', // GREEN
    'rgb(255, 128, 0)', // ORANGE
    'rgb(128, 0, 128)' // PURPLE
];
var FOOD_COLOR_STRING = 'rgb(255, 255, 0)'; // YELLOW
var BLACK = 'rgb(0, 0, 0)';
var WHITE = 'rgb(255, 255, 255)';
// --- World State ---
// Grid stores Cell, Food, or null (empty)
var worldSpaces = Array(GRID_SIZE).fill(null).map(function () { return Array(GRID_SIZE).fill(null); });
var livingCells = [];
var livingFoods = [];
var lifesEver = 0;
var foodsEver = 0;
// --- Utility Functions ---
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
function getRandomElement(arr) {
    if (!arr || arr.length === 0)
        return null;
    return arr[getRandomInt(arr.length)];
}
function parseRGB(rgbString) {
    var result = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(rgbString);
    return result ? { r: parseInt(result[1]), g: parseInt(result[2]), b: parseInt(result[3]) } : null;
}
function formatRGB(rgbObject) {
    // Clamp values between 0 and 255 and round
    var r = Math.max(0, Math.min(255, Math.round(rgbObject.r)));
    var g = Math.max(0, Math.min(255, Math.round(rgbObject.g)));
    var b = Math.max(0, Math.min(255, Math.round(rgbObject.b)));
    return "rgb(".concat(r, ", ").concat(g, ", ").concat(b, ")");
}
function getAvailableSpaces() {
    var available = [];
    for (var y = 0; y < GRID_SIZE; y++) {
        for (var x = 0; x < GRID_SIZE; x++) {
            if (worldSpaces[y][x] === null) {
                available.push({ y: y, x: x }); // Use y, x order consistent with grid access
            }
        }
    }
    return available;
}
// --- Base Entity Class (Optional, for common properties) ---
var Entity = /** @class */ (function () {
    function Entity() {
        this.x = null;
        this.y = null;
        this.alive = false;
        this.color = BLACK;
        this.name = "Entity";
    }
    Entity.prototype.render = function () {
        if (!this.alive || this.x === null || this.y === null)
            return;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x * TILE_WIDTH, this.y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
    };
    return Entity;
}());
// --- Food Class ---
var Food = /** @class */ (function (_super) {
    __extends(Food, _super);
    function Food() {
        var _this = _super.call(this) || this; // Call Entity constructor
        _this.color = FOOD_COLOR_STRING;
        var available = getAvailableSpaces();
        var space = getRandomElement(available);
        if (space) {
            _this.born(space.x, space.y);
        }
        else {
            console.warn("No available space for new Food");
            // Don't add if creation failed
        }
        return _this;
    }
    Food.prototype.born = function (x, y) {
        foodsEver++;
        this.name = "Food_".concat(foodsEver);
        this.x = x;
        this.y = y;
        this.alive = true;
        worldSpaces[y][x] = this; // Place self in the world grid (y, x)
        livingFoods.push(this);
    };
    Food.prototype.die = function () {
        if (!this.alive || this.x === null || this.y === null)
            return;
        // Remove from grid only if this food item is actually there
        if (worldSpaces[this.y][this.x] === this) {
            worldSpaces[this.y][this.x] = null;
        }
        this.alive = false;
        this.x = null;
        this.y = null;
        // Remove from the livingFoods list
        var index = livingFoods.indexOf(this);
        if (index > -1) {
            livingFoods.splice(index, 1);
        }
        // console.log(`${this.name} was eaten/removed.`);
    };
    return Food;
}(Entity));
// --- Cell Class ---
var Cell = /** @class */ (function (_super) {
    __extends(Cell, _super);
    function Cell() {
        var _this = _super.call(this) || this;
        _this.age = 0;
        _this.bornTime = performance.now();
        _this.lastAgeUpdate = _this.bornTime;
        // 0: up (-y), 1: right (+x), 2: down (+y), 3: left (-x)
        _this.face = getRandomInt(4);
        _this.color = getRandomElement(CELL_COLOR_STRINGS) || RED; // Default to RED if random fails
        var available = getAvailableSpaces();
        var space = getRandomElement(available);
        if (space) {
            _this.born(space.x, space.y);
        }
        else {
            console.warn("No available space for new Cell");
        }
        return _this;
    }
    Cell.prototype.born = function (x, y) {
        lifesEver++;
        this.name = "Cell_".concat(lifesEver);
        this.x = x;
        this.y = y;
        this.alive = true;
        this.bornTime = performance.now();
        this.lastAgeUpdate = this.bornTime;
        this.face = getRandomInt(4);
        worldSpaces[y][x] = this; // Place self in the world grid (y, x)
        livingCells.push(this);
    };
    Cell.prototype.die = function () {
        if (!this.alive || this.x === null || this.y === null)
            return;
        // console.log(`${this.name} dying at age ${this.age}`);
        if (worldSpaces[this.y][this.x] === this) {
            worldSpaces[this.y][this.x] = null;
        }
        this.alive = false;
        this.x = null;
        this.y = null;
        var index = livingCells.indexOf(this);
        if (index > -1) {
            livingCells.splice(index, 1);
        }
    };
    Cell.prototype.aging = function () {
        if (!this.alive)
            return;
        var now = performance.now();
        if (now - this.lastAgeUpdate >= CELL_AGE_INTERVAL_MS) {
            this.age++;
            this.lastAgeUpdate = now;
            // Fade color
            var rgb = parseRGB(this.color);
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
    };
    Cell.prototype.searchToMove = function () {
        var nextX = this.x; // Use non-null assertion as cell must be alive to move
        var nextY = this.y;
        if (this.face === 0)
            nextY--; // Up
        else if (this.face === 1)
            nextX++; // Right
        else if (this.face === 2)
            nextY++; // Down
        else if (this.face === 3)
            nextX--; // Left
        return { x: nextX, y: nextY };
    };
    Cell.prototype.askNextMove = function () {
        if (!this.alive || this.x === null || this.y === null)
            return;
        var _a = this.searchToMove(), nextX = _a.x, nextY = _a.y;
        // 1. Check boundaries
        if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
            this.turnFace();
            return;
        }
        // 2. Check target space content
        var targetContent = worldSpaces[nextY][nextX];
        if (targetContent === null) { // Empty space -> Move
            this.move(nextX, nextY);
        }
        else if (targetContent instanceof Food) { // Food -> Eat
            this.eat(targetContent);
            // Note: The cell does NOT move onto the food square in the same turn it eats.
            // It consumes the food, the space becomes null, maybe it moves next turn.
            // If you want it to move *immediately* after eating, call this.move(nextX, nextY) here.
        }
        else { // Blocked by another cell (or unknown object) -> Turn
            this.turnFace();
        }
    };
    Cell.prototype.move = function (newX, newY) {
        if (!this.alive || this.x === null || this.y === null)
            return;
        // Clear old position ONLY if it currently holds this cell
        if (worldSpaces[this.y][this.x] === this) {
            worldSpaces[this.y][this.x] = null;
        }
        // Update coordinates
        this.x = newX;
        this.y = newY;
        // Place in new position
        worldSpaces[newY][newX] = this;
    };
    Cell.prototype.turnFace = function () {
        if (!this.alive)
            return;
        var newFace = this.face;
        // Ensure the new face is different
        while (newFace === this.face) {
            newFace = getRandomInt(4);
        }
        this.face = newFace;
    };
    Cell.prototype.eat = function (food) {
        if (!this.alive)
            return;
        // console.log(`${this.name} eats ${food.name}`);
        food.die(); // Food removes itself from grid and list
        // Optional: Cell gains benefits (e.g., reset age, gain energy)
        // this.age = Math.max(0, this.age - 5); // Example: get younger
        // this.lastAgeUpdate = performance.now(); // Reset age timer
    };
    // Override render to potentially add cell-specific details later
    Cell.prototype.render = function () {
        _super.prototype.render.call(this); // Call base class render (draws the rectangle)
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
    };
    return Cell;
}(Entity));
// --- Game Loop & Simulation Logic ---
var lastTime = 0;
var simulationTimeAccumulator = 0;
var simulationUpdateInterval = 100; // Update simulation logic every 100ms (10 times per second)
function gameLoop(timestamp) {
    var deltaTime = timestamp - lastTime;
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
        livingCells.slice().forEach(function (cell) {
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
    livingFoods.forEach(function (food) { return food.render(); });
    // Render Cells
    livingCells.forEach(function (cell) { return cell.render(); });
    // Request next frame
    requestAnimationFrame(gameLoop);
}
// --- Start the simulation ---
console.log("Starting simulation...");
requestAnimationFrame(gameLoop); // Start the loop
