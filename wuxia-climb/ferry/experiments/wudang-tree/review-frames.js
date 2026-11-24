import {newJourney,gift,enter,finishFight,receive,train,leave} from './journey.js?v=1124f';

export const frames=[
 ['gift','餞行席'],['map','江湖路線'],['fight','比武出招'],['reward','戰後所得'],
 ['books','挑選秘笈'],['school','師門請益'],['tree','武當武學譜'],['inn','山腳客棧'],
 ['refine','精練前後'],['shop','山道貨郎'],['story','渡口偶遇'],['deck','我的牌組'],
 ['kit','行囊圖錄'],['won','守壇告捷'],['lost','比武落敗']
];

// Fixed examples used only by the frame viewer. Build rooms with the same
// entry and reward functions as a run, then allow normal interaction in memory.
export function reviewJourney(id,sample){
 // Seed 176 draws all three rank bands through the ordinary fifth-station reward.
 const mixed=id==='books'&&sample==='grades';
 const stepLesson=id==='books'&&sample==='steps';
 const s=newJourney(stepLesson?40:mixed?176:sample==='cave'?2618:2401),r=s.route;
 if(id==='gift')return s;
 gift(s,'sword');
 s.gold=32;s.xp=16;s.bag=['金創藥'];s.relics.push('竹編護臂');
 if((id==='fight'&&sample==='banner')||(id==='story'&&sample==='cave')){
  const banner=sample==='banner';
  r.path=banner?[0,1,1,0,0,1,1]:[0,0,0,0,0];r.floor=r.path.length;s.wins=3;
  enter(s,banner?3:4);return s;
 }
 if(id==='school'&&sample==='advance'){
  r.path=[0,1,1,0,0,1,1,0];r.floor=8;
  enter(s,1);return s;
 }
 if(stepLesson){
  enter(s,0);s.bout.phase='won';finishFight(s);
  receive(s,'八卦步');train(s,'八卦步');leave(s);
  enter(s,0);s.bout.phase='won';finishFight(s);return s;
 }
 if(mixed){s.wins=2;r.bookTables=2}
 const floor=mixed?5:{shop:6,story:2,inn:4,refine:4,school:3,won:15,lost:5}[id]||1;
 r.floor=floor-1;r.path=Array(r.floor).fill(0);r.hp=31;
 if(id==='map'){r.floor=1;r.path=[0];r.last='橋頭比武已過，前路在渡口分岔。';return s}
 if(['deck','kit','tree'].includes(id))return s;
 enter(s,id==='story'?1:0);
 if(['books','reward','won','lost'].includes(id)){
  const lost=id==='lost';
  s.bout.phase=lost?'lost':'won';
  if(id==='won'){s.wins=7;s.bout.hp=9}
  if(lost){s.wins=2;s.bout.hp=0;s.bout.log=['鐵衣堂主出掌，護體抵去 5 點，餘勁耗盡你最後 4 點氣血。']}
  finishFight(s);
 }
 return s;
}
