import {supportArt} from './art-library/support-files.js';
export const keywords={
 保留:'收勢時留在手上，下回合仍可使用。',
 運功:'打出後整場生效，這張牌移出本場抽牌循環。',
 穿勁:'這張牌的攻擊直接扣氣血，對手的護體照舊保留。',
 消耗:'移到本場的消耗堆，洗牌時不會抽回。',
 虛無:'收勢時仍在手上，便自動消耗。即使同時獲得保留，虛無仍先生效。',
 起手:'一定出現在開場的五張手牌中，佔一個抽牌位。',
 無法打出:'這張牌會佔一個手牌位。只可用其他招式或信物處理。'
};
export const statuses={
 識招:'本場每用同一張攻招打他一次，再用時每擊少 1 點，最多減 3 點。連打數下仍只記一次。',
 破綻:'受到攻擊時，每擊傷害增加一半。按回合倒數。',
 氣短:'打出攻擊時，每擊傷害減少四分之一。按回合倒數。',
 勁力:'本場每點勁力令每一下攻擊多打 1 點，再計氣短和破綻。',
 守勁:'本場每點守勁令每張提供護體的招式多給 1 點護體。'
};
export function marked(text){
 return text.replace(/無法打出|保留|消耗|虛無|起手|運功|穿勁|破綻|氣短|勁力|守勁/g,term=>'<b class="rule-word" title="'+(keywords[term]||statuses[term])+'">'+term+'</b>');
}
const statusIcon={'破綻':'exposed','氣短':'weak','勁力':'strength','守勁':'defence'};
export function activeStates(actor){
 return [['破綻',actor.exposed,' 回合'],['氣短',actor.weak,' 回合'],['勁力',actor.strength,''],['守勁',actor.dexterity,'']]
 .filter(([,value])=>value>0).map(([name,value,unit])=>'<span class="state-mark" title="'+statuses[name]+'">'+glyph(statusIcon[name])+name+' '+Number(value)+unit+'</span>');
}

export function glyph(name){
 const src=supportArt('journey-'+name);
 return '<img class="jp-icon" width="18" height="18" alt="" src="'+src+'">';
}
