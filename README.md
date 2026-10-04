# Algorithm Studio

An interactive learning lab for pathfinding and matrix convolution. Built with HTML, CSS, and vanilla JavaScript; no runtime dependencies or build step.

## Run locally

Requires Node.js 20 or newer.

```sh
npm start
```

Open http://127.0.0.1:3000. JavaScript modules require an HTTP server; opening `index.html` directly from the filesystem is not supported. Any static web server or static hosting service can serve the app.

## Explore

- Choose Dijkstra, A*, BFS, DFS, or matrix convolution.
- Paint walls, mud (entry cost 5), or erase cells. A stroke paints consistently when it crosses the same cell again.
- Drag the start and goal, or select Move start / Move goal and choose a cell.
- Play, pause, resume, or advance one decision with Step. Changing algorithms or clearing cancels the current run immediately.
- Clear path preserves terrain and endpoints. Clear board restores an empty board.
- Adjust speed during playback. Computation time excludes animation time.
- Follow the legend, algorithm explanations, highlighted pseudocode, and result statistics.
- Generate seeded obstacle boards, recursive mazes, or a weighted detour. Guarantee a route connects endpoints by removing the fewest walls needed; uncheck it to allow disconnected boards.
- Save/load one board in browser storage, or export/import a validated JSON board file.

## Keyboard and touch

Tab to the grid, use arrow keys to move focus, and press Space or Enter to apply the selected tool. Select Pan board to scroll on touch screens. Increase Cell size for easier targeting. The layout adapts to smaller screens and the grid scrolls horizontally without making the page overflow. Focus indicators, cell labels, a live status region, and reduced-motion support are included.

## Algorithm behavior

| Algorithm | Frontier | Guarantee | Mud |
| --- | --- | --- | --- |
| Dijkstra | Minimum heap, lowest cost | Minimum terrain cost | Respected |
| A* | Minimum heap, cost + Manhattan estimate | Minimum terrain cost on this four-direction grid | Respected |
| BFS | Queue | Minimum number of steps | Ignored by search |
| DFS | Stack | A valid route if reachable; not necessarily shortest | Ignored by search |

Route steps count moves. Terrain cost adds every entered cell, excluding the start. Explored cells count cells removed from the frontier, including endpoints. BFS and DFS report the actual terrain cost of their selected routes.

## Convolution

Walls provide the default input matrix (1 for walls, 0 otherwise). Use the numeric value brush to replace individual inputs, including negative or fractional numbers. Inputs and output are displayed in separate matrices. Choose wall count, box blur, or edge detection, or edit the nine kernel coefficients. Mathematical convolution flips the kernel in both directions, uses zero padding, and outputs all 21 x 45 cells. Orange represents positive output, blue negative output; intensity is normalized to the maximum absolute output of that run. Hover or focus a processed cell to inspect its value. Clear path clears output while preserving the input. Custom numeric inputs are saved with the board and do not affect pathfinding terrain costs.

## Architecture

- `src/grid.js`: board state, validation, seeds, and scenario generation.
- `src/algorithms.js`: pure search and convolution functions, independent of the DOM.
- `src/playback.js`: playback with generation tokens to invalidate stale callbacks.
- `src/renderer.js`: cached cells, accessible labels, and visualization updates.
- `src/app.js`: interaction, lessons, statistics, persistence, and controls.
- `src/lessons.js`: explanations, guarantees, complexity, and pseudocode.
- `styles.css`: responsive presentation and reduced-motion support.
- `server.js`: local static development server bound to loopback.

The original single-file version is retained in `original-index.html` as a reference.

## Validation

```sh
npm test
```

Tests cover known routes, unreachable goals, weighted detours, valid DFS predecessor chains, board immutability, deterministic reachable scenarios, a Bellman-Ford cost oracle for A*/Dijkstra, heap ordering, convolution padding and asymmetric kernels, imported-board validation, and pause/reset/restart playback races.

An importable weighted example is available in `examples/weighted-detour.json`. Browser checks covered playback completion, pause and step controls, keyboard painting, saved terrain, valid and invalid imports, numeric convolution output, and a phone-width layout. Export was triggered in the browser, but the browser automation did not return its downloaded file path.
