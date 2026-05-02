🌐 Advanced Algorithm Visualizer

An interactive, web-based tool designed to visualize graph pathfinding algorithms and mathematical matrix convolution. Built entirely with HTML, CSS, and Vanilla JavaScript, this project demonstrates clean architecture, DOM manipulation, asynchronous programming, and complex data structures in action.

✨ Features

Interactive Grid: Click and drag to build impenetrable walls or challenging "mud" weights.

Multiple Algorithms:

Dijkstra's Algorithm: The gold standard for weighted shortest-path finding.

A Search (A-Star):* Highly optimized pathfinding using Manhattan Distance heuristics.

Breadth-First Search (BFS): Explores equally in all directions (unweighted).

Depth-First Search (DFS): Dives deep down a single path before backtracking.

Matrix Convolution: Simulates image processing by scanning a 3x3 kernel over the grid to generate a heat map.

Random Maze Generation: Instantly populate the grid with a random scattering of obstacles.

Engine Controls: Play, Pause, Clear Board, and a dynamic Speed Slider to analyze algorithms at your own pace.

Premium UI: Features a modern glassmorphic interface, dark theme (Eerie Black & Flame Orange), and smooth CSS animations.

🚀 How to Use

Select an Algorithm: Use the top-left dropdown to choose the algorithm you want to visualize.

Draw Obstacles: * Select Solid Walls from the Draw Mode dropdown to create impassable barriers.

Select Mud / Weights to create difficult terrain. (Note: Only Dijkstra and A* respect weight costs).

Click and drag on the grid to paint your obstacles.

Run the Simulation: Click ▶ Play to watch the algorithm execute step-by-step.

Control the Flow: Use ⏸ Pause to freeze the execution, adjust the Speed slider, and hit Play again to resume.

Reset: Click ↺ Clear Board to wipe the grid and start over.

🧠 The Algorithms Explained

A Search:* Uses a priority queue and a heuristic (Manhattan distance) to actively target the destination. It is generally the fastest way to find the shortest path while respecting terrain weights.

Dijkstra's Algorithm: Also guarantees the shortest path and respects weights, but searches blindly in all directions until it finds the target.

Breadth-First Search (BFS): Explores the grid like a spreading wave. It guarantees the shortest path on an unweighted grid but treats mud and empty space exactly the same.

Depth-First Search (DFS): Explores as far as possible along each branch before backtracking. It does not guarantee the shortest path and often creates snake-like, erratic patterns.

Matrix Convolution: Not a pathfinding algorithm! It simulates how computer vision applies filters (like blur or edge detection) to images. A 3x3 kernel scans the grid, counting adjacent walls to calculate a "heat" intensity for the center node.

🛠️ Technical Architecture

This visualizer is built on a strict State vs. View separation of concerns:

State Management: A 2D JavaScript array acts as the single Source of Truth. Algorithms perform math and logic strictly against this array.

The View (DOM): The HTML Grid updates dynamically based on the state array.

The Engine: A custom async / await sleep function wraps native JavaScript Promises, allowing while loops to artificially pause without blocking the main browser UI thread.

💻 Tech Stack

HTML5

CSS3 (Grid, Flexbox, CSS Variables, Keyframe Animations)

Vanilla JavaScript (ES6+, Async/Await)

Built as a computer science learning initiative to master algorithms and asynchronous JavaScript.
