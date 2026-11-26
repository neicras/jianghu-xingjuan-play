import {cardRarity} from './card-face.js?forms7';
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
// Dye only the blue-green binding cloth. Paper, gilt stitching and the art
// printed over it retain their original colours on all three painted shells.
const dyes={'普通':['common','#3e4661'],'精良':['uncommon','#397b6b'],'稀有':['rare','#9b6c30']};
export function clothDyes(){
 return '<svg class="cloth-dyes" width="0" height="0" aria-hidden="true"><defs>'+Object.values(dyes).map(([id,colour])=>
  '<filter id="book-dye-'+id+'" color-interpolation-filters="sRGB"><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -4 0 4 0 -0.04" result="cloth"/><feFlood flood-color="'+colour+'"/><feComposite in2="cloth" operator="in"/><feComposite in2="SourceGraphic" operator="atop"/></filter>'
 ).join('')+'</defs></svg>';
}
export function copyFace(art,sections,grade,desk=false){
  const [binding,condition]=bindingState(sections),rarity=cardRarity(art);
  const cloth={'劍法':'#b9b3a2','身法':'#a1bf9e','護體':'#c1a77e','拳掌':'#ca9682','內功':'#a3b498','奇竅':'#ba9dbb','軟兵':'#b1a1bf'}[art.branch];
  const picture=desk&&binding==='torn'?'3,2 115,0 112,55 93,69 100,85 83,119 55,115 49,141 6,150':desk&&binding==='worn'?'3,1 117,2 116,121 99,138 68,136 60,149 2,151':'0,0 119,0 119,154 0,154';
  const tooling={
    '劍法':'M75 0l-50 12 5-6z','身法':'M12 11q13-14 25-8t30-1q-8 11-23 6T12 11','護體':'M22 0h29v6l-14 7-15-7z',
    '拳掌':'M15 9l7-8 4 6 6-7 5 6 5-5 8 9-15 3z','軟兵':'M12 10q14-15 28-5t29-3M15 13q14-14 29-5t25-3',
    '內功':'M20 8q10-12 24-5t21 0q-9 13-23 6T20 8','奇竅':'M14 6l12-5 12 8 16-7 13 7-12 3-16-1-12-5z'
  };
  const thread=desk?'<path d="M63 39l127-3-3 26-124 3z" fill="'+cloth+'" stroke="#4c3b3d" stroke-width="2"/><path transform="translate(79 42)" d="'+tooling[art.branch]+'" fill="#4d3641" stroke="#4d3641" stroke-width="1.4"/>':'';
  const patch=desk&&binding!=='sound'?'<path d="M62 247l24-12 9 19-26 12z" fill="#c5ad81" stroke="#72583f"/><path d="m65 245 4 6m2-10 4 6m4-11 4 6m2-8 4 6" stroke="#665238" stroke-width="2"/>':'';
  return '<span class="copy-face'+(desk?' desk-cover':'')+'" data-binding="'+binding+'" data-rarity="'+rarity+'"><svg class="bound-print" viewBox="0 0 220 325" aria-hidden="true">'+
    '<image href="'+supportArt('binding-'+binding)+'" '+(desk?'filter="url(#book-dye-'+dyes[rarity][0]+')"':'')+' width="220" height="325" preserveAspectRatio="none"/>'+
    '<svg class="cover-print" x="67" y="77" width="119" height="154" viewBox="0 0 119 154">'+
    '<image href="'+art.image+'" width="119" height="154" preserveAspectRatio="xMidYMid slice" style="clip-path:polygon('+picture.split(' ').map(pair=>{const [x,y]=pair.split(',');return x+'px '+y+'px'}).join(',')+')"/></svg>'+thread+patch+
    '<text x="37" y="27" writing-mode="vertical-rl" fill="#332536" font-family="serif" font-weight="bold" font-size="'+Math.min(21,150/art.name.length)+'">'+art.name+'</text></svg>'+
    (desk?'':'<i class="grade-tag">'+rarity+'・'+grade+'品</i><small class="binding-label">'+condition+'</small>')+'</span>';
}
