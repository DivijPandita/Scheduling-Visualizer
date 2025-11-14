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
// ---
// ALGORITHM 1: Round Robin (NEW, MORE ACCURATE I/O VERSION)
// ---
function calculateRoundRobin_IO(processes, quantum) {
    let currentTime = 0;
    let readyQueue = [];
    let blockedQueue = [];
    let terminatedProcesses = [];
    let animationSteps = [];
    let totalProcesses = processes.length;
    let currentProcessOnCPU = null;
    let quantumTimer = 0;

    let processPool = [...processes];
    const processMap = new Map();
    processes.forEach(p => processMap.set(p.id, p));

    // Loop until all processes are terminated
    while (terminatedProcesses.length < totalProcesses) {

        // --- Start of Tick T ---

        // 1. Check for I/O Completions
        // Processes finishing I/O get queue priority
        let unblockedProcesses = [];
        blockedQueue.forEach(p => {
            p.ioTimer--;
            if (p.ioTimer === 0) {
                unblockedProcesses.push(p);
                p.burstIndex++;
                p.remainingBurst = p.burstSequence[p.burstIndex];
            }
        });
        blockedQueue = blockedQueue.filter(p => p.ioTimer > 0);
        
        // 2. Check for New Arrivals
        let newArrivals = [];
        processPool = processPool.filter(p => {
            if (p.arrival === currentTime) {
                newArrivals.push(p);
                return false; // Remove from pool
            }
            return true;
        });

        // 3. Add to Ready Queue in correct FCFS order
        // (Unblocked processes first, then new arrivals)
        readyQueue.push(...unblockedProcesses);
        readyQueue.push(...newArrivals);
        
        // 4. Check for CPU Dispatch
        if (currentProcessOnCPU === null) {
            if (readyQueue.length > 0) {
                currentProcessOnCPU = readyQueue.shift();
                quantumTimer = quantum;
            }
        }

        // 5. SAVE STATE (This is the state AT time T)
        animationSteps.push({
            time: currentTime,
            cpuProcess: currentProcessOnCPU ? currentProcessOnCPU.id : 'Idle',
            quantumTimer: quantumTimer,
            readyQueue: readyQueue.map(p => p.id),
            blockedQueue: blockedQueue.map(p => `${p.id} (${p.ioTimer})`),
            terminated: terminatedProcesses.map(p => p.id),
            arrivals: newArrivals.map(p => p.id), // Store IDs
            processStats: [...processMap.values()].map(p => ({ 
                 id: p.id, 
                 state: p.isFinished ? 'Term' : (currentProcessOnCPU?.id === p.id ? 'Run' : (readyQueue.includes(p) ? 'Ready' : (blockedQueue.includes(p) ? 'Block' : '...'))),
                 remainingBurst: p.remainingBurst 
            })),
            isFinalStep: false,
        });

        // --- "Work" Phase (Simulates what happens from T to T+1) ---

        // 6. Execute CPU
        if (currentProcessOnCPU) {
            currentProcessOnCPU.remainingBurst--;
            quantumTimer--;

            // 7. Check for CPU Burst Completion
            if (currentProcessOnCPU.remainingBurst === 0) {
                currentProcessOnCPU.burstIndex++;
                
                if (currentProcessOnCPU.burstIndex >= currentProcessOnCPU.burstSequence.length) {
                    // --- PROCESS TERMINATED ---
                    currentProcessOnCPU.isFinished = true;
                    currentProcessOnCPU.completionTime = currentTime + 1; // Finishes at END of tick
                    terminatedProcesses.push(currentProcessOnCPU);
                    currentProcessOnCPU = null;
                } else {
                    // --- PROCESS BLOCKED FOR I/O ---
                    currentProcessOnCPU.ioTimer = currentProcessOnCPU.burstSequence[currentProcessOnCPU.burstIndex];
                    blockedQueue.push(currentProcessOnCPU);
                    currentProcessOnCPU = null;
                }
            } 
            // 8. Check for Quantum Expiration
            else if (quantumTimer === 0) {
                // Preempt!
                readyQueue.push(currentProcessOnCPU);
                currentProcessOnCPU = null;
            }
        }

        // 9. Increment Time
        currentTime++;
        
        if (currentTime > 1000) { // Safety break
            console.error("Infinite loop detected!");
            break; 
        }
    } // --- End of While Loop ---

    // Calculate final stats
    processes.forEach(p => {
        p.turnaroundTime = p.completionTime - p.arrival;
        p.waitingTime = p.turnaroundTime - p.totalBurst;
    });
    
    // Add one final step to show the completed state
    animationSteps.push({
        time: currentTime,
        cpuProcess: 'Idle', quantumTimer: 0,
        readyQueue: [], blockedQueue: [],
        terminated: terminatedProcesses.map(p => p.id),
        arrivals: [],
        processStats: [...processMap.values()].map(p => ({ 
            id: p.id, 
            state: 'Term',
            remainingBurst: 0
        })),
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