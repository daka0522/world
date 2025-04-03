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
    ctx.fillStyle = `rgb(${_params__WEBPACK_IMPORTED_MODULE_1__.Color.BLACK.join(',')})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
setupVisualization(); // Ensure canvas is ready
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFpQztBQUNJO0FBQ3JDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEIsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBLDBCQUEwQixtQkFBbUI7QUFDN0MsOEJBQThCLGtCQUFrQjtBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWSwwQ0FBSztBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsZUFBZSxHQUFHLHVDQUF1QztBQUNwRix5QkFBeUIsMENBQUs7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaURBQWlEO0FBQ2pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUIsMENBQUs7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBLGlCQUFpQixxQkFBcUI7QUFDdEM7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCO0FBQ3ZCO0FBQ0E7QUFDQSx1QkFBdUI7QUFDdkI7QUFDQTtBQUNBLHVCQUF1QjtBQUN2QjtBQUNBO0FBQ0EsdUJBQXVCO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QjtBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEI7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQSxzQkFBc0I7QUFDdEI7QUFDQSxzQkFBc0I7QUFDdEI7QUFDQSxzQkFBc0I7QUFDdEIscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUNBQXVDO0FBQ3ZDO0FBQ0E7QUFDQSxtREFBbUQ7QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNEJBQTRCO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEI7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFBNEI7QUFDNUI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUM7QUFDbkMsaUNBQWlDO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJEQUEyRDtBQUMzRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvRUFBb0U7QUFDcEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlFQUFpRTtBQUNqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0M7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUVBQWlFO0FBQ2pFO0FBQ0E7QUFDQSxvQ0FBb0MsVUFBVSxXQUFXLFVBQVUsWUFBWSwwQkFBMEIsWUFBWSxPQUFPLFNBQVMsdUNBQXVDO0FBQzVLO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QixnQ0FBZ0M7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7QUMvWUE7QUFDTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUZBQWlGO0FBQ2pGOzs7Ozs7O1VDNUJBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7Ozs7O0FDTkE7QUFDMkM7QUFDVjtBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQix3Q0FBSztBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0Isd0NBQUs7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtDQUErQyxhQUFhLFdBQVcsWUFBWTtBQUNuRjtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QiwwQ0FBSyxpQkFBaUIsSUFBSTtBQUN2RCx5QkFBeUI7QUFDekIsb0JBQW9CLG1CQUFtQjtBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLG9CQUFvQjtBQUN4QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLHNCQUFzQjtBQUNqRDtBQUNBO0FBQ0EsMkNBQTJDLHVDQUFJO0FBQy9DLCtCQUErQiwwQ0FBSyxpQkFBaUI7QUFDckQ7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLFlBQVksa0JBQWtCO0FBQ3RELDZCQUE2QixjQUFjO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUM7QUFDdkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBLG1CQUFtQjtBQUNuQjtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0Isa0JBQWtCO0FBQ3RDLFlBQVksdUNBQUksU0FBUztBQUN6QjtBQUNBLG9CQUFvQixpQkFBaUI7QUFDckMsWUFBWSx1Q0FBSTtBQUNoQjtBQUNBLDJDQUEyQyxrQ0FBa0MsVUFBVSxrQ0FBa0M7QUFDekg7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLDBDQUFLLGlCQUFpQjtBQUNqRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQiwwQ0FBSyxpQkFBaUI7QUFDakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhCQUE4Qix1Q0FBSTtBQUNsQyxtQ0FBbUM7QUFDbkMsb0NBQW9DO0FBQ3BDLG9DQUFvQztBQUNwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFBNEIsdUNBQUk7QUFDaEMsNkJBQTZCLDBDQUFLO0FBQ2xDLEtBQUs7QUFDTDtBQUNBO0FBQ0EsNEJBQTRCLHVDQUFJO0FBQ2hDO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCO0FBQ0E7QUFDQSxnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4QkFBOEI7QUFDOUIiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90c192ZXJzaW9uLy4vc3JjL2NvcmUudHMiLCJ3ZWJwYWNrOi8vdHNfdmVyc2lvbi8uL3NyYy9wYXJhbXMudHMiLCJ3ZWJwYWNrOi8vdHNfdmVyc2lvbi93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly90c192ZXJzaW9uL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly90c192ZXJzaW9uL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vdHNfdmVyc2lvbi93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3RzX3ZlcnNpb24vLi9zcmMvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb2xvciB9IGZyb20gXCIuL3BhcmFtc1wiO1xuZXhwb3J0IHsgV29ybGQsIE1hdHRlciwgQ2VsbCwgRm9vZCB9O1xuY2xhc3MgV29ybGQge1xuICAgIHdpZHRoO1xuICAgIGhlaWdodDtcbiAgICBzcGFjZXM7XG4gICAgbWF0dGVyOyAvLyBEaWN0aW9uYXJ5IGVxdWl2YWxlbnRcbiAgICBtYXR0ZXJDb3VudDtcbiAgICBjb25zdHJ1Y3RvcihzaXplKSB7XG4gICAgICAgIHRoaXMud2lkdGggPSBzaXplO1xuICAgICAgICB0aGlzLmhlaWdodCA9IHNpemU7XG4gICAgICAgIHRoaXMuc3BhY2VzID0gQXJyYXkodGhpcy5oZWlnaHQpLmZpbGwoMCkubWFwKCgpID0+IEFycmF5KHRoaXMud2lkdGgpLmZpbGwoMCkpO1xuICAgICAgICB0aGlzLm1hdHRlciA9IHsgXCJDZWxsXCI6IFtdLCBcIkZvb2RcIjogW10gfTtcbiAgICAgICAgdGhpcy5tYXR0ZXJDb3VudCA9IHsgQ2VsbDogMCwgXCJGb29kXCI6IDAgfTtcbiAgICB9XG4gICAgZ2V0RnJlZVNwYWNlcygpIHtcbiAgICAgICAgY29uc3QgZnJlZVNwYWNlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLmhlaWdodDsgcm93KyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IGNvbCA9IDA7IGNvbCA8IHRoaXMud2lkdGg7IGNvbCsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3BhY2VzW3Jvd11bY29sXSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBmcmVlU3BhY2VzLnB1c2goW3JvdywgY29sXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmcmVlU3BhY2VzO1xuICAgIH1cbiAgICBnZXRSYW5kb21GcmVlU3BhY2UoKSB7XG4gICAgICAgIGNvbnN0IGZyZWVTcGFjZXMgPSB0aGlzLmdldEZyZWVTcGFjZXMoKTtcbiAgICAgICAgaWYgKGZyZWVTcGFjZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHJhbmRvbUluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZnJlZVNwYWNlcy5sZW5ndGgpO1xuICAgICAgICAgICAgcmV0dXJuIGZyZWVTcGFjZXNbcmFuZG9tSW5kZXhdO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIEhlbHBlciB0byBjaGVjayBpZiBsb2NhdGlvbiBpcyB3aXRoaW4gYm91bmRzXG4gICAgaXNXaXRoaW5Cb3VuZHMobG9jYXRpb24pIHtcbiAgICAgICAgY29uc3QgaXNOb3ROdWxsID0gbG9jYXRpb24gIT09IG51bGw7XG4gICAgICAgIGNvbnN0IGlzSW5IZWlnaHQgPSBsb2NhdGlvblswXSA+PSAwICYmIGxvY2F0aW9uWzBdIDwgdGhpcy5oZWlnaHQ7XG4gICAgICAgIGNvbnN0IGlzSW5XaWR0aCA9IGxvY2F0aW9uWzFdID49IDAgJiYgbG9jYXRpb25bMV0gPCB0aGlzLndpZHRoO1xuICAgICAgICByZXR1cm4gaXNOb3ROdWxsICYmIGlzSW5IZWlnaHQgJiYgaXNJbldpZHRoO1xuICAgIH1cbiAgICAvLyBIZWxwZXIgdG8gZ2V0IG9iamVjdCBhdCBsb2NhdGlvblxuICAgIGdldE9iamVjdEF0KGxvY2F0aW9uKSB7XG4gICAgICAgIGlmICh0aGlzLmlzV2l0aGluQm91bmRzKGxvY2F0aW9uKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3BhY2VzW2xvY2F0aW9uWzBdXVtsb2NhdGlvblsxXV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn1cbmNsYXNzIE1hdHRlciB7XG4gICAgd29ybGQ7XG4gICAgaXNBbGl2ZSA9IGZhbHNlO1xuICAgIGN1cnJlbnRMb2NhdGlvbiA9IG51bGw7XG4gICAgY29sb3IgPSBDb2xvci5CTEFDSztcbiAgICBhZ2UgPSAwO1xuICAgIGJvcm5UaW1lID0gMC4wO1xuICAgIG5hbWUgPSAnJztcbiAgICBjbGFzc05hbWU7XG4gICAgY29uc3RydWN0b3Iod29ybGQpIHtcbiAgICAgICAgdGhpcy53b3JsZCA9IHdvcmxkO1xuICAgICAgICB0aGlzLmNsYXNzTmFtZSA9IHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgICAgICAgY29uc3QgZnJlZVNwYWNlID0gdGhpcy53b3JsZC5nZXRSYW5kb21GcmVlU3BhY2UoKTtcbiAgICAgICAgaWYgKGZyZWVTcGFjZSkge1xuICAgICAgICAgICAgdGhpcy5ib3JuKGZyZWVTcGFjZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJObyBmcmVlIHNwYWNlIGZvciBuZXcgTWF0dGVyXCIpO1xuICAgICAgICAgICAgLy8gRGVjaWRlIGhvdyB0byBoYW5kbGUgbm8gc3BhY2UgLSBtYXliZSB0aHJvdyBlcnJvciBvciByZXR1cm4gbnVsbC91bmRlZmluZWRcbiAgICAgICAgfVxuICAgIH1cbiAgICBib3JuKGxvY2F0aW9uKSB7XG4gICAgICAgIGlmICghbG9jYXRpb24gfHwgdGhpcy53b3JsZC5zcGFjZXNbbG9jYXRpb25bMF1dW2xvY2F0aW9uWzFdXSAhPT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkNhbm5vdCBib3JuIE1hdHRlciBhdCBvY2N1cGllZCBvciBpbnZhbGlkIGxvY2F0aW9uOiBcIiwgbG9jYXRpb24pO1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJDYW5ub3QgYm9ybiBNYXR0ZXIgYXQgb2NjdXBpZWQgb3IgaW52YWxpZCBsb2NhdGlvblwiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMud29ybGQuc3BhY2VzW2xvY2F0aW9uWzBdXVtsb2NhdGlvblsxXV0gPT0gdGhpcztcbiAgICAgICAgICAgIC8vIEluaXRpYWxpemUgbWF0dGVyIHR5cGUgYXJyYXkgaWYgbm90IGV4aXN0c1xuICAgICAgICAgICAgaWYgKCF0aGlzLndvcmxkLm1hdHRlclt0aGlzLmNsYXNzTmFtZV0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkLm1hdHRlclt0aGlzLmNsYXNzTmFtZV0gPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkLm1hdHRlckNvdW50W3RoaXMuY2xhc3NOYW1lXSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLndvcmxkLm1hdHRlclt0aGlzLmNsYXNzTmFtZV0ucHVzaCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMud29ybGQubWF0dGVyQ291bnRbdGhpcy5jbGFzc05hbWVdKys7XG4gICAgICAgICAgICB0aGlzLmlzQWxpdmUgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50TG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgIHRoaXMuYm9yblRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gYCR7dGhpcy5jbGFzc05hbWV9XyR7dGhpcy53b3JsZC5tYXR0ZXJDb3VudFt0aGlzLmNsYXNzTmFtZV19YDtcbiAgICAgICAgICAgIHRoaXMuY29sb3IgPSBDb2xvci5nZXRSYW5kb21Db2xvcigwLCAyNTUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRpZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNBbGl2ZSAmJiB0aGlzLmN1cnJlbnRMb2NhdGlvbikge1xuICAgICAgICAgICAgY29uc3QgW3JvdywgY29sXSA9IHRoaXMuY3VycmVudExvY2F0aW9uO1xuICAgICAgICAgICAgaWYgKHRoaXMud29ybGQuc3BhY2VzW3Jvd11bY29sXSA9PT0gdGhpcykge1xuICAgICAgICAgICAgICAgIHRoaXMud29ybGQuc3BhY2VzW3Jvd11bY29sXSA9IDA7IC8vIHNldCBzcGFjZSBlbXB0eSBiYWNrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy53b3JsZC5tYXR0ZXJbdGhpcy5jbGFzc05hbWVdKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLndvcmxkLm1hdHRlclt0aGlzLmNsYXNzTmFtZV0uaW5kZXhPZih0aGlzKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndvcmxkLm1hdHRlclt0aGlzLmNsYXNzTmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmlzQWxpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuY29sb3IgPSBDb2xvci5CTEFDSztcbiAgICAgICAgICAgIHRoaXMuY3VycmVudExvY2F0aW9uID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn1cbmNsYXNzIEZvb2QgZXh0ZW5kcyBNYXR0ZXIge1xuICAgIGVuZXJneSA9IDIwO1xuICAgIGNvbnN0cnVjdG9yKHdvcmxkKSB7XG4gICAgICAgIHN1cGVyKHdvcmxkKTtcbiAgICB9XG59XG5jbGFzcyBDZWxsIGV4dGVuZHMgTWF0dGVyIHtcbiAgICBmYWNlID0gbnVsbDtcbiAgICBlbmVyZ3kgPSAzMDtcbiAgICBNQVhfRU5FUkdZID0gMTAwO1xuICAgIC8vIFN0YXRlczogezA6IEVtcHR5LCAxOiBPdGhlciBDZWxsLCAyOiBGb29kLCAzOiBXYWxsKG91dCBib3VuZGFyeSl9XG4gICAgc3RhdGVzID0gWzAsIDEsIDIsIDNdO1xuICAgIC8vIEFjdGlvbnM6IHswOiB0dXJuX2ZhY2UsIDE6IGdvfSAtIG1hcCBpbmRleCB0byBhY3Rpb24gbmFtZVxuICAgIGFjdGlvbnMgPSBbXCJ0dXJuX2ZhY2VcIiwgXCJnb1wiXTtcbiAgICAvLyBNZW1vcnkgZm9yIFJMOiBzdGF0ZSAqIGFjdGlvbiBtYXRyaXhcbiAgICBtZW1vcnk7IC8vIHJvd3M9c3RhdGVzLCBjb2xzPWFjdGlvbnNcbiAgICBjb25zdHJ1Y3Rvcih3b3JsZCkge1xuICAgICAgICBzdXBlcih3b3JsZCk7IC8vIENhbGxzIE1hdHRlciBjb25zdHJ1Y3Rvciwgd2hpY2ggY2FsbHMgYm9ybigpXG4gICAgICAgIC8vIEluaXRpYWxpemUgbWVtb3J5IGFmdGVyIG1heWJlIGJpcnRoXG4gICAgICAgIGlmICh0aGlzLmlzQWxpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuZmFjZSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDQpO1xuICAgICAgICB9XG4gICAgICAgIC8vIEluaXRpYWxpemUgbWVtb3J5IG1hdHJpeCB3aXRoIHplcm9zXG4gICAgICAgIHRoaXMubWVtb3J5ID0gQXJyYXkodGhpcy5zdGF0ZXMubGVuZ3RoKS5maWxsKDApLm1hcCgoKSA9PiBBcnJheSh0aGlzLmFjdGlvbnMubGVuZ3RoKS5maWxsKDApKTtcbiAgICB9XG4gICAgc2Vuc2VGcm9udChzZW5zZVJlYWNoID0gMSkge1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50TG9jYXRpb24gPT09IG51bGwgfHwgdGhpcy5mYWNlID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBbcm93LCBjb2xdID0gdGhpcy5jdXJyZW50TG9jYXRpb247XG4gICAgICAgIGxldCBuZXh0UiA9IHJvdztcbiAgICAgICAgbGV0IG5leHRDID0gY29sO1xuICAgICAgICBzd2l0Y2ggKHRoaXMuZmFjZSkge1xuICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgIG5leHRSIC09IHNlbnNlUmVhY2g7XG4gICAgICAgICAgICAgICAgYnJlYWs7IC8vIEZyb250XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgbmV4dEMgKz0gc2Vuc2VSZWFjaDtcbiAgICAgICAgICAgICAgICBicmVhazsgLy8gUklnaHRcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICBuZXh0UiArPSBzZW5zZVJlYWNoO1xuICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBCYWNrXG4gICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgbmV4dEMgLT0gc2Vuc2VSZWFjaDtcbiAgICAgICAgICAgICAgICBicmVhazsgLy8gTGVmdCBcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkludmFsaWQgZmFjZTpcIiwgdGhpcy5mYWNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW25leHRSLCBuZXh0Q107XG4gICAgfVxuICAgIC8vIFNpbXBsZSBkZWNpc2lvbiBsb2dpYyAobGlrZSBhc2tfbmV4dF9tb3ZlIGluIFB5dGhvbilcbiAgICBzaW1wbGVBY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0FsaXZlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBuZXh0TG9jYXRpb24gPSB0aGlzLnNlbnNlRnJvbnQoKTtcbiAgICAgICAgY29uc3Qgd2hhdHNOZXh0ID0gdGhpcy5hc2tXaGF0c05leHQobmV4dExvY2F0aW9uKTtcbiAgICAgICAgc3dpdGNoICh3aGF0c05leHQpIHtcbiAgICAgICAgICAgIGNhc2UgMDogLy8gRW1wdHlcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmUobmV4dExvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjogLy8gRm9vZFxuICAgICAgICAgICAgICAgIGNvbnN0IG9iaiA9IHRoaXMud29ybGQuZ2V0T2JqZWN0QXQobmV4dExvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgRm9vZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVhdChvYmopO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHsgLy8gU2hvdWxkIG5vdCBoYXBwZW4gaWYgYXNrV2hhdHNOZXh0IGlzIGNvcnJlY3QsIGJ1dCBzYWZlIGNoZWNrXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHVybkZhY2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDE6IC8vIENlbGxcbiAgICAgICAgICAgIGNhc2UgMzogLy8gV2FsbFxuICAgICAgICAgICAgZGVmYXVsdDogLy8gSW5jbHVkZXMgbnVsbCAob3V0IG9mIGJvdW5kcylcbiAgICAgICAgICAgICAgICB0aGlzLnR1cm5GYWNlKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbmVyZ3kgLT0gMTsgLy8gRW5lcmd5IGNvbnN1bXB0aW9uIHBlciBhY3Rpb24gYXR0ZW1wdFxuICAgICAgICAvLyBBZGQgYWdpbmcgbG9naWMgaWYgbmVlZGVkXG4gICAgICAgIC8vIHRoaXMuY2hlY2tFbmVyZ3koKTtcbiAgICB9XG4gICAgY2hlY2tFbmVyZ3koKSB7XG4gICAgICAgIGlmICh0aGlzLmVuZXJneSA8PSAwKSB7XG4gICAgICAgICAgICB0aGlzLmRpZSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIC0tLSBSTCBGdW5jdGlvbnMgLS0tXG4gICAgYXNrV2hhdHNOZXh0KGxvY2F0aW9uKSB7XG4gICAgICAgIGlmICghdGhpcy53b3JsZC5pc1dpdGhpbkJvdW5kcyhsb2NhdGlvbikpIHtcbiAgICAgICAgICAgIHJldHVybiAzOyAvLyBXYWxsL091dCBvZiBib3VuZHNcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvYmogPSB0aGlzLndvcmxkLmdldE9iamVjdEF0KGxvY2F0aW9uKTtcbiAgICAgICAgaWYgKG9iaiA9PT0gMClcbiAgICAgICAgICAgIHJldHVybiAwOyAvLyBFbXB0eVxuICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgQ2VsbClcbiAgICAgICAgICAgIHJldHVybiAxOyAvLyBBbm90aGVyIENlbGxcbiAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIEZvb2QpXG4gICAgICAgICAgICByZXR1cm4gMjsgLy8gRm9vZFxuICAgICAgICByZXR1cm4gbnVsbDsgLy8gU2hvdWxkIG5vdCBoYXBwZW5cbiAgICB9XG4gICAgLy8gQ29ycmVzcG9uZHMgdG8gUkwgRnVuY3Rpb24gMjogZXhwZWN0XG4gICAgZXhwZWN0UmV3YXJkKHN0YXRlKSB7XG4gICAgICAgIGlmIChzdGF0ZSA+PSAwICYmIHN0YXRlIDwgdGhpcy5tZW1vcnkubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tZW1vcnlbc3RhdGVdOyAvLyBSZXR1cm5zIHRoZSBhY3Rpb24gcmV3YXJkcyBhcnJheSBmb3IgdGhpcyBzdGF0ZVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJJbnZhbGlkIHN0YXRlIGZvciBleHBlY3RhdGlvbjpcIiwgc3RhdGUpO1xuICAgICAgICByZXR1cm4gQXJyYXkodGhpcy5hY3Rpb25zLmxlbmd0aCkuZmlsbCgwKTsgLy8gUmV0dXJuIGRlZmF1bHQgaWYgc3RhdGUgaXMgaW52YWxpZFxuICAgIH1cbiAgICAvLyBDb3JyZXNwb25kcyB0byBSTCBGdW5jdGlvbiAzOiBiZXN0X2FjdGlvblxuICAgIGNob29zZUFjdGlvbihzdGF0ZVJld2FyZHMsIGVwc2lsb24gPSAwLjEpIHtcbiAgICAgICAgLy8gRXBzaWxvbi1ncmVlZHlcbiAgICAgICAgaWYgKE1hdGgucmFuZG9tKCkgPCBlcHNpbG9uIHx8IHN0YXRlUmV3YXJkcy5ldmVyeShyID0+IHIgPT09IDApKSB7XG4gICAgICAgICAgICAvLyBFeHBsb3JlOiBDaG9vc2UgcmFuZG9tIGFjdGlvblxuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHRoaXMuYWN0aW9ucy5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gRXhwbG9pdDogQ2hvb3NlIGFjdGlvbiB3aXRoIG1heCByZXdhcmRcbiAgICAgICAgICAgIC8vIEZpbmQgaW5kZXggb2YgbWF4IHZhbHVlLiBJZiB0aWVzLCBwaWNrcyBmaXJzdCBvbmUuXG4gICAgICAgICAgICByZXR1cm4gc3RhdGVSZXdhcmRzLmluZGV4T2YoTWF0aC5tYXgoLi4uc3RhdGVSZXdhcmRzKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gQ29ycmVzcG9uZHMgdG8gUkwgRnVuY3Rpb24gNDogZG9fYWN0aW9uXG4gICAgcGVyZm9ybUFjdGlvbihhY3Rpb25JbmRleCwgc3RhdGUsIG5leHRMb2NhdGlvbikge1xuICAgICAgICBjb25zdCBhY3Rpb25OYW1lID0gdGhpcy5hY3Rpb25zW2FjdGlvbkluZGV4XTtcbiAgICAgICAgbGV0IHJld2FyZCA9IDA7XG4gICAgICAgIHN3aXRjaCAoYWN0aW9uTmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcInR1cm5fZmFjZVwiOlxuICAgICAgICAgICAgICAgIHRoaXMudHVybkZhY2UoKTtcbiAgICAgICAgICAgICAgICByZXdhcmQgPSAwOyAvLyBPciBhIHNtYWxsIG5lZ2F0aXZlIHJld2FyZCBmb3Igbm90IHByb2dyZXNzaW5nP1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImdvXCI6XG4gICAgICAgICAgICAgICAgcmV3YXJkID0gdGhpcy5nbyhzdGF0ZSwgbmV4dExvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkludmFsaWQgYWN0aW9uIGluZGV4OlwiLCBhY3Rpb25JbmRleCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbmVyZ3kgLT0gMTsgLy8gQ29uc3VtZSBlbmVyZ3kgcGVyIGFjdGlvblxuICAgICAgICB0aGlzLmNoZWNrRW5lcmd5KCk7XG4gICAgICAgIHJldHVybiByZXdhcmQ7XG4gICAgfVxuICAgIC8vIENvcnJlc3BvbmRzIHRvIFJMIEZ1bmN0aW9uIDU6IHJlbWVtYmVyXG4gICAgcmVtZW1iZXIoc3RhdGUsIGFjdGlvbkluZGV4LCByZXdhcmQpIHtcbiAgICAgICAgaWYgKHN0YXRlID49IDAgJiYgc3RhdGUgPCB0aGlzLm1lbW9yeS5sZW5ndGggJiYgYWN0aW9uSW5kZXggPj0gMCAmJiBhY3Rpb25JbmRleCA8IHRoaXMuYWN0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMubWVtb3J5W3N0YXRlXVthY3Rpb25JbmRleF0gKz0gcmV3YXJkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkludmFsaWQgc3RhdGUgb3IgYWN0aW9uIGluZGV4IGZvciBtZW1vcnkgdXBkYXRlOlwiLCBzdGF0ZSwgYWN0aW9uSW5kZXgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIENvcnJlc3BvbmRzIHRvIFJMIEZ1bmN0aW9uIC0gcHJpdmF0ZSBfZ29cbiAgICBnbyhzdGF0ZSwgbmV4dExvY2F0aW9uKSB7XG4gICAgICAgIGxldCByZXdhcmQgPSAwO1xuICAgICAgICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgICAgICAgICBjYXNlIDA6IC8vIEVtcHR5XG4gICAgICAgICAgICAgICAgaWYgKG5leHRMb2NhdGlvbilcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3ZlKG5leHRMb2NhdGlvbik7XG4gICAgICAgICAgICAgICAgcmV3YXJkID0gMTsgLy8gUmV3YXJkIGZvciBtb3ZpbmcgdG8gZW1wdHkgc3BhY2VcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjogLy8gRm9vZFxuICAgICAgICAgICAgICAgIGNvbnN0IG9iaiA9IG5leHRMb2NhdGlvbiA/IHRoaXMud29ybGQuZ2V0T2JqZWN0QXQobmV4dExvY2F0aW9uKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIEZvb2QpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lYXQob2JqKTsgLy8gZWF0KCkgaW1wbGljaXRseSBtb3ZlcyB0aGUgY2VsbCB0byBmb29kJ3MgbG9jYXRpb25cbiAgICAgICAgICAgICAgICAgICAgcmV3YXJkID0gMTA7IC8vIEhpZ2ggcmV3YXJkIGZvciBlYXRpbmdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENlbGwgdGhvdWdodCBpdCB3YXMgZm9vZCwgYnV0IGl0IHdhc24ndCAoZS5nLiwgZGlzYXBwZWFyZWQpLiBUdXJuP1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnR1cm5GYWNlKCk7XG4gICAgICAgICAgICAgICAgICAgIHJld2FyZCA9IC0xOyAvLyBQZW5hbHR5IGZvciBmYWlsZWQgYWN0aW9uXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAxOiAvLyBDZWxsXG4gICAgICAgICAgICBjYXNlIDM6IC8vIFdhbGxcbiAgICAgICAgICAgIGRlZmF1bHQ6IC8vIEluY2x1ZGVzIGludmFsaWQgc3RhdGVzIG9yIGZhaWxlZCBtb3Zlc1xuICAgICAgICAgICAgICAgIHRoaXMudHVybkZhY2UoKTtcbiAgICAgICAgICAgICAgICByZXdhcmQgPSAtMTsgLy8gUGVuYWx0eSBmb3IgYnVtcGluZyBvciBpbnZhbGlkIG1vdmVcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV3YXJkO1xuICAgIH1cbiAgICAvLyAtLS0gU3RhbmRhcmQgQWN0aW9ucyAtLS1cbiAgICBtb3ZlKG5ld0xvY2F0aW9uKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0FsaXZlIHx8ICFuZXdMb2NhdGlvbiB8fCAhdGhpcy53b3JsZC5pc1dpdGhpbkJvdW5kcyhuZXdMb2NhdGlvbikpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUud2FybihcIkNhbm5vdCBtb3ZlOiBDZWxsIGRlYWQsIGxvY2F0aW9uIGludmFsaWQgb3Igb3V0IG9mIGJvdW5kc1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0YXJnZXRPYmogPSB0aGlzLndvcmxkLmdldE9iamVjdEF0KG5ld0xvY2F0aW9uKTtcbiAgICAgICAgaWYgKHRhcmdldE9iaiAhPT0gMCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS53YXJuKFwiQ2Fubm90IG1vdmUgdG8gb2NjdXBpZWQgc3BhY2U6XCIsIG5ld0xvY2F0aW9uKTtcbiAgICAgICAgICAgIC8vIE9wdGlvbmFsOiB0dXJuIGZhY2UgaW5zdGVhZD9cbiAgICAgICAgICAgIHRoaXMudHVybkZhY2UoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBDbGVhciBvbGQgbG9jYXRpb24gaW4gd29ybGQgZ3JpZFxuICAgICAgICBpZiAodGhpcy5jdXJyZW50TG9jYXRpb24pIHtcbiAgICAgICAgICAgIGNvbnN0IFtvbGRSLCBvbGRDXSA9IHRoaXMuY3VycmVudExvY2F0aW9uO1xuICAgICAgICAgICAgaWYgKHRoaXMud29ybGQuZ2V0T2JqZWN0QXQoW29sZFIsIG9sZENdKSA9PT0gdGhpcykge1xuICAgICAgICAgICAgICAgIHRoaXMud29ybGQuc3BhY2VzW29sZFJdW29sZENdID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBVcGRhdGUgd29ybGQgZ3JpZCB3aXRoIG5ldyBsb2NhdGlvblxuICAgICAgICBjb25zdCBbbmV3UiwgbmV3Q10gPSBuZXdMb2NhdGlvbjtcbiAgICAgICAgdGhpcy53b3JsZC5zcGFjZXNbbmV3Ul1bbmV3Q10gPSB0aGlzO1xuICAgICAgICAvLyBVcGRhdGUgY2VsbCdzIGN1cnJlbnQgbG9jYXRpb25cbiAgICAgICAgdGhpcy5jdXJyZW50TG9jYXRpb24gPSBuZXdMb2NhdGlvbjtcbiAgICAgICAgLy8gTm90ZTogRW5lcmd5IGNvbnN1bXB0aW9uIGlzIGhhbmRsZWQgaW4gcGVyZm9ybUFjdGlvbiBvciBzaW1wbGVBY3Rpb25cbiAgICAgICAgLy8gTm90ZTogQWdpbmcgaXMgbm90IGltcGxlbWVudGVkIGhlcmUgeWV0XG4gICAgfVxuICAgIHR1cm5GYWNlKG5ld0ZhY2UpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzQWxpdmUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmIChuZXdGYWNlICE9PSB1bmRlZmluZWQgJiYgbmV3RmFjZSA+PSAwICYmIG5ld0ZhY2UgPD0gMykge1xuICAgICAgICAgICAgdGhpcy5mYWNlID0gbmV3RmFjZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIFR1cm4gcmFuZG9tbHksIGV4Y2x1ZGluZyBjdXJyZW50IGRpcmVjdGlvblxuICAgICAgICAgICAgY29uc3QgcG9zc2libGVGYWNlcyA9IFswLCAxLCAyLCAzXTtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRGYWNlSW5kZXggPSBwb3NzaWJsZUZhY2VzLmluZGV4T2YodGhpcy5mYWNlKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50RmFjZUluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgICAgICBwb3NzaWJsZUZhY2VzLnNwbGljZShjdXJyZW50RmFjZUluZGV4LCAxKTsgLy8gUmVtb3ZlIGN1cnJlbnQgZmFjZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5mYWNlID0gcG9zc2libGVGYWNlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwb3NzaWJsZUZhY2VzLmxlbmd0aCldO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdGU6IEVuZXJneSBjb25zdW1wdGlvbiBoYW5kbGVkIGVsc2V3aGVyZVxuICAgIH1cbiAgICBlYXQoZm9vZCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNBbGl2ZSB8fCAhZm9vZC5pc0FsaXZlIHx8ICFmb29kLmN1cnJlbnRMb2NhdGlvbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgLy8gQ2xlYXIgb2xkIGxvY2F0aW9uXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRMb2NhdGlvbikge1xuICAgICAgICAgICAgY29uc3QgW29sZFIsIG9sZENdID0gdGhpcy5jdXJyZW50TG9jYXRpb247XG4gICAgICAgICAgICBpZiAodGhpcy53b3JsZC5nZXRPYmplY3RBdChbb2xkUiwgb2xkQ10pID09PSB0aGlzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53b3JsZC5zcGFjZXNbb2xkUl1bb2xkQ10gPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIE1vdmUgdG8gZm9vZCdzIGxvY2F0aW9uXG4gICAgICAgIGNvbnN0IGZvb2RMb2NhdGlvbiA9IGZvb2QuY3VycmVudExvY2F0aW9uO1xuICAgICAgICB0aGlzLmN1cnJlbnRMb2NhdGlvbiA9IGZvb2RMb2NhdGlvbjtcbiAgICAgICAgdGhpcy53b3JsZC5zcGFjZXNbZm9vZExvY2F0aW9uWzBdXVtmb29kTG9jYXRpb25bMV1dID0gdGhpczsgLy8gVGFrZSB0aGUgc3BvdFxuICAgICAgICAvLyBDb25zdW1lIGZvb2QgZW5lcmd5XG4gICAgICAgIHRoaXMuZW5lcmd5ICs9IGZvb2QuZW5lcmd5O1xuICAgICAgICBpZiAodGhpcy5lbmVyZ3kgPiB0aGlzLk1BWF9FTkVSR1kpIHtcbiAgICAgICAgICAgIHRoaXMuZW5lcmd5ID0gdGhpcy5NQVhfRU5FUkdZO1xuICAgICAgICB9XG4gICAgICAgIC8vIEZvb2QgZGllc1xuICAgICAgICBmb29kLmRpZSgpO1xuICAgICAgICAvLyBOb3RlOiBFbmVyZ3kgZ2FpbiBoYW5kbGVkIGhlcmUsIGNvbnN1bXB0aW9uIGhhbmRsZWQgaW4gYWN0aW9uIGxvZ2ljXG4gICAgfVxuICAgIC8vIEV4YW1wbGUgQWdpbmcgKGNhbGwgcGVyaW9kaWNhbGx5KVxuICAgIGFnaW5nKCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNBbGl2ZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgLy8gU2ltcGxlIHRpbWUtYmFzZWQgYWdpbmcgLSBhZGp1c3QgbG9naWMgYXMgbmVlZGVkXG4gICAgICAgIGNvbnN0IGVsYXBzZWRUaW1lID0gKERhdGUubm93KCkgLSB0aGlzLmJvcm5UaW1lKSAvIDEwMDA7IC8vIFRpbWUgaW4gc2Vjb25kc1xuICAgICAgICAvLyBFeGFtcGxlOiBBZ2UgaW5jcmVhc2VzIGV2ZXJ5IDUgc2Vjb25kc1xuICAgICAgICBjb25zdCBuZXdBZ2UgPSBNYXRoLmZsb29yKGVsYXBzZWRUaW1lIC8gNSk7XG4gICAgICAgIGlmIChuZXdBZ2UgPiB0aGlzLmFnZSkge1xuICAgICAgICAgICAgdGhpcy5hZ2UgPSBuZXdBZ2U7XG4gICAgICAgICAgICAvLyBPcHRpb25hbDogRGltIGNvbG9yIHNsaWdodGx5XG4gICAgICAgICAgICAvLyB0aGlzLmNvbG9yID0gdGhpcy5jb2xvci5tYXAoYyA9PiBNYXRoLm1heCgwLCBNYXRoLmZsb29yKGMgKiAwLjk3NSkpKSBhcyBDb2xvclR1cGxlO1xuICAgICAgICAgICAgaWYgKHRoaXMuYWdlID4gMTAwKSB7IC8vIEV4YW1wbGUgbGlmZXNwYW5cbiAgICAgICAgICAgICAgICB0aGlzLmRpZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8vIFJMIFN0ZXAgY29tYmluZWRcbiAgICBzdGVwUkwoKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0FsaXZlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBuZXh0TG9jYXRpb24gPSB0aGlzLnNlbnNlRnJvbnQoKTtcbiAgICAgICAgY29uc3QgbmV4dFN0YXRlID0gdGhpcy5hc2tXaGF0c05leHQobmV4dExvY2F0aW9uKTtcbiAgICAgICAgaWYgKG5leHRTdGF0ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc3Qgc3RhdGVSZXdhcmRzID0gdGhpcy5leHBlY3RSZXdhcmQobmV4dFN0YXRlKTtcbiAgICAgICAgICAgIGNvbnN0IGFjdGlvbkluZGV4ID0gdGhpcy5jaG9vc2VBY3Rpb24oc3RhdGVSZXdhcmRzKTsgLy8gVXNlIGVwc2lsb24tZ3JlZWR5XG4gICAgICAgICAgICBjb25zdCByZXdhcmQgPSB0aGlzLnBlcmZvcm1BY3Rpb24oYWN0aW9uSW5kZXgsIG5leHRTdGF0ZSwgbmV4dExvY2F0aW9uKTtcbiAgICAgICAgICAgIHRoaXMucmVtZW1iZXIobmV4dFN0YXRlLCBhY3Rpb25JbmRleCwgcmV3YXJkKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDZWxsOiAke3RoaXMubmFtZX0sIFN0YXRlOiAke25leHRTdGF0ZX0sIEFjdGlvbjogJHt0aGlzLmFjdGlvbnNbYWN0aW9uSW5kZXhdfSwgUmV3YXJkOiAke3Jld2FyZH0sIE1lbTogJHtKU09OLnN0cmluZ2lmeSh0aGlzLm1lbW9yeVtuZXh0U3RhdGVdKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIEhhbmRsZSBjYXNlcyB3aGVyZSBuZXh0IHN0YXRlIGNvdWxkbid0IGJlIGRldGVybWluZWQgKHNob3VsZCBiZSByYXJlKVxuICAgICAgICAgICAgdGhpcy50dXJuRmFjZSgpOyAvLyBEZWZhdWx0IGFjdGlvbiBpZiBzdGF0ZSBpcyB1bmNlcnRhaW5cbiAgICAgICAgICAgIC8vIHRoaXMuZW5lcmd5IC09MTsgLy8gQ29uc3VtZSBlbmVyZ3lcbiAgICAgICAgICAgIC8vIHRoaXMuY2hlY2tFbmVyZ3koKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBDYWxsIGFnaW5nIHBlcmlvZGljYWxseSBpZiBuZWVkZWRcbiAgICAgICAgLy8gdGhpcy5hZ2luZygpO1xuICAgIH1cbn1cbiIsIi8vIEVxdWl2YWxlbnQgdG8gcGFyYW1zLnB5IFtjaXRlOiB1cGxvYWRlZDpweV92ZXJzaW9uL3BhcmFtcy5weV1cbmV4cG9ydCBjbGFzcyBDb2xvciB7XG4gICAgc3RhdGljIFdISVRFID0gWzI1NSwgMjU1LCAyNTVdO1xuICAgIHN0YXRpYyBZRUxMT1cgPSBbMjU1LCAyNTUsIDBdO1xuICAgIHN0YXRpYyBSRUQgPSBbMjU1LCAwLCAwXTtcbiAgICBzdGF0aWMgQkxVRSA9IFswLCAwLCAyNTVdO1xuICAgIHN0YXRpYyBHUkVFTiA9IFswLCAyNTUsIDBdO1xuICAgIHN0YXRpYyBCTEFDSyA9IFswLCAwLCAwXTtcbiAgICBzdGF0aWMgT1JBTkdFID0gWzI1NSwgMTI4LCAwXTtcbiAgICBzdGF0aWMgUFVSUExFID0gWzEyOCwgMCwgMTI4XTtcbiAgICBzdGF0aWMgQ09MT1JTID0gW1xuICAgICAgICBDb2xvci5XSElURSwgQ29sb3IuWUVMTE9XLCBDb2xvci5SRUQsIENvbG9yLkJMVUUsXG4gICAgICAgIENvbG9yLkdSRUVOLCBDb2xvci5PUkFOR0UsIENvbG9yLlBVUlBMRVxuICAgIF07XG4gICAgc3RhdGljIGdldFJhbmRvbUNvbG9ySW5zZXQoKSB7XG4gICAgICAgIGNvbnN0IHJhbmRvbUluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogQ29sb3IuQ09MT1JTLmxlbmd0aCk7XG4gICAgICAgIHJldHVybiBDb2xvci5DT0xPUlNbcmFuZG9tSW5kZXhdO1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0UmFuZG9tQ29sb3IobWluLCBtYXgpIHtcbiAgICAgICAgY29uc3QgbWluQ2VpbGVkID0gTWF0aC5jZWlsKG1pbik7XG4gICAgICAgIGNvbnN0IG1heEZsb29yZWQgPSBNYXRoLmZsb29yKG1heCk7XG4gICAgICAgIHJldHVybiBbZ2V0UmFuZG9tSW50SW5jbHVzaXZlKG1pbiwgbWF4KSwgZ2V0UmFuZG9tSW50SW5jbHVzaXZlKG1pbiwgbWF4KSwgZ2V0UmFuZG9tSW50SW5jbHVzaXZlKG1pbiwgbWF4KV07XG4gICAgfVxufVxuZnVuY3Rpb24gZ2V0UmFuZG9tSW50SW5jbHVzaXZlKG1pbiwgbWF4KSB7XG4gICAgY29uc3QgbWluQ2VpbGVkID0gTWF0aC5jZWlsKG1pbik7XG4gICAgY29uc3QgbWF4Rmxvb3JlZCA9IE1hdGguZmxvb3IobWF4KTtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heEZsb29yZWQgLSBtaW5DZWlsZWQgKyAxKSArIG1pbkNlaWxlZCk7IC8vIFRoZSBtYXhpbXVtIGlzIGluY2x1c2l2ZSBhbmQgdGhlIG1pbmltdW0gaXMgaW5jbHVzaXZlXG59XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIi8vIEVxdWl2YWxlbnQgdG8gbWFpbi5weSBbY2l0ZTogdXBsb2FkZWQ6cHlfdmVyc2lvbi9tYWluLnB5XVxuaW1wb3J0IHsgV29ybGQsIENlbGwsIEZvb2QgfSBmcm9tICcuL2NvcmUnO1xuaW1wb3J0IHsgQ29sb3IgfSBmcm9tICcuL3BhcmFtcyc7XG4vLyAtLS0gU2ltdWxhdGlvbiBTZXR1cCAtLS1cbmxldCB3b3JsZFNpemUgPSAxMDtcbmxldCBpbml0aWFsQ2VsbHMgPSAxMDtcbmxldCBpbml0aWFsRm9vZCA9IDA7XG5sZXQgd29ybGQgPSBuZXcgV29ybGQod29ybGRTaXplKTtcbi8vIC0tLSBWaXN1YWxpemF0aW9uIFNldHVwIChQbGFjZWhvbGRlcikgLS0tXG5jb25zdCBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIndvcmxkQ2FudmFzXCIpO1xubGV0IHRpbGVXaWR0aCA9IGNhbnZhcy53aWR0aCAvIHdvcmxkLndpZHRoO1xubGV0IHRpbGVIZWlnaHQgPSBjYW52YXMuaGVpZ2h0IC8gd29ybGQuaGVpZ2h0O1xuY29uc3Qgd29ybGRTaXplSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIndvcmxkU2l6ZUNvdW50XCIpO1xuY29uc3QgY2VsbElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjZWxsQ291bnRcIik7XG5jb25zdCBmb29kSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZvb2RDb3VudFwiKTtcbmxldCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xubGV0IGFuaW1hdGlvbkZyYW1lSWQgPSBudWxsOyAvLyBUbyBzdG9wIHRoZSBsb29wXG5sZXQgcnVubmluZyA9IGZhbHNlOyAvLyBDb250cm9sIHRoZSBhbmltYXRpb24gbG9vcFxuZnVuY3Rpb24gc2V0dXBWaXN1YWxpemF0aW9uKCkge1xuICAgIGlmICghY2FudmFzKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDYW52YXMgZWxlbWVudCB3aXRoIGlkICd3b3JsZENhbnZhcycgbm90IGZvdW5kIVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBHZXQgdGhlIGRldmljZSBwaXhlbCByYXRpb1xuICAgIGNvbnN0IGRwciA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDE7XG4gICAgY2FudmFzLndpZHRoICo9IGRwcjtcbiAgICBjYW52YXMuaGVpZ2h0ICo9IGRwcjtcbiAgICBpZiAoIWN0eCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiQ291bGQgbm90IGdldCAyRCByZW5kZXJpbmcgY29udGV4dCFcIik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY3R4LnNjYWxlKGRwciwgZHByKTtcbiAgICBjb25zb2xlLmxvZyhcIkNhbnZhcyBzZXR1cCBjb21wbGV0ZS5cIik7XG59XG5mdW5jdGlvbiB1cGRhdGVXb3JsZCgpIHtcbiAgICB3b3JsZFNpemUgPSBwYXJzZUludCh3b3JsZFNpemVJbnB1dC52YWx1ZSwgMTApIHx8IDA7XG4gICAgd29ybGQgPSBuZXcgV29ybGQod29ybGRTaXplKTtcbiAgICB0aWxlV2lkdGggPSBjYW52YXMud2lkdGggLyB3b3JsZC53aWR0aDtcbiAgICB0aWxlSGVpZ2h0ID0gY2FudmFzLmhlaWdodCAvIHdvcmxkLmhlaWdodDtcbn1cbi8vIEZ1bmN0aW9uIHRvIHVwZGF0ZSB0aGUgaW5pdGlhbCBwb3B1bGF0aW9uIGJhc2VkIG9uIHVzZXIgaW5wdXRcbmZ1bmN0aW9uIHVwZGF0ZVBvcHVsYXRpb24oKSB7XG4gICAgLy8gUGFyc2UgdXNlciBpbnB1dCBhbmQgdXBkYXRlIGluaXRpYWxDZWxscyBhbmQgaW5pdGlhbEZvb2RcbiAgICBpbml0aWFsQ2VsbHMgPSBwYXJzZUludChjZWxsSW5wdXQudmFsdWUsIDEwKSB8fCAwO1xuICAgIGluaXRpYWxGb29kID0gcGFyc2VJbnQoZm9vZElucHV0LnZhbHVlLCAxMCkgfHwgMDtcbiAgICBjb25zb2xlLmxvZyhgVXBkYXRlZCBwb3B1bGF0aW9uOiBDZWxscyA9ICR7aW5pdGlhbENlbGxzfSwgRm9vZCA9ICR7aW5pdGlhbEZvb2R9YCk7XG59XG5mdW5jdGlvbiBkcmF3R3JpZCgpIHtcbiAgICBpZiAoIWN0eClcbiAgICAgICAgcmV0dXJuO1xuICAgIGN0eC5zdHJva2VTdHlsZSA9IGByZ2IoJHtDb2xvci5XSElURS5qb2luKCcsJyl9KWA7IC8vIFdoaXRlIGxpbmVzXG4gICAgY3R4LmxpbmVXaWR0aCA9IDAuNTsgLy8gVGhpbiBsaW5lc1xuICAgIGZvciAobGV0IHggPSAwOyB4IDw9IGNhbnZhcy53aWR0aDsgeCArPSB0aWxlV2lkdGgpIHtcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICBjdHgubW92ZVRvKHgsIDApO1xuICAgICAgICBjdHgubGluZVRvKHgsIGNhbnZhcy53aWR0aCk7XG4gICAgICAgIGN0eC5zdHJva2UoKTtcbiAgICB9XG4gICAgZm9yIChsZXQgeSA9IDA7IHkgPD0gY2FudmFzLmhlaWdodDsgeSArPSB0aWxlSGVpZ2h0KSB7XG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgY3R4Lm1vdmVUbygwLCB5KTtcbiAgICAgICAgY3R4LmxpbmVUbyhjYW52YXMuaGVpZ2h0LCB5KTtcbiAgICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRyYXdNYXR0ZXIobWF0dGVyLCBjb2xvck92ZXJyaWRlLCByZW5kZXJEZXRhaWxzID0gZmFsc2UpIHtcbiAgICBpZiAoIWN0eCB8fCAhbWF0dGVyLmlzQWxpdmUgfHwgIW1hdHRlci5jdXJyZW50TG9jYXRpb24pXG4gICAgICAgIHJldHVybjtcbiAgICBjb25zdCBbcm93LCBjb2xdID0gbWF0dGVyLmN1cnJlbnRMb2NhdGlvbjtcbiAgICBjb25zdCB4ID0gY29sICogdGlsZVdpZHRoO1xuICAgIGNvbnN0IHkgPSByb3cgKiB0aWxlSGVpZ2h0O1xuICAgIGNvbnN0IG1hdHRlckNvbG9yID0gY29sb3JPdmVycmlkZSB8fCBtYXR0ZXIuY29sb3I7XG4gICAgLy8gRHJhdyByZWN0YW5nbGUgZm9yIHRoZSBtYXR0ZXJcbiAgICBjdHguZmlsbFN0eWxlID0gYHJnYigke21hdHRlckNvbG9yLmpvaW4oJywnKX0pYDtcbiAgICBjdHguZmlsbFJlY3QoeCwgeSwgdGlsZVdpZHRoLCB0aWxlSGVpZ2h0KTtcbiAgICAvLyBSZW5kZXIgZGV0YWlscyBsaWtlIG5hbWUsIGVuZXJneSwgZmFjZSAoaWYgQ2VsbCBhbmQgcmVxdWVzdGVkKVxuICAgIGlmIChyZW5kZXJEZXRhaWxzICYmIG1hdHRlciBpbnN0YW5jZW9mIENlbGwpIHtcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGByZ2IoJHtDb2xvci5XSElURS5qb2luKCcsJyl9KWA7XG4gICAgICAgIGN0eC5mb250ID0gJzEwcHggQXJpYWwnO1xuICAgICAgICBjdHgudGV4dEFsaWduID0gJ2xlZnQnO1xuICAgICAgICBjdHgudGV4dEJhc2VsaW5lID0gJ3RvcCc7XG4gICAgICAgIGN0eC5maWxsVGV4dChgJHttYXR0ZXIubmFtZX1gLCB4ICsgMiwgeSArIDIpOyAvLyBTaG93IHBhcnRpYWwgbmFtZSBpZiBuZWVkZWRcbiAgICAgICAgLy8gY3R4LmZpbGxUZXh0KGBFOiR7bWF0dGVyLmVuZXJneX1gLCB4ICsgMiwgeSArIDE0KTtcbiAgICAgICAgLy8gT3B0aW9uYWw6IERyYXcgZmFjZSBpbmRpY2F0b3JcbiAgICAgICAgZHJhd0ZhY2VJbmRpY2F0b3IoY3R4LCB4LCB5LCB0aWxlV2lkdGgsIHRpbGVIZWlnaHQsIG1hdHRlci5mYWNlKTtcbiAgICB9XG59XG4vLyBPcHRpb25hbDogSGVscGVyIGZ1bmN0aW9uIHRvIGRyYXcgYSBkaXJlY3Rpb24gaW5kaWNhdG9yXG5mdW5jdGlvbiBkcmF3RmFjZUluZGljYXRvcihjdHgsIHgsIHksIHcsIGgsIGZhY2UpIHtcbiAgICBpZiAoZmFjZSA9PT0gbnVsbClcbiAgICAgICAgcmV0dXJuO1xuICAgIGN0eC5maWxsU3R5bGUgPSAncmdiYSgwLDAsMCwwLjUpJzsgLy8gU2VtaS10cmFuc3BhcmVudCBibGFja1xuICAgIGNvbnN0IGN4ID0geCArIHcgLyAyO1xuICAgIGNvbnN0IGN5ID0geSArIGggLyAyO1xuICAgIGNvbnN0IGluZGljYXRvclNpemUgPSBNYXRoLm1pbih3LCBoKSAvIDQ7XG4gICAgc3dpdGNoIChmYWNlKSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdChjeCAtIGluZGljYXRvclNpemUgLyAyLCB5ICsgMSwgaW5kaWNhdG9yU2l6ZSwgaW5kaWNhdG9yU2l6ZSk7XG4gICAgICAgICAgICBicmVhazsgLy8gVG9wXG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdCh4ICsgdyAtIGluZGljYXRvclNpemUgLSAxLCBjeSAtIGluZGljYXRvclNpemUgLyAyLCBpbmRpY2F0b3JTaXplLCBpbmRpY2F0b3JTaXplKTtcbiAgICAgICAgICAgIGJyZWFrOyAvLyBSaWdodFxuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBjdHguZmlsbFJlY3QoY3ggLSBpbmRpY2F0b3JTaXplIC8gMiwgeSArIGggLSBpbmRpY2F0b3JTaXplIC0gMSwgaW5kaWNhdG9yU2l6ZSwgaW5kaWNhdG9yU2l6ZSk7XG4gICAgICAgICAgICBicmVhazsgLy8gQm90dG9tXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdCh4ICsgMSwgY3kgLSBpbmRpY2F0b3JTaXplIC8gMiwgaW5kaWNhdG9yU2l6ZSwgaW5kaWNhdG9yU2l6ZSk7XG4gICAgICAgICAgICBicmVhazsgLy8gTGVmdFxuICAgIH1cbn1cbi8vIC0tLSBTaW11bGF0aW9uIExvZ2ljIC0tLVxuZnVuY3Rpb24gcG9wdWxhdGVXb3JsZCgpIHtcbiAgICBjb25zb2xlLmxvZyhcIlBvcHVsYXRpbmcgd29ybGQuLi5cIik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbml0aWFsQ2VsbHM7IGkrKykge1xuICAgICAgICBuZXcgQ2VsbCh3b3JsZCk7IC8vIENvbnN0cnVjdG9yIGhhbmRsZXMgcGxhY2VtZW50XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbEZvb2Q7IGkrKykge1xuICAgICAgICBuZXcgRm9vZCh3b3JsZCk7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKGBXb3JsZCBwb3B1bGF0ZWQuIENlbGxzOiAke3dvcmxkLm1hdHRlcltcIkNlbGxcIl0/Lmxlbmd0aCB8fCAwfSwgRm9vZDogJHt3b3JsZC5tYXR0ZXJbXCJGb29kXCJdPy5sZW5ndGggfHwgMH1gKTtcbn1cbmZ1bmN0aW9uIHJlbmRlcldyb2xkKHJlbmRlckdyaWQgPSBmYWxzZSkge1xuICAgIC8vIDEuIENsZWFyIENhbnZhc1xuICAgIGN0eC5maWxsU3R5bGUgPSBgcmdiKCR7Q29sb3IuQkxBQ0suam9pbignLCcpfSlgO1xuICAgIGN0eC5maWxsUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIGlmIChyZW5kZXJHcmlkKSB7XG4gICAgICAgIC8vIGRyYXdHcmlkKCnDt1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdhbWVMb29wKCkge1xuICAgIGlmICghcnVubmluZyB8fCAhY3R4KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiU3RvcHBpbmcgZ2FtZSBsb29wLlwiKTtcbiAgICAgICAgaWYgKGFuaW1hdGlvbkZyYW1lSWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKGFuaW1hdGlvbkZyYW1lSWQpO1xuICAgICAgICAgICAgYW5pbWF0aW9uRnJhbWVJZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICA7XG4gICAgLy8gMS4gQ2xlYXIgQ2FudmFzXG4gICAgY3R4LmZpbGxTdHlsZSA9IGByZ2IoJHtDb2xvci5CTEFDSy5qb2luKCcsJyl9KWA7XG4gICAgY3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgLy8gMi4gVXBkYXRlIGdhbWUgc3RhdGVcbiAgICAvLyBJdGVyYXRlIHRocm91Z2ggYSAqY29weSogb2YgdGhlIG1hdHRlciBsaXN0cyBpZiBlbGVtZW50cyBtaWdodCBiZSByZW1vdmVkIGR1cmluZyBpdGVyYXRpb25cbiAgICBjb25zdCBjZWxsc1RvVXBkYXRlID0gWy4uLih3b3JsZC5tYXR0ZXJbXCJDZWxsXCJdIHx8IFtdKV07XG4gICAgZm9yIChjb25zdCBtYXR0ZXIgb2YgY2VsbHNUb1VwZGF0ZSkge1xuICAgICAgICBpZiAobWF0dGVyIGluc3RhbmNlb2YgQ2VsbCAmJiBtYXR0ZXIuaXNBbGl2ZSkge1xuICAgICAgICAgICAgbWF0dGVyLnNpbXBsZUFjdGlvbigpOyAvLyBVc2Ugc2ltcGxlIGxvZ2ljIE9SXG4gICAgICAgICAgICAvLyBtYXR0ZXIuc3RlcFJMKCk7ICAgICAvLyBVc2UgUkwgbG9naWNcbiAgICAgICAgICAgIC8vIG1hdHRlci5hZ2luZygpOyAgICAgIC8vIEFwcGx5IGFnaW5nXG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gMy4gUmVuZGVyXG4gICAgLy8gZHJhd0dyaWQoKTtcbiAgICAvLyBEcmF3IGZvb2QgZmlyc3RcbiAgICAod29ybGQubWF0dGVyW1wiRm9vZFwiXSB8fCBbXSkuZm9yRWFjaChmb29kID0+IHtcbiAgICAgICAgaWYgKGZvb2QgaW5zdGFuY2VvZiBGb29kKVxuICAgICAgICAgICAgZHJhd01hdHRlcihmb29kLCBDb2xvci5ZRUxMT1cpO1xuICAgIH0pO1xuICAgIC8vIERyYXcgY2VsbHNcbiAgICAod29ybGQubWF0dGVyW1wiQ2VsbFwiXSB8fCBbXSkuZm9yRWFjaChjZWxsID0+IHtcbiAgICAgICAgaWYgKGNlbGwgaW5zdGFuY2VvZiBDZWxsKVxuICAgICAgICAgICAgZHJhd01hdHRlcihjZWxsLCBjZWxsLmNvbG9yLCBmYWxzZSk7XG4gICAgfSk7XG4gICAgLy8gNC4gUmVxdWVzdCBuZXh0IGZyYW1lXG4gICAgYW5pbWF0aW9uRnJhbWVJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShnYW1lTG9vcCk7XG59XG4vLyAtLS0gU3RhcnQvU3RvcCBDb250cm9scyAtLS0gKENhbGxlZCBmcm9tIEhUTUwpXG5zZXR1cFZpc3VhbGl6YXRpb24oKTsgLy8gRW5zdXJlIGNhbnZhcyBpcyByZWFkeVxuZnVuY3Rpb24gc3RhcnRHYW1lKCkge1xuICAgIGlmIChydW5uaW5nKVxuICAgICAgICByZXR1cm47IC8vIFByZXZlbnQgbXVsdGlwbGUgc3RhcnRzXG4gICAgY29uc29sZS5sb2coXCJTdGFydGluZyBzaW11bGF0aW9uLi4uXCIpO1xuICAgIC8vIFVwZGF0ZSBwb3B1bGF0aW9uIHZhbHVlcyBmcm9tIHVzZXIgaW5wdXRcbiAgICB1cGRhdGVQb3B1bGF0aW9uKCk7XG4gICAgdXBkYXRlV29ybGQoKTtcbiAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICBwb3B1bGF0ZVdvcmxkKCk7IC8vIEluaXRpYWxpemUgd29ybGQgc3RhdGVcbiAgICBnYW1lTG9vcCgpOyAvLyBTdGFydCB0aGUgYW5pbWF0aW9uIGxvb3Bcbn1cbmZ1bmN0aW9uIHN0b3BHYW1lKCkge1xuICAgIGNvbnNvbGUubG9nKFwiUmVxdWVzdGluZyBzaW11bGF0aW9uIHN0b3AuLi5cIik7XG4gICAgcnVubmluZyA9IGZhbHNlOyAvLyBTaWduYWwgdGhlIGxvb3AgdG8gc3RvcFxuICAgIC8vIFRoZSBsb29wIHdpbGwgc3RvcCBpdHNlbGYgb24gdGhlIG5leHQgZnJhbWUgY2hlY2tcbn1cbndpbmRvdy5zdGFydEdhbWUgPSBzdGFydEdhbWU7XG53aW5kb3cuc3RvcEdhbWUgPSBzdG9wR2FtZTtcbi8vIE9wdGlvbmFsOiBBdXRvbWF0aWNhbGx5IHN0YXJ0IG9uIGxvYWQsIG9yIHdhaXQgZm9yIGJ1dHRvbiBjbGlja1xuLy8gd2luZG93Lm9ubG9hZCA9IHN0YXJ0R2FtZTsgLy8gRXhhbXBsZTogU3RhcnQgYXV0b21hdGljYWxseVxuY29uc29sZS5sb2coXCJtYWluLnRzIGxvYWRlZC4gQ2FsbCBzdGFydEdhbWUoKSB0byBiZWdpbi5cIik7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=