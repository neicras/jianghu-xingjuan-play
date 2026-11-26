import {byName} from './catalogue.js?paper1';
// Section quality is ordered: missing, damaged, intact.
export const chapters = ['一','二','三','四','五','六'];
export const qualities = ['佚','殘','全'];
export function collate(copies) {
  return chapters.map((_,i)=>copies.reduce((best,copy)=>Math.max(best,copy[i]),0));
}
const penalty = q => [6,2,0][q];
export const cost = (a,sections) => 4 + 2*(9-a.rank) + sections.reduce((sum,q)=>sum+penalty(q),0);
// The six chapter readings determine a novice's starting odds.
export const pageOdds = [65,85,100];
export const textChance = sections => sections.reduce((p,q)=>p*pageOdds[q]/100,1);
export const missingChance=.36, intactChance=.34;
export function rollCopy(rng=Math.random) {
  const copy=chapters.map(()=>{
    const roll=rng();
    return roll<missingChance?0:roll<1-intactChance?1:2;
  });
  // Every drop is a fragmentary edition, even when the first roll is pristine.
  if(copy.every(q=>q===2))copy[Math.floor(rng()*6)]=1;
  if(copy.every(q=>q===0))copy[Math.floor(rng()*6)]=1;
  return copy;
}
export function collection(s,name){return s.books[name]||[]}
export function estimate(s,a){return cost(a,collate(collection(s,a.name)))}
export function withCopy(a,owned,incoming,score=textChance){
  const copies=[...owned,incoming];
  if(copies.length<=3)return copies;
  // When costs tie keep the player's existing edition. Compare all four
  // possible sets; a later copy can replace one of the first three.
  const original=collate(owned);
  let best=owned, price=cost(a,original), chance=score(original);
  for(let i=0;i<owned.length;i++){
    const candidate=copies.filter((_,index)=>index!==i);
    const sections=collate(candidate), next=cost(a,sections), odds=score(sections);
    if(odds<score(original))continue;
    if(next<price||(next===price&&odds>chance)){best=candidate;price=next;chance=odds}
  }
  return best;
}
export const xpPerWin=8, rerollFee=4;
export function deal(s,rng=Math.random){
  s.legacyFinds=false;
  s.finds=Object.fromEntries(s.offer.map(name=>[name,rollCopy(rng)]));
  s.rerolled=false;
}
export function reroll(s,rng=Math.random){
  if(s.claimed||s.rerolled||!s.offer.length||(!s.tickets && s.gold<rerollFee))return false;
  if(s.tickets)s.tickets--;else s.gold-=rerollFee;
  deal(s,rng);s.rerolled=true;return true;
}
export function migrate(old) {
  if(old.version===4)return old;
  if(old.version===3){
    const s={...old,version:4,gateNotes:{},legacyFinds:true};
    // Previous attempts recorded the art but no specific failed chapter.
    for(const [name,n] of Object.entries(old.practiceNotes||{})){
      const sections=collate(collection(s,name));
      const weakest=sections.indexOf(Math.min(...sections));
      const notes=chapters.map(()=>0);notes[weakest]=n;s.gateNotes[name]=notes;
    }
    delete s.practiceNotes;delete s.lastPractice;
    return s;
  }
  // Earlier victories credited balances automatically, so mark both rows claimed.
  if(old.version===2)return migrate({...old,version:3,rewards:{xp:true,gold:true},tickets:0,drawInfo:{}});

  const s={...old,version:2,xp:Math.max(14,old.wins*xpPerWin),books:{}};
  for(const [name,n] of Object.entries(old.pages)) {
    if(n<=0)continue;
    // Approximate the old scalar progress; a previously complete text is legible throughout.
    const a=byName.get(name);
    if(!a)continue;
    const sections=chapters.map((_,i)=>i===0?2:Math.min(2,Math.max(0,Math.ceil((n/a.need*6-i)*2))));
    s.books[name]=[sections];
  }
  delete s.pages;
  deal(s);
  if(s.claimed&&s.books[s.claimed]){
    s.finds[s.claimed]=s.books[s.claimed].at(-1);
    s.before=s.books[s.claimed].slice(0,-1);
  }
  return migrate(s);
}

