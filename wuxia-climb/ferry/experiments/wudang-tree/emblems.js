import {supportArt} from './art-library/support-files.js';
export function sigil(a){
 const id=a.image.split('/').at(-3);
 return '<span class="tech-mark sigil ink-seal" aria-hidden="true" style="--plate:url('+supportArt('seal-'+id)+')"><span></span></span>';
}
// A repeated corner ornament is cut to the vocabulary of each discipline.
const borders={
 '內功':'M4 25V13Q4 4 13 4h12 M8 21v-7a6 6 0 0 1 6-6h7 M11 17a6 6 0 0 1 6-6',
 '身法':'M3 23q9-1 8-8-1-5 5-5 6 0 8-7 M5 15q1-7 9-9 M7 23q9-3 9-9',
 '護體':'M4 25V4h21 M8 22V8h14 M12 19v-7h7 M4 15l8-3 3-8',
 '奇竅':'M3 22l9-10 10-9 M4 10l6-6 6 6-6 6z M9 24l8-8 7-7',
 '拳掌':'M3 24V6h20 M8 20v-9h11v5h-6v6 M4 25l4-5',
 '劍法':'M3 25 7 7 25 3 10 10Z M9 19l10-10 M11 21l10-10',
 '軟兵':'M3 26q0-18 23-23 M7 25Q9 11 25 7 M12 24q3-10 13-12'
};
export function sealFrame(branch){
 const corner='<path d="'+borders[branch]+'"/>';
 return '<svg class="seal-border" viewBox="0 0 100 100" aria-hidden="true"><path class="seal-rim" d="M5 2H95L98 5V95L95 98H5L2 95V5Z"/>'+
 [0,90,180,270].map(deg=>'<g transform="rotate('+deg+' 50 50)">'+corner+'</g>').join('')+'</svg>';
}
