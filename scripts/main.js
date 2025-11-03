// This is the main controller.
// It imports functions from other modules and manages the application state.

import { initUI, getProcesses, getTimeQuantum, getAlgorithm, updateControls, resetUI } from './ui.js';
import { calculateSchedule } from './algorithm.js';
import { drawFrame, resetAnimation } from './animation.js'; // Import resetAnimation

// --- Application State ---
let animationSteps = []; // Stores the full animation "script"
let currentStep = 0;     // The current step we are viewing
let isPlaying = false;
let animationInterval = null;
let animationSpeed = 1000; // Milliseconds (default)

// --- Main Handlers ---

/**
 * Called when the "Run" button is clicked
 */
function handleRun() {
    console.log("Run clicked");
    
    const processes = getProcesses();
    const quantum = getTimeQuantum();
    const algorithmType = getAlgorithm();

    if (processes.length === 0) {
        alert("Please add at least one process.");
        return;
    }

    try {
        animationSteps = calculateSchedule(algorithmType, processes, quantum);
    } catch (error) {
        console.error("Error in algorithm:", error);
        alert("An error occurred during simulation. Check console.");
        return;
    }
    
    if (animationSteps.length === 0) {
        console.log("Algorithm returned no steps.");
        return;
    }

    console.log(`Starting animation with ${animationSteps.length} steps.`);
    currentStep = 0;
    isPlaying = true;
    updateControls(true); // Disable inputs, enable pause/reset
    
    document.getElementById('algorithm-select').disabled = true;

    startAnimation();
}

/**
 * Called when the "Pause" button is clicked
 */
function handlePause() {
    console.log("Pause clicked");
    isPlaying = false;
    if (animationInterval) {
        clearInterval(animationInterval);
    }
    // Enable step buttons only when paused and simulation has run
    if (animationSteps.length > 0) {
        document.getElementById('step-forward-btn').disabled = false;
        document.getElementById('step-backward-btn').disabled = false;
    }
    document.getElementById('pause-btn').disabled = true;
}

/**
 * Called when the "Reset" button is clicked
 */
function handleReset() {
    console.log("Reset clicked");
    handlePause(); // Stop any running intervals
    animationSteps = [];
    currentStep = 0;
    resetUI(); // Resets all UI elements
    
    // --- ADDED ---
    resetAnimation(); // Clears the Gantt chart history
    // --- END ---
    
    // Re-enable the algorithm select
    document.getElementById('algorithm-select').disabled = false;
    
    drawFrame(null); // Clear the canvas
}

/**
 * Called when "Step Forward" is clicked
 */
function handleStepForward() {
    if (currentStep < animationSteps.length - 1) {
        currentStep++;
        updateSimulationState(currentStep);
    }
}

/**
 * Called when "Step Backward" is clicked
 */
function handleStepBackward() {
    if (currentStep > 0) {
        currentStep--;
        updateSimulationState(currentStep);
    }
}

/**
 * Starts or resumes the animation playback
 */
function startAnimation() {
    if (animationInterval) {
        clearInterval(animationInterval);
    }
    
    document.getElementById('step-forward-btn').disabled = true;
    document.getElementById('step-backward-btn').disabled = true;
    document.getElementById('pause-btn').disabled = false;
    
    animationSpeed = 2100 - document.getElementById('speed-slider').value;

    animationInterval = setInterval(() => {
        if (isPlaying && currentStep < animationSteps.length) {
            updateSimulationState(currentStep);
            currentStep++;
        } else {
            handlePause(); // Stop when animation ends
            // Lock onto the last step
            if (currentStep >= animationSteps.length) {
                currentStep = animationSteps.length - 1;
                // Ensure the final state is fully displayed
                if(currentStep >= 0) {
                     updateSimulationState(currentStep);
                }
            }
        }
    }, animationSpeed);
}

/**
 * Updates the canvas and statistics panel for a given step
 * @param {number} stepIndex - The index of the step to display
 */
function updateSimulationState(stepIndex) {
    const stepData = animationSteps[stepIndex];
    if (!stepData) return;

    // 1. Draw the canvas
    drawFrame(stepData);

    // 2. Update statistics panel
    document.getElementById('current-time').textContent = stepData.time;
    
    const readyQueueText = stepData.readyQueue.length > 0 ? stepData.readyQueue.join(', ') : '[Empty]';
    document.getElementById('ready-queue-span').textContent = readyQueueText;
    
    const blockedQueueText = stepData.blockedQueue.length > 0 ? stepData.blockedQueue.join(', ') : '[Empty]';
    document.getElementById('blocked-span').textContent = blockedQueueText;

    const terminatedText = stepData.terminated.length > 0 ? stepData.terminated.join(', ') : '[Empty]';
    document.getElementById('terminated-span').textContent = terminatedText;

    // 3. If it's the final step, show final results
    if (stepData.isFinalStep) {
        displayFinalResults(stepData.finalProcessStats);
    }
}

/**
 * Displays the final TAT and WT in the results table
 * @param {Array} finalStats - The array of process objects with all stats calculated
 */
function displayFinalResults(finalStats) {
    const resultsBody = document.getElementById('results-table-body');
    resultsBody.innerHTML = '';

    let totalTAT = 0;
    let totalWT = 0;

    if (Array.isArray(finalStats)) {
        finalStats.forEach(p => {
            // Use p.totalBurst (for RR) or p.burst (for FCFS/SJF)
            const burst = p.totalBurst || p.burst;

            const row = resultsBody.insertRow();
            row.innerHTML = `
                <td>${p.id}</td>
                <td>${p.arrival}</td>
                <td>${burst}</td> <td>${p.completionTime}</td>
                <td>${p.turnaroundTime}</td>
                <td>${p.waitingTime}</td>
            `;
            totalTAT += p.turnaroundTime;
            totalWT += p.waitingTime;
        });

        if (finalStats.length > 0) {
            const avgTAT = (totalTAT / finalStats.length).toFixed(2);
            const avgWT = (totalWT / finalStats.length).toFixed(2);

            document.getElementById('avg-tat').textContent = avgTAT;
            document.getElementById('avg-wt').textContent = avgWT;
        }
    } else {
        console.error("Final stats are not in the expected array format:", finalStats);
    }
}


// --- Initialization ---
/**
 * Main entry point for the application
 */
function main() {
    // Pass the handler functions to the UI module
    initUI({
        onRun: handleRun,
        onPause: handlePause,
        onReset: handleReset,
        onStepForward: handleStepForward,
        onStepBackward: handleStepBackward
    });
    
    // Draw the initial empty state
    drawFrame(null);
}

// Start the application once the DOM is loaded
document.addEventListener('DOMContentLoaded', main);