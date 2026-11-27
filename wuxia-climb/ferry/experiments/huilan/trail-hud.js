import {supportArt} from './art-library/support-files.js';

export function objectImage(id) {
  return '<img src="'+supportArt(id)+'" alt="">';
}

export function trailTools() {
  const tools = [
    ['guide','招式釋義','journey-read'], ['kit','行囊圖錄','book-satchel'],
    ['tree','武學譜','journey-diary'], ['deck','牌組','back']
  ];
  return tools.map(([action,label,art])=>'<button class="trail-tool" data-action="'+action+
    '" aria-label="'+label+'">'+objectImage(art)+'<span class="tool-name">'+label+'</span></button>').join('');
}

export function wallet(hp, maxHp, xp, gold) {
  const values = [['hp','氣血',hp+'/'+maxHp],['xp','歷練',xp],['gold','銅錢',gold]];
  return values.map(([id,name,value])=>'<span class="trail-stat">'+objectImage('journey-'+id)+
    '<span class="visually-hidden">'+name+' </span><b data-stat="'+id+'">'+value+'</b></span>').join('');
}
