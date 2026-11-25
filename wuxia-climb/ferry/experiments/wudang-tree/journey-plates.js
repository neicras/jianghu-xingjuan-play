import {supportArt} from './art-library/support-files.js';
// These rooms use real journey state. The artwork carries no labels or quantities.
import {teachers, mentorBasics, wares, spoils, fieldPractice, bagCapacity} from './journey.js?inn4';
import {byName,effect} from './catalogue.js?v=1124f';
import {pickedBooks,picksLeft,rewardAmount,trainingChance} from './rules.js?v=1124f';

const art=(id,cls='')=>'<img alt="" draggable="false" class="'+cls+'" src="'+supportArt("journey-"+id)+'">';
const ware=n=>'<img alt="" draggable="false" src="'+supportArt("item-"+wares[n].tile)+'">';
const escape=text=>String(text??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const hosts={health:'服養元丹',xp:'聽師兄談武',sword:'拜師學劍',palm:'拜師學掌'};
export function departure(selected,btn){
 const id=Object.hasOwn(hosts,selected)?selected:'sword', tech=byName.get(teachers[id]);
 const notes=tech?effect(tech,true)+' 師父親授精練版。牌組中一張《'+mentorBasics[id]+'》也升至精練。':id==='health'?'氣血上限增加 6 點，啟程時氣血全滿。':'獲得 12 點歷練，可留待回師門請益。';
 const seats=Object.entries(hosts).map(([k,label])=>'<button class="jp-seat" data-action="seat/'+k+'" aria-pressed="'+(k===id)+'">'+art('host-'+k)+'<span>'+label+'</span></button>').join('');
 return '<section class="jp-room jp-depart"><h2>臨行贈禮</h2><div class="jp-seats">'+seats+'</div><div class="jp-foot"><div class="jp-slip"><b>'+(teachers[id]||hosts[id])+'</b><p>'+notes+'</p></div>'+btn('gift/'+id,'啟程','jp-press')+'</div></section>';
}

const resourceArt={gold:'coins',xp:'diary',ticket:'bookmark'};
export function rewardPile(s,btn){
 const r=s.route,available=spoils(s),practice=fieldPractice(s),left=picksLeft(s),picked=pickedBooks(s);
 const resourceNames={gold:'銅錢 '+rewardAmount(s,'gold')+' 文',xp:'歷練 '+rewardAmount(s,'xp')+' 點',ticket:'校書籤 ×1'};
 const resources=Object.keys(resourceNames).filter(k=>Object.hasOwn(s.rewards,k)).map(k=>{
  const claimed=s.rewards[k],label=resourceNames[k];
  return btn('claim/'+k,(claimed?'<i class="jp-taken">已領</i>':art(resourceArt[k]))+'<span>'+label+'</span>','jp-find',claimed);
 }).join('');
 const gear=available.filter(n=>wares[n].kind!=='藥物'),drug=available.find(n=>wares[n].kind==='藥物');
 const bundles=['戰後選裝','守關獎勵'].map((group,i)=>{
  const names=gear.filter(n=>(group==='戰後選裝'?wares[n].source===group:wares[n].kind!=='藥物'&&wares[n].source!=='戰後選裝'));
  if(!names.length)return '';
  return btn('pickGear/'+i,'<i>'+names.slice(0,2).map(ware).join('')+'</i><span>'+group+' · 選一件</span>','jp-find');
 }).join('');
 const books=!s.offer.length?'':btn('books',art('manuals')+'<span>'+(left?'挑選秘笈 · 尚可取 '+left+' 冊':'已取 '+picked.length+' 冊')+'</span>','jp-find jp-manuals',!left);
 const learn=practice.map(n=>btn('train/'+n,'試演《'+n+'》 · '+trainingChance(s,byName.get(n))+'%','jp-study')).join('');
 const unclaimed=left||available.length||Object.values(s.rewards).includes(false);
 const message=escape(r.last)||((r.loot?.elite||[5,10].includes(r.floor))?'守關得勝，可挑一件守關信物。':!s.offer.length?'這回沒尋到抄本。下一場比武得勝，便可再挑秘笈。':'點選想帶走的戰利品。');
 return '<section class="jp-room jp-loot"><h2>戰後所得</h2><div class="jp-takings">'+resources+'</div>'+books+'<div class="jp-drops">'+bundles+'</div><div class="jp-drug">'+(drug?btn(s.bag.length>=bagCapacity?'swap/'+drug:'pack/'+drug,ware(drug)+'<span>'+drug+(s.bag.length>=bagCapacity?' · 換藥':'')+'</span>','jp-find'):'')+'</div><div class="jp-foot"><div class="jp-slip" aria-live="polite"><p>'+message+'</p>'+learn+'</div>'+btn('leave',unclaimed?'留下餘物上路':'繼續上路','jp-press')+'</div></section>';
}
export function gearOffers(s,index,btn){
 const group=['戰後選裝','守關獎勵'][index];
 return '<h2>'+group+' · 選一件</h2><div class="jp-gear-options">'+spoils(s).filter(n=>(group==='戰後選裝'?wares[n].source===group:wares[n].kind!=='藥物'&&wares[n].source!=='戰後選裝')).map(n=>btn('pack/'+n,ware(n)+'<b>'+n+'</b><span>'+wares[n].text+'</span>')).join('')+'</div>';
}
export function ending(s,btn){
 const r=s.route,won=r.phase==='won',stops=r.path.slice(0,15);
 // Stations are evenly spaced along the scroll; branches lift or lower a stop.
 const points=stops.map((lane,i)=>[11+i*5.45,76-1.7*i-4*Math.sin(i*.94)-(lane?5:0)]);
 const path=points.map(p=>p.join(',')).join(' ');
 const trail='<svg class="jp-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="'+path+'" fill="none" stroke="#deb567" stroke-width="3" vector-effect="non-scaling-stroke"/>'+points.map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r=".72" fill="#ffe2a0"/>').join('')+'</svg>';
 const label=won?'守壇告捷':'此行止步';
 return '<section class="jp-room jp-ending"><div class="jp-scroll">'+art('scroll','jp-roll')+trail+'<strong class="jp-result '+(won?'won':'lost')+'">'+label+'</strong>'+btn('deck','牌組','jp-tab')+'</div><div class="jp-endnote"><b>第 '+r.floor+' 站　·　'+s.wins+' 場勝仗　·　學成 '+s.learned.length+' 門</b><p>'+(won?'守壇劍宗收劍認輸。尚餘 '+r.hp+' 點氣血。':escape(r.last)+' 氣血耗盡。')+'</p></div>'+btn('retry','重新出發','jp-press')+'</section>';
}
