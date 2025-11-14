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
    
    const priorityElements = document.querySelectorAll('.priority-col');
    const burstHeader = document.getElementById('burst-col-header'); // Get header
    const burstInputs = document.querySelectorAll('.burst-sequence-input'); // Get all inputs

    if (selectedAlgo === 'RR') {
        timeQuantumDiv.style.display = 'block';
        priorityElements.forEach(el => el.style.display = 'none');
        burstHeader.textContent = 'Burst Sequence (CPU, I/O, CPU...)'; // Set RR header
    } else { 
        // For FCFS, SJF, PRIORITY
        timeQuantumDiv.style.display = 'none';
        burstHeader.textContent = 'Burst Time (CPU)'; // Set simple header

        // --- NEW ---
        // Automatically simplify all existing burst inputs for the user
        burstInputs.forEach(input => {
            let simplifiedBurst = input.value.split(',')[0].trim();
            if (simplifiedBurst) {
                input.value = simplifiedBurst;
            }
        });

        if (selectedAlgo === 'PRIORITY') {
            priorityElements.forEach(el => el.style.display = 'table-cell');
        } else {
            priorityElements.forEach(el => el.style.display = 'none');
        }
    }
}

/**
 * Handles clicks inside the process table (for remove buttons)
 */
function handleTableClick(e) {
    if (e.target.classList.contains('remove-btn')) {
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
        <td><input type="text" value="5" class="burst-sequence-input"></td>
        <td class="priority-col"><input type="number" value="1" min="1"></td>
        <td><button class="remove-btn">Remove</button></td>
    `;
    processIdCounter++;
    updateUIForAlgorithm(); 
}

/**
 * Reads all process data from the table
 * @returns {Array} Array of process objects
 */
export function getProcesses() {
    const processes = [];
    const rows = processTableBody.querySelectorAll('tr');
    const selectedAlgo = getAlgorithm(); // Get current algorithm
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const arrivalInput = row.querySelector('input[type="number"]');
        const priorityInput = row.querySelector('.priority-col input');
        const burstSequenceInput = row.querySelector('.burst-sequence-input');
        
        let burstSequence = [];
        let totalCpuBurst = 0;
        let firstBurst = 0;

        const burstValue = burstSequenceInput.value.trim();

        if (selectedAlgo === 'RR') {
            // --- RR Logic (I/O Enabled) ---
            burstSequence = burstValue.split(',')
                                .map(s => parseInt(s.trim()))
                                .filter(n => !isNaN(n) && n > 0);
            
            for (let i = 0; i < burstSequence.length; i += 2) {
                totalCpuBurst += burstSequence[i];
            }
            firstBurst = burstSequence[0] || 0;

        } else {
            // --- FCFS/SJF/Priority Logic (No I/O) ---
            firstBurst = parseInt(burstValue.split(',')[0].trim()) || 0;
            if (firstBurst > 0) {
                burstSequence = [firstBurst]; // Sequence is just the one CPU burst
            }
            totalCpuBurst = firstBurst; // Total burst is just the one CPU burst
        }

        if (burstSequence.length > 0) {
            processes.push({
                id: cells[0].textContent,
                arrival: parseInt(arrivalInput.value),
                priority: parseInt(priorityInput.value),
                
                burstSequence: burstSequence,
                burst: totalCpuBurst, // Original burst time (used by SJF)
                totalBurst: totalCpuBurst, // Total CPU time
                
                // --- State for the algorithm ---
                burstIndex: 0,
                remainingBurst: firstBurst, // The first (and for FCFS/SJF, only) CPU burst
                ioTimer: 0,
                isFinished: false,
                completionTime: 0,
                turnaroundTime: 0,
                waitingTime: 0,
            });
        }
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
 */
export function updateControls(isRunning) {
    runBtn.disabled = isRunning;
    addProcessBtn.disabled = isRunning;
    algorithmSelect.disabled = isRunning;
    
    processTableBody.querySelectorAll('input').forEach(input => {
        input.disabled = isRunning;
    });

    pauseBtn.disabled = !isRunning;
    resetBtn.disabled = !isRunning;
    
    stepForwardBtn.disabled = true;
    stepBackwardBtn.disabled = true; 
}

/**
 * Resets the UI to its initial state
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
    document.getElementById('blocked-span').textContent = '[Empty]';
    document.getElementById('terminated-span').textContent = '[Empty]';
    document.getElementById('results-table-body').innerHTML = '';
    document.getElementById('avg-tat').textContent = '0.00';
    document.getElementById('avg-wt').textContent = '0.00';

    // Make sure the UI updates to the default algorithm
    updateUIForAlgorithm();
}