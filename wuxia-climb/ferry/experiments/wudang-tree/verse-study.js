// Original six-line verses for the five opening manuscripts in the reading study.
import {byName} from './catalogue.js';
import {reviewJourney} from './review-frames.js?folio26';
import {receive} from './journey.js?folio26';
import {equip,mergedCopies,pickedBooks,picksLeft} from './rules.js?folio26';
import {collection,collate} from './manuscripts.js';
import {openingVerses as verses} from './manual-verses.js?readingtable3';
export {verses};
const readings={
 八卦步:{index:5,clue:'你手上有一張傷勢牌。八卦步能讓你棄一張，再抽一張。',other:'循原路折返',preview:'這樣會把原來那張牌帶回手中。',match:'舊牌棄去，另抽一張，正合「另尋新徑」。'},
 拂塵功:{index:3,clue:'一人來時得三點護體，兩人來時得六點。試想拂絲會如何變化。',other:'人多絲更薄',preview:'絲影越薄，便解釋不了護體為何增加。',match:'絲影由線連成一面，照應了對手越多、護體越厚。'}
};
export function startReading(){
 const s=reviewJourney('books');
 s.readingVisit=1;s.inkLeft=1;s.notes={};
 return s;
}
export function visitBinder(s){
 if(s.readingVisit!==1)return false;
 s.readingVisit=2;s.inkLeft=1;s.route.pickedBooks=[];s.route.practiceBooks=[];s.route.free=null;s.claimed=null;
 // A binder's fixed comparison tray. Players can compare decisions on the same copies.
 s.finds={'太極劍法':[2,2,2,2,2,2],'八卦步':[0,1,0,0,1,2],'拂塵功':[1,0,0,2,0,1],'武當長拳':[2,1,2,2,0,2],'武當鐵布衫':[2,1,2,2,0,2]};
 s.offer=Object.keys(s.finds);
 return true;
}
export function inspect(s,name,archive=false){
 const a=byName.get(name),own=collection(s,name),prior=collate(own),incoming=archive?prior:s.finds[name];
 const taken=archive||pickedBooks(s).includes(name);
 const pages=taken?prior:collate(mergedCopies(s,a,incoming));
 const gaps=pages.flatMap((q,i)=>q<2?[i]:[]);
 const gloss=readings[name];
 const canInfer=gaps.length===1&&pages[gaps[0]]===1&&gloss?.index===gaps[0];
 return {prior,incoming,pages,taken,gaps,canInfer,gloss,gain:pages.filter((q,i)=>q>prior[i]).length};
}
export function keepCopy(s,name){
 return Boolean(verses[name]&&s.offer.includes(name)&&picksLeft(s)&&receive(s,name));
}
export function learnVerse(s,name,ending){
 if(!verses[name]||!collection(s,name).length||s.learned.includes(name))return false;
 const {gaps,canInfer,gloss}=inspect(s,name,true);
 if(gaps.length){
  if(!canInfer||s.inkLeft<1||ending!==verses[name][gloss.index][1])return false;
  s.inkLeft--;s.notes[name]=gloss.index;
 }
 s.learned.push(name);equip(s,byName.get(name));
 s.route.practiceBooks=(s.route.practiceBooks||[]).filter(n=>n!==name);
 s.route.free=s.route.practiceBooks[0]??null;
 return true;
}
export function verseLine(name,i,quality){
 const [first,last]=verses[name][i];
 return quality===2?first+'，'+last+'。':quality===1?first+'，□□□□。':'□□□□，□□□□。';
}
