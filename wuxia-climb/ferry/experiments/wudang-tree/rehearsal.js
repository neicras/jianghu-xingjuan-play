import {glyph} from './vocabulary.js';
// The third movement borrows a transition from the foundation art. The sixth
// returns to its ending posture. The other four can be read straight from text.
import {figureBooks} from './bindery/figures.js';
const movements={
  內功:['定神','調息','引氣','行氣','周流','歸元'],
  身法:['立身','移步','換步','轉身','落足','定步'],
  護體:['立樁','沉肩','承勁','固守','卸勁','鬆身'],
  奇竅:['凝神','辨位','易位','照應','相合','歸一'],
  拳掌:['立架','探掌','換掌','送勁','回掌','收勢'],
  劍法:['起劍','引鋒','轉腕','送劍','回鋒','收劍'],
  軟兵:['垂拂','引絲','翻腕','展拂','迴環','收拂']
};
import {chapters} from './manuscripts.js?forms7';
export const moveNames=a=>movements[a.branch];
const setbacks={
  內功:['心神游移，沒能入定','呼吸漸急，調不回原來的節奏','想引氣往下，卻想不起師訣的下半句','氣息忽長忽短，接不上下一段','只走了半個周天，便亂了節拍','末了一口氣沒能平復，只好先歇息'],
  身法:['起步時身子已經偏了','第二步落得太遠','腳步換了，身子卻慢了半拍','轉過身來，已偏離原來的步線','落腳時多踏了半步','走完全圈，竟沒能站回起點'],
  護體:['樁還未站穩','兩肩越沉越僵','來勁一變，架子便散了','守到中途，氣息亂了','勁還沒卸盡，人已先退','一套練完，兩肩仍然繃緊'],
  奇竅:['未能靜心辨勢','錯認了第二個方位','一換方位便失了照應','只顧眼前，漏了另一側','兩處呼應早了半拍','回到原位，首尾仍接不起來'],
  拳掌:['拳架未立穩','掌伸得太早','兩掌交替時露出一段停頓','掌到了，勁卻遲了一拍','回掌時身形也被帶偏了','最後一掌未能收回原來的架勢'],
  劍法:['劍尖剛起已偏離劍譜所畫的線','引劍太急，劍鋒晃了一下','腕已轉過，劍尖卻慢了半拍','劍送到盡頭，便再接不下去','劍鋒回轉時畫多了半圈','劍已收回，腳下還要多踏一步才能站穩'],
  軟兵:['拂絲未垂定','拂絲纏在一處','手腕翻過，拂梢卻遲了一拍','拂梢只展開了一半','迴環時絲尾打了個結','手已停下，拂梢仍收不回來']
};
export function rehearsalResult(a,last){
  const book=figureBooks[a.name],names=book?.names??moveNames(a), passed=last.failed<0;
  const rows=last.odds.map((p,i)=>{
    const die=last.rolls[i];
    const status=die==null?'未練到':die<=p?'過關':'失手';
    return '<tr><th>第'+chapters[i]+'篇　'+names[i]+'</th><td>'+p+'%</td><td>'+(die??'—')+'</td><td>'+glyph(die==null?'waiting':die<=p?'pass':'fail')+status+'</td></tr>';
  }).join('');
  const traces=names.map((name,i)=>{
    const state=i>=last.rolls.length?'waiting':i===last.failed?'fail':'pass';
    const quality=last.sections?['缺頁','殘頁','全篇'][last.sections[i]]+' · ':'';
    const image=book&&state!=='waiting'?'<i aria-hidden="true" class="jd-result-pose" style="--plate:url(./bindery/art/figures/'+book.plate+'.webp);--y:'+i*20+'%;--beat:'+i+'"></i>':'';
    return '<li class="gate-'+state+'" style="--beat:'+i+'"><small>'+chapters[i]+'</small><b>'+name+'</b><span>'+quality+last.odds[i]+'%</span>'+image+'<strong>'+({pass:'已通',fail:'受阻',waiting:'未至'}[state])+'</strong></li>';
  }).join('');
  const i=last.failed,sections=last.sections;
  const cause=i<0?'':last.foundation===false&&(i===2||i===5)?'此處承接《'+a.parent+'》；未學前功，這一式較難接上。':sections&&sections[i]<2?'手上各冊的第'+chapters[i]+'篇'+(sections[i]===0?'都是缺頁':'仍有缺字')+'，值得另找一冊參照。':'';
  const feedback=passed?'六篇首尾相接，這門功夫練成了。':
    '演到「'+names[last.failed]+'」，'+setbacks[a.branch][last.failed]+'。'+cause+'抄本仍在。再練從第一篇起，這一關的把握會由 '+last.odds[last.failed]+'% 提至 '+Math.min(100,last.odds[last.failed]+10)+'%。';
  return '<section class="practice-reading"><h2>試演《'+a.name+'》</h2><ol class="practice-trace" aria-label="六篇試演結果">'+traces+'</ol>'+
    '<p>'+feedback+'</p><small>'+(last.spent?'此番用了 '+last.spent+' 點歷練。':'趁記憶猶新，當場試演，未耗歷練。')+'</small>'+
    '<details><summary>翻看逐篇骰點</summary><table class="roll-log"><caption>骰點不高於該篇把握，即可接演下一篇。</caption><thead><tr><th>篇目</th><th>把握</th><th>骰點</th><th>結果</th></tr></thead><tbody>'+rows+'</tbody></table></details></section>';
}
