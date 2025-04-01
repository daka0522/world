// Based on params.py, core.py, main.py

// --- Constants (from params.py and main.py) ---
const GRID_SIZE = 30; // World size (adjust as needed)
const CANVAS_SIZE = 600; // Display size in pixels
const TILE_SIZE = CANVAS_SIZE / GRID_SIZE;

const INITIAL_CELLS = 10; // Start with some cells
const MAX_CELLS = 50;     // Limit cell population
const INITIAL_FOOD = 30; // Start with some food
const MAX_FOOD = 60;      // Limit food population

const CELL_MAX_ENERGY = 100; //
const CELL_START_ENERGY = 50; //
const FOOD_ENERGY = 20;      //
const MOVE_ENERGY_COST = 1;  //
const CELL_MAX_AGE_STEPS = 500; // Aging based on simulation steps

const SIMULATION_SPEED_MS = 100; // Update simulation logic every X ms
const RL_EPSILON = 0.1; // Exploration factor for RL

// Colors adapted from params.py
const Colors = {
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
    getRandomColor: (): string => {
        const availableColors = [Colors.YELLOW, Colors.RED, Colors.BLUE, Colors.GREEN, Colors.ORANGE, Colors.PURPLE];
        return availableColors[Math.floor(Math.random() * availableColors.length)];
    },
    // Function to darken color for aging
    fadeColor: (color: string): string => {
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            const r = Math.max(0, Math.floor(parseInt(match[1]) * 0.975));
            const g = Math.max(0, Math.floor(parseInt(match[2]) * 0.975));
            const b = Math.max(0, Math.floor(parseInt(match[3]) * 0.975));
            return `rgb(${r}, ${g}, ${b})`;
        }
        return color; // Return original if format is unexpected
    }
};

// --- Interfaces and Types ---
interface GridLocation {
    row: number;
    col: number;
}

type GridObject = Cell | Food | 0; // 0 represents empty space
type Face = 0 | 1 | 2 | 3; // 0: Up, 1: Right, 2: Down, 3: Left

// RL States
const STATE_EMPTY = 0;
const STATE_CELL = 1;
const STATE_FOOD = 2;
const STATE_WALL = 3;
type RLState = typeof STATE_EMPTY | typeof STATE_CELL | typeof STATE_FOOD | typeof STATE_WALL;
const RL_STATES = [STATE_EMPTY, STATE_CELL, STATE_FOOD, STATE_WALL];

// RL Actions
const ACTION_TURN = 0;
const ACTION_GO = 1;
type RLAction = typeof ACTION_TURN | typeof ACTION_GO;
const RL_ACTIONS = [ACTION_TURN, ACTION_GO];

// --- World Class (from core.py) ---
class World {
    readonly width: number;
    readonly height: number;
    spaces: GridObject[][];
    matters: { 'Cell': Cell[], 'Food': Food[] };
    matterCount: { 'Cell': number, 'Food': number };

    constructor(size: number) {
        this.width = size;
        this.height = size;
        // Initialize grid with empty spaces (0)
        this.spaces = Array(this.height).fill(0).map(() => Array(this.width).fill(0));
        this.matters = { 'Cell': [], 'Food': [] };
        this.matterCount = { 'Cell': 0, 'Food': 0 };
    }

    getAvailableSpaces(): GridLocation[] {
        const available: GridLocation[] = [];
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                if (this.spaces[r][c] === 0) {
                    available.push({ row: r, col: c });
                }
            }
        }
        return available;
    }

    getRandomAvailableSpace(): GridLocation | null {
        const available = this.getAvailableSpaces();
        if (available.length === 0) {
            return null;
        }
        const index = Math.floor(Math.random() * available.length);
        return available[index];
    }

    addMatter(matter: Cell | Food): boolean {
            const location: GridLocation | null = this.getRandomAvailableSpace();
        if (location) {
            matter.born(location); // Let matter handle its placement
            return true;
        }
        return false; // No space
    }

    removeMatter(matter: Cell | Food) {
        if (matter.currentLocation) {
            const { row, col } = matter.currentLocation;
            if (this.spaces[row]?.[col] === matter) {
                this.spaces[row][col] = 0; // Clear space
            }
        }
        const list = this.matters[matter.className];
        const index = list.indexOf(matter as any); // Type assertion needed
        if (index > -1) {
            list.splice(index, 1);
        }
        // Note: matterCount is handled by Matter's born/die
    }

    getObjectAt(location: GridLocation): GridObject {
        if (this.isValidLocation(location)) {
            return this.spaces[location.row][location.col];
        }
        throw new Error("Accessing invalid location"); // Should be checked before calling
    }

    isValidLocation(location: GridLocation): boolean {
        return location.row >= 0 && location.row < this.height &&
               location.col >= 0 && location.col < this.width;
    }
}

// --- Matter Base Class (from core.py) ---
abstract class Matter {
    world: World;
    isAlive: boolean = false;
    currentLocation: GridLocation | null = null;
    color: string = Colors.BLACK;
    age: number = 0; // Steps lived
    bornStep: number = 0; // Simulation step when born
    name: string = '';
    readonly className: 'Cell' | 'Food'; // Required for subclasses

    constructor(world: World, className: 'Cell' | 'Food') {
        this.world = world;
        this.className = className;
        // Attempt to be born immediately - moved to world.addMatter
    }

    born(location: Location): void {
        if (!this.isAlive) {
            this.world.spaces[location.row][location.col] = this;
            this.world.matters[this.className].push(this as any);
            this.world.matterCount[this.className]++;

            this.isAlive = true;
            this.currentLocation = location;
            this.bornStep = simulationStep; // Use global step counter
            this.name = `${this.className}_${this.world.matterCount[this.className]}`;
            this.color = Colors.getRandomColor(); // Assign initial random color
        }
    }

    die(): void {
        if (this.isAlive && this.currentLocation) {
            const { row, col } = this.currentLocation;
            // Check if we are still at the location before clearing
            if (this.world.spaces[row]?.[col] === this) {
                this.world.spaces[row][col] = 0;
            }
            const list = this.world.matters[this.className];
            const index = list.indexOf(this as any);
            if (index > -1) {
                list.splice(index, 1);
            }
            // Decrementing count is tricky if names are reused, handled by removing from list
            this.isAlive = false;
            this.color = Colors.BLACK;
            this.currentLocation = null;
        }
    }

    aging(currentStep: number): void {
        if (this.isAlive) {
            this.age = currentStep - this.bornStep;
             // Fade color every few steps (adjust frequency as needed)
            if (this.age % 10 === 0 && this.age > 0) {
                 this.color = Colors.fadeColor(this.color);
            }
        }
    }
}

// --- Food Class (from core.py) ---
class Food extends Matter {
    readonly energy: number = FOOD_ENERGY;

    constructor(world: World) {
        super(world, 'Food');
        this.color = Colors.YELLOW; // Food is always yellow
    }

    // Override born to set specific food color
    born(location: Location): void {
        super.born(location);
        if (this.isAlive) {
             this.color = Colors.YELLOW;
        }
    }

    // Food doesn't age in the same way, override aging to do nothing
    aging(currentStep: number): void { }
}

// --- Cell Class (from core.py, including RL) ---
class Cell extends Matter {
    face: Face;
    energy: number = CELL_START_ENERGY;
    readonly maxEnergy: number = CELL_MAX_ENERGY;

    // RL Memory: state -> action -> value
    memory: number[][];

    constructor(world: World) {
        super(world, 'Cell');
        this.face = this.getRandomFace();

        // Initialize RL memory
        this.memory = Array(RL_STATES.length).fill(0).map(() => Array(RL_ACTIONS.length).fill(0));
    }

    born(location: Location): void {
        super.born(location);
        if (this.isAlive) {
            this.face = this.getRandomFace();
            this.energy = CELL_START_ENERGY;
        }
    }

    getRandomFace(): Face {
        return Math.floor(Math.random() * 4) as Face;
    }

    // RL Step: Sense, Decide, Act, Learn
    stepRL(): void {
        if (!this.isAlive) return;

        // 1. Sense environment in front
        const sensedLocation = this.senseFront();
        const nextState = this.askWhatsNext(sensedLocation);

        // 2. Decide action based on memory (Expect & Best Action)
        const history = this.expect(nextState);
        const action = this.bestAction(history, RL_EPSILON);

        // 3. Perform action and get reward
        const reward = this.doAction(action, nextState, sensedLocation);

        // 4. Learn by updating memory
        this.remember(nextState, action, reward);

        // Basic needs
        this.energy -= MOVE_ENERGY_COST; // Cost of thinking/existing per step
        this.aging(simulationStep);

        // Check for death conditions
        if (this.energy <= 0 || this.age > CELL_MAX_AGE_STEPS) {
            this.die();
        }
    }

    // --- RL Helper Functions (translated from core.py) ---

    senseFront(): Location { //
        let dr = 0, dc = 0;
        switch (this.face) {
            case 0: dr = -1; break; // Up
            case 1: dc = 1; break;  // Right
            case 2: dr = 1; break;  // Down
            case 3: dc = -1; break; // Left
        }
        // currentLocation should always exist if alive
        return { row: this.currentLocation!.row + dr, col: this.currentLocation!.col + dc };
    }

    askWhatsNext(location: Location): RLState { //
        if (!this.world.isValidLocation(location)) {
            return STATE_WALL;
        }
        const obj = this.world.getObjectAt(location);
        if (obj === 0) return STATE_EMPTY;
        if (obj instanceof Cell) return STATE_CELL;
        if (obj instanceof Food) return STATE_FOOD;
        // Should not happen with current types
        console.error("Unknown object type at", location, obj);
        return STATE_WALL; // Treat unexpected as wall
    }

    expect(state: RLState): number[] { //
        // Ensure state is a valid index
        const stateIndex = RL_STATES.indexOf(state);
         if (stateIndex < 0) {
            console.error("Invalid state for expect:", state);
            return Array(RL_ACTIONS.length).fill(0); // Return neutral if state is invalid
        }
        return this.memory[stateIndex];
    }

    bestAction(history: number[], epsilon: number): RLAction { //
         // Epsilon-greedy exploration
        if (Math.random() < epsilon || history.every(v => v === 0)) {
            // Explore: Choose random action
             return RL_ACTIONS[Math.floor(Math.random() * RL_ACTIONS.length)];
        } else {
            // Exploit: Choose action with highest value
             let bestActionIndex = 0;
             let maxValue = history[0];
             for(let i = 1; i < history.length; i++) {
                 if (history[i] > maxValue) {
                     maxValue = history[i];
                     bestActionIndex = i;
                 }
             }
            return RL_ACTIONS[bestActionIndex];
        }
    }

    doAction(actionIndex: RLAction, nextState: RLState, newLocation: Location): number { //
        let reward = 0;
        if (actionIndex === ACTION_TURN) {
            this.turnFace();
            reward = 0; // Small penalty/reward for turning? Currently neutral.
        } else if (actionIndex === ACTION_GO) {
            reward = this._go(nextState, newLocation);
        } else {
            console.error("Invalid action index:", actionIndex);
        }
        return reward;
    }

     remember(state: RLState, action: RLAction, reward: number): void { //
        const stateIndex = RL_STATES.indexOf(state);
         const actionIndex = RL_ACTIONS.indexOf(action);
         if (stateIndex >= 0 && actionIndex >= 0) {
             this.memory[stateIndex][actionIndex] += reward;
         } else {
              console.error("Invalid state or action for remember:", state, action);
         }
    }


    _go(nextState: RLState, newLocation: Location): number { //
        let reward = 0;
        switch (nextState) {
            case STATE_EMPTY:
                this.move(newLocation);
                reward = 1; // Reward for moving into empty space
                break;
            case STATE_FOOD:
                const food = this.world.getObjectAt(newLocation);
                if (food instanceof Food) {
                    this.eat(food);
                    this.move(newLocation); // Move to the food's location after eating
                    reward = 10; // High reward for eating
                } else {
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
    }


    // --- Basic Cell Actions ---

    move(newLocation: Location): void { //
        if (!this.isAlive || !this.currentLocation) return;

        // Clear old location
        this.world.spaces[this.currentLocation.row][this.currentLocation.col] = 0;

        // Set new location
        this.currentLocation = newLocation;
        this.world.spaces[this.currentLocation.row][this.currentLocation.col] = this;

        // Energy cost handled in _go or stepRL
    }

    turnFace(): void { //
        const currentFace = this.face;
        let newFace: Face;
        do {
            newFace = this.getRandomFace();
        } while (newFace === currentFace); // Ensure it's a different face
        this.face = newFace;
        // Optional small energy cost for turning?
    }

    eat(food: Food): void { //
        if (food.isAlive) {
            this.energy = Math.min(this.maxEnergy, this.energy + food.energy);
            food.die(); // Food gets removed from the world
        }
    }
}


// --- Simulation Setup and Loop ---
const canvas = document.getElementById('simulationCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const cellCountSpan = document.getElementById('cellCount')!;
const foodCountSpan = document.getElementById('foodCount')!;

canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

const world = new World(GRID_SIZE);
let simulationStep = 0;
let simulationIntervalId: number | null = null;


// --- Rendering Functions (adapted from main.py) ---
function renderGrid() {
    ctx.strokeStyle = Colors.GRID;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
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

function renderMatter(matter: Matter) {
    if (!matter.isAlive || !matter.currentLocation) return;

    const { row, col } = matter.currentLocation;
    const x = col * TILE_SIZE;
    const y = row * TILE_SIZE;

    ctx.fillStyle = matter.color;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Optional: Render face direction for Cells
    if (matter instanceof Cell) {
         renderCellFace(matter, x, y);
    }
}

function renderCellFace(cell: Cell, x: number, y: number) {
    ctx.fillStyle = Colors.WHITE; // Contrasting color for the indicator
    const centerX = x + TILE_SIZE / 2;
    const centerY = y + TILE_SIZE / 2;
    const indicatorSize = TILE_SIZE / 4;

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
    for (let i = world.matters.Cell.length - 1; i >= 0; i--) {
        world.matters.Cell[i].stepRL(); // Includes aging and death checks
    }

     // Replenish food and cells if below limits
    while (world.matters.Food.length < INITIAL_FOOD) {
         const newFood = new Food(world);
         if (!world.addMatter(newFood)) break; // Stop if no space
    }

    // Spawn new cells more gradually than in the python main loop
     if (world.matters.Cell.length < MAX_CELLS && Math.random() < 0.1) { // Chance to spawn
          const newCell = new Cell(world);
          world.addMatter(newCell); // Ignore if no space
     }

}


// --- Start Simulation ---
function startSimulation() {
    if (simulationIntervalId === null) {
        // Initial population
        for (let i = 0; i < INITIAL_CELLS; i++) {
            const cell = new Cell(world);
            world.addMatter(cell); // Add to world, which finds space
        }
        for (let i = 0; i < INITIAL_FOOD; i++) {
            const food = new Food(world);
             world.addMatter(food);
        }

        simulationIntervalId = window.setInterval(updateSimulation, SIMULATION_SPEED_MS);
        requestAnimationFrame(render); // Start rendering loop
        console.log("Simulation started");
    }
}

// --- Initialization ---
startSimulation(); // Start automatically