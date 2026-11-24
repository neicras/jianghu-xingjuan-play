export const neutral={traveller:[0,-205,0],assassin:[0,210,-10],flashAge:-1};
export function frame(action,u){
  const hero=action.who==="hero", a=hero?"traveller":"assassin", b=hero?"assassin":"traveller";
  const result={traveller:[...neutral.traveller],assassin:[...neutral.assassin],flashAge:-1,source:a};
  const active=result[a],other=result[b];
  if(action.kind==="strike"){
    const reach=hero?(action.slash?230:184):(action.blocked?52:158);
    const travel=u<.37?Math.max(0,(u-.14)/.23):u<.54?1:Math.max(0,(.92-u)/.38);
    active[1]+=(hero?1:-1)*reach*travel;
    if(!hero && action.blocked)active[2]-=185*travel;
    active[0]=u<.13?0:u<.34?(hero?1:3):u<.56?(hero?(action.slash?3:2):4):u<.82?5:0;
    if(u>=.35&&u<.74){
      other[0]=action.dodge?(hero?2:5):action.blocked?(hero?3:2):(hero?2:5);
      const slip=Math.sin(Math.PI*(u-.35)/.39);
      other[1]+=(hero?1:-1)*(action.dodge?62:action.lost?19:0)*slip;
      if(action.dodge)other[2]-=60*slip;
    }
    if(!action.dodge)result.flashAge=(u-.38)*action.seconds;
  }else if(u>.12&&u<.82){
    active[0]=hero?({guard:4,step:1,breath:5}[action.kind]??0):3;
    if(action.kind==="step")active[2]-=35*Math.sin(Math.PI*u);
  }
  return result;
}
