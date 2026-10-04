export class Renderer {
  constructor(container,{output=false}={}) {this.container = container; this.elements = []; this.focusId = 0;this.isOutput=output;this.numeric=false;this.kernelIds=[];}
  label(board,id,value) {
    const terrain = this.isOutput ? value === undefined ? 'output pending' : 'output' : this.numeric ? `input ${board.values?.[id] ?? (board.cells[id] === 1 ? 1 : 0)}` : id === board.start ? 'start' : id === board.end ? 'goal' : ['empty','wall','mud, cost 5'][board.cells[id]];
    return `Row ${Math.floor(id / board.cols) + 1}, column ${id % board.cols + 1}, ${terrain}${value === undefined ? '' : `, output ${Number(value.toFixed(4))}`}`;
  }
  mount(board) {
    this.container.replaceChildren(); this.elements = [];
    for (let row = 0; row < board.rows; row++) {
      const rowEl = document.createElement('div'); rowEl.setAttribute('role','row'); rowEl.style.display = 'contents';
      for (let col = 0; col < board.cols; col++) {
        const id = row * board.cols + col, el = document.createElement('div');
        el.className = 'cell'; el.dataset.id = id; el.setAttribute('role','gridcell');
        el.setAttribute('aria-rowindex',row + 1); el.setAttribute('aria-colindex',col + 1);
        el.tabIndex = id === this.focusId ? 0 : -1;
        this.elements.push(el); rowEl.append(el);
      }
      this.container.append(rowEl);
    }
    this.refresh(board);
  }
  refresh(board) {
    for (let id = 0; id < board.cells.length; id++) this.cell(board,id);
  }
  cell(board,id) {
    const el = this.elements[id];
    el.className = 'cell';
    el.textContent = '';
    if (!this.isOutput) {
      if (board.cells[id]) el.classList.add(board.cells[id] === 1 ? 'wall' : 'weight');
      if (!this.numeric && id === board.start) el.classList.add('start');
      if (!this.numeric && id === board.end) el.classList.add('end');
      if (this.numeric) {el.classList.remove('weight');el.classList.add('numeric');el.textContent = board.values?.[id] ?? (board.cells[id] === 1 ? 1 : 0);}
    }
    el.style.backgroundColor = '';el.style.color=''; el.title = ''; el.setAttribute('aria-label',this.label(board,id));
  }
  focus(id,move = true) {
    this.elements[this.focusId].tabIndex = -1; this.focusId = id;
    this.elements[id].tabIndex = 0; if (move) this.elements[id].focus();
  }
  mark(board,id,type) {
    this.elements[id].classList.add(type);
    this.elements[id].setAttribute('aria-label',`${this.label(board,id)}, ${type === 'path' ? 'on the route' : 'explored'}`);
  }
  kernel(ids) {
    for (const id of this.kernelIds) this.elements[id].classList.remove('kernel');
    for (const id of ids) this.elements[id].classList.add('kernel');
    this.kernelIds=ids;
  }
  output(board,id,value,maxMagnitude) {
    const el = this.elements[id];
    if(this.isOutput){el.classList.add('numeric');el.textContent=Number(value.toFixed(2));}
    const intensity = maxMagnitude ? Math.min(1,Math.abs(value) / maxMagnitude) : 0;
    el.style.color=intensity>.55?'#17191a':'#ffffff';
    el.style.backgroundColor = value < 0 ? `rgb(${30 + intensity * 35} ${45 + intensity * 120} ${55 + intensity * 175})` : `rgb(${40 + intensity * 195} ${45 + intensity * 80} ${48 + intensity * 20})`;
    el.title = `Output: ${Number(value.toFixed(4))}`; el.setAttribute('aria-label',this.label(board,id,value));
  }
}
