import {supportArt} from './art-library/support-files.js';

export const stages={
 court:{name:'焚天壇'},
 wharf:{name:'晨霧渡口',plate:'duel-wharf',near:'wharf-reeds'},
 bamboo:{name:'風過竹關',plate:'duel-bamboo',near:'bamboo-branches'}
};
const cache=new Map();
async function image(id){
 const im=new Image();im.src=supportArt(id);await im.decode();return im;
}
export function scenery(id){
 if(!Object.hasOwn(stages,id)||!stages[id].plate)return null;
 if(!cache.has(id)){
  const {plate,near}=stages[id];
  cache.set(id,Promise.all([image(plate),image(near)])
   .then(([back,front])=>({id,back,front,midground,foreground}))
   .catch(error=>{cache.delete(id);throw error}));
 }
 return cache.get(id);
}
function midground(ctx,phase,cam){
 ctx.save();
 if(this.id==='wharf'){
  // Ripples belong to the water band between the far bank and the pier.
  ctx.fillStyle='#f5ca92';
  for(let i=0;i<15;i++){
   const x=320+(i*117)%770+4*Math.sin(phase+i)-cam*20,y=304+(i*29)%90;
   const light=(1+Math.sin(phase+i*2.6))*.5;
   ctx.globalAlpha=.34*light;
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+6+16*light,y-1);ctx.lineTo(x+4,y+1);ctx.fill();
  }
 }else{
  for(let i=0;i<7;i++){
   const u=(phase/(2*Math.PI)+i/7)%1;
   ctx.save();ctx.translate(30+((i*149)%540)+520*u-cam*30,128+i%3*32+290*u+16*Math.sin(phase+i));
   ctx.rotate(phase+i);ctx.globalAlpha=.8*Math.sin(Math.PI*u);
   ctx.fillStyle=i%2?'#77774b':'#b58a54';
   ctx.beginPath();ctx.moveTo(-8,0);ctx.quadraticCurveTo(0,-4,8,0);ctx.quadraticCurveTo(0,3,-8,0);ctx.fill();ctx.restore();
  }
 }
 ctx.restore();
}
function foreground(ctx,phase,cam,duel){
 const im=this.front,top=this.id==='bamboo';
 const inset=Math.min(88,(duel?.lanternInset||0));
 for(let i=0;i<2;i++){
  ctx.save();
  const w=1248,half=w/2,edge=i?w-24:-24;
  ctx.translate(edge-cam*72+(i?-1:1)*inset,top?(duel?.lanternDrop||0):750);
  ctx.scale(Math.min(.76,1.35/(duel?.stageAspect||1.6)),.78);
  ctx.rotate(Math.sin(phase+i*1.6)*(top ? .014 : .019));
  ctx.drawImage(im,i*im.width/2,0,im.width/2,im.height,i?-half:0,top?-6:-750,half,756);
  ctx.restore();
 }
}
