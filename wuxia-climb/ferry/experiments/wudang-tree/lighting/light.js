// R/G encode a relief normal inferred from painted value and silhouette. B is
// blade coverage along the registered wrist-to-tip segment. Neither needs 3D geometry.
function surface(w,h){
 const c=document.createElement('canvas');c.width=w;c.height=h;return c;
}
function readCell(image,x,y,w,h){
 const ctx=surface(w,h).getContext('2d',{willReadFrequently:true});
 ctx.drawImage(image,x,y,w,h,0,0,w,h);
 return ctx.getImageData(0,0,w,h);
}
function fade(ctx,x,y,rx,ry,stops){
 ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);
 const paint=ctx.createRadialGradient(0,0,0,0,0,1);
 for(const [at,color] of stops)paint.addColorStop(at,color);
 ctx.fillStyle=paint;ctx.fillRect(-1,-1,2,2);ctx.restore();
}
export async function lightingFor(scene){
 const cells={},[w,h]=scene.m.cell;
 await Promise.all(['traveller','assassin'].map(async id=>{
  const relief=new Image();relief.src=new URL(id+'-relief.webp',import.meta.url);await relief.decode();
  cells[id]=scene.m.actors[id].weaponWristAndTip.map(([start,end],i)=>{
   const x=i%scene.m.grid[0]*w,y=Math.floor(i/scene.m.grid[0])*h;
   const color=readCell(scene.images[id],x,y,w,h),normal=readCell(relief,x,y,w,h).data;
   const shadow=surface(w,h),ctx=shadow.getContext('2d');
   ctx.putImageData(color,0,0);ctx.globalCompositeOperation='source-in';
   ctx.fillStyle='#21142c';ctx.fillRect(0,0,w,h);
   const vx=end[0]-start[0],vy=end[1]-start[1],length=vx*vx+vy*vy;
   const active=[],nz=new Float32Array(w*h),bladePos=new Float32Array(w*h);
   for(let j=0;j<w*h;j++){
    const k=4*j;if(!color.data[k+3])continue;
    active.push(j);const nx=(normal[k]-128)/127,ny=(normal[k+1]-128)/127;
    nz[j]=Math.sqrt(Math.max(0,1-nx*nx-ny*ny));
    if(normal[k+2])bladePos[j]=((j%w-start[0])*vx+(Math.floor(j/w)-start[1])*vy)/length;
   }
   return {color,normal,shadow,nz,bladePos,active:new Uint32Array(active)};
  });
 }));
 const cache=new Map();
 return {
  mode:'lantern',position:0.22,
  get sourceX(){return -150+1500*this.position},
  ground(ctx,t,cam){
   const warm=this.mode==='lantern',sx=this.sourceX-cam*16;
   ctx.fillStyle=warm?'rgba(40,18,37,.32)':'rgba(19,32,70,.43)';ctx.fillRect(-60,-30,1320,820);
   ctx.globalCompositeOperation='screen';
   fade(ctx,sx,145,710,560,[[0,warm?'#ff97384a':'#accfff36'],[.58,warm?'#d965201e':'#859fdd17'],[1,'#00000000']]);
   fade(ctx,sx*.79+128,615,550,84,[[0,warm?'#ffbd6347':'#b1d7ff40'],[.55,warm?'#f59b4a23':'#88b4ff1a'],[1,'#00000000']]);
   ctx.globalCompositeOperation='source-over';
  },
  castShadow(ctx,p){
   const dx=Math.max(-1.45,Math.min(1.45,(p.x-this.sourceX)/430));
   ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.scale,p.scale);
   ctx.transform(.92,.015,-dx*.49,-.20,0,0);ctx.globalAlpha=.39;
   ctx.drawImage(cells[p.id][p.step].shadow,-scene.m.pivot[0],-scene.m.pivot[1]);ctx.restore();
  },
  cel(p){
   if(p.id==="traveller")this.hand=p.blade[0].map((v,i)=>v*.67+p.blade[1][i]*.33);
   const band=Math.round((this.sourceX-p.x)/60);
   const key=[this.mode,p.id,p.step,band].join('/');
   if(cache.has(key))return cache.get(key);
   const {color,normal,nz,active,bladePos}=cells[p.id][p.step],src=color.data;
   const img=new ImageData(w,h),dst=img.data,warm=this.mode==='lantern';
   const dx=band*60/450,mag=Math.hypot(dx,-.88,.63),lx=dx/mag,ly=-.88/mag,lz=.63/mag;
   const falloff=1/(1+.14*dx*dx),shineAt=.49+.42*lx;
   for(const j of active){
    const k=4*j;
    const n=((normal[k]-128)*lx+(normal[k+1]-128)*ly)/127+nz[j]*lz;
    const diffuse=Math.max(0,n)*falloff;
    const value=src[k]*.28+src[k+1]*.55+src[k+2]*.17;
    const rim=Math.max(0,1-nz[j]*1.8)*Math.max(0,n)**3;
    const lift=(.10*value+9)*diffuse+rim*40;
    const metal=normal[k+2]/255;
    const edge=metal*(23+166*Math.max(0,1-3.3*Math.abs(bladePos[j]-shineAt))**2);
    dst[k]=src[k]*((warm ? .65 : .55)+diffuse*(warm ? .78 : .43))+lift+edge;
    dst[k+1]=src[k+1]*((warm ? .62 : .66)+diffuse*(warm ? .55 : .63))+lift+edge*(warm?.92:1);
    dst[k+2]=src[k+2]*((warm ? .71 : .88)+diffuse*(warm ? .28 : .72))+lift+edge*(warm?.65:1.12);
    dst[k+3]=src[k+3];
   }
   const out=surface(w,h);out.getContext('2d').putImageData(img,0,0);
   if(cache.size>=36)cache.delete(cache.keys().next().value);
   cache.set(key,out);return out;
  }
 };
}
