import {lessons} from './lessons.js';
import {createBoard,generateBoard,validateBoard,serializeBoard,COLS} from './grid.js';
import {search,convolve} from './algorithms.js';
import {Playback} from './playback.js';
import {Renderer} from './renderer.js';

const $ = id => document.getElementById(id);
let board = createBoard(), result = null, explored = 0, stroke = null, outputValues = new Map();
const renderer = new Renderer($('grid'));
renderer.mount(board);
const outputRenderer = new Renderer($('output-grid'),{output:true});
outputRenderer.mount(board);
const playback = new Playback({getDelay:() => Math.round(151 - Number($('speed').value) * 1.5),onState:updateControls,onEvent:renderEvent,onComplete:complete});
function message(text) {$('status').textContent = text;}
function updateControls(state) {
  $('state').textContent = {idle:'Ready',running:'Running',paused:'Paused',finished:'Finished'}[state];
  $('play').disabled = state === 'running'; $('play').textContent = state === 'paused' ? '▶ Resume' : state === 'finished' ? '▶ Replay' : '▶ Play';
  $('pause').disabled = state !== 'running'; $('step').disabled = state === 'running';
  const locked = state === 'running' || state === 'paused';
  $('grid').style.touchAction = locked || $('tool').value === 'pan' ? 'pan-x pan-y' : 'none';
  for (const id of ['tool','scenario','seed','solvable','generate','load','import','kernel-preset','input-value','paint-value']) $(id).disabled = locked;
  for (const el of $('kernel-inputs').children) el.disabled = locked;
  $('grid').setAttribute('aria-readonly',String(locked));
}
function clearResults(text = 'Draw walls or mud, then press Play.') {
  playback.cancel(); result = null; explored = 0; outputValues.clear(); renderer.refresh(board); outputRenderer.refresh(board);
  $('visited-count').textContent = '0';
  for (const id of ['path-length','path-cost','compute-time']) $(id).textContent = '—';
  $('step-detail').textContent = 'The current decision will appear here.';
  for (const li of $('pseudocode').children) li.classList.remove('active'); message(text);
}
function updateLesson() {
  clearResults(); const data = lessons[$('algorithm').value];
  $('lesson-title').textContent = data.title; $('explanation').textContent = data.text;
  $('guarantee').textContent = data.guarantee; $('complexity').textContent = data.complexity;
  $('pseudocode').replaceChildren(...data.steps.map(text => {const li = document.createElement('li'); li.textContent = text; return li;}));
  const convolution = $('algorithm').value === 'convolution';
  $('search-legend').hidden=convolution;$('matrix-legend').hidden=!convolution;
  const statLabels=document.querySelectorAll('.stats small');
  statLabels[0].textContent=convolution?'Processed cells':'Explored cells';
  statLabels[1].textContent=convolution?'Minimum output':'Route steps';
  statLabels[2].textContent=convolution?'Maximum output':'Terrain cost';
  $('convolution-settings').hidden = !convolution; $('output-panel').hidden = !convolution; $('board-title').textContent = convolution ? 'Input matrix' : 'Your search space';
  $('tool').querySelector('option[value="value"]').hidden = !convolution;
  for(const value of ['weight','start','end']) $('tool').querySelector(`option[value="${value}"]`).hidden = convolution;
  if(convolution && ['weight','start','end'].includes($('tool').value) || !convolution && $('tool').value === 'value') $('tool').value = 'wall';
  renderer.numeric = convolution; renderer.refresh(board);
  $('grid').setAttribute('aria-label',convolution ? 'Input matrix. Arrow keys move; Space paints with selected tool.' : 'Editable algorithm board. Arrow keys move; Space paints with selected tool.');
}
function prepare() {
  clearResults(); const began = performance.now();
  if ($('algorithm').value === 'convolution') {
    const kernel = [...$('kernel-inputs').children].map(el => Number(el.value));
    if ([...$('kernel-inputs').children].some(el => el.value.trim() === '' || !el.checkValidity()) || !kernel.every(Number.isFinite)) {
      message('Enter a finite number in every kernel cell.'); return false;
    }
    // Flipping distinguishes convolution from correlation for asymmetric kernels.
    result = convolve(board,kernel);
  } else result = search(board,$('algorithm').value);
  $('compute-time').textContent = `${(performance.now() - began).toFixed(2)} ms`;
  playback.load(result.events); message('Simulation prepared. Follow the highlighted decision.'); return true;
}
function renderEvent(event) {
  [...$('pseudocode').children].forEach((li,i) => li.classList.toggle('active',i === event.line));
  const coordinate = `(${Math.floor(event.id / COLS) + 1}, ${event.id % COLS + 1})`;
  if(event.type==='initialize') {$('step-detail').textContent=`Initialize the frontier at start ${coordinate}.`;}
  else if(event.type==='goal') {$('step-detail').textContent=`Goal reached at ${coordinate}. Trace the predecessor chain next.`;}
  else if (event.type === 'visit') {
    renderer.mark(board,event.id,'visited'); $('visited-count').textContent = ++explored;
    $('step-detail').textContent = `Explore ${coordinate}. ${['bfs','dfs'].includes($('algorithm').value) ? 'Steps' : 'Cost'} so far: ${event.score}. Frontier: ${event.frontier} cells.`;
  } else if (event.type === 'discover') {
    $('step-detail').textContent = `Discover ${coordinate}; best known ${['bfs','dfs'].includes($('algorithm').value) ? 'steps' : 'cost'}: ${event.score}.`;
  } else if (event.type === 'path') {
    renderer.mark(board,event.id,'path'); $('step-detail').textContent = `Trace the route through ${coordinate}.`;
  } else {
    renderer.kernel(event.footprint); outputValues.set(event.id,event.value);
    outputRenderer.output(board,event.id,event.value,Math.max(Math.abs(result.min),Math.abs(result.max)));
    $('visited-count').textContent = ++explored;
    $('step-detail').textContent = `Output ${coordinate}: ${event.products.map(n => Number(n.toFixed(3))).join(' + ')} = ${Number(event.value.toFixed(4))}`;
  }
}
function complete() {
  renderer.kernel([]);
  if ($('algorithm').value === 'convolution') {
    $('path-length').textContent=Number(result.min.toFixed(4));$('path-cost').textContent=Number(result.max.toFixed(4));
    message(`Convolution complete. ${result.visited} output cells; range ${Number(result.min.toFixed(4))} to ${Number(result.max.toFixed(4))}.`);
  }
  else {
    $('path-length').textContent = result.pathLength ?? '—'; $('path-cost').textContent = result.pathCost ?? '—';
    message(result.found ? `Route found: ${result.pathLength} steps, terrain cost ${result.pathCost}. ${$('algorithm').value === 'dfs' ? 'DFS does not guarantee the shortest route.' : $('algorithm').value === 'bfs' ? 'BFS minimizes steps and ignores mud costs.' : 'This route has minimum terrain cost.'}` : 'No path found. Remove a wall or move an endpoint and try again.');
  }
}
$('play').addEventListener('click',() => {if (['idle','finished'].includes(playback.state) && !prepare()) return; playback.play();});
$('pause').addEventListener('click',() => {playback.pause(); message('Paused. Press Step for one decision, or Resume to continue.');});
$('step').addEventListener('click',() => {if (['idle','finished'].includes(playback.state) && !prepare()) return; playback.step();});
$('clear-path').addEventListener('click',() => clearResults('Path cleared. Your walls, mud, and endpoints are preserved.'));
$('clear-board').addEventListener('click',() => {board = createBoard(); clearResults('Board cleared. Ready for a new experiment.');});
$('algorithm').addEventListener('change',updateLesson);
$('speed').addEventListener('input',() => {$('speed-value').value = $('speed').value;});

function editable() {return !['running','paused'].includes(playback.state);}
function paint(id,tool) {
  if (!editable() || tool === 'pan') return;
  const previousEndpoint = tool === 'start' || tool === 'end' ? board[tool] : null;
  if (tool === 'value') {
    if ($('algorithm').value !== 'convolution' || !$('input-value').checkValidity() || $('input-value').value.trim() === '') {message('Enter a numeric input between −1,000,000 and 1,000,000.');return;}
    const value = Number($('input-value').value);
    if(board.values[id] === value) return;
    board.values[id] = value;
  } else
  if (tool === 'start' || tool === 'end') {
    if (id === board[tool === 'start' ? 'end' : 'start']) return;
    if (id === board[tool]) return;
    board[tool] = id; board.cells[id] = 0;
  } else {
    if ((id === board.start || id === board.end) && $('algorithm').value !== 'convolution') return;
    const value = {wall:1,weight:2,erase:0}[tool];
    if (board.cells[id] === value && board.values[id] === null) return;
    // Endpoints stay traversable even when a convolution value is painted there.
    if (id === board.start || id === board.end) board.values[id] = value === 1 ? 1 : 0;
    else {board.cells[id] = value; board.values[id] = null;}
  }
  if (result) clearResults('Board changed. Press Play to run the new scenario.');
  else {renderer.cell(board,id);if(previousEndpoint !== null)renderer.cell(board,previousEndpoint);}
}
function cellAt(x,y) {return document.elementFromPoint(x,y)?.closest('#grid .cell');}
function paintLine(from,to,tool) {
  let x = from % board.cols, y = Math.floor(from / board.cols);
  const x2 = to % board.cols, y2 = Math.floor(to / board.cols), dx = Math.abs(x2 - x), dy = -Math.abs(y2 - y);
  const sx = x < x2 ? 1 : -1, sy = y < y2 ? 1 : -1; let err = dx + dy;
  while (true) {
    paint(y * board.cols + x,tool); if (x === x2 && y === y2) break;
    const e = 2 * err; if (e >= dy) {err += dy; x += sx;} if (e <= dx) {err += dx; y += sy;}
  }
}
$('grid').addEventListener('pointerdown',e => {
  const cell = e.target.closest('.cell'); if (!cell || !editable() || e.button !== 0 || $('tool').value === 'pan') return;
  e.preventDefault(); const id = Number(cell.dataset.id);
  const searchMode = $('algorithm').value !== 'convolution';
  stroke = {pointer:e.pointerId,last:id,tool:searchMode && id === board.start ? 'start' : searchMode && id === board.end ? 'end' : $('tool').value};
  $('grid').setPointerCapture(e.pointerId); renderer.focus(id); paint(id,stroke.tool);
});
$('grid').addEventListener('pointermove',e => {
  if (!stroke || stroke.pointer !== e.pointerId) return;
  const cell = cellAt(e.clientX,e.clientY); if (!cell) return;
  const id = Number(cell.dataset.id); paintLine(stroke.last,id,stroke.tool); stroke.last = id;
});
for (const type of ['pointerup','pointercancel','lostpointercapture']) $('grid').addEventListener(type,() => {stroke = null;});
$('grid').addEventListener('keydown',e => {
  const cell = e.target.closest('.cell'); if (!cell) return;
  const id = Number(cell.dataset.id), row = Math.floor(id / board.cols), col = id % board.cols;
  const moves = {ArrowUp:row > 0 ? id - board.cols : id,ArrowDown:row + 1 < board.rows ? id + board.cols : id,ArrowLeft:col > 0 ? id - 1 : id,ArrowRight:col + 1 < board.cols ? id + 1 : id};
  if (e.key in moves) {e.preventDefault(); renderer.focus(moves[e.key]);}
  else if (e.key === ' ' || e.key === 'Enter') {e.preventDefault(); paint(id,$('tool').value);}
});
function inspect(e) {
  const cell = e.target.closest('.cell'); if (!cell || $('algorithm').value !== 'convolution' || playback.state === 'running') return;
  const id = Number(cell.dataset.id); if (outputValues.has(id)) $('step-detail').textContent = outputRenderer.label(board,id,outputValues.get(id));
}
$('grid').addEventListener('pointerover',inspect); $('grid').addEventListener('focusin',inspect);
$('grid').addEventListener('focusin',e=>{const cell=e.target.closest('.cell');if(cell)renderer.focus(Number(cell.dataset.id),false);});
$('output-grid').addEventListener('focusin',e=>{const cell=e.target.closest('.cell');if(cell)outputRenderer.focus(Number(cell.dataset.id),false);});
$('output-grid').addEventListener('pointerover',inspect); $('output-grid').addEventListener('focusin',inspect);
$('output-grid').addEventListener('keydown',e => {
  const cell=e.target.closest('.cell');if(!cell)return;
  const id=Number(cell.dataset.id),r=Math.floor(id/board.cols),c=id%board.cols;
  const moves={ArrowUp:r>0?id-board.cols:id,ArrowDown:r+1<board.rows?id+board.cols:id,ArrowLeft:c>0?id-1:id,ArrowRight:c+1<board.cols?id+1:id};
  if(e.key in moves){e.preventDefault();outputRenderer.focus(moves[e.key]);}
});
$('paint-value').addEventListener('click',() => {$('tool').value = 'value';$('grid').style.touchAction='none';message('Value brush selected. Paint numeric inputs on the input matrix.');});
$('tool').addEventListener('change',() => {$('grid').style.touchAction = $('tool').value === 'pan' ? 'pan-x pan-y' : 'none';});
$('cell-size').addEventListener('change',() => {
  const size = Number($('cell-size').value);
  for(const id of ['grid','output-grid']) {
    $(id).style.gridTemplateColumns = `repeat(${board.cols}, minmax(${size}px, 1fr))`;
    $(id).style.minWidth = `${board.cols * (size + 1) - 1}px`;
  }
});
$('generate').addEventListener('click',() => {board = generateBoard($('scenario').value,$('seed').value,$('solvable').checked,board); clearResults(`Generated ${$('scenario').selectedOptions[0].text.toLowerCase()} with seed “${$('seed').value}”.`);});
$('save').addEventListener('click',() => {try {localStorage.setItem('algorithm-studio-board',serializeBoard(board)); message('Board saved in this browser.');} catch {message('Browser storage is unavailable. Use Export to save your board.');}});
$('load').addEventListener('click',() => {try {const saved = localStorage.getItem('algorithm-studio-board'); if (!saved) {message('No saved board yet.');return;} board = validateBoard(JSON.parse(saved)); clearResults('Saved board loaded.');} catch {message('Could not load the saved board. Exported boards can be imported instead.');}});
$('export').addEventListener('click',() => {const url = URL.createObjectURL(new Blob([serializeBoard(board)],{type:'application/json'})); const a = document.createElement('a'); a.href = url; a.download = 'algorithm-board.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000); message('Board exported.');});
$('import').addEventListener('click',() => {$('import-file').value = ''; $('import-file').click();});
$('import-file').addEventListener('change',async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    if (file.size > 100000) throw new Error('Board file is too large.');
    const incoming = validateBoard(JSON.parse(await file.text()));
    if (!editable()) {message('Clear the active run before importing a board.');return;}
    board = incoming; clearResults('Board imported.');
  } catch (error) {message(error instanceof SyntaxError ? 'The file is not valid JSON.' : error.message);}
});
function kernelPreset() {
  const presets = {count:Array(9).fill(1),blur:Array(9).fill(1 / 9),edge:[0,-1,0,-1,4,-1,0,-1,0]};
  $('kernel-inputs').replaceChildren(...presets[$('kernel-preset').value].map((value,i) => {
    const input = document.createElement('input'); input.type = 'number'; input.step = 'any'; input.required = true; input.min=-1000000;input.max=1000000; input.value = value;
    input.setAttribute('aria-label',`Kernel row ${Math.floor(i / 3) + 1}, column ${i % 3 + 1}`);
    input.addEventListener('change',() => clearResults('Kernel changed. Press Play to calculate the new output.')); return input;
  }));
}
$('kernel-preset').addEventListener('change',() => {kernelPreset(); clearResults('Kernel preset changed.');});
kernelPreset(); updateLesson();
