import test from 'node:test';
import assert from 'node:assert/strict';
import {Playback} from '../src/playback.js';
function setup(){
  const tasks=new Map(), seen=[], states=[];let serial=0,completed=0;
  const player=new Playback({getDelay:()=>10,onEvent:e=>seen.push(e),onState:s=>states.push(s),onComplete:()=>completed++,setTimer:fn=>{tasks.set(++serial,fn);return serial;},clearTimer:id=>tasks.delete(id)});
  const flush=()=>{const [id,fn]=tasks.entries().next().value;tasks.delete(id);fn();};
  return {player,tasks,seen,states,flush,get completed(){return completed;}};
}
test('reset and immediate restart cannot render an old event',()=>{
  const s=setup();s.player.load(['old1','old2']);s.player.play();const stale=[...s.tasks.values()][0];
  s.player.cancel();s.player.load(['new1','new2']);s.player.play();stale();s.flush();
  assert.deepEqual(s.seen,['old1','new1','new2']);assert.equal(s.completed,1);assert.equal(s.player.state,'finished');
});
test('pause cancels scheduled work; stepping advances exactly one event',()=>{
  const s=setup();s.player.load([1,2,3,4]);s.player.play();const stale=[...s.tasks.values()][0];s.player.pause();stale();
  assert.deepEqual(s.seen,[1]);assert.equal(s.tasks.size,0);s.player.step();assert.deepEqual(s.seen,[1,2]);s.player.play();s.flush();
  assert.deepEqual(s.seen,[1,2,3,4]);assert.equal(s.completed,1);
});
test('clearing paused playback returns to idle and ignores stepping',()=>{
  const s=setup();s.player.load([1,2]);s.player.step();s.player.cancel();s.player.step();s.player.play();
  assert.deepEqual(s.seen,[1]);assert.equal(s.tasks.size,0);assert.equal(s.player.state,'idle');
});
test('step completion fires once and replay begins from the first event',()=>{
  const s=setup();s.player.load([1]);s.player.step();s.player.step();assert.equal(s.completed,1);
  s.player.load([1]);s.player.play();assert.deepEqual(s.seen,[1,1]);assert.equal(s.completed,2);
});
test('default timers retain their global receiver in browser-like environments',()=>{
  const originalSet=globalThis.setTimeout,originalClear=globalThis.clearTimeout;
  try{
    globalThis.setTimeout=function(){assert.equal(this,globalThis);return 7;};
    globalThis.clearTimeout=function(id){assert.equal(this,globalThis);assert.equal(id,7);};
    const player=new Playback({getDelay:()=>1,onEvent:()=>{},onState:()=>{},onComplete:()=>{}});
    player.load([1,2]);player.play();player.cancel();
  }finally{globalThis.setTimeout=originalSet;globalThis.clearTimeout=originalClear;}
});
