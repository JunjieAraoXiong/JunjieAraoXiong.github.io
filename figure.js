/* Original anatomical ink study, informed by the physical acting of Sisyphus.
 * Public API: SisyphusFigure.render(pose, seconds=0, contact={}).
 * pose is a continuous scalar 0..4: brace, shoulder, crawl, extension, rest.
 * contact.near / contact.far optionally override hand centers as [x,y].
 * contact.ankles optionally overrides [rearAnkle, frontAnkle] as [x,y] pairs.
 * contact.blend={from,to,amount} interpolates two numbered poses directly.
 * contact.body overrides hip,shoulder,head,tilt,knee0,knee1,elbow0,elbow1.
 * contact.action: brace/buckle/kneel/extend/exhausted; actionMix defaults to 1.
 * Order: pose/blend -> action -> body -> load/fatigue/tremble -> planted contacts.
 * contact.load,fatigue:0..1; tremble:signed displacement in local pixels (-5..5).
 * contact.footAngles:[rear,near] degrees. Positive lifts heel around toe,
 * negative lifts toe around heel. The calf's ankle follows the pivot exactly.
 * contact.relaxed:boolean or [farRelaxed,nearRelaxed] selects hanging hands.
 * resolve(pose,seconds,contact) exposes final landmarks p and foot pivot geometry.
 * Coordinates: soles at y=440; x roughly 0..510; y 70..446.
 * Return value is SVG markup. Parent rotates/translates the whole figure.
 * The same anatomical paths and landmark order persist through every pose.
 */
(function (global) {
  'use strict';
  const INK = '#181719';
  const PAPER = '#fff';
  const poses = [
    {hip:[182,300], shoulder:[284,168], head:[333,201], tilt:36,
     knee0:[113,352], ankle0:[65,429], knee1:[296,350], ankle1:[225,427],
     elbow0:[376,213], hand0:[451,229], elbow1:[358,310], hand1:[465,321]},
    {hip:[183,333], shoulder:[325,234], head:[380,270], tilt:47,
     knee0:[108,379], ankle0:[65,429], knee1:[292,377], ankle1:[225,427],
     elbow0:[386,211], hand0:[451,229], elbow1:[388,339], hand1:[465,321]},
    {hip:[151,352], shoulder:[301,302], head:[355,341], tilt:64,
     knee0:[84,405], ankle0:[65,429], knee1:[260,406], ankle1:[225,427],
     elbow0:[377,266], hand0:[451,229], elbow1:[385,371], hand1:[465,321]},
    {hip:[135,296], shoulder:[299,225], head:[357,253], tilt:39,
     knee0:[92,363], ankle0:[44,429], knee1:[238,353], ankle1:[225,427],
     elbow0:[374,208], hand0:[451,229], elbow1:[385,310], hand1:[465,321]},
    {hip:[231,306], shoulder:[265,185], head:[309,197], tilt:34,
     knee0:[195,366], ankle0:[171,429], knee1:[259,371], ankle1:[265,427],
     elbow0:[244,262], hand0:[243,351], elbow1:[313,279], hand1:[299,365]}
  ];
  const lerp=(a,b,t)=>a+(b-a)*t;
  const n=x=>Number(x.toFixed(2));
  const path=(d,fill=INK,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
  const v=(p,x,y)=>[p[0]+x,p[1]+y];
  const point=p=>`${n(p[0])} ${n(p[1])}`;
  function matrix(a,b) {
    const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
    return {length, value:`matrix(${n(dx/length)} ${n(dy/length)} ${n(-dy/length)} ${n(dx/length)} ${n(a[0])} ${n(a[1])})`};
  }
  const clamp=(x,min=0,max=1)=>Math.max(min,Math.min(max,x));
  const along=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t)];
  function smoothContour(points, tension=.96) {
    let d=`M ${point(points[0])}`;
    for(let i=0;i<points.length;i++) {
      const a=points[(i+points.length-1)%points.length],b=points[i],
        c=points[(i+1)%points.length],e=points[(i+2)%points.length];
      d+=` C ${point([b[0]+(c[0]-a[0])*tension/6,b[1]+(c[1]-a[1])*tension/6])} ${point([c[0]-(e[0]-b[0])*tension/6,c[1]-(e[1]-b[1])*tension/6])} ${point(c)}`;
    }
    return d+' Z';
  }
  // One continuous flesh contour through the joint: no separate muscle capsules.
  // The long white plane connects shoulder to wrist / hip to ankle; a broken
  // tapered cut carries the change in tension without outlining every muscle.
  function limb(a,b,c,r1,r2,far=false,load=0,leg=false) {
    const centers=[a,along(a,b,.27),along(a,b,.66),b,along(b,c,.27),along(b,c,.68),c];
    const radii=[r1*.64,r1*(1+load*.07),r1*.72,r1*.34,r2*.89,r2*.56,r2*.24];
    const normals=centers.map((p,i)=>{
      const prev=centers[Math.max(0,i-1)],next=centers[Math.min(6,i+1)],
        dx=next[0]-prev[0],dy=next[1]-prev[1],len=Math.hypot(dx,dy)||1;
      return [-dy/len,dx/len];
    });
    const off=(i,m)=>[centers[i][0]+normals[i][0]*radii[i]*m,centers[i][1]+normals[i][1]*radii[i]*m];
    const silhouette=centers.map((_,i)=>off(i,-1)).concat(centers.map((_,i)=>off(6-i,1)));
    // Unequal edges look like a single brush gesture rather than a mirrored tube.
    silhouette[2]=off(2,-.86);silhouette[10]=off(3,1.15);silhouette[12]=off(1,.83);
    const whiteA=[off(0,-.29),off(1,-.82),off(2,-.76),off(3,-.62),off(4,-.76),off(5,-.6),off(6,-.18),off(5,.06),off(4,.31),off(3,.11),off(2,.41),off(1,.41),off(0,.28)];
    let out=path(smoothContour(silhouette))+path(smoothContour(whiteA,.88),PAPER);
    // The upper muscle's dark return is broad at the load, and disappears at the joint.
    out+=path(`M ${point(off(1,.3))} Q ${point(off(2,-.34))} ${point(off(3,-.25))} Q ${point(off(2,.14))} ${point(off(1,.3))} Z`);
    // A dry white edge opens the contour at the end of a stroke.
    if(!far) out+=path(`M ${point(off(4,1.03))} Q ${point(off(5,.8))} ${point(off(6,.18))} L ${point(off(5,.98))} Z`,PAPER);
    if(leg) out+=path(`M ${point(off(1,-1.03))} L ${point(off(2,-.95))} L ${point(off(1,-.93))} Z`,PAPER);
    return out;
  }
  function pivotFoot(ankle,near,angle=0) {
    const sole=ankle[1]+(near?13:11),pivot=[ankle[0]+(angle>=0?30:-13),sole],
      rad=angle*Math.PI/180,dx=ankle[0]-pivot[0],dy=ankle[1]-pivot[1];
    return {base:ankle,near,angle,pivot,sole,ankle:[pivot[0]+dx*Math.cos(rad)-dy*Math.sin(rad),pivot[1]+dx*Math.sin(rad)+dy*Math.cos(rad)]};
  }
  function foot(state) {
    const {base:ankle,near,angle,pivot}=state;
    const x=ankle[0], y=state.sole;
    return `<g transform="rotate(${n(angle)} ${point(pivot)})">`+path(`M ${n(x-7)} ${n(ankle[1]-6)} C ${n(x-9)} ${n(y-12)} ${n(x-16)} ${n(y-9)} ${n(x-15)} ${y-3} C ${n(x-12)} ${y+1} ${n(x+14)} ${y+1} ${n(x+30)} ${y} L ${n(x+36)} ${y-3} Q ${n(x+40)} ${y-7} ${n(x+32)} ${y-8} L ${n(x+10)} ${y-12} L ${n(x+6)} ${n(ankle[1]-8)} Z`)+path(`M ${n(x-5)} ${y-10} Q ${n(x+9)} ${y-4} ${n(x+27)} ${y-4} L ${n(x+9)} ${y-2} L ${n(x-9)} ${y-3} Z`,PAPER)+(near?path(`M ${n(x+25)} ${y-8} L ${n(x+25)} ${y-3} M ${n(x+29)} ${y-7} L ${n(x+29)} ${y-3}`, 'none', `stroke="${PAPER}" stroke-width="1.2"`):'')+'</g>';
  }
  function torso(hip,shoulder,load=0,fatigue=0) {
    const {length:l,value}=matrix(hip,shoulder);
    return `<g transform="${value}">`+path(`M -18 -22 C -14 -45 ${n(l*.18)} -54 ${n(l*.35)} -49 C ${n(l*.54)} -62 ${n(l*.77)} -61 ${n(l*.92)} -57 C ${n(l*1.08)} -55 ${n(l*1.16)} -29 ${n(l*1.1)} -5 C ${n(l*1.06)} 15 ${n(l*.9)} 36 ${n(l*.73)} 34 C ${n(l*.55)} 34 ${n(l*.46)} 22 ${n(l*.29)} 30 C ${n(l*.12)} 40 -16 28 -18 8 Z`)
      +path(`M -11 -17 C -9 -37 ${n(l*.19)} -46 ${n(l*.34)} -39 C ${n(l*.5)} -50 ${n(l*.76)} -53 ${n(l*.91)} -48 C ${n(l*1.04)} -44 ${n(l*1.07)} -30 ${n(l*1.05)} -18 C ${n(l*.9)} -25 ${n(l*.81)} -15 ${n(l*.73)} -5 C ${n(l*.65)} 9 ${n(l*.51)} 10 ${n(l*.41)} 4 C ${n(l*.29)} -4 ${n(l*.2)} -5 ${n(l*.1)} 13 C -1 23 -13 11 -11 -17 Z`,PAPER)
      +path(`M ${n(l*.32)} -37 C ${n(l*.43)} -36 ${n(l*.46)} -32 ${n(l*.52)} -28 C ${n(l*.56)} -23 ${n(l*.61)} -22 ${n(l*.64)} -24 C ${n(l*.55)} -13 ${n(l*.49)} -18 ${n(l*.44)} -24 C ${n(l*.4)} -29 ${n(l*.36)} -31 ${n(l*.32)} -37 Z`)
      +path(`M ${n(l*.65)} -46 C ${n(l*.77)} -47 ${n(l*.8)} -38 ${n(l*.91)} -34 C ${n(l*.83)} -31 ${n(l*.8)} -34 ${n(l*.77)} -38 C ${n(l*.73)} -43 ${n(l*.69)} -44 ${n(l*.65)} -46 Z`)
      +path(`M ${n(l*.32)} 19 C ${n(l*.43)} 9 ${n(l*.52)} 10 ${n(l*.6)} 17 C ${n(l*.51)} 22 ${n(l*.43)} 27 ${n(l*.32)} 19 Z`,PAPER)
      +path(`M ${n(l*.62)} 18 Q ${n(l*.76)} 20 ${n(l*.86)} 9 L ${n(l*.78)} 25 Z`,PAPER)
      +path(`M -8 -11 C 3 -21 22 -20 28 -8 C 21 5 10 14 -2 10 Z`,PAPER)
      +path(`M ${n(l*.16)} -38 Q ${n(l*.08)} -25 ${n(l*.11)} -8 L ${n(l*.03)} -22 Z`)
      +path(`M ${n(l*.14)} -53 Q ${n(l*.25)} -51 ${n(l*.32)} -51 L ${n(l*.19)} -49 Z`,PAPER)
      +path(`M ${n(l*.74)} -62 L ${n(l*.87)} -61 L ${n(l*.8)} -59 Z`,PAPER)
      +path(`M ${n(l*.63)} 27 Q ${n(l*.72)} 30 ${n(l*.81)} 22 L ${n(l*.73)} 30 Z`,PAPER)
      +'</g>';
  }
  function head(p,tilt,shoulder) {
    const neck=path(`M ${point(v(shoulder,-6,0))} Q ${point(v(p,-37,-21))} ${point(v(p,-10,-20))} L ${point(v(p,2,13))} Q ${point(v(shoulder,16,35))} ${point(v(shoulder,4,28))} Z`);
    return neck+`<g transform="translate(${point(p)}) rotate(${n(tilt)})">`+
      path('M -23 -6 C -25 -23 -16 -36 0 -34 C 13 -34 21 -25 22 -12 L 21 -5 L 30 4 L 23 8 L 24 15 L 19 19 Q 16 29 5 28 C -5 27 -10 19 -15 13 Q -23 13 -23 -6 Z')+
      path('M -17 -10 C -19 -23 -10 -31 0 -29 C 10 -28 15 -22 16 -14 L 15 -6 L 24 3 L 17 6 L 18 13 L 12 17 Q 9 22 3 19 L -3 10 C 1 4 -4 0 -9 4 L -12 11 Q -18 7 -17 -10 Z',PAPER)+
      path('M 6 -11 L 18 -8 L 11 -4 L 4 -5 Z M 13 12 L 20 11 L 18 15 Z M -12 3 Q -6 -1 -5 6 L -9 13 L -12 10 Z')+
      path('M -18 -19 Q -7 -33 7 -25 L 14 -20 Q 1 -28 -12 -16 Z')+
      '</g>';
  }
  function hand(p,other,rest) {
    if(rest) return `<g transform="translate(${point(p)}) rotate(12)">${path('M -8 -10 Q -13 0 -8 13 L -3 24 L 1 24 L 1 12 L 5 25 L 9 23 L 6 9 L 11 21 L 14 18 L 9 3 L 13 11 L 16 8 L 8 -10 Z')}${path('M -5 -5 L -3 13 L 1 16 L -1 1 Z',PAPER)}</g>`;
    return `<g transform="translate(${point(p)}) rotate(${other?-7:7})">`+
      path('M -13 -9 Q -5 -15 0 -17 L 2 -31 Q 5 -36 7 -30 L 8 -13 L 12 -25 Q 16 -28 17 -22 L 14 -9 L 20 -17 Q 25 -18 24 -12 L 19 -1 L 25 -7 Q 30 -7 28 -1 L 20 10 Q 10 19 0 15 L -14 9 Z')+
      path('M -9 -4 L 3 -10 L 7 -24 L 4 -4 L 16 -10 L 10 2 L 18 0 L 9 10 L 0 10 Z',PAPER)+ '</g>';
  }
  const actions={
    brace:{hip:[172,302],shoulder:[305,208],head:[345,239],tilt:53,knee0:[102,355],knee1:[289,355],elbow0:[386,205],elbow1:[359,319]},
    buckle:{hip:[190,365],shoulder:[322,283],head:[365,329],tilt:69,knee0:[122,411],knee1:[291,410],elbow0:[398,244],elbow1:[390,369]},
    kneel:{hip:[188,342],shoulder:[325,290],head:[374,327],tilt:58,knee0:[119,406],knee1:[294,415],elbow0:[397,251],elbow1:[392,367]},
    extend:{hip:[124,276],shoulder:[317,208],head:[366,238],tilt:34,knee0:[90,354],knee1:[215,341],elbow0:[385,208],elbow1:[393,310]},
    exhausted:{hip:[229,311],shoulder:[272,203],head:[316,238],tilt:52,knee0:[193,374],knee1:[264,379],elbow0:[250,282],elbow1:[310,299]}
  };
  function resolve(pose=0,seconds=0,contact={}) {
    pose=clamp(Number(pose)||0,0,4);
    let from=Math.floor(pose),to=Math.min(4,from+1),amount=pose-from;
    if(contact.blend) {
      from=clamp(Math.round(contact.blend.from||0),0,4);
      to=clamp(Math.round(contact.blend.to||0),0,4);
      amount=clamp(Number(contact.blend.amount)||0);
    }
    const p={};
    for(const key in poses[from]) p[key]=Array.isArray(poses[from][key])?poses[from][key].map((v,i)=>lerp(v,poses[to][key][i],amount)):lerp(poses[from][key],poses[to][key],amount);
    const action=actions[contact.action], actionMix=clamp(contact.actionMix===undefined?1:contact.actionMix);
    if(action) for(const key in action) p[key]=Array.isArray(action[key])?p[key].map((v,i)=>lerp(v,action[key][i],actionMix)):lerp(p[key],action[key],actionMix);
    if(contact.body) for(const key of ['hip','shoulder','head','tilt','knee0','knee1','elbow0','elbow1']) {
      if(contact.body[key]!==undefined) p[key]=Array.isArray(contact.body[key])?contact.body[key].slice():contact.body[key];
    }
    const load=clamp(Number(contact.load)||0),fatigue=clamp(Number(contact.fatigue)||0),
      tremble=clamp(Number(contact.tremble)||0,-5,5),
      breath=(Math.sin(seconds*(2.9-fatigue*.8))+.27*Math.sin(seconds*7.7))*1.15*(pose<3.8?1:.25)*(1-load*.65);
    // Compression is in the body, never a translation of planted extremities.
    p.shoulder[0]-=load*11;p.shoulder[1]+=load*15+fatigue*8+breath+tremble;
    p.hip[1]+=load*4+fatigue*3;
    p.head[0]-=load*5;p.head[1]+=load*18+fatigue*15+breath*.75+tremble*.55;
    p.tilt+=load*7+fatigue*9;
    p.elbow0[1]+=load*6+tremble*.7;p.elbow1[1]+=load*11-tremble*.8;
    if(contact.far)p.hand0=contact.far.slice();
    if(contact.near)p.hand1=contact.near.slice();
    if(contact.ankles) {
      for(let i=0;i<2;i++) if(contact.ankles[i]) {
        const key='ankle'+i,delta=[contact.ankles[i][0]-p[key][0],contact.ankles[i][1]-p[key][1]];
        // A planted foot can lag behind the advancing pelvis. Let its knee follow
        // part of that lag; an explicitly authored knee remains authoritative.
        if(!contact.body || !contact.body['knee'+i]) {
          p['knee'+i][0]+=delta[0]*.35;p['knee'+i][1]+=delta[1]*.38;
        }
        p[key]=contact.ankles[i].slice();
      }
    }
    const feet=[0,1].map(i=>pivotFoot(p['ankle'+i],i===1,clamp(Number(contact.footAngles?.[i])||0,-38,42)));
    p.ankle0=feet[0].ankle;p.ankle1=feet[1].ankle;
    return {pose,p,feet,load,fatigue};
  }
  function render(pose=0,seconds=0,contact={}) {
    const rig=resolve(pose,seconds,contact),{p,feet,load,fatigue}=rig;
    const relaxed=Array.isArray(contact.relaxed)?contact.relaxed.map(Boolean):
      [0,1].map(()=>contact.relaxed===undefined?rig.pose>3.8:Boolean(contact.relaxed));
    let out='<g class="sisyphus-body">';
    out+=limb(v(p.hip,-8,-2),p.knee0,p.ankle0,29,20,true,load,true)+foot(feet[0]);
    out+=limb(v(p.shoulder,10,-12),p.elbow0,p.hand0,23,17,true,load)+hand(p.hand0,true,relaxed[0]);
    out+=limb(v(p.hip,9,6),p.knee1,p.ankle1,35,23,false,load,true)+foot(feet[1]);
    out+=torso(p.hip,p.shoulder,load,fatigue);
    out+=head(p.head,p.tilt,p.shoulder);
    out+=limb(v(p.shoulder,-3,11),p.elbow1,p.hand1,31,21,false,load)+hand(p.hand1,false,relaxed[1]);
    feet.forEach(f=>{
      if(f.sole>=439) {
        const x=f.angle?f.pivot[0]:f.base[0],width=f.angle?13:41;
        out+=path(`M ${n(x-13)} 444 L ${n(x+width)} 443 L ${n(x+7)} 446 Z`);
      }
    });
    return out+'</g>';
  }
  global.SisyphusFigure={render,resolve,actions,poses:poses.map((_,i)=>i),bounds:{x:0,y:55,width:510,height:395},baseline:440};
})(typeof window==='undefined'?globalThis:window);
