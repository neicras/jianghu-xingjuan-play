import {cue} from './game-sound.js';
import {supportArt} from './art-library/support-files.js';
import {activeStates,glyph} from './vocabulary.js';
import {cardFace} from './card-face.js';
import {byName} from './catalogue.js';
import {encounters,forecast,intent,price,inheritanceDiscount,readPenalty,followupReady} from './combat.js?branch=1';
import {drawScene,loadScene,DURATION} from '../../altar-duel/scene.js?fixedLight=1';
import {frame,neutral} from '../../altar-duel/action-frame.js';

import {idleCel} from './idle.js';
import {fixedLight} from './lighting/fixed.js';
import {scenery,stages} from './environments.js';

const library=new URL('./art-library/',import.meta.url);
const actorsByName=new Map();
let release;

async function readJson(url){
 const response=await fetch(url);
 if(!response.ok)throw Error('角色圖錄 '+response.status+' '+url);
 return response.json();
}
async function actor(name){
 if(!actorsByName.has(name)){
  const pending=(async()=>{
   release??=readJson(new URL('release.json',library)).catch(error=>{release=null;throw error});
   const artName=({'掌契人':'白煞','護契刀客':'前哨','鎮倉使':'鐵衣堂主','巡山旗主':'鐵衣堂主','墨師傅':'鐵衣客','短打教頭':'前哨'})[name]||name;
   const entry=(await release).characters.find(c=>c.name===artName);
   if(!entry)throw Error('角色圖錄缺少 '+name);
   const dir=new URL('elements/characters/'+entry.id+'/'+entry.revision+'/',library);
   const spec=await readJson(new URL('actor.json',dir));
   return {...spec,id:entry.id,revision:entry.revision,file:new URL(spec.file,dir).href};
  })().catch(error=>{actorsByName.delete(name);throw error});
  actorsByName.set(name,pending);
 }
 return actorsByName.get(name);
}
let currentScene;
async function loadBattle(foes,stage,lit){
 const names=['斗篷客',...new Set(foes.map(e=>e.name))];
 const cast=await Promise.all(names.map(async name=>{
  const spec=await actor(name);
  return lit?{...spec,file:new URL('./lighting/fixed/'+stage+'/'+spec.id+'-'+spec.revision+'.webp',import.meta.url).href}:spec;
 }));
 const [traveller,first,...others]=cast;
 const scene=await loadScene(undefined,{traveller,assassin:first},{court:supportArt('court'),lanterns:supportArt('lanterns')});
 scene.m.actors[names[1]]=first;scene.images[names[1]]=scene.images.assassin;
 await Promise.all(others.map(async(spec,i)=>{
  const image=new Image();image.src=spec.file;await image.decode();
  scene.m.actors[names[i+2]]=spec;scene.images[names[i+2]]=image;
 }));
 if(lit)scene.lighting=fixedLight(stage,scene);
 return scene;
}
function battleScene(foes,stage){
 const key=JSON.stringify([stage,...foes.map(e=>e.name)]);
 if(currentScene?.key!==key){
  const pending=loadBattle(foes,stage,true).catch(()=>loadBattle(foes,stage,false));
  currentScene={key,pending};
  pending.catch(()=>{if(currentScene?.pending===pending)currentScene=null});
 }
 return currentScene.pending;
}
export function warmOpening(){
 const stage='wharf';
 Promise.all([battleScene([{name:'蒙眼刺客'}],stage),scenery(stage)]).catch(()=>{});
}
const piles={draw:'抽牌堆',discard:'棄牌堆',exhaust:'消耗堆'};
function pileButton(b,id,btn){
 const cards=b[id],top=cards.at(-1);
 const style=id==='discard'&&top?' style="--discard-art:url('+new URL(byName.get(top.name).image,import.meta.url).href+')"':'';
 const stack='<i class="stack" aria-hidden="true"'+style+'><i></i><i></i><i></i></i>';
 return btn('pile/'+id,stack+'<span>'+piles[id]+' <b>'+cards.length+'</b></span>','pile '+id+(cards.length?'':' empty'));
}
export function pileSheet(b,id){
 const cards=b[id],groups=new Map();
 for(const card of cards){
  const key=card.name+(card.star?' ★★':'');
  groups.set(key,{card,count:(groups.get(key)?.count||0)+1});
 }
 const rows=[...groups].sort(([a],[b])=>a.localeCompare(b,'zh-Hant')).map(([label,{card,count}])=>
  '<li><img src="'+byName.get(card.name).image+'" alt=""><strong>'+label+'</strong><span>× '+count+'</span></li>').join('');
 const note={draw:'按招式排列。抽盡時會將棄牌洗回來。',discard:'洗牌後，這些牌會再抽上手。',exhaust:'這些牌在本場比武中不再抽回。'};
 return '<h2>'+piles[id]+' · '+cards.length+' 張</h2><p>'+note[id]+'</p>'+(rows?'<ul class="pile-contents">'+rows+'</ul>':'<p>這裏暫時沒有牌。</p>');
}
function plaque(name,actor){
 return '<strong>'+name+'</strong><span>'+actor.hp+' / '+actor.maxHp+'</span><meter aria-label="'+name+'氣血" min="0" max="'+actor.maxHp+'" value="'+actor.hp+'"></meter><small>護體 '+actor.block+'</small>';
}
export function arena(state,btn){
 const b=state.bout;
 if(b?.phase==='lost'&&b.loan)return '<div class="bout-entry"><h2>比武落敗</h2><p>'+b.log.join(' ')+'</p>'+btn('returnBook','還卷，返回武學表')+'</div>';
 if(!b||b.phase==='lost')return '<div class="bout-entry"><h2>'+(b?'比武落敗':'焚天壇試武')+'</h2><p>'+(b?b.log.join(' '):'每回合抽五張牌，有三點內力。先看對方的來招，再決定出哪張牌。')+'</p><p>本場帶散學十張、回瀾 '+state.equipped.length+' 張。上場前回滿氣血，得勝後可拾卷研習。</p>'+encounters.map((name,i)=>btn('bout/'+i,name)).join(' ')+' '+btn('tab/deck','整備牌組')+'</div>';
 const foes=b.foes.map((e,i)=>{
  const [,hits,guard,stance]=intent(b,e);
  const intentIcon=stance==='counter'?'counter':hits>1?'multi':hits?'attack':guard?'guard':'waiting';
  const status=[...activeStates(e),e.rallies?'旗主倒下，兩哨撤退':'',e.reads?glyph('read')+'識招':'',e.force?'蓄勁 +'+e.force:''].filter(Boolean).join(' · ');
  return btn('target/'+i,plaque(e.name,e)+(status?'<small>'+status+'</small>':'')+'<small class="intent-scroll">'+(e.hp<=0?(e.fled?'已逃走':'退場'):glyph(intentIcon)+forecast(b,e))+'</small>',i===b.target?'aim':'',e.hp<=0||b.phase!=='playing');
 }).join('');
 const effects=activeStates(b).concat(Object.keys(b.powers),b.retain.length?"留牌 "+b.retain.length:[]);
 if(b.relics?.includes('劍穗')&&!b.attacks)effects.push('劍穗 · 首張攻擊每擊 +2');
 if(b.attackBonus)effects.push('下次攻擊 +'+b.attackBonus);
 if(b.palmBonus)effects.push('下掌 +'+b.palmBonus);
 if(b.carry)effects.push('下輪保留護體');
 if(b.riposte)effects.push('擋盡還擊 '+b.riposte);
 if(b.onBlock)effects.push('擋盡下一擊多抽一張');
 if(b.cleanDraw)effects.push('無傷多抽 '+b.cleanDraw);
 if(b.nextDraw)effects.push('下輪多抽 '+b.nextDraw);
 if(b.nextEnergy)effects.push('下輪內力 +'+b.nextEnergy);
 if(b.aura)effects.push('回瀾餘勁 '+b.aura);
 if(b.savedBlock)effects.push('上回抵擋 '+b.savedBlock);
 for(const [family,off] of Object.entries(b.discount))effects.push('下張'+family+' −'+off+'內力');
 const hand=b.hand.map(c=>{
  const cost=price(b,c);
  const penalty=readPenalty(b.foes[b.target],c.name);
  const a=byName.get(c.name),isLinked=!b.pending&&followupReady(b,c.name);
  let hint='';
  if(isLinked){
   const match=a.rule.match(/\[(\d+)\|(\d+)\]/),value=Number(match[c.star?2:1]);
   hint=({'撐篙長拳':'借上回守勁 +'+Math.min(4,b.savedBlock),'分水劍':'劍招 6 → '+value,'白虹劍法':'每劍 '+value+' → '+(value+3),'遊身八卦掌':'步勢未盡 · 可補牌','三才守中式':'留招在手 · 再抽一張','周天回元式':'收拂 · 回復一內力','太乙玄門劍':'內息護身 · 護體 +6','真武遊龍劍':'順步連刺 · 每劍 +2'})[c.name];
  }
  if(!b.pending&&c.name==='白虹劍法'&&!isLinked&&intent(b,b.foes[b.target])[1]>0)hint='首劍迎擊 · 護體 +7';
  if(inheritanceDiscount(b,c))hint=(hint?hint+' · ':'')+'承式省一內力';
  const face=cardFace(byName.get(c.name),c.star,cost,c.name==='劍傷'&&cost===0?'針灸匣：可打出並消耗。':undefined);
  return btn((b.pending?'pick/':'cast/')+c.id,face+(hint?'<span class="link-note">'+hint+'</span>':'')+(penalty?'<span class="read-note">已識破 · 每擊 −'+penalty+'</span>':''),'battle-card'+(isLinked?' linked-card':''),!b.pending&&cost>b.energy);
 }).join('');
 const prompt={'藏鋒':'選一張手牌保留。選劍法可得 6 護體。','換牌':'選一張手牌棄掉，再抽一張。','精練換牌':'選一張手牌換走。若選傷勢牌，會將它消耗。','必留':'選一張手牌留到下回合。','可留':'可選一張手牌留到下回合。'};
 const command=b.phase==='won'?(b.loan?btn('returnBook','還卷離場'):btn('collect',state.route?.floor===15?(state.route.volume===3?'開倉還銀':'收好本卷手記'):'領取戰後所得')):
  b.pending?(b.pending==='必留'?'':btn('skip','略過')):btn('endRound','收勢');
 const message=b.phase==='won'?'比武得勝。'+b.log.join(' '):prompt[b.pending]||b.log.join(' ')||(b.foes.some(e=>e.reads)?'對手會識招。同一招再打，每擊少 1 點，最多減 3 點。交替用幾門攻招，可以遲些被看穿。':'點選手牌出招。');
 return (b.loan?'<div class="loan-bar">借招試打 · '+b.loan+'　'+btn('returnBook','還卷離場','exit-link')+'</div>':'')+
 '<section class="duel-board"><div class="arena-stage"><div class="arena-picture"><canvas width="900" height="560" aria-label="比武交手"></canvas></div><div class="arena-hero">'+plaque('斗篷客',b)+(effects.length?'<small>'+effects.join(' · ')+'</small>':'')+'</div><div class="arena-foes">'+foes+'</div></div>'+
 '<div class="duel-table"><div class="duel-rail"><b>第 '+b.turn+' 回合</b><span class="duel-energy">'+glyph('qi')+'內力 '+b.energy+'</span>'+(b.exhaust.length?btn('pile/exhaust','消耗 '+b.exhaust.length,'ash-count'):'')+'</div>'+
 pileButton(b,'draw',btn)+'<div class="battle-hand" aria-label="手牌">'+(b.phase==='playing'?hand:'')+'</div>'+pileButton(b,'discard',btn)+'</div>'+
 '<div class="duel-command"><p class="arena-log" role="status">'+message+'</p>'+command+'</div></section>';
}
const paintings=new WeakMap();

function showContact(stage,b,move){
 cue(move.kind==='strike'?(move.absorbed&&!move.lost?'guard':'hit'):move.kind==='guard'?'guard':'breath');
 const enemy=b.foes[move.index];
 b.hp=move.heroHP;b.block=move.heroBlock;
 enemy.hp=move.foeHP;enemy.block=move.foeBlock;
 const foePlaque=stage.querySelectorAll('.arena-foes button')[move.index];
 for(const [plaque,actor] of [[stage.querySelector('.arena-hero'),b],[foePlaque,enemy]]){
  plaque.querySelector('meter').value=actor.hp;
  plaque.querySelector('span').textContent=actor.hp+' / '+actor.maxHp;
  plaque.querySelector('small').textContent='護體 '+actor.block;
 }
 const health=document.querySelector('[data-stat="hp"]');
 if(health)health.textContent=b.hp+'/'+b.maxHp;
 const defender=move.who==='hero'?enemy.name:'斗篷客';
 const impact=[move.absorbed?defender+'擋下 '+move.absorbed+' 點':'',move.lost?(move.absorbed?'':defender)+'氣血 −'+move.lost:'',move.gained?'護體 +'+move.gained:''].filter(Boolean).join('，');
 const label=(move.who==='hero'?'斗篷客':enemy.name)+' · '+move.name+(move.ordinal?' · 第'+move.ordinal+'擊':'');
 stage.closest('.duel-board').querySelector('.arena-log').textContent=label+(impact?'　'+impact:'');
}

// Resolve once. Animate the original, still-visible board before drawing the next hand or result.
export async function animateBout(b,resolve,save,action,presentation){
 const view=structuredClone(b),moves=[];
 if(!resolve(move=>moves.push(move)))return;
 cue((action??(moves[0]?.who==='foe'?'endRound':'cast'))==='endRound'?'end':'paper');
 save?.();
 if(!moves.length)return;
 const board=document.querySelector('.duel-board');
 if(!board)return;
 const first=moves[0];
 const played=[...board.querySelectorAll('.battle-card')].find(button=>{
  const id=button.dataset.action.slice(5);
  return view.hand.some(c=>c.id===id)&&!b.hand.some(c=>c.id===id);
 });
 played?.classList.add('casting');
 board.querySelector('.arena-log').textContent=first.who==='hero'?'斗篷客使出《'+first.name+'》。':view.foes[first.index].name+'準備出招。';
 board.inert=true;
 try{
  const standard=(remaining=moves)=>paintBout(view,remaining,true);
  if(presentation){
   const stage=board.querySelector('.arena-stage');
   await presentation(stage,moves,move=>showContact(stage,view,move),standard);
  }else await standard();
 }finally{board.inert=false}
}
export async function paintBout(b,action,playback=false){
 const canvas=document.querySelector('.arena-stage canvas');if(!canvas)return;
 const token={};paintings.set(canvas,token);
 try{
  const stage=Object.hasOwn(stages,b.environment)?b.environment:'court';
  const [cast,environment]=await Promise.all([battleScene(b.foes,stage),Promise.resolve(scenery(stage)).catch(()=>null)]);
  const res={...cast,scenery:environment};
  if(!canvas.isConnected)return;
  const ctx=canvas.getContext('2d'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const moves=Array.isArray(action)?action:action?[action]:[];
  const start=performance.now(),beat=reduce.matches?220:moves.length>1?360:470;
  let nextContact=0;
  let last=-Infinity;
  const sequence=new Promise((done,fail)=>{
  function paint(now){
   if(!canvas.isConnected||paintings.get(canvas)!==token){done();return}
   try{
   const progress=Math.max(0,(now-start)/beat),move=moves[Math.floor(progress)];
   while(playback&&nextContact<moves.length&&progress>=nextContact+.38){
    showContact(canvas.closest('.arena-stage'),b,moves[nextContact++]);
   }
   if(playback&&!move){done();return}
   const still=reduce.matches;
   if(now-last>=1000/(move?45:24)||still){
    last=now;
    const u=progress%1;
    const pose=move?frame({...move,seconds:beat/1000},still ? (u<.38?0:u<.75 ? .46 : 1) : u):{...neutral};
    if(move?.who==='foe'&&move.kind==='strike'&&move.absorbed&&u>=.34&&u<(move.lost ? .50 : .74))pose.traveller[0]=4;
    if(move){
     // A block is a contact event. Raising guard in advance has no impact flash.
     const parried=move.kind==='strike'&&move.absorbed>0&&!move.dodge;
     if(!parried||still)pose.flashAge=-1;
     else {
      const opponent=b.foes[move.index].name;
      const foeBlade=!['鐵衣客','鐵衣堂主','後哨','墨師傅'].includes(opponent);
      const heroBlade=move.who==='foe'||byName.get(move.name)?.branch==='劍法'||move.name==='順勢還擊';
      pose.contactBlade=move.who==='foe'?'hero':foeBlade?'foe':heroBlade?'hero':null;
      if(!pose.contactBlade)pose.flashAge=-1;
      pose.partialParry=move.lost>0;
     }
    }
    const clock=still?0:now/1000;
    const focus=move?.index??b.target;
    const order=b.foes.map((e,i)=>i).sort((a,c)=>Number(c===focus)-Number(a===focus));
    pose.idle={};
    pose.opponents=order.filter(i=>b.foes[i].hp>0||(move&&i===focus)).map(i=>{
     const enemy=b.foes[i],active=i===focus;
     const track=[...(active?pose.assassin:neutral.assassin)];
     if(b.foes.length>1){
      const reach=move&&active&&move.kind==='strike'?Math.sin(Math.PI*u):0;
      const offsets=b.foes.length===3?[[-150,6],[15,-130],[190,15]]:[[-54,8],[142,-98]];
      track[1]+=offsets[i][0]*(1-reach);
      track[2]+=offsets[i][1];
     }
     const id=enemy.name;
     if(!still&&(!move||!active))pose.idle[id]=idleCel(res.images[id],res.m.actors[id].id,clock+.7+i);
     return {id,track};
    });
    if(!move&&!still)pose.idle.traveller=idleCel(res.images.traveller,'traveller',clock);
    // The phone stage crops the painting around the fighters. Keep the hanging
    // lamps in the visible opening, with their cords extending past the lintel.
    const visibleHeight=canvas.clientHeight*res.m.canvas[0]/Math.max(1,canvas.clientWidth);
    const topCrop=Math.max(0,res.m.canvas[1]-visibleHeight)*.68;
    if((document.body.classList.contains('duel-study')||getComputedStyle(canvas).objectFit==='fill'&&getComputedStyle(canvas).maxWidth==='none') && canvas.clientWidth>canvas.clientHeight*1.6){
     pose.stageAspect=canvas.clientWidth/canvas.clientHeight;
     const width=Math.min(1800,Math.round(canvas.clientWidth*Math.min(2,devicePixelRatio)));
     const height=Math.round(width/pose.stageAspect);
     if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}
    }else if(canvas.width!==900){canvas.width=900;canvas.height=560}
    pose.lanternDrop=pose.stageAspect?0:topCrop;
    pose.lanternInset=pose.stageAspect?0:Math.min(100,topCrop*.6);
    drawScene(ctx,res,clock%DURATION,Number(canvas.dataset.view||0),pose);
   }
   if(!still||move)requestAnimationFrame(paint);else done();
   }catch(error){fail(error)}
  }
  requestAnimationFrame(paint);
  });
  if(playback)await sequence;else sequence.catch(error=>console.error(error));
 }catch(error){
  if(canvas.isConnected){canvas.hidden=true;canvas.insertAdjacentText('afterend','戰場畫稿未能載入，請重新整理。')}
  console.error('戰場畫稿',error);
 }
}
