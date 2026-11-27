import {paint} from '../forward-road/scenery.js?map=2';
import {loadInks} from '../forward-road/inks.js?map=2';
import {roadFor,linked,roomName} from './journey.js';
import {chapterOf,volumeName,regionsByVolume,stationNumber} from './chapter-road.js';
import {scout} from './route-scroll.js';

const objects={
 fighter:'way-assassin',guard:'way-iron-guard',pair:'way-front-scout',checkpoint:'way-iron-guard',
 convoy:'way-front-scout',banner:'way-iron-master',elite1:'way-iron-master',elite2:'way-jade-fiend',
 boss:'way-altar-master',bypass:'sampan',inn:'tea-cart',cache:'escort-cart',press:'clerk',school:'clerk',cave:'grain'
};
const actorArt=[...new Set(Object.values(objects).filter(id=>id.startsWith('way-'))),'way-white-fiend'];
let inks;
const redraw=()=>document.querySelector('journey-road')?.draw();

class JourneyRoad extends HTMLElement {
 disconnectedCallback(){this.resize?.disconnect();cancelAnimationFrame(this.frame);this.finish?.()}
 mount(state,btn){
  this.state=state;this.btn=btn;
  const r=state.route,volume=chapterOf(r),floor=r.floor+1;
  this.region=Math.floor((floor-1)/5);
  this.options=roadFor(r)[floor-1].flatMap((type,lane)=>{
   if(!linked(floor,r.path.at(-1),lane))return [];
   let art=objects[type];
   if(type==='cache'&&floor===2)art='clerk';
   if(type==='boss')art=['way-altar-master','way-white-fiend','way-iron-master'][volume-1];
   return [{type,lane,art,name:roomName(type,floor,r)}];
  });
  this.innerHTML='<canvas aria-hidden="true"></canvas><div class="jr-heading"><small></small><h2></h2></div><button class="jr-atlas" data-action="map">查看全卷</button><div class="jr-signs"></div><nav class="jr-banks" aria-label="切換岔路"></nav><div class="jr-note" aria-live="polite"></div>';
  this.querySelector('small').textContent=volumeName(r)+'　·　第 '+stationNumber(r,floor)+' 站';
  this.querySelector('h2').textContent=regionsByVolume[volume-1][this.region];
  this.canvas=this.querySelector('canvas');this.ctx=this.canvas.getContext('2d');
  this.z=0;this.x=0;this.gate=19;this.page=0;
  this.showPage();
  inks??=loadInks(redraw,actorArt);
  this.resize=new ResizeObserver(()=>this.draw());this.resize.observe(this);
  this.animate(8,0,800);
 }
 animate(to,x,duration){
  cancelAnimationFrame(this.frame);
  const start=performance.now(),from=this.z,fromX=this.x;
  const ms=matchMedia('(prefers-reduced-motion: reduce)').matches?0:duration;
  return new Promise(resolve=>{
   this.finish=resolve;
   const step=now=>{
    const t=ms?Math.min(1,(now-start)/ms):1,k=t*t*(3-2*t);
    this.z=from+(to-from)*k;this.x=fromX+(x-fromX)*k;this.draw();
    if(t<1)this.frame=requestAnimationFrame(step);else{this.finish=null;resolve()}
   };
   this.frame=requestAnimationFrame(step);
  });
 }
 showPage(){
  const routes=this.options.slice(this.page*3,this.page*3+3);
  this.world={i:this.region,c:0,gate:this.gate,doors:routes.map((d,j)=>({...d,j,x:(j-(routes.length-1)/2)*3.85,z:this.gate}))};
  const signs=this.querySelector('.jr-signs');signs.replaceChildren();
  for(const d of this.world.doors){
   const b=document.createElement('button');b.type='button';b.dataset.lane=d.lane;b.textContent=d.name;
   b.onclick=()=>this.inspect(d);signs.append(b);
  }
  const banks=this.querySelector('.jr-banks');
  const pages=Math.ceil(this.options.length/3);
  banks.replaceChildren();
  if(pages>1){
   const b=document.createElement('button');
   b.textContent=this.page?'‹ 看左岔':'看右岔 ›';
   b.setAttribute('aria-label',b.textContent+'　另有'+(this.page?3:this.options.length-3)+'條路');
   b.onclick=()=>{this.page=1-this.page;this.showPage();this.draw();this.querySelector('.jr-signs button')?.focus({preventScroll:true})};banks.append(b);
  }
  this.querySelector('.jr-note').replaceChildren();
 }
 inspect(d){
  if(this.travelling)return;
  const {route:r}=this.state;
  const panel=this.querySelector('.jr-note');
  panel.innerHTML=scout(this.state,d.lane,this.btn);
  const onward=(roadFor(r)[r.floor+1]||[]).flatMap((type,i)=>linked(r.floor+2,d.lane,i)?[roomName(type,r.floor+2,r)]:[]);
  if(onward.length){
   const next=document.createElement('small');next.textContent='再往前　'+[...new Set(onward)].join('、');panel.firstChild.append(next);
  }
  for(const b of this.querySelectorAll('[data-lane]'))b.setAttribute('aria-pressed',Number(b.dataset.lane)===d.lane);
  panel.querySelector('button').focus({preventScroll:true});
 }
 async travel(lane){
  const d=this.options.find(o=>o.lane===lane);if(!d)return;
  const page=Math.floor(this.options.indexOf(d)/3);
  if(this.page!==page){this.page=page;this.showPage()}
  const door=this.world.doors.find(o=>o.lane===lane);
  this.travelling=true;this.dataset.travelling='';
  await this.animate(this.gate+1,door.x+(door.x>0?-1.45:1.45),690);
 }
 draw(){
  if(!this.isConnected||!this.canvas||!this.world)return;
  const W=this.clientWidth,H=this.clientHeight;if(!W||!H)return;
  const dpi=Math.min(devicePixelRatio||1,1.5),cw=Math.round(W*dpi),ch=Math.round(H*dpi);
  if(this.canvas.width!==cw||this.canvas.height!==ch){this.canvas.width=cw;this.canvas.height=ch}
  this.ctx.setTransform(cw/W,0,0,ch/H,0,0);
  const F=Math.min(W*.83,H*1.30),hz=H*.43,z=this.z,x=this.x;
  const project=(px,py,pz)=>{const k=F/Math.max(.16,pz-z);return [W/2+(px-x)*k,hz+(2.12-py)*k,k]};
  paint(this.ctx,{W,H,F,hz,x,z,time:z*.16,inks,project,st:this.region===0?0:3,worlds:[this.world],focusIndex:-1});
  for(const [i,b] of [...this.querySelector('.jr-signs').children].entries()){
   const d=this.world.doors[i],[left,top,scale]=project(d.x,0,d.z);
   b.style.setProperty('--figure-height',Math.min(scale*2.85,H*.47)+'px');
   b.style.left=left+'px';b.style.top=top+'px';
  }
 }
}
customElements.define('journey-road',JourneyRoad);

export function mountJourneyRoad(room,state,btn){room.querySelector('journey-road')?.mount(state,btn)}
