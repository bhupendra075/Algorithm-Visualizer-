// Learning content is independent of interaction and playback.
export const lessons = {
  "dijkstra": {
    "title": "Dijkstra’s algorithm",
    "text": "Always explore the cheapest known route first. Mud costs five units to enter, so a longer route can be cheaper than a direct one.",
    "guarantee": "Guarantees minimum terrain cost",
    "complexity": "Time: O((V + E) log V) · Space: O(V + E)",
    "steps": [
      "Set start cost to zero",
      "Take the lowest-cost frontier cell",
      "Stop if it is the goal",
      "Improve neighbor costs and predecessors",
      "Trace predecessors to show the route"
    ]
  },
  "astar": {
    "title": "A* search",
    "text": "Combine the cost so far with Manhattan distance to the goal. This estimate guides the search while preserving the cheapest route on this four-direction grid.",
    "guarantee": "Guarantees minimum terrain cost",
    "complexity": "Time: O((V + E) log V) · Space: O(V + E)",
    "steps": [
      "Set start cost and estimate",
      "Take the cell with lowest cost + estimate",
      "Stop if it is the goal",
      "Improve neighbor costs and estimates",
      "Trace predecessors to show the route"
    ]
  },
  "bfs": {
    "title": "Breadth-first search",
    "text": "Explore one layer at a time using a queue. Every move counts as one step. Mud has no effect on search order; terrain cost is still reported for the resulting route.",
    "guarantee": "Guarantees minimum steps · ignores weights",
    "complexity": "Time: O(V + E) · Space: O(V)",
    "steps": [
      "Put the start in the queue",
      "Take the oldest frontier cell",
      "Stop if it is the goal",
      "Discover unseen neighbors and enqueue",
      "Trace predecessors to show the route"
    ]
  },
  "dfs": {
    "title": "Depth-first search",
    "text": "Use a stack to dive down one branch before returning to alternatives. Each cell is discovered once. The first route found can be much longer or more expensive.",
    "guarantee": "Finds a route if one exists · no shortest-route guarantee",
    "complexity": "Time: O(V + E) · Space: O(V)",
    "steps": [
      "Put the start on the stack",
      "Take the newest frontier cell",
      "Stop if it is the goal",
      "Discover unseen neighbors and push",
      "Trace predecessors to show the route"
    ]
  },
  "convolution": {
    "title": "Matrix convolution",
    "text": "Start with walls as 1 and other cells as 0, or paint your own numeric inputs. Slide a 3 × 3 kernel over every cell, multiply corresponding values, and add the products. The kernel is flipped in both directions for mathematical convolution.",
    "guarantee": "Same-size output · zero padding",
    "complexity": "Time: O(9V) · Space: O(V)",
    "steps": [
      "Read the input matrix",
      "Center the flipped kernel on a cell",
      "Multiply inputs by kernel values and sum",
      "Store the output value",
      "Move to the next cell"
    ]
  }
};
