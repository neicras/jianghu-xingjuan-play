// Each volume uses station numbers 1–15. Story results belong to a particular
// visit, so another volume can use the same station without overwriting it.
export const volumes=['夜渡','紙上的死人','開倉還銀'];
export const chapterOf=r=>r.volume??1;
export function episode(r,kind){
 return r.episodes?.find(e=>e.volume===chapterOf(r)&&e.kind===kind);
}
export function remember(r,kind,facts={}){
 r.episodes??=[];
 if(!episode(r,kind))r.episodes.push({volume:chapterOf(r),station:r.floor,kind,...facts});
}
export const crossings={
 5:{kind:'receipt',name:'石生的小渡',text:'石生把船撐離擂台，從懷裏取出一張領據。「我娘連名字都不會寫。你看，是誰替她簽得這樣端正？」',action:'收好領據，請石生帶路',result:'石生答應陪你到紙坊認印。看門教頭認得他，肯讓你單獨見墨師傅。'},
 10:{kind:'herbalist',name:'藥船夜渡',text:'雙煞的擂台還亮著燈，阿綾的小船已經要開。你替她把藥箱搬上船，她拆開一包傷藥，替你敷在手臂上。',action:'隨藥船過江',result:'阿綾替你敷了藥。雙煞令留在擂上。'}
};
export function confirmCrossing(s){
 const r=s.route,c=crossings[r.floor];
 if(r.phase!=='cache'||r.stop?.story!=='crossing'||!c)return false;
 const healed=c.kind==='herbalist'?Math.min(5,r.maxHp-r.hp):0;
 r.hp+=healed;remember(r,c.kind,{healed});r.last=c.result+(healed?' 回復 '+healed+' 氣血。':'');
 r.phase='map';return true;
}
