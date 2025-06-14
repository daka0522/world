import * as THREE from "three"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { drawWorldBox } from "./drawWorldBox";

/* Settings */
const canvas = document.querySelector('#c') as HTMLCanvasElement
canvas.width = window.innerWidth
canvas.height = window.innerHeight

const renderer = new THREE.WebGLRenderer({ canvas });
const camera = new THREE.PerspectiveCamera(75, canvas.width/canvas.height, 0.1, 2000);
camera.position.set(350, 250, 350);
camera.lookAt(0, 0, 0);

const scene = new THREE.Scene();

function orbitControls() {
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, -50, 0);
    controls.minDistance = 200

    controls.update();
}

{
    /* Light settings */

    const color = 0xFFFFFF;
    const intensity = 5;
    const light = new THREE.DirectionalLight(color, intensity);

    light.position.set(50, 50, 0);
    light.target.position.set(0, 0, 0);
    scene.add(light);
    scene.add(light.target);


    const ambientLight = new THREE.AmbientLight(color, 0.1)
    scene.add(ambientLight)
}

/* Info board */

function createInfos(): HTMLElement {
    const infoElem = document.querySelector("#info") as HTMLElement
    const info = document.createElement("p")
    // info.innerText = text 
    infoElem.appendChild(info)
    return info
}

/* Codes */
// Set boundary box
const size = 200
const box = [size, size, size]


const G = 1
const REPULSION = 500
const FRICTION = 0.999


const cells: Array<Cell> = []

class Cell {
    position: THREE.Vector3
    velocity: THREE.Vector3
    accelation: THREE.Vector3
    radius: number
    mass: number
    mesh!: THREE.Mesh

    constructor(position: THREE.Vector3, velocity: THREE.Vector3, radius: number, mass: number) {
        this.position = position
        this.velocity = velocity
        this.accelation = new THREE.Vector3(0, 0, 0)
        this.radius = radius
        this.mass = radius

        this.createSphere()
    }

    private createSphere() {
        const sphereGeometry = new THREE.SphereGeometry(this.radius, 32, 32);
        const randomColor = () => new THREE.Color(Math.random(), Math.random(), Math.random());
        const material = new THREE.MeshPhongMaterial({ color: randomColor() });
        this.mesh = new THREE.Mesh(sphereGeometry, material);

        this.mesh.position.copy(this.position)
        scene.add(this.mesh)
        cells.push(this)
    }

    update() {
        // Update position based on velocity
        this.velocity = this.velocity.add(this.accelation).multiplyScalar(FRICTION)
        this.position = this.position.add(this.velocity)
        this.accelation.set(0, 0, 0)

        const collisionFactor = -1
        // Ensure the cell stays within the box
        if (this.position.x + this.radius > box[0]) {
            this.position.x = box[0] - this.radius; // Correct position
            this.velocity.x *= collisionFactor // Reverse and reduce velocity
        }
        if (this.position.x - this.radius < -box[0]) {
            this.position.x = -box[0] + this.radius;
            this.velocity.x *= collisionFactor
        }
        if (this.position.y + this.radius > box[1]) {
            this.position.y = box[1] - this.radius;
            this.velocity.y *= collisionFactor
        }
        if (this.position.y - this.radius < -box[1]) {
            this.position.y = -box[1] + this.radius;
            this.velocity.y *= collisionFactor
        }
        if (this.position.z + this.radius > box[2]) {
            this.position.z = box[2] - this.radius;
            this.velocity.z *= collisionFactor
        }
        if (this.position.z - this.radius < -box[2]) {
            this.position.z = -box[2] + this.radius;
            this.velocity.z *= collisionFactor
        }

        // Update the mesh position
        this.mesh.position.copy(this.position)
    }

    private applyForce(force: THREE.Vector3) {
        this.accelation = this.accelation.add(force.divideScalar(this.mass))
    }

    interactWith(other: Cell) {
        /*       
          these three lines of code which appear to be calculating distances and directions between two objects in a 2D space:
      
          1. delta = other.position - self.position This line calculates the vector difference between two positions. 
                      If you imagine two points in 2D space, delta represents the vector that points from self.position to other.position. 
                      The result is a Vector2 object containing both x and y components of this difference.
      
          2. dist = max(delta.magnitude(), 1) This calculates the actual distance between the two positions, but with a lower bound of 1. 
                  Here's what's happening:
                      -   delta.magnitude() calculates the length of the delta vector using the hypot function (the hypotenuse, or straight-line distance)
                      -   max(delta.magnitude(), 1) ensures the distance is never less than 1, which is likely used to prevent division by zero in force calculations
          3. direction = delta.normalized() This creates a unit vector (vector with length 1) pointing in the same direction as delta. 
                  The normalized() method divides the vector by its magnitude to create this unit vector. 
                  If the magnitude is zero, it returns a zero vector (0,0) to prevent division by zero errors.
      
          This code pattern is commonly used in physics simulations, particularly for calculating forces between objects 
          (like gravity or electrical forces) where both distance and direction are important. 
        */
        const delta = other.position.clone().sub(this.position)
        const distance = Math.max(delta.length(), 1)
        const direction = delta.normalize()

        //  1. Gravity
        const gravity = direction.clone().multiplyScalar(G * this.mass * other.mass / distance ** 2)
        this.applyForce(gravity)

        if (distance < this.radius * 2) {
            const repulsion = REPULSION * this.mass
            this.applyForce(direction.clone().multiplyScalar(-repulsion / distance ** 2))
        }
    }
}


const c1info1 = createInfos()
const c1info2 = createInfos()

function animate() {
    cells.forEach(cell => {
        cell.update()

        cells.forEach(otherCell => {
            if (cell !== otherCell) {
                cell.interactWith(otherCell)
            }
        })

        // c1info1.innerText = "position: " + cell.position.toArray().map(v => v.toFixed(4)).join(", ")
        // c1info2.innerText = "velocity: " + cell.velocity.toArray().map(v => v.toFixed(4)).join(", ")

    })

    renderer.render(scene, camera);
}

function main() {
    orbitControls()

    drawWorldBox(scene, size, "rgb(255, 255, 255)")

    const velMax = 5 // it is 10 by mutiply with Math.random()
    const velMin = -5

    const numberOfCells = 50
    for (let i = 0; i < numberOfCells; i++) {
        const radius = Math.random() * 30 - 10
        new Cell(
            new THREE.Vector3(Math.random() * box[0], Math.random() * box[1], Math.random() * box[2]),
            new THREE.Vector3(Math.random() * velMax - velMin, Math.random() * velMax - velMin, Math.random() * velMax - velMin),
            radius,
            radius
        )
    }




    renderer.setAnimationLoop(animate);
}

main()