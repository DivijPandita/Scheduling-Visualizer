// This file contains the core scheduling logic.

/**
 * Main router function.
 */
export function calculateSchedule(type, initialProcesses, quantum) {
    let processes = JSON.parse(JSON.stringify(initialProcesses));
    processes.sort((a, b) => a.arrival - b.arrival);

    switch (type) {
        case 'RR':
            console.log("Calculating Round Robin with I/O...");
            return calculateRoundRobin_IO(processes, quantum);
        case 'FCFS':
            console.log("Calculating FCFS...");
            // Note: FCFS/SJF will only run the *first* CPU burst
            // and will not work correctly with I/O sequences.
            return calculateFCFS(processes);
        case 'SJF':
            console.log("Calculating SJF (Non-Preemptive)...");
            return calculateSJF(processes);
        case 'PRIORITY':
            console.log("Calculating Priority (Non-Preemptive)...");
            alert("Priority algorithm not yet implemented.");
            return [];
        default:
            console.error("Unknown algorithm type:", type);
            return [];
    }
}

// ---
// ALGORITHM 1: Round Robin (NEW VERSION with I/O)
// ---
function calculateRoundRobin_IO(processes, quantum) {
    let currentTime = 0;
    let readyQueue = [];
    let blockedQueue = []; // New queue for I/O
    let terminatedProcesses = [];
    let animationSteps = [];
    let totalProcesses = processes.length;
    let currentProcessOnCPU = null;
    let quantumTimer = 0;

    let processPool = [...processes];
    const processMap = new Map();
    processes.forEach(p => processMap.set(p.id, p));

    while (terminatedProcesses.length < totalProcesses) {
        
        // 1. Check for new arrivals
        let newArrivals = [];
        processPool = processPool.filter(p => {
            if (p.arrival === currentTime) {
                readyQueue.push(p);
                newArrivals.push(p.id);
                return false; // Remove from pool
            }
            return true;
        });

        // 2. Tick down I/O for processes in the blocked queue
        let unblockedProcesses = [];
        blockedQueue.forEach(p => {
            p.ioTimer--;
            if (p.ioTimer === 0) {
                // Process is done with I/O
                unblockedProcesses.push(p);
                // Move to next burst (which must be CPU)
                p.burstIndex++;
                p.remainingBurst = p.burstSequence[p.burstIndex];
            }
        });
        
        // Move unblocked processes to the ready queue
        blockedQueue = blockedQueue.filter(p => p.ioTimer > 0);
        readyQueue.push(...unblockedProcesses);

        // 3. Check CPU state (Process Dispatch)
        if (currentProcessOnCPU === null) {
            if (readyQueue.length > 0) {
                currentProcessOnCPU = readyQueue.shift();
                quantumTimer = quantum;
            }
        }

        // 4. Save the state for this time unit
        const stepData = {
            time: currentTime,
            cpuProcess: currentProcessOnCPU ? currentProcessOnCPU.id : 'Idle',
            quantumTimer: quantumTimer,
            readyQueue: readyQueue.map(p => p.id),
            blockedQueue: blockedQueue.map(p => `${p.id} (${p.ioTimer})`), // Show I/O time
            terminated: terminatedProcesses.map(p => p.id),
            arrivals: newArrivals,
            processStats: [...processMap.values()].map(p => ({ 
                 id: p.id, 
                 state: p.isFinished ? 'Term' : (currentProcessOnCPU?.id === p.id ? 'Run' : (readyQueue.includes(p) ? 'Ready' : (blockedQueue.includes(p) ? 'Block' : '...'))),
                 remainingBurst: p.remainingBurst 
            })),
            isFinalStep: false,
        };
        animationSteps.push(stepData);

        // 5. Execute the process on the CPU
        if (currentProcessOnCPU) {
            currentProcessOnCPU.remainingBurst--;
            quantumTimer--;

            // Check for CPU Burst Completion
            if (currentProcessOnCPU.remainingBurst === 0) {
                // CPU burst is done. Check if there's more.
                currentProcessOnCPU.burstIndex++;
                
                if (currentProcessOnCPU.burstIndex >= currentProcessOnCPU.burstSequence.length) {
                    // --- PROCESS TERMINATED ---
                    currentProcessOnCPU.isFinished = true;
                    currentProcessOnCPU.completionTime = currentTime + 1;
                    terminatedProcesses.push(currentProcessOnCPU);
                    currentProcessOnCPU = null;
                } else {
                    // --- PROCESS BLOCKED FOR I/O ---
                    // Get I/O time from the *next* burst sequence
                    currentProcessOnCPU.ioTimer = currentProcessOnCPU.burstSequence[currentProcessOnCPU.burstIndex];
                    blockedQueue.push(currentProcessOnCPU);
                    currentProcessOnCPU = null;
                }
            } 
            // Check for Quantum Expiration
            else if (quantumTimer === 0) {
                // Preempt!
                readyQueue.push(currentProcessOnCPU);
                currentProcessOnCPU = null;
            }
        }
        
        currentTime++;
        if (currentTime > 1000) { break; } // Safety break
    }

    // Calculate final stats
    processes.forEach(p => {
        p.turnaroundTime = p.completionTime - p.arrival;
        p.waitingTime = p.turnaroundTime - p.totalBurst; // Wait time is TAT - *Total CPU Burst*
    });
    
    animationSteps.push({
        time: currentTime,
        cpuProcess: 'Idle', quantumTimer: 0,
        readyQueue: [], blockedQueue: [],
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
// ALGORITHM 2 & 3: FCFS and SJF (Unchanged)
// These will only run the *first* CPU burst and then terminate.
// They do not support the new I/O model.
// ---

function calculateFCFS(processes) {
    // ... (Your existing FCFS logic)
    // NOTE: This logic will now use `p.remainingBurst`, which is only
    // the *first* CPU burst. It will not process I/O.
    let currentTime = 0;
    let readyQueue = [...processes];
    let terminatedProcesses = [];
    let animationSteps = [];
    let currentProcessOnCPU = null;

    while (terminatedProcesses.length < processes.length) {
        if (currentProcessOnCPU === null && readyQueue.length > 0) {
            if (readyQueue[0].arrival <= currentTime) {
                currentProcessOnCPU = readyQueue.shift();
            }
        }
        const stepData = {
            time: currentTime,
            cpuProcess: currentProcessOnCPU ? currentProcessOnCPU.id : 'Idle',
            readyQueue: readyQueue.map(p => p.id),
            blockedQueue: [], // No I/O
            terminated: terminatedProcesses.map(p => p.id),
            processStats: processes.map(p => ({ id: p.id, remainingBurst: p.remainingBurst })),
            isFinalStep: false,
        };
        animationSteps.push(stepData);
        if (currentProcessOnCPU) {
            currentProcessOnCPU.remainingBurst--;
            if (currentProcessOnCPU.remainingBurst === 0) {
                currentProcessOnCPU.isFinished = true;
                currentProcessOnCPU.completionTime = currentTime + 1;
                terminatedProcesses.push(currentProcessOnCPU);
                currentProcessOnCPU = null;
            }
        }
        currentTime++;
        if (currentTime > 1000) { break; }
    }
    processes.forEach(p => {
        p.turnaroundTime = p.completionTime - p.arrival;
        p.waitingTime = p.turnaroundTime - p.totalBurst;
    });
    animationSteps.push({
        time: currentTime, cpuProcess: 'Idle', readyQueue: [], blockedQueue: [],
        terminated: terminatedProcesses.map(p => p.id),
        isFinalStep: true, finalProcessStats: processes
    });
    return animationSteps;
}

function calculateSJF(processes) {
    // ... (Your existing SJF logic)
    // NOTE: This logic will sort by `p.burst`, which is now `totalBurst`.
    // It will only execute the *first* CPU burst.
    let currentTime = 0;
    let processPool = [...processes];
    let readyQueue = [];
    let terminatedProcesses = [];
    let animationSteps = [];
    let currentProcessOnCPU = null;
    const totalProcesses = processes.length;

    while (terminatedProcesses.length < totalProcesses) {
        processPool = processPool.filter(p => {
            if (p.arrival === currentTime) {
                readyQueue.push(p);
                return false;
            }
            return true;
        });

        if (currentProcessOnCPU === null) {
            if (readyQueue.length > 0) {
                // Sort by TOTAL burst time (as per original logic)
                readyQueue.sort((a, b) => a.totalBurst - b.totalBurst);
                currentProcessOnCPU = readyQueue.shift();
            }
        }

        const stepData = {
            time: currentTime,
            cpuProcess: currentProcessOnCPU ? currentProcessOnCPU.id : 'Idle',
            readyQueue: readyQueue.map(p => p.id),
            blockedQueue: [], // No I/O
            terminated: terminatedProcesses.map(p => p.id),
            processStats: processes.map(p => ({ id: p.id, remainingBurst: p.remainingBurst })),
            isFinalStep: false,
        };
        animationSteps.push(stepData);

        if (currentProcessOnCPU) {
            currentProcessOnCPU.remainingBurst--;
            if (currentProcessOnCPU.remainingBurst === 0) {
                currentProcessOnCPU.isFinished = true;
                currentProcessOnCPU.completionTime = currentTime + 1;
                terminatedProcesses.push(currentProcessOnCPU);
                currentProcessOnCPU = null;
            }
        }
        currentTime++;
        if (currentTime > 1000) { break; }
    }

    processes.forEach(p => {
        p.turnaroundTime = p.completionTime - p.arrival;
        p.waitingTime = p.turnaroundTime - p.totalBurst;
    });
    animationSteps.push({
        time: currentTime, cpuProcess: 'Idle', readyQueue: [], blockedQueue: [],
        terminated: terminatedProcesses.map(p => p.id),
        isFinalStep: true, finalProcessStats: processes
    });
    return animationSteps;
}