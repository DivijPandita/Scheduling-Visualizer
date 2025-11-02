// This file handles all drawing on the HTML5 Canvas.
// It should not contain any algorithm logic.

// Get the canvas element from the DOM
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');

/**
 * Clears the entire canvas
 */
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draws a single frame of the animation based on the current state.
 * @param {Object} stepData - A single step object from algorithm.js
 */
export function drawFrame(stepData) {
    clearCanvas();
    
    if (!stepData) {
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.fillText('Click "Run" to start the simulation.', 50, 50);
        return; // Don't draw if no data
    }

    // ---
    // TODO: Add all your drawing logic here.
    // This is just an example. You'll make this much better.
    // ---

    // Example: Draw the current time
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.fillText(`Time: ${stepData.time}`, 20, 40);

    // Example: Draw the CPU Box
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 100, 100, 50); // Draw CPU box
    ctx.font = '20px Arial';
    ctx.fillStyle = 'blue';
    ctx.fillText('CPU', 75, 90);
    
    // Draw process in CPU
    ctx.font = '24px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(stepData.cpuProcess || 'Idle', 65, 135);

    // Example: Draw the Ready Queue
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Ready Queue:', 200, 130);
    
    // Draw processes in ready queue
    let queueX = 330;
    stepData.readyQueue.forEach(pid => {
        ctx.strokeRect(queueX, 110, 40, 40);
        ctx.fillText(pid, queueX + 5, 135);
        queueX += 50;
    });
    if (stepData.readyQueue.length === 0) {
        ctx.font = '18px Arial';
        ctx.fillStyle = 'gray';
        ctx.fillText('[Empty]', 330, 130);
    }
}