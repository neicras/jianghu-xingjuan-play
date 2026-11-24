import {road,linked,roomName} from './journey.js';
const legend=['比武','雙人合擊','守關高手','守壇劍宗','客棧','貨郎','師門','江湖偶遇'];
const marks={fighter:0,guard:0,pair:1,elite1:2,elite2:2,boss:3,inn:4,cache:5,school:6};
function icon(i){
 return '<i aria-hidden="true" class="route-stamp" style="background-position:'+(i%4)*100/3+'% '+Math.floor(i/4)*100+'%"></i>';
}
const heights={1:[52],2:[29,71],3:[19,51,82],4:[11,37,63,89]};
function point(f,l){
 const n=road[f-1].length;
 return [3+(f-1)*6.7,heights[n][l]+Math.sin(f*2.8+l)*3];
}
export function atlas(r){
 let lines='',nodes='';
 for(let f=1;f<=road.length;f++)for(const [l,type] of road[f-1].entries()){
  const [x,y]=point(f,l),taken=r.path[f-1]===l,here=taken&&r.floor===f;
  const next=r.phase==='map'&&f===r.floor+1&&linked(f,r.path.at(-1),l);
  if(f>1)for(let prev=0;prev<road[f-2].length;prev++){
   if(!linked(f,prev,l))continue;
   const [a,b]=point(f-1,prev),used=taken&&r.path[f-2]===prev;
   lines+='<path class="'+(used?'travelled':next&&r.path[f-2]===prev?'open-trail':'')+'" d="M'+a*10+' '+b*3+' C'+(a+3.3)*10+' '+b*3+' '+(x-3.3)*10+' '+y*3+' '+x*10+' '+y*3+'"/>';
  }
  const name=roomName(type,f),idx=type==='cache'&&f===2?7:marks[type];
  nodes+='<button class="map-seal '+(next?'available':here?'here':taken?'taken':f<=r.floor?'missed':'')+'" style="left:'+x+'%;top:'+y+'%" data-action="enter/'+l+'" '+(next?'':'disabled')+' title="第 '+f+' 站 · '+name+'" aria-label="第 '+f+' 站 · '+name+'">'+icon(idx)+(next||here||idx===2||idx===3?'<span>'+(here?'身在此處':!next&&(idx===2||idx===3)?'第'+f+'站 · '+name:name)+'</span>':'')+'</button>';
 }
 const note=r.phase==='map'&&r.last?'<div class="trail-news">'+r.last.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')+'</div>':'';
 const title=r.phase==='map'?'選擇第 '+(r.floor+1)+' 站':'已至第 '+r.floor+' 站';
 return '<section class="route-scroll"><header class="scroll-title"><div><h2>江湖路線</h2></div><p>'+title+'<small>朱圈可往　墨印已行</small></p></header><div class="trail-window"><div class="trail-sheet"><div class="route-regions"><b>渡口</b><b>山道</b><b>焚天壇</b></div><div class="trail-field"><svg aria-hidden="true" viewBox="0 0 1000 300" preserveAspectRatio="none">'+lines+'</svg>'+nodes+'</div></div></div><div class="route-key" aria-label="路線圖例"><b>圖例</b>'+legend.map((n,i)=>'<span>'+icon(i)+n+'</span>').join('')+'</div>'+note+'</section>';
}
