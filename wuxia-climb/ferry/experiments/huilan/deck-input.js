// Standard gamepad layout (also used by Steam Input's Gamepad template).
const controls='button:not(:disabled),summary,a[href],input:not(:disabled),select:not(:disabled)';
const activeRoot=()=>document.activeElement?.closest('dialog:modal')||[...document.querySelectorAll('dialog:modal')].at(-1)||document.body;
function enabled(el){
 return el?.matches(controls)&&!el.closest('[inert]')&&el.checkVisibility()&&el.getBoundingClientRect().width>0;
}
function available(root){
 return [...root.querySelectorAll(controls)].filter(enabled);
}
function first(root){
 const button=root.querySelector('.battle-card:not(:disabled),.map-seal.available,.jp-seat[aria-pressed=true],.shelf-volume,.study-return');
 return enabled(button)?button:available(root).find(el=>el.closest('#room,dialog'))||available(root)[0];
}
function focus(el){
 if(!el)return;
 el.focus({preventScroll:true});
 el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
}
function move(root,dx,dy){
 const from=document.activeElement;
 if(!root.contains(from)||!enabled(from)){focus(first(root));return}
 const center=el=>{const r=el.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]};
 const [x,y]=center(from);
 let best,score=Infinity;
 for(const el of available(root)){
  const [cx,cy]=center(el),along=dx*(cx-x)+dy*(cy-y);
  if(along<4)continue;
  const across=Math.abs(dy*(cx-x)-dx*(cy-y)),cost=along+2.5*across+across*across/along;
  if(cost<score){best=el;score=cost}
 }
 focus(best);
}
function scroller(root,axis,direction){
 const dim=axis==='x'?['scrollWidth','clientWidth','scrollLeft','overflowX']:['scrollHeight','clientHeight','scrollTop','overflowY'];
 function can(el){
  if(!el||el[dim[0]]<=el[dim[1]]+1||!/(auto|scroll)/.test(getComputedStyle(el)[dim[3]]))return false;
  return direction<0?el[dim[2]]>0:el[dim[2]]+el[dim[1]]<el[dim[0]]-1;
 }
 let current=document.activeElement;
 while(current&&root.contains(current)){if(can(current))return current;current=current.parentElement}
 const panels=root.querySelectorAll('.trail-window,.battle-hand,.spread-pages,.shelf,.skill-detail,.way-copy,.route-reading,.jp-endnote,#pages');
 return [...panels].find(can)||(can(root)?root:null)||(root===document.body?document.scrollingElement:null);
}
function back(root){
 if(root.matches('dialog')){
  const back=root.querySelector('[data-action=putBack],[data-action=back],[data-action=innBack]');
  if(back)back.click();else root.close();
 }else root.querySelector('.study-return')?.click();
}
// Steam Input can present the trackpad as a held mouse button. Native touch keeps its own inertia.
function installDragScroll(){
 let drag=null,suppress=false;
 document.addEventListener('pointerdown',e=>{
  suppress=false;drag=null;
  if(e.pointerType!=='mouse'||e.button!==0)return;
  const panel=e.target.closest('.trail-window,.battle-hand,.route-reading,.spread-pages,.register .shelf,dialog');
  if(panel)drag={panel,id:e.pointerId,x:e.clientX,y:e.clientY,left:panel.scrollLeft,top:panel.scrollTop,started:false};
 });
 document.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  const {panel}=drag,dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.started){
   const horizontal=panel.scrollWidth>panel.clientWidth+1&&Math.abs(dx)>7;
   const vertical=panel.scrollHeight>panel.clientHeight+1&&Math.abs(dy)>7;
   if(!horizontal&&!vertical)return;
   drag.started=true;panel.setPointerCapture(e.pointerId);
  }
  panel.scrollTo(drag.left-dx,drag.top-dy);
 });
 document.addEventListener('pointerup',()=>{suppress=Boolean(drag?.started);drag=null});
 document.addEventListener('pointercancel',()=>{drag=null});
 document.addEventListener('click',e=>{if(suppress&&e.detail){suppress=false;e.preventDefault();e.stopImmediatePropagation()}},true);
}
export function installDeckInput(){
 installDragScroll();
 const hint=document.createElement('small');
 hint.className='pad-legend';hint.innerHTML='A 選取　B 返回　右桿 捲動<span>　LB／RB 換目標　Y 收勢</span>';
 document.getElementById('travel-strip').append(hint);
 const setMode=on=>document.body.classList.toggle('pad-active',on);
 document.addEventListener('pointerdown',()=>setMode(false),true);
 document.addEventListener('keydown',e=>{
  if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.target.matches('input,select,textarea'))return;
  const dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
  const root=activeRoot();
  if(dir){e.preventDefault();setMode(true);move(root,...dir)}
  if(e.key==='PageDown'||e.key==='PageUp'){
   const sign=e.key==='PageDown'?1:-1,el=scroller(root,'y',sign);
   if(el){e.preventDefault();el.scrollBy(0,sign*Math.round(el.clientHeight*.75))}
  }
 });
 let ticking=false,previous=[],lastTime=0,direction='',nextMove=0;
 function frame(now){
  const pad=Array.from(navigator.getGamepads?.()||[]).find(p=>p?.connected&&p.mapping==='standard');
  if(!pad||document.hidden){ticking=false;previous=[];direction='';return}
  const pressed=pad.buttons.map(b=>b.pressed),edge=i=>pressed[i]&&!previous[i];
  const root=activeRoot(),axes=pad.axes;
  const dx=pressed[14]?-1:pressed[15]?1:Math.abs(axes[0])>.55?Math.sign(axes[0]):0;
  const dy=pressed[12]?-1:pressed[13]?1:Math.abs(axes[1])>.55?Math.sign(axes[1]):0;
  const vec=dx||dy?(Math.abs(axes[1])>Math.abs(axes[0])&&dy?[0,dy]:dx?[dx,0]:[0,dy]):null;
  const id=vec?.join(',')||'',dt=Math.min(40,Math.max(0,now-lastTime));
  const sx=axes[2]||0,sy=axes[3]||0;
  if(id||pressed.some(Boolean)||Math.max(Math.abs(sx),Math.abs(sy))>.18)setMode(true);
  if(id&&(id!==direction||now>=nextMove)){
   move(root,...vec);nextMove=now+(id===direction?145:340);
  }
  if(Math.abs(sy)>.18)scroller(root,'y',sy)?.scrollBy(0,Math.sign(sy)*sy*sy*dt*.9);
  if(Math.abs(sx)>.18)scroller(root,'x',sx)?.scrollBy(Math.sign(sx)*sx*sx*dt*.9,0);
  if(edge(0)){
   const el=document.activeElement;
   if(root.contains(el)&&enabled(el))el.click();else focus(first(root));
  }else if(edge(1))back(root);
  else if(edge(3)&&root===document.body)root.querySelector('.duel-board:not([inert]) [data-action=endRound]')?.click();
  else if((edge(4)||edge(5))&&root===document.body){
   const targets=[...root.querySelectorAll('.duel-board:not([inert]) [data-action^="target/"]:not(:disabled)')];
   if(targets.length>1){const idx=targets.findIndex(el=>el.classList.contains('aim'));targets[(idx+(edge(5)?1:-1)+targets.length)%targets.length].click()}
  }
  if(document.body.classList.contains('pad-active')&&!enabled(document.activeElement)&&!root.querySelector('.duel-board[inert]'))focus(first(root));
  direction=id;previous=pressed;lastTime=now;requestAnimationFrame(frame);
 }
 function start(){if(!ticking&&!document.hidden){ticking=true;requestAnimationFrame(frame)}}
 window.addEventListener('gamepadconnected',start);
 window.addEventListener('focus',start);
 document.addEventListener('visibilitychange',start);
 start();
}
