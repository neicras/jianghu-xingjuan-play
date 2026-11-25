import {effect} from "./catalogue.js?forms6";
import {marked} from "./vocabulary.js";
export const cardRarity=a=>a.branch==="傷勢"?"傷勢":!a.rank||a.rank>=7?"普通":a.rank>=4?"精良":"稀有";
export function cardFace(a,star=false,cost=a.cost,text=effect(a,star)){
  const imageUrl=new URL(a.image,import.meta.url).href;
  return '<div class="print '+cardRarity(a)+'" style="--ill:url('+imageUrl+')"><strong>'+a.name+'</strong><i>'+(Number.isFinite(cost)?cost:'—')+'</i><em>'+a.branch+'</em><p>'+marked(text)+'</p><small>'+cardRarity(a)+(a.branch==='傷勢'?'':star?' ★★':' ★')+'</small></div>';
}
