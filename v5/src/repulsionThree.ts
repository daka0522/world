import * as THREE from "three"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { log } from "three/tsl";

/* Settings */
const canvas = document.querySelector('#c') as HTMLCanvasElement
canvas.width = 700
canvas.height = 700

const renderer = new THREE.WebGLRenderer({ canvas });
const camera = new THREE.PerspectiveCamera(75, 1, 1, 500);
camera.position.set(20, 0, 20);
camera.lookAt(0, 0, 0);

const scene = new THREE.Scene();

function orbitControls() {
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, -20, 0);
    controls.minDistance = 200

    controls.update();
}

{
    /* Light settings */

    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);

    light.position.set(0, 20, 0);
    light.target.position.set(0, 0, 0);
    scene.add(light);
    scene.add(light.target);


    const ambientLight = new THREE.AmbientLight(color, 2)
    scene.add(ambientLight)
}


/* Codes */
// Set boundary box
const size = 200
const box = [size, size, size]


const G = 5
const REPULSION = 1000
const FRICTION = 0.99


// const sphereGeometry = new THREE.SphereGeometry(10, 32, 32); // Smaller spheres
const cells: Array<Cell> = []

// function createSphere(geometry, x, y, z) {
//     const randomColor = () => new THREE.Color(Math.random(), Math.random(), Math.random());
//     const material = new THREE.MeshPhongMaterial({ color: randomColor() });
//     const sphere = new THREE.Mesh(geometry, material);

//     sphere.position.set(x, y, z);
//     scene.add(sphere);

//     spheres.push(sphere)

//     return sphere;
// }

class Cell {
    position: THREE.Vector3
    velocity: THREE.Vector3
    accelation: THREE.Vector3
    radius: number
    mass: number


    constructor(position: THREE.Vector3, velocity: THREE.Vector3, radius: number, mass: number) {
        this.position = position
        this.velocity = velocity
        this.accelation = new THREE.Vector3(0, 0, 0)
        this.radius = radius
        this.mass = mass

        cells.push(this)

        console.log(this.position);
        
    }

    draw() {
        const sphereGeometry = new THREE.SphereGeometry(this.radius, 32, 32);

        const randomColor = () => new THREE.Color(Math.random(), Math.random(), Math.random());
        const material = new THREE.MeshPhongMaterial({ color: randomColor() });
        const sphere = new THREE.Mesh(sphereGeometry, material);

        sphere.position.copy(this.position)
        scene.add(sphere)
        
    }
    update() {
        console.log(this.position);
        
        // Update position based on velocity
        this.velocity = this.velocity.add(this.accelation)
        this.velocity = this.velocity.multiplyScalar(FRICTION)
        // this.position.x += this.velocity.x
        // this.position.y += this.velocity.y
        this.position.add(this.velocity)
        this.accelation.set(0, 0, 0)

        // Bounce off walls with smoother boundary checking

        if (this.position.x + this.radius > box[0] || this.position.x - this.radius < -box[0]) {
            this.velocity.x *= -1
        }
        if (this.position.y + this.radius > box[1] || this.position.y - this.radius < -box[1]) {
            this.velocity.y *= -1
        }
        if (this.position.z + this.radius > box[2] || this.position.z - this.radius < -box[2]) {
            this.velocity.z *= -1
        }
        // this.position.y = Math.max(0, Math.min(canvas.height - this.radius, this.position.y))
        // this.position.x = Math.max(0, Math.min(canvas.width - this.radius, this.position.x))
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

        if (distance < this.radius) {
            const repulsion = REPULSION * this.mass
            this.applyForce(direction.clone().multiplyScalar(-repulsion / distance ** 2))
        }
    }
}


function animate() {
    cells.forEach(  cell => {
        cell.update() 

        cells.forEach( otherCell => {
            if (cell !== otherCell) {
                cell.interactWith(otherCell)
            }
        })
    })

    renderer.render(scene, camera);
}

function main() {
    orbitControls()

    // createSphere(sphereGeometry, 0, 0, 0)

    for (let i = 0; i < 5; i++) {
        const cell = new Cell(
            new THREE.Vector3(Math.random() * box[0], Math.random() * box[1], Math.random() * box[2]),
            new THREE.Vector3(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5),
            20,
            1 + Math.random()
        )
        // console.log(cells);
        cell.draw()
        
    }

    // cells.forEach(cell => cell.update())

    // for (let i = 0; i < cells.length; i++) {
    //     for (let j = 0; j < cells.length; j++) {
    //         if (i != j) {
    //             cells[i].interactWith(cells[j])
    //         }
    //     }
    // }


    // // Draw all cells
    // cells.forEach(cell => cell.draw())

    renderer.setAnimationLoop(animate);
}

main()