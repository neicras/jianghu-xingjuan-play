import {trailTools} from './trail-hud.js';
import {supportArt} from './art-library/support-files.js';
// The journey and the standalone study use the same merchant and purchase rules.
import {stockAt,stallLimit,wares} from './journey.js?v=1124f';

export function merchant(s, chosen, journey=false) {
  const stock=stockAt(s), names=Object.keys(stock);
  const name=Object.hasOwn(stock,chosen)?chosen:names[0];
  const sold=n=>s.route.purchases?.includes(n);
  const limit=stallLimit(s,name);
  const tags=names.map(n=>{
    const blocked=stallLimit(s,n), taken=sold(n)||blocked==='今日藥材已用完';
    return '<button type="button" class="mk-lot" data-action="inspectWare/'+n+'" aria-pressed="'+(n===name)+'" aria-label="'+
      n+'，'+stock[n]+' 文'+(blocked?'，'+blocked:'')+'">'+
      '<span class="mk-object">'+(taken?'<span class="mk-stamp">售罄</span>':'<img src="'+supportArt('item-'+wares[n].tile)+'" alt="">')+'</span>'+
      '<span class="mk-tag"><b>'+n+'</b><small>'+stock[n]+' 文</small></span></button>';
  }).join('');
  const dose=s.route.stop.sharedMedicine&&wares[name].kind==='藥物';
  const description=sold(name)?'已收入行囊。這件貨已經賣出。':wares[name].text+(dose?' 今日的藥材只夠配一劑，兩方任選其一。':'');
  const kit=s.relics.concat(s.bag).join('、')||'尚未攜帶物品';
  const links=journey?'<div class="mk-links">'+trailTools()+'<button data-action="map">路線</button></div>':'';
  return '<section class="mk-market" aria-label="山道貨郎"><h1 class="mk-banner"><span>山道貨郎</span></h1>'+
    '<details class="mk-wallet"><summary aria-label="盤纏 '+s.gold+' 文，查看行裝"><b>'+s.gold+' 文</b></summary>'+
    '<div class="mk-bag"><strong>隨身行裝</strong><p>氣血 '+s.route.hp+'／'+s.route.maxHp+'　歷練 '+s.xp+'</p><p>'+kit+'</p>'+links+'</div></details>'+
    '<div class="mk-stock">'+tags+'</div>'+
    '<div class="mk-foot"><article class="mk-slip" aria-live="polite"><b>'+name+'</b><p>'+description+(!limit?'<small>購後餘 '+(s.gold-stock[name])+' 文</small>':'')+'</p></article>'+
    '<button class="mk-pay" data-action="buy/'+name+'" '+(limit?'disabled':'')+'>'+ (limit||'付 '+stock[name]+' 文')+'</button>'+
    '<button class="mk-leave" data-action="leave">離開</button></div></section>';
}
