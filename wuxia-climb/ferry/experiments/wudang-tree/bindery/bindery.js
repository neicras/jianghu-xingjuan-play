import {byName,ranks} from '../catalogue.js';
import {cardFace} from '../card-face.js';
import {collate,chapters,withCopy} from '../manuscripts.js';
import {gateOdds,trainingChance,rehearse,equip} from '../rules.js';
import {bindingState} from '../bound-book.js';
import {manualVerses} from '../manual-verses.js';
import {reviewJourney} from '../review-frames.js';

const families={'劍法':'sword','身法':'step','拳掌':'palm','護體':'guard','內功':'breath','奇竅':'array','軟兵':'whisk'};
const specimens=[
 ['武當丹劍',[2,0,2,1,2,0],'渡口手記',[['隨身舊譜',[2,2,0,2,1,2]]]],
 ['八卦步',[2,2,2,2,2,1],'師兄手抄',[['雨中散頁',[0,0,1,0,0,2]]]],
 ['太極拳',[2,0,0,1,0,0],'拳架殘頁',[['山房舊錄',[0,2,0,0,1,0]],['師叔眉批',[0,0,2,1,0,1]]]],
 ['武當鐵布衫',[2,2,1,0,2,0],'拳師袖本',[]],
 ['太乙雲拂功',[0,1,0,2,0,1],'雲房散葉',[['藏經抄本',[1,0,2,0,2,0]]]]
];
const params=new URLSearchParams(location.search),stage=document.querySelector('#stage');
let mode=params.get('mode')==='art'?'art':'wire',screen=params.get('screen')==='study'?'study':'shelf';
let index=0,state,choices,logs,inspected,chosen;
function reset(){state=reviewJourney('books');choices=new Map();logs=new Map();inspected=null;chosen=new Set([0]);index=0}
reset();
function copies(){const [,pages,title,owned]=specimens[index];return [[title,pages],...owned]}
function openBook(i){index=i;screen='study';inspected=null;chosen=new Set(choices.get(i)||[0]);render(true)}
function selectedPages(){return collate(copies().filter((_,i)=>chosen.has(i)).map(c=>c[1]))}
function tint(a){return a.rank<=3?'-gold':a.rank<=6?'-jade':''}
function volume(a,pages){
 const [wear,condition]=bindingState(pages);
 return '<span class="volume" data-wear="'+wear+'"><img alt="" class="binding" src="art/'+wear+tint(a)+'.webp"><img alt="" class="device" src="art/'+families[a.branch]+'.webp"><span class="wire-glyph">'+a.branch+'</span><span class="book-title">'+a.name+'</span><small class="wire-wear">'+condition+'</small></span>';
}
function tag(text){return '<span class="small-tag">'+text+'</span>'}
function title(hint,heading,aux=''){return '<div class="room-title"><div>'+tag(hint)+'<h1 tabindex="-1">'+heading+'</h1></div>'+aux+'</div>'}
function shelf(){
 const budget=2-logs.size;
 const books=specimens.map(([name,pages,,owned],i)=>{
  const a=byName.get(name),[,condition]=bindingState(pages);
  return '<button class="shelf-item" data-open="'+i+'" aria-label="翻閱《'+name+'》，'+a.branch+'，'+ranks[a.rank]+'品，'+condition+'，已有'+owned.length+'冊">'+volume(a,pages)+
   '<span class="volume-foot">'+(logs.has(i)?'已入囊':owned.length?'舊藏 '+owned.length+' 冊':'初見此譜')+'</span></button>';
 }).join('');
 return title('渡口 · 戰後拾遺','挑選秘笈','<p class="allowance">尚可取 <b>'+budget+'</b> 冊</p>')+
  '<div class="shelf">'+books+'</div><div class="shelf-base"><span>翻起一冊，與舊藏對讀。</span><details><summary>辨認書衣</summary><div><b>品階</b>　靛青 · 下三品　玉綠 · 中三品　赭金 · 上三品<br><b>書況</b>　整齊線裝 → 補綴缺角 → 散頁斷線<br><b>書上印記</b>　'+Object.entries(families).map(([key,id])=>'<span class="legend-icon"><img alt="" src="art/'+id+'.webp">'+key+'</span>').join('')+'</div></details></div>';
}
function card(a){return '<div class="target-card">'+cardFace(a)+'</div>'}
function instruction(a,line,q){
 const [start,end]=manualVerses[a.name][line];
 return q===0?'<span class="lacuna" aria-label="全句缺失"></span>':start+'，'+(q===2?end+'。':'<span class="lacuna half" aria-label="下半句缺失"></span>');
}
function study(){
 const a=byName.get(specimens[index][0]),sources=copies(),pages=selectedPages(),odds=gateOdds(state,a,pages),rec=logs.get(index);
 const seeOriginal=inspected!==null,read=seeOriginal?sources[inspected][1]:pages;
 const chapterList=chapters.map((n,i)=>{
  const fixed=!seeOriginal&&chosen.has(0)&&chosen.size>1&&pages[i]>sources[0][1][i];
  const phase=rec&&!seeOriginal?(i>=rec.rolls.length?'未至':rec.failed===i?'失手':'已通'):null;
  return '<li data-q="'+read[i]+'"><span class="chapter-number">'+n+'</span><span class="stanza">'+instruction(a,i,read[i])+'</span><small class="impression">'+(phase|| (fixed?'補':'') )+'</small></li>';
 }).join('');
 const candidateList=sources.map(([label,p],i)=>'<div class="source-row"><button data-look="'+i+'" class="little-copy" aria-label="翻閱原本：'+label+'">'+volume(a,p)+'</button><span class="source-caption"><small>'+(i===0?'新得':'書囊')+'</small><b>'+label+'</b><span class="coverage" aria-label="'+p.map(v=>['缺','殘','全'][v]).join('、')+'">'+p.map(v=>'<i data-q="'+v+'"></i>').join('')+'</span></span><button class="use-copy" data-use="'+i+'" aria-pressed="'+chosen.has(i)+'" aria-label="'+(chosen.has(i)?'移出':'加入')+label+'" '+(rec?'disabled':'')+'>'+(chosen.has(i)?'✓':'＋')+'</button></div>').join('');
 const chance=rec?rec.odds.reduce((n,p)=>n*p/100,100):trainingChance(state,a,pages);
 const train=rec?(rec.failed<0?'學成入牌組':'止於第'+chapters[rec.failed]+'篇'):logs.size>=2?'本場已取兩冊':!chosen.size?'先選參校本':'收下此冊，試演';
 return title('渡口 · 校書案',a.name,'<button data-do="shelf" class="return">‹ 回書攤</button>')+
 '<div class="workbench"><section class="payoff"><h2>'+(rec?.failed===-1?'已加入牌組':'學成招式')+'</h2>'+card(a)+'<p>'+ranks[a.rank]+'品 · '+a.branch+'</p></section>'+
 '<section class="reading"><div class="paper"><div class="paper-head"><span class="chop">'+(seeOriginal?'原':'校')+'</span><div><small>'+a.name+'</small><h2>'+(seeOriginal?sources[inspected][0]:'合校稿')+'</h2></div></div><ol>'+chapterList+'</ol></div>'+
 (seeOriginal?'<button data-do="joined" class="read-back">看合校稿</button>':'')+'</section>'+
 '<section class="sources"><h2>參校抄本 <small>'+chosen.size+'／'+sources.length+'</small></h2>'+candidateList+'<p>點書可翻閱，勾選即參校。</p></section></div>'+
 '<div class="judgment"><div><small>練成把握</small><strong>'+(chosen.size?Number(chance.toFixed(1))+'%':'—')+'</strong></div><div class="gates"><span>'+(rec?(rec.failed<0?'六式連成，招式已入牌組。':'抄本仍在，今次試演已用。'):'六篇依次試演，全部通過即學成。')+'</span><div>'+odds.map((p,i)=>'<small>'+chapters[i]+'　'+(rec?rec.odds[i]:chosen.size?p:'—')+(chosen.size?'%':'')+'</small>').join('')+'</div></div><button class="apply" data-do="train" '+(rec||logs.size>=2||!chosen.size?'disabled':'')+'>'+train+'</button></div>';
}
function render(focus=false){
 document.body.dataset.mode=mode;stage.dataset.screen=screen;
 stage.innerHTML=screen==='shelf'?shelf():study();
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 const url=new URL(location.href);url.searchParams.set('mode',mode);url.searchParams.set('screen',screen);history.replaceState(null,'',url);
 if(focus)stage.querySelector('h1').focus({preventScroll:true});
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.mode){mode=b.dataset.mode;render();return}
 if(b.dataset.open!=null){openBook(+b.dataset.open);return}
 if(b.dataset.do==='references'){document.querySelector('#references').showModal();return}
 if(b.dataset.do==='reset'){reset();screen='shelf';render(true);return}
 if(b.dataset.do==='shelf'){screen='shelf';render(true);return}
 if(b.dataset.look!=null)inspected=+b.dataset.look;
 else if(b.dataset.use!=null){const i=+b.dataset.use;chosen.has(i)?chosen.delete(i):chosen.add(i);inspected=null}
 else if(b.dataset.do==='joined')inspected=null;
 else if(b.dataset.do==='train'){
  if(!chosen.size||logs.has(index)||logs.size>=2)return;
  const a=byName.get(specimens[index][0]);
  // The catalogue is a fixture; the six checks and the awarded card use the journey rules.
  const editions=copies(),run=structuredClone(state);run.books[a.name]=editions.filter((_,i)=>chosen.has(i)).map(c=>c[1]);
  const passed=rehearse(run,a,0,Math.random);if(passed)equip(run,a);
  state.books[a.name]=withCopy(a,editions.slice(1).map(c=>c[1]),editions[0][1]);
  state.learned=run.learned;state.equipped=run.equipped;state.gateNotes=run.gateNotes;
  logs.set(index,run.lastPractice);choices.set(index,[...chosen]);inspected=null;
 }else return;
 render();const key=b.dataset.use!=null?'[data-use="'+b.dataset.use+'"]':b.dataset.look!=null?'[data-look="'+b.dataset.look+'"]':null;
 if(key)stage.querySelector(key)?.focus({preventScroll:true});
});
render();
