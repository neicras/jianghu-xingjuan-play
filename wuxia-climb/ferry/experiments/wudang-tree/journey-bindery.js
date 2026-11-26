import {cardFace} from './card-face.js';
import {bindingState,clothDyes} from './bound-book.js';
import {ranks} from './catalogue.js';
import {chapters,collection,collate} from './manuscripts.js';
import {manualVerses} from './manual-verses.js';
import {editionInfo,acquisition} from './editions.js';
import {trainingChance,gateOdds,picksLeft,attemptFee} from './rules.js';
import {moveNames} from './rehearsal.js';
import {figureBooks} from './bindery/figures.js';

const condition=['缺頁','殘頁','完整'];
const local=(key,label,props='')=>'<button type="button" data-desk="'+key+'" '+props+'>'+label+'</button>';

// Each painted edition has its own title slip. Other bindings use the
// workshop's three grade dyes and three wear paintings with a branch device.
const editionCovers={
 '武當丹劍':{worn:['sword-worn',40.7,77],sound:['sword-sound',45.9,79.2]},
 '八卦步':{sound:['step-sound',45.4,78.9],torn:['step-torn',49.5,78.2]},
 '太極拳':{torn:['palm-torn',45.9,78.4]},
 '武當鐵布衫':{worn:['guard-worn',48,77.8]},
 '太乙雲拂功':{worn:['whisk-worn',45.3,80.5],torn:['whisk-torn',50,78.8]}
};
const devices={劍法:'sword',拳掌:'palm',軟兵:'whisk',身法:'step',內功:'breath',護體:'guard',奇竅:'array'};
export function deskVolume(a,pages){
 const [wear]=bindingState(pages),edition=editionCovers[a.name]?.[wear];
 const dye=a.rank>=7?'':a.rank>=4?'-jade':'-gold';
 const path=edition?'editions/'+edition[0]:wear+dye;
 const split=edition?.[0]==='whisk-torn';
 const face=edition?'':'<img class="jd-device" alt="" src="bindery/art/'+devices[a.branch]+'.webp">';
 const text=split?'<span>太乙</span><span>雲拂功</span>':a.name;
 return '<span class="jd-volume '+(edition?'illustrated':'plain')+(split?' split':'')+'" style="--label-x:'+(edition?.[1]??20)+'%;--label-y:'+(edition?.[2]??31)+'%"><img alt="" src="bindery/art/'+path+'.webp">'+face+'<b>'+text+'</b></span>';
}
export function lessonManuscript(s,lesson){
 const {a,preview,borrowed}=lesson,known=collection(preview,a.name),combined=collate(known);
 return {a,known,prior:combined,combined,taken:true,lesson,editions:borrowed?[{kind:'teacher',floor:s.route.floor}]:s.editions?.[a.name]};
}
function line(pair,q,base=q){
 const gap='<span class="jd-gap" aria-label="缺文">⋯⋯</span>';
 if(!q)return gap;
 const ink=(text,restored)=>restored?'<mark>'+text+'</mark>':text;
 return ink(pair[0]+'，',base===0)+(q===2?ink(pair[1]+'。',base<2):gap);
}
function pose(a,i,q){
 const book=figureBooks[a.name];
 if(!book||!q)return '<span class="jd-leaf q'+q+'" role="img" aria-label="'+condition[q]+'"></span>';
 return '<span aria-hidden="true" class="jd-pose" style="--plate:url(./bindery/art/figures/'+book.plate+'.webp);--y:'+i*20+'%"></span>';
}
export function journeyDesk(s,b,btn,view='desk'){
 const {a,lesson,known,combined,taken,source}=b;
 const model=lesson?.preview??s;
 const copies=known.map((pages,i)=>({pages,title:editionInfo(a,(b.editions??s.editions?.[a.name])?.[i]).label}));
 if(!taken||source)copies.push({pages:b.incoming,title:(source?'洞中拾得':'眼前新本')+' · '+editionInfo(a,source??acquisition(s,a.name)).label});
 const [mode,src,chapter]=view.split('/'),original=src!==undefined&&src!=='all'?copies[Number(src)]:null;
 const intake=!source&&!lesson&&!taken;
 const awaitingJoin=view==='desk'&&intake&&known.length>0&&combined.some((q,i)=>q>b.prior[i]);
 const priorView=awaitingJoin||src==='prior';
 const pages=original?.pages??(priorView?b.prior:combined);
 const title=original?.title??(priorView?'書囊原稿':copies.length===1?'六式招訣':'合校稿');
 const sourceId=original?src:priorView?'prior':'all';
 const book=figureBooks[a.name],names=book?.names??moveNames(a),lines=manualVerses[a.name];
 const grade='武當派 · '+a.branch+' · '+ranks[a.rank]+'品',odds=gateOdds(model,a,combined);
 const joinedBase=!original&&!priorView&&known.length&&!lesson&&!taken?b.prior:pages;
 const preview=(i)=>local('leaf/'+sourceId+'/'+i,'<small>'+chapters[i]+'</small><b>'+names[i]+'</b><span>'+line(lines[i],pages[i],joinedBase[i])+'</span>'+pose(a,i,pages[i]),'class="jd-line" aria-label="第'+chapters[i]+'式 '+names[i]+'，'+condition[pages[i]]+'"');
 let paper='<div class="jd-title"><small>'+a.name+'</small><h3>'+title+'</h3></div>'+chapters.map((_,i)=>preview(i)).join('');
 if(mode==='leaf'){
  const i=Number(chapter),q=pages[i];
  paper='<div class="jd-title"><small>'+title+' · 第'+chapters[i]+'式</small><h3>'+names[i]+'</h3></div><div class="jd-enlarged">'+pose(a,i,q)+'<p>'+line(lines[i],q,joinedBase[i])+'</p><p>'+(q===2?(book?.gloss[i]??'此篇招訣已齊。'):q===1?'只剩上半句，可從另一本抄本找回下文。':'此篇只餘篇目，可翻看同門抄本。')+'</p>'+local('read/'+sourceId,'合回六式')+'</div>';
 }
 const originals=copies.map((c,j)=>'<article>'+local('read/'+j,deskVolume(a,c.pages)+'<strong>'+c.title+'</strong><small>'+bindingState(c.pages)[1]+'</small>','class="jd-source" aria-pressed="'+(original===c)+'"')+'<div class="jd-strip">'+c.pages.map((q,i)=>local('leaf/'+j+'/'+i,'<i class="jd-leaf q'+q+'">'+chapters[i]+'</i>','aria-label="'+c.title+'，第'+chapters[i]+'式，'+condition[q]+'"')).join('')+'</div></article>').join('');
 const learned=s.learned.includes(a.name),chance=trainingChance(model,a,combined);
 const back=btn(lesson||source?'back':'putBack',lesson?'回到師門':source?'回到洞口':'放回書案','return-copy');
 let actions='';
 if(lesson)actions=btn('train/'+a.name,s.xp<lesson.cost?'尚欠 '+(lesson.cost-s.xp)+' 歷練':'請益試演 · '+lesson.cost+' 歷練','red-seal',s.xp<lesson.cost);
 else if(!source&&!taken&&picksLeft(s))actions=btn('take/'+a.name,'收入書囊',learned?'red-seal':'')+(learned?'':btn('takeStudy/'+a.name,'收下並試演','red-seal'));
 if((priorView||original)&&intake&&copies.length>1)actions=local('read/all','合校'+('零一兩三四'[copies.length]||copies.length)+'冊','class="red-seal"');
 const shownChance=priorView||original?trainingChance(model,a,pages):chance;
 const footer=learned?'已學成':((priorView||original?'本稿把握':'練成把握')+' <b>'+shownChance+'%</b>'+((original||priorView)&&shownChance!==chance?'　合校後 '+chance+'%':''));
 return '<section class="manuscript-desk jd">'+clothDyes()+'<div class="desk-heading"><h2 id="pick-title" tabindex="-1">校書案</h2><small>'+grade+'</small></div><div class="jd-body"><figure class="desk-technique"><figcaption>學成招式</figcaption>'+cardFace(a,s.stars.includes(a.name))+'</figure><div class="jd-paper">'+paper+'</div><aside class="jd-sources"><h3>參校抄本</h3>'+originals+local('read/all','查看合校稿','class="jd-join" aria-pressed="'+!original+'"')+'<small>逐篇取各冊最全的文字。</small><details><summary>逐篇把握與卷記</summary><p>'+odds.map((p,i)=>chapters[i]+' · '+p+'%').join('　')+'</p>'+(b.detail||'')+(lesson?'失手用 '+attemptFee(lesson.cost)+' 歷練。':'')+'</details></aside></div><div class="reader-actions">'+back+'<span>'+footer+'</span>'+actions+'</div></section>';
}
