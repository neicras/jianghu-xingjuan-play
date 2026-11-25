import {objectImage} from './trail-hud.js';
import {cardFace} from "./card-face.js?forms7";
import {arts, branches, ranks, effect} from "./catalogue.js?forms7";
import {learned, ready, refineCost, trainingChance, attemptFee, gateOdds, combinedOdds, percent} from "./rules.js?forms7";
import {descriptions} from "./annotations.js?forms7";

import {collection,estimate,collate} from "./manuscripts.js?forms7";
import {moveNames} from "./rehearsal.js?forms7";
import {chapters,qualities} from "./manuscripts.js?forms7";
import {shelves} from "./book-view.js?forms7";
import {sigil,sealFrame} from "./emblems.js";

const grades=[9,8,7,6,5,4,3,2,1];
const tier = rank => rank>=7?'common':rank>=4?'fine':'rare';

function cell(state, art, selected) {
  if (!art) return '<td class="vacant"></td>';
  const copies=collection(state,art.name), mastered=learned(state,art), canStudy=ready(state,art);
  const settled=copies.length&&art.parent&&!state.learned.includes(art.parent);
  const caption=mastered?(state.equipped.includes(art.name)?'已入組':'已學成'):canStudy?(settled?'越級':'可練'):copies.length?'欠歷練':'';
  const odds=canStudy?'<small class="cell-odds">'+trainingChance(state,art)+'%</small>':'';
  const status=caption||'未藏抄本';
  const precursor=art.name===selected.parent;
  const ink=mastered?'mastered':canStudy?'ready':copies.length?'partial':'missing';
  return '<td><button class="technique tier-'+tier(art.rank)+'" style="--letters:'+art.name.length+'" data-state="'+ink+'" data-action="node/'+art.name+
    '" aria-pressed="'+(art.name===selected.name)+'" tabindex="'+(art.name===selected.name?0:-1)+'" aria-label="'+art.name+'，'+ranks[art.rank]+'品，'+status+(precursor?'，所選招式的先修':'')+'">'+
    sealFrame(art.branch)+sigil(art)+odds+'<b>'+art.name+'</b>'+
    '<span class="ownership-mark">'+caption+'</span>'+(precursor?'<span class="ancestor" title="所選招式的先修">◆</span>':'')+'</button></td>';
}

function practicePanel(state,a,price,done,button) {
  const last=state.lastPractice?.name===a.name?state.lastPractice:null;
  const record=last?button('record/'+a.name,last.failed<0?'已學成 · 查看演練經過':'上次止於第'+chapters[last.failed]+'篇 · 查看經過','parent-link'):'';
  if(done)return record;
  const sections=collate(collection(state,a.name)), odds=gateOdds(state,a,sections);
  const chance=percent(combinedOdds(odds));
  const tiles=odds.map((n,i)=>'<span class="gate-tile"><small>'+chapters[i]+' · '+qualities[sections[i]]+'</small><b>'+moveNames(a)[i]+'</b><em>'+n+'%</em></span>').join('');
  return '<div class="practice-quote"><div><b>六關全過</b><strong>'+chance+'%</strong></div><div class="gate-strip">'+tiles+'</div><small>練成耗 '+price+' 歷練'+(chance<100?'，失手耗 '+attemptFee(price)+'。':'，六關都有十足把握。')+'</small></div>'+record;
}

function details(state,a,button) {
  const done=learned(state,a), star=state.stars.includes(a.name), inDeck=state.equipped.includes(a.name);
  const copies=collection(state,a.name), price=estimate(state,a);
  const prerequisite=a.parent
    ? button('inspect/'+a.parent,a.parent+' ↗','parent-link')+'<small>'+ (state.learned.includes(a.parent)?'已學成':copies.length&&!done?'第三、六關各 ×0.72；學成根基後 '+percent(combinedOdds(gateOdds(state,a,collate(copies),true)))+'%':'可越級')+'</small>'
    : '入門功法';
  const practice=done ? button('equip/'+a.name,inDeck?'移出牌組':'加入牌組','primary')
    : button('study/'+a.name,!copies.length?'尚未得書':ready(state,a)?'練習《'+a.name+'》':'尚缺 '+(price-state.xp)+' 歷練','primary',!ready(state,a));
  const seek=button('focus/'+a.name,state.focus===a.name?'取消尋卷':'下場尋此卷');
  const next=done ? button('star/'+a.name,star?'已精練':'精練 · '+refineCost(state,a)+' 歷練','',star||state.xp<refineCost(state,a))
    : seek;
  return '<aside class="skill-detail" aria-label="所選功法"><div class="skill-image" style="background-image:url('+a.image+')"><div class="detail-emblem tier-'+tier(a.rank)+'" aria-hidden="true"> '+sigil(a)+' </div></div>'+
    '<div class="detail-copy"><div class="detail-grade">'+ranks[a.rank]+'品　·　'+a.branch+'</div><h3>'+a.name+'</h3>'+
    '<p class="margin-note">'+descriptions[a.name]+'</p><dl><dt>先修</dt><dd>'+prerequisite+'</dd></dl>'+
    shelves(state,a)+'<div class="practice-spread"><div class="practice-column">'+(copies.length?practicePanel(state,a,price,done,button):'')+
    (done&&!star?'<p class="refine-rule">精練後　'+effect(a,true)+'</p>':'')+
    '<div class="practice-actions">'+practice+next+(done&&!star&&collate(copies).some(q=>q<2)?seek:'')+'</div></div>'+
    '<figure class="skill-card"><figcaption>學成招式</figcaption><button data-action="preview/'+a.name+'" aria-label="放大《'+a.name+'》卡面">'+cardFace(a,star)+'</button></figure></div></div></aside>';
}

export function manual(state,selected,button,journeyBack) {
  const balance='<span class="balance">'+objectImage('journey-xp')+'<span class="visually-hidden">歷練</span>'+state.xp+'　'+objectImage('journey-gold')+'<span class="visually-hidden">銅錢</span>'+state.gold+'</span>';
  const head=grades.map(rank=>'<th scope="col" class="tier-'+tier(rank)+'">'+ranks[rank]+'品</th>').join('');
  const rows=branches.map(branch=>{
    const path=arts.filter(art=>art.branch===branch);
    const cells=grades.map(rank=>cell(state,path.find(art=>art.rank===rank),selected)).join('');
    return '<tr><th scope="row">'+branch+'</th>'+cells+'</tr>';
  });
  return '<div class="sect-heading">'+(journeyBack||'')+'<div><h2>武當武學譜</h2></div>'+
    '<div class="sect-nav">'+(journeyBack?'':balance)+''+button('tab/loot','戰後所得','exit-link')+button('tab/deck','我的牌組','exit-link')+(journeyBack?'':button('tab/fight','試武場','exit-link'))+'</div></div>'+
    '<div class="sect-body"><div class="register"><div class="shelf"><table aria-label="武當七脈九品武學總表"><colgroup><col class="discipline-column"></colgroup><colgroup span="3"></colgroup><colgroup span="3"></colgroup><colgroup span="3"></colgroup>'+
    '<thead><tr class="tier-bands"><td></td><th scope="colgroup" class="tier-common" colspan="3">下三品</th><th scope="colgroup" class="tier-fine" colspan="3">中三品</th><th scope="colgroup" class="tier-rare" colspan="3">上三品</th></tr><tr><th scope="col">武學</th>'+head+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>'+
    '<div class="register-key">'+(journeyBack?balance:'')+'<strong>已學 '+state.learned.length+'／'+arts.length+' 門</strong><span>◆ 先修</span><span>暗紋　未學</span><span class="key-ready">明紋　可練</span><span class="key-mastered">亮印　已學成</span></div></div>'+
    details(state,selected,button)+'</div>';
}

// Direction keys follow the two axes of the register and skip vacant ranks.
export function navigateRegister(event){
 const steps={ArrowRight:[0,1],ArrowLeft:[0,-1],ArrowUp:[-1,0],ArrowDown:[1,0]};
 const step=steps[event.key], cell=event.target.closest('.technique')?.closest('td');
 if(!step||!cell)return;
 event.preventDefault();
 const table=cell.closest('table');
 let row=cell.parentElement.rowIndex, col=cell.cellIndex;
 while(true){
   row+=step[0];col+=step[1];
   const next=table.rows[row]?.cells[col];
   if(!next||next.tagName==="TH")return;
   const button=next.querySelector('.technique');
   if(button){button.click();return}
 }
}
