# Advanced CPU Scheduling Visualizer

A web-based, zero-dependency interactive simulation tool that visualizes core operating system scheduling algorithms.

[cite_start]This project was developed for the BCSE303L Operating System course[cite: 3]. [cite_start]It allows users to input custom processes, select an algorithm, and observe real-time, step-by-step algorithmic behavior through an animated interface[cite: 8].

![Screenshot of the CPU Scheduling Visualizer](image_10cfad.png)

*(Recommendation: Replace `image_10cfad.png` with a high-quality screenshot of your final running application.)*

---

## ✨ Features

* **Multiple Scheduling Algorithms:**
    * First-Come, First-Serve (FCFS)
    * Shortest Job First (SJF) (Non-Preemptive)
    * Round Robin (RR)
* **Advanced I/O Blocking:** The Round Robin algorithm simulates a 5-state process model, allowing processes to enter a "Blocked" state for I/O and then return to the Ready Queue.
* **Dynamic Gantt Chart:** A real-time, color-coded Gantt chart visualizes CPU allocation at the bottom of the canvas.
* [cite_start]**Full Animation Control:** Play, pause, step-forward, step-backward, and reset the simulation[cite: 16].
* [cite_start]**Variable Speed:** Control the animation speed with a slider[cite: 19].
* **Interactive Process Input:** Add or remove custom processes with unique arrival times and burst sequences.
* [cite_start]**Real-time Statistics:** View the state of all processes (Ready, Running, Blocked, Terminated), their remaining burst times, and final performance metrics (Average TAT & WT)[cite: 18, 50].
* **Modern Dark Theme:** A sleek, "glassmorphism" dark theme for a professional user experience.

---

## 💻 Technology Stack

[cite_start]This project is built with **zero dependencies** as required by the project specifications[cite: 12].
* [cite_start]**HTML5** [cite: 11]
* [cite_start]**CSS3** [cite: 11]
* [cite_start]**JavaScript (ES6+)** [cite: 11]
* [cite_start]**HTML5 Canvas API** (for all animations) [cite: 11]

---

## 🚀 Execution Guide

[cite_start]This document provides all the necessary instructions to run and use the application[cite: 43].

### 1. Setup Instructions

This is a standalone web application with zero dependencies. [cite_start]It runs entirely in your browser[cite: 12].

1.  Clone or download the project repository.
2.  Open the project folder.
3.  [cite_start]Double-click the **`index.html`** file[cite: 45].
4.  [cite_start]The application will open and run in your default web browser[cite: 11].

### 2. User Interface Guide

* **Parameters (Top Card):**
    * **Scheduling Algorithm:** Select the algorithm (FCFS, SJF, RR) to run.
    * **Time Quantum:** (Visible for RR only) Sets the time slice for the Round Robin algorithm.
    * **Process List:** Add or remove processes.
        * `Arrival Time`: The time unit (tick) when the process enters the Ready Queue.
        * `Burst Sequence (CPU, I/O, CPU...)`: A comma-separated list of CPU and I/O bursts (e.g., `5,3,8` means 5 CPU, 3 I/O, 8 CPU).
        * **Note:** The FCFS and SJF algorithms will only use the *first* CPU burst number. The advanced I/O simulation is only implemented for Round Robin.

* **Controls (Middle Card):**
    * **Run:** Starts the simulation.
    * [cite_start]**Pause:** Pauses the live animation[cite: 16].
    * **Reset:** Stops and clears the simulation, resetting all processes and the Gantt chart.
    * [cite_start]**Step Forward / Step Backward:** When paused, moves the animation one time-tick forward or backward[cite: 16].
    * [cite_start]**Speed:** A slider to control the animation playback speed[cite: 19].

### 3. Animation Features

[cite_start]The visualization is rendered on an HTML5 Canvas and provides a real-time, color-coded view of the system state[cite: 18].

* [cite_start]**Color Coding:** [cite: 46]
    * **Cyan:** The process is currently running on the CPU.
    * **Yellow:** The process is in the Ready Queue, waiting for the CPU.
    * **Orange:** The process is in the Blocked Queue, performing I/O.
    * **Gray:** The process has finished execution and is in the Terminated list.
* [cite_start]**Live Queues:** Process boxes are dynamically added and removed from the CPU, Ready Queue, and Blocked Queue[cite: 18].
* **All Process Status Table:** A live-updating table shows the *exact* state (`Run`, `Ready`, `Block`, `Term`) and remaining burst time for every process.
* **Gantt Chart:** A color-coded timeline at the bottom shows which process (or `Idle`) held the CPU at every time unit. Each block is individually bordered for clarity.

### 4. Browser Requirements

This application uses modern ES6+ JavaScript and the Canvas API. [cite_start]It is compatible with the latest versions of all major browsers[cite: 13, 47].

* **Google Chrome** (v80+)
* **Mozilla Firefox** (v78+)
* **Microsoft Edge** (v88+)
* *(Not recommended for Internet Explorer.)*

---

## Final Project Structure