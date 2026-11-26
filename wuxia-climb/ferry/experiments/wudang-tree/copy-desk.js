import {cardFace,cardRarity} from './card-face.js';
import {clothDyes,copyFace,bindingState} from './bound-book.js?readingtable3';
import {acquisition,editionInfo} from './editions.js';
import {manualVerses} from './manual-verses.js?readingtable3';
import {chapters} from './manuscripts.js';
import {ranks} from './catalogue.js';
import {trainingChance,gateOdds,picksLeft} from './rules.js';

function deskCopies(s,book){
 const {a,known,incoming,taken,source}=book;
 const copies=known.map((pages,i)=>({
  pages,label:'書囊 · '+editionInfo(a,(book.editions??s.editions?.[a.name])?.[i]).label
 }));
 if(!taken||source)copies.push({pages:incoming,label:source?'洞中拾得':'新得 · '+editionInfo(a,acquisition(s,a.name)).label});
 return copies;
}
function inscription(pair,quality){
 if(!quality)return '<span class="lost-line" aria-label="此句整行缺失"></span>';
 return '<span class="first-half">'+pair[0]+'，</span><span class="last-half">'+(quality===2?pair[1]+'。':'<span class="torn-end" aria-label="下半句殘缺"></span>')+'</span>';
}
function page(a,label,pages,improved=[],odds=null){
 const lines=manualVerses[a.name];
 return '<article class="ink-leaf"><div class="ink-caption"><small>'+label+'</small><h3>'+a.name+'</h3></div><ol>'+
  lines.map((pair,i)=>'<li data-quality="'+pages[i]+'"><small>'+chapters[i]+'</small><span>'+inscription(pair,pages[i])+'</span>'+
   (improved[i]?'<i aria-label="由新本補回">補</i>':'')+(odds?'<sub>'+odds[i]+'%</sub>':'')+'</li>').join('')+
  '</ol></article>';
}
export function copyDesk(s,book,btn,view='desk'){
 const {a,incoming,known,combined,prior,taken,source}=book;
 const copies=deskCopies(s,book),learned=s.learned.includes(a.name);
 const gain=combined.map((q,i)=>known.length>0&&q>prior[i]);
 const after=trainingChance(s,a,combined),before=trainingChance(s,a,prior);
 const chance=learned?'已學成':(known.length&&before!==after?before+'% → ':'')+after+'%';
 const grade=ranks[a.rank]+'品',rank=cardRarity(a),outside=view==='desk';
 const local=(id,label,cls='')=>'<button type="button" class="desk-control '+cls+'" data-desk="'+id+'">'+label+'</button>';
 const close=local('desk','合上，回到案前','close-copy');
 let surface;
 if(outside){
  const books=copies.map((c,i)=>'<button class="edition-object" data-desk="'+i+'" aria-label="揭開'+c.label+'，《'+a.name+'》，'+bindingState(c.pages)[1]+'">'+copyFace(a,c.pages,ranks[a.rank],true)+'<span>'+c.label+'</span></button>').join('');
  surface='<div class="desk-arrangement"><div class="desk-volumes">'+books+'</div><figure class="desk-technique"><figcaption>學成招式</figcaption><button class="card-object" data-desk="card" aria-label="端詳《'+a.name+'》招式牌">'+cardFace(a,s.stars.includes(a.name))+'</button></figure></div>'+
   '<div class="desk-rubbing"><div><small>'+grade+' · '+a.branch+'</small><strong>'+(learned?'已學成':'練成把握　'+chance)+'</strong>'+(book.redundant?'<small>書囊三冊已足。取此冊仍佔一次選書。</small>':'')+'</div>'+local('joined',known.length&&(!taken||source)?'看合讀本':'讀六句招訣')+
   (copies.length>1?local('compare','攤開對讀'):'')+'</div>'+
   '<details class="desk-imprint"><summary>卷印</summary><div>'+rank+' · '+grade+' · '+a.branch+'。'+bindingState(incoming)[1]+'。'+editionInfo(a,source??acquisition(s,a.name)).account+'<p>書衣紋樣辨門類；布帶分三等：素布為下三品，青玉為中三品，金織為上三品。</p>'+(book.detail||'')+(book.odds?'<ul>'+book.odds+'</ul>':'')+'</div></details>';
 }else if(view==='card'){
  surface='<div class="card-on-cloth">'+cardFace(a,s.stars.includes(a.name))+'</div>';
 }else if(view==='compare'){
  surface='<div class="opened-set" style="--copies:'+copies.length+'">'+copies.map(c=>page(a,c.label,c.pages)).join('')+'</div>';
 }else if(view==='joined'){
  surface='<div class="opened-set single">'+page(a,'合讀本',combined,gain,gateOdds(s,a,combined))+'</div>';
 }else{
  const c=copies[Number(view)];surface='<div class="opened-set single">'+page(a,c.label,c.pages)+'</div>';
 }
 const back=source?btn('back','回到洞口','return-copy'):btn('putBack','放回書案','return-copy');
 const take=source?'':btn('take/'+a.name,taken?'已入書囊':'收入書囊','red-seal',taken||!picksLeft(s));
 const controls=outside?back+take:close+(copies.length>1&&view!=='compare'?local('compare','攤開對讀'):'')+(view!=='joined'?local('joined','看合讀本'):'');
 return '<div class="manuscript-desk">'+clothDyes()+'<div class="desk-heading"><h2 tabindex="-1" id="pick-title">'+(outside?a.name:view==='compare'?'攤開對讀':view==='card'?'招式牌':view==='joined'?'合讀招訣':'翻閱抄本')+'</h2><small>'+(outside?'同名抄本 · '+copies.length+' 冊':view==='compare'?(copies.length>2?'左右移動，對照同一句。':'同一行，是同一句招訣。'):'')+'</small></div><div class="desk-surface">'+surface+'</div><div class="reader-actions">'+controls+'</div></div>';
}
