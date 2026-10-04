// One timer and generation counter: cancellation invalidates every old callback.
export class Playback {
  constructor({onEvent,onState,onComplete,getDelay,setTimer=(fn,ms) => globalThis.setTimeout(fn,ms),clearTimer=id => globalThis.clearTimeout(id)}) {
    Object.assign(this,{onEvent,onState,onComplete,getDelay,setTimer,clearTimer});
    this.state = 'idle'; this.generation = 0; this.timer = null; this.events = []; this.index = 0;
  }
  setState(state) {this.state = state; this.onState(state);}
  cancel() {
    this.generation++;
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = null; this.events = []; this.index = 0; this.setState('idle');
  }
  load(events) {this.cancel(); this.events = events; this.setState('paused');}
  pause() {
    if (this.state !== 'running') return;
    this.generation++;
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = null; this.setState('paused');
  }
  advance() {
    if (this.index >= this.events.length) {this.finish(); return;}
    this.onEvent(this.events[this.index++]);
    if (this.index === this.events.length) this.finish();
  }
  finish() {this.timer = null; this.setState('finished'); this.onComplete();}
  step() {if (this.state === 'paused') this.advance();}
  play() {
    if (this.state !== 'paused') return;
    this.setState('running'); const token = ++this.generation;
    const tick = () => {
      if (token !== this.generation || this.state !== 'running') return;
      this.timer = null; this.advance();
      if (token === this.generation && this.state === 'running') this.timer = this.setTimer(tick,this.getDelay());
    };
    tick();
  }
}
