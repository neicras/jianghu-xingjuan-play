import {stationNumber} from './chapter-road.js';
import {exchangeFor,matchupNote} from './book-pairings.js';
import {nextBookFight} from './journey.js';
import {copyDesk} from './copy-desk.js';
import {acquisition,editionInfo} from './editions.js?branch=1';
import {cardRarity} from './card-face.js';
import {supportArt} from './art-library/support-files.js';
import {arts,byName,ranks,effect} from './catalogue.js';
import {band,purse,picksLeft,pickedBooks,hasNoviceFoundation,trainingChance,mergedCopies,percent,combinedOdds,gateOdds} from './rules.js';
import {chapters,qualities,collection,collate,cost,intactChance,missingChance,xpPerWin,rerollFee} from './manuscripts.js';
import {clothDyes,copyFace,pouch} from './bound-book.js';

import {journeyDesk,lessonManuscript,deskVolume} from './journey-bindery.js';
const reader=(s,book,btn,view)=>s.route?journeyDesk(s,book,btn,view):copyDesk(s,book,btn,view);
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
 const kept=mergedCopies(s,a,incoming),prior=collate(known);
 const combined=pickedBooks(s).includes(name)?prior:collate(kept);
 const oldPrice=cost(a,prior), newPrice=cost(a,combined),extra=s.learned.includes(name)?4:0;
 const gained=chapters.flatMap((n,i)=>combined[i]>prior[i]?['第'+n+'篇']:[]);
 const complete=incoming.filter(q=>q===2).length;
 const info=s.drawInfo[name], preparedSample=info?.kind==='opening'&&['分水劍','白虹劍法','八卦步','拂塵功'].includes(name)&&!s.rerolled;
 const showCopyOdds=!s.legacyFinds&&!preparedSample&&(info||s.rerolled);
 const availability=s.learned.includes(name)?(s.stars.includes(name)?'已學成 · 已精練':'已學成 · 可供精練'):!a.parent?'入門功法':s.learned.includes(a.parent)?'先修已成':'可越級。先學《'+a.parent+'》，把握可達 '+percent(combinedOdds(gateOdds(s,a,combined,true)))+'%';
 const foundationNote=!s.learned.includes(name)&&hasNoviceFoundation(s,a)?'。根基已足，殘篇也較易讀通。':'';
 const odds=info?.kind==='printer'?'紙坊擋盡試掌，墨師傅親筆補訣':info?.kind==='random'?'本位抽中'+band(a)+' '+pct(info.bandChance)+'；抽中此功 '+pct(info.nameChance):info?.kind==='companion'?(s.equipped.includes(a.parent)?'承接牌組中的《'+a.parent+'》':'因應牌組中的招式，此冊留在書案上'):info?.kind==='focus'?'尋卷保留此位':info?.kind==='opening'?'首場指定功法':'沿用舊存檔';
 const practiceOdds=extra?'':'<div class="tome-cost"><span>練成把握</span><b>'+(known.length?trainingChance(s,a,prior)+'% → ':'')+trainingChance(s,a,combined)+'%</b></div>';
 const feeLine=s.route&&extra?'<div class="tome-cost"><span>已學成</span><b>'+(s.stars.includes(name)?'已精練':'可在客棧精練')+'</b></div>':'<div class="tome-cost"><span>'+(s.route?'師門研習':extra?'精練':'研習')+'耗費</span><b>'+(known.length?'<del>'+(oldPrice+extra)+'</del> → ':'')+(newPrice+extra)+' 歷練</b></div>';
 const taken=pickedBooks(s).includes(name);
 const learned=s.learned.includes(name),next=arts.filter(child=>child.parent===name);
 const library=learned?(s.equipped.includes(name)?'已學成 · 已入牌組':'已學成 · 未入牌組'):'尚未學成';
 const lineage='<details class="tome-lineage"><summary>回瀾 · '+a.branch+' · '+ranks[a.rank]+'品</summary><div>'+
   (a.parent?'上一門　《'+a.parent+'》'+(s.learned.includes(a.parent)?'（已學）':'（未學）'):'此門是這一脈的入門功夫')+
   (next.length?'<br>可銜接　'+next.map(child=>'《'+child.name+'》').join('、'):'<br>已到此脈盡頭')+(s.route?'<br><button data-action="bookStudy/'+name+'">到武學譜看這一門</button>':'')+'</div></details>';
 const nextFight=readingAhead(s),pair=s.route&&exchangeFor(s,name);
 const pairing=pair?'<p>'+pair.state+'《'+pair.other+'》　'+pair.text+'</p>':'';
 const scoutingNote=nextFight?'<p>前路探報　'+scouting(nextFight)+' '+(matchupNote(name,nextFight.kind)||'')+'</p>':'';
 return {a,known,taken,complete,library,combined,incoming,prior,redundant:!taken&&!kept.includes(incoming),
 detail:pairing+scoutingNote+lineage+'<p>'+(known.length?(gained.length?'補得'+gained.join('、'):'原藏已涵蓋此本'):'首次收藏')+'</p>'+feeLine+practiceOdds+'<p>'+availability+foundationNote+'</p>',
 odds:'<li><b>'+name+'</b>　'+odds+'。'+(s.legacyFinds?'沿用舊存檔的章況。':preparedSample?'首場示例章況固定。':info?.kind==='printer'?'親筆收勢，末兩篇完整。':!showCopyOdds?'章況沿用舊存檔。':'隨機抄本恰有 '+complete+' 篇完整正文：'+pct(qualityChance(complete))+'。')+'</li>'};
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
export function choices(s,btn,selected){
 const books=s.offer.map(name=>manuscript(s,name)),current=books.find(b=>b.a.name===selected);
 if(!books.length)return btn('back','返回戰利品');
 if(current)return reader(s,current,btn);
 const left=picksLeft(s),kept=pickedBooks(s).length,next=readingAhead(s);
 const rack=books.map(b=>{
  const name=b.a.name,grade=ranks[b.a.rank];
  const gain=b.known.length?b.combined.filter((q,i)=>q>b.prior[i]).length:0;
  const link=next&&exchangeFor(s,name);
  const mark=!b.taken&&link&&['牌中已有','同案已取'].includes(link.state);
  return '<button class="shelf-volume" aria-label="翻閱《'+name+'》，'+grade+'品，'+cardRarity(b.a)+'，'+copySummary(b.incoming)+(b.taken?'，已收入書囊':gain?'，可補 '+gain+' 篇':mark?'，可接《'+link.other+'》':'')+
   '" data-action="browse/'+name+'">'+(s.route?deskVolume(b.a,b.incoming):copyFace(b.a,b.incoming,grade,true))+(s.route?'<span class="jd-shelf-label">回瀾 · '+b.a.branch+' · '+grade+'品<br>'+(s.drawInfo[name]?.kind==='printer'?'墨師傅親筆 · ':'')+(b.taken?'已收入書囊':b.known.length?(gain?'可補 '+gain+' 篇':'已有同本'):'初次得見')+'</span>':'')+(b.taken?'<i class="volume-mark">收</i>':'')+'</button>';
 }).join('');
 return '<div class="book-table closed-shelf">'+clothDyes()+'<div class="book-heading"><h2 id="pick-title">挑選秘笈</h2><p>選 '+left+' 冊入囊</p></div>'+
  '<div class="book-rack">'+rack+'<div class="book-pouch">'+pouch()+'<span><small>書囊</small><b>'+kept+'／'+(kept+left)+'</b></span></div></div>'+
  '<div class="book-links">'+btn('back','返回戰後所得')+btn('reroll',s.rerolled?'本場已換過':s.tickets?'用校書籤換抄本':'另覓抄本 · '+rerollFee+' 文','',!!s.claimed||s.rerolled||(!s.tickets&&s.gold<rerollFee))+'</div></div>';
}

// Keep opening and putting back identical in the journey and standalone study.
export function displayBookDialog(s,btn,selected,returnTo,found,lesson){
 const dialog=document.getElementById('book-choice'),body=document.getElementById('book-body');
 const a=byName.get(selected);
 const foundBook=found&&{a,known:found.prior,editions:[],incoming:found.sections,prior:collate(found.prior),
  combined:collate(collection(s,selected)),taken:true,source:{kind:'cave',floor:stationNumber(s.route)},
  note:found.kept?'已收入書囊':'舊藏的三冊已足以補齊此本',library:s.learned.includes(selected)?'已學成':'可回師門研習',
  detail:'<p>鏢師分冊抄錄。同名的殘篇可以互補。</p>',odds:''};
 const book=lesson?lessonManuscript(s,lesson):foundBook??(selected?manuscript(s,selected):null);
 body.innerHTML=book?reader(s,book,btn):choices(s,btn,selected);
 if(!dialog.open)dialog.showModal();
 if(selected){
  function bindDesk(){
   const desk=body.querySelector('.manuscript-desk');
   desk.querySelector('h2').focus({preventScroll:true});
   desk.addEventListener('click',e=>{
    const control=e.target.closest('[data-desk]');if(!control)return;
    body.innerHTML=reader(s,book,btn,control.dataset.desk);bindDesk();
   });
  }
  bindDesk();
 }else if(returnTo){
  Array.from(body.querySelectorAll('.shelf-volume')).find(b=>b.dataset.action==='browse/'+returnTo)?.focus({preventScroll:true});
 }
}
