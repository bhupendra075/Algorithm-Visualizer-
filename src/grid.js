export const ROWS = 21, COLS = 45, WEIGHT_COST = 5;
export function createBoard(rows = ROWS, cols = COLS) {
  return {rows, cols, start: Math.floor(rows / 2) * cols + Math.floor(cols / 5),
    end: Math.floor(rows / 2) * cols + Math.floor(cols * 4 / 5), cells: Array(rows * cols).fill(0), values:Array(rows * cols).fill(null)};
}
export function neighbors(board, id) {
  const r = Math.floor(id / board.cols), c = id % board.cols, result = [];
  if (r > 0) result.push(id - board.cols);
  if (r + 1 < board.rows) result.push(id + board.cols);
  if (c > 0) result.push(id - 1);
  if (c + 1 < board.cols) result.push(id + 1);
  return result;
}
export const cost = (board, id) => board.cells[id] === 2 ? WEIGHT_COST : 1;
export function validateBoard(value) {
  if (!value || value.version !== 1 || value.rows !== ROWS || value.cols !== COLS ||
      !Array.isArray(value.cells) || value.cells.length !== ROWS * COLS ||
      !value.cells.every(x => Number.isInteger(x) && x >= 0 && x <= 2) ||
      !Number.isInteger(value.start) || !Number.isInteger(value.end) ||
      value.start < 0 || value.end < 0 || value.start >= value.cells.length ||
      value.end >= value.cells.length || value.start === value.end ||
      value.cells[value.start] !== 0 || value.cells[value.end] !== 0 ||
      (value.values !== undefined && (!Array.isArray(value.values) || value.values.length !== ROWS * COLS ||
        !value.values.every(x => x === null || typeof x === 'number' && Number.isFinite(x) && Math.abs(x) <= 1000000)))) {
    throw new Error('This is not a valid 21 × 45 Algorithm Studio board.');
  }
  return {rows: ROWS, cols: COLS, start: value.start, end: value.end, cells: [...value.cells],values:value.values ? [...value.values] : Array(ROWS * COLS).fill(null)};
}
export const serializeBoard = board => JSON.stringify({version: 1, ...board});

export function seededRandom(seed) {
  let state = 2166136261;
  for (const ch of String(seed)) state = Math.imul(state ^ ch.charCodeAt(0), 16777619);
  return () => {
    state += 0x6D2B79F5;
    let n = Math.imul(state ^ state >>> 15, state | 1);
    n ^= n + Math.imul(n ^ n >>> 7, n | 61);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
export function generateBoard(kind, seed, solvable = true, source = createBoard()) {
  const board = {...source, cells: Array(source.rows * source.cols).fill(0),values:Array(source.rows * source.cols).fill(null)};
  const random = seededRandom(seed);
  if (kind === 'maze') {
    board.cells.fill(1);
    const first = board.cols + 1, stack = [first], seen = new Set([first]);
    board.cells[first] = 0;
    while (stack.length) {
      const id = stack.at(-1), row = Math.floor(id / board.cols), col = id % board.cols;
      const options = [[row - 2, col], [row + 2, col], [row, col - 2], [row, col + 2]]
        .filter(([r,c]) => r > 0 && c > 0 && r < board.rows - 1 && c < board.cols - 1)
        .map(([r,c]) => r * board.cols + c).filter(next => !seen.has(next));
      if (!options.length) {stack.pop(); continue;}
      const next = options[Math.floor(random() * options.length)];
      board.cells[next] = board.cells[(id + next) / 2] = 0;
      seen.add(next); stack.push(next);
    }
  } else if (kind === 'weighted') {
    // A direct muddy route competes with a longer, inexpensive route.
    const sr = Math.floor(board.start / board.cols), sc = board.start % board.cols;
    const er = Math.floor(board.end / board.cols), ec = board.end % board.cols;
    for (let c = Math.min(sc,ec); c <= Math.max(sc,ec); c++) board.cells[sr * board.cols + c] = 2;
    for (let r = Math.min(sr,er); r <= Math.max(sr,er); r++) board.cells[r * board.cols + ec] = 2;
  } else {
    board.cells = board.cells.map(() => random() < .25 ? 1 : 0);
  }
  board.cells[board.start] = board.cells[board.end] = 0;
  if (solvable && kind !== 'weighted') {
    // Find a connection which removes the fewest walls, preserving the maze.
    const dist = Array(board.cells.length).fill(Infinity), prev = Array(board.cells.length).fill(-1);
    const deque = [board.start]; dist[board.start] = 0;
    while (deque.length) {
      const id = deque.shift();
      for (const next of neighbors(board,id)) {
        const wall = board.cells[next] === 1 ? 1 : 0;
        if (dist[id] + wall < dist[next]) {
          dist[next] = dist[id] + wall; prev[next] = id;
          if (wall) deque.push(next); else deque.unshift(next);
        }
      }
    }
    for (let id = board.end; id !== -1; id = prev[id]) board.cells[id] = 0;
  }
  return board;
}
