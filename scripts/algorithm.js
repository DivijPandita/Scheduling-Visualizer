// This file contains the core scheduling logic.

/**
 * Main router function.
 * Calls the correct algorithm based on the selected type.
 * @param {string} type - "RR", "FCFS", "SJF", "PRIORITY"
 * @param {Array} initialProcesses - Array of process objects from ui.js
 * @param {number} quantum - The time quantum
 * @returns {Array} - An array of "steps" for the animation
 */
export function calculateSchedule(type, initialProcesses, quantum) {
    // Create a "deep copy" of processes to avoid modifying the original data
    let processes = JSON.parse(JSON.stringify(initialProcesses));
    
    // Sort by arrival time first, as this is a base for most algorithms
    processes.sort((a, b) => a.arrival - b.arrival);

    switch (type) {
        case 'RR':
            console.log("Calculating Round Robin...");
            return calculateRoundRobin(processes, quantum);
        case 'FCFS':
            console.log("Calculating FCFS...");
            return calculateFCFS(processes);
        case 'SJF':
            console.log("Calculating SJF (Non-Preemptive)...");
            return calculateSJF(processes);
        case 'PRIORITY':
            console.log("Calculating Priority (Non-Preemptive)...");
            // You can build this one using SJF as a template!
            // return calculatePriority(processes);
            alert("Priority algorithm not yet implemented.");
            return []; // Return empty array
        default:
            console.error("Unknown algorithm type:", type);
            return [];
    }
}

// ---
// ALGORITHM 1: Round Robin (Your existing, working code)
// ---
function calculateRoundRobin(processes, quantum) {
    console.log("Algorithm started with:", processes, quantum);
    // ... (Your entire, working RR logic from the previous step)
    // ... (No changes needed here, just make sure it's a local function)
    
    // ---
    // (Pasting your RR logic here for completeness)
    // ---
    let currentTime = 0;
    let readyQueue = [];
    let terminatedProcesses = [];
    let animationSteps = [];
    let totalProcesses = processes.length;
    let currentProcessOnCPU = null;
    let quantumTimer = 0;
    
    let processPool = [...processes];
    const processMap = new Map();
    processes.forEach(p => processMap.set(p.id, p));

    while (terminatedProcesses.length < totalProcesses) {
        let newArrivals = [];
        processPool.forEach(p => {
            if (p.arrival === currentTime) {
                readyQueue.push(p);
                newArrivals.push(p.id);
            }
        });
        processPool = processPool.filter(p => p.arrival !== currentTime);
        
        if (currentProcessOnCPU === null) {
            if (readyQueue.length > 0) {
                currentProcessOnCPU = readyQueue.shift();
                quantumTimer = quantum;
            }
        }

        const stepData = {
            time: currentTime,
            cpuProcess: currentProcessOnCPU ? currentProcessOnCPU.id : 'Idle',
            quantumTimer: quantumTimer,
            readyQueue: readyQueue.map(p => p.id),
            terminated: terminatedProcesses.map(p => p.id),
            arrivals: newArrivals,
            processStats: [...processMap.values()].map(p => ({ id: p.id, remainingBurst: p.remainingBurst })),
            isFinalStep: false,
        };
        animationSteps.push(stepData);

        if (currentProcessOnCPU) {
            currentProcessOnCPU.remainingBurst--;
            quantumTimer--;

            if (currentProcessOnCPU.remainingBurst === 0) {
                currentProcessOnCPU.isFinished = true;
                currentProcessOnCPU.completionTime = currentTime + 1;
                terminatedProcesses.push(currentProcessOnCPU);
                currentProcessOnCPU = null;
                quantumTimer = 0;
            } else if (quantumTimer === 0) {
                readyQueue.push(currentProcessOnCPU);
                currentProcessOnCPU = null;
            }
        }
        
        currentTime++;
        if (currentTime > 1000) { break; }
    }

    // (Final stats calculation and final step push)
    let totalTAT = 0;
    let totalWT = 0;
    processes.forEach(p => {
        p.turnaroundTime = p.completionTime - p.arrival;
        p.waitingTime = p.turnaroundTime - p.burst;
        totalTAT += p.turnaroundTime;
        totalWT += p.waitingTime;
    });
    
    animationSteps.push({
        time: currentTime,
        cpuProcess: 'Idle',
        quantumTimer: 0, readyQueue: [],
        terminated: terminatedProcesses.map(p => p.id),
        arrivals: [],
        processStats: [...processMap.values()].map(p => ({ id: p.id, remainingBurst: p.remainingBurst })),
        isFinalStep: true,
        finalProcessStats: processes
    });

    console.log("Algorithm finished, returning steps:", animationSteps);
    return animationSteps;
}


// ---
// ALGORITHM 2: First-Come, First-Serve (FCFS)
// ---
function calculateFCFS(processes) {
    // FCFS is simple. Processes are already sorted by arrival time.
    let currentTime = 0;
    let readyQueue = [...processes]; // Use the full list as the queue
    let terminatedProcesses = [];
    let animationSteps = [];
    let currentProcessOnCPU = null;

    while (terminatedProcesses.length < processes.length) {
        // If CPU is idle and there are processes in the queue
        if (currentProcessOnCPU === null && readyQueue.length > 0) {
            // Check if the first process in queue has arrived
            if (readyQueue[0].arrival <= currentTime) {
                currentProcessOnCPU = readyQueue.shift();
                // Set remainingBurst to the full burst time
                currentProcessOnCPU.remainingBurst = currentProcessOnCPU.burst;
            }
        }

        // Save the state for this time unit
        const stepData = {
            time: currentTime,
            cpuProcess: currentProcessOnCPU ? currentProcessOnCPU.id : 'Idle',
            readyQueue: readyQueue.map(p => p.id),
            terminated: terminatedProcesses.map(p => p.id),
            // (You can simplify stats for FCFS if you want)
            processStats: processes.map(p => ({ id: p.id, remainingBurst: p.remainingBurst })),
            isFinalStep: false,
        };
        animationSteps.push(stepData);
        
        // Execute the process
        if (currentProcessOnCPU) {
            currentProcessOnCPU.remainingBurst--;

            // Check for completion
            if (currentProcessOnCPU.remainingBurst === 0) {
                currentProcessOnCPU.isFinished = true;
                currentProcessOnCPU.completionTime = currentTime + 1;
                terminatedProcesses.push(currentProcessOnCPU);
                currentProcessOnCPU = null; // Free the CPU
            }
        }

        // If CPU is idle and no processes are ready yet, we still tick
        currentTime++;

        if (currentTime > 1000) { break; } // Safety break
    }

    // (Final stats calculation and final step push)
    processes.forEach(p => {
        p.turnaroundTime = p.completionTime - p.arrival;
        p.waitingTime = p.turnaroundTime - p.burst;
    });
    
    animationSteps.push({
        time: currentTime,
        cpuProcess: 'Idle',
        readyQueue: [],
        terminated: terminatedProcesses.map(p => p.id),
        isFinalStep: true,
        finalProcessStats: processes
    });
    
    return animationSteps;
}


// ---
// ALGORITHM 3: Shortest Job First (SJF) (Non-Preemptive)
// ---
function calculateSJF(processes) {
    let currentTime = 0;
    let processPool = [...processes]; // Processes not yet arrived
    let readyQueue = []; // Processes that have arrived but not run
    let terminatedProcesses = [];
    let animationSteps = [];
    let currentProcessOnCPU = null;

    const totalProcesses = processes.length;

    while (terminatedProcesses.length < totalProcesses) {
        // 1. Add arriving processes to the ready queue
        processPool = processPool.filter(p => {
            if (p.arrival === currentTime) {
                readyQueue.push(p);
                return false; // Remove from pool
            }
            return true; // Keep in pool
        });

        // 2. Check if CPU is idle
        if (currentProcessOnCPU === null) {
            // If CPU is idle, pick a new process
            if (readyQueue.length > 0) {
                // Sort the ready queue by *shortest burst time*
                readyQueue.sort((a, b) => a.burst - b.burst);
                
                // Get the shortest job
                currentProcessOnCPU = readyQueue.shift();
                currentProcessOnCPU.remainingBurst = currentProcessOnCPU.burst;
            }
        }

        // 3. Save the state for this time unit
        const stepData = {
            time: currentTime,
            cpuProcess: currentProcessOnCPU ? currentProcessOnCPU.id : 'Idle',
            // Note: Our readyQueue is sorted by burst, not arrival!
            readyQueue: readyQueue.map(p => p.id), 
            terminated: terminatedProcesses.map(p => p.id),
            processStats: processes.map(p => ({ id: p.id, remainingBurst: p.remainingBurst })),
            isFinalStep: false,
        };
        animationSteps.push(stepData);

        // 4. Execute the process
        if (currentProcessOnCPU) {
            currentProcessOnCPU.remainingBurst--;

            // Check for completion
            if (currentProcessOnCPU.remainingBurst === 0) {
                currentProcessOnCPU.isFinished = true;
                currentProcessOnCPU.completionTime = currentTime + 1;
                terminatedProcesses.push(currentProcessOnCPU);
                currentProcessOnCPU = null; // Free the CPU
            }
        }

        // 5. Increment time
        currentTime++;
        if (currentTime > 1000) { break; } // Safety break
    }

    // (Final stats calculation and final step push)
    processes.forEach(p => {
        p.turnaroundTime = p.completionTime - p.arrival;
        p.waitingTime = p.turnaroundTime - p.burst;
    });
    
    animationSteps.push({
        time: currentTime,
        cpuProcess: 'Idle',
        readyQueue: [],
        terminated: terminatedProcesses.map(p => p.id),
        isFinalStep: true,
        finalProcessStats: processes
    });
    
    return animationSteps;
}