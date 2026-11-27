import {supportArt} from './art-library/support-files.js';
import {road,roadFor,linked,roomName} from './journey.js?branch=1';

import {chapterOf,episode,volumes,regionsByVolume,stationNumber,bossNames,crossingFor} from './chapter-road.js';
const legend=['普通比武','繞路','精英','守壇劍宗','客棧','貨郎','師門','江湖偶遇'];
const marks={checkpoint:0,convoy:0,press:0,bypass:1,fighter:0,guard:0,pair:0,banner:2,cave:7,elite1:2,elite2:2,boss:3,inn:4,cache:5,school:6};

const signs=['劍','舟','將','壇','茶','錢','書','信'];
const plates={elite1:'journey-boxing',elite2:'court',bypass:'ferry',press:'journey-letter',inn:'inn',school:'school-court',cave:'cave-cache',boss:'court',cache:'journey-scroll'};
function viewOf(type){return '<img class="way-print" alt="" src="'+supportArt(plates[type]||'duel-bamboo')+'">'}
export function routeIntro(r){
 const floor=r.floor+1,road=roadFor(r);
 const exits=(road[r.floor]||[]).map((type,l)=>linked(floor,r.path.at(-1),l)?'<button class="way-option" data-action="scout/'+l+'">'+icon(type==='cache'&&floor===2?7:marks[type])+'<span>'+roomName(type,floor,r)+'</span></button>':'').join('');
 const scene=chapterOf(r)===1?viewOf(floor<=5?'bypass':floor<=10?'fighter':'boss'):'<img alt="" class="way-print" style="object-position:center '+(100-100*Math.min(14,floor-1)/14)+'%" src="route-art/'+(chapterOf(r)===2?'paper':'silver')+'-v1.webp">';
 return scene+'<div class="way-copy"><small>第 '+stationNumber(r,Math.min(floor,15))+' 站</small><h3>'+(r.phase==='map'?'前路可往':'沿途見聞')+'</h3>'+(r.phase==='map'?'<div class="way-options">'+exits+'</div><p>點遠處地印，可尋通往該站的路。</p>':'<p>實線是你走過的路。</p>')+'</div>';
}

function icon(i){
 if(i===1)return '<i aria-hidden="true" class="route-stamp ferry-stamp" data-symbol="舟"></i>';
 return '<i aria-hidden="true" class="route-stamp" data-symbol="'+signs[i]+'" style="background-position:'+(i%4)*100/3+'% '+Math.floor(i/4)*100+'%"></i>';
}
function point(f,l){
 const count=road[f-1].length;
 return [(f-.5)*100/road.length,6+88*(l+.5)/count];
}
function safeText(value){return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}

// One set per station. Previewing uses the same links as travelling.
function reachable(r) {
 const road=roadFor(r);
 const floors = road.map(() => new Set());
 let from = [r.path.at(-1)];
 for (let f=r.floor+1; f<=road.length; f++) {
  const lanes = floors[f-1];
  road[f-1].forEach((_,l)=>{ if(from.some(prev=>linked(f,prev,l)))lanes.add(l) });
  from = [...lanes];
 }
 return floors;
}

// The individual die-cuts sit beside the road, anchored along the same continuous scroll.
const paperScenery=[
 ['skiff','peaks','arch','peaks','shrine'],
 ['mill','skiff','mill','arch','shrine'],
 ['arch','peaks','shrine','arch','granary']
];
function scenery(volume){
 const places=paperScenery[volume-1];
 const ridges=[.10,.31,.54,.77,.94].map((n,i)=>'<div class="ridge-place" data-distance="'+n+'" style="--side:'+(i%2?'auto':'-5%')+';--other:'+(i%2?'-5%':'auto')+'"><img alt="" draggable="false" src="route-art/fold-peaks.webp"></div>').join('');
 return '<div class="fold-stage" aria-hidden="true">'+ridges+places.map((id,i)=>
  '<div class="fold-place" data-distance="'+[.04,.25,.49,.74,.96][i]+'"><img alt="" draggable="false" src="route-art/fold-'+id+'.webp"></div>'
 ).join('')+'</div>';
}
export function atlas(r){
 const volume=chapterOf(r),road=roadFor(r),regions=regionsByVolume[volume-1];
 const choosing=r.phase==='map', focus=choosing?r.floor+1:Math.max(1,r.floor);
 
 const future=reachable(r);
 let underprint='',lines='',nodes='',stations='',folds='';
 for(let f=1;f<=road.length;f++){
  const destinations=road[f-1].map((type,l)=>choosing&&f===focus&&linked(f,r.path.at(-1),l)?roomName(type,f,r):null);
  const x=point(f,0)[0];
  folds+='<i class="paper-fold" aria-hidden="true" style="bottom:'+((f-1)*100/road.length)+'%"></i>';
  stations+='<i class="station-number" data-floor="'+f+'" style="--forward:'+x+'%"'+(f===focus?' aria-current="step"':'')+'>'+stationNumber(r,f)+'</i>';
  for(const [l,type] of road[f-1].entries()){
   const [,y]=point(f,l),taken=r.path[f-1]===l,here=taken&&r.floor===f,next=Boolean(destinations[l]);
   if(f>1)for(let prev=0;prev<road[f-2].length;prev++){
    if(!linked(f,prev,l))continue;
    const [a,b]=point(f-1,prev),used=taken&&r.path[f-2]===prev;
    const curve='M'+a*10+' '+b*3+' C'+(a+2.75)*10+' '+b*3+' '+(x-2.1)*10+' '+y*3+' '+x*10+' '+y*3;
    underprint+='<path class="path-paper" d="'+curve+'"/>';
    lines+='<path data-from="'+(f-1)+'/'+prev+'" data-to="'+f+'/'+l+'" class="'+(used?'travelled':next&&r.path[f-2]===prev?'open-trail':'')+'" d="'+curve+'"/>';
   }
   const name=roomName(type,f,r),idx=type==='cache'&&f===2?7:marks[type];
   const key=f+'/'+l, possible=future[f-1].has(l);
   const label=here?'你在此處':next||idx===2||idx===3||type==='press'?name:'';
   const control=next?'data-action="scout/'+l+'"':possible&&choosing?'data-map-pin="'+key+'"':'disabled';
   const style=next?'available':here?'here':taken?'taken':possible?'ahead':'missed';
   nodes+='<button type="button" class="map-seal '+style+'" data-stop="'+key+'" style="--lanes:'+road[f-1].length+';--forward:'+x+'%;--lane:'+y+'%" '+control+' aria-label="第 '+stationNumber(r,f)+' 站 · '+name+'" title="第 '+stationNumber(r,f)+' 站 · '+name+'">'+icon(idx)+(label?'<span>'+label+'</span>':'')+'</button>';
  }
 }
 const note=choosing&&r.last?'<details class="map-note"><summary>上站手記</summary><p>'+safeText(r.last)+'</p></details>':'';
 const tabs=regions.map((name,i)=>'<button type="button" data-map-region="'+(1+5*i)+'"><b>'+name+'</b><small>'+(stationNumber(r,1+5*i)+'–'+stationNumber(r,5+5*i))+'站</small></button>').join('');
 const key=legend.map((n,i)=>'<span>'+icon(i)+(i===3?bossNames[volume-1]:n)+'</span>').join('');
 return '<section class="route-scroll itinerary" data-volume="'+volume+'" aria-label="江湖路線"><header class="scroll-title"><div><small>卷'+['一','二','三'][chapterOf(r)-1]+' · '+volumes[chapterOf(r)-1]+'</small><h2>全卷路線</h2></div><nav aria-label="翻到路段">'+tabs+'</nav><button type="button" class="map-restart" data-action="restartPrompt">重新開局</button></header>'+
 '<div class="map-land"><route-landscape class="scroll-country" aria-hidden="true"></route-landscape>'+scenery(volume)+'<div class="scroll-fringe" aria-hidden="true"><i class="fringe-river"></i><i class="fringe-bamboo"></i><i class="fringe-summit"></i></div><div class="trail-window" tabindex="0" aria-label="十五站路線圖"><div class="trail-sheet">'+folds+'<div class="station-ruler" aria-hidden="true">'+stations+'</div><div class="trail-field"><svg class="vertical-ink" aria-hidden="true" viewBox="0 0 300 1000" preserveAspectRatio="none"><g transform="matrix(0 -1 1 0 0 1000)">'+underprint+lines+'</g></svg>'+nodes+'</div></div></div></div>'+
 '<aside class="route-reading" aria-live="polite">'+routeIntro(r)+'</aside><footer class="map-tools"><details class="map-legend"><summary>圖例</summary><div class="route-key">'+key+'</div></details><button type="button" data-map-home aria-label="捲回目前所在的站">回到現址</button>'+note+'</footer></section>';

}

// Inspect the immediate cost and the onward forks before committing this stop.
export function scout(s,lane,btn){
 const r=s.route,floor=r.floor+1,type=roadFor(r)[floor-1]?.[lane];
 if(r.phase!=='map'||!type||!linked(floor,r.path.at(-1),lane))return '';
 const ordinary='先看來招再出手。此路有人攔截，勝後可取銅錢、歷練，亦可能拾得抄本。';
 const stakes={
  checkpoint:'一名鐵衛已經架起護體。他蓄勁時，穿過護體打掉八點氣血，就能截住下一輪重擊。',
  convoy:'兩名哨兵同行。前哨連斬，後哨虛晃使你露出破綻；可以先解決其中一人。',
  fighter:ordinary,pair:ordinary,guard:ordinary,elite1:'勝取鐵衣令。以後每場比武起手多一點內力；若落敗，行程就在此結束。',
  elite2:'青白雙煞同時守關。勝取雙煞令，以後每擊多兩點勁力。',banner:'旗主鳴哨就能喚回兩哨。打倒旗主，餘眾便散。',
  bypass:floor===5?'平安過渡，石生會陪你到紙坊認印。鐵衣令留在擂上。':'阿綾替你敷藥，可回復 '+Math.min(5,r.maxHp-r.hp)+' 氣血。這條水路繞過雙煞的擂台。',
  press:episode(r,'receipt')?'石生識得教頭，只須同墨師傅一人交手。擋盡試掌並得勝，可領長拳親筆本。':'教頭守在墨師傅身旁，要應付兩人。擋盡試掌並得勝，可領長拳親筆本。',
  cave:'可以拾起散錢就走，也可以搜鏢囊尋抄本。搜得愈久，愈容易驚動守鏢人。',
  inn:'只能辦一件事。客房可養傷，後院可精練一張牌，藥櫃可補給。',
  school:'帶上殘卷去問師兄，可用歷練試演一門功夫，或留下拆招，增長歷練。',
  cache:floor===2?'驛亭有人招手。先聽一聽，再決定要不要幫忙。':'帶著 '+s.gold+' 文到貨攤看看。可挑裝備、信物和藥，也可空手離開。',
  boss:'山路到此為止。劍宗蓄勁時可以搶攻破招，聽勁時會逐擊反打。'
 };
 if(chapterOf(r)>1){
  stakes.boss=chapterOf(r)===2?'掌契人擾亂你的手牌，護契刀客會接著追斬。你可以先選其中一人集火。':'鎮倉使先蓄勁，再使連擊。打斷蓄勁可卸去加勁；等他轉入聽勁，逐劍搶攻就會被反打。';
  stakes.bypass=crossingFor({...r,floor})?.result;
  for(const [kind,token] of [['elite1','鐵衣令'],['elite2','雙煞令']])if(s.relics.includes(token))stakes[kind]='你已持有'+token+'。再度勝出，可多得八點歷練。';
 }
 return '<div><b>'+roomName(type,floor,r)+'</b><p>'+stakes[type]+'</p></div>'+btn('enter/'+lane,'動身前往','depart-seal');
}

// Trace all legal approaches back from a goal, or the next fork after a selected next stop.
export function readTrail(root,s,f,l,btn){
 const r=s.route, road=roadFor(r), first=r.floor+1, future=reachable(r);
 if(!future[f-1]?.has(l)||r.phase!=='map')return;
 const picked=new Set([f+'/'+l]),links=new Set();
 function include(layer,from,to){
  const a=(layer-1)+'/'+from,b=layer+'/'+to;
  links.add(a+'>'+b);picked.add(a);picked.add(b);
 }
 for(let layer=f;layer>first;layer--){
  for(const to of future[layer-1])if(picked.has(layer+'/'+to))
   for(const from of future[layer-2])if(linked(layer,from,to))include(layer,from,to);
 }
 if(r.floor)for(const to of future[first-1]){
  if(picked.has(first+'/'+to))include(first,r.path.at(-1),to);
 }
 if(f===first){
  for(let layer=f+1;layer<=Math.min(f+1,road.length);layer++)
   for(const from of future[layer-2])if(picked.has((layer-1)+'/'+from))
    for(const to of future[layer-1])if(linked(layer,from,to))include(layer,from,to);
 }
 root.classList.add('tracing');
 for(const node of root.querySelectorAll('[data-stop]')){
  node.classList.toggle('on-plan',picked.has(node.dataset.stop));
  node.classList.toggle('pinned-goal',node.dataset.stop===f+'/'+l);
 }
 for(const edge of root.querySelectorAll('path[data-from]'))
  edge.classList.toggle('planned',links.has(edge.dataset.from+'>'+edge.dataset.to));
 const nextNames=[...future[first-1]].filter(i=>picked.has(first+'/'+i)).map(i=>roomName(road[first-1][i],first,r));
 const info=f===first?scout(s,l,btn):'<div><b>第 '+stationNumber(r,f)+' 站 · '+roomName(road[f-1][l],f,r)+'</b><p>沿青線前往。下一站可經'+[...new Set(nextNames)].join('、')+'。</p></div>';
 const beyond=(road[f]||[]).map((type,lane)=>linked(f+1,l,lane)?roomName(type,f+1,r):null).filter(Boolean);
 const onward=beyond.length?'<div class="way-onward"><small>下一站可接</small><p>'+[...new Set(beyond)].join(' · ')+'</p></div>':'';
 const returnToFork=f>first?'<button type="button" data-map-fork>看下一站</button>':'';
 root.querySelector('.route-reading').innerHTML=viewOf(road[f-1][l])+'<div class="way-copy"><small>第 '+stationNumber(r,f)+' 站 · '+(f===first?'可動身':'尋路')+'</small>'+info+returnToFork+'<button type="button" data-map-clear aria-label="清除路線標記">收起</button>'+onward+'</div>';
}
