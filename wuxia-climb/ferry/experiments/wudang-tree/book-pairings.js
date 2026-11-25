// The first two book tables teach exchanges the combat rules already resolve.
import {basics} from './catalogue.js?forms6';

const variations=[
 ['拂塵功','周天回元式','同一回合先揮拂塵，再運周天。回元式會補回剛花的一點內力，抽到的牌還有機會打出。'],
 ['武當丹劍','三才守中式','丹劍可以保留。先把劍留在手上，守中式除了護身，還能多抽一張；先出劍就失去這個機會。']
];
const exchanges=[
 ['八卦步','遊身八卦掌','八卦步換走手上不合用的牌。今輪或下輪接掌，就能省一點內力，再抽一張。'],
 ['拂塵功','武當丹劍','同一回合先揮拂塵，再出丹劍。拂絲收回時，丹劍便能趁勢加重一刺。'],
 ['武當鐵布衫','武當長拳','先用鐵布衫擋下攻擊。下一回合出長拳，上一回合擋下的傷害最多可添四點拳勁。'],
 ['武當鐵布衫','武當丹劍','同一回合先運鐵布衫，再出丹劍。即使對手還沒出手，劍勁也已蓄足。'],
 ['橫劍當胸','武當丹劍','同一回合先橫劍護身，再出丹劍，便能打出牌上較高的傷害。'],
 ['橫劍當胸','武當長拳','先橫劍擋下攻擊，下回合再出長拳。擋下多少，拳勁便能借多少，最多四點。'],
 ['踏浪步','遊身八卦掌','先踏浪使對手露出破綻，再趁勢出掌。步勢能留到下一回合。'],
 ...variations
];
const basicNames=new Set(basics.map(a=>a.name));
export function variationFor(s){
 const choices=variations.filter(([held,other])=>s.equipped.includes(held)&&!s.learned.includes(other));
 return choices.length?choices[(s.route.worldSeed>>>0)%choices.length][1]:null;
}
export function companionFor(s){
 for(const [first,second] of exchanges){
  for(const [held,other] of [[first,second],[second,first]]){
   if(s.equipped.includes(held)&&!basicNames.has(other)&&!s.learned.includes(other))return other;
  }
 }
 return null;
}
export function exchangeFor(s,name){
 const choices=exchanges.filter(([a,b])=>a===name||b===name).map(([a,b,text])=>{
  const other=a===name?b:a;
  const state=s.equipped.includes(other)?'牌中已有':s.route.pickedBooks?.includes(other)?'同案已取':
   basicNames.has(other)?'起手已有':s.offer.includes(other)?'同案可取':s.learned.includes(other)?'已學未帶':'往後可尋';
  return {other,state,text};
 });
 const priority=['牌中已有','同案已取','起手已有','同案可取','已學未帶','往後可尋'];
 return choices.sort((a,b)=>priority.indexOf(a.state)-priority.indexOf(b.state))[0];
}
export function matchupNote(name,kind){
 const crowd=['pair','trio','elite2','banner'].includes(kind);
 if(kind==='guard'&&['武當綿掌','先天少陽劍氣'].includes(name))return '穿勁可以越過護體，直接打掉氣血。趁他蓄勁時湊足八點傷勢，便可截住下一輪的重擊。';
 if(crowd&&name==='拂塵功')return '趁兩人仍在場時揮拂，一招可得六點護體。';
 if(crowd&&name==='武當鐵布衫')return '趁對手人多時運功。擋盡一擊，這次便能還擊八點。';
 if(crowd&&name==='八卦步')return '兩人夾攻時，可換走手上的傷勢牌，找一張護身的招式。';
 if(['guard','elite1','boss'].includes(kind)&&name==='八卦步')return '見對手蓄勁，便可換走用不著的牌，找出足以破招的一擊。';
 if(['guard','elite1','boss'].includes(kind)&&name==='武當丹劍')return '等對手蓄勁再接劍，打掉八點氣血就能斷他這口氣。';
 return '';
}
