// The route itself always scrolls natively. Only the painted scenery and paper relief move independently.
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

class RouteLandscape extends HTMLElement {
 mount(trail) {
  if (this.trail === trail) return;
  this.trail = trail;
  this.map = trail.closest('.itinerary');
  this.pieces = [...this.map.querySelectorAll('.fold-place')].map((piece,i)=>({
   piece, anchor:Number(piece.dataset.distance),depth:[.88,.59,.96,.67,.91][i]
  }));
  this.ridges=[...this.map.querySelectorAll('.ridge-place')];
  this.folds=[...trail.querySelectorAll('.paper-fold')];
  this.fringe = [...this.map.querySelectorAll('.scroll-fringe i')];
  this.bookmarks = [...this.map.querySelectorAll('[data-map-region]')];
  this.stamps = [...trail.querySelectorAll('[data-stop]')].map(button => ({
   button, floor: Number(button.dataset.stop.split('/')[0])
  }));
  this.floorCount = trail.querySelectorAll('[data-floor]').length;
  this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
  this.schedule = () => {
   if (!this.frame) this.frame = requestAnimationFrame(() => { this.frame = 0; this.paint(); });
  };
  this.resize = new ResizeObserver(this.schedule);
  this.resize.observe(trail);
  this.resize.observe(trail.firstElementChild);
  this.reduced.addEventListener('change', this.schedule);
  trail.addEventListener('scroll', this.schedule, {passive:true});
  this.schedule();
 }
 paint() {
  const {trail} = this;
  const height = trail.clientHeight, total = trail.scrollHeight;
  if (!height || total <= height) return;
  const top = clamp(trail.scrollTop, 0, total-height);
  const fraction = top/(total-height);
  const distance = 1-fraction;
  const reduce = this.reduced.matches;
  // Keep both ends of the illustration visible even on a short landscape phone.
  const land = trail.parentElement;
  const paperTravel = reduce ? total-height : Math.min((total-height)*.76, Math.max(land.clientWidth*2.85-land.clientHeight, height));
  this.style.height = Math.round(land.clientHeight+paperTravel)+'px';
  this.style.transform = 'translate3d(0,'+(-Math.round(fraction*paperTravel))+'px,0)';
  // Each cutout rises along its own paper hinge, then lays back down at the far edge.
  for(const {piece,anchor,depth} of this.pieces){
   const y=height*.51+(distance-anchor)*(total-height)*(reduce?1:depth);
   const nearCentre=1-clamp(Math.abs(y-height*.52)/(height*.76),0,1);
   piece.style.transform='translate3d(0,'+Math.round(y)+'px,0) translateY(-50%)';
   piece.style.setProperty('--fold',(reduce?0:48*(1-nearCentre)*(1-nearCentre))+'deg');
   piece.style.setProperty('--cast',(reduce?2:2+7*nearCentre)+'px');
  }
  // These distant cutouts drift more slowly than buildings attached to the middle leaves.
  for(const ridge of this.ridges){
   const y=height*.48+(distance-Number(ridge.dataset.distance))*(total-height)*(reduce?1:.47);
   ridge.style.transform='translate3d(0,'+Math.round(y)+'px,0)';
  }
  const viewFloor = this.floorCount + .5 - (top+height*.5)*this.floorCount/total;
  this.folds.forEach((fold,i)=>{
   const offset=clamp((i+1-viewFloor)*total/this.floorCount/height,-1,1);
   fold.style.setProperty('--edge',reduce?'0':String(.14+.48*Math.abs(offset)));
   fold.style.setProperty('--turn',reduce?'0deg':(offset*37)+'deg');
  });
  const area = clamp(Math.floor((viewFloor-1)/5),0,2);
  this.bookmarks.forEach((tab,i) => { if(i===area)tab.setAttribute('aria-current','location');else tab.removeAttribute('aria-current'); });
  for (const {button,floor} of this.stamps) {
   button.classList.toggle('unfolded', !reduce && Math.abs(floor-viewFloor)<.78);
  }
  // Reeds, bamboo and pennants enter and leave from the frame of their own district.
  const centers = [0,.50,1];
  this.fringe.forEach((prop,i) => {
   const delta = distance-centers[i];
   prop.style.opacity = String(reduce ? 0 : .87*clamp(1-Math.abs(delta)/.32,0,1));
   prop.style.transform = 'translate3d(0,'+Math.round(clamp(delta,-.32,.32)*height*.69)+'px,0)';
  });
 }
 disconnectedCallback() {
  if (!this.trail) return;
  this.resize.disconnect();
  this.reduced.removeEventListener('change',this.schedule);
  this.trail.removeEventListener('scroll',this.schedule);
  cancelAnimationFrame(this.frame);
  this.frame=0;
  this.trail=null;
 }
}
customElements.define('route-landscape',RouteLandscape);
export function mountRouteMotion(trail) {
 trail.parentElement.querySelector('route-landscape')?.mount(trail);
}
