import {neighbors, cost} from './grid.js';

export class MinHeap {
  items = [];
  sequence = 0;
  get size() {return this.items.length;}
  less(a,b) {return a.priority < b.priority || a.priority === b.priority && a.order < b.order;}
  push(id, priority, distance) {
    const item = {id, priority, distance, order: this.sequence++};
    this.items.push(item);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.less(item,this.items[parent])) break;
      this.items[i] = this.items[parent]; i = parent;
    }
    this.items[i] = item;
  }
  pop() {
    if (!this.size) return undefined;
    const first = this.items[0], last = this.items.pop();
    if (this.size) {
      let i = 0;
      while (2 * i + 1 < this.size) {
        let child = 2 * i + 1;
        if (child + 1 < this.size && this.less(this.items[child + 1],this.items[child])) child++;
        if (!this.less(this.items[child],last)) break;
        this.items[i] = this.items[child]; i = child;
      }
      this.items[i] = last;
    }
    return first;
  }
}
export function search(board, algorithm) {
  if (!['bfs','dfs','dijkstra','astar'].includes(algorithm)) throw new Error('Unknown search algorithm');
  const n = board.cells.length, prev = Array(n).fill(-1), distances = Array(n).fill(Infinity);
  const seen = new Set(), events = [{type:'initialize',id:board.start,line:0}], frontier = [board.start], heap = new MinHeap();
  let head = 0, found = false;
  const weighted = algorithm === 'dijkstra' || algorithm === 'astar';
  const heuristic = id => algorithm === 'astar' ? Math.abs(Math.floor(id / board.cols) - Math.floor(board.end / board.cols)) + Math.abs(id % board.cols - board.end % board.cols) : 0;
  distances[board.start] = 0;
  if (weighted) heap.push(board.start,heuristic(board.start),0); else seen.add(board.start);
  while (weighted ? heap.size : algorithm === 'bfs' ? head < frontier.length : frontier.length) {
    let id;
    if (weighted) {
      const item = heap.pop(); id = item.id;
      if (seen.has(id) || item.distance !== distances[id]) continue;
      seen.add(id);
    } else id = algorithm === 'bfs' ? frontier[head++] : frontier.pop();
    events.push({type:'visit',id,line:1,score:distances[id],frontier:weighted ? heap.size : algorithm === 'bfs' ? frontier.length - head : frontier.length});
    if (id === board.end) {events.push({type:'goal',id,line:2});found = true; break;}
    for (const next of neighbors(board,id)) {
      if (board.cells[next] === 1 || seen.has(next)) continue;
      const tentative = distances[id] + (weighted ? cost(board,next) : 1);
      if (tentative < distances[next]) {
        distances[next] = tentative; prev[next] = id;
        if (weighted) heap.push(next,tentative + heuristic(next),tentative);
        else {seen.add(next); frontier.push(next);}
        events.push({type:'discover',id:next,from:id,line:3,score:tentative});
      }
    }
  }
  const path = [];
  if (found) {
    for (let id = board.end; id !== -1; id = prev[id]) path.push(id);
    path.reverse();
    for (const id of path) events.push({type:'path',id,line:4});
  }
  return {events,found,path,visited:events.filter(e => e.type === 'visit').length,
    pathLength:found ? path.length - 1 : null,
    pathCost:found ? path.slice(1).reduce((sum,id) => sum + cost(board,id),0) : null};
}
export function convolve(board,kernel) {
  if (kernel.length !== 9 || !kernel.every(Number.isFinite)) throw new Error('Kernel needs nine finite numbers');
  const values = [], events = [];
  for (let row = 0; row < board.rows; row++) for (let col = 0; col < board.cols; col++) {
    const id = row * board.cols + col, footprint = [], products = [];
    let value = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const r = row + dr, c = col + dc, k = (dr + 1) * 3 + dc + 1;
      const inside = r >= 0 && c >= 0 && r < board.rows && c < board.cols;
      const input = inside ? (board.values?.[r * board.cols + c] ?? (board.cells[r * board.cols + c] === 1 ? 1 : 0)) : 0;
      if (inside) footprint.push(r * board.cols + c);
      products.push(input * kernel[8 - k]); value += input * kernel[8 - k];
    }
    values.push(value); events.push({type:'kernel',id,footprint,value,products,line:2});
  }
  return {events,values,visited:values.length,min:Math.min(...values),max:Math.max(...values)};
}
