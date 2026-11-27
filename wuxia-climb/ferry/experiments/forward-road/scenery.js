import {passageLayers,destination} from './passage.js?map=2';
import {tone,riverSurface,plankSurface} from "./inks.js";
// Each cutout is anchored to a fixed world depth. Solid doorways have front, inner and side faces.
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
const hash=n=>{const a=Math.sin(n*127.1+311.7)*43758.55;return a-Math.floor(a)};
const gray=v=>'rgb('+v+' '+v+' '+Math.max(0,v-2)+')';
const bambooCache=new Map();
function bamboo(seed){
 if(bambooCache.has(seed))return bambooCache.get(seed);
 const paths=[];
 for(let t=0;t<4;t++){
  const lean=(hash(seed+t)-.5)*2,base=(t-1.5)*.32,ht=4+hash(seed+t+9)*3;
  paths.push([[base-.07,0],[base+.08,0],[base+lean+.025,ht],[base+lean-.025,ht]]);
  for(let k=2;k<7;k++){
   const v=k/8,c=base+lean*v,y=ht*v,sgn=(k+t)%2?1:-1;
   paths.push([[c,y],[c+sgn*.56,y+.41],[c+sgn*.98,y+.46],[c+sgn*.42,y+.32]]);
   for(let n=0;n<3;n++){const a=c+sgn*(.27+n*.19),b=y+.19+n*.1;
    paths.push([[a,b],[a+sgn*.28,b+.04],[a+sgn*(.54+n*.05),b-.22],[a+sgn*.23,b-.1]])}
  }
 }
 bambooCache.set(seed,paths);return paths;
}
export function paint(g,s){
 const {W,H,z,x,project,inks}=s;
 const coloured=Boolean(inks);let material='stone';
 const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#92928f');sky.addColorStop(.48,'#e8e7df');sky.addColorStop(1,'#a4a49e');g.fillStyle=sky;g.fillRect(0,0,W,H);
 function path(points,fill,stroke,lw=1){
  g.beginPath();points.forEach(([a,b],i)=>i?g.lineTo(a,b):g.moveTo(a,b));g.closePath();if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.lineWidth=lw;g.strokeStyle=stroke;g.stroke()}
 }
 // Distant ridges overlap with progressively stronger edges, all in world space.
 if(inks?.valley){
  const w=Math.max(W*1.12,H*1.5),h=Math.max(H*.69,w*.34),drift=-x*s.F/165;
  g.drawImage(inks.valley,(W-w)/2+drift,s.hz-h*.66,w,h);
 }else for(let layer=0;layer<5;layer++){
  const depth=370-layer*50;
  const pts=[];for(let i=-32;i<=32;i++){const X=i*7;const a=hash(i+20*layer);
   const y=9+Math.sin(i*.52+layer)*5+Math.cos(i*.29-layer)*5+a*5+(4-layer)*1.3;
   pts.push(project(X,y,depth))}
  path([...pts,[W,H],[0,H]],gray(195-layer*13));
 }
 // Distant granary on a high bluff.
 const landmarkZ=99;
 function cut(cx,cz,pts,fill,line){path(pts.map(([a,b])=>project(cx+a,b,cz)),fill,line)}
 const granary=coloured?tone("wood",120):gray(113);
 if(!inks?.valley||s.st>=2)for(let i=-1;i<=1;i++){const Y=i===0?8:6;cut(2+i*3.7,landmarkZ,[[ -1.5,2],[1.5,2],[1.5,Y],[-1.5,Y]],granary);cut(2+i*3.7,landmarkZ-.1,[[-2.4,Y-.2],[-1.3,Y+.4],[-.35,Y+1.45],[.4,Y+1.45],[1.45,Y+.38],[2.35,Y-.18],[0,Y+.05]],coloured?tone("wood",75):gray(91))}
 const ground=g.createLinearGradient(0,s.hz,0,H);if(coloured){
  ground.addColorStop(0,'#c9af8600');ground.addColorStop(.15,'#9b9a86');ground.addColorStop(.51,'#656e67');ground.addColorStop(1,'#342e43');
 }else{ground.addColorStop(0,'#b8b8b1');ground.addColorStop(1,'#555550')}
 g.fillStyle=ground;g.fillRect(0,s.hz+2,W,H-s.hz);
 const bed=s.st>=3?inks?.earth:inks?.water;
 if(bed)riverSurface(g,s,bed);
 if(coloured&&!bed){for(let i=0;i<130;i++){
   const Z=2+i*.8;if(Z<z+.45)continue;const cx=(hash(i+81)-.5)*33;
   const len=.18+hash(i+42)*1.65;
   path([[cx,0,Z],[cx+len,.01,Z+.025],[cx+len*1.2,0,Z+.09],[cx+.04,0,Z+.057]].map(v=>project(...v)),i%4===0?'#e1b984':'#72796d');
 }}
 const list=[];
 function face(pts,shade,edge=false){
  // Clip against the near plane so the arch passes overhead as the player crosses it.
  const clipped=[];let old=pts.at(-1);const near=z+.28;
  for(const p of pts){if((p[2]>near)!==(old[2]>near)){const t=(near-old[2])/(p[2]-old[2]);clipped.push([old[0]+(p[0]-old[0])*t,old[1]+(p[1]-old[1])*t,near])}if(p[2]>near)clipped.push(p);old=p}
  if(clipped.length<3)return;
  const zz=clipped.reduce((n,a)=>n+a[2],0)/clipped.length;
  const tint=Math.round(shade+(168-shade)*clamp((zz-z-4)/85,0,.82));
  const surface=material;
  list.push({zz,draw:()=>path(clipped.map(a=>project(...a)),coloured?tone(surface,tint):gray(tint),edge?(coloured?tone(surface,tint-55):gray(Math.max(25,tint-28))):null,Math.max(.55,s.F/1050))});
 }
 function paper(cx,cz,points,shade,edge){face(points.map(([a,b])=>[cx+a,b,cz]),shade,edge)}
 function block(cx,y,cz,w,h,len,shade){
  const L=cx-w/2,R=cx+w/2,A=cz-len/2,B=cz+len/2;
  face([[L,y,A],[L,y,B],[L,y+h,B],[L,y+h,A]],shade-21);
  face([[R,y,B],[R,y,A],[R,y+h,A],[R,y+h,B]],shade-14);
  face([[L,y+h,A],[L,y+h,B],[R,y+h,B],[R,y+h,A]],shade+20);
  face([[L,y,A],[R,y,A],[R,y+h,A],[L,y+h,A]],shade,true);
 }
 // Stone causeway fans out from the traveller's previous choice. Individual slabs show forward speed.
 for(const w of s.worlds){
  for(const d of w.doors){for(let i=0;i<19;i++){
   const a=w.gate-20+i*1.25,b=a+1.18;if(b<=z+.28)continue;
   const center=Z=>w.c+(d.x-w.c)*clamp((Z-w.gate+16)/13,0,1);
   const ca=center(a),cb=center(b),half=.78+Math.max(0,(w.gate-a)/60);
   material=w.i===0?'wood':'slab';
   if(coloured){
    const v=(i%5)*.05;
    face([[ca-half,-.005,a+.06],[ca+half,-.005,a+.055],[ca+half-.1,-.005,a+.12],[ca-half+.02,-.005,a+.13]],175);
    face([[ca-half+.15,-.002,a+.34],[ca+.23+v,-.002,a+.47],[ca+.18+v,-.002,a+.5],[ca-half+.14,-.002,a+.39]],92);
   }
   face([[ca-half,-.015,a],[cb-half,-.015,b],[cb+half,-.015,b],[ca+half,-.015,a]],133+(i%3)*5,true);
   const tile=w.i===0?inks?.plank:inks?.stone;
   if(tile&&a>z+.32)list.push({zz:(a+b)/2-.001,draw:()=>plankSurface(g,s,tile,[[ca-half,0,a],[ca+half,0,a]],[[cb-half,0,b],[cb+half,0,b]],i+3*d.j)});
  }}
 }
 // Layers alternate between cliff, reeds, bamboo and timber rails at fixed distances.
 for(let row=Math.max(-1,Math.floor((z-7)/4));row<Math.ceil((z+61)/4);row++){
  const Z=row*4+2;
  let axis=0;for(const w of s.worlds)if(w.gate-18<Z)axis=w.c;
  for(const sign of [-1,1]){
   const seed=row*5+sign,side=axis+sign*(6+1.8*hash(seed)),cz=Z+hash(seed+2)*1.5;
   if(cz<=z+.35)continue;
   const h=1.4+hash(seed+8)*4.4,rock=[[-.15,-.1],[-.3,h*.24],[.46,h*.55],[.7,h*.83],[1.6,h],[2.5,h*.88],[3.7,h*1.03],[5,h*.72],[7,h*.8],[10,0]].map(([a,b])=>[sign*a,b]);
   material="stone";paper(side,cz,rock,65+hash(seed)*32,true);
   if(coloured){
    paper(side,cz-.025,[[.62,h*.56],[1.65,h*.9],[3,h*.82],[1.4,h*.7]].map(([a,b])=>[sign*a,b]),129);
    paper(side,cz-.04,[[.3,h*.35],[1.35,h*.58],[2.5,h*.63],[1.12,h*.49]].map(([a,b])=>[sign*a,b]),106);
   }
   material='foliage';if(row%3!==1){for(const shape of bamboo(seed))paper(side+sign*1.1,cz-.32,shape,42+hash(seed)*22)}
   if(row%3===0){block(side-sign*.35,0,cz-.5,.15,1.1,.18,75);paper(side,cz-.78,[[-.48,.73],[.55,.72],[.51,.82],[-.49,.85]],73)}
  }
 }
 // Foreground rigging belongs to the wharf; stone piers and grain banners mark the later crossings.
 for(const w of s.worlds){
  for(let r=0;r<3;r++){
   const Z=w.gate-18+r*6.8;if(Z<=z+.4)continue;
   const C=w.c, ht=5.0+r*.28;
   material=w.i===1?"stone":"wood";
   if(w.i===0){
    for(const side of [-1,1]){
     const base=C+side*(5.5+r*.45);
     material="wood";block(base,0,Z,.24,ht+1,.28,57);
     const rope=[];for(let n=0;n<=12;n++){const u=n/12;rope.push([base+(C-base)*u,ht+.64-.99*Math.sin(u*Math.PI/2),Z])}
     face([...rope,...[...rope].reverse().map(([a,b,c])=>[a,b+.055,c])],49);
     const flagX=base+(C-base)*.47,flagY=ht;
     material="cloth";paper(flagX,Z-.1,[[-.34,flagY],[.38,flagY-.08],[.25,flagY-.83],[-.08,flagY-.69],[-.4,flagY-.92]],80+r*7);
    }
   }else if(w.i===1){
    for(const side of [-1,1]){
     const base=C+side*5.6;block(base,0,Z,.52,1.38,.62,80);
     block(base,1.38,Z,.66,.14,.74,130);
     if(r<2)block(base,.7,Z+3.4,.17,.28,6.8,105);
    }
    if(r===1){paper(C,Z,[[-5.7,0],[-5.7,5.3],[-4.5,6.2],[-3,6.8],[0,7.1],[3,6.8],[4.5,6.2],[5.7,5.3],[5.7,0],[5.05,0],[5.05,4.5],[4,5.5],[2.7,6.1],[0,6.45],[-2.7,6.1],[-4,5.5],[-5.05,4.5],[-5.05,0]],90,true)}
   }else{for(const side of [-1,1]){
    const base=C+side*(4.8+r*.45);block(base,0,Z,.23,6.3,.3,65);
    paper(base,Z-.12,[[0,6.18],[side*1.65,6.03],[side*1.36,5.1],[side*1.56,4.3],[side*.8,4.49],[0,4.31]],84+r*6,true);
   }}
  }
 }
 function place(id,cx,depth,width,base,height,flip,scenic=false){
  const ahead=depth-z,band=ahead<5?"near":ahead<16?"mid":"far";
  const edge=band==="near"?5:16;
  const blend=scenic&&band!=="far"?clamp(1-(edge-ahead)/1.4,0,1):0;
  const other=blend?inks?.[id+"-"+(band==="near"?"mid":"far")]:null;
  const img=(scenic&&inks?.[id+"-"+band])||inks?.[id];if(!img||depth<=z+.35||depth>z+57)return;
  const [px,py,k]=project(cx,base,depth),ww=k*width,hh=k*height;
  if(px+ww/2<0||px-ww/2>W||py<0||py-hh>H)return;
  list.push({zz:depth,draw:()=>{
   g.save();g.translate(px,py);if(flip)g.scale(-1,1);
   g.drawImage(img,-ww/2,-hh,ww,hh);if(other){g.globalAlpha=blend;g.drawImage(other,-ww/2,-hh,ww,hh)}g.restore();
  }});
 }
 if(inks)passageLayers(s,place);
 function gate(d,w){
  const X=d.x,Z=d.z;if(Z+1<z)return;
  if(inks?.sampan&&inks?.clerk&&inks?.['escort-cart']&&inks?.['tea-cart']&&inks?.grain){destination(s,w,d,place);return}
  const facade=inks?.['gate-'+d.kind];
  if(facade){
   const width=3.83,height=d.kind==='shrine'?4.88:4.48;
   // Slice thickness sits behind the painted frame. The clear aperture remains traversable.
   for(const [offset,layer] of [[.54,inks['gate-'+d.kind+'-side']],[.19,inks['gate-'+d.kind+'-side']],[-.22,facade]]){
    const zz=Z+offset;if(zz<=z+.26)continue;
    list.push({zz,draw:()=>{const [px,py,k]=project(X,0,zz);g.drawImage(layer,px-width*k/2,py-height*k,width*k,height*k)}});
   }
   return;
  }
  const hi=s.choice&&w.i===s.st&&d.j===s.focusIndex, ink=hi?54:70;
  // Three recognisable portals share walkable negative space down the middle.
  const roof=d.kind==='shrine'?4.9:d.kind==='inn'?4.3:4;
  for(const side of [-1,1]){block(X+side*1.36,0,Z,.23,3.5,1,ink);block(X+side*1.36,0,Z-.08,.38,.31,1.1,103)}
  block(X,3.18,Z,3.05,.23,1.05,ink);
  if(d.kind==='inn'||d.kind==='shrine'){
   const p=[[-1.8,3.28],[-1.52,3.56],[-.72,3.77],[0,roof],[.71,3.77],[1.5,3.56],[1.82,3.3],[1.42,3.36],[0,roof-.47],[-1.45,3.37]];
   paper(X,Z+.48,p,94);face([[X-1.78,3.32,Z-.47],[X,roof,Z-.47],[X,roof,Z+.5],[X-1.78,3.32,Z+.5]],104,true);paper(X,Z-.49,p,ink-14,true);
   for(const a of [-1.02,1.02])paper(X+a,Z-.55,[[-.08,3.38],[-.06,3.13],[-.19,3.03],[-.18,2.77],[0,2.67],[.18,2.77],[.19,3.03],[.06,3.14],[.08,3.38]],156,true);
  }else if(d.kind==='fight'){
   block(X-.98,0,Z,.09,4.55,.12,55);paper(X-.96,Z-.1,[[0,4.5],[1.68,4.32],[1.29,4.04],[1.54,3.78],[0,3.96]],ink-12,true);
   paper(X,Z-.55,[[-1.54,3.26],[-1.6,3.62],[0,3.43],[1.6,3.62],[1.54,3.26]],90,true);
  }else{
   paper(X,Z-.51,[[-1.55,3.29],[-1.69,3.72],[-.65,3.46],[.65,3.46],[1.69,3.72],[1.55,3.29],[0,3.13]],ink-18,true);
   for(let a=-1;a<=1;a++)paper(X+a*.58,Z-.53,[[-.08,3.3],[.18,3.3],[.06,2.96]],150);
  }
 }
 for(const w of s.worlds)for(const d of w.doors)gate(d,w);
 list.sort((a,b)=>b.zz-a.zz);for(const item of list)item.draw();
 // A very mild vignette keeps the choices lighter than the nearest scenery.
 const v=g.createRadialGradient(W*.5,H*.46,Math.min(W,H)*.25,W*.5,H*.46,Math.max(W,H)*.72);v.addColorStop(0,'#13131300');v.addColorStop(1,'#13131355');g.fillStyle=v;g.fillRect(0,0,W,H);
}
