import {byName,ranks} from './catalogue.js?paper1';
import {copyFace,pouch} from './bound-book.js?paper1';
import {cardFace,cardRarity} from './card-face.js?paper1';
import {chapters,collection} from './manuscripts.js?paper1';
import {deck,picksLeft} from './rules.js?paper1';
import {exchangeFor} from './book-pairings.js?paper1';
import {startReading,visitBinder,inspect,keepCopy,learnVerse,verseLine,verses} from './verse-study.js?paper1';

const desk=document.querySelector('#desk');
let state=startReading(),name=null,source='合讀',pencil=false,trial='',bag=false,archive=false;
const button=(act,text,disabled=false)=>'<button type="button" data-act="'+act+'"'+(disabled?' disabled':'')+'>'+text+'</button>';
function relation(n){
 const link=exchangeFor(state,n);
 if(link&&['牌中已有','同案已取','同案可取','起手已有'].includes(link.state)){
  return {short:link.state+' · '+link.other, explanation:link.text};
 }
 const specific={
  '八卦步':['換走傷勢牌','你起手有《吐納》可以補牌；八卦步還能先把佔住手牌的傷勢換走。'],
  '太極劍法':['與橫劍當胸同樣能守','用兩點內力，一張牌便能兼顧傷害和護體。'],
  '武當鐵布衫':['護身後可以還擊','你已有《橫劍當胸》可以護身。鐵布衫若擋盡一擊，還會自動還擊。'],
  '拂塵功':['迎戰多名對手','拂塵一出就有護體。面對兩名或更多敵人時，護體由三點增至六點。']
 };
 const [short,explanation]=specific[n]||['新招可入組','學成後便可在牌組使用。'];
 return {short,explanation};
}
function promise(n,b){
 if(state.learned.includes(n))return '已學成';
 if(!b.gaps.length)return '六篇齊 · 可學';
 if(b.canInfer)return state.inkLeft?'差一句 · 可推敲':'差一句 · 待補';
 return '尚欠 '+b.gaps.length+' 篇正文';
}
function rack(){
 const later=state.readingVisit===2;
 return '<section class="verse-shelf"><header><h1>'+ (later?'書肆訪卷':'戰後挑卷')+'</h1><p>'+
 (later?'書商留下四冊散頁，另有一部三品劍譜。':'渡口初勝，鏢師攤開五冊武當入門抄本。')+'可取 <b>'+picksLeft(state)+'</b> 冊。</p></header><div class="verse-rack">'+state.offer.map(n=>{
  const a=byName.get(n),b=inspect(state,n),mark=b.taken?'已收入囊':b.gain&&collection(state,n).length?'補舊藏 '+b.gain+' 篇':promise(n,b);
  return '<button class="rack-book" data-act="open/'+n+'">'+copyFace(a,b.incoming,ranks[a.rank])+'<strong>'+mark+'</strong><small>'+relation(n).short+'</small></button>';
 }).join('')+'<button class="satchel" data-act="bag">'+pouch()+'<strong>看我的書囊</strong></button></div><footer><span>此席可批註 '+state.inkLeft+' 句</span>'+button(later?'bag':'visit',later?'清點所學':picksLeft(state)?'留下餘卷，前往書肆':'前往書肆')+'</footer></section>';
}
function reader(){
 const a=byName.get(name),b=inspect(state,name,archive),joined=source==='合讀',pages=joined?b.pages:b.incoming;
 const learned=state.learned.includes(name),canKeep=picksLeft(state)>0&&!b.taken;
 const peer=relation(name),hasOld=collection(state,name).length>0;
 const clues=chapters.map((num,i)=>{
  const annotated=joined&&state.notes[name]===i;
  const quality=annotated?2:pages[i];
  const sign=annotated?'批':!b.taken&&joined&&hasOld&&pages[i]>b.prior[i]?'補':'';
  return '<li data-quality="'+quality+'"><small>'+num+'</small><span>'+verseLine(name,i,quality)+'</span>'+(sign?'<i>'+sign+'</i>':'')+'</li>';
 }).join('');
 let action='';
 if(!b.taken)action=button('keep',canKeep?(!learned&&!b.gaps.length?'收卷學成':'收下此冊'):'本席已取足',!canKeep);
 else if(learned)action=button('bag','查看牌組');
 else if(!b.gaps.length)action=button('learn','依譜演練');
 else if(b.canInfer&&state.inkLeft)action=button('pencil','推敲殘句');
 const g=b.gloss;
 const tip=state.readingVisit===1&&['武當長拳','武當鐵布衫'].includes(name)&&b.gaps.length?'鏢師說：「我這本看不清的幾篇，書肆那冊倒還齊全。」':'';
 const exercise=pencil&&g?'<section class="ink-exercise"><h3>第'+chapters[g.index]+'篇 · '+verses[name][g.index][0]+'，⋯</h3><p>'+g.clue+'</p><div>'+[name==='八卦步'?g.other:verses[name][g.index][1],name==='八卦步'?verses[name][g.index][1]:g.other].map(x=>button('try/'+x,x)).join('')+'</div><p aria-live="polite">'+(trial?(trial===g.other?g.preview:g.match):'試讀兩句，再決定落筆。')+'</p>'+button('ink','落筆學成 · 用一則批註',trial!==verses[name][g.index][1])+'</section>':'';
 return '<section class="verse-reader"><div class="binding"><section class="card-leaf"><span>學成招式 · 內力 '+a.cost+'</span><div class="learnt-card">'+cardFace(a)+'</div><p>'+peer.explanation+'</p></section><section class="verse-leaf"><h2>'+name+'</h2><p>'+cardRarity(a)+' · '+ranks[a.rank]+'品'+(learned?' · 已入牌組':'')+'</p><nav aria-label="查看哪本抄本">'+(archive?['合讀']:['此冊','合讀']).map(v=>'<button data-act="source/'+v+'" aria-pressed="'+(source===v)+'">'+(v==='此冊'?'只看此冊':'與舊藏合讀')+'</button>').join('')+'</nav><ol>'+clues+'</ol><b class="verdict" role="status">'+promise(name,b)+'</b>'+(tip?'<p class="binder-tip">'+tip+'</p>':'')+exercise+'</section></div>'+
 '<footer>'+button(archive?'bag':'shelf',archive?'合上藏書':'放回書案')+(!pencil?action:'')+'</footer></section>';
}
function inventory(){
 const gained=state.learned.filter(n=>verses[n]);
 const copies=Object.keys(state.books).filter(n=>verses[n]&&collection(state,n).length);
 const names=deck(state).map(c=>c.name);
 return '<section class="verse-bag"><h1>我的書囊</h1><h2>新收入牌組</h2><div class="bag-cards">'+gained.filter(n=>names.includes(n)).map(n=>'<div class="learnt-card">'+cardFace(byName.get(n))+'</div>').join('')+'</div>'+
 (gained.length?'':'<p>將一冊抄本讀通，就能在這裏看到學成的牌。</p>')+'<h2>藏書</h2><p>'+copies.map(n=>button('archive/'+n,n+' ×'+collection(state,n).length)).join(' ')+'</p><footer>'+button('shelf','返回書案')+(state.readingVisit===2?button('reset','重新試讀'):'')+'</footer></section>';
}
function draw(){desk.innerHTML=bag?inventory():name?reader():rack()}
function open(n){name=n;source='合讀';pencil=false;trial='';bag=false;archive=false}
desk.addEventListener('click',e=>{
 const el=e.target.closest('[data-act]');if(!el||el.disabled)return;
 const [act,v]=el.dataset.act.split('/');
 if(act==='open'&&state.offer.includes(v))open(v);
 if(act==='archive'&&collection(state,v).length){open(v);archive=true}
 if(act==='shelf')open(null);
 if(act==='bag'){open(null);bag=true}
 if(act==='source')source=v;
 if(act==='keep'&&name&&keepCopy(state,name)&&!inspect(state,name,true).gaps.length)learnVerse(state,name);
 if(act==='learn'&&name)learnVerse(state,name);
 if(act==='pencil'){pencil=true;source='合讀'}
 if(act==='try')trial=v;
 if(act==='ink'&&learnVerse(state,name,trial)){pencil=false;trial='';source='合讀'}
 if(act==='visit'&&visitBinder(state))open(null);
 if(act==='reset'){state=startReading();open(null)}
 draw();
 if(act==='try'||act==='pencil')desk.querySelector('.ink-exercise')?.scrollIntoView({block:'nearest'});
 if(act==='source'||act==='try')Array.from(desk.querySelectorAll('[data-act]')).find(b=>b.dataset.act===el.dataset.act)?.focus({preventScroll:true});
});
draw();
