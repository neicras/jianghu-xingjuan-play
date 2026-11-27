import {atlas,readTrail} from './route-scroll.js';
import {enter,roomName,road} from './journey.js';
const root=document.querySelector('#draft');
const drills=await (await fetch('./gate-drills.json')).json();
const btn=(action,text,cls)=>'<button type="button" data-action="'+action+'" class="'+cls+'">'+text+'</button>';
let state;
function center(f){
 const window=root.querySelector('.trail-window'),n=window?.querySelector('[data-floor="'+f+'"]');
 if(n)window.scrollTop+=n.getBoundingClientRect().top-window.getBoundingClientRect().top-window.clientHeight*.68;
}
function reset(){
 state=structuredClone(drills.approaches[5]);root.innerHTML=atlas(state.route);center(5);
 root.querySelector('.map-restart').textContent='重看分岔';
}
root.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b)return;
 const map=root.querySelector('.itinerary'),r=state.route;
 const [action,id]=(b.dataset.action||'').split('/');
 if(action==='restartPrompt'||action==='reset'){reset();return}
 if(b.hasAttribute('data-map-home')){center(r.floor+1);return}
 if(b.dataset.mapRegion){center(b.dataset.mapRegion);return}
 if(b.hasAttribute('data-map-fork')){center(r.floor+1);return}
 if(b.hasAttribute('data-map-clear')){root.innerHTML=atlas(r);center(r.floor+1);return}
 if(b.dataset.mapPin){const [f,l]=b.dataset.mapPin.split('/').map(Number);readTrail(map,state,f,l,btn);return}
 if(action==='scout'){readTrail(map,state,r.floor+1,Number(id),btn);return}
 if(action==='enter'){
  const f=r.floor+1,name=roomName(road[f-1][Number(id)],f);
  if(enter(state,Number(id)))root.innerHTML='<section class="arrival"><small>路線已定 · 第 '+f+' 站</small><h2>'+name+'</h2><p>'+(r.phase==='fight'?'接下來進入精英戰。':'接下來在渡船上聽石生講領據的事。')+'</p>'+btn('reset','重看分岔','')+'</section>';
 }
});
reset();
