import {road,linked,roomName} from './journey.js?paper1';

import {chapterOf,episode} from './chapter-road.js?paper1';
const legend=['普通比武','繞路','精英','守壇劍宗','客棧','貨郎','師門','江湖偶遇'];
const marks={press:0,bypass:1,fighter:0,guard:0,pair:0,banner:2,cave:7,elite1:2,elite2:2,boss:3,inn:4,cache:5,school:6};
const regions=['渡口','山道','焚天壇'];

function icon(i){
 return '<i aria-hidden="true" class="route-stamp" style="background-position:'+(i%4)*100/3+'% '+Math.floor(i/4)*100+'%"></i>';
}
function point(f,l){
 const count=road[f-1].length;
 return [(f-.5)*100/road.length,(l+.5)*100/count];
}
function onward(f,l){
 const names=(road[f]||[]).flatMap((type,i)=>linked(f+1,l,i)?[roomName(type,f+1)]:[]);
 return [...new Set(names)].join('、');
}
function safeText(value){return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}

export function atlas(r){
 const choosing=r.phase==='map', focus=choosing?r.floor+1:Math.max(1,r.floor);
 const region=Math.min(2,Math.floor((focus-1)/5));
 let lines='',nodes='',stations='';
 for(let f=1;f<=road.length;f++){
  const destinations=road[f-1].map((type,l)=>choosing&&f===focus&&linked(f,r.path.at(-1),l)?roomName(type,f):null);
  const x=point(f,0)[0];
  stations+='<i class="station-number" data-floor="'+f+'" style="--forward:'+x+'%"'+(f===focus?' aria-current="step"':'')+'>'+f+'</i>';
  for(const [l,type] of road[f-1].entries()){
   const [,y]=point(f,l),taken=r.path[f-1]===l,here=taken&&r.floor===f,next=Boolean(destinations[l]);
   if(f>1)for(let prev=0;prev<road[f-2].length;prev++){
    if(!linked(f,prev,l))continue;
    const [a,b]=point(f-1,prev),used=taken&&r.path[f-2]===prev;
    lines+='<path class="'+(used?'travelled':next&&r.path[f-2]===prev?'open-trail':'')+'" d="M'+a*10+' '+b*3+' C'+(a+3.3)*10+' '+b*3+' '+(x-3.3)*10+' '+y*3+' '+x*10+' '+y*3+'"/>';
   }
   const name=roomName(type,f),idx=type==='cache'&&f===2?7:marks[type];
   const beyond=next&&destinations.filter(n=>n===name).length>1?onward(f,l):'';
   const label=here?'現址':next?name:(idx===2||idx===3||type==='press')?name:'';
   nodes+='<button type="button" class="map-seal '+(next?'available':here?'here':taken?'taken':f<=r.floor?'missed':'')+'" style="--forward:'+x+'%;--lane:'+y+'%" data-action="scout/'+l+'" '+(next?'':'disabled')+' aria-label="第 '+f+' 站 · '+name+(beyond?'，其後可往'+beyond:'')+'" title="第 '+f+' 站 · '+name+'">'+icon(idx)+(label?'<span>'+label+(beyond?'<small>往'+beyond+'</small>':'')+'</span>':'')+'</button>';
  }
 }
 const note=choosing&&r.last?'<details class="map-note"><summary>上站手記</summary><p>'+safeText(r.last)+'</p></details>':'';
 const advice=choosing&&[4,9].includes(r.floor)?(r.floor===4?'勝取鐵衣令，首回合及破招後多一點內力。':'勝取雙煞令，此後每擊多兩點傷害。')+(r.floor===4?'隨石生過江，紙坊少一名對手。':'乘藥船可回復最多五點氣血。'):'';
 return '<section class="route-scroll" aria-label="江湖路線"><header class="scroll-title"><div><h2>江湖路線</h2><p>'+regions[region]+' · '+(choosing?'選擇第 '+focus+' 站':r.floor?'已至第 '+r.floor+' 站':'尚未啟程')+'</p></div><button type="button" class="map-restart" data-action="restartPrompt">重新開局</button></header>'+
 '<div class="trail-window" tabindex="0" aria-label="十五站路線圖"><div class="trail-sheet"><div class="station-ruler" aria-hidden="true">'+stations+'</div><div class="trail-field"><svg aria-hidden="true" viewBox="0 0 1000 300" preserveAspectRatio="none">'+lines+'</svg><svg class="upright-trails" aria-hidden="true" viewBox="0 0 300 1000" preserveAspectRatio="none"><g transform="matrix(0 1 1 0 0 0)">'+lines+'</g></svg>'+nodes+'</div></div></div>'+
 (advice?'<div class="map-prize">'+advice+'</div>':'')+'<footer class="map-tools"><nav aria-label="翻到路段">'+regions.map((n,i)=>'<button type="button" data-map-region="'+(1+5*i)+'">'+n+'</button>').join('')+'</nav><details class="map-legend"><summary>圖例</summary><div class="route-key">'+legend.map((n,i)=>'<span>'+icon(i)+n+'</span>').join('')+'</div></details>'+note+'</footer></section>';
}

// Inspect the immediate cost and the onward forks before committing this stop.
export function scout(s,lane,btn){
 const r=s.route,floor=r.floor+1,type=road[floor-1]?.[lane];
 if(r.phase!=='map'||!type||!linked(floor,r.path.at(-1),lane))return '';
 const ordinary='先看來招再出手。此路有人攔截，勝後可取銅錢、歷練，亦可能拾得抄本。';
 const stakes={
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
 const next=onward(floor,lane);
 return '<section class="scout-note"><small>卷'+['一','二','三'][chapterOf(r)-1]+' · 第 '+floor+' 站</small><h2>'+roomName(type,floor)+'</h2><p>'+stakes[type]+'</p>'+
  (next?'<p><b>從此處可往</b>　'+next+'</p>':'')+btn('enter/'+lane,'動身前往','primary')+' '+btn('backToTrail','再看地圖')+'</section>';
}
