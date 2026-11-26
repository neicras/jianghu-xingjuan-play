import {byName,ranks} from '../catalogue.js';
import {cardFace} from '../card-face.js';
import {collate,chapters,withCopy} from '../manuscripts.js';
import {gateOdds,trainingChance,rehearse,equip} from '../rules.js';
import {bindingState} from '../bound-book.js';
import {manualVerses} from '../manual-verses.js';
import {reviewJourney} from '../review-frames.js';

const specimens=[
 ['武當丹劍',[2,0,2,1,2,0],'渡口手記',[['隨身舊譜',[2,2,0,2,1,2]]]],
 ['八卦步',[2,2,2,2,2,1],'師兄手抄',[['雨中散頁',[0,0,1,0,0,2]]]],
 ['太極拳',[2,0,0,1,0,0],'拳架殘頁',[['山房舊錄',[0,2,0,0,1,0]],['師叔眉批',[0,0,2,1,0,1]]]],
 ['武當鐵布衫',[2,2,1,0,2,0],'拳師袖本',[]],
 ['太乙雲拂功',[0,1,0,2,0,1],'雲房散葉',[['藏經抄本',[1,0,2,0,2,0]]]]
];
const params=new URLSearchParams(location.search),stage=document.querySelector('#stage');
let mode=params.get('mode')==='wire'?'wire':'art',screen=params.get('screen')==='study'?'study':'shelf';
let index=0,state,choices,logs,inspected,chosen;
const beatMs=720;
let playback=null,ticker=0;
function endPlayback(){clearTimeout(ticker);playback=null}
function advancePlayback(){
 if(!playback)return;
 const record=logs.get(index);
 playback.step++;
 if(playback.step>=record.rolls.length){endPlayback();render();return}
 updateMarks(record);ticker=setTimeout(advancePlayback,beatMs);
}
function startPlayback(){
 endPlayback();
 if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  playback={step:0};ticker=setTimeout(advancePlayback,beatMs);
 }
}
// Only the current verse moves. Finished verses hold a single ink pose.
const motionStrip={'劍法':0,'身法':2,'拳掌':3,'護體':3,'軟兵':1};
function updateMarks(record){
 const strip=motionStrip[byName.get(specimens[index][0]).branch];
 const live=stage.querySelector('[data-current-verse]');
 if(live&&playback)live.textContent='第'+chapters[playback.step]+'式';
 stage.querySelectorAll('[data-practice-row]').forEach((mark,i)=>{
  const settled=!playback||i<playback.step;
  const fallen=i===record.failed;
  const status=settled?(i>=record.rolls.length?'unreached':fallen?'fallen':'passed')
   :i===playback.step?(fallen?'falling':'moving'):'waiting';
  if(mark.dataset.pose===status)return;
  mark.dataset.pose=status;
  mark.style.setProperty('--strip-y',((fallen&&['fallen','falling'].includes(status)?5:settled?3:strip)/5*100)+'%');
  mark.setAttribute('aria-label','第'+chapters[i]+'篇 · '+({waiting:'待演',unreached:'未練到',moving:'試演中',falling:'失手',passed:'已通',fallen:'失手'}[status]));
 });
}
const category=a=>a.branch==='身法'?'輕功':a.branch;
function identity(a){return '武當派 · '+category(a)+' · '+ranks[a.rank]+'品'}

function reset(){endPlayback();state=reviewJourney('books');choices=new Map();logs=new Map();inspected=null;chosen=new Set([0]);index=0}
reset();
function copies(){const [,pages,title,owned]=specimens[index];return [[title,pages],...owned]}
function openBook(i){endPlayback();index=i;screen='study';inspected=null;chosen=new Set(choices.get(i)||[0]);render(true)}
function selectedPages(){return collate(copies().filter((_,i)=>chosen.has(i)).map(c=>c[1]))}
// Each illustration has its own measured title slip. Coordinates are percentages
// of the trimmed painting, so titles stay on the paper as the object resizes.
const editions={
 '武當丹劍':['sword-worn','sword-sound'],
 '八卦步':['step-sound','step-torn'],
 '太極拳':['palm-torn','palm-notes','palm-torn'],
 '武當鐵布衫':['guard-worn'],
 '太乙雲拂功':['whisk-torn','whisk-worn']
};
const materials={sound:'線裝秘笈',worn:'補綴抄本',torn:'散頁殘卷'};
function volume(a,pages,source=0){
 const [wear]=bindingState(pages),id=editions[a.name][source];
 const label=id==='whisk-torn'?'<span>太乙</span><span>雲拂功</span>':'<span>'+a.name+'</span>';
 return '<span class="volume edition edition-'+id+'" data-wear="'+wear+'"><img alt="" class="binding" src="art/editions/'+id+'.webp"><span class="wire-glyph">'+category(a)+'</span><span class="book-title">'+label+'<i class="sect-seal" aria-hidden="true">武當</i></span><small class="wire-wear">'+materials[wear]+'</small></span>';
}
function tag(text){return '<span class="small-tag">'+text+'</span>'}
function title(hint,heading,aux=''){return '<div class="room-title"><div>'+tag(hint)+'<h1 tabindex="-1">'+heading+'</h1></div>'+aux+'</div>'}
function shelf(){
 const budget=2-logs.size;
 const books=specimens.map(([name,pages,,owned],i)=>{
  const a=byName.get(name),[wear]=bindingState(pages);
  const count=logs.has(i)?state.books[name].length:owned.length;
  const ownership=count?'書囊已有 '+count+' 冊':'尚未收藏';
  return '<button class="shelf-item" data-open="'+i+'" aria-label="翻閱《'+name+'》，'+identity(a)+'，'+materials[wear]+'，'+ownership+'">'+volume(a,pages)+
   '<span class="volume-foot"><b>'+identity(a)+'</b><small>'+materials[wear]+' · '+ownership+'</small></span></button>';
 }).join('');
 return title('渡口 · 戰後拾遺','挑選秘笈','<p class="allowance">尚可取 <b>'+budget+'</b> 冊</p>')+
  '<div class="shelf">'+books+'</div><div class="shelf-base"><span>翻開一冊，可與書囊裡的同門抄本對讀。</span><details><summary>辨認書衣</summary><div class="dye-key"><span><i></i>靛青　下三品</span><span><i></i>玉綠　中三品</span><span><i></i>赭金　上三品</span></div></details></div>';
}
function card(a){return '<div class="target-card">'+cardFace(a)+'</div>'}
function instruction(a,line,q,base=q){
 const [start,end]=manualVerses[a.name][line];
 const patch=t=>'<span class="mended" title="這段由另一份抄本接回">'+t+'</span>';
 if(!q)return '<span class="lacuna" aria-label="全句缺失"></span>';
 const first=start+'，',last=end+'。';
 if(q===2&&base===0)return patch(first+last);
 return (base===0?patch(first):first)+(q===2?(base===1?patch(last):last):'<span class="lacuna half" aria-label="下半句缺失"></span>');
}
const conditionNames=['缺頁','殘頁','完整'];
function leafStrip(pages){
 const desc=pages.map((q,i)=>'第'+chapters[i]+'篇'+conditionNames[q]).join('、');
 return '<span class="coverage" role="img" aria-label="'+desc+'" title="'+desc+'">'+pages.map((q,i)=>'<i data-q="'+q+'" aria-hidden="true">'+chapters[i]+'</i>').join('')+'</span>';
}
function verdict(a,pages,odds,rec){
 const button=(action,text,disabled=false)=>'<button class="apply" data-do="'+action+'" '+(disabled?'disabled':'')+'>'+text+'</button>';
 if(playback)return '<span class="decision-note">循譜試演</span><strong data-current-verse>第一式</strong>';
 if(rec)return '<div class="decision-result"><strong>'+(rec.failed<0?'六式連成':'止於第'+chapters[rec.failed]+'式')+'</strong><span>'+(rec.failed<0?'《'+a.name+'》已加入牌組。':'這次未能學成，抄本已收入書囊。')+'</span></div>'+button('shelf','回書攤');
 if(!chosen.size)return '<span>從手邊選一份抄本，攤開來對讀。</span>'+button('train','收下試演',true);
 const weakest=odds.indexOf(Math.min(...odds));
 const clue=pages[weakest]===0?'第'+chapters[weakest]+'篇失傳，這一式要自行推敲。':
  pages[weakest]===1?'第'+chapters[weakest]+'篇只剩半句，這一式未有十足把握。':
  odds[weakest]<100?'第'+chapters[weakest]+'式尚欠《'+a.parent+'》的根基。':'六篇口訣俱全，可以一氣練成。';
 return '<div class="decision-chance"><small>練成把握</small><strong>'+trainingChance(state,a,pages)+'%</strong></div><span class="decision-note">'+clue+'</span>'+button('train',logs.size>=2?'本場已取兩冊':'收下試演',logs.size>=2);
}
function study(){
 const a=byName.get(specimens[index][0]),sources=copies(),pages=selectedPages(),odds=gateOdds(state,a,pages),rec=logs.get(index);
 const seeOriginal=inspected!==null,read=seeOriginal?sources[inspected][1]:pages;
 const first=sources.find((_,i)=>chosen.has(i));
 const chapterList=chapters.map((n,i)=>{
  const base=seeOriginal||!first?read[i]:first[1][i];
  const mark=rec&&!seeOriginal?'<span class="practice-mark" data-practice-row="'+i+'" role="img"></span>':'';
  return '<li data-q="'+read[i]+'"><span class="chapter-number">'+n+'</span><span class="stanza">'+instruction(a,i,read[i],base)+'</span>'+mark+'</li>';
 }).join('');
 const candidateList=sources.map(([label,p],i)=>'<div class="source-row"><button data-look="'+i+'" class="little-copy" aria-label="翻閱原本：'+label+'">'+volume(a,p,i)+'</button><span class="source-caption"><small>'+(i===0?'本次拾得':'來自書囊')+'</small><b>'+label+'</b>'+leafStrip(p)+'</span><button class="use-copy" data-use="'+i+'" aria-pressed="'+chosen.has(i)+'" aria-label="'+(chosen.has(i)?'移出':'加入')+label+'" '+(rec?'disabled':'')+'>'+(chosen.has(i)?'✓':'＋')+'</button></div>').join('');
 return title('校書案　／　'+identity(a),a.name,'<button data-do="shelf" class="return">‹ 回書攤</button>')+
 '<div class="workbench"><section class="payoff"><h2>'+(!playback&&rec?.failed===-1?'已加入牌組':'學成招式')+'</h2>'+card(a)+'</section>'+
 '<section class="reading"><div class="paper"><div class="paper-head"><span class="chop">'+(seeOriginal?'原':'校')+'</span><div><small>'+a.name+'</small><h2>'+(seeOriginal?sources[inspected][0]:'合校稿')+'</h2></div></div><ol>'+chapterList+'</ol></div>'+
 (seeOriginal?'<button data-do="joined" class="read-back">看合校稿</button>':'')+'</section>'+
 '<section class="sources"><h2>參校抄本 <small>'+chosen.size+'／'+sources.length+'</small></h2>'+candidateList+'<div class="leaf-key">'+conditionNames.map((text,q)=>'<span><i data-q="'+q+'"></i>'+text+'</span>').join('')+'</div><p>翻書看原文，繫繩來參校。</p></section></div>'+
 '<div class="judgment" aria-live="polite">'+verdict(a,pages,odds,rec)+'</div>';
}
function render(focus=false){
 document.body.dataset.mode=mode;stage.dataset.screen=screen;
 stage.innerHTML=screen==='shelf'?shelf():study();
 if(screen==='study'&&logs.has(index))updateMarks(logs.get(index));
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
 if(b.dataset.do==='shelf'){endPlayback();screen='shelf';render(true);return}
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
  logs.set(index,run.lastPractice);choices.set(index,[...chosen]);inspected=null;startPlayback();
 }else return;
 render();const key=b.dataset.use!=null?'[data-use="'+b.dataset.use+'"]':b.dataset.look!=null?'[data-look="'+b.dataset.look+'"]':null;
 if(key)stage.querySelector(key)?.focus({preventScroll:true});
});
render();
