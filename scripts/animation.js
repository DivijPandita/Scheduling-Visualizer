// This file handles all drawing on the HTML5 Canvas.

// --- Canvas Setup ---
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');

// --- Module-Level State for Gantt Chart ---
// This array will store the history of CPU usage.
let ganttHistory = [];

// Define colors and layout
const COLORS = {
    cpu: '#68B0AB',         // Teal
    ready: '#F0C674',       // Yellow
    blocked: '#F1825F',     // Orange
    terminated: '#A3A3AB',  // Gray
    text: '#FFFFFF',         // White
    textDark: '#000000',     // Black
    idle: '#F5F5F5',         // Light Gray
    label: '#555555',        // Dark Gray
    ganttBar: '#EBF5FB',     // Light Blue BG
    ganttIdle: '#FDFEFE',    // White
    ganttP1: '#D7BDE2',      // Purple
    ganttP2: '#A9DFBF',      // Green
    ganttP3: '#FAD7A0',      // Orange
    ganttP4: '#AED6F1',      // Blue
    ganttP5: '#F1948A',      // Red
};

// --- NEW LAYOUT OBJECT ---
// Re-designed for zero overlap.
const LAYOUT = {
    padding: 30,
    boxSize: 55,
    boxGap: 15,
    
    // Row 1: Time & Process Status
    row1Y: 50,
    timeX: 30,
    tableX: 550,

    // Row 2: CPU & Ready Queue
    row2Y: 150,
    cpuX: 50,
    readyX: 200,

    // Row 3: Terminated & Blocked Queue
    row3Y: 280,
    termX: 50,
    blockedX: 200,

    // Row 4: Gantt Chart
    row4Y: 400,
    ganttX: 30,
    ganttHeight: 40,
    ganttCellWidth: 20, // Width per time unit
};

/**
 * Resets the animation state (clears Gantt chart)
 * This must be exported and called by main.js
 */
export function resetAnimation() {
    ganttHistory = [];
}

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
    
    // --- GANTT CHART LOGIC ---
    // Store the CPU state for this time tick
    // We only add if it's a new time tick
    if (ganttHistory[stepData.time] === undefined) {
         ganttHistory[stepData.time] = stepData.cpuProcess;
    }

    // Draw all components
    drawCurrentTime(stepData.time);
    drawCpu(stepData.cpuProcess, stepData.quantumTimer);
    drawReadyQueue(stepData.readyQueue);
    drawBlockedQueue(stepData.blockedQueue);
    drawTerminated(stepData.terminated);
    drawProcessStatus(stepData.processStats);
    drawGanttChart(stepData.time); // NEW
}

// --- Drawing Helper Functions (Using New LAYOUT) ---

function drawCurrentTime(time) {
    ctx.fillStyle = COLORS.textDark;
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Time: ${time}`, LAYOUT.timeX, LAYOUT.row1Y);
}

function drawCpu(processId, quantum) {
    ctx.fillStyle = COLORS.label;
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('CPU', LAYOUT.cpuX, LAYOUT.row2Y - 10);

    let color = (processId !== 'Idle') ? COLORS.cpu : COLORS.idle;
    ctx.fillStyle = color;
    ctx.fillRect(LAYOUT.cpuX, LAYOUT.row2Y, LAYOUT.boxSize, LAYOUT.boxSize);
    ctx.strokeRect(LAYOUT.cpuX, LAYOUT.row2Y, LAYOUT.boxSize, LAYOUT.boxSize);

    ctx.fillStyle = (processId === 'Idle') ? COLORS.textDark : COLORS.text;
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(processId, LAYOUT.cpuX + LAYOUT.boxSize / 2, LAYOUT.row2Y + LAYOUT.boxSize / 2 + 8);
    
    if (quantum !== undefined && quantum > 0) {
        ctx.fillStyle = COLORS.textDark;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Q: ${quantum}`, LAYOUT.cpuX + LAYOUT.boxSize / 2, LAYOUT.row2Y + LAYOUT.boxSize + 20);
    }
}

function drawReadyQueue(queue) {
    ctx.fillStyle = COLORS.label;
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Ready Queue', LAYOUT.readyX, LAYOUT.row2Y - 10);

    if (queue.length === 0) {
        ctx.fillStyle = COLORS.label;
        ctx.font = '16px Arial';
        ctx.fillText('[Empty]', LAYOUT.readyX, LAYOUT.row2Y + 35);
        return;
    }

    queue.forEach((pid, index) => {
        let x = LAYOUT.readyX + index * (LAYOUT.boxSize + LAYOUT.boxGap);
        let y = LAYOUT.row2Y;

        ctx.fillStyle = COLORS.ready;
        ctx.fillRect(x, y, LAYOUT.boxSize, LAYOUT.boxSize);
        ctx.strokeRect(x, y, LAYOUT.boxSize, LAYOUT.boxSize);

        ctx.fillStyle = COLORS.textDark;
        ctx.font = '22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(pid, x + LAYOUT.boxSize / 2, y + LAYOUT.boxSize / 2 + 8);
    });
}

function drawBlockedQueue(queue) {
    ctx.fillStyle = COLORS.label;
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Blocked (I/O) Queue', LAYOUT.blockedX, LAYOUT.row3Y - 10);

    if (queue.length === 0) {
        ctx.fillStyle = COLORS.label;
        ctx.font = '16px Arial';
        ctx.fillText('[Empty]', LAYOUT.blockedX, LAYOUT.row3Y + 35);
        return;
    }

    queue.forEach((pidWithTimer, index) => {
        let x = LAYOUT.blockedX + index * (LAYOUT.boxSize + LAYOUT.boxGap);
        let y = LAYOUT.row3Y;

        let parts = pidWithTimer.split(' ');
        let pid = parts[0];
        let timer = parts[1]; // e.g., "(3)"

        ctx.fillStyle = COLORS.blocked;
        ctx.fillRect(x, y, LAYOUT.boxSize, LAYOUT.boxSize);
        ctx.strokeRect(x, y, LAYOUT.boxSize, LAYOUT.boxSize);

        ctx.fillStyle = COLORS.textDark;
        ctx.font = '22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(pid, x + LAYOUT.boxSize / 2, y + LAYOUT.boxSize / 2 + 8);
        
        ctx.font = '16px Arial';
        ctx.fillText(timer, x + LAYOUT.boxSize / 2, y + LAYOUT.boxSize + 20); // Timer below box
    });
}

function drawTerminated(terminatedList) {
    ctx.fillStyle = COLORS.label;
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Terminated Processes', LAYOUT.termX, LAYOUT.row3Y - 10);

    if (terminatedList.length === 0) {
        ctx.fillStyle = COLORS.label;
        ctx.font = '16px Arial';
        ctx.fillText('[Empty]', LAYOUT.termX, LAYOUT.row3Y + 25);
        return;
    }
    
    ctx.fillStyle = COLORS.terminated;
    ctx.font = '18px Arial';
    terminatedList.forEach((pid, index) => {
        let y = LAYOUT.row3Y + 25 + (index * 25);
        ctx.fillText(pid, LAYOUT.termX, y);
    });
}

function drawProcessStatus(stats) {
    ctx.fillStyle = COLORS.label;
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('All Process Status', LAYOUT.tableX, LAYOUT.row1Y - 10);

    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = COLORS.textDark;
    ctx.textAlign = 'left';
    let thY = LAYOUT.row1Y + 20;
    ctx.fillText('Process', LAYOUT.tableX, thY);
    ctx.fillText('State', LAYOUT.tableX + 100, thY);
    ctx.fillText('Rem. Burst', LAYOUT.tableX + 200, thY);

    if (!stats) return;
    ctx.font = '16px Arial';
    stats.forEach((p, index) => {
        let y = LAYOUT.row1Y + 50 + (index * 30);
        ctx.fillText(p.id, LAYOUT.tableX, y);
        
        let state = p.state || '...';
        switch (state) {
            case 'Run': ctx.fillStyle = COLORS.cpu; break;
            case 'Ready': ctx.fillStyle = COLORS.ready; break;
            case 'Block': ctx.fillStyle = COLORS.blocked; break;
            case 'Term': ctx.fillStyle = COLORS.terminated; break;
            default: ctx.fillStyle = COLORS.label;
        }
        ctx.fillText(state, LAYOUT.tableX + 100, y);
        
        ctx.fillStyle = COLORS.textDark;
        ctx.fillText(p.remainingBurst, LAYOUT.tableX + 200, y);
    });
}

// --- NEW GANTT CHART FUNCTION ---
function getGanttColor(pid) {
    if (pid === 'Idle') return COLORS.ganttIdle;
    // Use a simple hash to get a color
    let num = parseInt(pid.substring(1)) || 0;
    const colorArray = [COLORS.ganttP1, COLORS.ganttP2, COLORS.ganttP3, COLORS.ganttP4, COLORS.ganttP5];
    return colorArray[num % colorArray.length];
}

function drawGanttChart(currentTime) {
    ctx.fillStyle = COLORS.label;
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Gantt Chart (Timeline)', LAYOUT.ganttX, LAYOUT.row4Y - 10);

    // Draw the background bar
    ctx.fillStyle = COLORS.ganttBar;
    ctx.fillRect(LAYOUT.ganttX, LAYOUT.row4Y, canvas.width - LAYOUT.padding * 2, LAYOUT.ganttHeight);
    ctx.strokeRect(LAYOUT.ganttX, LAYOUT.row4Y, canvas.width - LAYOUT.padding * 2, LAYOUT.ganttHeight);

    // Draw the process blocks
    let maxBlocks = Math.floor((canvas.width - LAYOUT.ganttX - LAYOUT.padding) / LAYOUT.ganttCellWidth);
    let startTick = 0;
    
    // If chart is too long, only draw the most recent blocks
    if (currentTime > maxBlocks) {
        startTick = currentTime - maxBlocks;
    }
    
    for (let i = startTick; i <= currentTime; i++) {
        let pid = ganttHistory[i];
        if (pid === undefined) continue; // Skip ticks that haven't been stored yet
        
        let x = LAYOUT.ganttX + (i - startTick) * LAYOUT.ganttCellWidth;
        
        ctx.fillStyle = getGanttColor(pid);
        ctx.fillRect(x, LAYOUT.row4Y, LAYOUT.ganttCellWidth, LAYOUT.ganttHeight);
        ctx.strokeRect(x, LAYOUT.row4Y, LAYOUT.ganttCellWidth, LAYOUT.ganttHeight);
        
        // Add time labels occasionally
        if (i % 5 === 0) {
            ctx.fillStyle = COLORS.textDark;
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(i, x + LAYOUT.ganttCellWidth / 2, LAYOUT.row4Y + LAYOUT.ganttHeight + 10);
        }
    }
}