/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/core.ts":
/*!*********************!*\
  !*** ./src/core.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Cell: () => (/* binding */ Cell),
/* harmony export */   Food: () => (/* binding */ Food),
/* harmony export */   Matter: () => (/* binding */ Matter),
/* harmony export */   World: () => (/* binding */ World)
/* harmony export */ });
/* harmony import */ var _params__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./params */ "./src/params.ts");


class World {
    width;
    height;
    spaces;
    matter; // Dictionary equivalent
    matterCount;
    constructor(size) {
        this.width = size;
        this.height = size;
        this.spaces = Array(this.height).fill(0).map(() => Array(this.width).fill(0));
        this.matter = { "Cell": [], "Food": [] };
        this.matterCount = { Cell: 0, "Food": 0 };
    }
    getFreeSpaces() {
        const freeSpaces = [];
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                if (this.spaces[row][col] === 0) {
                    freeSpaces.push([row, col]);
                }
            }
        }
        return freeSpaces;
    }
    getRandomFreeSpace() {
        const freeSpaces = this.getFreeSpaces();
        if (freeSpaces.length === 0) {
            return null;
        }
        else {
            const randomIndex = Math.floor(Math.random() * freeSpaces.length);
            return freeSpaces[randomIndex];
        }
    }
    // Helper to check if location is within bounds
    isWithinBounds(location) {
        const isNotNull = location !== null;
        const isInHeight = location[0] >= 0 && location[0] < this.height;
        const isInWidth = location[1] >= 0 && location[1] < this.width;
        return isNotNull && isInHeight && isInWidth;
    }
    // Helper to get object at location
    getObjectAt(location) {
        if (this.isWithinBounds(location)) {
            return this.spaces[location[0]][location[1]];
        }
        else {
            return null;
        }
    }
}
class Matter {
    world;
    isAlive = false;
    currentLocation = null;
    color = _params__WEBPACK_IMPORTED_MODULE_0__.Color.BLACK;
    age = 0;
    bornTime = 0.0;
    name = '';
    className;
    constructor(world) {
        this.world = world;
        this.className = this.constructor.name;
        const freeSpace = this.world.getRandomFreeSpace();
        if (freeSpace) {
            this.born(freeSpace);
        }
        else {
            console.warn("No free space for new Matter");
            // Decide how to handle no space - maybe throw error or return null/undefined
        }
    }
    born(location) {
        if (!location || this.world.spaces[location[0]][location[1]] !== 0) {
            console.error("Cannot born Matter at occupied or invalid location: ", location);
            throw Error("Cannot born Matter at occupied or invalid location");
        }
        else {
            this.world.spaces[location[0]][location[1]] == this;
            // Initialize matter type array if not exists
            if (!this.world.matter[this.className]) {
                this.world.matter[this.className] = [];
                this.world.matterCount[this.className] = 0;
            }
            this.world.matter[this.className].push(this);
            this.world.matterCount[this.className]++;
            this.isAlive = true;
            this.currentLocation = location;
            this.bornTime = Date.now();
            this.name = `${this.className}_${this.world.matterCount[this.className]}`;
            this.color = _params__WEBPACK_IMPORTED_MODULE_0__.Color.getRandomColor(0, 255);
        }
    }
    die() {
        if (this.isAlive && this.currentLocation) {
            const [row, col] = this.currentLocation;
            if (this.world.spaces[row][col] === this) {
                this.world.spaces[row][col] = 0; // set space empty back
            }
            if (this.world.matter[this.className]) {
                const index = this.world.matter[this.className].indexOf(this);
                if (index > -1) {
                    this.world.matter[this.className].splice(index, 1);
                }
            }
            this.isAlive = false;
            this.color = _params__WEBPACK_IMPORTED_MODULE_0__.Color.BLACK;
            this.currentLocation = null;
        }
    }
}
class Food extends Matter {
    energy = 20;
    constructor(world) {
        super(world);
    }
}
class Cell extends Matter {
    face = null;
    energy = 30;
    MAX_ENERGY = 100;
    // States: {0: Empty, 1: Other Cell, 2: Food, 3: Wall(out boundary)}
    states = [0, 1, 2, 3];
    // Actions: {0: turn_face, 1: go} - map index to action name
    actions = ["turn_face", "go"];
    // Memory for RL: state * action matrix
    memory; // rows=states, cols=actions
    constructor(world) {
        super(world); // Calls Matter constructor, which calls born()
        // Initialize memory after maybe birth
        if (this.isAlive) {
            this.face = Math.floor(Math.random() * 4);
        }
        // Initialize memory matrix with zeros
        this.memory = Array(this.states.length).fill(0).map(() => Array(this.actions.length).fill(0));
    }
    senseFront(senseReach = 1) {
        if (this.currentLocation === null || this.face === null) {
            return null;
        }
        const [row, col] = this.currentLocation;
        let nextR = row;
        let nextC = col;
        switch (this.face) {
            case 0:
                nextR -= senseReach;
                break; // Front
            case 1:
                nextC += senseReach;
                break; // RIght
            case 2:
                nextR += senseReach;
                break; // Back
            case 3:
                nextC -= senseReach;
                break; // Left 
            default:
                console.error("Invalid face:", this.face);
                return null;
        }
        return [nextR, nextC];
    }
    // Simple decision logic (like ask_next_move in Python)
    simpleAction() {
        if (!this.isAlive)
            return;
        const nextLocation = this.senseFront();
        const whatsNext = this.askWhatsNext(nextLocation);
        switch (whatsNext) {
            case 0: // Empty
                this.move(nextLocation);
                break;
            case 2: // Food
                const obj = this.world.getObjectAt(nextLocation);
                if (obj instanceof Food) {
                    this.eat(obj);
                }
                else { // Should not happen if askWhatsNext is correct, but safe check
                    this.turnFace();
                }
                break;
            case 1: // Cell
            case 3: // Wall
            default: // Includes null (out of bounds)
                this.turnFace();
                break;
        }
        this.energy -= 1; // Energy consumption per action attempt
        // Add aging logic if needed
        // this.checkEnergy();
    }
    checkEnergy() {
        if (this.energy <= 0) {
            this.die();
        }
    }
    // --- RL Functions ---
    askWhatsNext(location) {
        if (!this.world.isWithinBounds(location)) {
            return 3; // Wall/Out of bounds
        }
        const obj = this.world.getObjectAt(location);
        if (obj === 0)
            return 0; // Empty
        if (obj instanceof Cell)
            return 1; // Another Cell
        if (obj instanceof Food)
            return 2; // Food
        return null; // Should not happen
    }
    // Corresponds to RL Function 2: expect
    expectReward(state) {
        if (state >= 0 && state < this.memory.length) {
            return this.memory[state]; // Returns the action rewards array for this state
        }
        console.error("Invalid state for expectation:", state);
        return Array(this.actions.length).fill(0); // Return default if state is invalid
    }
    // Corresponds to RL Function 3: best_action
    chooseAction(stateRewards, epsilon = 0.1) {
        // Epsilon-greedy
        if (Math.random() < epsilon || stateRewards.every(r => r === 0)) {
            // Explore: Choose random action
            return Math.floor(Math.random() * this.actions.length);
        }
        else {
            // Exploit: Choose action with max reward
            // Find index of max value. If ties, picks first one.
            return stateRewards.indexOf(Math.max(...stateRewards));
        }
    }
    // Corresponds to RL Function 4: do_action
    performAction(actionIndex, state, nextLocation) {
        const actionName = this.actions[actionIndex];
        let reward = 0;
        switch (actionName) {
            case "turn_face":
                this.turnFace();
                reward = 0; // Or a small negative reward for not progressing?
                break;
            case "go":
                reward = this.go(state, nextLocation);
                break;
            default:
                console.error("Invalid action index:", actionIndex);
                break;
        }
        this.energy -= 1; // Consume energy per action
        this.checkEnergy();
        return reward;
    }
    // Corresponds to RL Function 5: remember
    remember(state, actionIndex, reward) {
        if (state >= 0 && state < this.memory.length && actionIndex >= 0 && actionIndex < this.actions.length) {
            this.memory[state][actionIndex] += reward;
        }
        else {
            console.error("Invalid state or action index for memory update:", state, actionIndex);
        }
    }
    // Corresponds to RL Function - private _go
    go(state, nextLocation) {
        let reward = 0;
        switch (state) {
            case 0: // Empty
                if (nextLocation)
                    this.move(nextLocation);
                reward = 1; // Reward for moving to empty space
                break;
            case 2: // Food
                const obj = nextLocation ? this.world.getObjectAt(nextLocation) : null;
                if (obj instanceof Food) {
                    this.eat(obj); // eat() implicitly moves the cell to food's location
                    reward = 10; // High reward for eating
                }
                else {
                    // Cell thought it was food, but it wasn't (e.g., disappeared). Turn?
                    this.turnFace();
                    reward = -1; // Penalty for failed action
                }
                break;
            case 1: // Cell
            case 3: // Wall
            default: // Includes invalid states or failed moves
                this.turnFace();
                reward = -1; // Penalty for bumping or invalid move
                break;
        }
        return reward;
    }
    // --- Standard Actions ---
    move(newLocation) {
        if (!this.isAlive || !newLocation || !this.world.isWithinBounds(newLocation)) {
            // console.warn("Cannot move: Cell dead, location invalid or out of bounds");
            return;
        }
        const targetObj = this.world.getObjectAt(newLocation);
        if (targetObj !== 0) {
            // console.warn("Cannot move to occupied space:", newLocation);
            // Optional: turn face instead?
            this.turnFace();
            return;
        }
        // Clear old location in world grid
        if (this.currentLocation) {
            const [oldR, oldC] = this.currentLocation;
            if (this.world.getObjectAt([oldR, oldC]) === this) {
                this.world.spaces[oldR][oldC] = 0;
            }
        }
        // Update world grid with new location
        const [newR, newC] = newLocation;
        this.world.spaces[newR][newC] = this;
        // Update cell's current location
        this.currentLocation = newLocation;
        // Note: Energy consumption is handled in performAction or simpleAction
        // Note: Aging is not implemented here yet
    }
    turnFace(newFace) {
        if (!this.isAlive)
            return;
        if (newFace !== undefined && newFace >= 0 && newFace <= 3) {
            this.face = newFace;
        }
        else {
            // Turn randomly, excluding current direction
            const possibleFaces = [0, 1, 2, 3];
            const currentFaceIndex = possibleFaces.indexOf(this.face);
            if (currentFaceIndex > -1) {
                possibleFaces.splice(currentFaceIndex, 1); // Remove current face
            }
            this.face = possibleFaces[Math.floor(Math.random() * possibleFaces.length)];
        }
        // Note: Energy consumption handled elsewhere
    }
    eat(food) {
        if (!this.isAlive || !food.isAlive || !food.currentLocation)
            return;
        // Clear old location
        if (this.currentLocation) {
            const [oldR, oldC] = this.currentLocation;
            if (this.world.getObjectAt([oldR, oldC]) === this) {
                this.world.spaces[oldR][oldC] = 0;
            }
        }
        // Move to food's location
        const foodLocation = food.currentLocation;
        this.currentLocation = foodLocation;
        this.world.spaces[foodLocation[0]][foodLocation[1]] = this; // Take the spot
        // Consume food energy
        this.energy += food.energy;
        if (this.energy > this.MAX_ENERGY) {
            this.energy = this.MAX_ENERGY;
        }
        // Food dies
        food.die();
        // Note: Energy gain handled here, consumption handled in action logic
    }
    // Example Aging (call periodically)
    aging() {
        if (!this.isAlive)
            return;
        // Simple time-based aging - adjust logic as needed
        const elapsedTime = (Date.now() - this.bornTime) / 1000; // Time in seconds
        // Example: Age increases every 5 seconds
        const newAge = Math.floor(elapsedTime / 5);
        if (newAge > this.age) {
            this.age = newAge;
            // Optional: Dim color slightly
            // this.color = this.color.map(c => Math.max(0, Math.floor(c * 0.975))) as ColorTuple;
            if (this.age > 100) { // Example lifespan
                this.die();
            }
        }
    }
    // RL Step combined
    stepRL() {
        if (!this.isAlive)
            return;
        const nextLocation = this.senseFront();
        const nextState = this.askWhatsNext(nextLocation);
        if (nextState !== null) {
            const stateRewards = this.expectReward(nextState);
            const actionIndex = this.chooseAction(stateRewards); // Use epsilon-greedy
            const reward = this.performAction(actionIndex, nextState, nextLocation);
            this.remember(nextState, actionIndex, reward);
            // console.log(`Cell: ${this.name}, State: ${nextState}, Action: ${this.actions[actionIndex]}, Reward: ${reward}, Mem: ${JSON.stringify(this.memory[nextState])}`);
        }
        else {
            // Handle cases where next state couldn't be determined (should be rare)
            this.turnFace(); // Default action if state is uncertain
            // this.energy -=1; // Consume energy
            // this.checkEnergy();
        }
        // Call aging periodically if needed
        // this.aging();
    }
}


/***/ }),

/***/ "./src/params.ts":
/*!***********************!*\
  !*** ./src/params.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Color: () => (/* binding */ Color)
/* harmony export */ });
// Equivalent to params.py [cite: uploaded:py_version/params.py]
class Color {
    static WHITE = [255, 255, 255];
    static YELLOW = [255, 255, 0];
    static RED = [255, 0, 0];
    static BLUE = [0, 0, 255];
    static GREEN = [0, 255, 0];
    static BLACK = [0, 0, 0];
    static ORANGE = [255, 128, 0];
    static PURPLE = [128, 0, 128];
    static COLORS = [
        Color.WHITE, Color.YELLOW, Color.RED, Color.BLUE,
        Color.GREEN, Color.ORANGE, Color.PURPLE
    ];
    static getRandomColorInset() {
        const randomIndex = Math.floor(Math.random() * Color.COLORS.length);
        return Color.COLORS[randomIndex];
    }
    static getRandomColor(min, max) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return [getRandomIntInclusive(min, max), getRandomIntInclusive(min, max), getRandomIntInclusive(min, max)];
    }
}
function getRandomIntInclusive(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // The maximum is inclusive and the minimum is inclusive
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./core */ "./src/core.ts");
/* harmony import */ var _params__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./params */ "./src/params.ts");
// Equivalent to main.py [cite: uploaded:py_version/main.py]


// --- Simulation Setup ---
let worldSize = 10;
let initialCells = 10;
let initialFood = 0;
let world = new _core__WEBPACK_IMPORTED_MODULE_0__.World(worldSize);
// --- Visualization Setup (Placeholder) ---
const canvas = document.getElementById("worldCanvas");
let tileWidth = canvas.width / world.width;
let tileHeight = canvas.height / world.height;
const worldSizeInput = document.getElementById("worldSizeCount");
const cellInput = document.getElementById("cellCount");
const foodInput = document.getElementById("foodCount");
let ctx = canvas.getContext("2d");
let ctx2 = canvas.getContext("2d");
let animationFrameId = null; // To stop the loop
let running = false; // Control the animation loop
function setupVisualization() {
    if (!canvas) {
        console.error("Canvas element with id 'worldCanvas' not found!");
        return;
    }
    // Get the device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width *= dpr;
    canvas.height *= dpr;
    if (!ctx) {
        console.error("Could not get 2D rendering context!");
        return;
    }
    ctx.scale(dpr, dpr);
    console.log("Canvas setup complete.");
}
function updateWorld() {
    worldSize = parseInt(worldSizeInput.value, 10) || 0;
    world = new _core__WEBPACK_IMPORTED_MODULE_0__.World(worldSize);
    tileWidth = canvas.width / world.width;
    tileHeight = canvas.height / world.height;
}
// Function to update the initial population based on user input
function updatePopulation() {
    // Parse user input and update initialCells and initialFood
    initialCells = parseInt(cellInput.value, 10) || 0;
    initialFood = parseInt(foodInput.value, 10) || 0;
    console.log(`Updated population: Cells = ${initialCells}, Food = ${initialFood}`);
}
function drawGrid() {
    if (!ctx)
        return;
    ctx.strokeStyle = `rgb(${_params__WEBPACK_IMPORTED_MODULE_1__.Color.WHITE.join(',')})`; // White lines
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
function drawMatter(matter, colorOverride, renderDetails = false) {
    if (!ctx || !matter.isAlive || !matter.currentLocation)
        return;
    const [row, col] = matter.currentLocation;
    const x = col * tileWidth;
    const y = row * tileHeight;
    const matterColor = colorOverride || matter.color;
    // Draw rectangle for the matter
    ctx.fillStyle = `rgb(${matterColor.join(',')})`;
    ctx.fillRect(x, y, tileWidth, tileHeight);
    // Render details like name, energy, face (if Cell and requested)
    if (renderDetails && matter instanceof _core__WEBPACK_IMPORTED_MODULE_0__.Cell) {
        ctx.fillStyle = `rgb(${_params__WEBPACK_IMPORTED_MODULE_1__.Color.WHITE.join(',')})`;
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
function drawFaceIndicator(ctx, x, y, w, h, face) {
    if (face === null)
        return;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; // Semi-transparent black
    const cx = x + w / 2;
    const cy = y + h / 2;
    const indicatorSize = Math.min(w, h) / 4;
    switch (face) {
        case 0:
            ctx.fillRect(cx - indicatorSize / 2, y + 1, indicatorSize, indicatorSize);
            break; // Top
        case 1:
            ctx.fillRect(x + w - indicatorSize - 1, cy - indicatorSize / 2, indicatorSize, indicatorSize);
            break; // Right
        case 2:
            ctx.fillRect(cx - indicatorSize / 2, y + h - indicatorSize - 1, indicatorSize, indicatorSize);
            break; // Bottom
        case 3:
            ctx.fillRect(x + 1, cy - indicatorSize / 2, indicatorSize, indicatorSize);
            break; // Left
    }
}
// --- Simulation Logic ---
function populateWorld() {
    console.log("Populating world...");
    for (let i = 0; i < initialCells; i++) {
        new _core__WEBPACK_IMPORTED_MODULE_0__.Cell(world); // Constructor handles placement
    }
    for (let i = 0; i < initialFood; i++) {
        new _core__WEBPACK_IMPORTED_MODULE_0__.Food(world);
    }
    console.log(`World populated. Cells: ${world.matter["Cell"]?.length || 0}, Food: ${world.matter["Food"]?.length || 0}`);
}
function renderWrold(renderGrid = false) {
    // 1. Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgb(${_params__WEBPACK_IMPORTED_MODULE_1__.Color.BLACK.join(',')})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    }
    ;
    // 1. Clear Canvas
    renderWrold();
    // 2. Update game state
    // Iterate through a *copy* of the matter lists if elements might be removed during iteration
    const cellsToUpdate = [...(world.matter["Cell"] || [])];
    for (const matter of cellsToUpdate) {
        if (matter instanceof _core__WEBPACK_IMPORTED_MODULE_0__.Cell && matter.isAlive) {
            matter.simpleAction(); // Use simple logic OR
            // matter.stepRL();     // Use RL logic
            // matter.aging();      // Apply aging
        }
    }
    // 3. Render
    // drawGrid();
    // Draw food first
    (world.matter["Food"] || []).forEach(food => {
        if (food instanceof _core__WEBPACK_IMPORTED_MODULE_0__.Food)
            drawMatter(food, _params__WEBPACK_IMPORTED_MODULE_1__.Color.YELLOW);
    });
    // Draw cells
    (world.matter["Cell"] || []).forEach(cell => {
        if (cell instanceof _core__WEBPACK_IMPORTED_MODULE_0__.Cell)
            drawMatter(cell, cell.color, false);
    });
    // 4. Request next frame
    animationFrameId = requestAnimationFrame(gameLoop);
}
// --- Start/Stop Controls --- (Called from HTML)
// setupVisualization(); // DPR change cause some errors that outside of canvas
function startGame() {
    if (running)
        return; // Prevent multiple starts
    console.log("Starting simulation...");
    // Update population values from user input
    updatePopulation();
    updateWorld();
    running = true;
    populateWorld(); // Initialize world state
    gameLoop(); // Start the animation loop
}
function stopGame() {
    console.log("Requesting simulation stop...");
    running = false; // Signal the loop to stop
    // The loop will stop itself on the next frame check
}
window.startGame = startGame;
window.stopGame = stopGame;
// Optional: Automatically start on load, or wait for button click
// window.onload = startGame; // Example: Start automatically
console.log("main.ts loaded. Call startGame() to begin.");

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFpQztBQUNJO0FBQ3JDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEIsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBLDBCQUEwQixtQkFBbUI7QUFDN0MsOEJBQThCLGtCQUFrQjtBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWSwwQ0FBSztBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsZUFBZSxHQUFHLHVDQUF1QztBQUNwRix5QkFBeUIsMENBQUs7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaURBQWlEO0FBQ2pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUIsMENBQUs7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBLGlCQUFpQixxQkFBcUI7QUFDdEM7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCO0FBQ3ZCO0FBQ0E7QUFDQSx1QkFBdUI7QUFDdkI7QUFDQTtBQUNBLHVCQUF1QjtBQUN2QjtBQUNBO0FBQ0EsdUJBQXVCO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QjtBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEI7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQSxzQkFBc0I7QUFDdEI7QUFDQSxzQkFBc0I7QUFDdEI7QUFDQSxzQkFBc0I7QUFDdEIscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUNBQXVDO0FBQ3ZDO0FBQ0E7QUFDQSxtREFBbUQ7QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNEJBQTRCO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEI7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFBNEI7QUFDNUI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUM7QUFDbkMsaUNBQWlDO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJEQUEyRDtBQUMzRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvRUFBb0U7QUFDcEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlFQUFpRTtBQUNqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0M7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUVBQWlFO0FBQ2pFO0FBQ0E7QUFDQSxvQ0FBb0MsVUFBVSxXQUFXLFVBQVUsWUFBWSwwQkFBMEIsWUFBWSxPQUFPLFNBQVMsdUNBQXVDO0FBQzVLO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QixnQ0FBZ0M7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7QUMvWUE7QUFDTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUZBQWlGO0FBQ2pGOzs7Ozs7O1VDNUJBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7Ozs7O0FDTkE7QUFDMkM7QUFDVjtBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQix3Q0FBSztBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0IscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQix3Q0FBSztBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0NBQStDLGFBQWEsV0FBVyxZQUFZO0FBQ25GO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCLDBDQUFLLGlCQUFpQixJQUFJO0FBQ3ZELHlCQUF5QjtBQUN6QixvQkFBb0IsbUJBQW1CO0FBQ3ZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0Isb0JBQW9CO0FBQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsc0JBQXNCO0FBQ2pEO0FBQ0E7QUFDQSwyQ0FBMkMsdUNBQUk7QUFDL0MsK0JBQStCLDBDQUFLLGlCQUFpQjtBQUNyRDtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsWUFBWSxrQkFBa0I7QUFDdEQsNkJBQTZCLGNBQWM7QUFDM0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QztBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBLG1CQUFtQjtBQUNuQjtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQixrQkFBa0I7QUFDdEMsWUFBWSx1Q0FBSSxTQUFTO0FBQ3pCO0FBQ0Esb0JBQW9CLGlCQUFpQjtBQUNyQyxZQUFZLHVDQUFJO0FBQ2hCO0FBQ0EsMkNBQTJDLGtDQUFrQyxVQUFVLGtDQUFrQztBQUN6SDtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQiwwQ0FBSyxpQkFBaUI7QUFDakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOEJBQThCLHVDQUFJO0FBQ2xDLG1DQUFtQztBQUNuQyxvQ0FBb0M7QUFDcEMsb0NBQW9DO0FBQ3BDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRCQUE0Qix1Q0FBSTtBQUNoQyw2QkFBNkIsMENBQUs7QUFDbEMsS0FBSztBQUNMO0FBQ0E7QUFDQSw0QkFBNEIsdUNBQUk7QUFDaEM7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhCQUE4QjtBQUM5QiIsInNvdXJjZXMiOlsid2VicGFjazovL3RzX3ZlcnNpb24vLi9zcmMvY29yZS50cyIsIndlYnBhY2s6Ly90c192ZXJzaW9uLy4vc3JjL3BhcmFtcy50cyIsIndlYnBhY2s6Ly90c192ZXJzaW9uL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3RzX3ZlcnNpb24vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL3RzX3ZlcnNpb24vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly90c192ZXJzaW9uL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vdHNfdmVyc2lvbi8uL3NyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbG9yIH0gZnJvbSBcIi4vcGFyYW1zXCI7XG5leHBvcnQgeyBXb3JsZCwgTWF0dGVyLCBDZWxsLCBGb29kIH07XG5jbGFzcyBXb3JsZCB7XG4gICAgd2lkdGg7XG4gICAgaGVpZ2h0O1xuICAgIHNwYWNlcztcbiAgICBtYXR0ZXI7IC8vIERpY3Rpb25hcnkgZXF1aXZhbGVudFxuICAgIG1hdHRlckNvdW50O1xuICAgIGNvbnN0cnVjdG9yKHNpemUpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHNpemU7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gc2l6ZTtcbiAgICAgICAgdGhpcy5zcGFjZXMgPSBBcnJheSh0aGlzLmhlaWdodCkuZmlsbCgwKS5tYXAoKCkgPT4gQXJyYXkodGhpcy53aWR0aCkuZmlsbCgwKSk7XG4gICAgICAgIHRoaXMubWF0dGVyID0geyBcIkNlbGxcIjogW10sIFwiRm9vZFwiOiBbXSB9O1xuICAgICAgICB0aGlzLm1hdHRlckNvdW50ID0geyBDZWxsOiAwLCBcIkZvb2RcIjogMCB9O1xuICAgIH1cbiAgICBnZXRGcmVlU3BhY2VzKCkge1xuICAgICAgICBjb25zdCBmcmVlU3BhY2VzID0gW107XG4gICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHRoaXMuaGVpZ2h0OyByb3crKykge1xuICAgICAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy53aWR0aDsgY29sKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zcGFjZXNbcm93XVtjb2xdID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGZyZWVTcGFjZXMucHVzaChbcm93LCBjb2xdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZyZWVTcGFjZXM7XG4gICAgfVxuICAgIGdldFJhbmRvbUZyZWVTcGFjZSgpIHtcbiAgICAgICAgY29uc3QgZnJlZVNwYWNlcyA9IHRoaXMuZ2V0RnJlZVNwYWNlcygpO1xuICAgICAgICBpZiAoZnJlZVNwYWNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBmcmVlU3BhY2VzLmxlbmd0aCk7XG4gICAgICAgICAgICByZXR1cm4gZnJlZVNwYWNlc1tyYW5kb21JbmRleF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gSGVscGVyIHRvIGNoZWNrIGlmIGxvY2F0aW9uIGlzIHdpdGhpbiBib3VuZHNcbiAgICBpc1dpdGhpbkJvdW5kcyhsb2NhdGlvbikge1xuICAgICAgICBjb25zdCBpc05vdE51bGwgPSBsb2NhdGlvbiAhPT0gbnVsbDtcbiAgICAgICAgY29uc3QgaXNJbkhlaWdodCA9IGxvY2F0aW9uWzBdID49IDAgJiYgbG9jYXRpb25bMF0gPCB0aGlzLmhlaWdodDtcbiAgICAgICAgY29uc3QgaXNJbldpZHRoID0gbG9jYXRpb25bMV0gPj0gMCAmJiBsb2NhdGlvblsxXSA8IHRoaXMud2lkdGg7XG4gICAgICAgIHJldHVybiBpc05vdE51bGwgJiYgaXNJbkhlaWdodCAmJiBpc0luV2lkdGg7XG4gICAgfVxuICAgIC8vIEhlbHBlciB0byBnZXQgb2JqZWN0IGF0IGxvY2F0aW9uXG4gICAgZ2V0T2JqZWN0QXQobG9jYXRpb24pIHtcbiAgICAgICAgaWYgKHRoaXMuaXNXaXRoaW5Cb3VuZHMobG9jYXRpb24pKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zcGFjZXNbbG9jYXRpb25bMF1dW2xvY2F0aW9uWzFdXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxufVxuY2xhc3MgTWF0dGVyIHtcbiAgICB3b3JsZDtcbiAgICBpc0FsaXZlID0gZmFsc2U7XG4gICAgY3VycmVudExvY2F0aW9uID0gbnVsbDtcbiAgICBjb2xvciA9IENvbG9yLkJMQUNLO1xuICAgIGFnZSA9IDA7XG4gICAgYm9yblRpbWUgPSAwLjA7XG4gICAgbmFtZSA9ICcnO1xuICAgIGNsYXNzTmFtZTtcbiAgICBjb25zdHJ1Y3Rvcih3b3JsZCkge1xuICAgICAgICB0aGlzLndvcmxkID0gd29ybGQ7XG4gICAgICAgIHRoaXMuY2xhc3NOYW1lID0gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lO1xuICAgICAgICBjb25zdCBmcmVlU3BhY2UgPSB0aGlzLndvcmxkLmdldFJhbmRvbUZyZWVTcGFjZSgpO1xuICAgICAgICBpZiAoZnJlZVNwYWNlKSB7XG4gICAgICAgICAgICB0aGlzLmJvcm4oZnJlZVNwYWNlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIk5vIGZyZWUgc3BhY2UgZm9yIG5ldyBNYXR0ZXJcIik7XG4gICAgICAgICAgICAvLyBEZWNpZGUgaG93IHRvIGhhbmRsZSBubyBzcGFjZSAtIG1heWJlIHRocm93IGVycm9yIG9yIHJldHVybiBudWxsL3VuZGVmaW5lZFxuICAgICAgICB9XG4gICAgfVxuICAgIGJvcm4obG9jYXRpb24pIHtcbiAgICAgICAgaWYgKCFsb2NhdGlvbiB8fCB0aGlzLndvcmxkLnNwYWNlc1tsb2NhdGlvblswXV1bbG9jYXRpb25bMV1dICE9PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQ2Fubm90IGJvcm4gTWF0dGVyIGF0IG9jY3VwaWVkIG9yIGludmFsaWQgbG9jYXRpb246IFwiLCBsb2NhdGlvbik7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIkNhbm5vdCBib3JuIE1hdHRlciBhdCBvY2N1cGllZCBvciBpbnZhbGlkIGxvY2F0aW9uXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy53b3JsZC5zcGFjZXNbbG9jYXRpb25bMF1dW2xvY2F0aW9uWzFdXSA9PSB0aGlzO1xuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBtYXR0ZXIgdHlwZSBhcnJheSBpZiBub3QgZXhpc3RzXG4gICAgICAgICAgICBpZiAoIXRoaXMud29ybGQubWF0dGVyW3RoaXMuY2xhc3NOYW1lXSkge1xuICAgICAgICAgICAgICAgIHRoaXMud29ybGQubWF0dGVyW3RoaXMuY2xhc3NOYW1lXSA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMud29ybGQubWF0dGVyQ291bnRbdGhpcy5jbGFzc05hbWVdID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMud29ybGQubWF0dGVyW3RoaXMuY2xhc3NOYW1lXS5wdXNoKHRoaXMpO1xuICAgICAgICAgICAgdGhpcy53b3JsZC5tYXR0ZXJDb3VudFt0aGlzLmNsYXNzTmFtZV0rKztcbiAgICAgICAgICAgIHRoaXMuaXNBbGl2ZSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRMb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgICAgICAgICAgdGhpcy5ib3JuVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0aGlzLm5hbWUgPSBgJHt0aGlzLmNsYXNzTmFtZX1fJHt0aGlzLndvcmxkLm1hdHRlckNvdW50W3RoaXMuY2xhc3NOYW1lXX1gO1xuICAgICAgICAgICAgdGhpcy5jb2xvciA9IENvbG9yLmdldFJhbmRvbUNvbG9yKDAsIDI1NSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZGllKCkge1xuICAgICAgICBpZiAodGhpcy5pc0FsaXZlICYmIHRoaXMuY3VycmVudExvY2F0aW9uKSB7XG4gICAgICAgICAgICBjb25zdCBbcm93LCBjb2xdID0gdGhpcy5jdXJyZW50TG9jYXRpb247XG4gICAgICAgICAgICBpZiAodGhpcy53b3JsZC5zcGFjZXNbcm93XVtjb2xdID09PSB0aGlzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53b3JsZC5zcGFjZXNbcm93XVtjb2xdID0gMDsgLy8gc2V0IHNwYWNlIGVtcHR5IGJhY2tcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLndvcmxkLm1hdHRlclt0aGlzLmNsYXNzTmFtZV0pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMud29ybGQubWF0dGVyW3RoaXMuY2xhc3NOYW1lXS5pbmRleE9mKHRoaXMpO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud29ybGQubWF0dGVyW3RoaXMuY2xhc3NOYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaXNBbGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5jb2xvciA9IENvbG9yLkJMQUNLO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50TG9jYXRpb24gPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxufVxuY2xhc3MgRm9vZCBleHRlbmRzIE1hdHRlciB7XG4gICAgZW5lcmd5ID0gMjA7XG4gICAgY29uc3RydWN0b3Iod29ybGQpIHtcbiAgICAgICAgc3VwZXIod29ybGQpO1xuICAgIH1cbn1cbmNsYXNzIENlbGwgZXh0ZW5kcyBNYXR0ZXIge1xuICAgIGZhY2UgPSBudWxsO1xuICAgIGVuZXJneSA9IDMwO1xuICAgIE1BWF9FTkVSR1kgPSAxMDA7XG4gICAgLy8gU3RhdGVzOiB7MDogRW1wdHksIDE6IE90aGVyIENlbGwsIDI6IEZvb2QsIDM6IFdhbGwob3V0IGJvdW5kYXJ5KX1cbiAgICBzdGF0ZXMgPSBbMCwgMSwgMiwgM107XG4gICAgLy8gQWN0aW9uczogezA6IHR1cm5fZmFjZSwgMTogZ299IC0gbWFwIGluZGV4IHRvIGFjdGlvbiBuYW1lXG4gICAgYWN0aW9ucyA9IFtcInR1cm5fZmFjZVwiLCBcImdvXCJdO1xuICAgIC8vIE1lbW9yeSBmb3IgUkw6IHN0YXRlICogYWN0aW9uIG1hdHJpeFxuICAgIG1lbW9yeTsgLy8gcm93cz1zdGF0ZXMsIGNvbHM9YWN0aW9uc1xuICAgIGNvbnN0cnVjdG9yKHdvcmxkKSB7XG4gICAgICAgIHN1cGVyKHdvcmxkKTsgLy8gQ2FsbHMgTWF0dGVyIGNvbnN0cnVjdG9yLCB3aGljaCBjYWxscyBib3JuKClcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBtZW1vcnkgYWZ0ZXIgbWF5YmUgYmlydGhcbiAgICAgICAgaWYgKHRoaXMuaXNBbGl2ZSkge1xuICAgICAgICAgICAgdGhpcy5mYWNlID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogNCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBtZW1vcnkgbWF0cml4IHdpdGggemVyb3NcbiAgICAgICAgdGhpcy5tZW1vcnkgPSBBcnJheSh0aGlzLnN0YXRlcy5sZW5ndGgpLmZpbGwoMCkubWFwKCgpID0+IEFycmF5KHRoaXMuYWN0aW9ucy5sZW5ndGgpLmZpbGwoMCkpO1xuICAgIH1cbiAgICBzZW5zZUZyb250KHNlbnNlUmVhY2ggPSAxKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRMb2NhdGlvbiA9PT0gbnVsbCB8fCB0aGlzLmZhY2UgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IFtyb3csIGNvbF0gPSB0aGlzLmN1cnJlbnRMb2NhdGlvbjtcbiAgICAgICAgbGV0IG5leHRSID0gcm93O1xuICAgICAgICBsZXQgbmV4dEMgPSBjb2w7XG4gICAgICAgIHN3aXRjaCAodGhpcy5mYWNlKSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgbmV4dFIgLT0gc2Vuc2VSZWFjaDtcbiAgICAgICAgICAgICAgICBicmVhazsgLy8gRnJvbnRcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICBuZXh0QyArPSBzZW5zZVJlYWNoO1xuICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBSSWdodFxuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgIG5leHRSICs9IHNlbnNlUmVhY2g7XG4gICAgICAgICAgICAgICAgYnJlYWs7IC8vIEJhY2tcbiAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICBuZXh0QyAtPSBzZW5zZVJlYWNoO1xuICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBMZWZ0IFxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiSW52YWxpZCBmYWNlOlwiLCB0aGlzLmZhY2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbbmV4dFIsIG5leHRDXTtcbiAgICB9XG4gICAgLy8gU2ltcGxlIGRlY2lzaW9uIGxvZ2ljIChsaWtlIGFza19uZXh0X21vdmUgaW4gUHl0aG9uKVxuICAgIHNpbXBsZUFjdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzQWxpdmUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IG5leHRMb2NhdGlvbiA9IHRoaXMuc2Vuc2VGcm9udCgpO1xuICAgICAgICBjb25zdCB3aGF0c05leHQgPSB0aGlzLmFza1doYXRzTmV4dChuZXh0TG9jYXRpb24pO1xuICAgICAgICBzd2l0Y2ggKHdoYXRzTmV4dCkge1xuICAgICAgICAgICAgY2FzZSAwOiAvLyBFbXB0eVxuICAgICAgICAgICAgICAgIHRoaXMubW92ZShuZXh0TG9jYXRpb24pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAyOiAvLyBGb29kXG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqID0gdGhpcy53b3JsZC5nZXRPYmplY3RBdChuZXh0TG9jYXRpb24pO1xuICAgICAgICAgICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBGb29kKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWF0KG9iaik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgeyAvLyBTaG91bGQgbm90IGhhcHBlbiBpZiBhc2tXaGF0c05leHQgaXMgY29ycmVjdCwgYnV0IHNhZmUgY2hlY2tcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50dXJuRmFjZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMTogLy8gQ2VsbFxuICAgICAgICAgICAgY2FzZSAzOiAvLyBXYWxsXG4gICAgICAgICAgICBkZWZhdWx0OiAvLyBJbmNsdWRlcyBudWxsIChvdXQgb2YgYm91bmRzKVxuICAgICAgICAgICAgICAgIHRoaXMudHVybkZhY2UoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVuZXJneSAtPSAxOyAvLyBFbmVyZ3kgY29uc3VtcHRpb24gcGVyIGFjdGlvbiBhdHRlbXB0XG4gICAgICAgIC8vIEFkZCBhZ2luZyBsb2dpYyBpZiBuZWVkZWRcbiAgICAgICAgLy8gdGhpcy5jaGVja0VuZXJneSgpO1xuICAgIH1cbiAgICBjaGVja0VuZXJneSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZW5lcmd5IDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMuZGllKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gLS0tIFJMIEZ1bmN0aW9ucyAtLS1cbiAgICBhc2tXaGF0c05leHQobG9jYXRpb24pIHtcbiAgICAgICAgaWYgKCF0aGlzLndvcmxkLmlzV2l0aGluQm91bmRzKGxvY2F0aW9uKSkge1xuICAgICAgICAgICAgcmV0dXJuIDM7IC8vIFdhbGwvT3V0IG9mIGJvdW5kc1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9iaiA9IHRoaXMud29ybGQuZ2V0T2JqZWN0QXQobG9jYXRpb24pO1xuICAgICAgICBpZiAob2JqID09PSAwKVxuICAgICAgICAgICAgcmV0dXJuIDA7IC8vIEVtcHR5XG4gICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBDZWxsKVxuICAgICAgICAgICAgcmV0dXJuIDE7IC8vIEFub3RoZXIgQ2VsbFxuICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgRm9vZClcbiAgICAgICAgICAgIHJldHVybiAyOyAvLyBGb29kXG4gICAgICAgIHJldHVybiBudWxsOyAvLyBTaG91bGQgbm90IGhhcHBlblxuICAgIH1cbiAgICAvLyBDb3JyZXNwb25kcyB0byBSTCBGdW5jdGlvbiAyOiBleHBlY3RcbiAgICBleHBlY3RSZXdhcmQoc3RhdGUpIHtcbiAgICAgICAgaWYgKHN0YXRlID49IDAgJiYgc3RhdGUgPCB0aGlzLm1lbW9yeS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1lbW9yeVtzdGF0ZV07IC8vIFJldHVybnMgdGhlIGFjdGlvbiByZXdhcmRzIGFycmF5IGZvciB0aGlzIHN0YXRlXG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5lcnJvcihcIkludmFsaWQgc3RhdGUgZm9yIGV4cGVjdGF0aW9uOlwiLCBzdGF0ZSk7XG4gICAgICAgIHJldHVybiBBcnJheSh0aGlzLmFjdGlvbnMubGVuZ3RoKS5maWxsKDApOyAvLyBSZXR1cm4gZGVmYXVsdCBpZiBzdGF0ZSBpcyBpbnZhbGlkXG4gICAgfVxuICAgIC8vIENvcnJlc3BvbmRzIHRvIFJMIEZ1bmN0aW9uIDM6IGJlc3RfYWN0aW9uXG4gICAgY2hvb3NlQWN0aW9uKHN0YXRlUmV3YXJkcywgZXBzaWxvbiA9IDAuMSkge1xuICAgICAgICAvLyBFcHNpbG9uLWdyZWVkeVxuICAgICAgICBpZiAoTWF0aC5yYW5kb20oKSA8IGVwc2lsb24gfHwgc3RhdGVSZXdhcmRzLmV2ZXJ5KHIgPT4gciA9PT0gMCkpIHtcbiAgICAgICAgICAgIC8vIEV4cGxvcmU6IENob29zZSByYW5kb20gYWN0aW9uXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogdGhpcy5hY3Rpb25zLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBFeHBsb2l0OiBDaG9vc2UgYWN0aW9uIHdpdGggbWF4IHJld2FyZFxuICAgICAgICAgICAgLy8gRmluZCBpbmRleCBvZiBtYXggdmFsdWUuIElmIHRpZXMsIHBpY2tzIGZpcnN0IG9uZS5cbiAgICAgICAgICAgIHJldHVybiBzdGF0ZVJld2FyZHMuaW5kZXhPZihNYXRoLm1heCguLi5zdGF0ZVJld2FyZHMpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBDb3JyZXNwb25kcyB0byBSTCBGdW5jdGlvbiA0OiBkb19hY3Rpb25cbiAgICBwZXJmb3JtQWN0aW9uKGFjdGlvbkluZGV4LCBzdGF0ZSwgbmV4dExvY2F0aW9uKSB7XG4gICAgICAgIGNvbnN0IGFjdGlvbk5hbWUgPSB0aGlzLmFjdGlvbnNbYWN0aW9uSW5kZXhdO1xuICAgICAgICBsZXQgcmV3YXJkID0gMDtcbiAgICAgICAgc3dpdGNoIChhY3Rpb25OYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwidHVybl9mYWNlXCI6XG4gICAgICAgICAgICAgICAgdGhpcy50dXJuRmFjZSgpO1xuICAgICAgICAgICAgICAgIHJld2FyZCA9IDA7IC8vIE9yIGEgc21hbGwgbmVnYXRpdmUgcmV3YXJkIGZvciBub3QgcHJvZ3Jlc3Npbmc/XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiZ29cIjpcbiAgICAgICAgICAgICAgICByZXdhcmQgPSB0aGlzLmdvKHN0YXRlLCBuZXh0TG9jYXRpb24pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiSW52YWxpZCBhY3Rpb24gaW5kZXg6XCIsIGFjdGlvbkluZGV4KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVuZXJneSAtPSAxOyAvLyBDb25zdW1lIGVuZXJneSBwZXIgYWN0aW9uXG4gICAgICAgIHRoaXMuY2hlY2tFbmVyZ3koKTtcbiAgICAgICAgcmV0dXJuIHJld2FyZDtcbiAgICB9XG4gICAgLy8gQ29ycmVzcG9uZHMgdG8gUkwgRnVuY3Rpb24gNTogcmVtZW1iZXJcbiAgICByZW1lbWJlcihzdGF0ZSwgYWN0aW9uSW5kZXgsIHJld2FyZCkge1xuICAgICAgICBpZiAoc3RhdGUgPj0gMCAmJiBzdGF0ZSA8IHRoaXMubWVtb3J5Lmxlbmd0aCAmJiBhY3Rpb25JbmRleCA+PSAwICYmIGFjdGlvbkluZGV4IDwgdGhpcy5hY3Rpb25zLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5tZW1vcnlbc3RhdGVdW2FjdGlvbkluZGV4XSArPSByZXdhcmQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiSW52YWxpZCBzdGF0ZSBvciBhY3Rpb24gaW5kZXggZm9yIG1lbW9yeSB1cGRhdGU6XCIsIHN0YXRlLCBhY3Rpb25JbmRleCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gQ29ycmVzcG9uZHMgdG8gUkwgRnVuY3Rpb24gLSBwcml2YXRlIF9nb1xuICAgIGdvKHN0YXRlLCBuZXh0TG9jYXRpb24pIHtcbiAgICAgICAgbGV0IHJld2FyZCA9IDA7XG4gICAgICAgIHN3aXRjaCAoc3RhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgMDogLy8gRW1wdHlcbiAgICAgICAgICAgICAgICBpZiAobmV4dExvY2F0aW9uKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdmUobmV4dExvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICByZXdhcmQgPSAxOyAvLyBSZXdhcmQgZm9yIG1vdmluZyB0byBlbXB0eSBzcGFjZVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAyOiAvLyBGb29kXG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqID0gbmV4dExvY2F0aW9uID8gdGhpcy53b3JsZC5nZXRPYmplY3RBdChuZXh0TG9jYXRpb24pIDogbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgRm9vZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVhdChvYmopOyAvLyBlYXQoKSBpbXBsaWNpdGx5IG1vdmVzIHRoZSBjZWxsIHRvIGZvb2QncyBsb2NhdGlvblxuICAgICAgICAgICAgICAgICAgICByZXdhcmQgPSAxMDsgLy8gSGlnaCByZXdhcmQgZm9yIGVhdGluZ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2VsbCB0aG91Z2h0IGl0IHdhcyBmb29kLCBidXQgaXQgd2Fzbid0IChlLmcuLCBkaXNhcHBlYXJlZCkuIFR1cm4/XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHVybkZhY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV3YXJkID0gLTE7IC8vIFBlbmFsdHkgZm9yIGZhaWxlZCBhY3Rpb25cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDE6IC8vIENlbGxcbiAgICAgICAgICAgIGNhc2UgMzogLy8gV2FsbFxuICAgICAgICAgICAgZGVmYXVsdDogLy8gSW5jbHVkZXMgaW52YWxpZCBzdGF0ZXMgb3IgZmFpbGVkIG1vdmVzXG4gICAgICAgICAgICAgICAgdGhpcy50dXJuRmFjZSgpO1xuICAgICAgICAgICAgICAgIHJld2FyZCA9IC0xOyAvLyBQZW5hbHR5IGZvciBidW1waW5nIG9yIGludmFsaWQgbW92ZVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXdhcmQ7XG4gICAgfVxuICAgIC8vIC0tLSBTdGFuZGFyZCBBY3Rpb25zIC0tLVxuICAgIG1vdmUobmV3TG9jYXRpb24pIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzQWxpdmUgfHwgIW5ld0xvY2F0aW9uIHx8ICF0aGlzLndvcmxkLmlzV2l0aGluQm91bmRzKG5ld0xvY2F0aW9uKSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS53YXJuKFwiQ2Fubm90IG1vdmU6IENlbGwgZGVhZCwgbG9jYXRpb24gaW52YWxpZCBvciBvdXQgb2YgYm91bmRzXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRhcmdldE9iaiA9IHRoaXMud29ybGQuZ2V0T2JqZWN0QXQobmV3TG9jYXRpb24pO1xuICAgICAgICBpZiAodGFyZ2V0T2JqICE9PSAwKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLndhcm4oXCJDYW5ub3QgbW92ZSB0byBvY2N1cGllZCBzcGFjZTpcIiwgbmV3TG9jYXRpb24pO1xuICAgICAgICAgICAgLy8gT3B0aW9uYWw6IHR1cm4gZmFjZSBpbnN0ZWFkP1xuICAgICAgICAgICAgdGhpcy50dXJuRmFjZSgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIENsZWFyIG9sZCBsb2NhdGlvbiBpbiB3b3JsZCBncmlkXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRMb2NhdGlvbikge1xuICAgICAgICAgICAgY29uc3QgW29sZFIsIG9sZENdID0gdGhpcy5jdXJyZW50TG9jYXRpb247XG4gICAgICAgICAgICBpZiAodGhpcy53b3JsZC5nZXRPYmplY3RBdChbb2xkUiwgb2xkQ10pID09PSB0aGlzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53b3JsZC5zcGFjZXNbb2xkUl1bb2xkQ10gPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFVwZGF0ZSB3b3JsZCBncmlkIHdpdGggbmV3IGxvY2F0aW9uXG4gICAgICAgIGNvbnN0IFtuZXdSLCBuZXdDXSA9IG5ld0xvY2F0aW9uO1xuICAgICAgICB0aGlzLndvcmxkLnNwYWNlc1tuZXdSXVtuZXdDXSA9IHRoaXM7XG4gICAgICAgIC8vIFVwZGF0ZSBjZWxsJ3MgY3VycmVudCBsb2NhdGlvblxuICAgICAgICB0aGlzLmN1cnJlbnRMb2NhdGlvbiA9IG5ld0xvY2F0aW9uO1xuICAgICAgICAvLyBOb3RlOiBFbmVyZ3kgY29uc3VtcHRpb24gaXMgaGFuZGxlZCBpbiBwZXJmb3JtQWN0aW9uIG9yIHNpbXBsZUFjdGlvblxuICAgICAgICAvLyBOb3RlOiBBZ2luZyBpcyBub3QgaW1wbGVtZW50ZWQgaGVyZSB5ZXRcbiAgICB9XG4gICAgdHVybkZhY2UobmV3RmFjZSkge1xuICAgICAgICBpZiAoIXRoaXMuaXNBbGl2ZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKG5ld0ZhY2UgIT09IHVuZGVmaW5lZCAmJiBuZXdGYWNlID49IDAgJiYgbmV3RmFjZSA8PSAzKSB7XG4gICAgICAgICAgICB0aGlzLmZhY2UgPSBuZXdGYWNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gVHVybiByYW5kb21seSwgZXhjbHVkaW5nIGN1cnJlbnQgZGlyZWN0aW9uXG4gICAgICAgICAgICBjb25zdCBwb3NzaWJsZUZhY2VzID0gWzAsIDEsIDIsIDNdO1xuICAgICAgICAgICAgY29uc3QgY3VycmVudEZhY2VJbmRleCA9IHBvc3NpYmxlRmFjZXMuaW5kZXhPZih0aGlzLmZhY2UpO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRGYWNlSW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIHBvc3NpYmxlRmFjZXMuc3BsaWNlKGN1cnJlbnRGYWNlSW5kZXgsIDEpOyAvLyBSZW1vdmUgY3VycmVudCBmYWNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZhY2UgPSBwb3NzaWJsZUZhY2VzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBvc3NpYmxlRmFjZXMubGVuZ3RoKV07XG4gICAgICAgIH1cbiAgICAgICAgLy8gTm90ZTogRW5lcmd5IGNvbnN1bXB0aW9uIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgfVxuICAgIGVhdChmb29kKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0FsaXZlIHx8ICFmb29kLmlzQWxpdmUgfHwgIWZvb2QuY3VycmVudExvY2F0aW9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAvLyBDbGVhciBvbGQgbG9jYXRpb25cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudExvY2F0aW9uKSB7XG4gICAgICAgICAgICBjb25zdCBbb2xkUiwgb2xkQ10gPSB0aGlzLmN1cnJlbnRMb2NhdGlvbjtcbiAgICAgICAgICAgIGlmICh0aGlzLndvcmxkLmdldE9iamVjdEF0KFtvbGRSLCBvbGRDXSkgPT09IHRoaXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkLnNwYWNlc1tvbGRSXVtvbGRDXSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gTW92ZSB0byBmb29kJ3MgbG9jYXRpb25cbiAgICAgICAgY29uc3QgZm9vZExvY2F0aW9uID0gZm9vZC5jdXJyZW50TG9jYXRpb247XG4gICAgICAgIHRoaXMuY3VycmVudExvY2F0aW9uID0gZm9vZExvY2F0aW9uO1xuICAgICAgICB0aGlzLndvcmxkLnNwYWNlc1tmb29kTG9jYXRpb25bMF1dW2Zvb2RMb2NhdGlvblsxXV0gPSB0aGlzOyAvLyBUYWtlIHRoZSBzcG90XG4gICAgICAgIC8vIENvbnN1bWUgZm9vZCBlbmVyZ3lcbiAgICAgICAgdGhpcy5lbmVyZ3kgKz0gZm9vZC5lbmVyZ3k7XG4gICAgICAgIGlmICh0aGlzLmVuZXJneSA+IHRoaXMuTUFYX0VORVJHWSkge1xuICAgICAgICAgICAgdGhpcy5lbmVyZ3kgPSB0aGlzLk1BWF9FTkVSR1k7XG4gICAgICAgIH1cbiAgICAgICAgLy8gRm9vZCBkaWVzXG4gICAgICAgIGZvb2QuZGllKCk7XG4gICAgICAgIC8vIE5vdGU6IEVuZXJneSBnYWluIGhhbmRsZWQgaGVyZSwgY29uc3VtcHRpb24gaGFuZGxlZCBpbiBhY3Rpb24gbG9naWNcbiAgICB9XG4gICAgLy8gRXhhbXBsZSBBZ2luZyAoY2FsbCBwZXJpb2RpY2FsbHkpXG4gICAgYWdpbmcoKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0FsaXZlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAvLyBTaW1wbGUgdGltZS1iYXNlZCBhZ2luZyAtIGFkanVzdCBsb2dpYyBhcyBuZWVkZWRcbiAgICAgICAgY29uc3QgZWxhcHNlZFRpbWUgPSAoRGF0ZS5ub3coKSAtIHRoaXMuYm9yblRpbWUpIC8gMTAwMDsgLy8gVGltZSBpbiBzZWNvbmRzXG4gICAgICAgIC8vIEV4YW1wbGU6IEFnZSBpbmNyZWFzZXMgZXZlcnkgNSBzZWNvbmRzXG4gICAgICAgIGNvbnN0IG5ld0FnZSA9IE1hdGguZmxvb3IoZWxhcHNlZFRpbWUgLyA1KTtcbiAgICAgICAgaWYgKG5ld0FnZSA+IHRoaXMuYWdlKSB7XG4gICAgICAgICAgICB0aGlzLmFnZSA9IG5ld0FnZTtcbiAgICAgICAgICAgIC8vIE9wdGlvbmFsOiBEaW0gY29sb3Igc2xpZ2h0bHlcbiAgICAgICAgICAgIC8vIHRoaXMuY29sb3IgPSB0aGlzLmNvbG9yLm1hcChjID0+IE1hdGgubWF4KDAsIE1hdGguZmxvb3IoYyAqIDAuOTc1KSkpIGFzIENvbG9yVHVwbGU7XG4gICAgICAgICAgICBpZiAodGhpcy5hZ2UgPiAxMDApIHsgLy8gRXhhbXBsZSBsaWZlc3BhblxuICAgICAgICAgICAgICAgIHRoaXMuZGllKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gUkwgU3RlcCBjb21iaW5lZFxuICAgIHN0ZXBSTCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzQWxpdmUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IG5leHRMb2NhdGlvbiA9IHRoaXMuc2Vuc2VGcm9udCgpO1xuICAgICAgICBjb25zdCBuZXh0U3RhdGUgPSB0aGlzLmFza1doYXRzTmV4dChuZXh0TG9jYXRpb24pO1xuICAgICAgICBpZiAobmV4dFN0YXRlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zdCBzdGF0ZVJld2FyZHMgPSB0aGlzLmV4cGVjdFJld2FyZChuZXh0U3RhdGUpO1xuICAgICAgICAgICAgY29uc3QgYWN0aW9uSW5kZXggPSB0aGlzLmNob29zZUFjdGlvbihzdGF0ZVJld2FyZHMpOyAvLyBVc2UgZXBzaWxvbi1ncmVlZHlcbiAgICAgICAgICAgIGNvbnN0IHJld2FyZCA9IHRoaXMucGVyZm9ybUFjdGlvbihhY3Rpb25JbmRleCwgbmV4dFN0YXRlLCBuZXh0TG9jYXRpb24pO1xuICAgICAgICAgICAgdGhpcy5yZW1lbWJlcihuZXh0U3RhdGUsIGFjdGlvbkluZGV4LCByZXdhcmQpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENlbGw6ICR7dGhpcy5uYW1lfSwgU3RhdGU6ICR7bmV4dFN0YXRlfSwgQWN0aW9uOiAke3RoaXMuYWN0aW9uc1thY3Rpb25JbmRleF19LCBSZXdhcmQ6ICR7cmV3YXJkfSwgTWVtOiAke0pTT04uc3RyaW5naWZ5KHRoaXMubWVtb3J5W25leHRTdGF0ZV0pfWApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gSGFuZGxlIGNhc2VzIHdoZXJlIG5leHQgc3RhdGUgY291bGRuJ3QgYmUgZGV0ZXJtaW5lZCAoc2hvdWxkIGJlIHJhcmUpXG4gICAgICAgICAgICB0aGlzLnR1cm5GYWNlKCk7IC8vIERlZmF1bHQgYWN0aW9uIGlmIHN0YXRlIGlzIHVuY2VydGFpblxuICAgICAgICAgICAgLy8gdGhpcy5lbmVyZ3kgLT0xOyAvLyBDb25zdW1lIGVuZXJneVxuICAgICAgICAgICAgLy8gdGhpcy5jaGVja0VuZXJneSgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIENhbGwgYWdpbmcgcGVyaW9kaWNhbGx5IGlmIG5lZWRlZFxuICAgICAgICAvLyB0aGlzLmFnaW5nKCk7XG4gICAgfVxufVxuIiwiLy8gRXF1aXZhbGVudCB0byBwYXJhbXMucHkgW2NpdGU6IHVwbG9hZGVkOnB5X3ZlcnNpb24vcGFyYW1zLnB5XVxuZXhwb3J0IGNsYXNzIENvbG9yIHtcbiAgICBzdGF0aWMgV0hJVEUgPSBbMjU1LCAyNTUsIDI1NV07XG4gICAgc3RhdGljIFlFTExPVyA9IFsyNTUsIDI1NSwgMF07XG4gICAgc3RhdGljIFJFRCA9IFsyNTUsIDAsIDBdO1xuICAgIHN0YXRpYyBCTFVFID0gWzAsIDAsIDI1NV07XG4gICAgc3RhdGljIEdSRUVOID0gWzAsIDI1NSwgMF07XG4gICAgc3RhdGljIEJMQUNLID0gWzAsIDAsIDBdO1xuICAgIHN0YXRpYyBPUkFOR0UgPSBbMjU1LCAxMjgsIDBdO1xuICAgIHN0YXRpYyBQVVJQTEUgPSBbMTI4LCAwLCAxMjhdO1xuICAgIHN0YXRpYyBDT0xPUlMgPSBbXG4gICAgICAgIENvbG9yLldISVRFLCBDb2xvci5ZRUxMT1csIENvbG9yLlJFRCwgQ29sb3IuQkxVRSxcbiAgICAgICAgQ29sb3IuR1JFRU4sIENvbG9yLk9SQU5HRSwgQ29sb3IuUFVSUExFXG4gICAgXTtcbiAgICBzdGF0aWMgZ2V0UmFuZG9tQ29sb3JJbnNldCgpIHtcbiAgICAgICAgY29uc3QgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBDb2xvci5DT0xPUlMubGVuZ3RoKTtcbiAgICAgICAgcmV0dXJuIENvbG9yLkNPTE9SU1tyYW5kb21JbmRleF07XG4gICAgfVxuICAgIHN0YXRpYyBnZXRSYW5kb21Db2xvcihtaW4sIG1heCkge1xuICAgICAgICBjb25zdCBtaW5DZWlsZWQgPSBNYXRoLmNlaWwobWluKTtcbiAgICAgICAgY29uc3QgbWF4Rmxvb3JlZCA9IE1hdGguZmxvb3IobWF4KTtcbiAgICAgICAgcmV0dXJuIFtnZXRSYW5kb21JbnRJbmNsdXNpdmUobWluLCBtYXgpLCBnZXRSYW5kb21JbnRJbmNsdXNpdmUobWluLCBtYXgpLCBnZXRSYW5kb21JbnRJbmNsdXNpdmUobWluLCBtYXgpXTtcbiAgICB9XG59XG5mdW5jdGlvbiBnZXRSYW5kb21JbnRJbmNsdXNpdmUobWluLCBtYXgpIHtcbiAgICBjb25zdCBtaW5DZWlsZWQgPSBNYXRoLmNlaWwobWluKTtcbiAgICBjb25zdCBtYXhGbG9vcmVkID0gTWF0aC5mbG9vcihtYXgpO1xuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4Rmxvb3JlZCAtIG1pbkNlaWxlZCArIDEpICsgbWluQ2VpbGVkKTsgLy8gVGhlIG1heGltdW0gaXMgaW5jbHVzaXZlIGFuZCB0aGUgbWluaW11bSBpcyBpbmNsdXNpdmVcbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8gRXF1aXZhbGVudCB0byBtYWluLnB5IFtjaXRlOiB1cGxvYWRlZDpweV92ZXJzaW9uL21haW4ucHldXG5pbXBvcnQgeyBXb3JsZCwgQ2VsbCwgRm9vZCB9IGZyb20gJy4vY29yZSc7XG5pbXBvcnQgeyBDb2xvciB9IGZyb20gJy4vcGFyYW1zJztcbi8vIC0tLSBTaW11bGF0aW9uIFNldHVwIC0tLVxubGV0IHdvcmxkU2l6ZSA9IDEwO1xubGV0IGluaXRpYWxDZWxscyA9IDEwO1xubGV0IGluaXRpYWxGb29kID0gMDtcbmxldCB3b3JsZCA9IG5ldyBXb3JsZCh3b3JsZFNpemUpO1xuLy8gLS0tIFZpc3VhbGl6YXRpb24gU2V0dXAgKFBsYWNlaG9sZGVyKSAtLS1cbmNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwid29ybGRDYW52YXNcIik7XG5sZXQgdGlsZVdpZHRoID0gY2FudmFzLndpZHRoIC8gd29ybGQud2lkdGg7XG5sZXQgdGlsZUhlaWdodCA9IGNhbnZhcy5oZWlnaHQgLyB3b3JsZC5oZWlnaHQ7XG5jb25zdCB3b3JsZFNpemVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwid29ybGRTaXplQ291bnRcIik7XG5jb25zdCBjZWxsSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNlbGxDb3VudFwiKTtcbmNvbnN0IGZvb2RJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZm9vZENvdW50XCIpO1xubGV0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG5sZXQgY3R4MiA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG5sZXQgYW5pbWF0aW9uRnJhbWVJZCA9IG51bGw7IC8vIFRvIHN0b3AgdGhlIGxvb3BcbmxldCBydW5uaW5nID0gZmFsc2U7IC8vIENvbnRyb2wgdGhlIGFuaW1hdGlvbiBsb29wXG5mdW5jdGlvbiBzZXR1cFZpc3VhbGl6YXRpb24oKSB7XG4gICAgaWYgKCFjYW52YXMpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkNhbnZhcyBlbGVtZW50IHdpdGggaWQgJ3dvcmxkQ2FudmFzJyBub3QgZm91bmQhXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIEdldCB0aGUgZGV2aWNlIHBpeGVsIHJhdGlvXG4gICAgY29uc3QgZHByID0gd2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgMTtcbiAgICBjYW52YXMud2lkdGggKj0gZHByO1xuICAgIGNhbnZhcy5oZWlnaHQgKj0gZHByO1xuICAgIGlmICghY3R4KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDb3VsZCBub3QgZ2V0IDJEIHJlbmRlcmluZyBjb250ZXh0IVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjdHguc2NhbGUoZHByLCBkcHIpO1xuICAgIGNvbnNvbGUubG9nKFwiQ2FudmFzIHNldHVwIGNvbXBsZXRlLlwiKTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZVdvcmxkKCkge1xuICAgIHdvcmxkU2l6ZSA9IHBhcnNlSW50KHdvcmxkU2l6ZUlucHV0LnZhbHVlLCAxMCkgfHwgMDtcbiAgICB3b3JsZCA9IG5ldyBXb3JsZCh3b3JsZFNpemUpO1xuICAgIHRpbGVXaWR0aCA9IGNhbnZhcy53aWR0aCAvIHdvcmxkLndpZHRoO1xuICAgIHRpbGVIZWlnaHQgPSBjYW52YXMuaGVpZ2h0IC8gd29ybGQuaGVpZ2h0O1xufVxuLy8gRnVuY3Rpb24gdG8gdXBkYXRlIHRoZSBpbml0aWFsIHBvcHVsYXRpb24gYmFzZWQgb24gdXNlciBpbnB1dFxuZnVuY3Rpb24gdXBkYXRlUG9wdWxhdGlvbigpIHtcbiAgICAvLyBQYXJzZSB1c2VyIGlucHV0IGFuZCB1cGRhdGUgaW5pdGlhbENlbGxzIGFuZCBpbml0aWFsRm9vZFxuICAgIGluaXRpYWxDZWxscyA9IHBhcnNlSW50KGNlbGxJbnB1dC52YWx1ZSwgMTApIHx8IDA7XG4gICAgaW5pdGlhbEZvb2QgPSBwYXJzZUludChmb29kSW5wdXQudmFsdWUsIDEwKSB8fCAwO1xuICAgIGNvbnNvbGUubG9nKGBVcGRhdGVkIHBvcHVsYXRpb246IENlbGxzID0gJHtpbml0aWFsQ2VsbHN9LCBGb29kID0gJHtpbml0aWFsRm9vZH1gKTtcbn1cbmZ1bmN0aW9uIGRyYXdHcmlkKCkge1xuICAgIGlmICghY3R4KVxuICAgICAgICByZXR1cm47XG4gICAgY3R4LnN0cm9rZVN0eWxlID0gYHJnYigke0NvbG9yLldISVRFLmpvaW4oJywnKX0pYDsgLy8gV2hpdGUgbGluZXNcbiAgICBjdHgubGluZVdpZHRoID0gMC41OyAvLyBUaGluIGxpbmVzXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPD0gY2FudmFzLndpZHRoOyB4ICs9IHRpbGVXaWR0aCkge1xuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIGN0eC5tb3ZlVG8oeCwgMCk7XG4gICAgICAgIGN0eC5saW5lVG8oeCwgY2FudmFzLndpZHRoKTtcbiAgICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH1cbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8PSBjYW52YXMuaGVpZ2h0OyB5ICs9IHRpbGVIZWlnaHQpIHtcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICBjdHgubW92ZVRvKDAsIHkpO1xuICAgICAgICBjdHgubGluZVRvKGNhbnZhcy5oZWlnaHQsIHkpO1xuICAgICAgICBjdHguc3Ryb2tlKCk7XG4gICAgfVxufVxuZnVuY3Rpb24gZHJhd01hdHRlcihtYXR0ZXIsIGNvbG9yT3ZlcnJpZGUsIHJlbmRlckRldGFpbHMgPSBmYWxzZSkge1xuICAgIGlmICghY3R4IHx8ICFtYXR0ZXIuaXNBbGl2ZSB8fCAhbWF0dGVyLmN1cnJlbnRMb2NhdGlvbilcbiAgICAgICAgcmV0dXJuO1xuICAgIGNvbnN0IFtyb3csIGNvbF0gPSBtYXR0ZXIuY3VycmVudExvY2F0aW9uO1xuICAgIGNvbnN0IHggPSBjb2wgKiB0aWxlV2lkdGg7XG4gICAgY29uc3QgeSA9IHJvdyAqIHRpbGVIZWlnaHQ7XG4gICAgY29uc3QgbWF0dGVyQ29sb3IgPSBjb2xvck92ZXJyaWRlIHx8IG1hdHRlci5jb2xvcjtcbiAgICAvLyBEcmF3IHJlY3RhbmdsZSBmb3IgdGhlIG1hdHRlclxuICAgIGN0eC5maWxsU3R5bGUgPSBgcmdiKCR7bWF0dGVyQ29sb3Iuam9pbignLCcpfSlgO1xuICAgIGN0eC5maWxsUmVjdCh4LCB5LCB0aWxlV2lkdGgsIHRpbGVIZWlnaHQpO1xuICAgIC8vIFJlbmRlciBkZXRhaWxzIGxpa2UgbmFtZSwgZW5lcmd5LCBmYWNlIChpZiBDZWxsIGFuZCByZXF1ZXN0ZWQpXG4gICAgaWYgKHJlbmRlckRldGFpbHMgJiYgbWF0dGVyIGluc3RhbmNlb2YgQ2VsbCkge1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gYHJnYigke0NvbG9yLldISVRFLmpvaW4oJywnKX0pYDtcbiAgICAgICAgY3R4LmZvbnQgPSAnMTBweCBBcmlhbCc7XG4gICAgICAgIGN0eC50ZXh0QWxpZ24gPSAnbGVmdCc7XG4gICAgICAgIGN0eC50ZXh0QmFzZWxpbmUgPSAndG9wJztcbiAgICAgICAgY3R4LmZpbGxUZXh0KGAke21hdHRlci5uYW1lfWAsIHggKyAyLCB5ICsgMik7IC8vIFNob3cgcGFydGlhbCBuYW1lIGlmIG5lZWRlZFxuICAgICAgICAvLyBjdHguZmlsbFRleHQoYEU6JHttYXR0ZXIuZW5lcmd5fWAsIHggKyAyLCB5ICsgMTQpO1xuICAgICAgICAvLyBPcHRpb25hbDogRHJhdyBmYWNlIGluZGljYXRvclxuICAgICAgICBkcmF3RmFjZUluZGljYXRvcihjdHgsIHgsIHksIHRpbGVXaWR0aCwgdGlsZUhlaWdodCwgbWF0dGVyLmZhY2UpO1xuICAgIH1cbn1cbi8vIE9wdGlvbmFsOiBIZWxwZXIgZnVuY3Rpb24gdG8gZHJhdyBhIGRpcmVjdGlvbiBpbmRpY2F0b3JcbmZ1bmN0aW9uIGRyYXdGYWNlSW5kaWNhdG9yKGN0eCwgeCwgeSwgdywgaCwgZmFjZSkge1xuICAgIGlmIChmYWNlID09PSBudWxsKVxuICAgICAgICByZXR1cm47XG4gICAgY3R4LmZpbGxTdHlsZSA9ICdyZ2JhKDAsMCwwLDAuNSknOyAvLyBTZW1pLXRyYW5zcGFyZW50IGJsYWNrXG4gICAgY29uc3QgY3ggPSB4ICsgdyAvIDI7XG4gICAgY29uc3QgY3kgPSB5ICsgaCAvIDI7XG4gICAgY29uc3QgaW5kaWNhdG9yU2l6ZSA9IE1hdGgubWluKHcsIGgpIC8gNDtcbiAgICBzd2l0Y2ggKGZhY2UpIHtcbiAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgY3R4LmZpbGxSZWN0KGN4IC0gaW5kaWNhdG9yU2l6ZSAvIDIsIHkgKyAxLCBpbmRpY2F0b3JTaXplLCBpbmRpY2F0b3JTaXplKTtcbiAgICAgICAgICAgIGJyZWFrOyAvLyBUb3BcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHggKyB3IC0gaW5kaWNhdG9yU2l6ZSAtIDEsIGN5IC0gaW5kaWNhdG9yU2l6ZSAvIDIsIGluZGljYXRvclNpemUsIGluZGljYXRvclNpemUpO1xuICAgICAgICAgICAgYnJlYWs7IC8vIFJpZ2h0XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdChjeCAtIGluZGljYXRvclNpemUgLyAyLCB5ICsgaCAtIGluZGljYXRvclNpemUgLSAxLCBpbmRpY2F0b3JTaXplLCBpbmRpY2F0b3JTaXplKTtcbiAgICAgICAgICAgIGJyZWFrOyAvLyBCb3R0b21cbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHggKyAxLCBjeSAtIGluZGljYXRvclNpemUgLyAyLCBpbmRpY2F0b3JTaXplLCBpbmRpY2F0b3JTaXplKTtcbiAgICAgICAgICAgIGJyZWFrOyAvLyBMZWZ0XG4gICAgfVxufVxuLy8gLS0tIFNpbXVsYXRpb24gTG9naWMgLS0tXG5mdW5jdGlvbiBwb3B1bGF0ZVdvcmxkKCkge1xuICAgIGNvbnNvbGUubG9nKFwiUG9wdWxhdGluZyB3b3JsZC4uLlwiKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluaXRpYWxDZWxsczsgaSsrKSB7XG4gICAgICAgIG5ldyBDZWxsKHdvcmxkKTsgLy8gQ29uc3RydWN0b3IgaGFuZGxlcyBwbGFjZW1lbnRcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbml0aWFsRm9vZDsgaSsrKSB7XG4gICAgICAgIG5ldyBGb29kKHdvcmxkKTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coYFdvcmxkIHBvcHVsYXRlZC4gQ2VsbHM6ICR7d29ybGQubWF0dGVyW1wiQ2VsbFwiXT8ubGVuZ3RoIHx8IDB9LCBGb29kOiAke3dvcmxkLm1hdHRlcltcIkZvb2RcIl0/Lmxlbmd0aCB8fCAwfWApO1xufVxuZnVuY3Rpb24gcmVuZGVyV3JvbGQocmVuZGVyR3JpZCA9IGZhbHNlKSB7XG4gICAgLy8gMS4gQ2xlYXIgQ2FudmFzXG4gICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIGN0eC5maWxsU3R5bGUgPSBgcmdiKCR7Q29sb3IuQkxBQ0suam9pbignLCcpfSlgO1xuICAgIGN0eC5maWxsUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIGlmIChyZW5kZXJHcmlkKSB7XG4gICAgICAgIC8vIGRyYXdHcmlkKCnDt1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdhbWVMb29wKCkge1xuICAgIGlmICghcnVubmluZyB8fCAhY3R4KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiU3RvcHBpbmcgZ2FtZSBsb29wLlwiKTtcbiAgICAgICAgaWYgKGFuaW1hdGlvbkZyYW1lSWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKGFuaW1hdGlvbkZyYW1lSWQpO1xuICAgICAgICAgICAgYW5pbWF0aW9uRnJhbWVJZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICA7XG4gICAgLy8gMS4gQ2xlYXIgQ2FudmFzXG4gICAgcmVuZGVyV3JvbGQoKTtcbiAgICAvLyAyLiBVcGRhdGUgZ2FtZSBzdGF0ZVxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBhICpjb3B5KiBvZiB0aGUgbWF0dGVyIGxpc3RzIGlmIGVsZW1lbnRzIG1pZ2h0IGJlIHJlbW92ZWQgZHVyaW5nIGl0ZXJhdGlvblxuICAgIGNvbnN0IGNlbGxzVG9VcGRhdGUgPSBbLi4uKHdvcmxkLm1hdHRlcltcIkNlbGxcIl0gfHwgW10pXTtcbiAgICBmb3IgKGNvbnN0IG1hdHRlciBvZiBjZWxsc1RvVXBkYXRlKSB7XG4gICAgICAgIGlmIChtYXR0ZXIgaW5zdGFuY2VvZiBDZWxsICYmIG1hdHRlci5pc0FsaXZlKSB7XG4gICAgICAgICAgICBtYXR0ZXIuc2ltcGxlQWN0aW9uKCk7IC8vIFVzZSBzaW1wbGUgbG9naWMgT1JcbiAgICAgICAgICAgIC8vIG1hdHRlci5zdGVwUkwoKTsgICAgIC8vIFVzZSBSTCBsb2dpY1xuICAgICAgICAgICAgLy8gbWF0dGVyLmFnaW5nKCk7ICAgICAgLy8gQXBwbHkgYWdpbmdcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyAzLiBSZW5kZXJcbiAgICAvLyBkcmF3R3JpZCgpO1xuICAgIC8vIERyYXcgZm9vZCBmaXJzdFxuICAgICh3b3JsZC5tYXR0ZXJbXCJGb29kXCJdIHx8IFtdKS5mb3JFYWNoKGZvb2QgPT4ge1xuICAgICAgICBpZiAoZm9vZCBpbnN0YW5jZW9mIEZvb2QpXG4gICAgICAgICAgICBkcmF3TWF0dGVyKGZvb2QsIENvbG9yLllFTExPVyk7XG4gICAgfSk7XG4gICAgLy8gRHJhdyBjZWxsc1xuICAgICh3b3JsZC5tYXR0ZXJbXCJDZWxsXCJdIHx8IFtdKS5mb3JFYWNoKGNlbGwgPT4ge1xuICAgICAgICBpZiAoY2VsbCBpbnN0YW5jZW9mIENlbGwpXG4gICAgICAgICAgICBkcmF3TWF0dGVyKGNlbGwsIGNlbGwuY29sb3IsIGZhbHNlKTtcbiAgICB9KTtcbiAgICAvLyA0LiBSZXF1ZXN0IG5leHQgZnJhbWVcbiAgICBhbmltYXRpb25GcmFtZUlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGdhbWVMb29wKTtcbn1cbi8vIC0tLSBTdGFydC9TdG9wIENvbnRyb2xzIC0tLSAoQ2FsbGVkIGZyb20gSFRNTClcbi8vIHNldHVwVmlzdWFsaXphdGlvbigpOyAvLyBEUFIgY2hhbmdlIGNhdXNlIHNvbWUgZXJyb3JzIHRoYXQgb3V0c2lkZSBvZiBjYW52YXNcbmZ1bmN0aW9uIHN0YXJ0R2FtZSgpIHtcbiAgICBpZiAocnVubmluZylcbiAgICAgICAgcmV0dXJuOyAvLyBQcmV2ZW50IG11bHRpcGxlIHN0YXJ0c1xuICAgIGNvbnNvbGUubG9nKFwiU3RhcnRpbmcgc2ltdWxhdGlvbi4uLlwiKTtcbiAgICAvLyBVcGRhdGUgcG9wdWxhdGlvbiB2YWx1ZXMgZnJvbSB1c2VyIGlucHV0XG4gICAgdXBkYXRlUG9wdWxhdGlvbigpO1xuICAgIHVwZGF0ZVdvcmxkKCk7XG4gICAgcnVubmluZyA9IHRydWU7XG4gICAgcG9wdWxhdGVXb3JsZCgpOyAvLyBJbml0aWFsaXplIHdvcmxkIHN0YXRlXG4gICAgZ2FtZUxvb3AoKTsgLy8gU3RhcnQgdGhlIGFuaW1hdGlvbiBsb29wXG59XG5mdW5jdGlvbiBzdG9wR2FtZSgpIHtcbiAgICBjb25zb2xlLmxvZyhcIlJlcXVlc3Rpbmcgc2ltdWxhdGlvbiBzdG9wLi4uXCIpO1xuICAgIHJ1bm5pbmcgPSBmYWxzZTsgLy8gU2lnbmFsIHRoZSBsb29wIHRvIHN0b3BcbiAgICAvLyBUaGUgbG9vcCB3aWxsIHN0b3AgaXRzZWxmIG9uIHRoZSBuZXh0IGZyYW1lIGNoZWNrXG59XG53aW5kb3cuc3RhcnRHYW1lID0gc3RhcnRHYW1lO1xud2luZG93LnN0b3BHYW1lID0gc3RvcEdhbWU7XG4vLyBPcHRpb25hbDogQXV0b21hdGljYWxseSBzdGFydCBvbiBsb2FkLCBvciB3YWl0IGZvciBidXR0b24gY2xpY2tcbi8vIHdpbmRvdy5vbmxvYWQgPSBzdGFydEdhbWU7IC8vIEV4YW1wbGU6IFN0YXJ0IGF1dG9tYXRpY2FsbHlcbmNvbnNvbGUubG9nKFwibWFpbi50cyBsb2FkZWQuIENhbGwgc3RhcnRHYW1lKCkgdG8gYmVnaW4uXCIpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9