import {props} from './passage.js';
// Shared material ramps for the cut-paper stage. Values run from carved shadow to lit paper.
const ramps={
 stone:['281e36','514154','938276','c3a185','ead2a4'],
 foliage:['251d32','3e3f41','687457','a0a275','dccc95'],
 wood:['2b1c2e','503141','925841','c68b51','f3cf8a'],
 cloth:['361d31','733544','bd503b','d98653','f4cf8b'],
 slab:['352637','644451','99735e','c39a70','eed3a5'],
 ink:['291d30','4a3345','785d68','b99494','e4c5a3']
};
const palette={};
for(const [material,stops] of Object.entries(ramps)){
 const colours=stops.map(c=>[0,2,4].map(k=>parseInt(c.slice(k,k+2),16)));
 palette[material]=Array.from({length:256},(_,i)=>{
  const u=i*4/255,k=Math.min(3,Math.floor(u));
  return 'rgb('+colours[k].map((v,c)=>Math.round(v+(colours[k+1][c]-v)*(u-k))).join(' ')+')';
 });
}
export function tone(material,shade){return palette[material][Math.min(255,Math.max(0,Math.round(shade)))]}
export function loadInks(redraw,extra=[]){
 const loaded={};
 for(const id of [...extra,...props,'valley','water','plank','stone','earth','gate-ferry','gate-inn','gate-fight','gate-shrine']){
  const img=new Image();img.onload=()=>{
   loaded[id]=img;
   if(['willow','reeds','sailcloth','fishing-net','grain'].includes(id)){
    for(const [variant,ink] of [['near','#26162ac2'],['mid','#49304387'],['far','#95746d91']]){
     const cut=document.createElement('canvas');cut.width=img.width;cut.height=img.height;
     const brush=cut.getContext('2d');brush.drawImage(img,0,0);brush.globalCompositeOperation='source-atop';brush.fillStyle=ink;brush.fillRect(0,0,cut.width,cut.height);
     loaded[id+'-'+variant]=cut;
    }
   }
   if(id.startsWith('gate-')){
    const side=document.createElement('canvas');side.width=img.width;side.height=img.height;
    const g=side.getContext('2d');g.drawImage(img,0,0);g.globalCompositeOperation='source-atop';
    g.fillStyle='#372537cf';g.fillRect(0,0,side.width,side.height);loaded[id+'-side']=side;
   }
   redraw();
  };img.src=new URL('./media/'+id+'.webp',import.meta.url).href;
 }
 return loaded;
}

// Scan horizontal bands of the riverbed in world coordinates, so reflections pass the camera like the wharf.
export function riverSurface(g,s,tile){
 const pattern=g.createPattern(tile,'repeat');
 const step=Math.max(2,Math.round(s.H/145));
 for(let y=Math.ceil(s.hz+s.H*.028);y<s.H;y+=step){
  const distance=2.12*s.F/(y+step*.5-s.hz),pixels=s.F/distance;
  const size=14*pixels/tile.width;
  const originX=s.W/2-s.x*pixels;
  const row=(distance+s.z)/10*tile.height;
  const dy=Math.max(.08,step*10*pixels/(distance*tile.height));
  g.save();g.beginPath();g.rect(0,y,s.W,step);g.clip();
  g.translate(originX,y+row*dy);g.scale(size,-dy);
  g.globalAlpha=Math.max(0,Math.min(.50,(y-s.hz)/(s.H*.24)));
  g.fillStyle=pattern;
  g.fillRect(-originX/size,row-step/dy,s.W/size,step/dy+.1);
  g.restore();
 }
}
export function plankSurface(g,s,tile,near,far,seed){
 const A=s.project(...near[0]),B=s.project(...near[1]),C=s.project(...far[0]),D=s.project(...far[1]);
 const dx=B[0]-A[0],dy=A[1]-C[1];if(dy<1||dx<1)return;
 g.save();g.beginPath();g.moveTo(A[0],A[1]);g.lineTo(B[0],B[1]);g.lineTo(D[0],D[1]);g.lineTo(C[0],C[1]);g.closePath();g.clip();
 const left=Math.min(A[0],C[0]),right=Math.max(B[0],D[0]);
 const slice=tile.height*.45,offset=(seed*.381966%1)*(tile.height-slice);
 const width=tile.width*.72,from=(seed*.618034%1)*(tile.width-width);
 g.globalAlpha=.62;
 if(seed%2){g.translate(left+right,0);g.scale(-1,1)}
 g.drawImage(tile,from,offset,width,slice,left,C[1],right-left,dy);g.restore();
}
