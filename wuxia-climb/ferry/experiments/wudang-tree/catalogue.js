// Names and ranks follow the existing Taiwu Wudang index. Dependencies, costs and
// card effects are the prototype's design. Brackets contain base and refined values.
import {cardFiles} from './art-library/card-files.js';
const groups = [
  ["內功","內功","inner",[
    [9,"武當太和功","本場武當招式每擊額外造成 [2|3] 點傷害。"],
    [8,"抱元守一","獲得 [3|6] 點護體，下回合多得 1 點內力。"],
    [7,"一字混元樁","本場每回合首次打出護體牌，額外獲得 [2|3] 點護體。"],
    [6,"羅天真訣十二樁","抽 [2|3] 張牌，選一張手牌保留。"],
    [5,"洗髓金經","回復 [4|6] 點氣血。消耗。"],
    [4,"武當混元功","本場每次打出內功牌，下一張攻擊多造成 [3|5] 點傷害。"],
    [3,"太乙神功","獲得 [2|3] 點內力。消耗。"],
    [2,"純陽無極功","本場每回合首張劍法多造成 [5|7] 點傷害。"],
    [1,"元始先天功","往後每回合開始時，加 1 內力並獲得 [3|5] 點護體。",2]
  ]],
  ["輕功","身法","step",[
    [9,"五步梅花樁","獲得 [4|6] 點護體。若以護體擋盡下一擊，下回合多抽一張。"],
    [8,"八卦步","獲得 [2|5] 點護體。可棄一張牌，再抽一張。",0],
    [7,"雲環步","抽 [1|2] 張牌，獲得 3 點護體。"],
    [6,"天罡北斗步","獲得 [3|5] 點護體，剩餘護體延至下回合。"],
    [5,"太乙九宮步","抽 [2|3] 張牌，可選一張手牌保留。"],
    [4,"上天梯","下回合多抽 [1|2] 張牌，並多得 1 點內力。"],
    [3,"凌雲飛渡","令目標氣短兩回合（每擊減四分之一），並抽 [1|2] 張牌。",2]
  ]],
  ["護體","護體","guard",[
    [9,"武當鐵布衫","獲得 [7|10] 點護體。本回合首次擋盡一擊，還擊 4 點。出牌時若有多名對手，還擊 8 點。"],
    [7,"雲床九練","獲得 [7|10] 點護體，剩餘護體延至下回合。"],
    [5,"五氣朝元功","獲得 [8|11] 點護體；若收勢時未失氣血，下回合多抽一張。"],
    [3,"無極勁","獲得 [10|14] 點護體；本回合首次擋盡一擊時還擊 6 點。",2]
  ]],
  ["奇竅","奇竅","formation",[
    [8,"三才劍陣","本場每回合打出第三張劍法後，獲得 [6|9] 點護體。"],
    [6,"陰陽周天法","本場每回合出過護體牌後，首次攻擊抽 [1|2] 張牌。"],
    [4,"真武蕩魔陣","本回合往後每出一張武當牌，對所選敵人造成 [3|4] 點傷害。"],
    [2,"三華聚頂","本場每回合首次打齊三類武功時，回復 [1|2] 點內力。"]
  ]],
  ["摧破","拳掌","palm",[
    [9,"武當長拳","造成 [6|9] 點傷害，再加上回合擋下的傷害（最多加 4 點），獲得 1 點護體。"],
    [8,"追風雲環掌","連打兩掌，每掌造成 [3|4] 點傷害。"],
    [7,"武當綿掌","穿過護體，直接扣除對手 [6|8] 點氣血。"],
    [6,"遊身八卦掌","造成 [7|10] 點傷害；若本回合用過輕功，抽一張牌。"],
    [5,"太乙逍遙掌","造成 [8|11] 點傷害。下張輕功少耗 1 點內力。"],
    [4,"玄功神拳","造成 [10|13] 點傷害。手上每張內功牌另加 2 點。"],
    [3,"武當純陽拳","造成 [12|16] 點傷害，下一掌多造成 3 點傷害。",2],
    [2,"紫陽正氣拳","造成 [13|17] 點傷害，並獲得 6 點護體。",2],
    [1,"太極拳","造成 [7|10] 點傷害，再加上回合實際擋下的傷害，最多加 8 點。"]
  ]],
  ["摧破","劍法","sword",[
    [9,"武當丹劍","造成 6 點傷害。若本回合已出護體牌，改為 [11|14] 點。"],
    [8,"武當逍遙劍","造成 [7|10] 點傷害；可選另一張手牌保留。"],
    [7,"白虹劍法","連刺兩劍，每劍 [3|4] 點。若本回合已出劍法，每劍另加 3 點。"],
    [6,"太乙玄門劍","造成 [9|12] 點傷害，下一張內功少耗 1 點內力。"],
    [5,"純陽劍意","本場每一劍多造成 [2|3] 點傷害。"],
    [4,"真武遊龍劍","連刺三劍，每劍 [3|4] 點。",2],
    [3,"太極劍法","造成 [9|12] 點傷害，獲得 6 點護體。",2],
    [2,"先天少陽劍氣","穿過護體，直接扣除對手 [12|16] 點氣血。",2],
    [1,"無極劍式","造成 [15|19] 點傷害；本回合每出過一張劍法，另加 3 點。",2]
  ]],
  ["摧破","軟兵","whisk",[
    [9,"拂塵功","造成 [4|6] 點傷害，獲得 3 點護體。"],
    [8,"武當鐵拂塵","打去對手 [5|8] 點護體，再造成 4 點傷害。"],
    [7,"兩儀拂塵功","造成 [6|9] 點傷害；對手有護體時，抽一張牌。"],
    [6,"老君拂塵功","獲得 [6|9] 點護體，令對手下一擊少打 2 點。"],
    [5,"錯倒陰陽拂塵","卸去對手 [7|10] 點護體，自己獲得等量護體。"],
    [4,"太乙雲拂功","連掃兩次，每次造成 [5|7] 點傷害。",2],
    [3,"無量掃塵功","對所有對手造成 [10|14] 點傷害。",2],
    [2,"玄空神拂","卸去所有敵方護體，再造成 [12|16] 點傷害。",2]
  ]]
];
export const ranks="〇一二三四五六七八九";
export const arts=groups.flatMap(([category,branch,art,rows])=>rows.map(([rank,name,rule,cost=1],i)=>({
  name,rank,category,branch,rule,cost,
  parent:i?rows[i-1][1]:branch==="奇竅"?"武當太和功":null,
  need:rank>=7?2:rank>=4?3:4,
  image:cardFiles[art+"-"+rank]
})));
export const branches=groups.map(g=>g[1]);
export const basics=[
  ["一線穿雲","劍法","strike",1,"造成 [6|9] 點傷害。",3],
  ["橫劍當胸","護體","guard",1,"獲得 [5|8] 點護體。",3],
  ["連環劍","劍法","twin",1,"連打兩劍，每劍 [4|5] 點。",2],
  ["吐納","內功","breath",0,"抽 [2|3] 張牌。",1],
  ["踏浪步","輕功","step",1,"令目標露出破綻 [1|2] 回合，期間受到的攻擊增加一半。",1]
].map(([name,branch,img,cost,rule,copies])=>({name,branch,cost,rule,copies,image:cardFiles["basic-"+img]}));
export const injuries=[
 {name:'劍傷',branch:'傷勢',cost:null,image:cardFiles['injury-wound'],rule:'無法打出。洗牌後仍會抽到。',tags:['無法打出']},
 {name:'岔氣',branch:'傷勢',cost:null,image:cardFiles['injury-qi'],rule:'無法打出。虛無。',tags:['無法打出','虛無']}
];
export const byName=new Map([...arts,...basics,...injuries].map(a=>[a.name,a]));
// These traits are shared by the card face, draw/discard rules and balance audit.
const traits={
 起手:['吐納','五步梅花樁','抱元守一'],
 保留:['踏浪步','武當丹劍','武當鐵布衫','太極拳','武當綿掌','武當鐵拂塵'],
 虛無:['太乙神功','無極劍式'],
 消耗:['吐納','洗髓金經','太乙神功'],
 運功:['武當太和功','一字混元樁','武當混元功','純陽無極功','元始先天功','三才劍陣','陰陽周天法','三華聚頂','純陽劍意'],
 穿勁:['武當綿掌','先天少陽劍氣'],
};
export function hasKeyword(card,term){
 if(traits[term]?.includes(card.name))return true;
 if(card.star&&term==='保留'&&card.name==='橫劍當胸')return true;
 return byName.get(card.name)?.tags?.includes(term)||false;
}
export function effect(a,star=false,showChanges=false){
 const change=text=>showChanges?'<mark class="upgrade-change">'+text+'</mark>':text;
 let text=a.rule.replace(/\[(\d+)\|(\d+)\]/g,(_,x,y)=>star&&x!==y?change(y):x);
 if(star&&a.name==='八卦步')text+='換走的傷勢牌'+change('消耗')+'。';
 const card={name:a.name,star};
 const labels=Object.keys(traits).filter(term=>hasKeyword(card,term)&&!text.includes(term));
 if(labels.length)text=labels.map(term=>star&&!hasKeyword({...card,star:false},term)?change(term):term).join('、')+'。'+text;
 return text;
}
