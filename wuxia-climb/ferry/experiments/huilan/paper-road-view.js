import {crossingFor,episode,volumes,chapterOf,stationNumber} from './chapter-road.js';
import {supportArt} from './art-library/support-files.js';

const art=(id)=>supportArt(id);
export function crossingRoom(r,btn){
 const c=crossingFor(r),health=c.kind==='herbalist'?Math.min(5,r.maxHp-r.hp):0;
 return '<section class="jp-room jp-event" style="--scene:url('+art('ferry')+')"><div><h2>'+c.name+'</h2><p>'+c.text+'</p>'+
  btn('leave','<strong>'+c.action+'</strong><small>'+(chapterOf(r)>1&&r.floor===5?'平安繞過這一站的擂台。':c.kind==='receipt'?'紙坊的教頭會讓路，只有墨師傅出掌。':'回復 '+health+' 氣血，放棄雙煞令。')+'</small>','story-choice')+'</div></section>';
}
export function forkMap(r){
 const fifth=r.floor===4,receipt=episode(r,'receipt');
 const route=(lane,image,title,stakes,voice)=>'<button type="button" class="river-place" data-action="enter/'+lane+'"><img src="'+art(image)+'" alt=""><span><strong>'+title+'</strong><small>'+voice+'</small><b>'+stakes+'</b></span></button>';
 const gate=fifth?route(0,'journey-boxing','登鐵衣擂','精英戰 · 勝取鐵衣令','堂主守著官道。令牌可讓你在往後每場交手搶先一步。'):'';
 const boat=fifth?route(1,'ferry','隨石生過渡','平安過江 · 石生作證','石生帶著領據。到了紙坊，他能支開守門的教頭。'):
 route(5,'journey-letter','到紙坊認印',receipt?'單人 · 墨師傅':'雙人 · 墨師傅與教頭',receipt?'石生敲了兩下側門。看門人認得他，把你讓進院內。':'堂主的令牌叫開了門，教頭仍守在刻桌旁。');
 return '<section class="river-map"><div class="river-heading"><small>卷'+['一','二','三'][chapterOf(r)-1]+' · '+volumes[chapterOf(r)-1]+'　／　第'+(r.floor+1)+'站</small><h2>'+(fifth?'擂台與渡口':'紙坊門前')+'</h2><p>'+(fifth?'岸上有人擺擂。岸下的篙手拿著一張領據，等人陪他去認一個字。':'墨師傅願翻出印版。接穩他的一掌，勝後他還會補寫長拳的收勢。')+'</p></div><div class="river-paths">'+gate+boat+'</div><div class="river-nav"><button data-action="map">展開整卷地圖</button><button data-action="deck">整備牌組</button><button data-action="restartPrompt">重新開局</button></div></section>';
}
export function paperRecap(s,btn){
 const r=s.route,press=episode(r,'woodblock');
 const route=press.witnessed?'石生帶路，教頭讓開了紙坊側門。':'你憑鐵衣令叫開院門，同墨師傅和教頭交過手。';
 const lesson=press.proof?'第 '+press.proof+' 回合接穩試掌，墨師傅留下《撐篙長拳》抄本。':'墨師傅依約交出印版；這場未接穩試掌，沒有取得他的拳譜。';
 const kept=s.editions?.['撐篙長拳']?.some(e=>e.kind==='printer');
 return '<section class="jp-room jp-event" style="--scene:url('+art('journey-letter')+')"><div><h2>紙坊手記</h2><p>'+route+'</p><p>'+lesson+(press.proof?(kept?'你把親筆本收進了書囊。':'這份親筆本沒有收入書囊。'):'')+'</p><p>印版背面有個庫號。這條線索留待卷二追查。</p><p>交手 '+press.turns+' 回合 · 觸發接招 '+press.links+' 次 · 戰後氣血 '+press.hp+'</p>'+btn('paperAgain','換條路再試','story-choice')+btn('onward','帶著牌組繼續第一卷','story-choice')+'</div></section>';
}

export function volumeReview(s){
 const r=s.route,press=episode(r,'woodblock');
 const visited=(floor,challenge,detour)=>r.floor>=floor?(r.path[floor-1]===0?challenge:detour):'';
 const lines=[visited(5,'登鐵衣擂','從小渡過江'),visited(10,'上擂會雙煞','乘藥船繞關')].filter(Boolean);
 if(chapterOf(r)>1){lines.length=0;for(const f of [5,10])if(r.floor>=f)lines.push(r.path[f-1]===0?'第 '+stationNumber(r,f)+' 站登擂':crossingFor({...r,floor:f}).name)}
 if(chapterOf(r)===1&&episode(r,'receipt'))lines.push('石生在船上交出了領據');
 if(press)lines.push('紙坊遇見'+(press.witnessed?'墨師傅':'墨師傅與教頭')+'，'+(press.proof?'第 '+press.proof+' 回合接穩試掌':'取得了印版上的庫號'));
 return '<h2>卷'+['一','二','三'][chapterOf(r)-1]+'手記 · '+volumes[chapterOf(r)-1]+'</h2>'+
  '<p>'+lines.join('。')+(lines.length?'。':'尚未抵達關口。')+'</p><h3>帶在身上的功夫</h3><p>'+ (s.equipped.length?s.equipped.map(n=>'《'+n+'》').join('、'):'散學招式')+'</p>'+
  (r.completedVolumes||[]).map(v=>'<p>卷'+'一二三'[v.volume-1]+'《'+volumes[v.volume-1]+'》已過 · 過關時餘 '+v.hp+' 點氣血。</p>').join('')+'<p>第 '+stationNumber(r)+' 站 · 餘下 '+r.hp+'／'+r.maxHp+' 氣血。</p>';
}
