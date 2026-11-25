import {glyph} from './vocabulary.js';
// The third movement borrows a transition from the foundation art. The sixth
// returns to its ending posture. The other four can be read straight from text.
const movements={
  內功:['定神','調息','引氣','行氣','周流','歸元'],
  身法:['立身','移步','換步','轉身','落足','定步'],
  護體:['立樁','沉肩','承勁','固守','卸勁','鬆身'],
  奇竅:['凝神','辨位','易位','照應','相合','歸一'],
  拳掌:['立架','探掌','換掌','送勁','回掌','收勢'],
  劍法:['起劍','引鋒','轉腕','送劍','回鋒','收劍'],
  軟兵:['垂拂','引絲','翻腕','展拂','迴環','收拂']
};
import {chapters} from './manuscripts.js?forms6';
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
  const names=moveNames(a), passed=last.failed<0;
  const rows=last.odds.map((p,i)=>{
    const die=last.rolls[i];
    const status=die==null?'未練到':die<=p?'過關':'失手';
    return '<tr><th>第'+chapters[i]+'篇　'+names[i]+'</th><td>'+p+'%</td><td>'+(die??'—')+'</td><td>'+glyph(die==null?'waiting':die<=p?'pass':'fail')+status+'</td></tr>';
  }).join('');
  return '<h2>'+ (passed?'學成《'+a.name+'》':'《'+a.name+'》未能練成')+'</h2><p>'+
    (passed?'六篇一氣呵成，可以把這門招式放入牌組。':'練到「'+names[last.failed]+'」時，'+setbacks[a.branch][last.failed]+'。你停下翻看這一篇。抄本保留，下次從第一篇重新演練，這一關的把握提高至 '+Math.min(100,last.odds[last.failed]+10)+'%。')+
    '</p><p>'+(last.spent?'這次耗去 '+last.spent+' 點歷練。':'趁著招意尚在，這一遍未耗歷練。')+'</p><table class="roll-log"><caption>逐關擲百分骰，點數不高於把握便過關</caption><thead><tr><th>篇目</th><th>把握</th><th>骰點</th><th>結果</th></tr></thead><tbody>'+rows+'</tbody></table>';
}
