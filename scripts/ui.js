// This file handles DOM interactions (reading inputs, button clicks).

// --- Get all UI elements ---
const timeQuantumInput = document.getElementById('time-quantum');
const timeQuantumDiv = document.getElementById('time-quantum-div');
const algorithmSelect = document.getElementById('algorithm-select');
const addProcessBtn = document.getElementById('add-process-btn');
const processTable = document.getElementById('process-table');
const processTableBody = document.getElementById('process-table-body');

// Get all control buttons
const runBtn = document.getElementById('run-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const stepForwardBtn = document.getElementById('step-forward-btn');
const stepBackwardBtn = document.getElementById('step-backward-btn');

let processIdCounter = 4; // Start after the default P1, P2, P3

/**
 * Initializes all UI event listeners.
 * @param {Object} handlers - An object containing handler functions from main.js
 */
export function initUI(handlers) {
    algorithmSelect.addEventListener('change', updateUIForAlgorithm);
    addProcessBtn.addEventListener('click', addProcessRow);
    processTableBody.addEventListener('click', handleTableClick);
    
    runBtn.addEventListener('click', handlers.onRun);
    pauseBtn.addEventListener('click', handlers.onPause);
    resetBtn.addEventListener('click', handlers.onReset);
    stepForwardBtn.addEventListener('click', handlers.onStepForward);
    stepBackwardBtn.addEventListener('click', handlers.onStepBackward);
    
    // Call it once on load to set the correct initial UI
    updateUIForAlgorithm();
}

/**
 * Shows/hides algorithm-specific inputs
 */
function updateUIForAlgorithm() {
    const selectedAlgo = algorithmSelect.value;
    
    // Get all priority column elements
    const priorityElements = document.querySelectorAll('.priority-col');
    
    if (selectedAlgo === 'RR') {
        timeQuantumDiv.style.display = 'block'; // Show Time Quantum
        priorityElements.forEach(el => el.style.display = 'none'); // Hide Priority
    } else if (selectedAlgo === 'PRIORITY') {
        timeQuantumDiv.style.display = 'none'; // Hide Time Quantum
        priorityElements.forEach(el => el.style.display = 'table-cell'); // Show Priority
    } else {
        // FCFS or SJF
        timeQuantumDiv.style.display = 'none'; // Hide Time Quantum
        priorityElements.forEach(el => el.style.display = 'none'); // Hide Priority
    }
}

/**
 * Handles clicks inside the process table (for remove buttons)
 * @param {Event} e - The click event
 */
function handleTableClick(e) {
    if (e.target.classList.contents.contains('remove-btn')) {
        // Find the closest 'tr' (table row) and remove it
        e.target.closest('tr').remove();
    }
}

/**
 * Adds a new, empty row to the process table
 */
function addProcessRow() {
    const newRow = processTableBody.insertRow();
    newRow.innerHTML = `
        <td>P${processIdCounter}</td>
        <td><input type="number" value="0" min="0"></td>
        <td><input type="number" value="1" min="1"></td>
        <td class="priority-col"><input type="number" value="1" min="1"></td>
        <td><button class="remove-btn">Remove</button></td>
    `;
    processIdCounter++;
    // Re-apply the show/hide logic for the new row
    updateUIForAlgorithm(); 
}

/**
 * Reads all process data from the table
 * @returns {Array} Array of process objects
 */
export function getProcesses() {
    const processes = [];
    const rows = processTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const inputs = row.querySelectorAll('input');
        
        processes.push({
            id: cells[0].textContent,
            arrival: parseInt(inputs[0].value),
            burst: parseInt(inputs[1].value),
            priority: parseInt(inputs[2].value), // Read the priority input
            // We add properties for the algorithm to use
            remainingBurst: parseInt(inputs[1].value),
            isFinished: false,
            completionTime: 0,
            turnaroundTime: 0,
            waitingTime: 0,
        });
    });
    return processes;
}

/**
 * Gets the current time quantum value
 * @returns {number}
 */
export function getTimeQuantum() {
    return parseInt(timeQuantumInput.value);
}

/**
 * Gets the selected algorithm
 * @returns {string} e.g., "RR", "FCFS"
 */
export function getAlgorithm() {
    return algorithmSelect.value;
}

/**
 * Updates the state of the UI controls (disabled/enabled)
 * This function IS EXPORTED
 * @param {boolean} isRunning - Is the simulation currently running?
 */
export function updateControls(isRunning) {
    runBtn.disabled = isRunning;
    addProcessBtn.disabled = isRunning;
    algorithmSelect.disabled = isRunning;
    
    // Disable all table inputs
    processTableBody.querySelectorAll('input').forEach(input => {
        input.disabled = isRunning;
    });

    // Enable/disable other controls
    pauseBtn.disabled = !isRunning;
    resetBtn.disabled = !isRunning;
    
    // Step buttons should be disabled by default, only enabled on pause
    stepForwardBtn.disabled = true;
    stepBackwardBtn.disabled = true; 
}

/**
 * Resets the UI to its initial state
 * This function IS EXPORTED
 */
export function resetUI() {
    runBtn.disabled = false;
    addProcessBtn.disabled = false;
    algorithmSelect.disabled = false;
    
    processTableBody.querySelectorAll('input').forEach(input => {
        input.disabled = false;
    });

    pauseBtn.disabled = true;
    resetBtn.disabled = true;
    stepForwardBtn.disabled = true;
    stepBackwardBtn.disabled = true;

    // Clear stats
    document.getElementById('current-time').textContent = '0';
    document.getElementById('ready-queue-span').textContent = '[Empty]';
    document.getElementById('terminated-span').textContent = '[Empty]';
    document.getElementById('results-table-body').innerHTML = '';
    document.getElementById('avg-tat').textContent = '0.00';
    document.getElementById('avg-wt').textContent = '0.00';
}