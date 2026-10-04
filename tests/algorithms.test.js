import test from 'node:test';
import assert from 'node:assert/strict';
import {createBoard,generateBoard,neighbors,validateBoard,serializeBoard,cost} from '../src/grid.js';
import {search,convolve,MinHeap} from '../src/algorithms.js';

function board(rows,cols,start,end,cells=Array(rows*cols).fill(0)) {return {rows,cols,start,end,cells};}
function checkRoute(b,result) {
  assert.equal(result.path[0],b.start); assert.equal(result.path.at(-1),b.end);
  assert.equal(new Set(result.path).size,result.path.length);
  for(let i=1;i<result.path.length;i++) {
    assert.ok(neighbors(b,result.path[i-1]).includes(result.path[i]));
    assert.notEqual(b.cells[result.path[i]],1);
  }
  assert.equal(result.pathCost,result.path.slice(1).reduce((n,id)=>n+cost(b,id),0));
}
test('empty grid has the expected minimum route',()=>{
  const b=board(3,5,0,14);
  for(const algo of ['bfs','dijkstra','astar']) {const result=search(b,algo);assert.equal(result.pathLength,6);assert.equal(result.pathCost,6);checkRoute(b,result);}
});
test('blocked destination reports no route',()=>{
  const b=board(3,3,0,8,[0,0,0,0,0,1,0,1,0]);
  for(const algo of ['bfs','dfs','dijkstra','astar']) {const result=search(b,algo);assert.equal(result.found,false);assert.deepEqual(result.path,[]);assert.equal(result.pathCost,null);}
});
test('weighted algorithms prefer inexpensive detours while BFS minimizes steps',()=>{
  const b=board(3,5,5,9,[0,0,0,0,0,0,2,2,2,0,0,0,0,0,0]);
  assert.equal(search(b,'bfs').pathLength,4);assert.equal(search(b,'bfs').pathCost,16);
  for(const algo of ['dijkstra','astar']) {const result=search(b,algo);assert.equal(result.pathCost,6);assert.equal(result.pathLength,6);checkRoute(b,result);}
});
test('adjacent endpoints and DFS routes retain valid predecessor chains',()=>{
  const b=board(4,4,5,6);
  for(const algo of ['bfs','dfs','dijkstra','astar']) checkRoute(b,search(b,algo));
  assert.equal(search(b,'dijkstra').pathLength,1);
});
test('search never mutates the board',()=>{
  const b=generateBoard('obstacles','immutable');const before=serializeBoard(b);
  for(const algo of ['bfs','dfs','dijkstra','astar']) search(b,algo);
  assert.equal(serializeBoard(b),before);
});
test('seeded scenarios are repeatable and guaranteed routes are reachable',()=>{
  for(const kind of ['maze','obstacles','weighted']) for(const seed of ['a','b','c']) {
    const b=generateBoard(kind,seed,true);
    assert.deepEqual(b,generateBoard(kind,seed,true));assert.ok(search(b,'bfs').found);
  }
  assert.notDeepEqual(generateBoard('maze','a'),generateBoard('maze','b'));
});
test('A* and Dijkstra match an independent Bellman-Ford cost oracle',()=>{
  for(let seed=0;seed<30;seed++) {
    const b=generateBoard('obstacles',seed,false,board(5,7,0,34));
    for(let id=0;id<b.cells.length;id++) if(b.cells[id]===0 && id!==b.start && id!==b.end && (id+seed)%3===0) b.cells[id]=2;
    const dist=Array(b.cells.length).fill(Infinity);dist[b.start]=0;
    for(let pass=0;pass<b.cells.length-1;pass++) for(let id=0;id<b.cells.length;id++) if(b.cells[id]!==1)
      for(const next of neighbors(b,id)) if(b.cells[next]!==1) dist[next]=Math.min(dist[next],dist[id]+cost(b,next));
    for(const algo of ['astar','dijkstra']) {const result=search(b,algo);assert.equal(result.pathCost,Number.isFinite(dist[b.end])?dist[b.end]:null);if(result.found)checkRoute(b,result);}
  }
});
test('heap orders correctly and keeps equal priorities stable',()=>{
  const heap=new MinHeap();for(let i=100;i>=0;i--)heap.push(i,i%9,i);
  let last=-1;const seen=new Set();while(heap.size){const item=heap.pop();assert.ok(item.priority>=last);last=item.priority;seen.add(item.id);}assert.equal(seen.size,101);
  heap.push('first',1,0);heap.push('second',1,0);assert.equal(heap.pop().id,'first');assert.equal(heap.pop().id,'second');assert.equal(heap.pop(),undefined);
});
test('convolution uses zero padding and flips asymmetric kernels',()=>{
  const b=board(3,3,0,8,[0,0,0,0,1,0,0,0,0]);
  assert.deepEqual(convolve(b,Array(9).fill(1)).values,Array(9).fill(1));
  assert.deepEqual(convolve(b,[1,2,3,4,5,6,7,8,9]).values,[1,2,3,4,5,6,7,8,9]);
  assert.deepEqual(convolve(board(1,1,0,0,[1]),Array(9).fill(1)).values,[1]);
  assert.throws(()=>convolve(b,[1]),/nine/);
});
test('convolution supports numeric input independent of terrain',()=>{
  const b=board(1,3,0,2);b.values=[-2,3,.5];
  assert.deepEqual(convolve(b,[0,0,0,0,1,0,0,0,0]).values,[-2,3,.5]);
  assert.deepEqual(convolve(b,Array(9).fill(1)).values,[1,1.5,3.5]);
});
test('saved boards round-trip and reject malformed input',()=>{
  const b=createBoard();assert.deepEqual(validateBoard(JSON.parse(serializeBoard(b))),b);
  for(const override of [{version:2},{cells:[]},{start:-1},{end:b.start},{cells:Array(945).fill(3)},{values:[1]},{values:Array(945).fill('bad')},{values:Array(945).fill(1000001)}])
    assert.throws(()=>validateBoard({...JSON.parse(serializeBoard(b)),...override}),/valid/);
});
