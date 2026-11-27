import {duels,patterns,openingMoves,volumeBosses} from './encounter-tables.js';
import {companionFor,variationFor} from './book-pairings.js';
import {balance} from './balance-settings.js';
import {fresh,win,take,study,rehearse,equip,ready,deck,pairedForms,archiveCopy} from './rules.js?branch=1';
import {startBout} from './combat.js?branch=1';
import {arts,byName} from './catalogue.js';
import {collection,collate,chapters,estimate,rollCopy} from './manuscripts.js';

import {confirmCrossing,episode,remember,chapterOf,stationNumber,bossNames,crossingFor} from './chapter-road.js';

export const road=[
 ['fighter'],['fighter','cache','inn'],['school','pair','guard'],['inn','school'],['elite1','bypass'],
 ['cache','pair','school','inn','cave','press'],['school','inn','guard'],['guard','cache','pair','banner'],['inn','school'],['elite2','bypass'],
 ['guard','cache','school','pair'],['school','pair','inn'],['fighter','school','cache'],['inn','guard'],['boss']
];
// The forks retain their lane geometry while the occupants change with the district.
const districtRoads=[road,...[
 {0:['guard'],2:['cache','pair','school'],5:['school','inn','guard','cache','cave','pair'],10:['inn','cache','guard','school']},
 {0:['pair'],2:['inn','school','pair'],5:['inn','guard','school','cache','cave','banner'],10:['guard','school','inn','pair']}
].map(changes=>road.map((lanes,index)=>changes[index]||lanes))];
// Preserve a previously visited or currently occupied room when upgrading a saved journey.
const trialRows=[{}, {6:['checkpoint','convoy','checkpoint'],11:['convoy','checkpoint','convoy']},
 {7:['checkpoint','convoy','checkpoint','banner']}];
const revisedRoads=districtRoads.map((floors,v)=>floors.map((rooms,i)=>trialRows[v][i]||rooms));
export function roadFor(r){
 const i=chapterOf(r)-1;
 if(!r.oldRoadThrough||r.oldRoadThrough<=15*i)return revisedRoads[i];
 return revisedRoads[i].map((row,f)=>stationNumber(r,f+1)<=r.oldRoadThrough?districtRoads[i][f]:row);
}
const checkpointFoes={checkpoint:'guard',convoy:'pair'};

export const rooms={
 fighter:'橋頭比武',guard:'鐵衣守擂',pair:'雙人合擊',inn:'客棧',school:'師門',cache:'山道貨郎',
 press:'紙坊認印',bypass:'繞過擂台',trio:'三人截路',banner:'巡山旗主',cave:'山洞遺鏢',elite1:'鐵衣堂主',elite2:'雙煞把關',boss:'守壇劍宗'
};
export const bagCapacity=3;
const ordinaryRooms=['fighter','guard','pair'];
export function roomName(type,floor,r){
 if(r&&chapterOf(r)>1){
  if(type==='checkpoint')return chapterOf(r)===2?'守簿鐵衛':'倉門鐵衛';
  if(type==='convoy')return chapterOf(r)===2?'護契雙哨':'押銀雙哨';
  if(type==='boss')return bossNames[chapterOf(r)-1];
  if(type==='bypass')return crossingFor({...r,floor}).name;
 }
 if(type==='bypass')return floor===5?'隨石生過渡':'隨藥船過江';
 if(floor>1&&ordinaryRooms.includes(type))return '江湖比武';
 return type==='cache'&&floor===2?'江湖偶遇':rooms[type];
}
// A road commits to its opponents independently of card draws, shopping and practice.
function opponents(r){
 const pool=r.floor===2?['guard','pair','pair']:r.floor<5?['guard','pair','pair','trio']:r.floor<10?['guard','pair','trio']:['pair','trio','trio'];
 let h=(r.worldSeed??r.seed)^Math.imul(stationNumber(r),0x9e3779b1);
 h=Math.imul(h^(h>>>16),0x85ebca6b);h=Math.imul(h^(h>>>13),0xc2b2ae35);
 return pool[((h^(h>>>16))>>>0)%pool.length];
}
export const defaultCurriculum=Object.freeze({offer:5,keep:2,schoolLoans:2});
export const teachers=Object.freeze({sword:'白虹劍法',palm:'回浪綿掌'});
export const mentorBasics=Object.freeze({sword:'連環劍',palm:'橫劍當胸'});
export const fieldPractice=s=>s.route.practiceBooks??(s.route.free?[s.route.free]:[]);
export function newJourney(seed=Date.now(),curriculum=defaultCurriculum){
 const {offer,keep,schoolLoans}=curriculum;
 if(!Number.isInteger(offer)||offer<1||offer>5||!Number.isInteger(keep)||keep<1||keep>offer||
    !Number.isInteger(schoolLoans)||schoolLoans<0||schoolLoans>7)throw Error('無效的研習設定');
 let openingSeed=seed>>>0;
 const s=fresh(()=>((openingSeed=(Math.imul(openingSeed,1664525)+1013904223)>>>0)/4294967296));
 s.route={volume:1,curriculum:{offer,keep,schoolLoans},floor:0,phase:'gift',bookTables:0,path:[],worldSeed:seed>>>0,hp:balance.startingHp,maxHp:balance.startingHp,seed:seed>>>0,last:'',free:null};
 prepareJourney(s);s.wins=0;s.xp=0;s.rewards={};return s;
}
function random(s){const r=s.route;r.seed=(Math.imul(1664525,r.seed)+1013904223)>>>0;return r.seed/4294967296}
export function gift(s,id){
 const r=s.route;if(r.phase!=='gift'||!(['health','xp'].includes(id)||Object.hasOwn(teachers,id)))return false;
 if(id==='health'){r.maxHp+=balance.healthGift;r.hp=r.maxHp}else if(id==='xp')s.xp+=balance.xpGift;
 else{
  const name=teachers[id];s.learned.push(name);equip(s,byName.get(name));
  s.stars.push(name,mentorBasics[id]+'0');
  r.last='師父指點完畢，《'+name+'》和一張《'+mentorBasics[id]+'》都已精練。';
 }
 if(!s.relics.includes('劍穗'))s.relics.push('劍穗');
 r.phase='map';return true;
}
// Lane indices from the original journey retain their rooms and connections.
const trails=[
 [[0,1,2]], [[0,1],[1,2],[2]], [[0],[0,1],[1]], [[0,1],[0,1]],
 [[0,1,2,3,4,5],[0,1,2,3,4,5]], [[0],[1],[1,2],[2],[1,2],[0,1]], [[0],[0,1,3],[1,2,3]], [[0,1],[1],[1],[0,1]], [[0,1],[0,1]],
 [[0,1,2,3],[0,1,2,3]], [[0],[1],[1,2],[2]], [[0,1],[1],[1,2]], [[0],[0,1],[1]], [[0],[0]]
];
export function linked(floor,from,to){
 if(floor===1)return to===0;
 return trails[floor-2]?.[from??0]?.includes(to)??false;
}
// Nearest reachable marked fight. The player may still take another fork.
export function nextBookFight(r){
 const road=roadFor(r);
 let previous=[r.path.at(-1)];
 for(let floor=r.floor+1;floor<=road.length;floor++){
  const lanes=road[floor-1].map((_,i)=>i).filter(i=>previous.some(from=>linked(floor,from,i)));
  for(const lane of lanes){
   const node=road[floor-1][lane];
   if(!duels[node]&&!checkpointFoes[node])continue;
   const kind=floor>1&&ordinaryRooms.includes(node)?opponents({...r,floor}):checkpointFoes[node]||node;
   return {floor:stationNumber(r,floor),kind,name:roomName(node,floor,r)};
  }
  previous=lanes;
 }
 return null;
}
export function prepareJourney(s){
 if(!s.route.roadRevision){s.route.roadRevision=2;s.route.oldRoadThrough=stationNumber(s.route)}

 // Keep an already-dealt reward on its original terms until the player leaves.
 if(!s.route.curriculum&&s.route.phase!=='reward')s.route.curriculum={...defaultCurriculum};
 s.route.bookTables??=s.wins;
 s.route.worldSeed??=s.route.seed;
 s.relics??=[];s.bag??=[];
 if(s.route.phase==='cache')prepareStop(s);
 const b=s.bout;
 if(b)b.pairedForms??=pairedForms(s);
 if(b)b.environment??=s.route.floor<=4?'wharf':s.route.floor<=9?'bamboo':'court';
 if(!b||b.tactics===2)return;
 b.relics=[...s.relics];
 for(const e of b.foes){
  if(!e.scout&&patterns[e.name])e.moves=patterns[e.name];
  if(e.name==='蒙眼刺客'&&s.route.floor===1)e.moves=openingMoves;
  if(e.openings){e.exposed=1;delete e.openings}
 }
 b.strength??=Number(s.relics.includes('青鋼劍'));
 b.dexterity??=Number(s.relics.includes('竹編護臂'));
 if(b.dodge){b.block+=5*b.dodge;b.log.push('舊版尚餘的閃避每次折為 5 點護體。')}
 delete b.dodge;b.tactics=2;
}
export const wares={
 '鐵衣令':{grade:'精良',kind:'信物',source:'鐵衣擂',tile:2,text:'堂主授你搶先手的訣竅。每場首回合多 1 點內力；打斷蓄勁，下回合再多 1 點。'},
 '雙煞令':{grade:'精良',kind:'信物',source:'雙煞擂',tile:4,text:'看破雙煞交手的空隙。此後每場比武帶 2 點勁力，每擊多打 2 點。'},
 '青鋼劍':{grade:'普通',kind:'裝備',source:'戰後選裝',tile:0,text:'每場比武帶 1 點勁力，每擊多打 1 點。'},
 '竹編護臂':{grade:'普通',kind:'裝備',source:'戰後選裝',tile:1,text:'每場比武帶 1 點守勁，每張護體招式多得 1 點護體。'},
 '銅護腕':{grade:'普通',kind:'裝備',source:'守關獎勵',tile:2,text:'每場比武開場獲得 6 點護體。'},
 '劍穗':{grade:'初始',kind:'信物',source:'啟程贈禮',tile:3,text:'每回合第一張攻擊牌，每擊多打 2 點。'},
 '三才玉環':{grade:'稀有',kind:'信物',source:'守關獎勵',tile:4,text:'同回合每出三張攻擊牌，本場守勁加 1。連擊只算一張牌。'},
 '藥葫蘆':{grade:'精良',kind:'信物',source:'守關獎勵',tile:5,text:'每場比武得勝時回復 4 點氣血。'},
 '針灸匣':{grade:'精良',kind:'信物',source:'客棧購置',tile:6,text:'抽到《劍傷》時，點那張牌便可施針，將它移出這場比武，不耗內力。'},
 '金創藥':{grade:'普通',kind:'藥物',source:'戰後拾取',tile:7,text:'立即回復 8 點氣血。'},
 '軟筋散':{grade:'普通',kind:'藥物',source:'戰後拾取',tile:8,text:'指定對手氣短兩回合，每擊傷害減四分之一。'}
};
export const goods=Object.fromEntries(Object.entries(wares).map(([n,w])=>[n,w.text]));
export const apothecary={'針灸匣':12,'金創藥':6,'軟筋散':7};
export function buyKit(s){return buyMedicine(s,'針灸匣')}
export function buyMedicine(s,name){
 if(s.route.phase!=='inn'||!Object.hasOwn(apothecary,name)||purchaseLimit(s,name,apothecary[name]))return false;
 pay(s,name,apothecary[name]);s.route.phase='map';return true;
}
// Roll once on victory. A separate stream keeps rewards stable through reloads,
 // inspections and training, without consuming the six rehearsal dice.
function victoryLoot(s,enemySeed){
 const r=s.route,first=r.floor===1;
 const kind=r.encounter??road[r.floor-1][r.path.at(-1)],gate=['elite1','elite2','banner'].includes(kind);
 const hard=['pair','guard','trio'].includes(kind);
 let seed=(enemySeed^Math.imul(r.floor,0x9e3779b1))>>>0;
 const roll=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296};
 const range=(lo,hi)=>lo+Math.floor(roll()*(hi-lo+1));
 const gold=gate?range(13,19):hard?range(8,13):range(5,9);
 const xp=gate?range(14,19):hard?range(8,12):range(5,9);
 const books=first||gate||r.missedBooks||roll()<(hard?balance.hardBookChance:balance.normalBookChance);
 const gear=first||gate||roll()<(hard?balance.hardGearChance:balance.normalGearChance);
 const medicine=roll()<(gate?balance.eliteDrugChance:hard?balance.hardDrugChance:balance.normalDrugChance)?(roll()<.6?'金創藥':'軟筋散'):null;
 return {gold:Math.round(gold*balance.goldScale),xp:Math.round(xp*balance.xpScale),books:Boolean(books),gear,medicine,elite:gate};
}
export function spoils(s){
 const r=s.route;
 if(r.phase!=='reward')return [];
 const items=[];
 if((!r.loot||r.loot.gear)&&!s.relics.some(n=>wares[n]?.source==='戰後選裝'))items.push('青鋼劍','竹編護臂');
 if((r.loot?.elite||[5,10].includes(r.floor))&&!r.tookRelic){
  items.push(...Object.keys(wares).filter(n=>wares[n].source==='守關獎勵'&&!s.relics.includes(n)));
  if(!s.relics.includes('劍穗'))items.push('劍穗');
 }
 const drug=r.loot?r.loot.medicine:(s.wins%2?'金創藥':'軟筋散');
 if(!r.tookItem&&drug)items.push(drug);
 return items;
}
export function pack(s,name,replace){
 if(!spoils(s).includes(name))return false;
 if(wares[name].kind==='藥物'){
  if(s.bag.length>=bagCapacity){
   if(!Number.isInteger(replace)||replace<0||replace>=s.bag.length)return false;
   s.bag[replace]=name;
  }else s.bag.push(name);
  s.route.tookItem=true;
  s.route.last=name+'已收入藥囊。';
 }else{
  s.relics.push(name);
  if(wares[name].source!=='戰後選裝')s.route.tookRelic=true;
 }
 return true;
}
export function useItem(s,index){
 const b=s.bout,item=s.bag[index];
 if(s.route.phase!=='fight'||b?.phase!=='playing'||b.pending||!Number.isInteger(index)||!item)return false;
 if(item==='金創藥'){if(b.hp===b.maxHp)return false;const old=b.hp;b.hp=Math.min(b.maxHp,b.hp+8);b.log=['敷上金創藥，回復 '+(b.hp-old)+' 氣血。']}
 else if(item==='軟筋散'){const e=b.foes[b.target];if(!e||e.hp<=0)return false;e.weak=(e.weak||0)+2;b.log=[e.name+'中了軟筋散，出招力道減弱。']}
 else return false;
 s.bag.splice(index,1);return true;
}
const lessonPages=[2,2,2,2,2,1];
export function lessons(s){
 const own=arts.filter(a=>!s.learned.includes(a.name)&&collection(s,a.name).length);
 const loan=arts.filter(a=>!s.learned.includes(a.name)&&!collection(s,a.name).length)
 .sort((a,b)=>Number(!!b.parent&&s.learned.includes(b.parent))-Number(!!a.parent&&s.learned.includes(a.parent))||b.rank-a.rank);
 // Later teachers offer one continuation of a technique the player already carries.
 const continuation=s.route.floor>=6?loan.filter(a=>s.equipped.includes(a.parent)).sort((a,b)=>a.rank-b.rank)[0]:null;
 if(continuation)loan.unshift(loan.splice(loan.indexOf(continuation),1)[0]);
 const shortlist=loan.filter((a,i)=>loan.findIndex(x=>x.branch===a.branch)===i).slice(0,s.route.curriculum?.schoolLoans??2);
 return [...own,...shortlist].map(a=>{
  const borrowed=!collection(s,a.name).length;
  const preview=borrowed?{...s,books:{...s.books,[a.name]:[lessonPages]}}:s;
  return {a,borrowed,continuation:a===continuation,cost:estimate(preview,a),preview};
 });
}
export function drill(s){
 if(s.route.phase!=='school')return false;
 s.xp+=8;s.route.last='跟師兄拆了三趟拳，得 8 點歷練。';s.route.phase='map';return true;
}
export function enter(s,lane){
 const r=s.route,floor=r.floor+1,road=roadFor(r);
 if(r.phase!=='map'||!Number.isInteger(lane)||!road[floor-1]?.[lane]||!linked(floor,r.path.at(-1),lane))return false;
 const id=road[floor-1][lane];r.floor=floor;r.path.push(lane);r.free=null;r.last='';r.tookRelic=false;r.tookItem=false;delete r.loot;delete r.fightReport;delete r.purchases;delete r.stop;
 delete r.encounter;
 if(id==='bypass'){r.phase='cache';r.stop={story:'crossing'}}
 else if(checkpointFoes[id])beginEncounter(s,checkpointFoes[id]);
 else if(duels[id])beginEncounter(s,floor>1&&ordinaryRooms.includes(id)?opponents(r):id);
 else if(id==='cave'){r.phase='cache';r.stop={story:'cave',finds:[]}}
 else{r.phase=id;if(id==='cache')prepareStop(s)}
 return true;
}
function beginEncounter(s,id){
  const r=s.route,floor=r.floor;
  r.encounter=id;
  const [profile,enemies]=duels[id];
  const b=startBout(s,profile,Math.floor(random(s)*4294967296));b.maxHp=r.maxHp;b.hp=r.hp;
  if(enemies)b.foes=enemies.map(([name,hp,block,moves])=>({name,hp,maxHp:hp,block,moves}));
  if(id==='press'){
   const witness=Boolean(episode(r,'receipt'));
   if(witness)b.foes.pop();
   b.log=[witness?'石生把領據攤開。教頭認出船工的花押，讓你進內。':'鐵衣令換來開門，教頭仍站在墨師傅身旁。兩人一前一後守住刻桌。','墨師傅放下刻刀：「接住這一掌，我把收勢那半句寫給你。」'];
  }
  if(id==='banner'){
   b.foes[0].rallies=true;
   for(const e of b.foes.slice(1))e.scout=true;
   b.log=['巡山旗主把竹哨含在嘴裏。打退哨兵，他便要停手召人。旗主一倒，兩哨就會散去。'];
  }
  if(id==='elite1'||id==='boss')b.foes[0].reads={};
  if(id==='boss')b.foes[0].sealsBreath=true;
  if(floor===1&&chapterOf(r)===1){b.foes[0].hp=b.foes[0].maxHp=balance.openingEnemyHp}
  const scale={elite1:balance.elite1HpScale,elite2:balance.elite2HpScale,boss:balance.bossHpScale}[id];
  if(scale!==undefined&&scale!==1)for(const foe of b.foes)foe.hp=foe.maxHp=Math.max(1,Math.round(foe.maxHp*scale));
  s.bout=b;prepareJourney(s);
  if(s.relics.includes('鐵衣令'))b.energy++;
  if(s.relics.includes('雙煞令'))b.strength+=2;
  if(id==='pair'){
   const front=b.foes[0];
   front.moves=front.moves.map(([damage,hits,...rest])=>[damage+(hits?balance.vanguardHitBonus:0),hits,...rest]);
   front.maxHp+=balance.vanguardHpBonus;front.hp=front.maxHp;
  }
  if(ordinaryRooms.includes(id)||id==='trio'){
   const extra=Math.floor(floor/5);
   if(extra)for(const e of b.foes)e.moves=e.moves.map(([damage,hits,...rest])=>[damage+(hits?extra:0),hits,...rest]);
  }
  const volume=chapterOf(r);
  if(volume>1){
   if(id==='boss'){
    const lineup=volumeBosses[volume-2];
    const scale=volume===2?balance.volumeTwoBossHp:balance.volumeThreeBossHp;
    const extraHit=volume===2?balance.volumeTwoBossHit:balance.volumeThreeBossHit;
    b.foes=lineup.map(([name,baseHp,block,pattern])=>{
     const hp=Math.round(baseHp*scale);
     const moves=pattern.map(([hit,times,...rest])=>[hit+(times?extraHit:0),times,...rest]);
     return {name,hp,maxHp:hp,block,moves};
    });
    b.foes[0].reads={};
    b.log=[volume===2?'掌契人截你氣脈，護契刀客趁隙追斬。兩人各有一套來招。':'鎮倉使將庫匙擱在案上：「勝得過我，這倉才由你開。」'];
   }else{
    const scale=volume===2?balance.volumeTwoRoadHp:balance.volumeThreeRoadHp;
    const extraHit=volume===2?balance.volumeTwoRoadHit:balance.volumeThreeRoadHit;
    for(const foe of b.foes){
     foe.hp=foe.maxHp=Math.round(foe.maxHp*scale);
     foe.moves=foe.moves.map(([hit,times,...rest])=>[hit+(times?extraHit:0),times,...rest]);
    }
   }
  }
  if(s.relics.includes('銅護腕'))b.block+=balance.braceletBlock;r.phase='fight';
}
export const caveRisk=count=>(count+1)*25;
export function exploreCave(s,choice){
 const r=s.route,stop=r.stop;
 if(r.phase!=='cache'||stop?.story!=='cave')return false;
 const count=stop.finds.length;
 if(choice==='coins'&&!count){
  s.gold+=4;r.last='你拾起洞口的四文散錢，趁腳步聲還遠，退回山道。';return leave(s);
 }
 if(choice!=='search'||count>=3)return false;
 if(random(s)*100<caveRisk(count)){
  beginEncounter(s,'guard');
  s.bout.log=['靴聲忽然停在背後。鐵衣客堵住洞口：「誰許你翻這趟鏢？」'+(count?'先前收好的抄本仍在書囊裏。':'')];
  return true;
 }
 const name=count?stop.finds[0].name:['分水劍','八卦步','撐篙長拳'][Math.floor(random(s)*3)];
 const sections=rollCopy(()=>random(s)),prior=collection(s,name);
 const kept=archiveCopy(s,name,sections,{kind:'cave',floor:stationNumber(r)});
 stop.finds.push({name,sections,prior,kept:kept.includes(sections)});
 r.last='在鏢囊裏找到《'+name+'》'+(kept.includes(sections)?'，已收進書囊。':'，已有藏本涵蓋這份抄本。');
 return true;
}
export function finishFight(s){
 const r=s.route,b=s.bout;if(r.phase!=='fight'||!['won','lost'].includes(b?.phase))return false;
 r.hp=b.hp;
 // Older bouts do not have complete observations. Leave their ordinary payout intact.
 if(b.record?.casts||b.record?.hurt||b.record?.blocked){
  const {guard,firstLink,hurt}=b.record;
  const reason=firstLink?'link':guard?'guard':b.phase==='won'&&hurt===0?'clean':null;
  r.fightReport={...b.record,turns:b.turn,reason,bonus:0};
 }
 if(b.phase==='lost'){r.phase='lost';r.last=b.log.join(' ');delete s.bout;return true}
 if(s.relics.includes('藥葫蘆'))r.hp=Math.min(r.maxHp,r.hp+balance.gourdHeal);
 delete s.bout;
 if(r.floor===15){s.wins++;r.phase='won';return true}
 r.pickedBooks=[];r.practiceBooks=[];r.free=null;
 if(r.stop?.story==='cave'){
  s.wins++;s.offer=[];s.finds={};s.drawInfo={};s.claimed=null;s.rewards={xp:false};
  r.loot={gold:0,xp:4,books:false,gear:false,medicine:null,elite:false};
  r.last='你逼開鐵衣客，帶著行囊脫身。這一仗只得歷練，先前收好的抄本仍在。';
  r.phase='reward';return true;
 }
 r.loot=victoryLoot(s,b.seed);
 if(r.encounter==='press'&&b.proofTurn)r.loot.books=true;
 if(r.fightReport?.reason){
  r.fightReport.bonus=balance.insightXp;
  r.loot.xp+=r.fightReport.bonus;
 }
 if(s.wins===0){
  const count=r.curriculum?.offer??3;
  const palm=nextBookFight(r)?.kind==='guard'&&!s.learned.includes('回浪綿掌')?'回浪綿掌':'撐篙長拳';
  s.offer=['分水劍','八卦步','拂塵功',palm,'護纜鐵衣'].slice(0,count);
  s.finds={'分水劍':s.finds['分水劍'],'八卦步':[2,2,2,2,2,1],'拂塵功':[2,2,2,1,2,2]};
  s.drawInfo=Object.fromEntries(s.offer.map(name=>[name,{kind:'opening'}]));
  for(const name of s.offer)if(!s.finds[name]){
   s.finds[name]=rollCopy(()=>random(s));s.drawInfo[name]={kind:'opening'};
  }
  s.wins=1;s.rewards={gold:false,xp:false,ticket:false}}
 else {
  let partner=null;
  if(r.loot.books&&r.bookTables===1)partner=companionFor(s);
  if(r.loot.books&&r.bookTables===3)partner=variationFor(s);
  if(chapterOf(r)>1&&r.loot.books){
   const continuation=arts.filter(a=>s.equipped.includes(a.parent)&&!s.learned.includes(a.name))
    .sort((a,b)=>a.rank-b.rank)[0];
   partner=continuation?.name??partner;
  }
  win(s,()=>random(s),partner);
 }
 if(r.loot.books&&s.offer.length)r.bookTables++;
 if(!r.loot.books){s.offer=[];s.finds={};s.drawInfo={}}
 r.missedBooks=!r.loot.books;
 const token={elite1:'鐵衣令',elite2:'雙煞令'}[r.encounter??road[r.floor-1][r.path.at(-1)]];
 if(token){s.rewards.ticket=false;
  if(s.relics.includes(token)){
   r.loot.xp+=8;r.last='守擂再勝，多得八點歷練。';
  }else{s.relics.push(token);
  r.last='守擂得勝，獲贈'+token+'。'+wares[token].text+'另可挑一件守關信物。';}
 }
 if(r.encounter==='press'){
  const witnessed=Boolean(episode(r,'receipt')),proof=b.proofTurn||0;
  remember(r,'woodblock',{witnessed,proof,turns:b.turn,links:b.record?.links||0,hp:r.hp});
  r.last='你把兩張領據往燈前一疊，連斷墨的位置也一樣。背後是同一塊印版。';
  if(proof){
   const name='撐篙長拳',pages=[2,1,2,1,2,2];
   s.offer=[name,...s.offer.filter(n=>n!==name)].slice(0,r.curriculum?.offer??3);
   s.finds[name]=pages;s.drawInfo[name]={kind:'printer'};
   r.last+=' 第 '+proof+' 回合，你接穩了試掌。墨師傅把《撐篙長拳》的收勢寫在親筆抄本上。可到書案領取。';
  }
 }
 r.phase='reward';return true;
}
export function receive(s,name){
 if(s.route.phase!=='reward'||!take(s,name))return false;
 const prior=collate(s.before),after=collate(collection(s,name));
 const improved=chapters.filter((_,i)=>after[i]>prior[i]);
 s.route.last='《'+name+'》'+(!s.before.length?'已收入書囊。':improved.length?'補回第'+improved.join('、')+'篇，已可與舊本合讀。':'這冊所載的篇章，舊本已有了。');
 if(!s.learned.includes(name)){
  s.route.practiceBooks=[...fieldPractice(s),name];s.route.free=s.route.practiceBooks[0];
 }
 return true;
}
export function train(s,name){
 const r=s.route,a=byName.get(name);
 if(r.phase==='school'&&!collection(s,name).length){
  const lesson=lessons(s).find(l=>l.a.name===name);
  if(!lesson||s.xp<lesson.cost)return false;
  s.books[name]=[[...lessonPages]];s.editions[name]=[{kind:'teacher',floor:stationNumber(r)}];
 }
 if(!a?.rank||s.learned.includes(name)||!collection(s,name).length)return false;
 const free=r.phase==='reward'&&fieldPractice(s).includes(name), paid=r.phase==='school'&&ready(s,a);
 if(!free&&!paid)return false;
 if(free){r.practiceBooks=fieldPractice(s).filter(n=>n!==name);r.free=r.practiceBooks[0]??null}
 const ok=free?rehearse(s,a,0,()=>random(s)):study(s,a,()=>random(s));
 if(ok)equip(s,a);
 r.last=ok?'學成《'+name+'》，已加入本輪牌組。':'《'+name+'》止於第'+'一二三四五六'[s.lastPractice.failed]+'篇。抄本已收好，可留待下次到師門再練。';
 if(paid)r.phase='map';
 return true;
}
export function innRecovery(r){return Math.min(r.maxHp-r.hp,Math.ceil(r.maxHp*balance.innHealFraction))}
export function rest(s,choice){
 const r=s.route;if(r.phase!=='inn')return false;
 if(choice==='heal'){const n=innRecovery(r);r.hp+=n;r.last='在客棧歇了一晚，回復 '+n+' 氣血。'}
 else if(choice==='casebook'){s.xp+=4;r.last='你替郎中把散亂的醫案按年排好，聽他講了一夜舊事，得 4 點歷練。'}
 else if(choice.startsWith('refine:')){
  const id=choice.slice(7);
  const name=deck(s).find(c=>c.id===id)?.name||(s.learned.includes(id)?id:null);
  if(s.stars.includes(id)||!name)return false;
  s.stars.push(id);r.last='練熟《'+name+'》，本輪改用精練牌。';
 }else return false;
 r.phase='map';return true;
}
const stories={
 register:{name:'簿上的指印',image:'ledger',text:'紙坊的小徒把兩張領據對著窗紙。領銀人的名字不同，指印缺的卻是同一角。門外傳來找他的腳步聲。',choices:[
  {id:'ink',label:'買下兩張拓樣',gold:-6,xp:12,result:'你把拓樣夾進書囊，兩枚指印分毫不差。'},
  {id:'watch',label:'替小徒望風',hp:-2,gold:12,result:'小徒趁隙逃回後巷，托你帶走留作盤纏的碎銀。'}]},
 carter:{name:'秤上的石頭',image:'porter',text:'鹽道旁，一個車伕掀開銀袋給你看。上層是銀，下層全是河石。他不敢回倉，也不能讓車停在這裏。',choices:[
  {id:'lift',label:'合力挪車入林',hp:-3,xp:14,result:'挪走最後一袋，你看清了袋底的倉印。'},
  {id:'drug',label:'買下車伕的傷藥',gold:-5,item:'金創藥',result:'車伕收下盤纏，把未拆的金創藥交給你。'}]},

 ferry:{name:'最後一班渡船',image:'porter',text:'跳板快收了，鏢箱卻還擱在亭裏。老鏢師的徒弟揉著肩，怎樣也抬不起來。你伸手試了試，箱底沉得偏向一邊。',
  choices:[
   {id:'carry',label:'替徒弟抬箱上船',gold:12,result:'箱子剛落上船板，艄公就抽走了跳板。老鏢師從腰包數出十二文腳錢，擱在你手上。'},
   {id:'lesson',label:'請鏢師示範怎樣借力',xp:6,result:'鏢師讓你和徒弟換了站位。這回兩人一齊沉肩，箱子便平平穩穩離了地。你記住了腳下那半步。'}]},
 letter:{name:'雨中的家書',image:'ledger',text:'暴雨把驛亭的屋簷淋穿了。一個送信的孩子護著懷裏的紙包：「我娘的藥還在對岸，末班渡船就要走了。」船家伸出四根手指。',
  choices:[
   {id:'fare',label:'替孩子付船錢',gold:-4,item:'金創藥',result:'孩子捧回藥包時，藥鋪的老掌櫃也跟著下了船。他聽說是你付的船錢，取了一盒金創藥相贈。'},
   {id:'oar',label:'替船家搖一程櫓',hp:-2,xp:8,result:'水急得很。掌櫓的婆婆教你順著回水換手。你磨破了掌心，倒也摸清了順勢借力的訣竅。'}]},
 bell:{name:'拳館門前的空凳',image:'lesson',text:'小拳館今日拆招，門前卻少了一個陪練。館主端出一張長凳：「坐著看也成。肯下場陪小徒走一趟，我照例付謝儀。」',
  choices:[
   {id:'spar',label:'下場陪小徒拆招',hp:-3,gold:15,result:'小徒連試了三回才把你逼退一步，自己先笑了。館主替你揉開臂上的瘀青，依約付了謝儀。'},
   {id:'watch',label:'坐在廊下看拳',xp:5,result:'你看了幾輪才發現，每逢小徒抬肩，師父便早一步讓開。回到路上，你試著把肩放鬆了些。'}]}
};
export const marketRanges={
 '青鋼劍':[18,24],'竹編護臂':[16,22],'銅護腕':[22,30],
 '三才玉環':[24,32],'藥葫蘆':[26,34],'針灸匣':[14,20],
 '金創藥':[12,16],'軟筋散':[9,13]
};
function prepareStop(s){
 const r=s.route;if(r.stop)return;
 // Isolate room rolls from shuffles and the six study checks.
 let seed=(r.seed^Math.imul(r.floor,2654435761))>>>0;
 seed=Math.imul(seed^(seed>>>16),0x85ebca6b);seed=Math.imul(seed^(seed>>>13),0xc2b2ae35);seed^=seed>>>16;
 const roll=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return Math.floor(seed/4294967296*n)};
 if(r.floor===2){
  const ids=['ferry','letter','bell'];r.stop={story:chapterOf(r)===1?ids[roll(ids.length)]:chapterOf(r)===2?'register':'carter'};return;
 }
 if(r.purchases?.length){r.stop={stock:{'銅護腕':16,'金創藥':6,'軟筋散':6}};return}
 const pick=(kind,count)=>{
  const pool=Object.keys(marketRanges).filter(n=>wares[n].kind===kind);
  const selected=[];
  while(selected.length<count){
   const unseen=pool.filter(n=>!s.relics.includes(n)),candidates=unseen.length?unseen:pool;
   const n=candidates[roll(candidates.length)];pool.splice(pool.indexOf(n),1);selected.push(n);
  }
  return selected;
 };
 const names=[...pick('裝備',2),...pick('信物',1),'金創藥','軟筋散'];
 r.stop={sharedMedicine:true,stock:Object.fromEntries(names.map(n=>{const [min,max]=marketRanges[n];return [n,Math.round((min+roll(max-min+1))*balance.marketPriceScale)]}))};
}
export function storyAt(s){prepareStop(s);return stories[s.route.stop.story]}
export function storyLimit(s,c){
 if(c.gold<0&&s.gold< -c.gold)return '銅錢不足';
 if(c.hp<0&&s.route.hp<= -c.hp)return '氣血不足';
 if(c.item&&s.bag.length>=bagCapacity)return '藥囊已滿';
 return '';
}
export function escort(s,choice){
 const r=s.route;if(r.phase!=='cache'||r.floor!==2)return false;
 const c=storyAt(s).choices.find(option=>option.id===choice);
 if(!c||storyLimit(s,c))return false;
 s.gold+=c.gold||0;s.xp+=c.xp||0;r.hp+=c.hp||0;if(c.item)s.bag.push(c.item);
 r.last=c.result;r.phase='map';return true;
}
export function stockAt(s){prepareStop(s);return s.route.stop.stock}
export function purchaseLimit(s,name,price){
 if(s.relics.includes(name))return '已攜帶';
 if(wares[name].kind==='藥物'&&s.bag.length>=bagCapacity)return '藥囊已滿';
 if(s.gold<price)return '尚欠 '+(price-s.gold)+' 文';
 return '';
}
function pay(s,name,price){
 s.gold-=price;(wares[name].kind==='藥物'?s.bag:s.relics).push(name);
 s.route.last='花了 '+price+' 文買下'+name+'。';
}
export function stallLimit(s,name){
 if(s.route.phase!=='cache'||s.route.floor===2||!Object.hasOwn(stockAt(s)??{},name))return '此處沒有這件貨品';
 if(s.route.purchases?.includes(name))return '已售出';
 if(s.route.stop.sharedMedicine&&wares[name].kind==='藥物'&&s.route.purchases?.some(n=>wares[n]?.kind==='藥物'))return '今日藥材已用完';
 return purchaseLimit(s,name,stockAt(s)[name]);
}
export function buyAtStall(s,name){
 if(stallLimit(s,name))return false;
 pay(s,name,stockAt(s)[name]);(s.route.purchases??=[]).push(name);return true;
}
export function leave(s){
 const r=s.route;
 if(r.stop?.story==='crossing'&&r.phase==='cache')return confirmCrossing(s);
 if(!['cache','reward','school'].includes(r.phase))return false;
 if(r.phase==='cache'&&!r.last)r.last='你繼續趕路。';
 r.free=null;r.practiceBooks=[];r.phase='map';return true;
}
