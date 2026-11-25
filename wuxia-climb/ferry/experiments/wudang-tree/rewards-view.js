import {exchangeFor,matchupNote} from './book-pairings.js?forms7';
import {nextBookFight} from './journey.js?forms7';
import {descriptions} from './annotations.js?forms7';
import {acquisition,editionInfo} from './editions.js?forms7';
import {moveNames} from './rehearsal.js?forms7';
import {cardRarity} from './card-face.js?forms7';
import {supportArt} from './art-library/support-files.js';
import {arts,byName,ranks,effect} from './catalogue.js?forms7';
import {band,purse,picksLeft,pickedBooks,hasNoviceFoundation,trainingChance,mergedCopies,percent,combinedOdds,gateOdds} from './rules.js?forms7';
import {chapters,qualities,collection,collate,cost,intactChance,missingChance,xpPerWin,rerollFee} from './manuscripts.js?forms7';
import {copyFace,pouch} from './bound-book.js?forms7';

const icons={lesson:'journey-diary',coins:'journey-coins',ledger:'journey-bookmark',breath:'journey-manuals'};
const prizes=[
 ['xp','武學歷練','lesson','研習與精練所用',xpPerWin+' 點'],
 ['gold','銅錢','coins','可用來另覓抄本',purse+' 文'],
 ['ticket','校書籤','ledger','下次另覓抄本可抵 4 文','一枚']
];
export function leaveSummary(s){
 const kept=[],lost=[];
 for(const [id,label] of prizes)if(id in s.rewards)(s.rewards[id]?kept:lost).push(label);
 if(s.offer.length)(s.claimed?kept:lost).push(s.claimed?'《'+s.claimed+'》':'抄本');
 return '上場帶走：'+(kept.join('、')||'無')+'。'+(lost.length?'留下：'+lost.join('、')+'。':'');
}
function row(icon,label,note,action,taken,value){
 return '<button class="prize" data-action="'+action+'" '+(taken?'disabled':'')+'><img alt="" src="'+supportArt(icons[icon])+'"><span><b>'+label+'</b><small>'+note+'</small></span><strong>'+value+'</strong><i>'+(taken?'✓ 已領':action==='books'?'翻閱 ›':'領取 ›')+'</i></button>';
}
export function bag(s,btn){
 const rows=prizes.filter(([id])=>id in s.rewards).map(([id,label,icon,note,value])=>row(icon,label,id==='ticket'?(s.wins===1?'首場贈禮':'掉落率 25%')+' · '+note:note,'claim/'+id,s.rewards[id],value));
 if(s.offer.length)rows.push(row('breath',s.claimed?'《'+s.claimed+'》':'武學抄本',s.claimed?'已比較並合參':'翻開後，從 '+s.offer.length+' 本之中揀一本','books',!!s.claimed,s.claimed?'一本':'擇一'));
 const left=Object.values(s.rewards).filter(v=>v===false).length+Number(!!s.offer.length&&!s.claimed);
 return '<div class="bag-stage"><div class="bag-scroll"><p class="bag-round">第 '+s.wins+' 場　·　'+(s.wins===1?'開局示例獎勵':'比武得勝')+'</p><h2>戰後所得</h2><p class="bag-instruction">點選想帶走的物品，離開時留下其餘獎勵。</p><div class="prize-list">'+rows.join('')+'</div>'+
 '<div class="bag-wallet">行囊　'+s.xp+' 歷練　·　'+s.gold+' 文'+(s.tickets?'　·　校書籤 × '+s.tickets:'')+'</div>'+
 '<div class="bag-depart">'+(s.claimed?btn('inspect/'+s.claimed,'查看所得功法','link'):'')+btn('win',left?'留下 '+left+' 項，前往下一場 →':'前往下一場 →','primary')+'</div></div></div>';
}
const pct=n=>n>0&&n<.001?'&lt;0.1%':(n*100).toFixed(1).replace(/\.0$/,'')+'%';
function qualityChance(k){
 // A pristine five-chapter drop loses one intact chapter in rollCopy.
 const ways=[1,6,15,20,15,6];
 return ways[k]*intactChance**k*(1-intactChance)**(6-k)+(k===5?intactChance**6:0);
}
function manuscript(s,name){
 const a=byName.get(name), incoming=s.finds[name], known=collection(s,name);
 const prior=collate(known), combined=collate(mergedCopies(s,a,incoming));
 const oldPrice=cost(a,prior), newPrice=cost(a,combined),extra=s.learned.includes(name)?4:0;
 const gained=chapters.flatMap((n,i)=>combined[i]>prior[i]?['第'+n+'篇']:[]);
 const complete=incoming.filter(q=>q===2).length;
 const info=s.drawInfo[name], preparedSample=info?.kind==='opening'&&['武當丹劍','白虹劍法','八卦步','拂塵功'].includes(name)&&!s.rerolled;
 const showCopyOdds=!s.legacyFinds&&!preparedSample&&(info||s.rerolled);
 const availability=s.learned.includes(name)?(s.stars.includes(name)?'已學成 · 已精練':'已學成 · 可供精練'):!a.parent?'入門功法':s.learned.includes(a.parent)?'先修已成':'可越級。先學《'+a.parent+'》，把握可達 '+percent(combinedOdds(gateOdds(s,a,combined,true)))+'%';
 const foundationNote=!s.learned.includes(name)&&hasNoviceFoundation(s,a)?'。根基已足，殘篇也較易讀通。':'';
 const odds=info?.kind==='random'?'本位抽中'+band(a)+' '+pct(info.bandChance)+'；抽中此功 '+pct(info.nameChance):info?.kind==='companion'?'因應牌組中的招式，此冊留在書案上':info?.kind==='focus'?'尋卷保留此位':info?.kind==='opening'?'首場指定功法':'沿用舊存檔';
 const practiceOdds=extra?'':'<div class="tome-cost"><span>練成把握</span><b>'+(known.length?trainingChance(s,a,prior)+'% → ':'')+trainingChance(s,a,combined)+'%</b></div>';
 const feeLine=s.route&&extra?'<div class="tome-cost"><span>已學成</span><b>'+(s.stars.includes(name)?'已精練':'可在客棧精練')+'</b></div>':'<div class="tome-cost"><span>'+(s.route?'師門研習':extra?'精練':'研習')+'耗費</span><b>'+(known.length?'<del>'+(oldPrice+extra)+'</del> → ':'')+(newPrice+extra)+' 歷練</b></div>';
 const taken=pickedBooks(s).includes(name);
 const learned=s.learned.includes(name),next=arts.filter(child=>child.parent===name);
 const library=learned?(s.equipped.includes(name)?'已學成 · 已入牌組':'已學成 · 未入牌組'):'尚未學成';
 const lineage='<details class="tome-lineage"><summary>武當 · '+a.branch+' · '+ranks[a.rank]+'品</summary><div>'+
   (a.parent?'上一門　《'+a.parent+'》'+(s.learned.includes(a.parent)?'（已學）':'（未學）'):'此門是這一脈的入門功夫')+
   (next.length?'<br>可銜接　'+next.map(child=>'《'+child.name+'》').join('、'):'<br>已到此脈盡頭')+(s.route?'<br><button data-action="bookStudy/'+name+'">到武學譜看這一門</button>':'')+'</div></details>';
 return {a,known,taken,complete,library,combined,incoming,prior,
 detail:lineage+'<p>'+(known.length?(gained.length?'補得'+gained.join('、'):'原藏已涵蓋此本'):'首次收藏')+'</p>'+feeLine+practiceOdds+'<p>'+availability+foundationNote+'</p>',
 odds:'<li><b>'+name+'</b>　'+odds+'。'+(s.legacyFinds?'沿用舊存檔的章況。':preparedSample?'首場示例章況固定。':!showCopyOdds?'章況沿用舊存檔。':'隨機抄本恰有 '+complete+' 篇完整正文：'+pct(qualityChance(complete))+'。')+'</li>'};
}
const chapterState=['缺失','殘缺','完整'];
function copySummary(sections){
 return chapterState.map((word,q)=>({word,count:sections.filter(v=>v===q).length})).reverse()
  .filter(item=>item.count).map(item=>item.word+' '+item.count+' 篇').join('、');
}
function readingAhead(s){
 const r=s.route;
 return r?.phase==='reward'&&r.bookTables>=1&&r.bookTables<=2?nextBookFight(r):null;
}
const sightings={
 pair:'前哨先攻，後哨伺機夾擊',trio:'刺客帶著前後兩哨攔路',guard:'鐵衣客蓄勁後連擊兩下，餘下的護體會留到下回合',
 elite1:'鐵衣堂主起手聽勁，會反打',elite2:'青煞先攻，白煞蓄勁',banner:'旗主能鳴哨召援',boss:'守壇劍宗先蓄勁，再連出三劍'
};
function scouting(next){
 return '第'+next.floor+'站若走「'+next.name+'」，'+(sightings[next.kind]||next.name+'有人候戰')+'。';
}
function openCopy(s,book,btn){
 const {a,known,incoming,prior,combined,taken}=book;
 const names=moveNames(a),origin=editionInfo(a,book.source??acquisition(s,a.name));
 const leaves=incoming.map((q,i)=>{
  const improves=known.length>0&&!taken&&combined[i]>prior[i];
  return '<li data-quality="'+q+'"><button type="button" class="read-leaf" data-leaf="'+i+'" aria-expanded="false"><span>'+chapters[i]+' · '+names[i]+'</span><i aria-hidden="true"></i><b>'+chapterState[q]+'</b>'+(improves?'<em>補</em>':'')+'</button></li>';
 }).join('');
 const better=known.length&&!taken?chapters.filter((_,i)=>combined[i]>prior[i]):[];
 const note=book.note??(taken?'已收入書囊':!known.length?'首次得見此書':better.length?'可補原藏第'+better.join('、')+'篇':'原藏已涵蓋此本');
 const next=book.source?null:readingAhead(s);
 const link=next&&exchangeFor(s,a.name),tactic=next&&matchupNote(a.name,next.kind);
 const margin=next?'<aside class="bout-margins">'+(link?'<p><b>'+link.state+'《'+link.other+'》</b>'+link.text+'</p>':'')+
  '<p><b>前路探報</b>'+scouting(next)+(tactic?' '+tactic:'')+'</p></aside>':'';
 const practiceTag=next&&!s.learned.includes(a.name)?'<span class="practice-tag">試演把握 <b>'+trainingChance(s,a,combined)+'%</b></span>':'';
 const lore='<p class="leaf-lore">'+descriptions[a.name]+'</p>';
 const pose=copyFace(a,incoming,ranks[a.rank]);
 return '<div class="book-reader"><article class="spread" aria-labelledby="pick-title">'+
  '<div class="spread-pages"><section class="illustrated-leaf"><small>武當 · '+a.branch+' · '+ranks[a.rank]+'品 · '+cardRarity(a)+'</small>'+
  '<h2 id="pick-title" tabindex="-1">'+a.name+'</h2><img class="leaf-print" alt="" src="'+a.image+'">'+(next?'':lore)+'<p>'+effect(a)+'</p>'+margin+'</section>'+
  '<section class="contents-leaf"><h3>六篇招訣</h3><ol>'+leaves+'</ol><p class="leaf-gloss" aria-live="polite">點篇名，細讀這一式。</p><strong>'+note+'</strong><small>'+book.library+' · '+(s.learned.includes(a.name)?'師門藏本':'合參後練成把握 '+trainingChance(s,a,combined)+'%')+'</small>'+
  '<details class="copy-colophon"><summary>抄本來歷與研習</summary><div>'+(next?lore:'')+'<p>'+origin.account+'</p>'+book.detail+'<ul>'+book.odds+'</ul></div></details></section></div>'+
  '<div class="turn-cover" aria-hidden="true"><div class="turn-front">'+pose+'</div><div class="turn-back"></div></div></article>'+
  '<div class="reader-actions">'+(book.source?btn('back','合上抄本，回到洞口','red-seal'):btn('putBack','放回書案','return-copy')+practiceTag+btn('take/'+a.name,taken?'已收入書囊':'收入書囊','red-seal',taken||!picksLeft(s)))+'</div></div>';
}
export function choices(s,btn,selected){
 const books=s.offer.map(name=>manuscript(s,name)),current=books.find(b=>b.a.name===selected);
 if(!books.length)return btn('back','返回戰利品');
 if(current)return openCopy(s,current,btn);
 const left=picksLeft(s),kept=pickedBooks(s).length,next=readingAhead(s);
 const rack=books.map(b=>{
  const name=b.a.name,grade=ranks[b.a.rank];
  const link=next&&exchangeFor(s,name);
  const mark=!b.taken&&link&&['牌中已有','同案已取'].includes(link.state);
  return '<button class="shelf-volume" aria-label="翻閱《'+name+'》，'+grade+'品，'+cardRarity(b.a)+'，'+copySummary(b.incoming)+(b.taken?'，已收入書囊':mark?'，可接《'+link.other+'》':'')+
   '" data-action="browse/'+name+'">'+copyFace(b.a,b.incoming,grade)+(b.taken?'<i class="volume-mark">收</i>':mark?'<i class="pair-bookmark">可接招</i>':'')+'</button>';
 }).join('');
 return '<div class="book-table closed-shelf"><div class="book-heading"><h2 id="pick-title">挑選秘笈</h2><p>'+(next?scouting(next):'看書角辨殘舊，看書籤辨品級。')+'</p></div>'+
  '<div class="book-rack">'+rack+'<div class="book-pouch">'+pouch()+'<span><small>書囊</small><b>'+kept+'／'+(kept+left)+'</b></span></div></div>'+
  '<aside class="shelf-note"><b>尚可取 '+left+' 冊</b><span>素籤普通　青籤精良　金籤稀有</span></aside>'+
  '<div class="book-links">'+btn('back','返回戰後所得')+btn('reroll',s.rerolled?'本場已換過':s.tickets?'用校書籤換抄本':'另覓抄本 · '+rerollFee+' 文','',!!s.claimed||s.rerolled||(!s.tickets&&s.gold<rerollFee))+'</div></div>';
}

// Keep opening and putting back identical in the journey and standalone study.
export function displayBookDialog(s,btn,selected,returnTo,found){
 const dialog=document.getElementById('book-choice'),body=document.getElementById('book-body');
 const previous=selected&&Array.from(body.querySelectorAll('.shelf-volume')).find(b=>b.dataset.action==='browse/'+selected);
 const origin=previous?.querySelector('.copy-face').getBoundingClientRect();
 const a=byName.get(selected);
 const foundBook=found&&{a,known:found.prior,incoming:found.sections,prior:collate(found.prior),
  combined:collate(collection(s,selected)),taken:true,source:{kind:'cave',floor:s.route.floor},
  note:found.kept?'已收入書囊':'舊藏的三冊已足以補齊此本',library:s.learned.includes(selected)?'已學成':'可回師門研習',
  detail:'<p>鏢師分冊抄錄。同名的殘篇可以互補。</p>',odds:''};
 body.innerHTML=foundBook?openCopy(s,foundBook,btn):choices(s,btn,selected);
 if(!dialog.open)dialog.showModal();
 if(selected){
  const reader=body.querySelector('.book-reader');
  if(!reader)return;
  const spread=reader.querySelector('.spread'),rect=spread.getBoundingClientRect();
  if(origin){
   spread.style.setProperty('--fly-x',origin.x+origin.width/2-rect.x-rect.width*.25+'px');
   spread.style.setProperty('--fly-y',origin.y+origin.height/2-rect.y-rect.height*.5+'px');
   spread.style.setProperty('--fly-scale',String(origin.height/rect.height));
   reader.classList.add('unfolding');
  }
  const pages=found?.sections??s.finds[selected],prior=foundBook?.prior??collate(collection(s,selected));
  const combined=foundBook?.combined??collate(mergedCopies(s,a,pages)),odds=gateOdds(s,a,combined), names=moveNames(a);
  reader.querySelector('.contents-leaf ol').addEventListener('click',event=>{
   const button=event.target.closest('[data-leaf]');if(!button)return;
   const i=Number(button.dataset.leaf),quality=pages[i];
   for(const leaf of reader.querySelectorAll('[data-leaf]'))leaf.setAttribute('aria-expanded',String(leaf===button));
   const evidence=['只剩篇名，招圖已佚。','圖訣斷了一截，須自己推敲。','圖訣首尾俱全，可依譜演練。'][quality];
   const collation=prior[i]>quality?'舊藏可補這一篇。':'';
   const gloss=reader.querySelector('.leaf-gloss');
   button.after(gloss);
   gloss.textContent='「'+names[i]+'」'+evidence+collation+'演練此關把握 '+odds[i]+'%。';
   gloss.scrollIntoView({block:'nearest'});
  });
  reader.querySelector('h2').focus({preventScroll:true});
 }else if(returnTo){
  Array.from(body.querySelectorAll('.shelf-volume')).find(b=>b.dataset.action==='browse/'+returnTo)?.focus({preventScroll:true});
 }
}
