import {fresh,win,take,study,rehearse,equip,ready,deck} from './rules.js';
import {startBout} from './combat.js';
import {arts,byName} from './catalogue.js';
import {collection,estimate,rollCopy} from './manuscripts.js';

export const road=[
 ['fighter'],['fighter','cache','inn'],['school','pair','guard'],['inn','school'],['elite1'],
 ['cache','pair','school','inn'],['school','inn','guard'],['guard','cache','pair'],['inn','school'],['elite2'],
 ['guard','cache','school','pair'],['school','pair','inn'],['fighter','school','cache'],['inn','guard'],['boss']
];
export const rooms={
 fighter:'橋頭比武',guard:'鐵衣守擂',pair:'雙人合擊',inn:'客棧',school:'師門',cache:'山道貨郎',
 elite1:'鐵衣堂主',elite2:'雙煞把關',boss:'守壇劍宗'
};
export const bagCapacity=3;
export const roomName=(type,floor)=>type==='cache'&&floor===2?'江湖偶遇':rooms[type];
export const defaultCurriculum=Object.freeze({offer:5,keep:2,schoolLoans:2});
export const teachers=Object.freeze({sword:'白虹劍法',palm:'武當綿掌'});
export const fieldPractice=s=>s.route.practiceBooks??(s.route.free?[s.route.free]:[]);
export function newJourney(seed=Date.now(),curriculum=defaultCurriculum){
 const {offer,keep,schoolLoans}=curriculum;
 if(!Number.isInteger(offer)||offer<1||offer>5||!Number.isInteger(keep)||keep<1||keep>offer||
    !Number.isInteger(schoolLoans)||schoolLoans<0||schoolLoans>7)throw Error('無效的研習設定');
 let openingSeed=seed>>>0;
 const s=fresh(()=>((openingSeed=(Math.imul(openingSeed,1664525)+1013904223)>>>0)/4294967296));
 s.route={curriculum:{offer,keep,schoolLoans},floor:0,phase:'gift',path:[],hp:40,maxHp:40,seed:seed>>>0,last:'',free:null};
 prepareJourney(s);s.wins=0;s.xp=0;s.rewards={};return s;
}
function random(s){const r=s.route;r.seed=(Math.imul(1664525,r.seed)+1013904223)>>>0;return r.seed/4294967296}
export function gift(s,id){
 const r=s.route;if(r.phase!=='gift'||!(['health','xp'].includes(id)||Object.hasOwn(teachers,id)))return false;
 if(id==='health'){r.maxHp+=6;r.hp=r.maxHp}else if(id==='xp')s.xp+=12;
 else{
  const name=teachers[id];s.learned.push(name);equip(s,byName.get(name));
  r.last='臨行拜師，已學成《'+name+'》，招式已入牌組。';
 }
 if(!s.relics.includes('劍穗'))s.relics.push('劍穗');
 r.phase='map';return true;
}
// Lane indices from the original journey retain their rooms and connections.
const trails=[
 [[0,1,2]], [[0,1],[1,2],[2]], [[0],[0,1],[1]], [[0],[0]],
 [[0,1,2,3]], [[0],[1],[1,2],[2]], [[0],[0,1],[1,2]], [[0,1],[1],[1]], [[0],[0]],
 [[0,1,2,3]], [[0],[1],[1,2],[2]], [[0,1],[1],[1,2]], [[0],[0,1],[1]], [[0],[0]]
];
export function linked(floor,from,to){
 if(floor===1)return to===0;
 return trails[floor-2]?.[from??0]?.includes(to)??false;
}
const duels={
 fighter:[0],guard:[1],pair:[2],
 elite1:[1,[['鐵衣堂主',71,7,[[8,1,0],[0,0,7],[6,2,0]]]]],
 elite2:[2,[['青煞',46,0,[[7,1,0],[4,2,0]]],['白煞',42,4,[[0,0,5],[9,1,0]]]]],
 boss:[0,[['守壇劍宗',110,8,[[12,1,0],[7,2,0],[0,0,10],[19,1,0]]]]]
};
// Each pattern is announced throughout the player's turn and resolved on 收勢.
const patterns={
 '蒙眼刺客':[[7,1,0,'wound'],[0,0,6,'disrupt'],[5,2,0,'wound']],
 '鐵衣客':[[0,0,0,'charge'],[7,2,0],[0,0,6,'counter'],[15,1,0]],
 '鐵衣堂主':[[0,0,7,'counter'],[15,1,0],[0,0,0,'charge'],[9,2,0,'wound']],
 '前哨':[[5,1,0],[4,2,0,'wound']],'後哨':[[0,0,0,'feint'],[7,1,0]],
 '青煞':[[9,1,0,'wound'],[6,2,0]],'白煞':[[0,0,0,'feint'],[8,1,0],[0,0,4,'disrupt']],
 '守壇劍宗':[[13,1,0],[0,0,0,'charge'],[8,3,0],[0,0,8,'counter'],[18,1,0,'wound']]
};
export function prepareJourney(s){
 // Keep an already-dealt reward on its original terms until the player leaves.
 if(!s.route.curriculum&&s.route.phase!=='reward')s.route.curriculum={...defaultCurriculum};
 s.relics??=[];s.bag??=[];
 if(s.route.phase==='cache')prepareStop(s);
 const b=s.bout;
 if(b)b.environment??=s.route.floor<=4?'wharf':s.route.floor<=9?'bamboo':'court';
 if(!b||b.tactics===2)return;
 b.relics=[...s.relics];
 for(const e of b.foes){
  if(patterns[e.name])e.moves=patterns[e.name];
  if(e.name==='蒙眼刺客'&&s.route.floor===1)e.moves=[[7,1,0,'wound'],[0,0,4,'disrupt'],[4,2,0,'wound']];
  if(e.openings){e.exposed=1;delete e.openings}
 }
 b.strength??=Number(s.relics.includes('青鋼劍'));
 b.dexterity??=Number(s.relics.includes('竹編護臂'));
 if(b.dodge){b.block+=5*b.dodge;b.log.push('舊版尚餘的閃避每次折為 5 點護體。')}
 delete b.dodge;b.tactics=2;
}
export const wares={
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
 const r=s.route,first=r.floor===1,gate=r.floor===5||r.floor===10;
 const kind=road[r.floor-1][r.path.at(-1)], hard=kind==='pair'||kind==='guard';
 let seed=(enemySeed^Math.imul(r.floor,0x9e3779b1))>>>0;
 const roll=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296};
 const range=(lo,hi)=>lo+Math.floor(roll()*(hi-lo+1));
 const gold=gate?range(13,19):hard?range(8,13):range(5,9);
 const xp=gate?range(14,19):hard?range(8,12):range(5,9);
 const books=first||gate||r.missedBooks||roll()<(hard?.82:.65);
 const gear=first||gate||roll()<(hard?.55:.25);
 const medicine=roll()<(gate?.8:hard?.6:.45)?(roll()<.6?'金創藥':'軟筋散'):null;
 return {gold,xp,books:Boolean(books),gear,medicine};
}
export function spoils(s){
 const r=s.route;
 if(r.phase!=='reward')return [];
 const items=[];
 if((!r.loot||r.loot.gear)&&!s.relics.some(n=>wares[n]?.source==='戰後選裝'))items.push('青鋼劍','竹編護臂');
 if([5,10].includes(r.floor)&&!r.tookRelic){
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
 const shortlist=loan.filter((a,i)=>loan.findIndex(x=>x.branch===a.branch)===i).slice(0,s.route.curriculum?.schoolLoans??2);
 return [...own,...shortlist].map(a=>{
  const borrowed=!collection(s,a.name).length;
  const preview=borrowed?{...s,books:{...s.books,[a.name]:[lessonPages]}}:s;
  return {a,borrowed,cost:estimate(preview,a),preview};
 });
}
export function drill(s){
 if(s.route.phase!=='school')return false;
 s.xp+=8;s.route.last='跟師兄拆了三趟拳，得 8 點歷練。';s.route.phase='map';return true;
}
export function enter(s,lane){
 const r=s.route,floor=r.floor+1;
 if(r.phase!=='map'||!Number.isInteger(lane)||!road[floor-1]?.[lane]||!linked(floor,r.path.at(-1),lane))return false;
 const id=road[floor-1][lane];r.floor=floor;r.path.push(lane);r.free=null;r.last='';r.tookRelic=false;r.tookItem=false;delete r.loot;delete r.purchases;delete r.stop;
 if(duels[id]){
  const [profile,enemies]=duels[id];
  const b=startBout(s,profile,Math.floor(random(s)*4294967296));b.maxHp=r.maxHp;b.hp=r.hp;
  if(enemies)b.foes=enemies.map(([name,hp,block,moves])=>({name,hp,maxHp:hp,block,moves}));
  if(id==='elite1'||id==='boss')b.foes[0].reads={};
  if(id==='boss')b.foes[0].sealsBreath=true;
  if(floor===1){b.foes[0].hp=b.foes[0].maxHp=34}
  s.bout=b;prepareJourney(s);if(s.relics.includes('銅護腕'))b.block+=6;r.phase='fight';
 }else{r.phase=id;if(id==='cache')prepareStop(s)}
 return true;
}
export function finishFight(s){
 const r=s.route,b=s.bout;if(r.phase!=='fight'||!['won','lost'].includes(b?.phase))return false;
 r.hp=b.hp;
 if(b.phase==='lost'){r.phase='lost';r.last=b.log.join(' ');delete s.bout;return true}
 if(s.relics.includes('藥葫蘆'))r.hp=Math.min(r.maxHp,r.hp+4);
 delete s.bout;
 if(r.floor===15){s.wins++;r.phase='won';return true}
 r.pickedBooks=[];r.practiceBooks=[];r.free=null;
 if(s.wins===0){s.offer=s.offer.map(n=>n==='武當太和功'?'八卦步':n);
  s.finds['八卦步']=[2,2,2,2,2,1];s.drawInfo['八卦步']={kind:'opening'};
  const count=r.curriculum?.offer??3;
  s.offer=[...s.offer,'武當長拳','武當鐵布衫'].slice(0,count);
  for(const name of s.offer)if(!s.finds[name]){
   s.finds[name]=rollCopy(()=>random(s));s.drawInfo[name]={kind:'opening'};
  }
  s.wins=1;s.rewards={gold:false,xp:false,ticket:false}}
 else win(s,()=>random(s));
 r.loot=victoryLoot(s,b.seed);
 if(!r.loot.books){s.offer=[];s.finds={};s.drawInfo={}}
 r.missedBooks=!r.loot.books;
 if(r.floor===5||r.floor===10)s.rewards.ticket=false;
 r.phase='reward';return true;
}
export function receive(s,name){
 if(s.route.phase!=='reward'||!take(s,name))return false;
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
  s.books[name]=[[...lessonPages]];s.editions[name]=[{kind:'teacher',floor:r.floor}];
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
export function rest(s,choice){
 const r=s.route;if(r.phase!=='inn')return false;
 if(choice==='heal'){const n=Math.min(r.maxHp-r.hp,Math.ceil(r.maxHp*.3));r.hp+=n;r.last='在客棧歇了一晚，回復 '+n+' 氣血。'}
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
 '青鋼劍':[12,19],'竹編護臂':[10,16],'銅護腕':[13,20],
 '三才玉環':[20,30],'藥葫蘆':[15,23],'針灸匣':[11,17],
 '金創藥':[4,7],'軟筋散':[8,11]
};
function prepareStop(s){
 const r=s.route;if(r.stop)return;
 // Isolate room rolls from shuffles and the six study checks.
 let seed=(r.seed^Math.imul(r.floor,2654435761))>>>0;
 seed=Math.imul(seed^(seed>>>16),0x85ebca6b);seed=Math.imul(seed^(seed>>>13),0xc2b2ae35);seed^=seed>>>16;
 const roll=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return Math.floor(seed/4294967296*n)};
 if(r.floor===2){
  const ids=Object.keys(stories);r.stop={story:ids[roll(ids.length)]};return;
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
 r.stop={stock:Object.fromEntries(names.map(n=>{const [min,max]=marketRanges[n];return [n,min+roll(max-min+1)]}))};
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
 if(s.route.phase!=='cache'||s.route.floor===2||!Object.hasOwn(stockAt(s),name))return '此處沒有這件貨品';
 if(s.route.purchases?.includes(name))return '已售出';
 return purchaseLimit(s,name,stockAt(s)[name]);
}
export function buyAtStall(s,name){
 if(stallLimit(s,name))return false;
 pay(s,name,stockAt(s)[name]);(s.route.purchases??=[]).push(name);return true;
}
export function leave(s){
 const r=s.route;
 if(!['cache','reward','school'].includes(r.phase))return false;
 if(r.phase==='cache'&&!r.last)r.last='你繼續趕路。';
 r.free=null;r.practiceBooks=[];r.phase='map';return true;
}
