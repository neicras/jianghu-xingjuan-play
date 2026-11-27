import {newJourney, gift, enter} from './journey.js';
import {play, endRound, settleChoice} from './combat.js';
import {animateBout, arena, paintBout, pileSheet} from './arena.js?technique=1';
import {installSound} from './game-sound.js';

const films = new Map([
  ['白虹劍法', {file:'white-rainbow', seconds:1.667, strikes:[0.15, 0.71]}],
  ['護纜鐵衣', {file:'iron-robe', seconds:1.46, strikes:[], guard:0.64}],
]);
const room = document.querySelector('#room');
const mode = document.querySelector('#mode');
const reset = document.querySelector('#reset');
let cinematic = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let state, busy = false;

// Cache only the two clips on the opt-in page. Blob URLs also work on hosts
// that do not implement the range requests used by mobile video players.
const clipUrls = new Map();
const sheets = new Map();
const useFrames = matchMedia('(pointer: coarse), (max-width:760px)').matches;
function loadSheet(file){
  if(!sheets.has(file)){
    const image=new Image();
    image.src=new URL('./technique-films/'+file+'.webp',import.meta.url).href;
    sheets.set(file,image);
  }
  return sheets.get(file);
}
function filmUrl(file){return new URL('./technique-films/'+file+'.mp4',import.meta.url).href;}
let warming = false;
function warmFilms(){
  if(warming || !cinematic)return;
  warming=true;
  for(const {file} of films.values()){
    if(useFrames){loadSheet(file);continue;}
    fetch(filmUrl(file)).then(async response=>{
      if(response.ok)clipUrls.set(file,URL.createObjectURL(await response.blob()));
    }).catch(()=>{});
  }
}

function restart(){
  state = newJourney(5);
  gift(state,'xp');
  state.equipped = [...films.keys()];
  state.learned = [...state.equipped];
  enter(state,0);
  const bout = state.bout;
  const cards = [...bout.hand,...bout.draw];
  bout.hand = state.equipped.map(name=>cards.find(card=>card.name===name));
  bout.draw = cards.filter(card=>!bout.hand.includes(card));
  bout.log = ['點選《白虹劍法》看兩劍連擊，或以《護纜鐵衣》護身。'];
  render();
}

function button(action,label,style='',disabled=false){
  return '<button data-action="'+action+'" class="'+style+'" '+(disabled?'disabled':'')+'>'+label+'</button>';
}
function render(){
  mode.textContent = cinematic?'切換至原版動作':'切換至招式短片';
  mode.setAttribute('aria-pressed', String(cinematic));
  mode.title = '切換招式短片與原版動作';
  room.innerHTML = state.bout.phase==='lost'
    ? '<div class="bout-entry">試招落敗。'+button('reset','重新試招')+'</div>'
    : arena(state,button);
  if(state.bout.phase==='won') room.querySelector('[data-action="collect"]').textContent='重新試招';
  void paintBout(state.bout);
}

function playFilm(film,name){
  return async (stage,moves,contact,standard)=>{
    let next=0, strikes=0;
    const timing=moves.map(move=>move.kind==='strike'?(film.strikes[strikes++]??0.83):(film.guard??0.82));
    for(let i=1;i<timing.length;i++)timing[i]=Math.max(timing[i-1],timing[i]);
    function sync(fraction){while(next<moves.length && fraction>=timing[next])contact(moves[next++]);}
    // Small screens display a compact atlas sampled from the exact same generated film.
    if(useFrames){
      const image=loadSheet(film.file);
      const ready=await Promise.race([image.decode().then(()=>true,()=>false),
        new Promise(resolve=>setTimeout(()=>resolve(false),1800))]);
      if(!ready){await standard();return;}
      const layer=document.createElement('div'),cel=document.createElement('i');
      layer.className='technique-film visible film-atlas';layer.setAttribute('aria-label',name);
      cel.style.backgroundImage='url("'+image.src+'")';layer.append(cel);
      stage.querySelector('.arena-picture').append(layer);
      try{
        await new Promise(resolve=>{
          let start;
          function frame(time){
            start??=time;
            const fraction=Math.min(1,(time-start)/(film.seconds*1000));
            const index=Math.min(23,Math.floor(fraction*24));
            cel.style.backgroundPosition=(index%6)*20+'% '+Math.floor(index/6)*100/3+'%';
            sync(fraction);
            if(fraction<1)requestAnimationFrame(frame);else resolve();
          }
          requestAnimationFrame(frame);
        });
      }finally{layer.remove();}
      return;
    }
    const video = document.createElement('video');
    video.muted=true; video.playsInline=true;
    video.className='technique-film'; video.setAttribute('aria-label',name);
    video.src=clipUrls.get(film.file)??filmUrl(film.file);
    stage.querySelector('.arena-picture').append(video);
    try{
      const ended=await new Promise(resolve=>{
        let raf, stall, done=false, last=-1;
        function finish(ok){
          if(done)return;
          done=true;clearTimeout(stall);cancelAnimationFrame(raf);resolve(ok);
        }
        function watch(){
          if(done)return;
          if(video.currentTime>last){
            last=video.currentTime;clearTimeout(stall);stall=setTimeout(()=>finish(false),3000);
          }
          if(video.currentTime>0){
            video.classList.add('visible');
            sync(video.currentTime/video.duration);
          }
          raf=requestAnimationFrame(watch);
        }
        video.onended=()=>finish(true);
        video.onerror=()=>finish(false);
        stall=setTimeout(()=>finish(false),3000);
        video.play().catch(()=>finish(false));
        watch();
      });
      video.remove();
      if(ended){while(next<moves.length)contact(moves[next++]);}
      else if(next<moves.length)await standard(moves.slice(next));
    }finally{video.pause();video.remove();}
  };
}

room.addEventListener('click',async e=>{
  const key=e.target.closest('button')?.dataset.action;
  if(!key||busy)return;
  const [action,id]=key.split('/');
  const b=state.bout;
  if(action==='reset'||action==='collect'){restart();return;}
  if(action==='pile'){
    document.querySelector('#pages').innerHTML=pileSheet(b,id);
    document.querySelector('#folio').showModal();return;
  }
  if(action==='target'){b.target=Number(id);render();return;}
  if(action==='pick'||action==='skip'){settleChoice(b,id);render();return;}
  if(!['cast','endRound'].includes(action))return;
  busy=true;mode.disabled=true;reset.disabled=true;
  try{
    const card=b.hand.find(c=>c.id===id);
    const film=cinematic && card && films.get(card.name);
    await animateBout(b,emit=>action==='cast'?play(b,id,emit):endRound(b,emit),
      undefined,action,film?playFilm(film,card.name):undefined);
  }finally{busy=false;mode.disabled=false;reset.disabled=false;render();}
});
mode.onclick=()=>{cinematic=!cinematic;warmFilms();render();};
reset.onclick=restart;
installSound();
restart();
warmFilms();
