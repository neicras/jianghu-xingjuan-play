// Each plane has its own world position. It passes the eye once as the traveller moves downstream.
export const props=['sampan','tea-cart','escort-cart','fishing-net','willow','sailcloth','clerk','grain','reeds','signal'];
const rooms=[['sampan','tea-cart','escort-cart'],['sampan','sailcloth','escort-cart'],['clerk','grain']];
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>n*n*(3-2*n);
const random=n=>{const u=Math.sin(n*127.1+31.7)*43758.55;return u-Math.floor(u)};

function bankAt(worlds,depth){
 let centre=worlds[0].c;
 for(let i=0;i<worlds.length-1;i++){
  const w=worlds[i],t=smooth(clamp((depth-w.gate+10.7)/9.4));
  centre+=(worlds[i+1].c-w.c)*t;
 }
 return centre;
}
export function passageLayers(s,add){
 const {worlds,z}=s;if(!worlds.length)return;
 for(let row=Math.max(0,Math.floor((z-.8)/1.85));row<(z+36)/1.85;row++){
  const Z=1.25+row*1.85,side=row%2?-1:1,centre=bankAt(worlds,Z);
  // The banks open out near a decision, leaving the three rewards legible.
  let opening=0,section=0;
  for(const w of worlds){
   opening=Math.max(opening,clamp(1-Math.abs(Z-w.gate)/7.0));
   if(Z>=w.gate-17)section=w.i;
  }
  const lane=1.24+opening*4.45+random(row)*.46;
  const X=centre+side*lane;
  const sway=Math.sin(s.time*1.7+row)*.035;
  if(row%4!==2)add('reeds',X,Z,.94+random(row+24)*.7,0,1.32+random(row+5)*.75,side>0,true);
  // Overhangs break across the middle at different heights and leave irregular windows to the light.
  const type=(row+section)%6;
  const overhead=type===0?'sailcloth':type===2||type===5?'fishing-net':'willow';
  const w=overhead==='sailcloth'?4.85:3.5+random(row+2);
  const bottom=2.64+opening*.85+random(row+15)*.44;
  add(overhead,centre+side*(lane+.26)+sway,Z+.71,w,bottom,w*(overhead==='sailcloth'?.51:.68),side>0,true);
  if(row%4===1){
   // A thin object at eye level sweeps out sooner than the next broad curtain.
   add('signal',centre+side*(.8+opening*3.9)+sway,Z+1.18,.51,1.8+opening*.45,1.4,false);
  }
  if(row%3===0){
   const opposite=centre-side*(lane+.75);
   add(section===2?'grain':section===0?'fishing-net':'reeds',opposite,Z+1.31,2.05,
    section===0?1.13:0,1.8,side<0,true);
  }
 }
}
export function destination(s,w,d,add){
 if(d.art){
  const sprite=s.inks?.[d.art], height=d.type==='boss'?3.65:d.art.startsWith('way-')?2.95:2.7;
  if(sprite)add(d.art,d.x,d.z,height*sprite.width/sprite.height,0,height,false);
  if(d.type==='elite2'||d.type==='convoy')add(d.type==='elite2'?'way-white-fiend':'way-iron-guard',d.x+.8,d.z+1.5,1.65,0,2.7,true);
  if(d.type==='inn')add('sailcloth',d.x+.25,d.z+1,3.4,1.8,1.85,false);
  if(d.type==='boss')add('gate-shrine',d.x,d.z+2,4.5,0,4.5,false);
  return;
 }
 const id=rooms[w.i][d.j],Z=d.z;
 // Approach the working prop and pass beside it. Its silhouette is the destination.
 const width=id==='clerk'?2.65:id==='sailcloth'?3.3:3.12;
 const height=id==='sampan'?2.4:id==='grain'?2.25:2.82;
 add(id,d.x+.12,Z,width,0,height,false);
 if(w.i===2&&d.j===1)add('sampan',d.x+.65,Z+1.8,3.85,0,2.7,true);
 if(w.i===1&&d.j===1)add('signal',d.x,Z-.16,.55,1.05,1.45,false);
 if(w.i===1&&d.j===1)add('sampan',d.x+.35,Z+1.6,2.5,0,1.65,true);
 if(w.i===0&&d.j===1)add('sailcloth',d.x+.25,Z+1,3.4,1.75,1.85,false);
}
