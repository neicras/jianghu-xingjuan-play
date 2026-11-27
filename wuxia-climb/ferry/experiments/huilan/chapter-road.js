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
 5:{kind:'receipt',name:'石生的小渡',text:'石生一手撐篙，一手遞來一張領據。你伸手去接，他的拇指還壓着紙角。「我娘連名字都不會寫。你看，是誰替她簽得這樣端正？」',action:'收好領據，請石生帶路',result:'石生答應陪你到紙坊認印。看門教頭認得他，肯讓你單獨見墨師傅。'},
 10:{kind:'herbalist',name:'藥船夜渡',text:'雙煞的擂台還亮著燈，阿綾的小船已經要開。你替她把藥箱搬上船，她拆開一包傷藥，替你敷在手臂上。',action:'隨藥船過江',result:'阿綾替你敷了藥。雙煞令留在擂上。'}
};
export function confirmCrossing(s){
 const r=s.route,c=crossingFor(r);
 if(r.phase!=='cache'||r.stop?.story!=='crossing'||!c)return false;
 const healed=c.kind==='herbalist'?Math.min(5,r.maxHp-r.hp):0;
 r.hp+=healed;remember(r,c.kind,{healed});r.last=c.result+(healed?' 回復 '+healed+' 氣血。':'');
 r.phase='map';return true;
}

export const stationsPerVolume=15;
export const campaignLength=volumes.length*stationsPerVolume;
export const stationNumber=(r,local=r.floor)=>(chapterOf(r)-1)*stationsPerVolume+local;
export const volumeName=r=>'卷'+'一二三'[chapterOf(r)-1]+' · '+volumes[chapterOf(r)-1];
export const regionsByVolume=[
 ['渡口','竹關','焚天壇'],['水碓','曬紙場','藏契樓'],['鹽道','望火臺','常平倉']
];
export const bossNames=['守壇劍宗','掌契人','鎮倉使'];
export const chapterClose=[
 '劍宗解下腰間的銅印。印底是個庫號，和渡船領據上的一模一樣。「光憑這個，他們會說你偽造。去紙坊看原簿。」',
 '掌契人掀開簿底的夾層。三十七個名字，人人都在下葬後領過銀。最後一筆還沾著新墨，銀車今夜才到常平倉。',
 '鎮倉使終於交出兩把鎖匙。石生照著原簿唱名，阿綾把銀子逐袋過秤。念到石生母親，他停了半晌，親手在她的名字旁按下指印。'
];
const laterCrossings=[
 ['紙商的便舟','紙商揭開船篷，底下是整船等著晾乾的紙。「替我掀好這角，墨跡可別蹭了。」','搭船到曬紙場'],
 ['磨坊歇腳','磨坊主人卸下水輪，留出一席乾草讓你歇腳。','坐下敷藥'],
 ['同行的鹽車','車伕把你讓上車轅。穿過哨卡時，你聽見篷布底下一聲銀錠相碰。','隨車過卡'],
 ['灶房小徑','阿綾從倉後灶房探出頭來，給你留了一碗熱湯和一副膏藥。','從後巷入倉']
];
export function crossingFor(r){
 const base=crossings[r.floor];
 if(chapterOf(r)===1||!base)return base;
 const [name,text,action]=laterCrossings[(chapterOf(r)-2)*2+Number(r.floor===10)];
 return {...base,name,text,action,result:r.floor===10?'敷好藥，從小徑繼續上路。':'避開擂台，隨行人平安過了關。'};
}

// Keep the completed route available on the folio, including runs saved by the one-volume edition.
export function continueVolume(s,choice){
 const r=s.route,v=chapterOf(r);
 if(r.phase!=='won'||r.floor!==stationsPerVolume||v>=volumes.length||!['rest','silver'].includes(choice))return false;
 (r.completedVolumes??=[]).push({volume:v,path:[...r.path],hp:r.hp,maxHp:r.maxHp,wins:s.wins,learned:s.learned.length,choice});
 const heal=Math.min(12,r.maxHp-r.hp);
 if(choice==='rest')r.hp+=heal;else s.gold+=24;
 r.last=choice==='rest'?'歇了一晚，回復 '+heal+' 點氣血。':'收下二十四文盤纏，天未亮便再度動身。';
 r.volume=v+1;r.floor=0;r.path=[];r.phase='map';r.practiceBooks=[];r.free=null;
 for(const key of ['stop','encounter','fightReport','loot','pickedBooks','purchases','tookItem','tookRelic'])delete r[key];
 return true;
}
