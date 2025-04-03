import { Color, ColorTuple } from "./params"

export {World, Matter, Cell, Food}

type WorldObjects = Matter | Cell | Food | 0 | -1 | null
type WorldState = Cell | Food | 0 | -1
type Face = 0 | 1 | 2 | 3 | null  // Direction: 0: front, 1: right, 2: back, 3: left
type _Location = [number, number] | null // [row, col]
type CellState = 0 | 1 | 2 | 3 // 0: empty, 1: other cell, 2: Food, 3: wall
type GridType = (Matter | 0)[][]




class World {
    readonly width: number 
    readonly height: number 
    spaces: GridType
    matter: { [key: string]: (Matter | Cell | Food)[] }; // Dictionary equivalent
    matterCount: { [key: string]: number}
    
    constructor(size: number) {
        this.width = size 
        this.height = size 
        this.spaces = Array(this.height).fill(0).map(() => Array(this.width).fill(0))
        this.matter = {"Cell": [], "Food": []}
        this.matterCount = {Cell: 0, "Food": 0}
    }

    getFreeSpaces(): _Location[] {
        const freeSpaces: _Location[] = []
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                if (this.spaces[row][col] === 0) {
                    freeSpaces.push([row, col])
                }
            }
        }
        return freeSpaces
    }

    getRandomFreeSpace(): _Location | null {
        const freeSpaces = this.getFreeSpaces()
        if (freeSpaces.length === 0) {
            return null
        } else {
            const randomIndex = Math.floor(Math.random() * freeSpaces.length)
            return freeSpaces[randomIndex]
        }
    }

    // Helper to check if location is within bounds
    isWithinBounds(location: _Location): boolean {
        const isNotNull: boolean = location !== null
        const isInHeight: boolean = location[0] >= 0 && location[0] < this.height
        const isInWidth: boolean = location[1] >= 0 && location[1] < this.width
        return  isNotNull && isInHeight &&  isInWidth
    }

    // Helper to get object at location
    getObjectAt(location: _Location): WorldObjects {
        if (this.isWithinBounds(location)) {
            return this.spaces[location[0]][location[1]]
        } else {
            return null
        }
    }
}

abstract class Matter {
    world: World
    isAlive: boolean = false 
    currentLocation: _Location = null 
    color: ColorTuple = Color.BLACK
    age: number = 0
    bornTime: number = 0.0
    name: string = ''
    readonly className: string

    constructor(world: World) {
        this.world = world 
        this.className = this.constructor.name 
        
        const freeSpace = this.world.getRandomFreeSpace()
        if (freeSpace) {
            this.born(freeSpace) 
        } else {
            console.warn("No free space for new Matter")
            // Decide how to handle no space - maybe throw error or return null/undefined
        }
    }
    born(location: _Location): void {
        if (!location || this.world.spaces[location[0]][location[1]] !== 0) {
            console.error("Cannot born Matter at occupied or invalid location: ", location)
            throw Error("Cannot born Matter at occupied or invalid location")
        } else {
            this.world.spaces[location[0]][location[1]] == this 

            // Initialize matter type array if not exists
            if (!this.world.matter[this.className]) {
                this.world.matter[this.className] = []
                this.world.matterCount[this.className] = 0
            }

            this.world.matter[this.className].push(this)
            this.world.matterCount[this.className]++

            this.isAlive = true 
            this.currentLocation = location
            this.bornTime = Date.now()
            this.name = `${this.className}_${this.world.matterCount[this.className]}`;
            this.color = Color.getRandomColor(0, 255)
        }
    }

    die(): void {
        if (this.isAlive && this.currentLocation) {
            const [row, col] = this.currentLocation
            
            if (this.world.spaces[row][col] === this) {
                this.world.spaces[row][col] = 0  // set space empty back
            }
            
            if (this.world.matter[this.className]) {
                const index = this.world.matter[this.className].indexOf(this)
                if (index > -1) {
                    this.world.matter[this.className].splice(index, 1)
                }
            }

            this.isAlive = false 
            this.color = Color.BLACK
            this.currentLocation = null 
        }
    }
}

class Food extends Matter {
    energy: number = 20

    constructor(world: World) {
        super(world)
    }
}

class Cell extends Matter {
    face: Face = null 
    energy: number = 30
    readonly MAX_ENERGY: number = 100 

    // States: {0: Empty, 1: Other Cell, 2: Food, 3: Wall(out boundary)}
    readonly states: CellState[] = [0, 1, 2, 3];
    // Actions: {0: turn_face, 1: go} - map index to action name
    readonly actions: string[] = ["turn_face", "go"];

    // Memory for RL: state * action matrix
    memory: number[][]; // rows=states, cols=actions


    constructor(world: World) {
        super(world) // Calls Matter constructor, which calls born()

        // Initialize memory after maybe birth
        if (this.isAlive) {
            this.face = Math.floor(Math.random() * 4) as Face 
        }
        // Initialize memory matrix with zeros
        this.memory = Array(this.states.length).fill(0).map(() => Array(this.actions.length).fill(0))
    }

    senseFront(senseReach: number=1): _Location | null {
        if (this.currentLocation === null || this.face === null) {
            return null 
        }

        const [row, col] = this.currentLocation
        let nextR = row 
        let nextC = col 

        switch (this.face) {
            case 0: nextR -= senseReach; break // Front
            case 1: nextC += senseReach; break // RIght
            case 2: nextR += senseReach; break // Back
            case 3: nextC -= senseReach; break // Left 
            default: console.error("Invalid face:", this.face); return null;
        }
        return [nextR, nextC]
    } 


    // Simple decision logic (like ask_next_move in Python)
    simpleAction(): void {
        if (!this.isAlive) return;

        const nextLocation = this.senseFront();
        const whatsNext = this.askWhatsNext(nextLocation);

        switch(whatsNext) {
            case 0: // Empty
                this.move(nextLocation!);
                break;
            case 2: // Food
                const obj = this.world.getObjectAt(nextLocation!);
                if (obj instanceof Food) {
                   this.eat(obj);
                } else { // Should not happen if askWhatsNext is correct, but safe check
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

   checkEnergy(): void {
       if (this.energy <= 0) {
           this.die();
       }
   }


   // --- RL Functions ---

   askWhatsNext(location: _Location): CellState | null {
       if (!this.world.isWithinBounds(location)) {
            return 3; // Wall/Out of bounds
       }
       const obj = this.world.getObjectAt(location!);
       if (obj === 0) return 0; // Empty
       if (obj instanceof Cell) return 1; // Another Cell
       if (obj instanceof Food) return 2; // Food
       return null; // Should not happen
   }

   // Corresponds to RL Function 2: expect
   expectReward(state: CellState): number[] {
        if (state >= 0 && state < this.memory.length) {
           return this.memory[state]; // Returns the action rewards array for this state
        }
        console.error("Invalid state for expectation:", state)
        return Array(this.actions.length).fill(0); // Return default if state is invalid
   }

   // Corresponds to RL Function 3: best_action
   chooseAction(stateRewards: number[], epsilon: number = 0.1): number {
       // Epsilon-greedy
       if (Math.random() < epsilon || stateRewards.every(r => r === 0)) {
           // Explore: Choose random action
           return Math.floor(Math.random() * this.actions.length);
       } else {
           // Exploit: Choose action with max reward
           // Find index of max value. If ties, picks first one.
           return stateRewards.indexOf(Math.max(...stateRewards));
       }
   }

   // Corresponds to RL Function 4: do_action
   performAction(actionIndex: number, state: CellState, nextLocation: _Location): number {
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
   remember(state: CellState, actionIndex: number, reward: number): void {
       if (state >= 0 && state < this.memory.length && actionIndex >= 0 && actionIndex < this.actions.length) {
            this.memory[state][actionIndex] += reward;
       } else {
            console.error("Invalid state or action index for memory update:", state, actionIndex);
       }
   }

   // Corresponds to RL Function - private _go
   private go(state: CellState, nextLocation: _Location): number {
       let reward = 0;
       switch (state) {
           case 0: // Empty
               if (nextLocation) this.move(nextLocation);
               reward = 1; // Reward for moving to empty space
               break;
           case 2: // Food
               const obj = nextLocation ? this.world.getObjectAt(nextLocation) : null;
               if (obj instanceof Food) {
                   this.eat(obj); // eat() implicitly moves the cell to food's location
                   reward = 10; // High reward for eating
               } else {
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

   move(newLocation: _Location): void {
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

   turnFace(newFace?: Face): void {
        if (!this.isAlive) return;

       if (newFace !== undefined && newFace >= 0 && newFace <= 3) {
           this.face = newFace;
       } else {
           // Turn randomly, excluding current direction
           const possibleFaces: Face[] = [0, 1, 2, 3];
           const currentFaceIndex = possibleFaces.indexOf(this.face);
           if (currentFaceIndex > -1) {
               possibleFaces.splice(currentFaceIndex, 1); // Remove current face
           }
           this.face = possibleFaces[Math.floor(Math.random() * possibleFaces.length)];
       }
        // Note: Energy consumption handled elsewhere
   }

   eat(food: Food): void {
        if (!this.isAlive || !food.isAlive || !food.currentLocation) return;

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
    aging(): void {
        if (!this.isAlive) return;

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
   stepRL(): void {
       if (!this.isAlive) return;

       const nextLocation = this.senseFront();
       const nextState = this.askWhatsNext(nextLocation);

       if (nextState !== null) {
           const stateRewards = this.expectReward(nextState);
           const actionIndex = this.chooseAction(stateRewards); // Use epsilon-greedy
           const reward = this.performAction(actionIndex, nextState, nextLocation);
           this.remember(nextState, actionIndex, reward);

           // console.log(`Cell: ${this.name}, State: ${nextState}, Action: ${this.actions[actionIndex]}, Reward: ${reward}, Mem: ${JSON.stringify(this.memory[nextState])}`);

       } else {
            // Handle cases where next state couldn't be determined (should be rare)
            this.turnFace(); // Default action if state is uncertain
            // this.energy -=1; // Consume energy
            // this.checkEnergy();
       }
         // Call aging periodically if needed
        // this.aging();
   }
}
