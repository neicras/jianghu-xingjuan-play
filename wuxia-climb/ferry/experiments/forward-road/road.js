import {loadInks} from './inks.js';
import {paint} from './scenery.js';

const $=id=>document.getElementById(id);
const stations=[
 {title:'舊渡口',choices:[
  ['ferry','蘆灣渡','得船票','艄公認得師父留下的繩結，替你留了一張船票。'],
  ['inn','茶寮','聽船訊','茶婆在杯底壓了一張紙：今夜，糧船會靠北岸。'],
  ['fight','鏢棚','取鏢旗','老鏢頭把褪色的鏢旗借你一路。']]},
 {title:'石橋頭',choices:[
  ['ferry','水門','乘船過閘','你將船票交還艄公，他把你送到倉前。'],
  ['inn','北岸','循暗號','你照著船訊，摸到岸邊的接頭處。'],
  ['fight','關道','憑旗通關','守關人看見鏢旗，朝你讓開半步。']]},
 {title:'常平倉外',choices:[
  ['shrine','問守倉人','核對領據','守倉人翻出舊簿。三年前那一頁，少了半枚紅印。'],
  ['ferry','登糧船','查看封條','船艙還有一批未拆封的糧袋。封條上，是同一枚紅印。']]}
];
const plainPass=['沿纜橋走','循河聲走','繞過關樓'];
const plainStory=['沒有船票，你沿水門外的纜橋步行。','你沿著河聲找到北岸，錯過了接頭的船。','你繞過守關人，從坡下的舊路進倉。'];
const carried=['船票','船訊','鏢旗'];
const stage=$('stage'), plate=$('plate'), fork=$('fork'), canvas=document.querySelector('canvas');
let painted=new URL(location.href).searchParams.get('look')==='ink';
let inks;
function setLook(){
 stage.dataset.look=painted?'ink':'wire';
 $('look').textContent=painted?'看灰模':'看彩稿';
 if(painted&&!inks)inks=loadInks(draw);
}
$('look').onclick=()=>{
 painted=!painted;setLook();positionButtons();draw();
 const url=new URL(location.href);url.searchParams.set('look',painted?'ink':'wire');history.replaceState(null,'',url);
};
const campaign=new URLSearchParams(location.search).get('campaign');
const returnURL='../huilan/journey.html';
function continueJourney(){localStorage.setItem('jianghu.ferry.intro.v2','seen');location.replace(returnURL)}
if(campaign==='launch'&&localStorage.getItem('jianghu.ferry.intro.v2')==='seen')location.replace(returnURL);
const audio=new Audio();audio.preload='none';audio.volume=.48;
let audible=true,track='',stageMode='intro',st=0,worlds=[],choices=[],token=-1,z=0,x=0,trip=null,focusIndex=-1,lastStory='',priorMode='intro';
const motion=matchMedia('(prefers-reduced-motion: reduce)');
function music(name){if(track!==name){audio.src='media/'+name+'.mp3';audio.loop=name==='road';track=name}if(audible)audio.play().catch(()=>{});else audio.pause()}
if(campaign){
 audible=localStorage.getItem('jianghu.sound.enabled')!=='off';
 $('sound').textContent=audible?'樂聲開':'樂聲關';$('sound').setAttribute('aria-pressed',audible);
 $('continue').hidden=false;$('continue').onclick=continueJourney;
 $('study').textContent='繼續行程';
 $('go').focus();
}
$('sound').onclick=()=>{audible=!audible;if(campaign)localStorage.setItem('jianghu.sound.enabled',audible?'on':'off');$('sound').textContent=audible?'樂聲開':'樂聲關';$('sound').setAttribute('aria-pressed',audible);if(audible)music(track||'road');else audio.pause()};
function showPlate(which){plate.className=which;plate.hidden=false;const victory=which==='victory';$('eyebrow').textContent=victory?'首勝題畫 · 試稿':'渡口篇';$('title').textContent=victory?'斷契重逢':'江湖行卷';$('copy').textContent=victory?'他放下刀，從貼身衣袋取出另一半領據。':'領據上，是師父的筆跡。可他已經死了三年。';$('go').textContent=victory?'返回':'踏上渡船　→';$('study').hidden=victory; if(victory)music('victory')}
$('study').onclick=()=>{if(campaign){continueJourney();return}priorMode=stageMode;stageMode='art';showPlate('victory')};
$('go').onclick=()=>{if(stageMode==='art'){stageMode=priorMode;if(stageMode==='end'){plate.hidden=true;music('road')}else{showPlate('intro');audio.pause();track=''}return}start()};
function makeWorld(i,c,gate){
 const data=stations[i], count=data.choices.length;
 return {i,c,gate,doors:data.choices.map(([kind,name,gain,story],j)=>({kind,name,gain:i===1&&j!==token?plainPass[j]:gain,story:i===1&&j!==token?plainStory[j]:story,j,x:c+(j-(count-1)/2)*3.85,z:gate}))};
}
function start(){
 plate.hidden=true;fork.replaceChildren();z=0;x=0;st=0;token=-1;lastStory='';focusIndex=-1;choices=[];worlds=[makeWorld(0,0,19)];music('road');beginTravel(8,0,0,0,2750);hud('霧散了。前面有三條路。');
}
function hud(line){$('place').textContent=st===3?'常平倉':stations[st].title;$('trail').textContent=(st===3?'已抵埗':'路口　'+(st+1)+' / 3')+(token>=0?'\n隨身 · '+carried[token]:'');$('status').textContent=line}
function beginTravel(to,target,via,turn,length){stageMode='walk';trip={from:z,to,fromX:x,target,via,turn,started:performance.now(),length:motion.matches?160:length};stage.dataset.mode='walk';if(st<3) signs(false)}
function choose(j){
 if(stageMode!=='fork')return;
 const w=worlds[st],d=w.doors[j];if(!d)return;
 if(st===0)token=j;lastStory=d.story;choices.push(d.name);fork.replaceChildren();focusIndex=-1;
 const oldGate=w.gate;st++;
 if(st<3)worlds.push(makeWorld(st,d.x,oldGate+26));
 beginTravel(st===3?oldGate+6:oldGate+15,d.x,oldGate-10.7,oldGate-1.3,st===3?3150:4900);hud(lastStory);
}
function signs(ready){
 const w=worlds[st];fork.replaceChildren();
 for(const d of w.doors){
  const b=document.createElement('button');b.className='route';b.innerHTML='<span></span><small></small>';b.firstChild.textContent=d.name;b.lastChild.textContent=d.gain;b.setAttribute('aria-label',d.name+'，'+d.gain);b.onclick=()=>choose(d.j);b.disabled=!ready;b.classList.toggle('far',!ready);
  b.onmouseenter=b.onfocus=()=>{focusIndex=d.j};b.onmouseleave=()=>{if(document.activeElement!==b)focusIndex=-1};fork.append(b);
 }
 positionButtons();
}
function mountFork(){
 stageMode='fork';stage.dataset.mode='fork';signs(true);hud(st===0?'選一處落腳。':lastStory);
}
function end(){
 stageMode='end';stage.dataset.mode='end';hud(lastStory+'　'+choices.join(' › '));fork.replaceChildren();
 const nav=document.createElement('div');nav.className='end-actions actions';for(const [t,fn] of [['重走渡口',start],['預覽首勝畫稿',()=>{priorMode='end';stageMode='art';showPlate('victory')}]]){const b=document.createElement('button');b.textContent=t;b.onclick=fn;nav.append(b)}if(campaign){const enter=document.createElement('button');enter.textContent='進入江湖';enter.onclick=continueJourney;nav.prepend(enter)}fork.append(nav)
}
function positionButtons(){
 if(st>=3||!['walk','fork'].includes(stageMode))return;
 for(const [j,b] of [...fork.children].entries()){
 const d=worlds[st].doors[j],v=project(d.x,painted?.04:1.7,d.z-.65);
 const delta=d.z-z;const scale=Math.min(1,10.35/Math.max(1,delta-.65));b.style.setProperty('--depth',scale);b.style.opacity=String(stageMode==='fork'?1:Math.max(0,Math.min(1,(20-delta)/6)));
 Object.assign(b.style,{left:v[0]+'px',top:v[1]+'px',width:(2.75*v[2])+'px',height:(3.65*v[2])+'px'});
 }
}
let eyeShift=0,eyeRise=0,walkTime=0;
let W=1,H=1,F=1,hz=1,paintKey='';
function size(){const r=canvas.getBoundingClientRect(),dpi=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;canvas.width=Math.round(W*dpi);canvas.height=Math.round(H*dpi);F=Math.min(W*.87,H*1.36);hz=H*(W/H<.85?.46:.43);positionButtons();draw()}
const ctx=canvas.getContext('2d');function project(X,Y,Z){const k=F/Math.max(.16,Z-z);return [W/2+(X-x-eyeShift)*k,hz+(2.12+eyeRise-Y)*k,k]}
function draw(){ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);paint(ctx,{W,H,F,hz,z,x,time:walkTime,inks:painted?inks:null,project,worlds,st,focusIndex,choice:stageMode==='fork'})}
const smooth=t=>t*t*(3-2*t);
function frame(now){
 if(campaign)pollDeck();
 if(stageMode==='walk'){
  const t=Math.min(1,(now-trip.started)/trip.length);z=trip.from+(trip.to-trip.from)*smooth(t);
  const bend=trip.turn>trip.via?Math.max(0,Math.min(1,(z-trip.via)/(trip.turn-trip.via))):1;
  x=trip.fromX+(trip.target-trip.fromX)*smooth(bend);
  // Keep a clear walking lane to one side of the boat, table or cart.
  const pass=st>0&&!motion.matches?Math.max(0,1-Math.abs(z-worlds[st-1].gate)/3.3):0;
  const envelope=motion.matches?0:Math.sin(Math.PI*t);
  eyeShift=-2.03*smooth(pass)+.075*envelope*Math.sin(z*1.45);
  eyeRise=.058*envelope*Math.sin(z*2.9);walkTime=now/1000;
  positionButtons();if(t===1){if(st<3)mountFork();else end()}
 }
 const key=[stageMode,focusIndex,st].join('/');
 if(plate.hidden&&(stageMode==='walk'||key!==paintKey))draw();paintKey=key;
 requestAnimationFrame(frame)
}
document.addEventListener('keydown',e=>{if(stageMode!=='fork'||!plate.hidden)return;const n=fork.children.length;
 if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();focusIndex=(focusIndex<0?(e.key==='ArrowRight'?0:n-1):(focusIndex+(e.key==='ArrowRight'?1:n-1))%n);fork.children[focusIndex].focus()}
 if(/^[123]$/.test(e.key))choose(Number(e.key)-1)
});
// The road is a separate scene with its own small set of visible destinations.
let previousPad=[];
function pollDeck(){
 const pad=Array.from(navigator.getGamepads?.()||[]).find(p=>p?.connected&&p.mapping==='standard');
 if(!pad){previousPad=[];return}
 const down=[pad.buttons[0]?.pressed,pad.buttons[1]?.pressed,
  pad.buttons[14]?.pressed||pad.axes[0]<-.55,pad.buttons[15]?.pressed||pad.axes[0]>.55,
  pad.buttons[12]?.pressed||pad.axes[1]<-.55,pad.buttons[13]?.pressed||pad.axes[1]>.55];
 const edge=i=>down[i]&&!previousPad[i];
 const controls=plate.hidden?[...fork.querySelectorAll('button:not(:disabled)'),$('continue'),$('sound')]:
  [...plate.querySelectorAll('button')].filter(b=>!b.hidden);
 const i=controls.indexOf(document.activeElement);
 if(edge(1))continueJourney();
 else if(edge(2)||edge(4))controls[(i<=0?controls.length:i)-1]?.focus();
 else if(edge(3)||edge(5))controls[(i+1)%controls.length]?.focus();
 else if(edge(0))(controls[i]||controls[0])?.click();
 previousPad=down;
}
setLook();new ResizeObserver(size).observe(canvas);requestAnimationFrame(frame);
