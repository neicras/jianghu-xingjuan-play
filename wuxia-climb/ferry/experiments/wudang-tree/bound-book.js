import {cardRarity} from './card-face.js?v=1124f';
import {supportArt} from './art-library/support-files.js';

const editions = {
  '武當丹劍':'dan', '八卦步':'steps', '白虹劍法':'rainbow', '武當長拳':'fist', '武當鐵布衫':'coat'
};

export function cover(art) {
  const cut = editions[art.name];
  if (cut) return '<img class="volume-art" alt="" src="'+supportArt('volume-'+cut)+'">';
  // Cover coordinates follow the trimmed shell. Draw the title and each
  // technique's painting on its cloth, clear of the stitches and page block.
  return '<svg class="volume-art printed" aria-hidden="true" viewBox="0 0 220 325">'+
    '<image href="'+supportArt('book-shell')+'" width="220" height="325"/>'+
    '<svg class="cover-print" x="68" y="55" width="123" height="213" viewBox="0 0 123 213">'+
    '<image href="'+art.image+'" width="123" height="213" preserveAspectRatio="xMidYMid slice"/></svg>'+
    '<text x="37" y="27" writing-mode="vertical-rl" text-anchor="start" fill="#382635" font-family="serif" font-weight="bold" font-size="'+Math.min(21,150/art.name.length)+'">'+art.name+'</text></svg>';
}

export function pouch() {
  return '<img alt="" src="'+supportArt('book-satchel')+'">';
}

// Colour and text on the sewn tag express rank. Physical wear comes from all six leaves.
export function bindingState(sections){
  const survivingInk=sections.reduce((sum,q)=>sum+q,0);
  if(survivingInk>=9)return ['sound','保存良好'];
  if(survivingInk>=5)return ['worn','磨舊'];
  return ['torn','殘破'];
}
export function copyFace(art,sections,grade){
  const [binding,condition]=bindingState(sections),rarity=cardRarity(art);
  return '<span class="copy-face" data-rarity="'+rarity+'"><svg class="bound-print" viewBox="0 0 220 325" aria-hidden="true">'+
    '<image href="'+supportArt('binding-'+binding)+'" width="220" height="325" preserveAspectRatio="none"/>'+
    '<svg class="cover-print" x="67" y="77" width="119" height="154" viewBox="0 0 119 154">'+
    '<image href="'+art.image+'" width="119" height="154" preserveAspectRatio="xMidYMid slice"/></svg>'+
    '<text x="37" y="27" writing-mode="vertical-rl" fill="#332536" font-family="serif" font-weight="bold" font-size="'+Math.min(21,150/art.name.length)+'">'+art.name+'</text></svg>'+
    '<i class="grade-tag">'+rarity+'・'+grade+'品</i><small class="binding-label">'+condition+'</small></span>';
}
