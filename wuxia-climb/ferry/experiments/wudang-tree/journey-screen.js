import {trailTools,wallet,objectImage} from './trail-hud.js';
import {cover} from './bound-book.js?forms6';
import {atlas} from './route-scroll.js?forms6';
import {supportArt} from './art-library/support-files.js?branch=1';
import {newJourney,gift,enter,finishFight,receive,train,rest,innRecovery,leave,prepareJourney,lessons,drill,goods,spoils,pack,useItem,wares,apothecary,buyMedicine,purchaseLimit,bagCapacity,exploreCave,caveRisk,escort,storyAt,storyLimit,marketRanges,stockAt,buyAtStall} from './journey.js?forms6';
import {play,endRound,settleChoice} from './combat.js?forms6';
import {manual,navigateRegister} from './manual.js?forms6';
import {editionSheet} from './book-view.js?forms6';
import {arena,paintBout,animateBout,pileSheet} from './arena.js?forms6';
import {displayBookDialog} from './rewards-view.js?forms6';
import {rehearsalResult} from './rehearsal.js?forms6';
import {deck,picksLeft,attemptFee,claimReward,trainingChance,ready,equip} from './rules.js?forms6';
import {estimate,reroll} from './manuscripts.js?forms6';
import {frames,reviewJourney} from './review-frames.js?forms6';
import {descriptions} from './annotations.js?forms6';
import {effect,byName} from './catalogue.js?forms6';
import {keywords,statuses,marked,glyph} from './vocabulary.js';
import {cardFace} from './card-face.js?forms6';

import {merchant} from './merchant.js?forms6';
import {departure,rewardPile,gearOffers,ending} from './journey-plates.js?forms6';
let heldWare=null, seat='sword';

const key='wudang-journey-15-v1',$=id=>document.getElementById(id);
const requestedFrame=new URLSearchParams(location.search).get('preview');
const preview=frames.some(([id])=>id===requestedFrame)?requestedFrame:null;
const record=preview?()=>{}:(await import('./journey-log.js')).record;
let s=preview?reviewJourney(preview,new URLSearchParams(location.search).get('sample')):newJourney(),animating=false,reading=preview==='tree',fromBooks=false,selected='武當丹劍';
const gate=new URLSearchParams(location.search).get('gate');
const tempo=new URLSearchParams(location.search).get('tempo');
if(preview==='fight'&&['counter','kill','survive','break','short'].includes(tempo)){
 const response=await fetch(new URL('./tempo-drills.json',import.meta.url));
 if(!response.ok)throw Error('未能載入攻守試招');
 const drill=(await response.json())[tempo];
 if(drill){s=drill.s;s.bout.log=['對手是'+drill.target+'。你可以先出《'+drill.attack+'》，或者《'+drill.guard+'》。']}
}else if((preview==='fight'&&['1','5','10','15'].includes(gate))||(preview==='map'&&['5','10'].includes(gate))){
 const response=await fetch(new URL('./gate-drills.json',import.meta.url));
 if(!response.ok)throw Error('未能載入關口試招');
 const drills=await response.json();s=(preview==='map'?drills.approaches:drills.snapshots)[gate];
}
if(!preview)try{const saved=JSON.parse(localStorage.getItem(key));if(saved?.route)s=saved}catch{}
prepareJourney(s);
function save(){if(preview)return;try{localStorage.setItem(key,JSON.stringify(s))}catch{}}
record(s,s.route.journalId?'resume':s.route.phase==='gift'?'start':'resume-old-save');save();
const btn=(action,label,style='',off=false)=>'<button data-action="'+action+'" class="'+style+'" '+(off?'disabled':'')+'>'+label+'</button>';
const pane=(heading,copy,actions)=>'<section class="way-room"><h2>'+heading+'</h2><p>'+copy+'</p>'+actions+'</section>';
const portraitPhone=matchMedia('(orientation:portrait) and (max-width:760px)');
$('book-choice').addEventListener('toggle',event=>{
 const note=event.target;
 if(!note.matches?.('.copy-colophon[open]')||!portraitPhone.matches)return;
 const page=note.closest('.spread-pages');
 if(page)page.scrollTop+=note.getBoundingClientRect().top-page.getBoundingClientRect().top-6;
},true);
function locateTrail(root,floor){
 const trail=root.querySelector('.trail-window');
 if(!trail)return;
 const stop=floor?trail.querySelector('[data-floor="'+floor+'"]'):trail.querySelector('.available,.here');
 if(!stop)return;
 const box=stop.getBoundingClientRect(),view=trail.getBoundingClientRect();
 if(portraitPhone.matches)trail.scrollTop+=box.top-view.top-trail.clientHeight*.16;
 else trail.scrollLeft+=box.left-view.left-trail.clientWidth*.16;
}
document.addEventListener('click',event=>{
 const tab=event.target.closest('[data-map-region]');
 if(tab)locateTrail(tab.closest('.route-scroll'),tab.dataset.mapRegion);
 const route=event.target.closest('.route-scroll');
 if(route)for(const details of route.querySelectorAll('.map-tools details[open]')){
  if(!details.contains(event.target))details.open=false;
 }
});
portraitPhone.addEventListener('change',()=>requestAnimationFrame(()=>locateTrail($('folio').open?$('folio'):$('room'))));
function modal(content){
 const folio=$('folio'),pages=$('pages');pages.innerHTML=content;
 if(!folio.open)folio.showModal();
 const heading=pages.querySelector('h2');
 if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}
 folio.scrollTop=0;pages.scrollTop=0;locateTrail(pages);
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
 modal('<h2>本輪牌組 · '+cards.length+' 張</h2><div class="travel-deck">'+variants.map(c=>{const star=s.stars.includes(c.id);return '<div>'+btn('deckNote/'+c.id,cardFace(byName.get(c.name),star),'deck-leaf')+'<small>× '+cards.filter(x=>x.name===c.name&&s.stars.includes(x.id)===star).length+'</small></div>'}).join('')+'</div>'+
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
 const r=s.route,healed=r.hp+innRecovery(r);
 const place=(action,title,hint)=>btn(action,'<span class="inn-plaque"><b>'+title+'</b><small>'+hint+'</small></span>','inn-place');
 return '<section class="jp-room jp-inn"><h2>山腳客棧</h2><div class="inn-courtyard">'+
  place('nap','客房',healed===r.hp?'氣血已滿':'氣血 '+r.hp+' → '+healed)+place('dispensary','藥櫃','買藥・聽醫案')+
  place('shelf','後院','精練招式')+'</div><p class="inn-sign">今晚只夠辦一件事。</p></section>';
}
function dispensary(){
 const offers=Object.entries(apothecary).map(([n,cost])=>{
  const why=purchaseLimit(s,n,cost);
  return btn('innBuy/'+n,itemIcon(n)+'<span><strong>'+n+' · '+cost+' 文</strong><small>'+goods[n]+'</small><small>'+(why||'購下並上路')+'</small></span>','item-offer',!!why);
 }).join('');
 modal('<h2>客棧藥攤</h2><p>郎中明早便要出診。你可以買下一件帶走，也可以留下陪他整理藥案。身上有 '+s.gold+' 文。</p><div class="stall">'+offers+'</div>'+btn('rest/casebook','留下聽醫案 · 得 4 點歷練並上路'));
}
function caveRoom(){
 const finds=s.route.stop.finds,n=finds.length;
 const scene=supportArt('cave-cache'),portrait=new URL('portrait.webp',scene).href;
 const lines=['鏢囊落在洞口，幾枚銅錢滾到了你腳邊。洞裏傳來靴聲，押鏢的人恐怕還未走遠。',
  '抄本的封底寫著「分裝三袋」。裏頭那袋也許藏著同一門功夫的另一份抄本。靴聲近了。',
  '只剩最深處的一袋。洞壁上的人影晃了一下，伸手之前，你得想清楚。',
  '三個暗袋都空了。你把鏢囊擱回原處。'];
 const choices=[!n&&btn('cave/coins','<strong>拾起四文便走</strong><small>安全離開</small>'),
  n<3&&btn('cave/search','<strong>'+(n?'再搜一袋':'打開鏢囊')+'</strong><small>'+caveRisk(n)+'% 遇上追兵，突圍只得歷練</small>'),
  btn('leave',n?'帶著抄本離開':'悄悄離開')].filter(Boolean).join('');
 const books=finds.map((f,i)=>btn('caveBook/'+i,'第'+'一二三'[i]+'冊 · '+f.name,'found-copy')).join('');
 return '<section class="jp-room jp-event cave-room" style="--scene:url('+scene+');--cave-portrait:url('+portrait+')"><div><h2>山洞遺鏢</h2><p>'+lines[n]+'</p>'+choices+(n?'<aside>翻閱所得　'+books+'</aside>':'')+'</div></section>';
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
let beforeStudyY=0;
function studyReturnLabel(r){
 if(fromBooks)return '繼續選秘笈';
 if(r.phase==='cache')return r.floor===2?'回到渡口':r.stop?.story==='cave'?'回到山洞':'回到貨郎';
 return {gift:'回到餞行席',map:'回到地圖',fight:'回到比武',reward:'回到戰後所得',school:'回到師門',inn:'回到客棧',won:'回到結局',lost:'回到結局'}[r.phase]||'回到遊戲';
}
function treeButton(action,label,style,disabled){
 const [act,name]=action.split('/'),r=s.route;
 if(act==='tab')return name==='deck'?btn('deck','我的牌組','exit-link'):'';
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
 document.body.classList.toggle('jp-active',!reading&&(['gift','reward','inn','won','lost','school','map'].includes(r.phase)||(r.phase==='cache'&&(r.floor===2||r.stop?.story==='cave'))));
 document.body.classList.toggle('at-market',!reading&&r.phase==='cache'&&r.floor!==2&&r.stop?.story!=='cave');
 if(reading){
  const back=btn('closeTree','<span aria-hidden="true">‹</span> '+studyReturnLabel(r),'study-return');
  $('room').innerHTML=manual(s,byName.get(selected),treeButton,back);
  $('room').querySelector('.skill-detail').insertAdjacentHTML('afterbegin',btn('backToRegister','查看功法總表','return-to-register'));
  return;
 }
 let html='';
 switch(r.phase){
 case 'gift':html=departure(seat,btn);break;
 case 'map':html=atlas(r);break;
 case 'fight':html=arena(s,btn);break;
 case 'reward':html=rewardPile(s,btn);break;
 case 'inn':html=inn();break;
 case 'school':{
  const shelf=lessons(s),chosen=shelf.find(row=>row.a.name===lessonName)||shelf[0];
  const volumes=shelf.map(({a,borrowed,continuation})=>'<button class="lesson-volume" data-action="lesson/'+a.name+'" aria-label="翻閱《'+a.name+'》" aria-pressed="'+(a===chosen?.a)+'">'+cover(a)+'<small>'+(continuation?'進階講義':borrowed?'師兄講義':'隨身藏書')+'</small></button>').join('');
  const notes=chosen?'<strong>'+chosen.a.name+'</strong><p>'+(chosen.continuation?'承接你所習的《'+chosen.a.parent+'》。':'')+effect(chosen.a)+'</p><small>練成把握 '+trainingChance(chosen.preview,chosen.a)+'%　·　學成用 '+chosen.cost+' 歷練，失手用 '+attemptFee(chosen.cost)+'</small>':'<strong>切磋所學</strong><p>今日可跟師兄拆招，增長歷練。</p>';
  html='<section class="school-court"><div class="school-title"><h2>師門請益</h2></div><div class="lesson-shelf" aria-label="可請教的功法">'+volumes+'</div><div class="school-slip"><div>'+notes+'</div>'+ (chosen?btn('train/'+chosen.a.name,s.xp<chosen.cost?'尚欠 '+(chosen.cost-s.xp)+' 歷練':'請師兄指點','red-seal',s.xp<chosen.cost):'')+'</div><div class="lesson-links"><span>本次只可請益或拆招一次</span>'+btn('drill','跟師兄拆招 · 得 8 歷練')+btn('leave','辭別上路')+'</div></section>';break;
 }
 case 'cache':html=r.stop?.story==='cave'?caveRoom():r.floor===2?eventRoom():merchant(s,heldWare,true);break;
 case 'won':case 'lost':html=ending(s,btn);break;
 }
 $('room').innerHTML=html;
 if(r.phase==='map')locateTrail($('room'));
 if(r.phase==='fight')paintBout(b);
}
document.addEventListener('click',async e=>{
 if(animating)return;
 const term=e.target.closest('.travel-deck .rule-word');
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
 if(action==='deckNote'){
  const card=deck(s).find(c=>c.id===v);if(!card)return;
  modal('<div class="full-card">'+cardFace(byName.get(card.name),s.stars.includes(card.id))+'</div><p>'+descriptions[card.name]+'</p>'+btn('deck','返回牌組'));return;
 }
 if(action==='pile'&&b){modal(pileSheet(b,v));return}
 if(action==='guide'){fieldGuide();return}
 if(r.phase==='inn'){
  if(action==='innBack'){$('folio').close();return}
  if(action==='shelf'){practiceShelf();return}
  if(action==='compare'){compareCopy(v);return}
  if(action==='dispensary'){dispensary();return}
  if(action==='nap'){modal('<div class="inn-bedside" aria-hidden="true"></div><h2>回房歇息</h2><p>氣血 '+r.hp+' → '+(r.hp+innRecovery(r))+'／'+r.maxHp+'。今晚住下，明早便要上路。</p>'+btn('rest/heal','就寢，明早上路','primary')+' '+btn('innBack','再看看','ink-action'));return}
  if(action==='innBuy'&&buyMedicine(s,v))$('folio').close();
 }
 if(action==='inspectWare'&&r.phase==='cache'&&r.floor!==2&&Object.hasOwn(stockAt(s)??{},v)){
  heldWare=v;render();$('room').querySelector('.mk-lot[aria-pressed=true]')?.focus({preventScroll:true});return;
 }
 if(action==='buy'&&buyAtStall(s,v)){
  heldWare=v;render();$('room').querySelector('.mk-lot[aria-pressed=true]')?.focus({preventScroll:true});return;
 }
 if(action==='cave'&&exploreCave(s,v)&&r.phase==='cache'){
  render();
  const found=r.stop.finds.at(-1);
  browsing=null;displayBookDialog(s,btn,found.name,null,found);return;
 }
 if(action==='caveBook'&&r.phase==='cache'&&r.stop?.story==='cave'){
  const found=r.stop.finds[Number(v)];
  if(found){browsing=null;displayBookDialog(s,btn,found.name,null,found)}
  return;
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
 if(action==='backToRegister'){
  const tile=$('room').querySelector('.technique[aria-pressed=true]');
  tile?.scrollIntoView({block:'center',inline:'nearest'});tile?.focus({preventScroll:true});return;
 }
 if(action==='tree'||action==='node'||action==='inspect'){
  const shelfLeft=$('room').querySelector('.register .shelf')?.scrollLeft||0;
  const opening=!reading;
  if(opening)beforeStudyY=window.scrollY;
  reading=true;if(v)selected=v;render();
  if(opening&&!v){window.scrollTo(0,0);$('room').querySelector('.study-return').focus({preventScroll:true})}
  if(v){
   const shelf=$('room').querySelector('.register .shelf');
   if(shelf)shelf.scrollLeft=shelfLeft;
   const tile=$('room').querySelector('.technique[aria-pressed=true]');
   if(portraitPhone.matches){
    const back=$('room').querySelector('.return-to-register');
    back?.scrollIntoView({block:'start'});back?.focus({preventScroll:true});
   }else tile?.focus({preventScroll:true});
  }
  return;
 }
 if(action==='bookStudy'&&r.phase==='reward'&&s.offer.includes(v)){
  beforeStudyY=window.scrollY;$('book-choice').close();fromBooks=true;reading=true;selected=v;render();
  window.scrollTo(0,0);$('room').querySelector('.study-return').focus({preventScroll:true});return
 }
 if(action==='closeTree'){
  reading=false;render();window.scrollTo(0,beforeStudyY);
  if(fromBooks&&r.phase==='reward'&&picksLeft(s)>0)bookDialog();
  else $('trail-tools').querySelector('[data-action="tree"]').focus({preventScroll:true});
  fromBooks=false;return
 }
 if(action==='edition'){modal(editionSheet(s,byName.get(v),Number(i)));return}
 if(action==='preview'){modal('<div class="full-card">'+cardFace(byName.get(v),s.stars.includes(v))+'</div>');return}
 if(action==='record'){modal(rehearsalResult(byName.get(v),s.lastPractice));return}
 if(action==='toggle'&&['map','inn','school','reward','cache'].includes(r.phase))equip(s,byName.get(v));
 if(action==='map'){modal(atlas(r));return}
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
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&reading&&!document.querySelector('dialog[open]')){
  e.preventDefault();$('room').querySelector('.study-return').click();
 }
});
$('room').addEventListener('keydown',navigateRegister);
render();
if(preview==='books')bookDialog();
if(preview==='deck')deckDialog();
if(preview==='kit')inventory();
if(preview==='refine')compareCopy(practiceCopies()[0].id);
