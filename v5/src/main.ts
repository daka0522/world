import './style.css'
import { Color } from './params';
import type { ColorTuple } from './params';

const canvasElement = document.querySelector("#c")
if (!canvasElement) {
  throw new Error("Canvas element not found")
}
const canvas = canvasElement as HTMLCanvasElement
canvas.width = 700
canvas.height = 700
canvas.style = "border: 1px solid"

const ctxTry = canvas.getContext("2d")
if (!ctxTry) {
  throw new Error("CTX is not set.")
}
const ctx = ctxTry


const G = 5
const REPULSION = 1000
const FRICTION = 0.99

const tileWidth = canvas.width / 10
const tileHeight = canvas.height / 10

const cellSize = tileWidth


function drawGrid() {
  ctx.strokeStyle = `rgb(${Color.BLACK.join(',')})`;
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

class Vector2 {
  x: number
  y: number

  constructor(
    x: number,
    y: number
  ) {
    this.x = x
    this.y = y
  }

  add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  subtract(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  multiply(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }
  divide(scalar: number): Vector2 {
    return new Vector2(this.x / scalar, this.y / scalar);
  }
  magnitude(): number {
    /** 
     * Pythagorean theorem
     * a^2 + b^2 = c^2
     * a = side of right triangle
     * b = side of right triangle
     * c = hypotenuse 
     */
    return Math.hypot(this.x, this.y);
  }

  normalized(): Vector2 {
    /**
     * 정규화(normalization)는 벡터의 방향은 유지하면서 크기를 1로 만드는 과정입니다.
     * 
     * 벡터를 그 벡터의 크기(magnitude)로 나누어 계산합니다
     * 결과 벡터는 원래 벡터와 같은 방향을 가지지만 크기는 1이 됩니다
     * 0 벡터의 경우 방향이 정의되지 않으므로 0 벡터를 반환합니다
     * 
     * 사용 예:
     * const v = new Vector2(3, 4);  // 크기가 5인 벡터
     * const n = v.normalized();      // 크기가 1이고 같은 방향을 가진 벡터
     * n은 대략 Vector2(0.6, 0.8)가 됨
     */
    const magnitude = this.magnitude();
    if (magnitude !== 0) {
      return this.divide(magnitude);
    }
    return new Vector2(0, 0);
  }
}

class World {
  cells: Array<Cell>

  constructor() {
    this.cells = []
  }
}

class Cell {
  color: ColorTuple
  size: number
  mass: number
  position: Vector2
  velocity: Vector2
  accelation: Vector2
  world: World 


  constructor(x: number, y: number, vx: number = 1, vy: number = 1, mass: number = 1, color: ColorTuple, world: World) {
    this.position = new Vector2(x, y)
    this.velocity = new Vector2(vx, vy)
    this.accelation = new Vector2(0, 0)
    this.color = color
    this.size = cellSize
    this.mass = mass
    this.world = world 
    this.world.cells.push(this)
  }

  draw() {
    ctx.fillStyle = `rgb(${this.color.join(",")})`

    // Rect
    // ctx.fillRect(this.position.x, this.position.y, tileWidth, tileHeight)

    // Circle
    const circle = new Path2D();
    circle.arc(this.position.x, this.position.y, this.size / 2, 0, 2 * Math.PI);
    ctx.fill(circle);
  }

  update() {
    // Update position based on velocity
    this.velocity = this.velocity.add(this.accelation)
    this.velocity = this.velocity.multiply(FRICTION)
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
    this.accelation = new Vector2(0, 0)

    // Bounce off walls with smoother boundary checking
    if (this.position.y + this.size > canvas.height || this.position.y < 0) {
      this.velocity.y *= -1
    }
    
    if (this.position.x + this.size > canvas.width || this.position.x < 0) {
      this.velocity.x *= -1
    }
    this.position.y = Math.max(0, Math.min(canvas.height - this.size, this.position.y))
    this.position.x = Math.max(0, Math.min(canvas.width - this.size, this.position.x))
  }

  private applyForce(force: Vector2) {
    this.accelation = this.accelation.add(force.divide(this.mass))
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
    const delta = other.position.subtract(this.position)
    const distance = Math.max(delta.magnitude(), 1)
    const direction = delta.normalized()

    //  1. Gravity
    const gravity = direction.multiply(G * this.mass * other.mass / distance ** 2)
    this.applyForce(gravity)

    if (distance < this.size) {
      const repulsion = REPULSION * this.mass
      this.applyForce(direction.multiply(-repulsion / distance ** 2))
    }
  }
}

const world = new World()
// const c1 = new Cell(0, 0, 2, 2, 1, Color.GREEN, world)
// const c2 = new Cell(c1.size, c1.size, 3, 5, 1, Color.YELLOW, world)

for (let i = 0; i < 25; i++) {
  new Cell(
    Math.random() * canvas.width,  // random x position
    Math.random() * canvas.height, // random y position
    Math.random() * 10 - 5,        // random x velocity
    Math.random() * 10 - 5,        // random y velocity
    1 + Math.random(),                            // mass
    Color.getRandomColor(0, 255),                  // color
    world                         // world reference
  )
}
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGrid()

  world.cells.forEach(cell => cell.update())

  for (let i=0; i<world.cells.length; i++) {
    for (let j=0; j<world.cells.length; j++) {
      if (i != j) {
        world.cells[i].interactWith(world.cells[j])
      }
    }
  }


  // Draw all cells
  world.cells.forEach(cell => cell.draw())

  requestAnimationFrame(draw)
}

function main() {

  requestAnimationFrame(draw)
}

main()