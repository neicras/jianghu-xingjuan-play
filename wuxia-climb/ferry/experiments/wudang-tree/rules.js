import {arts, basics, byName} from "./catalogue.js";
import {collection,collate,estimate,withCopy,deal,xpPerWin,pageOdds} from "./manuscripts.js";
import {acquisition} from "./editions.js";
export const purse=8, fee=24;
export function fresh(rng=Math.random){
  const s={version:4,editions:{"武當丹劍":[{kind:"primer"}]},gateNotes:{},wins:1,gold:0,xp:6,tickets:0,rewards:{xp:false,gold:false,ticket:false},drawInfo:{},books:{"武當丹劍":[[2,2,0,2,1,2]]},learned:[],equipped:[],stars:[],focus:null,
    offer:["武當丹劍","武當太和功","白虹劍法"],claimed:null};
  for(const name of s.offer)s.drawInfo[name]={kind:"opening"};
  deal(s,rng);s.finds["武當丹劍"]=[2,0,2,1,2,0];s.finds["白虹劍法"]=[2,2,2,1,2,2];return s;
}
export const learned=(s,a)=>s.learned.includes(a.name);
export const ready=(s,a)=>!learned(s,a)&&collection(s,a.name).length>0&&s.xp>=estimate(s,a);
export const refineCost=(s,a)=>estimate(s,a)+4;
export function deck(s){
  return [...basics.flatMap(a=>Array.from({length:a.copies},(_,i)=>({name:a.name,id:a.name+i}))),
    ...s.equipped.map(name=>({name,id:name}))];
}
export const mergedCopies=(s,a,incoming)=>withCopy(a,collection(s,a.name),incoming,sections=>combinedOdds(gateOdds(s,a,sections)));
export function pickedBooks(s){return s.route?.pickedBooks??(s.claimed?[s.claimed]:[])}
export function picksLeft(s){
 return Math.max(0,Math.min(s.offer.length,s.route?.curriculum?.keep??1)-pickedBooks(s).length);
}
export function take(s,name){
  const picked=pickedBooks(s);
  if(!picksLeft(s)||picked.includes(name)||!s.offer.includes(name))return false;
  if(!s.finds[name])return false;
  s.before=collection(s,name);
  const incoming=s.finds[name], kept=mergedCopies(s,byName.get(name),incoming);
  s.editions??={};
  const previous=s.editions[name]||[];
  s.editions[name]=kept.map(copy=>copy===incoming?acquisition(s,name):previous[s.before.indexOf(copy)]||{kind:'old'});
  s.books[name]=kept;
  if(s.route)s.route.pickedBooks=[...picked,name];
  s.claimed=name;
  return true;
}
// On the journey a grounded novice can work through gaps in grades nine to seven.
const foundationPageOdds=[80,94,100];
export function hasNoviceFoundation(s,a,grounded=!a.parent||s.learned.includes(a.parent)){
  return Boolean(s.route && a.rank>=7 && grounded);
}
export function gateOdds(s,a,sections=collate(collection(s,a.name)),grounded=!a.parent||s.learned.includes(a.parent)){
  const odds=hasNoviceFoundation(s,a,grounded)?foundationPageOdds:pageOdds;
  return sections.map((q,i)=>{
    const needsFoundation=!grounded&&(i===2||i===5);
    const base=Math.round(odds[q]*(needsFoundation ? .72 : 1));
    return Math.min(100,base+10*(s.gateNotes?.[a.name]?.[i]||0));
  });
}
export const combinedOdds=odds=>odds.reduce((chance,p)=>chance*p/100,100);
export const percent=chance=>Number(chance.toFixed(1));
export const trainingChance=(s,a,sections)=>percent(combinedOdds(gateOdds(s,a,sections)));
export const attemptFee=price=>Math.min(4,Math.ceil(price/3));
export function study(s,a,rng=Math.random){
  if(!ready(s,a))return false;
  return rehearse(s,a,estimate(s,a),rng);
}
export function rehearse(s,a,price,rng){
  const odds=gateOdds(s,a), rolls=[];
  for(const threshold of odds){
    const die=1+Math.floor(rng()*100);
    rolls.push(die);
    if(die>threshold)break;
  }
  const failed=rolls.findIndex((die,i)=>die>odds[i]);
  const spent=failed<0?price:attemptFee(price);
  s.xp-=spent;
  if(failed<0)s.learned.push(a.name);
  else{
    s.gateNotes[a.name]??=odds.map(()=>0);
    s.gateNotes[a.name][failed]++;
  }
  s.lastPractice={name:a.name,odds,rolls,failed,spent};
  return failed<0;
}
export function equip(s,a){
  if(!learned(s,a))return false;
  if(s.equipped.includes(a.name))s.equipped=s.equipped.filter(n=>n!==a.name);
  else s.equipped.push(a.name);
  return true;
}
export function refine(s,id){
  if(s.stars.includes(id))return false;
  const a=byName.get(id);
  if(a?.rank){
    if(!learned(s,a)||s.xp<refineCost(s,a))return false;
    s.xp-=refineCost(s,a);
  }else{
    if(s.gold<fee||!deck(s).some(c=>c.id===id))return false;
    s.gold-=fee;
  }
  s.stars.push(id);return true;
}
function useful(s,a){return !s.stars.includes(a.name)&&!collate(collection(s,a.name)).every(q=>q===2)}
function focusDrop(s){
  const a=byName.get(s.focus);
  return a&&useful(s,a)?a:null;
}
function weight(s,a){
  const gap=a.parent&&!s.learned.includes(a.parent);
  return (gap?Math.pow(.68,9-a.rank):5) * (collection(s,a.name).length?2:1);
}
export const band=a=>a.rank>=7?'下三品':a.rank>=4?'中三品':'上三品';
export function claimReward(s,key){
  if(!Object.hasOwn(s.rewards,key)||s.rewards[key]!==false)return false;
  if(key==='xp')s.xp+=xpPerWin;
  else if(key==='gold')s.gold+=purse;
  else if(key==='ticket')s.tickets++;
  else return false;
  s.rewards[key]=true;
  return true;
}
export function win(s,rng=Math.random){
  s.wins++;s.claimed=null;s.before=null;s.drawInfo={};
  s.rewards={xp:false,gold:false};
  if(rng()<.25)s.rewards.ticket=false;
  const pool=arts.filter(a=>useful(s,a));
  const offered=[];
  const focus=focusDrop(s);
  if(focus){offered.push(focus);s.drawInfo[focus.name]={kind:'focus'}}
  while(offered.length<(s.route?.curriculum?.offer??3)){
    const candidates=pool.filter(a=>!offered.includes(a));
    if(!candidates.length)break;
    const total=candidates.reduce((n,a)=>n+weight(s,a),0);
    let roll=rng()*total;
    const picked=candidates.find(a=>(roll-=weight(s,a))<0)||candidates.at(-1);
    const bandWeight=candidates.reduce((n,a)=>n+(band(a)===band(picked)?weight(s,a):0),0);
    s.drawInfo[picked.name]={kind:'random',bandChance:bandWeight/total,nameChance:weight(s,picked)/total};
    offered.push(picked);
  }
  s.offer=offered.map(a=>a.name);deal(s,rng);
  return true;
}
