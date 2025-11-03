// This file handles all drawing on the HTML5 Canvas.

// --- Canvas Setup ---
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');

// --- Module-Level State for Gantt Chart ---
let ganttHistory = [];

// --- NEW COLORS OBJECT ---
// This palette is synced with your new "glassmorphism" style.css
const COLORS = {
    cpu: '#06b6d4',         // var(--color-cpu)
    ready: '#fbbf24',       // var(--color-ready)
    blocked: '#f97316',     // var(--color-blocked)
    terminated: '#6b7280',  // var(--text-muted)
    text: '#FFFFFF',         // White text (for on top of dark boxes)
    textDark: '#e4e4f0',     // var(--text-color) - For all general text
    idle: '#1a1a2e',         // var(--bg-secondary)
    label: '#9ca3af',        // var(--text-secondary)
    ganttBar: '#1a1a2e',     // var(--bg-secondary)
    ganttIdle: '#0f0f1e',    // var(--bg-color)
    ganttP1: '#8b5cf6',      // var(--accent-purple)
    ganttP2: '#10b981',      // var(--accent-green)
    ganttP3: '#fbbf24',      // Re-using ready color
    ganttP4: '#3b82f6',      // var(--accent-blue)
    ganttP5: '#ef4444',      // var(--accent-red)
};

// --- LAYOUT OBJECT (Unchanged from last time) ---
const LAYOUT = {
    padding: 30,
    boxSize: 55,
    boxGap: 15,
    
    // Row 1: Time & Process Status
    row1Y: 50,
    timeX: 30,
    tableX: 600, 

    // Row 2: CPU & Ready Queue
    row2Y: 150,
    cpuX: 50,
    readyX: 250,

    // Row 3: Terminated & Blocked Queue
    row3Y: 280,
    termX: 50,
    blockedX: 250,

    // Row 4: Gantt Chart
    row4Y: 400,
    ganttX: 30,
    ganttHeight: 40,
    ganttCellWidth: 20,
};

/**
 * Resets the animation state (clears Gantt chart)
 */
export function resetAnimation() {
    ganttHistory = [];
}

/**
 * Clears the entire canvas
 */
function clearCanvas() {
    // We clear, and the CSS gradient background from #main-canvas will show through
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draws a single frame of the animation
 */
export function drawFrame(stepData) {
    clearCanvas();
    
    if (!stepData) {
        ctx.fillStyle = COLORS.textDark; // Use new light text
        ctx.font = '20px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Click "Run" to start the simulation.', canvas.width / 2, 50);
        return;
    }
    
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
    drawGanttChart(stepData.time);
}

// --- Drawing Helper Functions (Using New COLORS) ---

function drawCurrentTime(time) {
    ctx.fillStyle = COLORS.textDark; // Use light text
    ctx.font = '24px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Time: ${time}`, LAYOUT.timeX, LAYOUT.row1Y);
}

function drawCpu(processId, quantum) {
    ctx.fillStyle = COLORS.label;
    ctx.font = '18px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('CPU', LAYOUT.cpuX, LAYOUT.row2Y - 10);

    let color = (processId !== 'Idle') ? COLORS.cpu : COLORS.idle;
    ctx.fillStyle = color;
    ctx.fillRect(LAYOUT.cpuX, LAYOUT.row2Y, LAYOUT.boxSize, LAYOUT.boxSize);
    ctx.strokeStyle = COLORS.label;
    ctx.strokeRect(LAYOUT.cpuX, LAYOUT.row2Y, LAYOUT.boxSize, LAYOUT.boxSize);

    // Use light text on dark boxes, or dark text on light "Idle" box
    ctx.fillStyle = (processId === 'Idle') ? COLORS.textDark : COLORS.text;
    ctx.font = '22px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(processId, LAYOUT.cpuX + LAYOUT.boxSize / 2, LAYOUT.row2Y + LAYOUT.boxSize / 2 + 8);
    
    if (quantum !== undefined && quantum > 0) {
        ctx.fillStyle = COLORS.textDark; // Use light text
        ctx.font = '16px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Q: ${quantum}`, LAYOUT.cpuX + LAYOUT.boxSize / 2, LAYOUT.row2Y + LAYOUT.boxSize + 20);
    }
}

function drawReadyQueue(queue) {
    ctx.fillStyle = COLORS.label;
    ctx.font = '18px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Ready Queue', LAYOUT.readyX, LAYOUT.row2Y - 10);

    if (queue.length === 0) {
        ctx.fillStyle = COLORS.label;
        ctx.font = '16px "Inter", sans-serif';
        ctx.fillText('[Empty]', LAYOUT.readyX, LAYOUT.row2Y + 35);
        return;
    }

    queue.forEach((pid, index) => {
        let x = LAYOUT.readyX + index * (LAYOUT.boxSize + LAYOUT.boxGap);
        let y = LAYOUT.row2Y;

        ctx.fillStyle = COLORS.ready;
        ctx.fillRect(x, y, LAYOUT.boxSize, LAYOUT.boxSize);
        ctx.strokeStyle = COLORS.label;
        ctx.strokeRect(x, y, LAYOUT.boxSize, LAYOUT.boxSize);

        ctx.fillStyle = COLORS.textDark; // Use dark text on light yellow
        ctx.font = '22px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(pid, x + LAYOUT.boxSize / 2, y + LAYOUT.boxSize / 2 + 8);
    });
}

function drawBlockedQueue(queue) {
    ctx.fillStyle = COLORS.label;
    ctx.font = '18px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Blocked (I/O) Queue', LAYOUT.blockedX, LAYOUT.row3Y - 10);

    if (queue.length === 0) {
        ctx.fillStyle = COLORS.label;
        ctx.font = '16px "Inter", sans-serif';
        ctx.fillText('[Empty]', LAYOUT.blockedX, LAYOUT.row3Y + 35);
        return;
    }

    queue.forEach((pidWithTimer, index) => {
        let x = LAYOUT.blockedX + index * (LAYOUT.boxSize + LAYOUT.boxGap);
        let y = LAYOUT.row3Y;

        let parts = pidWithTimer.split(' ');
        let pid = parts[0];
        let timer = parts[1];

        ctx.fillStyle = COLORS.blocked;
        ctx.fillRect(x, y, LAYOUT.boxSize, LAYOUT.boxSize);
        ctx.strokeStyle = COLORS.label;
        ctx.strokeRect(x, y, LAYOUT.boxSize, LAYOUT.boxSize);

        ctx.fillStyle = COLORS.text; // Use light text on dark orange
        ctx.font = '22px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(pid, x + LAYOUT.boxSize / 2, y + LAYOUT.boxSize / 2 + 8);
        
        ctx.font = '16px "JetBrains Mono", monospace';
        ctx.fillStyle = COLORS.textDark; // Use light text for timer below
        ctx.fillText(timer, x + LAYOUT.boxSize / 2, y + LAYOUT.boxSize + 20);
    });
}

function drawTerminated(terminatedList) {
    ctx.fillStyle = COLORS.label;
    ctx.font = '18px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Terminated Processes', LAYOUT.termX, LAYOUT.row3Y - 10);

    if (terminatedList.length === 0) {
        ctx.fillStyle = COLORS.label;
        ctx.font = '16px "Inter", sans-serif';
        ctx.fillText('[Empty]', LAYOUT.termX, LAYOUT.row3Y + 25);
        return;
    }
    
    ctx.fillStyle = COLORS.terminated;
    ctx.font = '18px "JetBrains Mono", monospace';
    terminatedList.forEach((pid, index) => {
        let y = LAYOUT.row3Y + 25 + (index * 25);
        ctx.fillText(pid, LAYOUT.termX, y);
    });
}

function drawProcessStatus(stats) {
    ctx.fillStyle = COLORS.label;
    ctx.font = '18px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('All Process Status', LAYOUT.tableX, LAYOUT.row1Y - 10);

    ctx.font = 'bold 16px "Inter", sans-serif';
    ctx.fillStyle = COLORS.textDark;
    ctx.textAlign = 'left';
    let thY = LAYOUT.row1Y + 20;
    ctx.fillText('Process', LAYOUT.tableX, thY);
    ctx.fillText('State', LAYOUT.tableX + 100, thY);
    ctx.fillText('Rem. Burst', LAYOUT.tableX + 200, thY);

    if (!stats) return;
    ctx.font = '16px "JetBrains Mono", monospace';
    stats.forEach((p, index) => {
        let y = LAYOUT.row1Y + 50 + (index * 30);
        
        ctx.fillStyle = COLORS.textDark;
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

// --- GANTT CHART FUNCTION ---
function getGanttColor(pid) {
    if (pid === 'Idle') return COLORS.ganttIdle;
    let num = parseInt(pid.substring(1)) || 0;
    const colorArray = [COLORS.ganttP1, COLORS.ganttP2, COLORS.ganttP3, COLORS.ganttP4, COLORS.ganttP5];
    return colorArray[num % colorArray.length];
}

function drawGanttChart(currentTime) {
    ctx.fillStyle = COLORS.label;
    ctx.font = '18px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Gantt Chart (Timeline)', LAYOUT.ganttX, LAYOUT.row4Y - 10);

    // Draw the background bar
    ctx.fillStyle = COLORS.ganttBar;
    ctx.fillRect(LAYOUT.ganttX, LAYOUT.row4Y, canvas.width - LAYOUT.padding * 2, LAYOUT.ganttHeight);
    ctx.strokeStyle = COLORS.label;
    ctx.strokeRect(LAYOUT.ganttX, LAYOUT.row4Y, canvas.width - LAYOUT.padding * 2, LAYOUT.ganttHeight);

    let maxBlocks = Math.floor((canvas.width - LAYOUT.ganttX - LAYOUT.padding) / LAYOUT.ganttCellWidth);
    if(isNaN(maxBlocks)) maxBlocks = 30;
    
    let startTick = 0;
    if (currentTime > maxBlocks) {
        startTick = currentTime - maxBlocks;
    }
    
    for (let i = startTick; i <= currentTime; i++) {
        let pid = ganttHistory[i];
        if (pid === undefined) continue;
        
        let x = LAYOUT.ganttX + (i - startTick) * LAYOUT.ganttCellWidth;
        
        ctx.fillStyle = getGanttColor(pid);
        ctx.fillRect(x, LAYOT.row4Y, LAYOUT.ganttCellWidth, LAYOUT.ganttHeight);

        // --- ADD THESE TWO LINES ---
        ctx.strokeStyle = COLORS.label; // Use the gray label color for the border
        ctx.strokeRect(x, LAYOUT.row4Y, LAYOUT.ganttCellWidth, LAYOUT.ganttHeight);
        // --- END OF ADDITION ---
        
        if (i % 5 === 0) {
            ctx.fillStyle = COLORS.textDark;
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(i, x + LAYOUT.ganttCellWidth / 2, LAYOUT.row4Y + LAYOUT.ganttHeight + 10);
        }
    }
}