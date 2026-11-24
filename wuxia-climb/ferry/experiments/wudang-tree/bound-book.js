import {cardRarity} from './card-face.js';
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

// A notch follows the chapter's place in the copy. Rank is printed on a
// separate tag so a rare, badly damaged copy can still read as both.
export function copyFace(art, sections, grade) {
  const rarity=cardRarity(art);
  const silhouette=supportArt(editions[art.name]?'volume-'+editions[art.name]:'book-shell');
  const wear=sections.reduce((sum,q)=>sum+2-q,0);
  const edge=['0% 0%','100% 0%','100% 100%','0% 100%'];
  let scars='';
  for(let i=sections.length-1;i>=0;i--){
    const y=16+i*12,quality=sections[i];
    if(quality===2)continue;
    if(quality===0){
      edge.push('0% '+(y+4)+'%','6% '+(y+1)+'%','3% '+y+'%','8% '+(y-2)+'%','0% '+(y-3)+'%');
      scars+='<path d="M1 '+(y+4)+' l8 -3 -3 -1 7 -3 -12 1 7 1 -5 2Z" fill="#e7bf80"/>';
    }else{
      scars+='<path d="M2 '+(y+2)+' l8 -5 -3 4 7 -3 -10 7Z" fill="#d5a369" stroke="#563d39" stroke-width=".65"/>';
    }
  }
  // Cloth peeled from the foot exposes a layered block of handmade paper.
  // The strongest damage also leaves a visible mend across the split binding.
  if(wear>=4){
    const extent=Math.min(55,wear*5);
    scars+='<g transform="translate(5 95) scale('+extent/42+' '+Math.min(1.4,wear/6)+')">'+
     '<path d="M0 0 Q0 -12 2 -18 L4 -12 7 -14 Q6 -6 14 -10 L17 -11 15 -7 Q21 -5 26 -8 L24 -4 Q29 -3 35 -5 L33 -2 39 -2 36 0Z" fill="#492e34"/>'+
     '<path d="M2 -1 3 -12 5 -9 8 -11 Q7 -5 13 -8 L12 -5 Q17 -4 23 -6 L21 -3 30 -4 26 -2Z" fill="#dcb47b"/>'+
     '<path d="m3 -4 9 -3 -3 2 7 -1 m-12 3 13 -2" stroke="#936744" stroke-width=".9" fill="none"/></g>';
  }
  if(wear>=6){
    scars+='<g transform="rotate(-12 84 22)"><path d="m75 12 17 2 -2 15 -15 -2 2 -4 -3 -2Z" fill="#9c7650" stroke="#442e36" stroke-width="1.1"/>'+
     '<path d="m76 16 5 1 m-5 3 5 1 m-5 3 5 1 m5 -7 5 1 m-6 3 5 1 m-6 3 5 1" stroke="#efd39b" stroke-width="1.4"/></g>';
  }
  return '<span class="copy-face" data-rarity="'+rarity+'"><span class="copy-cloth" style="mask-image:url(&quot;'+silhouette+'&quot;);mask-size:100% 100%;clip-path:polygon('+edge.join(',')+')">'+cover(art)+
    '<svg class="wear-ink" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+scars+'</svg></span>'+
    '<i class="grade-tag">'+grade+'品</i></span>';
}
