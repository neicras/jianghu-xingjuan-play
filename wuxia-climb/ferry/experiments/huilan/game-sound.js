// Short original synthesized cues. All voices are generated locally at the moment of play.
const preference='jianghu.sound.enabled';
let muted=false,ctx,master,noise;
try{muted=localStorage.getItem(preference)==='off'}catch{}
const score=new Audio();
score.preload='none';score.volume=.34;
let theme='',unlocked=false;
function playScore(){
 if(theme&&unlocked&&!muted&&!document.hidden&&score.paused&&!score.ended)score.play().catch(()=>{});
}
export function scoreScene(phase){
 const next=phase==='won'?'victory':phase==='fight'?'duel':phase==='lost'?'':'road';
 if(theme===next)return;
 theme=next;score.pause();
 if(theme){
  score.src=new URL('../forward-road/media/'+theme+'.mp3',import.meta.url).href;
  score.loop=theme!=='victory';playScore();
 }
}
function wake(){
 if(muted)return;
 try{
  if(!ctx){
   ctx=new AudioContext();master=ctx.createGain();master.gain.value=.36;master.connect(ctx.destination);
   noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.4),ctx.sampleRate);
   const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  }
  if(ctx.state==='suspended')ctx.resume().catch(()=>{});
 }catch{}
}
function note(f,end,len,volume,delay=0,wave='sine'){
 const t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();
 o.type=wave;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(end,t+len);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+len);
 o.connect(g).connect(master);o.start(t);o.stop(t+len+.01);
}
function brush(f,end,len,volume){
 const t=ctx.currentTime,b=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();
 b.buffer=noise;filter.type='bandpass';filter.Q.value=1.1;filter.frequency.setValueAtTime(f,t);filter.frequency.exponentialRampToValueAtTime(end,t+len);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+len);
 b.connect(filter).connect(g).connect(master);b.start(t);b.stop(t+len+.01);
}
export function cue(id){
 wake();if(muted||!master||ctx.state==='closed')return;
 switch(id){
 case 'paper':brush(2300,650,.14,.36);break;
 case 'hit':brush(1300,220,.11,.4);note(164,58,.15,.53);break;
 case 'guard':note(1046,730,.24,.29);note(1590,1460,.12,.14,.012);break;
 case 'breath':brush(420,1400,.22,.24);note(294,330,.19,.15);break;
 case 'end':note(232,120,.15,.24);note(182,100,.17,.22,.11);break;
 case 'coin':note(1047,1036,.13,.2);note(1397,1380,.22,.17,.075);break;
 case 'win':for(const [i,f] of [392,494,587].entries())note(f,f,.28,.23,i*.105);break;
 }
}
export function soundButton(){
 return '<button type="button" class="trail-tool sound-switch" aria-label="音樂與音效" aria-pressed="'+!muted+'" title="音樂與音效" data-audio><span aria-hidden="true">'+(muted?'♫̸':'♫')+'</span></button>';
}
export function installSound(){
 const unlock=()=>{unlocked=true;wake();playScore()};
 document.addEventListener('pointerdown',unlock,{passive:true});
 document.addEventListener('keydown',unlock);
 document.addEventListener('click',unlock);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)score.pause();else playScore()});
 window.addEventListener('pagehide',()=>score.pause());
 if(location.protocol==='jianghu:'){unlocked=true;playScore()}
 document.addEventListener('click',e=>{
  const button=e.target.closest('[data-audio]');if(!button)return;
  muted=!muted;try{localStorage.setItem(preference,muted?'off':'on')}catch{}
  if(master)master.gain.value=muted?0:.36;
  button.setAttribute('aria-pressed',String(!muted));button.firstElementChild.textContent=muted?'♫̸':'♫';
  if(muted)score.pause();else{cue('coin');playScore()}
 });
}
