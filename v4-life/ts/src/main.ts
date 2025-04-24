const canvas = document.getElementById("canvas") as HTMLCanvasElement
const ctx = canvas.getContext("2d")

canvas.width = 500
canvas.height = 500

function born() {
    ctx.fillStyle = "green"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

}

function die() {
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

}



function main(){
    born()

    setTimeout(() => {
        die()
    }, 1000)
    
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

// Animation loop function
function animate(currentTime: number) {
    if (startTime === null) {
        startTime = currentTime;
    }
    
    
    const elapsedTime = currentTime - startTime;
    const progress = (elapsedTime % duration) / duration; // Progress through one full cycle (0 to 1)
    console.log(progress);
     

    let currentColor: string;

    // Determine the color based on the progress
    if (progress < 0.5) {
        // Transition from white (255, 255, 255) to green (0, 255, 0)
        const factor = progress * 2; // Scale progress from 0-0.5 to 0-1
        currentColor = interpolateColor([255, 255, 255], [0, 255, 0], factor);
    } else {
        // Transition from green (0, 255, 0) back to white (255, 255, 255)
        const factor = (progress - 0.5) * 2; // Scale progress from 0.5-1 to 0-1
        currentColor = interpolateColor([0, 255, 0], [255, 255, 255], factor);
    }

    // Set the canvas background color
    canvas.style.backgroundColor = currentColor;

    // Request the next frame
    requestAnimationFrame(animate);
}

// Start the animation loop
requestAnimationFrame(animate);
