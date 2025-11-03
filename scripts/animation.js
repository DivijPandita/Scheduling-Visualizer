// This file handles all drawing on the HTML5 Canvas.

// --- Canvas Setup ---
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');

// Define colors and layout
const COLORS = {
    cpu: '#68B0AB',
    ready: '#F0C674',
    blocked: '#F1825F', // New color for blocked
    terminated: '#A3A3A3',
    process: '#4A4A4A',
    text: '#FFFFFF',
    textDark: '#000000',
    idle: '#F5F5F5',
    label: '#555555'
};

const LAYOUT = {
    padding: 20,
    boxSize: 60,
    boxGap: 20,
    cpuX: 150,
    cpuY: 100,
    readyX: 300,
    readyY: 100,
    blockedX: 300, // New queue
    blockedY: 200, // New queue
    termX: 150,
    termY: 250,
    processTableY: 350
};

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
        ctx.fillStyle = COLORS.textDark;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click "Run" to start the simulation.', canvas.width / 2, 50);
        return;
    }

    // Draw all components
    drawCurrentTime(stepData.time);
    drawCpu(stepData.cpuProcess, stepData.quantumTimer);
    drawReadyQueue(stepData.readyQueue);
    drawBlockedQueue(stepData.blockedQueue); // NEW
    drawTerminated(stepData.terminated);
    drawProcessStatus(stepData.processStats);
}

// --- Drawing Helper Functions ---

function drawCurrentTime(time) {
    ctx.fillStyle = COLORS.textDark;
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Time: ${time}`, LAYOUT.padding, LAYOUT.padding + 20);
}

function drawCpu(processId, quantum) {
    ctx.fillStyle = COLORS.label;
    ctx.font = '18px Arial';
    ctx.fillText('CPU', LAYOUT.cpuX, LAYOUT.cpuY - 10);

    let color = (processId !== 'Idle') ? COLORS.cpu : COLORS.idle;
    ctx.fillStyle = color;
    ctx.fillRect(LAYOUT.cpuX, LAYOUT.cpuY, LAYOUT.boxSize, LAYOUT.boxSize);
    ctx.strokeRect(LAYOUT.cpuX, LAYOUT.cpuY, LAYOUT.boxSize, LAYOUT.boxSize);

    ctx.fillStyle = (processId === 'Idle') ? COLORS.textDark : COLORS.text;
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(processId, LAYOUT.cpuX + LAYOUT.boxSize / 2, LAYOUT.cpuY + LAYOUT.boxSize / 2 + 8);
    
    if (quantum !== undefined && quantum > 0) {
        ctx.fillStyle = COLORS.textDark;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Q: ${quantum}`, LAYOUT.cpuX + LAYOUT.boxSize / 2, LAYOUT.cpuY + LAYOUT.boxSize + 20);
    }
}

function drawReadyQueue(queue) {
    ctx.fillStyle = COLORS.label;
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Ready Queue', LAYOUT.readyX, LAYOUT.readyY - 10);

    if (queue.length === 0) {
        ctx.fillStyle = COLORS.label;
        ctx.font = '16px Arial';
        ctx.fillText('[Empty]', LAYOUT.readyX, LAYOUT.readyY + 35);
        return;
    }

    queue.forEach((pid, index) => {
        let x = LAYOUT.readyX + index * (LAYOUT.boxSize + LAYOUT.boxGap);
        let y = LAYOUT.readyY;

        ctx.fillStyle = COLORS.ready;
        ctx.fillRect(x, y, LAYOUT.boxSize, LAYOUT.boxSize);
        ctx.strokeRect(x, y, LAYOUT.boxSize, LAYOUT.boxSize);

        ctx.fillStyle = COLORS.textDark;
        ctx.font = '22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(pid, x + LAYOUT.boxSize / 2, y + LAYOUT.boxSize / 2 + 8);
    });
}

// NEW FUNCTION to draw the blocked queue
function drawBlockedQueue(queue) {
    ctx.fillStyle = COLORS.label;
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Blocked (I/O) Queue', LAYOUT.blockedX, LAYOUT.blockedY - 10);

    if (queue.length === 0) {
        ctx.fillStyle = COLORS.label;
        ctx.font = '16px Arial';
        ctx.fillText('[Empty]', LAYOUT.blockedX, LAYOUT.blockedY + 35);
        return;
    }

    queue.forEach((pidWithTimer, index) => {
        let x = LAYOUT.blockedX + index * (LAYOUT.boxSize + LAYOUT.boxGap);
        let y = LAYOUT.blockedY;

        // pidWithTimer is "P1 (3)"
        let parts = pidWithTimer.split(' ');
        let pid = parts[0];
        let timer = parts[1];

        ctx.fillStyle = COLORS.blocked;
        ctx.fillRect(x, y, LAYOUT.boxSize, LAYOUT.boxSize);
        ctx.strokeRect(x, y, LAYOUT.boxSize, LAYOUT.boxSize);

        ctx.fillStyle = COLORS.textDark;
        ctx.font = '22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(pid, x + LAYOUT.boxSize / 2, y + LAYOUT.boxSize / 2 + 8);
        
        ctx.font = '16px Arial';
        ctx.fillText(timer, x + LAYOUT.boxSize / 2, y + LAYOUT.boxSize + 20);
    });
}

function drawTerminated(terminatedList) {
    ctx.fillStyle = COLORS.label;
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Terminated Processes', LAYOUT.termX, LAYOUT.termY - 10);

    if (terminatedList.length === 0) {
        ctx.fillStyle = COLORS.label;
        ctx.font = '16px Arial';
        ctx.fillText('[Empty]', LAYOUT.termX, LAYOUT.termY + 35);
        return;
    }
    
    ctx.fillStyle = COLORS.terminated;
    ctx.font = '18px Arial';
    let y = LAYOUT.termY + 30;
    terminatedList.forEach((pid) => {
        ctx.fillText(pid, LAYOUT.termX + 10, y);
        y += 25;
    });
}

function drawProcessStatus(stats) {
    ctx.fillStyle = COLORS.label;
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('All Process Status', LAYOUT.padding, LAYOUT.processTableY - 10);

    ctx.font = '16px Arial';
    ctx.fillStyle = COLORS.textDark;
    ctx.fillText('Process', LAYOUT.padding, LAYOUT.processTableY + 20);
    ctx.fillText('State', LAYOUT.padding + 100, LAYOUT.processTableY + 20);
    ctx.fillText('Rem. Burst', LAYOUT.padding + 200, LAYOUT.processTableY + 20);

    if (!stats) return;
    stats.forEach((p, index) => {
        let y = LAYOUT.processTableY + 50 + (index * 25);
        ctx.fillText(p.id, LAYOUT.padding, y);
        ctx.fillText(p.state || '...', LAYOUT.padding + 100, y);
        ctx.fillText(p.remainingBurst, LAYOUT.padding + 200, y);
    });
}