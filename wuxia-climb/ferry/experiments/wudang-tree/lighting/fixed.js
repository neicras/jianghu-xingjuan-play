// The sprites already contain the directional light. Keep only the floor wash
// and one quarter-size silhouette sheet per visible actor for projected shadows.
const settings={
 court:{x:180,ambient:'#28122552',air:'#ff97384a',floor:'#ffbd6347'},
 wharf:{x:990,ambient:'#292d481a',air:'#ffe6bc43',floor:'#fff0c23a'},
 bamboo:{x:370,ambient:'#192f3430',air:'#c5dc9f33',floor:'#dfefad34'}
};
function pool(ctx,x,y,rx,ry,color){
 ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);
 const g=ctx.createRadialGradient(0,0,0,0,0,1);
 g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();
}
export function fixedLight(stage,scene){
 const {x,ambient,air,floor}=settings[stage]||settings.court;
 const wash=document.createElement('canvas');wash.width=600;wash.height=375;
 const paint=wash.getContext('2d');paint.scale(.5,.5);
 pool(paint,x,145,710,560,air);pool(paint,x*.79+128,615,550,84,floor);
 const silhouettes=new Map();
 return {
  ground(ctx,t,cam){
   ctx.save();ctx.fillStyle=ambient;ctx.fillRect(-60,-30,1320,820);
   ctx.globalCompositeOperation='screen';ctx.drawImage(wash,-cam*16-8,0,1216,750);ctx.restore();
  },
  castShadow(ctx,p){
   const [w,h]=scene.m.cell,[cols]=scene.m.grid,img=scene.images[p.id];
   let mask=silhouettes.get(img);
   if(!mask){
    mask=document.createElement('canvas');mask.width=Math.ceil(img.width/4);mask.height=Math.ceil(img.height/4);
    const pen=mask.getContext('2d');pen.drawImage(img,0,0,mask.width,mask.height);
    pen.globalCompositeOperation='source-in';pen.fillStyle='#21142c';pen.fillRect(0,0,mask.width,mask.height);
    silhouettes.set(img,mask);
   }
   const sx=mask.width/img.width,sy=mask.height/img.height;
   const slant=Math.max(-1.45,Math.min(1.45,(p.x-x)/430));
   ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.scale,p.scale);ctx.transform(.92,.015,-slant*.49,-.20,0,0);ctx.globalAlpha=.39;
   ctx.drawImage(mask,(p.step%cols)*w*sx,Math.floor(p.step/cols)*h*sy,w*sx,h*sy,-scene.m.pivot[0],-scene.m.pivot[1],w,h);
   ctx.restore();
  }
 };
}
