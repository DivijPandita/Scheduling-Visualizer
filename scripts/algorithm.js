// This file contains the core Round Robin logic.
// It does not interact with the DOM or Canvas.

/**
 * Calculates the entire step-by-step execution of Round Robin.
 * @param {Array} initialProcesses - Array of process objects from ui.js
 * @param {number} quantum - The time quantum
 * @returns {Array} - An array of "steps" for the animation
 */
export function calculateRoundRobin(initialProcesses, quantum) {
    console.log("Algorithm started with:", initialProcesses, quantum);

    // 1. Create a "deep copy" of the processes to work with.
    // This prevents modifying the original data from the UI.
    let processes = JSON.parse(JSON.stringify(initialProcesses));
    
    // Sort processes by arrival time to handle them in the correct order.
    // This is a crucial step.
    processes.sort((a, b) => a.arrival - b.arrival);

    // 2. Initialize simulation variables
    let currentTime = 0;
    let readyQueue = [];
    let terminatedProcesses = [];
    let animationSteps = []; // Stores the state at *every time unit*.
    let totalProcesses = processes.length;
    let currentProcessOnCPU = null;
    let quantumTimer = 0;
    
    // We use a "process pool" to pull from, so we don't re-check arrived processes.
    let processPool = [...processes];
    
    // Map to store process data by ID for quick lookups
    const processMap = new Map();
    processes.forEach(p => processMap.set(p.id, p));

    // 3. Main simulation loop
    // Keep looping as long as there are processes that haven't finished
    while (terminatedProcesses.length < totalProcesses) {
        
        // ---
        // 1. Check for new arrivals
        // ---
        // Add any processes that have arrived *at this exact time* to the ready queue.
        let newArrivals = [];
        processPool.forEach(p => {
            if (p.arrival === currentTime) {
                readyQueue.push(p);
                newArrivals.push(p.id);
            }
        });
        
        // Remove the newly arrived processes from the pool
        processPool = processPool.filter(p => p.arrival !== currentTime);
        
        // ---
        // 2. Check the CPU state (Process Dispatch)
        // ---
        if (currentProcessOnCPU === null) {
            // If CPU is idle, check the ready queue
            if (readyQueue.length > 0) {
                // Get the next process from the front of the queue (FIFO)
                currentProcessOnCPU = readyQueue.shift();
                // Reset the quantum timer for this new process
                quantumTimer = quantum;
            }
        }

        // ---
        // 5. Save the state for this time unit
        // ---
        // We save the state *before* any execution, to show what is happening
        // at the *beginning* of this time unit (e.g., Time 5 starts now).
        const stepData = {
            time: currentTime,
            cpuProcess: currentProcessOnCPU ? currentProcessOnCPU.id : 'Idle',
            quantumTimer: quantumTimer, // Good to visualize this!
            readyQueue: readyQueue.map(p => p.id),
            terminated: terminatedProcesses.map(p => p.id),
            arrivals: newArrivals, // Show which processes arrived this tick
            processStats: [...processMap.values()].map(p => ({
                 id: p.id, 
                 remainingBurst: p.remainingBurst 
            })),
            isFinalStep: false,
        };
        animationSteps.push(stepData);


        // ---
        // 3. & 4. Process Execution / Preemption
        // ---
        // Now, simulate the work done *during* this time unit (e.g., from T=5 to T=6)
        if (currentProcessOnCPU) {
            // A process is running
            currentProcessOnCPU.remainingBurst--;
            quantumTimer--;

            // Check for Process Completion
            if (currentProcessOnCPU.remainingBurst === 0) {
                // This process is finished!
                currentProcessOnCPU.isFinished = true;
                currentProcessOnCPU.completionTime = currentTime + 1; // Finishes at the *end* of this tick
                terminatedProcesses.push(currentProcessOnCPU);
                
                // Clear the CPU for the next tick
                currentProcessOnCPU = null;
                quantumTimer = 0; // Reset timer
            } 
            // Check for Quantum Expiration
            else if (quantumTimer === 0) {
                // The quantum is over, but the process is not finished.
                // Preempt it!
                
                // Add it to the *back* of the ready queue.
                readyQueue.push(currentProcessOnCPU);
                
                // Clear the CPU. A new process will be picked *at the start* of the next tick.
                currentProcessOnCPU = null;
            }
            
        } else {
            // CPU was idle, nothing to do
        }

        // ---
        // 6. Increment the clock for the next loop
        // ---
        currentTime++;
        
        // Safety break to prevent a true infinite loop if logic fails
        if (currentTime > 1000) {
             console.error("Infinite loop detected! Stopping simulation.");
             break;
        }

    } // End of while loop

    
    // ---
    // Calculate final statistics (TAT, WT)
    // ---
    let totalTAT = 0;
    let totalWT = 0;
    processes.forEach(p => {
        p.turnaroundTime = p.completionTime - p.arrival;
        p.waitingTime = p.turnaroundTime - p.burst;
        totalTAT += p.turnaroundTime;
        totalWT += p.waitingTime;
    });
    
    // Add one final step to show the completed state
    animationSteps.push({
        time: currentTime,
        cpuProcess: 'Idle',
        quantumTimer: 0,
        readyQueue: [],
        terminated: terminatedProcesses.map(p => p.id),
        arrivals: [],
        processStats: [...processMap.values()].map(p => ({
             id: p.id, 
             remainingBurst: p.remainingBurst 
        })),
        isFinalStep: true,
        finalProcessStats: processes // Send all the final stats
    });


    console.log("Algorithm finished, returning steps:", animationSteps);
    return animationSteps;
}