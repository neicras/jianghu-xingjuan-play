import {chapters,qualities,collection} from './manuscripts.js?paper1';
import {editionInfo} from './editions.js?paper1';

export function shelves(s,a){
 const copies=collection(s,a.name);
 if(!copies.length)return '<p class="empty-shelf">藏書閣尚未收錄這門功法。</p>';
 const rows=copies.map((copy,i)=>{
   const ed=editionInfo(a,s.editions?.[a.name]?.[i]);
   const label=ed.label+'・'+'甲乙丙'[i];
   const id='edition-note-'+i;
   return '<tr><th scope="row"><button class="edition-tag" data-action="edition/'+a.name+'/'+i+'" aria-describedby="'+id+'">'+ed.icon+label+'</button>'+
     '<span class="edition-note" role="tooltip" id="'+id+'">'+ed.account+'</span></th>'+
     copy.map(q=>'<td class="quality-'+q+'">'+qualities[q]+'</td>').join('')+'</tr>';
 }).join('');
 return '<table class="chapters shelves"><caption>藏書 <small>指向或點卷印查看來歷</small></caption><thead><tr><th scope="col">卷印</th>'+
 chapters.map(n=>'<th scope="col">'+n+'</th>').join('')+'</tr></thead><tbody>'+rows+'</tbody></table>';
}
export function editionSheet(s,a,i){
 const ed=editionInfo(a,s.editions?.[a.name]?.[i]);
 const copy=collection(s,a.name)[i];
 return '<h2>'+ed.icon+'《'+a.name+'》</h2><h3>'+ed.label+'・'+'甲乙丙'[i]+'</h3><p>'+ed.account+'</p><p>'+copy.map((q,j)=>'第'+chapters[j]+'篇'+['亡佚','殘缺','完整'][q]).join('、')+'。</p>';
}
