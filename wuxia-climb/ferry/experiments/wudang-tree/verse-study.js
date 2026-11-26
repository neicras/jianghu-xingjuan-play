// Original six-line verses for the five opening manuscripts in the reading study.
import {byName} from './catalogue.js';
import {reviewJourney} from './review-frames.js';
import {receive} from './journey.js';
import {equip,mergedCopies,pickedBooks,picksLeft} from './rules.js';
import {collection,collate} from './manuscripts.js';
export const verses={
 太極劍法:[
  ['月映潭心','水面成圓'],['劍隨月走','影隨人還'],['一圈未盡','舊勢已回'],
  ['半弧向外','半弧護衣'],['攻守相接','圓痕無隙'],['潭光如故','劍意自收']],
 武當丹劍:[
  ['劍未出鞘','先聽松濤'],['一線寒光','照見來勢'],['前式護身','後式借勢'],
  ['袖底藏鋒','一點破雲'],['餘音未歇','劍意猶存'],['鋒回鞘中','留待明朝']],
 八卦步:[
  ['雨過庭前','磚分八色'],['足下留白','讓來人過'],['昨日舊轍','今日另行'],
  ['衣角先轉','身影後隨'],['一足落定','猶有餘地'],['捨去舊路','另尋新徑']],
 拂塵功:[
  ['一柄青絲','拂盡路塵'],['絲垂檐下','靜候風來'],['風分兩面','拂影成環'],
  ['一人是一線','人多便成幕'],['拂過衣前','尚留一層'],['塵歸袖底','人立風中']],
 武當長拳:[
  ['立在簷下','聽雨如鼓'],['前番風急','勁留衣間'],['受過幾分','便記幾分'],
  ['前勢未散','後拳相承'],['長拳既罷','仍留一守'],['雨聲漸息','衣上有痕']],
 武當鐵布衫:[
  ['粗布一襲','也能護身'],['風過山門','衣紋不亂'],['一擊盡擋','回聲方起'],
  ['來者成雙','回聲更重'],['餘響過後','衣襟復靜'],['卸去塵土','布色如初']]
};
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
