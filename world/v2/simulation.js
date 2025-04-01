// Based on params.py, core.py, main.py
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
// --- Constants (from params.py and main.py) ---
var GRID_SIZE = 30; // World size (adjust as needed)
var CANVAS_SIZE = 600; // Display size in pixels
var TILE_SIZE = CANVAS_SIZE / GRID_SIZE;
var INITIAL_CELLS = 10; // Start with some cells
var MAX_CELLS = 50; // Limit cell population
var INITIAL_FOOD = 30; // Start with some food
var MAX_FOOD = 60; // Limit food population
var CELL_MAX_ENERGY = 100; //
var CELL_START_ENERGY = 50; //
var FOOD_ENERGY = 20; //
var MOVE_ENERGY_COST = 1; //
var CELL_MAX_AGE_STEPS = 500; // Aging based on simulation steps
var SIMULATION_SPEED_MS = 100; // Update simulation logic every X ms
var RL_EPSILON = 0.1; // Exploration factor for RL
// Colors adapted from params.py
var Colors = {
    WHITE: 'rgb(255, 255, 255)',
    YELLOW: 'rgb(255, 255, 0)',
    RED: 'rgb(255, 0, 0)',
    BLUE: 'rgb(0, 0, 255)',
    GREEN: 'rgb(0, 255, 0)',
    BLACK: 'rgb(0, 0, 0)',
    ORANGE: 'rgb(255, 128, 0)',
    PURPLE: 'rgb(128, 0, 128)',
    GRID: 'rgb(50, 50, 50)', // Color for the grid lines
    // Function to get a random color for cells (excluding black/white)
    getRandomColor: function () {
        var availableColors = [Colors.YELLOW, Colors.RED, Colors.BLUE, Colors.GREEN, Colors.ORANGE, Colors.PURPLE];
        return availableColors[Math.floor(Math.random() * availableColors.length)];
    },
    // Function to darken color for aging
    fadeColor: function (color) {
        var match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            var r = Math.max(0, Math.floor(parseInt(match[1]) * 0.975));
            var g = Math.max(0, Math.floor(parseInt(match[2]) * 0.975));
            var b = Math.max(0, Math.floor(parseInt(match[3]) * 0.975));
            return "rgb(".concat(r, ", ").concat(g, ", ").concat(b, ")");
        }
        return color; // Return original if format is unexpected
    }
};
// RL States
var STATE_EMPTY = 0;
var STATE_CELL = 1;
var STATE_FOOD = 2;
var STATE_WALL = 3;
var RL_STATES = [STATE_EMPTY, STATE_CELL, STATE_FOOD, STATE_WALL];
// RL Actions
var ACTION_TURN = 0;
var ACTION_GO = 1;
var RL_ACTIONS = [ACTION_TURN, ACTION_GO];
// --- World Class (from core.py) ---
var World = /** @class */ (function () {
    function World(size) {
        var _this = this;
        this.width = size;
        this.height = size;
        // Initialize grid with empty spaces (0)
        this.spaces = Array(this.height).fill(0).map(function () { return Array(_this.width).fill(0); });
        this.matters = { 'Cell': [], 'Food': [] };
        this.matterCount = { 'Cell': 0, 'Food': 0 };
    }
    World.prototype.getAvailableSpaces = function () {
        var available = [];
        for (var r = 0; r < this.height; r++) {
            for (var c = 0; c < this.width; c++) {
                if (this.spaces[r][c] === 0) {
                    available.push({ row: r, col: c });
                }
            }
        }
        return available;
    };
    World.prototype.getRandomAvailableSpace = function () {
        var available = this.getAvailableSpaces();
        if (available.length === 0) {
            return null;
        }
        var index = Math.floor(Math.random() * available.length);
        return available[index];
    };
    World.prototype.addMatter = function (matter) {
        var location = this.getRandomAvailableSpace();
        if (location) {
            matter.born(location); // Let matter handle its placement
            return true;
        }
        return false; // No space
    };
    World.prototype.removeMatter = function (matter) {
        var _a;
        if (matter.currentLocation) {
            var _b = matter.currentLocation, row = _b.row, col = _b.col;
            if (((_a = this.spaces[row]) === null || _a === void 0 ? void 0 : _a[col]) === matter) {
                this.spaces[row][col] = 0; // Clear space
            }
        }
        var list = this.matters[matter.className];
        var index = list.indexOf(matter); // Type assertion needed
        if (index > -1) {
            list.splice(index, 1);
        }
        // Note: matterCount is handled by Matter's born/die
    };
    World.prototype.getObjectAt = function (location) {
        if (this.isValidLocation(location)) {
            return this.spaces[location.row][location.col];
        }
        throw new Error("Accessing invalid location"); // Should be checked before calling
    };
    World.prototype.isValidLocation = function (location) {
        return location.row >= 0 && location.row < this.height &&
            location.col >= 0 && location.col < this.width;
    };
    return World;
}());
// --- Matter Base Class (from core.py) ---
var Matter = /** @class */ (function () {
    function Matter(world, className) {
        this.isAlive = false;
        this.currentLocation = null;
        this.color = Colors.BLACK;
        this.age = 0; // Steps lived
        this.bornStep = 0; // Simulation step when born
        this.name = '';
        this.world = world;
        this.className = className;
        // Attempt to be born immediately - moved to world.addMatter
    }
    Matter.prototype.born = function (location) {
        if (!this.isAlive) {
            this.world.spaces[location.row][location.col] = this;
            this.world.matters[this.className].push(this);
            this.world.matterCount[this.className]++;
            this.isAlive = true;
            this.currentLocation = location;
            this.bornStep = simulationStep; // Use global step counter
            this.name = "".concat(this.className, "_").concat(this.world.matterCount[this.className]);
            this.color = Colors.getRandomColor(); // Assign initial random color
        }
    };
    Matter.prototype.die = function () {
        var _a;
        if (this.isAlive && this.currentLocation) {
            var _b = this.currentLocation, row = _b.row, col = _b.col;
            // Check if we are still at the location before clearing
            if (((_a = this.world.spaces[row]) === null || _a === void 0 ? void 0 : _a[col]) === this) {
                this.world.spaces[row][col] = 0;
            }
            var list = this.world.matters[this.className];
            var index = list.indexOf(this);
            if (index > -1) {
                list.splice(index, 1);
            }
            // Decrementing count is tricky if names are reused, handled by removing from list
            this.isAlive = false;
            this.color = Colors.BLACK;
            this.currentLocation = null;
        }
    };
    Matter.prototype.aging = function (currentStep) {
        if (this.isAlive) {
            this.age = currentStep - this.bornStep;
            // Fade color every few steps (adjust frequency as needed)
            if (this.age % 10 === 0 && this.age > 0) {
                this.color = Colors.fadeColor(this.color);
            }
        }
    };
    return Matter;
}());
// --- Food Class (from core.py) ---
var Food = /** @class */ (function (_super) {
    __extends(Food, _super);
    function Food(world) {
        var _this = _super.call(this, world, 'Food') || this;
        _this.energy = FOOD_ENERGY;
        _this.color = Colors.YELLOW; // Food is always yellow
        return _this;
    }
    // Override born to set specific food color
    Food.prototype.born = function (location) {
        _super.prototype.born.call(this, location);
        if (this.isAlive) {
            this.color = Colors.YELLOW;
        }
    };
    // Food doesn't age in the same way, override aging to do nothing
    Food.prototype.aging = function (currentStep) { };
    return Food;
}(Matter));
// --- Cell Class (from core.py, including RL) ---
var Cell = /** @class */ (function (_super) {
    __extends(Cell, _super);
    function Cell(world) {
        var _this = _super.call(this, world, 'Cell') || this;
        _this.energy = CELL_START_ENERGY;
        _this.maxEnergy = CELL_MAX_ENERGY;
        _this.face = _this.getRandomFace();
        // Initialize RL memory
        _this.memory = Array(RL_STATES.length).fill(0).map(function () { return Array(RL_ACTIONS.length).fill(0); });
        return _this;
    }
    Cell.prototype.born = function (location) {
        _super.prototype.born.call(this, location);
        if (this.isAlive) {
            this.face = this.getRandomFace();
            this.energy = CELL_START_ENERGY;
        }
    };
    Cell.prototype.getRandomFace = function () {
        return Math.floor(Math.random() * 4);
    };
    // RL Step: Sense, Decide, Act, Learn
    Cell.prototype.stepRL = function () {
        if (!this.isAlive)
            return;
        // 1. Sense environment in front
        var sensedLocation = this.senseFront();
        var nextState = this.askWhatsNext(sensedLocation);
        // 2. Decide action based on memory (Expect & Best Action)
        var history = this.expect(nextState);
        var action = this.bestAction(history, RL_EPSILON);
        // 3. Perform action and get reward
        var reward = this.doAction(action, nextState, sensedLocation);
        // 4. Learn by updating memory
        this.remember(nextState, action, reward);
        // Basic needs
        this.energy -= MOVE_ENERGY_COST; // Cost of thinking/existing per step
        this.aging(simulationStep);
        // Check for death conditions
        if (this.energy <= 0 || this.age > CELL_MAX_AGE_STEPS) {
            this.die();
        }
    };
    // --- RL Helper Functions (translated from core.py) ---
    Cell.prototype.senseFront = function () {
        var dr = 0, dc = 0;
        switch (this.face) {
            case 0:
                dr = -1;
                break; // Up
            case 1:
                dc = 1;
                break; // Right
            case 2:
                dr = 1;
                break; // Down
            case 3:
                dc = -1;
                break; // Left
        }
        // currentLocation should always exist if alive
        return { row: this.currentLocation.row + dr, col: this.currentLocation.col + dc };
    };
    Cell.prototype.askWhatsNext = function (location) {
        if (!this.world.isValidLocation(location)) {
            return STATE_WALL;
        }
        var obj = this.world.getObjectAt(location);
        if (obj === 0)
            return STATE_EMPTY;
        if (obj instanceof Cell)
            return STATE_CELL;
        if (obj instanceof Food)
            return STATE_FOOD;
        // Should not happen with current types
        console.error("Unknown object type at", location, obj);
        return STATE_WALL; // Treat unexpected as wall
    };
    Cell.prototype.expect = function (state) {
        // Ensure state is a valid index
        var stateIndex = RL_STATES.indexOf(state);
        if (stateIndex < 0) {
            console.error("Invalid state for expect:", state);
            return Array(RL_ACTIONS.length).fill(0); // Return neutral if state is invalid
        }
        return this.memory[stateIndex];
    };
    Cell.prototype.bestAction = function (history, epsilon) {
        // Epsilon-greedy exploration
        if (Math.random() < epsilon || history.every(function (v) { return v === 0; })) {
            // Explore: Choose random action
            return RL_ACTIONS[Math.floor(Math.random() * RL_ACTIONS.length)];
        }
        else {
            // Exploit: Choose action with highest value
            var bestActionIndex = 0;
            var maxValue = history[0];
            for (var i = 1; i < history.length; i++) {
                if (history[i] > maxValue) {
                    maxValue = history[i];
                    bestActionIndex = i;
                }
            }
            return RL_ACTIONS[bestActionIndex];
        }
    };
    Cell.prototype.doAction = function (actionIndex, nextState, newLocation) {
        var reward = 0;
        if (actionIndex === ACTION_TURN) {
            this.turnFace();
            reward = 0; // Small penalty/reward for turning? Currently neutral.
        }
        else if (actionIndex === ACTION_GO) {
            reward = this._go(nextState, newLocation);
        }
        else {
            console.error("Invalid action index:", actionIndex);
        }
        return reward;
    };
    Cell.prototype.remember = function (state, action, reward) {
        var stateIndex = RL_STATES.indexOf(state);
        var actionIndex = RL_ACTIONS.indexOf(action);
        if (stateIndex >= 0 && actionIndex >= 0) {
            this.memory[stateIndex][actionIndex] += reward;
        }
        else {
            console.error("Invalid state or action for remember:", state, action);
        }
    };
    Cell.prototype._go = function (nextState, newLocation) {
        var reward = 0;
        switch (nextState) {
            case STATE_EMPTY:
                this.move(newLocation);
                reward = 1; // Reward for moving into empty space
                break;
            case STATE_FOOD:
                var food = this.world.getObjectAt(newLocation);
                if (food instanceof Food) {
                    this.eat(food);
                    this.move(newLocation); // Move to the food's location after eating
                    reward = 10; // High reward for eating
                }
                else {
                    // Food disappeared? Treat as empty
                    this.move(newLocation);
                    reward = 1;
                }
                break;
            case STATE_CELL:
            case STATE_WALL:
                this.turnFace(); // Bumped, just turn
                reward = -1; // Penalty for bumping
                break;
        }
        this.energy -= MOVE_ENERGY_COST; // Energy cost for attempting to move
        return reward;
    };
    // --- Basic Cell Actions ---
    Cell.prototype.move = function (newLocation) {
        if (!this.isAlive || !this.currentLocation)
            return;
        // Clear old location
        this.world.spaces[this.currentLocation.row][this.currentLocation.col] = 0;
        // Set new location
        this.currentLocation = newLocation;
        this.world.spaces[this.currentLocation.row][this.currentLocation.col] = this;
        // Energy cost handled in _go or stepRL
    };
    Cell.prototype.turnFace = function () {
        var currentFace = this.face;
        var newFace;
        do {
            newFace = this.getRandomFace();
        } while (newFace === currentFace); // Ensure it's a different face
        this.face = newFace;
        // Optional small energy cost for turning?
    };
    Cell.prototype.eat = function (food) {
        if (food.isAlive) {
            this.energy = Math.min(this.maxEnergy, this.energy + food.energy);
            food.die(); // Food gets removed from the world
        }
    };
    return Cell;
}(Matter));
// --- Simulation Setup and Loop ---
var canvas = document.getElementById('simulationCanvas');
var ctx = canvas.getContext('2d');
var cellCountSpan = document.getElementById('cellCount');
var foodCountSpan = document.getElementById('foodCount');
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;
var world = new World(GRID_SIZE);
var simulationStep = 0;
var simulationIntervalId = null;
// --- Rendering Functions (adapted from main.py) ---
function renderGrid() {
    ctx.strokeStyle = Colors.GRID;
    ctx.lineWidth = 0.5;
    for (var i = 0; i <= GRID_SIZE; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * TILE_SIZE, 0);
        ctx.lineTo(i * TILE_SIZE, CANVAS_SIZE);
        ctx.stroke();
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * TILE_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * TILE_SIZE);
        ctx.stroke();
    }
}
function renderMatter(matter) {
    if (!matter.isAlive || !matter.currentLocation)
        return;
    var _a = matter.currentLocation, row = _a.row, col = _a.col;
    var x = col * TILE_SIZE;
    var y = row * TILE_SIZE;
    ctx.fillStyle = matter.color;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    // Optional: Render face direction for Cells
    if (matter instanceof Cell) {
        renderCellFace(matter, x, y);
    }
}
function renderCellFace(cell, x, y) {
    ctx.fillStyle = Colors.WHITE; // Contrasting color for the indicator
    var centerX = x + TILE_SIZE / 2;
    var centerY = y + TILE_SIZE / 2;
    var indicatorSize = TILE_SIZE / 4;
    ctx.beginPath();
    switch (cell.face) {
        case 0: // Up
            ctx.moveTo(centerX, y + indicatorSize / 2);
            ctx.lineTo(centerX - indicatorSize / 2, y + indicatorSize * 1.5);
            ctx.lineTo(centerX + indicatorSize / 2, y + indicatorSize * 1.5);
            break;
        case 1: // Right
            ctx.moveTo(x + TILE_SIZE - indicatorSize / 2, centerY);
            ctx.lineTo(x + TILE_SIZE - indicatorSize * 1.5, centerY - indicatorSize / 2);
            ctx.lineTo(x + TILE_SIZE - indicatorSize * 1.5, centerY + indicatorSize / 2);
            break;
        case 2: // Down
            ctx.moveTo(centerX, y + TILE_SIZE - indicatorSize / 2);
            ctx.lineTo(centerX - indicatorSize / 2, y + TILE_SIZE - indicatorSize * 1.5);
            ctx.lineTo(centerX + indicatorSize / 2, y + TILE_SIZE - indicatorSize * 1.5);
            break;
        case 3: // Left
            ctx.moveTo(x + indicatorSize / 2, centerY);
            ctx.lineTo(x + indicatorSize * 1.5, centerY - indicatorSize / 2);
            ctx.lineTo(x + indicatorSize * 1.5, centerY + indicatorSize / 2);
            break;
    }
    ctx.closePath();
    ctx.fill();
}
function render() {
    // Clear canvas
    ctx.fillStyle = Colors.BLACK;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    // Draw grid
    renderGrid();
    // Draw all matters (cells and food)
    world.matters.Food.forEach(renderMatter);
    world.matters.Cell.forEach(renderMatter);
    // Update info display
    cellCountSpan.textContent = world.matters.Cell.length.toString();
    foodCountSpan.textContent = world.matters.Food.length.toString();
    // Request next frame
    requestAnimationFrame(render);
}
// --- Simulation Logic Update ---
function updateSimulation() {
    simulationStep++;
    // Update cells (RL step, aging, death check)
    // Iterate backwards for safe removal during iteration
    for (var i = world.matters.Cell.length - 1; i >= 0; i--) {
        world.matters.Cell[i].stepRL(); // Includes aging and death checks
    }
    // Replenish food and cells if below limits
    while (world.matters.Food.length < INITIAL_FOOD) {
        var newFood = new Food(world);
        if (!world.addMatter(newFood))
            break; // Stop if no space
    }
    // Spawn new cells more gradually than in the python main loop
    if (world.matters.Cell.length < MAX_CELLS && Math.random() < 0.1) { // Chance to spawn
        var newCell = new Cell(world);
        world.addMatter(newCell); // Ignore if no space
    }
}
// --- Start Simulation ---
function startSimulation() {
    if (simulationIntervalId === null) {
        // Initial population
        for (var i = 0; i < INITIAL_CELLS; i++) {
            var cell = new Cell(world);
            world.addMatter(cell); // Add to world, which finds space
        }
        for (var i = 0; i < INITIAL_FOOD; i++) {
            var food = new Food(world);
            world.addMatter(food);
        }
        simulationIntervalId = window.setInterval(updateSimulation, SIMULATION_SPEED_MS);
        requestAnimationFrame(render); // Start rendering loop
        console.log("Simulation started");
    }
}
// --- Initialization ---
startSimulation(); // Start automatically
