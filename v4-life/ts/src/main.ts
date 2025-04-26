// import * as tf from '@tensorflow/tfjs';

const canvas = document.getElementById("canvas") as HTMLCanvasElement
const ctx = canvas.getContext("2d")

canvas.width = 500
canvas.height = 500

const tile = 10
let tileWidth = canvas.width / tile
let tileHeight = canvas.height / tile

type COLOR  = [number, number, number]

class Color {
    static WHITE: COLOR = [255, 255, 255]
    static BLACK: COLOR = [0, 0, 0]
    static GREEN: COLOR = [0, 255, 0]
}

function drawGrid(color: number[]): void {
    if (!ctx) return

    ctx.strokeStyle = `rgb(${color.join(',')})`; // White lines
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
// Animation parameters
const duration = 10000; // Duration of one full cycle (white -> green -> white) in milliseconds
let startTime: number | null = null;

// Function to interpolate color between two RGB values
function interpolateColor(color1: [number, number, number], color2: [number, number, number], factor: number): string {
    const result = color1.slice();
    for (let i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - result[i]));
    }
    return `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
}



function linspace(start: number, stop: number, num: number): number[] {
    const step = (stop - start) / (num - 1);
    return Array.from({ length: num }, (_, i) => start + step * i);
}


function generateColorTransition(color1: COLOR, color2: COLOR, steps: number): COLOR[] {
    const rValues = linspace(color1[0], color2[0], steps);
    const gValues = linspace(color1[1], color2[1], steps);
    const bValues = linspace(color1[2], color2[2], steps);

    return rValues.map((r, i) => [
        Math.round(r),
        Math.round(gValues[i]),
        Math.round(bValues[i]),
    ] as COLOR); 
}

const steps = 500
const transitionToGreen = generateColorTransition(Color.WHITE, Color.GREEN, steps)
const green2black = generateColorTransition(Color.GREEN, Color.BLACK, steps)
const transitionToWhite = generateColorTransition(Color.BLACK, Color.WHITE, steps);
const fullTransition = [...transitionToGreen, ...green2black, ...transitionToWhite];



interface Circle {
    x: number
    y: number
    radius: number
    color: COLOR
    transition?: COLOR[]
}

function drawCircle(circle: Circle) {
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${circle.color.join(',')})`;
    ctx.fill();
}

// Draw the circle
let c1: Circle = {
    x: 100,
    y: 100,
    radius: 100,
    color: Color.BLACK
}

let c2: Circle = {
    x: 300, 
    y: 300,
    radius: 100,
    color: Color.BLACK
}


let mainCircle: Circle = {
    x: canvas.width/2,
    y: canvas.height/2,
    radius: canvas.width/2,
    color: Color.BLACK,
    
}


function fillMainCircleWithSmallCircles(mainCircle: Circle, smallCircleRadius: number) {
    const circles: Circle[] = [];
    const step = smallCircleRadius * 2; // Distance between circle centers

    for (let x = mainCircle.x - mainCircle.radius; x <= mainCircle.x + mainCircle.radius; x += step) {
        for (let y = mainCircle.y - mainCircle.radius; y <= mainCircle.y + mainCircle.radius; y += step) {
            const distance = Math.sqrt((x - mainCircle.x) ** 2 + (y - mainCircle.y) ** 2);

            // Check if the circle's center is within the main circle
            if (distance + smallCircleRadius <= mainCircle.radius) {
                const color = Color.BLACK
                let randomColor1 = [Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255)] as COLOR
                let randomColor2 = [Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255)] as COLOR
                
                let steps = 500

                // console.log(randomColor1, randomColor2);
                
                let colorTransition1 = generateColorTransition(randomColor1, randomColor2, steps)
                let colorTransition2 = generateColorTransition(randomColor2, randomColor1, steps)
                let fullColorTransition = [...colorTransition1, ...colorTransition2]

                circles.push({ x, y, radius: smallCircleRadius, color, transition: fullColorTransition });
            }
        }
    }

    return circles
}

const smallCircleRadius = 10;
const circles = fillMainCircleWithSmallCircles(mainCircle, smallCircleRadius);

// Animation loop
let frame = 1000;

function animate2() {
    if (!ctx) return;

    // Draw circle
    {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // drawCircle(mainCircle)

        c1.color = fullTransition[frame];
        // drawCircle(c1)

        c2.color = fullTransition[frame]
        // drawCircle(c2)

        // Draw smaller circles inside the main circle
        // const numCircles = 10;
        // const smallCircleRadius = 30;
        // drawCirclesInMainCircle(mainCircle, numCircles, smallCircleRadius, fullTransition);

        // Fill the main circle with smaller circles
        circles.forEach( (circle) => {
            // console.log(circle.transition[frame]);
            console.log(circle)
            
            let color = circle.transition[frame]

            if (!color) {
                circle.color = Color.BLACK
            } else {
                circle.color = color
            }

            
            
            drawCircle(circle)
            frame = (frame + 1) % circle.transition.length;
        })

    }

    // Increment the frame, looping back to the start if necessary

    // Request the next frame
    requestAnimationFrame(animate2);
}


function main() {
    // drawGrid(Color.BLACK)

    // Start the animation
    animate2();
}

// main()