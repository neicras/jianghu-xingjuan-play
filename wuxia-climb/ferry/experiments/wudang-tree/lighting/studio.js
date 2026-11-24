import {drawScene,loadScene,DURATION} from '../../../altar-duel/scene.js?lighting=1';
import {supportArt} from '../art-library/support-files.js';
import {lightingFor} from './light.js';

const get=id=>document.getElementById(id);
async function start(){
 const root=new URL('../art-library/',import.meta.url);
 const release=await (await fetch(new URL('release.json',root))).json();
 const actors=Object.fromEntries(await Promise.all(['traveller','assassin'].map(async id=>{
  const {revision}=release.characters.find(a=>a.id===id);
  const folder=new URL('elements/characters/'+id+'/'+revision+'/',root);
  const spec=await (await fetch(new URL('actor.json',folder))).json();
  return [id,{...spec,file:new URL(spec.file,folder).href}];
 })));
 const res=await loadScene(undefined,actors,{court:supportArt('court'),lanterns:supportArt('lanterns')});
 const lamp=await lightingFor(res);
 const stage=get('stage'),ctx=stage.getContext('2d');
 const base=document.createElement('canvas');base.width=stage.width;base.height=stage.height;
 const original=base.getContext('2d'),withLight={...res,lighting:lamp};
 let mode='lantern',t=3.50,playing=!matchMedia('(prefers-reduced-motion:reduce)').matches,raf=0,last;
 const names={original:'原畫',lantern:'提燈',moon:'月照'};
 const tips={original:'兩幅近鏡都係原畫。選「提燈」或「月照」比較同一招。',lantern:'左右移燈，留意衣袖受光嘅一側、劍鋒嘅亮點，同埋腳下投影。',moon:'冷光落喺斗篷嘅摺位。按「定格看劍」，再左右移動月光。'};
 function crop(id,src,center){
  const c=get(id),target=c.getContext('2d'),w=245,h=w*c.height/c.width;
  target.drawImage(src,center.x-w/2,center.y-h/2,w,h,0,0,c.width,c.height);
 }
 function render(){
  drawScene(original,res,t);
  // Both close-ups follow the same painted blade and the same camera push.
  drawScene(ctx,withLight,t);
  const hand=lamp.hand,zoom=1+.017*(1-Math.cos(t*2*Math.PI/DURATION));
  const point={x:(600+(hand[0]-600)*zoom)*stage.width/1200,y:(472.5+(hand[1]-472.5)*zoom)*stage.height/750};
  if(mode==='original')ctx.drawImage(base,0,0);
  crop('plain',base,point);crop('lit',stage,point);
 }
 function tick(now){
  if(!playing||document.hidden){raf=0;last=undefined;return}
  if(last===undefined||now-last>=1000/25){
   if(last!==undefined)t=(t+Math.min((now-last)/1000,.2))%DURATION;
   last=now;render();
  }
  raf=requestAnimationFrame(tick);
 }
 function sync(){
  get('pause').textContent=playing?'暫停':'繼續交手';
  if(playing&&!document.hidden&&!raf)raf=requestAnimationFrame(tick);
  if(!playing||document.hidden){cancelAnimationFrame(raf);raf=0;last=undefined}
 }
 function select(value){
  mode=value;if(mode!=='original')lamp.mode=mode;
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  get('caption').textContent=names[mode];get('tip').textContent=tips[mode];
  get('light').disabled=mode==='original';render();
 }
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>select(b.dataset.mode));
 get('light').oninput=e=>{lamp.position=e.target.valueAsNumber/100;render()};
 get('pause').disabled=get('strike').disabled=false;
 get('pause').onclick=()=>{playing=!playing;sync()};
 get('strike').onclick=()=>{playing=false;t=3.52;sync();render()};
 document.addEventListener('visibilitychange',sync);
 select(mode);sync();
}
start().catch(err=>{console.error(err);get('tip').textContent='畫卷未能載入，請重新整理再試。'});
