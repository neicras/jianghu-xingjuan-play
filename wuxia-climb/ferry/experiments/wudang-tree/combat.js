// A bout snapshots this exact library deck, including refinement of individual copies.
import {byName,hasKeyword} from './catalogue.js';
import {deck} from './rules.js';
const profiles=[
 {title:'橋頭試劍',enemies:[['蒙眼刺客',32,0,[[7,1,0],[0,0,6],[5,2,0]]]]},
 {title:'鐵衣守擂',enemies:[['鐵衣客',38,9,[[9,1,0],[0,0,10],[13,1,0]]]]},
 {title:'雙人合擊',enemies:[['前哨',19,0,[[4,1,0],[3,2,0]]],['後哨',22,3,[[0,0,5],[6,1,0]]]]}
];
export const encounters=profiles.map(p=>p.title);
export function intent(b,e){
 if(e.rallies&&b.foes.some(f=>f.scout&&f.hp<=0))return [0,0,0,'rally'];
 return e.moves[(b.turn-1)%e.moves.length]}
function attackValue(base,attacker,target){
 return Math.floor((base+(attacker.strength||0))*(attacker.weak?0.75:1)*(target.exposed?1.5:1));
}
export function incoming(b,e){
 return attackValue(intent(b,e)[0]+(e.force||0),e,b);
}
function injury(b,name,pile){
 b.injurySerial=(b.injurySerial||0)+1;
 pile.push({name,id:'傷'+b.injurySerial});
}
export function forecast(b,e){
 const [,hits,guard,stance]=intent(b,e);
 if(stance==='rally')return '鳴哨增援 · 喚來 '+b.foes.filter(f=>f.scout&&f.hp<=0).length+' 名哨兵。旗主本回合停手，新兵下回合才出招。';
 if(stance==='charge'&&e.pressure>=8)return '蓄勁已被打斷 · 本回合不會出手。';
 if(stance==='charge')return '蓄勁中 · 再打掉 '+Math.max(0,8-(e.pressure||0))+' 氣血可破招。下次每擊 +5'+(e.sealsBreath?'，並令你氣短、抽到《岔氣》':'')+'。';
 if(stance==='counter')return '聽勁反打 · 此時每打中他一下，他便還手 3 點。收勢後他得 '+guard+' 護體。';
 if(stance==='feint')return '虛晃一招 · 令你露出破綻，下回合受擊加重一半。';
 if(stance==='disrupt')return '截脈 · 下回合你會氣短，並抽到一張《岔氣》。'+(guard?'對手得 '+guard+' 護體。':'');
 if(!hits)return '將架起 '+guard+' 護體';
 const damage=incoming(b,e),primary=Math.max(0,damage-(e.weaken||0));
 return '將攻 '+(primary!==damage&&hits>1?primary+'、'+damage:primary+(hits>1?' × '+hits:''))+(guard?'，再得 '+guard+' 護體':'')+(stance==='wound'?' · 每一擊穿過護體，添一張《劍傷》入棄牌堆。':'');
}
const living=b=>b.foes.filter(e=>e.hp>0);
function scatterScouts(b){
 if(!b.foes.some(e=>e.rallies&&e.hp<=0))return;
 const remaining=living(b).filter(e=>e.scout);
 for(const e of remaining){e.hp=0;e.fled=true}
 if(remaining.length)b.log.push('旗主倒下，'+remaining.map(e=>e.name).join('、')+'棄旗逃走。');
}
function shuffle(b,cards){
 for(let i=cards.length-1;i>0;i--){
  b.seed=(Math.imul(b.seed,1664525)+1013904223)>>>0;
  const j=Math.floor(b.seed/4294967296*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];
 }
 return cards;
}
function draw(b,n){
 while(n-->0&&b.hand.length<10){
  if(!b.draw.length)b.draw=shuffle(b,b.discard.splice(0));
  if(!b.draw.length)break;b.hand.push(b.draw.pop());
 }
}
export function startBout(s,profile=0,seed=Date.now()){
 const b={profile,seed:seed>>>0,turn:0,hp:40,maxHp:40,block:0,energy:3,draw:[],discard:[],exhaust:[],hand:[],target:0,
  foes:profiles[profile].enemies.map(([name,hp,block,moves])=>({name,hp,maxHp:hp,block,moves})),
  powers:{},nextEnergy:0,nextDraw:0,carry:false,discount:{},attackBonus:0,palmBonus:0,phase:'playing',pending:null,log:[]};
 b.draw=shuffle(b,deck(s).map(c=>({...c,star:s.stars.includes(c.id)})));
 // Draw pops from the end. Keep the shuffled order within both groups.
 b.draw=b.draw.filter(c=>!hasKeyword(c,'起手')).concat(b.draw.filter(c=>hasKeyword(c,'起手')));
 openTurn(b);return b;
}
function openTurn(b){
 b.turn++;b.energy=3+b.nextEnergy+(b.powers.元始先天功?1:0);b.nextEnergy=0;
 b.block=(b.carry?b.block:0)+(b.powers.元始先天功||0);b.carry=false;
 b.seen={};b.retain=[];b.attacks=0;b.riposte=0;b.onBlock=0;b.cleanDraw=0;b.aura=0;b.yinyang=false;b.triad=false;b.savedBlock=b.blocked||0;b.blocked=0;
 draw(b,5+b.nextDraw);b.nextDraw=0;
}
const branch=a=>a.branch==='輕功'?'身法':a.branch;
export function price(b,c){
 if(hasKeyword(c,'無法打出'))return c.name==='劍傷'&&b.relics?.includes('針灸匣')?0:Infinity;
 const a=byName.get(c.name);return Math.max(0,a.cost-(b.discount[branch(a)]||0));
}
export const readPenalty=(enemy,name)=>Math.min(3,enemy?.reads?.[name]||0);
function harm(e,n,bypass=false){
 const guard=bypass?0:Math.min(n,e.block);e.block-=guard;const prev=e.hp;e.hp=Math.max(0,e.hp-n+guard);e.pressure=(e.pressure||0)+prev-e.hp;
}
export function settleChoice(b,id=null){
 if(!b.pending)return false;
 const i=b.hand.findIndex(c=>c.id===id);
 if(i<0&&(id!==null||b.pending==='必留'))return false;
 if(i>=0){
  if(['換牌','精練換牌'].includes(b.pending)){
   const [c]=b.hand.splice(i,1),remove=b.pending==='精練換牌'&&byName.get(c.name).branch==='傷勢';
   (remove?b.exhaust:b.discard).push(c);draw(b,1);
   b.log=[(remove?'消耗':'棄掉')+'《'+c.name+'》，再抽一張。'];
  }
  else b.retain.push(id);
 }
 b.pending=null;return true;
}
// Record the two visible meters immediately after each resolved contact.
function contact(b,emit,e,move){
 if(!emit)return;
 emit({...move,index:b.foes.indexOf(e),heroHP:b.hp,heroBlock:b.block,foeHP:e.hp,foeBlock:e.block});
}
export function play(b,id,onMove){
 const i=b.hand.findIndex(c=>c.id===id);
 if(b.phase!=='playing'||b.pending||i<0)return false;
 const c=b.hand[i],a=byName.get(c.name),cost=price(b,c),family=branch(a),name=c.name;
 if(cost>b.energy)return false;
 const e=b.foes[b.target];if(!e||e.hp<=0)return false;
 b.energy-=cost;delete b.discount[family];b.hand.splice(i,1);
 if(a.branch==='傷勢'){b.exhaust.push(c);b.log=['針灸匣生效，消耗《'+name+'》。'];return true}
 const pair=a.rule.match(/\[(\d+)\|(\d+)\]/),v=Number(pair[c.star?2:1]);
 const prev=b.seen[family]||0,p=b.powers;
 const priorHP=b.foes.reduce((n,f)=>n+f.hp,0), oldBlock=b.block;
 const recognized=readPenalty(e,name);
 let attacked=false,reflected=0,counters=0;
 function hit(base,count=1,{pierce=false,all=false}={}){
  attacked=true;
  const bonus=(a.rank?(p.武當太和功||0):0)+b.attackBonus+
   (family==='劍法'?(p.純陽劍意||0)+(prev===0?(p.純陽無極功||0):0):0)+(family==='拳掌'?b.palmBonus:0);
  const force=b.relics?.includes('劍穗')&&!b.attacks?2:0;
  b.attacks=(b.attacks||0)+1;
  for(const target of all?living(b):[e]){
   const penalty=readPenalty(target,name);
   if(target.reads)target.reads[name]=Math.min(3,(target.reads[name]||0)+1);
   for(let j=0;j<count&&target.hp>0&&b.hp>0;j++){
   const beforeHP=target.hp,beforeBlock=target.block;
   harm(target,attackValue(Math.max(0,base+bonus+force-penalty),b,target),pierce);
   contact(b,onMove,target,{who:'hero',kind:'strike',name,slash:family==='劍法'&&j%2===1,
    ordinal:count>1?j+1:0,lost:beforeHP-target.hp,absorbed:beforeBlock-target.block,blocked:target.hp===beforeHP&&target.block<beforeBlock});
   if(target.hp>0&&intent(b,target)[3]==='counter'){
    counters++;const blocked=Math.min(3,b.block);b.block-=blocked;b.blocked+=blocked;
    const loss=Math.min(3-blocked,b.hp);b.hp-=loss;reflected+=loss;
    contact(b,onMove,target,{who:'foe',name:'反打',kind:'strike',blocked:blocked===3,lost:loss,absorbed:blocked});
   }
  }
  }
  if(b.attacks%3===0&&b.relics?.includes('三才玉環'))b.dexterity=(b.dexterity||0)+1;
  b.attackBonus=0;if(family==='拳掌')b.palmBonus=0;
 }
 const blockFromCard=n=>{b.block+=n+(b.dexterity||0)};
 // These triggers apply only to cards following the setup card.
 if(a.rank&&b.aura){
  const hp=e.hp,block=e.block;harm(e,b.aura);
  contact(b,onMove,e,{who:'hero',kind:'breath',name:'真武蕩魔陣',lost:hp-e.hp,absorbed:block-e.block});
 }
 if(family==='內功')b.attackBonus+=p.武當混元功||0;
 if(family==='護體'&&!prev)b.block+=p.一字混元樁||0;
 if(family==='劍法'&&prev===2)b.block+=p.三才劍陣||0;

 switch(name){
 case '武當太和功':case '一字混元樁':case '武當混元功':case '純陽無極功':case '元始先天功':
 case '三才劍陣':case '陰陽周天法':case '三華聚頂':case '純陽劍意':
  p[name]=v;break;
 case '抱元守一':blockFromCard(v);b.nextEnergy++;break;
 case '羅天真訣十二樁':draw(b,v);if(b.hand.length)b.pending='必留';break;
 case '洗髓金經':b.hp=Math.min(b.maxHp,b.hp+v);break;
 case '太乙神功':b.energy+=v;break;
 case '五步梅花樁':blockFromCard(v);b.onBlock=1;break;
 case '八卦步':blockFromCard(v);if(b.hand.length)b.pending=c.star?'精練換牌':'換牌';break;
 case '雲環步':draw(b,v);blockFromCard(3);break;
 case '天罡北斗步':blockFromCard(v);b.carry=true;break;
 case '踏浪步':e.exposed=(e.exposed||0)+v;break;
 case '太乙九宮步':draw(b,v);if(b.hand.length)b.pending='可留';break;
 case '上天梯':b.nextEnergy++;b.nextDraw+=v;break;
 case '凌雲飛渡':e.weak=(e.weak||0)+2;draw(b,v);break;
 case '武當鐵布衫':blockFromCard(v);b.riposte=Math.max(b.riposte,living(b).length>1?8:4);break;
 case '橫劍當胸':blockFromCard(v);break;
 case '雲床九練':blockFromCard(v);b.carry=true;break;
 case '五氣朝元功':blockFromCard(v);b.cleanDraw++;break;
 case '無極勁':blockFromCard(v);b.riposte=Math.max(b.riposte,6);break;
 case '真武蕩魔陣':b.aura+=v;break;
 case '武當長拳':hit(v+Math.min(4,b.savedBlock));blockFromCard(1);break;
 case '追風雲環掌':case '連環劍':hit(v,2);break;
 case '武當綿掌':case '先天少陽劍氣':hit(v,1,{pierce:true});break;
 case '遊身八卦掌':hit(v);if(b.seen.身法)draw(b,1);break;
 case '太乙逍遙掌':hit(v);b.discount.身法=1;break;
 case '玄功神拳':hit(v+2*b.hand.filter(x=>byName.get(x.name).branch==='內功').length);break;
 case '武當純陽拳':hit(v);b.palmBonus+=3;break;
 case '紫陽正氣拳':hit(v);blockFromCard(6);break;
 case '太極拳':hit(v+Math.min(8,b.savedBlock));break;
 case '武當丹劍':hit(b.seen.護體?v:6);break;
 case '武當逍遙劍':hit(v);if(b.hand.length)b.pending='可留';break;
 case '白虹劍法':hit(v+(prev?3:0),2);break;
 case '太乙玄門劍':hit(v);b.discount.內功=1;break;
 case '真武遊龍劍':hit(v,3);break;
 case '太極劍法':hit(v);blockFromCard(6);break;
 case '無極劍式':hit(v+3*prev);break;
 case '拂塵功':hit(v);blockFromCard(3);break;
 case '武當鐵拂塵':e.block=Math.max(0,e.block-v);hit(4);break;
 case '兩儀拂塵功':{const defended=e.block>0;hit(v);if(defended)draw(b,1);break}
 case '老君拂塵功':blockFromCard(v);e.weaken=(e.weaken||0)+2;break;
 case '錯倒陰陽拂塵':{const removed=Math.min(v,e.block);e.block-=removed;if(removed)blockFromCard(removed);break}
 case '太乙雲拂功':hit(v,2);break;
 case '無量掃塵功':hit(v,1,{all:true});break;
 case '玄空神拂':e.block=0;hit(v);break;
 case '一線穿雲':hit(v);break;
 case '吐納':draw(b,v);break;
 default:throw Error('缺少招式規則 '+name);
 }
 if(!attacked||b.block>oldBlock){
  const kind=attacked?'guard':({內功:'breath',奇竅:'breath',護體:'guard',身法:'step'})[family]||'guard';
  contact(b,onMove,e,{who:'hero',kind,name,gained:Math.max(0,b.block-oldBlock)});
 }
 if(attacked&&p.陰陽周天法&&b.seen.護體&&!b.yinyang){draw(b,p.陰陽周天法);b.yinyang=true}
 b.seen[family]=prev+1;
 if(p.三華聚頂&&Object.keys(b.seen).length>=3&&!b.triad){b.energy+=p.三華聚頂;b.triad=true}
 const permanent=hasKeyword(c,'運功');
 (permanent||hasKeyword(c,'消耗')?b.exhaust:b.discard).push(c);
 const damage=priorHP-b.foes.reduce((n,f)=>n+f.hp,0);b.log=['使出《'+name+'》。'+(attacked||damage?'對手失去 '+damage+' 氣血。':'')+(b.block>oldBlock?'護體增加 '+(b.block-oldBlock)+'。':'')];
 if(attacked&&b.attacks%3===0&&b.relics?.includes('三才玉環'))b.log.push('三才玉環生效，守勁增加 1。');
 if(attacked&&recognized)b.log.push(e.name+'已認得《'+name+'》，此招每擊減去 '+recognized+' 點力道。');
 if(name==='踏浪步')b.log.push(e.name+'露出破綻 '+e.exposed+' 回合，受攻擊時傷害增加一半。');
 if(counters)b.log.push('對手反打 '+counters+' 次，'+(reflected?'你失去 '+reflected+' 氣血。':'護體盡數擋下。'));
 scatterScouts(b);
 if(!b.hp){b.phase='lost';b.pending=null}
 else if(!living(b).length){b.phase='won';b.pending=null}
 else if(e.hp<=0)b.target=b.foes.findIndex(f=>f.hp>0);
 return true;
}
export function endRound(b,onMove){
 if(b.phase!=='playing'||b.pending)return false;
 const oldHP=b.hp;b.log=[];let feinted=false,disrupted=false;
 for(const e of living(b)){
  if(!b.hp||e.hp<=0)break;
  const [,hits,guard,stance]=intent(b,e);
  if(stance==='rally'){
   const arrived=[];
   for(const [i,slot] of b.foes.entries())if(slot.scout&&slot.hp<=0){
    b.foes[i]={name:slot.name,scout:true,hp:slot.maxHp,maxHp:slot.maxHp,block:0,moves:slot.moves};
    arrived.push(slot.name);
   }
   b.log.push('旗主鳴哨，'+arrived.join('、')+'趕到。新兵本回合只站位。');
  }
  if(stance==='charge'){const broken=e.pressure>=8;if(!broken){
   e.force=(e.force||0)+5;
   if(e.sealsBreath){disrupted=true;injury(b,'岔氣',b.draw);b.log.push('劍宗封住氣口，《岔氣》置於抽牌堆頂。')}
  }b.log.push(e.name+(broken?'被你打斷，這一口勁沒能蓄成。':'蓄勁已成，下次每擊加重 5 點。'))}
  if(stance==='disrupt'){disrupted=true;injury(b,'岔氣',b.draw);b.log.push(e.name+'截住氣脈，《岔氣》置於抽牌堆頂。')}
  if(stance==='feint'){feinted=true;b.log.push(e.name+'虛晃一招，你下回合露出破綻。')}
  e.block+=guard;if(guard)b.log.push(e.name+'架勢穩固，護體增加 '+guard+'。');
  if(!hits||guard)contact(b,onMove,e,{who:'foe',kind:'guard',name:stance==='rally'?'鳴哨增援':guard?'架勢護身':'變招',gained:guard});
  for(let j=0;j<hits&&b.hp>0&&e.hp>0;j++){
   const damage=Math.max(0,incoming(b,e)-(e.weaken||0));e.weaken=0;
   const blocked=Math.min(b.block,damage);b.block-=blocked;b.blocked+=blocked;
   const beforeHP=b.hp;b.hp=Math.max(0,b.hp-damage+blocked);b.log.push(e.name+'出招，護體抵去 '+blocked+'，你失去 '+(damage-blocked)+' 氣血。');
   contact(b,onMove,e,{who:'foe',kind:'strike',name:'來招',ordinal:hits>1?j+1:0,blocked:blocked===damage,lost:beforeHP-b.hp,absorbed:blocked});
   if(stance==='wound'&&damage>blocked){injury(b,'劍傷',b.discard);b.log.push('《劍傷》入棄牌堆。')}
   if(b.onBlock){if(blocked===damage)b.nextDraw++;b.onBlock=0}
   if(b.riposte&&blocked===damage){
    const before=e.hp,priorGuard=e.block;harm(e,b.riposte);
    contact(b,onMove,e,{who:'hero',kind:'strike',name:'順勢還擊',lost:before-e.hp,absorbed:priorGuard-e.block,blocked:e.hp===before&&priorGuard>e.block});
    b.log.push('你擋盡來招，順勢還擊。'+e.name+'失去 '+(before-e.hp)+' 氣血。');b.riposte=0
   }
  }
  scatterScouts(b);
  if(hits)e.force=0;
  e.weak=Math.max(0,(e.weak||0)-1);e.exposed=Math.max(0,(e.exposed||0)-1);e.pressure=0;
 }
 b.exposed=Math.max(0,(b.exposed||0)-1)+Number(feinted);
 b.weak=Math.max(0,(b.weak||0)-1)+Number(disrupted);
 if(b.hp===0)b.phase='lost';
 else if(!living(b).length)b.phase='won';
 else{
  if(oldHP===b.hp)b.nextDraw+=b.cleanDraw;
  const held=[];
  for(const c of b.hand){
   if(hasKeyword(c,'虛無')){b.exhaust.push(c);b.log.push('《'+c.name+'》因虛無而消耗。')}
   else if(b.retain.includes(c.id)||hasKeyword(c,'保留'))held.push(c);
   else b.discard.push(c);
  }
  b.hand=held;
  if(b.foes[b.target].hp<=0)b.target=b.foes.findIndex(e=>e.hp>0);
  openTurn(b);
 }
 return true;
}

// A loan is isolated from the saved art tree. One card is guaranteed in the
// opening hand so the two editions can be compared on the same shuffle.
export function borrowedBout(s,a,star,profile){
 const copy={...s,equipped:[...new Set([...s.equipped,a.name])],stars:s.stars.filter(n=>n!==a.name)};
 if(star)copy.stars.push(a.name);
 const b=startBout(copy,profile,73),i=b.draw.findIndex(c=>c.name===a.name);
 if(i>=0)[b.hand[0],b.draw[i]]=[b.draw[i],b.hand[0]];
 b.loan=a.name;return b;
}
