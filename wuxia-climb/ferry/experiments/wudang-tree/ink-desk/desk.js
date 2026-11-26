import {byName,ranks} from '../catalogue.js';
import {copyFace} from '../bound-book.js';
import {cardFace} from '../card-face.js';
import {chapters} from '../manuscripts.js';
import {startReading,keepCopy,inspect,learnVerse,verses,verseLine} from '../verse-study.js';
import {startBout,play,endRound,settleChoice} from '../combat.js';
import {arena,paintBout,animateBout,pileSheet} from '../arena.js';

const names=['八卦步','拂塵功'],desk=document.querySelector('#desk'),pile=document.querySelector('#pile');
let s,name,ending,mode,busy=false;
function restart(){
 s=startReading();names.forEach(n=>keepCopy(s,n));name=null;ending='';mode='shelf';draw();
}
const btn=(action,text,cls='',off=false)=>'<button data-action="'+action+'" class="'+cls+'"'+(off?' disabled':'')+'>'+text+'</button>';
function caption(title,line){
 return '<div class="night-caption"><h1>'+title+'</h1><p><b>艄公</b>「'+line+'」</p></div>';
}
function volume(n){
 const a=byName.get(n);
 return copyFace({...a,image:new URL('../'+a.image,import.meta.url).href},s.finds[n],ranks[a.rank]);
}
function shelf(){
 return '<div class="desktop shelf">'+caption('渡口借燈','夜船就開。燈再借你一會，這兩本，你想批哪一本？')+
 '<div class="desk-books">'+names.map((n,i)=>btn('open/'+n,volume(n)+
 '<span class="book-sign">'+(i?'遇夾擊，可攻亦可守':'手上有傷，仍能換招')+'</span>','cloth-volume')).join('')+'</div><p class="ink-stock">一硯餘墨　可批一句</p></div>';
}
function notebook(){
 const a=byName.get(name),book=inspect(s,name,true),g=book.gloss,idx=g.index,answer=verses[name][idx][1],learned=s.learned.includes(name);
 const lines=chapters.map((n,i)=>'<li class="'+(i===idx?'torn-line':'')+'"><i>'+n+'</i>'+
 (i!==idx?verseLine(name,i,book.pages[i]):verses[name][i][0]+'，<b>'+(ending||'　　缺文　　')+'</b>。')+'</li>').join('');
 const strips=name===names[0]?[g.other,answer]:[answer,g.other];
 return '<div class="desktop reading">'+caption('燈下校書',learned?'墨乾了。那邊兩個攔路的，正好試試你學的這招。':name===names[0]?'你手裏若有一張傷勢，這步法能讓你換走它。末句該怎樣接？':'一個人來，拂絲護身；兩個人來，護體反而更厚。末半句該怎樣接？')+
 '<article class="open-volume"><section class="mount"><div class="card-mount">'+cardFace(a)+'</div><b>出牌用 '+a.cost+' 內力</b></section>'+
 '<section class="passage"><h2>'+name+'</h2><ol>'+lines+'</ol>'+(learned?'<span class="signed">學成</span>':'')+'</section></article>'+
 '<div class="slips">'+(learned?'':strips.map(x=>btn('try/'+x,x,'verse-slip'+(x===ending?' lifted':''))).join(''))+'</div>'+
 '<p class="response" role="status">'+(learned?'《'+name+'》已收入牌組。':!ending?'挑一張殘句，試嵌入書。':ending===answer?g.match:g.preview)+'</p>'+
 '<div class="desk-actions">'+(learned?btn('fight','登岸試招','seal'):btn('back','放回書案','back-slip')+btn('commit','落筆 · 用餘墨','seal',ending!==answer))+'</div></div>';
}
function startTrial(){
 const b=startBout(s,2,7);
 // Use a fixed first hand to make the newly learned technique testable on the first turn.
 const index=b.draw.findIndex(c=>c.name===name);
 if(index>=0)[b.hand[0],b.draw[index]]=[b.draw[index],b.hand[0]];
 const woundSlot=b.hand.findIndex(c=>c.name!==name&&c.name!=='吐納');
 b.draw.unshift(b.hand[woundSlot]);b.hand[woundSlot]={id:'trial-wound',name:'劍傷'};b.environment='wharf';
 b.log=['兩哨在碼頭攔路。試試你剛學成的《'+name+'》。'];s.bout=b;mode='fight';
}
function draw(){
 desk.className=mode==='fight'?'wharf-trial journey':'';
 if(mode==='fight'){
  const b=s.bout;
  desk.innerHTML='<div class="trial-top"><b>登岸 · 雙哨攔路</b>'+btn('reset','再借一次燈','back-slip')+'</div>'+
   (b.phase==='playing'?arena(s,btn):'<div class="closing"><h2>'+(b.phase==='won'?'雙哨讓路':'渡口落敗')+'</h2>'+btn('reset','回到渡口','seal')+'</div>');
  if(b.phase==='playing')paintBout(b);
 }else desk.innerHTML=mode==='shelf'?shelf():notebook();
}
desk.addEventListener('click',async e=>{
 const el=e.target.closest('[data-action]');if(!el||el.disabled||busy)return;
 const [a,v]=el.dataset.action.split('/');
 if(a==='reset'){restart();return}
 if(mode==='fight'){
  const b=s.bout;
  if(a==='pile'){pile.querySelector('div').innerHTML=pileSheet(b,v);pile.showModal();return}
  if(a==='target')b.target=Number(v);
  else if(a==='cast'||a==='endRound'){busy=true;try{await animateBout(b,emit=>a==='cast'?play(b,v,emit):endRound(b,emit))}finally{busy=false}}
  else if(a==='pick'||a==='skip')settleChoice(b,a==='skip'?null:v);
 }else if(a==='open'&&names.includes(v)){name=v;mode='book';ending=''}
 else if(a==='back'){mode='shelf';ending=''}
 else if(a==='try')ending=v;
 else if(a==='commit'&&!learnVerse(s,name,ending))return;
 else if(a==='fight'&&s.learned.includes(name))startTrial();
 draw();
 const next=a==='open'?'.verse-slip':a==='back'?'[data-action="open/'+name+'"]':a==='try'?'[data-action="try/'+v+'"]':a==='commit'?'[data-action="fight"]':null;
 if(next&&e.detail===0)desk.querySelector(next)?.focus({preventScroll:true});
});
restart();
