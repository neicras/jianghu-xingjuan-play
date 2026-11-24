// Each entry follows one free edge of the ready cel. Coordinates are in its
// 500 × 310 cell: attached x, free x, top, bottom, travel in pixels.
const loops={
 traveller:    [3.6,'披風下襬與帽帶隨風起落',[[216,125,141,255,9],[232,164,47,110,6]]],
 assassin:     [2.6,'蒙眼布兩端輕輕揚起',[[235,375,17,92,10],[322,414,154,242,5]]],
 'iron-guard': [3.9,'紅腰帶在拳架後擺動',[[320,434,160,245,9]]],
 'iron-master':[4.5,'背後重披風慢慢翻起',[[319,443,152,267,9]]],
 'front-scout':[2.3,'束髮短帶迎風輕顫',[[278,316,22,76,7]]],
 'rear-scout': [3.1,'白髮帶在肩後起伏',[[225,297,30,91,8]]],
 'jade-fiend': [3.2,'長辮的辮梢微微上揚',[[208,423,25,95,11]]],
 'white-fiend':[3.4,'兩條白巾交錯擺動',[[230,373,34,110,10]]],
 'altar-master':[4.2,'冠後的白纓緩緩垂落',[[283,347,30,90,8]]]
};
export const idleLabel=id=>loops[id]?.[1]||'候招';
const cache=new WeakMap(),frames=16;
export function idleCel(atlas,id,seconds){
 const profile=loops[id];
 if(!profile)return atlas;
 const [period,,edges]=profile;
 const k=Math.floor((seconds/period%1)*frames);
 let cels=cache.get(atlas);
 if(!cels){cels=[];cache.set(atlas,cels)}
 if(cels[k])return cels[k];
 const cel=document.createElement('canvas');cel.width=500;cel.height=310;
 const ctx=cel.getContext('2d');ctx.drawImage(atlas,0,0,500,310,0,0,500,310);
 for(const [root,tip,top,bottom,amplitude] of edges){
  const left=Math.min(root,tip),end=Math.max(root,tip),height=bottom-top;
  ctx.clearRect(left,top,end-left,height);
  const pad=Math.ceil(height*.24);
  for(let x=left;x<end;x+=2){
   const u=(x-root)/(tip-root),width=Math.min(2,end-x);
   const dy=amplitude*u*u*Math.sin(2*Math.PI*k/frames-u*.85);
   // The attachment and the two outside edges stay fixed. The middle
   // section moves rigidly so the engraved lines keep their weight.
   const a=top+pad,b=bottom-pad;
   ctx.drawImage(atlas,x,top,width,pad,x,top,width,pad+dy);
   ctx.drawImage(atlas,x,a,width,b-a,x,a+dy,width,b-a);
   ctx.drawImage(atlas,x,b,width,pad,x,b+dy,width,pad-dy);
  }
 }
 return cels[k]=cel;
}
