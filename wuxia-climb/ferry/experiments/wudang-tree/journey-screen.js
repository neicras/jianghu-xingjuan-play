import {trailTools,wallet,objectImage} from './trail-hud.js';
import {cover} from './bound-book.js';
import {atlas} from './route-scroll.js';
import {supportArt} from './art-library/support-files.js';
import {newJourney,gift,enter,finishFight,receive,train,rest,leave,prepareJourney,lessons,drill,goods,spoils,pack,useItem,wares,apothecary,buyMedicine,purchaseLimit,bagCapacity,escort,storyAt,storyLimit,marketRanges,stockAt,buyAtStall} from './journey.js';
import {play,endRound,settleChoice} from './combat.js';
import {manual,navigateRegister} from './manual.js';
import {editionSheet} from './book-view.js';
import {arena,paintBout,animateBout,pileSheet} from './arena.js';
import {displayBookDialog} from './rewards-view.js';
import {rehearsalResult} from './rehearsal.js';
import {deck,picksLeft,attemptFee,claimReward,trainingChance,ready,equip} from './rules.js';
import {estimate,reroll} from './manuscripts.js';
import {frames,reviewJourney} from './review-frames.js';
import {effect,byName} from './catalogue.js';
import {keywords,statuses,marked,glyph} from './vocabulary.js';
import {cardFace} from './card-face.js';

import {merchant} from './merchant.js';
import {departure,rewardPile,gearOffers,ending} from './journey-plates.js';
let heldWare=null, seat='sword';

const key='wudang-journey-15-v1',$=id=>document.getElementById(id);
const requestedFrame=new URLSearchParams(location.search).get('preview');
const preview=frames.some(([id])=>id===requestedFrame)?requestedFrame:null;
const record=preview?()=>{}:(await import('./journey-log.js')).record;
let s=preview?reviewJourney(preview,new URLSearchParams(location.search).get('sample')):newJourney(),animating=false,reading=preview==='tree',fromBooks=false,selected='武當丹劍';
if(!preview)try{const saved=JSON.parse(localStorage.getItem(key));if(saved?.route)s=saved}catch{}
prepareJourney(s);
function save(){if(preview)return;try{localStorage.setItem(key,JSON.stringify(s))}catch{}}
record(s,s.route.journalId?'resume':s.route.phase==='gift'?'start':'resume-old-save');save();
const btn=(action,label,style='',off=false)=>'<button data-action="'+action+'" class="'+style+'" '+(off?'disabled':'')+'>'+label+'</button>';
const pane=(heading,copy,actions)=>'<section class="way-room"><h2>'+heading+'</h2><p>'+copy+'</p>'+actions+'</section>';
function modal(content){
 const folio=$('folio'),pages=$('pages');pages.innerHTML=content;
 if(!folio.open)folio.showModal();
 const heading=pages.querySelector('h2');
 if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}
 folio.scrollTop=0;pages.scrollTop=0;
}
let browsing,lessonName;
function bookDialog(returnTo){displayBookDialog(s,btn,browsing,returnTo)}
function shelveBook(){const previous=browsing;browsing=null;bookDialog(previous)}
$('book-choice').addEventListener('cancel',e=>{if(browsing){e.preventDefault();shelveBook()}});

function fieldGuide(term){
 const definitions=entries=>Object.entries(entries).map(([name,text])=>'<dt id="rule-'+name+'" class="'+(name===term?'reading-rule':'')+'">'+name+'</dt><dd>'+text+'</dd>').join('');
 const pile=s.bout;
 modal('<h2>招式與狀態</h2><div class="guide-cols"><section><h3>卡牌關鍵字</h3><dl>'+definitions(keywords)+'</dl></section><section><h3>人物狀態</h3><dl>'+definitions(statuses)+'</dl></section></div>'+
 '<h3>本場傷勢</h3><div class="injury-cards">'+['劍傷','岔氣'].map(n=>'<div>'+cardFace(byName.get(n))+(pile?'<small>'+[['手牌',pile.hand],['抽牌堆',pile.draw],['棄牌堆',pile.discard],['消耗堆',pile.exhaust]].map(([label,cards])=>label+' '+cards.filter(c=>c.name===n).length).join(' · ')+'</small>':'')+'</div>').join('')+'</div>');
 if(term)document.getElementById('rule-'+term)?.scrollIntoView({block:'nearest'});
}
function itemIcon(name){
 const tile=wares[name].tile;
 return '<img alt="" class="item-icon jp-ware" src="'+supportArt("item-"+tile)+'">';
}
$('trail-tools').innerHTML=trailTools();
function belt(){
 const slots=Array.from({length:bagCapacity},(_,i)=>{
  const name=s.bag[i];
  if(!name)return '<span class="vial-slot vacant" role="img" aria-label="空藥格">'+objectImage('item-7')+'</span>';
  return '<button class="vial-slot" data-action="vial/'+i+'" aria-label="查看'+name+'" title="'+name+'">'+itemIcon(name)+'</button>';
 });
 const worn=s.relics.filter(name=>wares[name]&&wares[name].kind!=='藥物');
 const icons=worn.map(name=>'<button class="vial-slot" data-action="worn/'+name+'" title="'+name+'" aria-label="查看'+name+'">'+itemIcon(name)+'</button>');
 return slots.join('')+(icons.length?'<i class="belt-divider" aria-hidden="true"></i>'+icons.join(''):'');
}
function medicine(index){
 const name=s.bag[index],b=s.bout;if(!name)return;
 const canUse=b?.phase==='playing'&&!b.pending;
 const usable=canUse&&(name!=='金創藥'||b.hp<b.maxHp);
 const guidance=!canUse?'比武出招時可以使用。':name==='金創藥'&&b.hp===b.maxHp?'氣血已滿。':'使用後藥囊會空出一格，不耗內力。';
 const action=name==='金創藥'?'敷上金創藥':'向'+(b?.foes[b.target]?.name||'對手')+'撒藥';
 modal('<div class="item-detail">'+itemIcon(name)+'<div><h2>'+name+'</h2><p>'+marked(goods[name])+'</p></div></div><p>'+guidance+'</p>'+(canUse?btn('use/'+index,action,'primary',!usable):''));
}
function inventory(){
 const list=kind=>Object.entries(wares).filter(([,w])=>w.kind===kind).map(([n,w])=>{
  const count=kind==='藥物'?s.bag.filter(x=>x===n).length:Number(s.relics.includes(n));
  return '<li data-grade="'+w.grade+'" class="'+(count?'owned':'')+'"><details><summary>'+itemIcon(n)+'<strong>'+n+'</strong>'+(count?'<small class="owned-mark">攜有 '+count+'</small>':'')+'</summary><p>'+marked(w.text)+'</p><small>'+w.grade+' · '+w.source+(n in marketRanges?'／山道貨郎':'')+'</small></details></li>';
 }).join('');
 modal('<h2>行囊圖錄</h2><div class="kit-trays">'+['裝備','信物','藥物'].map(kind=>'<section><h3>'+kind+'</h3><ul class="wares">'+list(kind)+'</ul></section>').join('')+'</div>');
}
function deckDialog(){
 const cards=deck(s),variants=[...new Map(cards.map(c=>[c.name+':'+s.stars.includes(c.id),c])).values()],canEquip=['map','inn','school','reward','cache'].includes(s.route.phase);
 modal('<h2>本輪牌組 · '+cards.length+' 張</h2><div class="travel-deck">'+variants.map(c=>{const star=s.stars.includes(c.id);return '<div>'+cardFace(byName.get(c.name),star)+'<small>× '+cards.filter(x=>x.name===c.name&&s.stars.includes(x.id)===star).length+'</small></div>'}).join('')+'</div>'+
 (canEquip&&s.learned.length?'<h3>已學功法</h3>'+s.learned.map(n=>btn('equip/'+n,(s.equipped.includes(n)?'移出':'加入')+'《'+n+'》')).join(''):''));
}
function practiceCopies(){
 return deck(s).concat(s.learned.filter(n=>!s.equipped.includes(n)).map(name=>({id:name,name})));
}
function copyLabel(c){
 const copies=deck(s).filter(x=>x.name===c.name);
 if(copies.length>1)return '第 '+(copies.findIndex(x=>x.id===c.id)+1)+' 張／共 '+copies.length+' 張';
 return copies.length?'本輪牌組':'已學未入組';
}
function practiceShelf(){
 const cards=practiceCopies().map(c=>{
  const star=s.stars.includes(c.id),a=byName.get(c.name);
  return btn('compare/'+c.id,cardFace(a,star)+'<small>'+copyLabel(c)+(star?' · 已精練':'')+'</small>','shelf-card');
 }).join('');
 modal('<h2>後院練招</h2><p>挑一張牌，看清練成後有甚麼分別。</p><div class="practice-shelf">'+cards+'</div>');
}
function compareCopy(id){
 const c=practiceCopies().find(c=>c.id===id);if(!c)return;
 const a=byName.get(c.name),already=s.stars.includes(id);
 modal('<div class="practice-heading"><h2>'+a.name+'</h2><span>'+copyLabel(c)+'</span>'+btn('innBack','返回客棧','ink-action')+'</div>'+
 '<div class="practice-layout"><div class="practice-pair"><figure><figcaption>精練前</figcaption>'+cardFace(a)+'</figure><span aria-hidden="true">→</span><figure><figcaption>精練後</figcaption>'+cardFace(a,true,a.cost,effect(a,true,true))+'</figure></div>'+
 '<div class="practice-notes">'+
 '<div class="practice-actions">'+btn('shelf','重選招式','ink-action')+' '+btn('polish/'+id,already?'這張已精練':'精練這張牌並上路','primary',already)+'</div></div></div>');
}
function inn(){
 const hp=Math.min(s.route.maxHp-s.route.hp,Math.ceil(s.route.maxHp*.3));
 return '<section class="jp-room jp-inn"><h2>山腳客棧</h2><div class="jp-rooms">'+
  btn('nap','<b>回房歇息</b><small>回復 '+hp+' 點氣血</small>')+btn('dispensary','<b>拜訪郎中</b><small>買藥或聽醫案</small>')+
  btn('shelf','<b>後院練招</b><small>精練一張牌</small>')+'</div><p class="inn-sign">明早趕路，今晚只夠辦一件事。</p></section>';
}
function dispensary(){
 const offers=Object.entries(apothecary).map(([n,cost])=>{
  const why=purchaseLimit(s,n,cost);
  return btn('innBuy/'+n,itemIcon(n)+'<span><strong>'+n+' · '+cost+' 文</strong><small>'+goods[n]+'</small><small>'+(why||'購下並上路')+'</small></span>','item-offer',!!why);
 }).join('');
 modal('<h2>客棧藥攤</h2><p>郎中明早便要出診。你可以買下一件帶走，也可以留下陪他整理藥案。身上有 '+s.gold+' 文。</p><div class="stall">'+offers+'</div>'+btn('rest/casebook','留下聽醫案 · 得 4 點歷練並上路'));
}
function eventRoom(){
 const story=storyAt(s);
 const scene={ledger:supportArt('journey-letter'),lesson:supportArt('journey-boxing'),porter:supportArt('ferry')}[story.image];
 const actions=story.choices.map(c=>{
  const result=[['氣血',c.hp],['銅錢',c.gold],['歷練',c.xp]].filter(([,v])=>v).map(([k,v])=>k+' '+(v>0?'+':'−')+Math.abs(v));
  if(c.item)result.push(c.item+' ×1');
  const why=storyLimit(s,c);
  return btn('escort/'+c.id,'<strong>'+c.label+'</strong><small>'+result.join('，')+(why?' · '+why:'')+'</small>','story-choice',!!why);
 }).join('');
 return '<section class="jp-room jp-event" style="--scene:url('+scene+')"><div><h2>'+story.name+'</h2><p>'+story.text+'</p>'+actions+' '+btn('leave','告辭上路')+'</div></section>';
}
function treeButton(action,label,style,disabled){
 const [act,name]=action.split('/'),r=s.route;
 if(act==='tab')return name==='fight'?btn('closeTree',fromBooks?'返回選秘笈':'返回本站','exit-link'):name==='deck'?btn('deck','我的牌組','exit-link'):'';
 if(act==='equip')return btn('toggle/'+name,label,style,!['map','inn','school','reward','cache'].includes(r.phase));
 if(act==='focus')return '';
 if(act==='study'||act==='star')return act==='star'?'<small>在客棧後院精練</small>':'';
 return btn(action,label,style,disabled);
}
function render(){
 const r=s.route,b=s.bout;
 $('progress').textContent=r.floor+' / 15';
 $('progress').parentElement.setAttribute('aria-label','江湖路線，第 '+r.floor+' 站，共十五站');
 $('balance').innerHTML=wallet(b?.hp??r.hp,r.maxHp,s.xp,s.gold);
 $('potion-belt').innerHTML=belt();
 document.body.classList.toggle('studying',reading);
 document.body.classList.toggle('jp-active',!reading&&(['gift','reward','inn','won','lost','school','map'].includes(r.phase)||(r.phase==='cache'&&r.floor===2)));
 document.body.classList.toggle('at-market',!reading&&r.phase==='cache'&&r.floor!==2);
 if(reading){$('room').innerHTML=manual(s,byName.get(selected),treeButton);return}
 let html='';
 switch(r.phase){
 case 'gift':html=departure(seat,btn);break;
 case 'map':html=atlas(r);break;
 case 'fight':html=arena(s,btn);break;
 case 'reward':html=rewardPile(s,btn);break;
 case 'inn':html=inn();break;
 case 'school':{
  const shelf=lessons(s),chosen=shelf.find(row=>row.a.name===lessonName)||shelf[0];
  const volumes=shelf.map(({a,borrowed})=>'<button class="lesson-volume" data-action="lesson/'+a.name+'" aria-label="翻閱《'+a.name+'》" aria-pressed="'+(a===chosen?.a)+'">'+cover(a)+'<small>'+(borrowed?'師兄講義':'隨身藏書')+'</small></button>').join('');
  const notes=chosen?'<strong>'+chosen.a.name+'</strong><p>'+effect(chosen.a)+'</p><small>練成把握 '+trainingChance(chosen.preview,chosen.a)+'%　·　學成用 '+chosen.cost+' 歷練，失手用 '+attemptFee(chosen.cost)+'</small>':'<strong>切磋所學</strong><p>今日可跟師兄拆招，增長歷練。</p>';
  html='<section class="school-court"><div class="school-title"><h2>師門請益</h2></div><div class="lesson-shelf" aria-label="可請教的功法">'+volumes+'</div><div class="school-slip"><div>'+notes+'</div>'+ (chosen?btn('train/'+chosen.a.name,s.xp<chosen.cost?'尚欠 '+(chosen.cost-s.xp)+' 歷練':'請師兄指點','red-seal',s.xp<chosen.cost):'')+'</div><div class="lesson-links"><span>本次只可請益或拆招一次</span>'+btn('drill','跟師兄拆招 · 得 8 歷練')+btn('leave','辭別上路')+'</div></section>';break;
 }
 case 'cache':html=r.floor===2?eventRoom():merchant(s,heldWare,true);break;
 case 'won':case 'lost':html=ending(s,btn);break;
 }
 $('room').innerHTML=html;
 if(r.phase==='fight')paintBout(b);
}
document.addEventListener('click',async e=>{
 if(animating)return;
 const term=e.target.closest('.battle-hand .rule-word,.travel-deck .rule-word');
 if(term){fieldGuide(term.textContent);return}
 const button=e.target.closest('button[data-action]');if(!button||button.disabled)return;
 const [action,v,i]=button.dataset.action.split('/'),r=s.route,b=s.bout;
 const previous=s,prior={floor:r.floor,phase:r.phase,turn:b?.turn,target:b?.target,hand:b?.hand.map(c=>c.id),label:button.getAttribute('aria-label')||button.textContent};
 try{
 if(action==='worn'&&s.relics.includes(v)&&wares[v]){
  modal('<div class="item-detail">'+itemIcon(v)+'<div><h2>'+v+'</h2><small>'+wares[v].kind+' · 隨身生效</small><p>'+marked(goods[v])+'</p></div></div>');return
 }
 if(action==='tally'){modal('<h2>隨身盤點</h2><dl class="tally"><dt>氣血</dt><dd>'+(b?.hp??r.hp)+'／'+r.maxHp+'</dd><dt>歷練</dt><dd>'+s.xp+' 點</dd><dt>盤纏</dt><dd>'+s.gold+' 文</dd></dl>');return}
 if(action==='kit'){inventory();return}
 if(action==='pile'&&b){modal(pileSheet(b,v));return}
 if(action==='guide'){fieldGuide();return}
 if(r.phase==='inn'){
  if(action==='innBack'){$('folio').close();return}
  if(action==='shelf'){practiceShelf();return}
  if(action==='compare'){compareCopy(v);return}
  if(action==='dispensary'){dispensary();return}
  if(action==='nap'){modal('<h2>回房歇息</h2><p>卸下行裝，安心睡到天亮。氣血 '+r.hp+' → '+Math.min(r.maxHp,r.hp+Math.ceil(r.maxHp*.3))+'／'+r.maxHp+'。</p>'+btn('rest/heal','就寢，明早上路','primary'));return}
  if(action==='innBuy'&&buyMedicine(s,v))$('folio').close();
 }
 if(action==='inspectWare'&&r.phase==='cache'&&r.floor!==2&&Object.hasOwn(stockAt(s),v)){
  heldWare=v;render();$('room').querySelector('.mk-lot[aria-pressed=true]')?.focus({preventScroll:true});return;
 }
 if(action==='buy'&&buyAtStall(s,v)){
  heldWare=v;render();$('room').querySelector('.mk-lot[aria-pressed=true]')?.focus({preventScroll:true});return;
 }
 if(action==='escort')escort(s,v);
 if(action==='vial'){medicine(Number(v));return}
 if(action==='swap'&&spoils(s).includes(v)&&wares[v].kind==='藥物'&&s.bag.length===bagCapacity){
  modal('<h2>騰一格給'+v+'</h2><p>選一份藥留下。合上便保留現有三份藥。</p>'+s.bag.map((n,j)=>btn('replace/'+v+'/'+j,itemIcon(n)+' 留下'+n,'item-offer')).join(''));return
 }
 if(action==='replace'&&pack(s,v,Number(i)))$('folio').close();
 if(action==='lesson'&&r.phase==='school'){lessonName=v;render();$('room').querySelector('.lesson-volume[aria-pressed=true]')?.focus({preventScroll:true});return}
 if(action==='drill')drill(s);
 if(action==='pickGear'&&r.phase==='reward'){modal(gearOffers(s,Number(v),btn));return}
 if(action==='pack'&&pack(s,v)&&$('folio').open)$('folio').close();
 if(action==='use'&&useItem(s,Number(v))&&$('folio').open)$('folio').close();
 if(action==='tree'||action==='node'||action==='inspect'){reading=true;if(v)selected=v;render();if(v)$('room').querySelector('.technique[aria-pressed=true]')?.focus({preventScroll:true});return}
 if(action==='bookStudy'&&r.phase==='reward'&&s.offer.includes(v)){
  $('book-choice').close();fromBooks=true;reading=true;selected=v;render();return
 }
 if(action==='closeTree'){
  reading=false;render();
  if(fromBooks&&r.phase==='reward'&&picksLeft(s)>0)bookDialog();
  fromBooks=false;return
 }
 if(action==='edition'){modal(editionSheet(s,byName.get(v),Number(i)));return}
 if(action==='preview'){modal('<div class="full-card">'+cardFace(byName.get(v),s.stars.includes(v))+'</div>');return}
 if(action==='record'){modal(rehearsalResult(byName.get(v),s.lastPractice));return}
 if(action==='toggle'&&['map','inn','school','reward','cache'].includes(r.phase))equip(s,byName.get(v));
 if(action==='map'){modal('<div class="route-heading"><h2>十五站行程</h2>'+btn('restartPrompt','重新開局')+'</div>'+atlas(r));return}
 if(action==='restartPrompt'){
  modal('<h2>從頭再走一次？</h2><p>你會回到啟程前，重新選一份餞行禮。今次行程的氣血、牌組和行囊會重新開始計算。</p>'+btn('continueRun','繼續這一局','primary')+' '+btn('restart','從頭開始'));
  $('pages').querySelector('[data-action="continueRun"]').focus();return
 }
 if(action==='continueRun'){$('folio').close();return}
 if(action==='deck'){deckDialog();return}
 if(action==='equip'&&!['fight','won','lost','gift'].includes(r.phase)){equip(s,byName.get(v));deckDialog()}
 if(action==='enter'&&enter(s,Number(v))){reading=false;if($('folio').open)$('folio').close()}
 if(action==='seat'&&r.phase==='gift'){seat=v;render();$('room').querySelector('.jp-seat[aria-pressed=true]')?.focus({preventScroll:true});return}
 if(action==='gift')gift(s,v);
 if(action==='target'&&b?.phase==='playing'&&b.foes[v]?.hp>0)b.target=Number(v);
 if((action==='cast'||action==='endRound')&&b){
  animating=true;
  try{await animateBout(b,emit=>action==='cast'?play(b,v,emit):endRound(b,emit),()=>{
   if(b.phase==='lost')finishFight(s);
   save();
  })}
  finally{animating=false}
 }
 if(action==='pick'&&b)settleChoice(b,v);
 if(action==='skip'&&b)settleChoice(b);
 if(action==='collect'||b?.phase==='lost')finishFight(s);
 if(action==='claim'&&r.phase==='reward')claimReward(s,v);
 if(action==='browse'&&s.offer.includes(v)){browsing=v;bookDialog();return}
 if(action==='putBack'){shelveBook();return}
 if(action==='books'&&r.phase==='reward'&&picksLeft(s)>0){browsing=null;bookDialog();return}
 if(action==='back'){$('book-choice').close();return}
 if(action==='reroll'&&r.phase==='reward'&&reroll(s))bookDialog();
 if(action==='take'&&receive(s,v)){browsing=null;if(picksLeft(s))bookDialog();else $('book-choice').close()}
 if(action==='train'&&train(s,v))modal(rehearsalResult(byName.get(v),s.lastPractice)+'<p>'+r.last+'</p>');
 if(action==='rest'&&rest(s,v))$('folio').close();
 if(action==='polish'&&rest(s,'refine:'+v))$('folio').close();
 if(action==='leave'){heldWare=null;leave(s)}
 if(action==='restart'||(action==='retry'&&['won','lost'].includes(r.phase))){
  s=newJourney();seat='sword';reading=false;fromBooks=false;selected='武當丹劍';
  if($('folio').open)$('folio').close();
 }
 render();
 }finally{
  record(previous,button.dataset.action,prior,b&&previous.bout!==b?{outcome:b.phase,log:b.log,hp:b.hp,foes:b.foes}:null);
  if(s!==previous)record(s,'start');
  save();
 }
});
$('room').addEventListener('keydown',navigateRegister);
render();
if(preview==='books')bookDialog();
if(preview==='deck')deckDialog();
if(preview==='kit')inventory();
if(preview==='refine')compareCopy(practiceCopies()[0].id);
