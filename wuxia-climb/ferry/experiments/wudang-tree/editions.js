import {notes} from './annotations.js';

const editions={
 cave:{label:'鏢局抄本',path:'M4 4h16v16H4z M7 4v16m4-11h6m-6 4h4'},
 teacher:{label:'師門講義',path:'M4 4h16v16H4z M8 4v16m2-11h7m-7 4h5'},
 old:{label:'舊藏本',path:'M4 5h15v15H4z M7 5v15m3-10h5'},
 primer:{label:'隨身本',path:'M5 3h14v18H5z M8 3v18m3-13h5m-5 4h4'},
 field:{label:'手記',path:'M4 4l14-1 2 17-15 1z M8 9l7-1m-6 5 6-1'},
 traced:{label:'摹本',path:'M8 3h12v15H8z M4 7v14h12 M11 7h6m-6 3h4'},
 loose:{label:'散頁',path:'M5 4h10l4 4v13l-4-2-4 2-6-2z M15 4v5h4m-11 3h7'},
 archive:{label:'校本',path:'M3 4h8l2 2 2-2h6v15h-7l-2 2-2-2H3z M12 7v12'}
};
export function acquisition(s,name){
 const kind=s.rerolled?'archive':s.drawInfo[name]?.kind==='focus'?'traced':s.drawInfo[name]?.kind==='opening'?'field':'loose';
 return {kind,round:s.wins,...(s.route?.floor?{floor:s.route.floor}:{})};
}
export function editionInfo(a,source){
 const kind=source?.kind||'old', type=editions[kind];
 const site=!source?.floor||source.floor<=4?'渡口':source.floor<=9?'竹關':'焚天壇山道';
 const accounts={
   cave:'第 '+source?.floor+' 站，在竹關山洞的鏢囊裏找到。紙上還蓋著鏢局的朱印。',
   teacher:'第 '+source?.floor+' 站回到師門，隨師兄練功時抄下的講義。',
   old:'此冊早已收在行囊裏，舊藏沒有記下得書處。',
   primer:'出發時已帶在行囊裏的橋頭習劍手冊，頁角還留著翻讀的摺痕。',
   field:notes[a.name]+'這段見聞記在戰後所得的手記裏。',
   traced:'託人專尋《'+a.name+'》，在'+site+'的抄書攤尋得一冊摹本，章末留有原本的行款。',
   loose:'比武散場，在'+site+'的舊書席拾得一包散頁。包紙上題著《'+a.name+'》。',
   archive:'在'+site+'書攤另覓同名抄本所得，抄書人把辨得清的字又校了一遍。'
 };
 const inscription=['traced','loose','archive'].includes(kind)?' 頁邊另記一事：'+notes[a.name]:'';
 return {label:type.label,icon:'<svg class="edition-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="'+type.path+'"/></svg>',
   account:(source?.round?'第 '+source.round+' 場戰後入藏。':'')+accounts[kind]+inscription};
}
