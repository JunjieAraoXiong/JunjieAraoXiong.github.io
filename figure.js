/* Original anatomical ink study, informed by the physical acting of Sisyphus.
 * Public API: SisyphusFigure.render(pose, seconds=0, contact={}).
 * pose is a continuous scalar 0..4: brace, shoulder, crawl, extension, rest.
 * contact.near / contact.far optionally override hand centers as [x,y].
 * contact.ankles optionally overrides [rearAnkle, frontAnkle] as [x,y] pairs.
 * contact.blend={from,to,amount} interpolates two numbered poses directly.
 * contact.body overrides hip,shoulder,head,tilt,knee0,knee1,elbow0,elbow1.
 * contact.solved preserves authored joint coordinates; load affects ink only.
 * contact.bulk:0..1 changes muscle mass; silhouette:0..1 simplifies ink planes.
 * contact.twist:-1..1 rotates the visible thorax plane without moving joints.
 * contact.action: brace/buckle/kneel/extend/exhausted; actionMix defaults to 1.
 * Order: pose/blend -> action -> body -> load/fatigue/tremble -> planted contacts.
 * contact.load,fatigue:0..1; tremble:signed displacement in local pixels (-5..5).
 * contact.footAngles:[rear,near] degrees. Positive lifts heel around toe,
 * negative lifts toe around heel. The calf's ankle follows the pivot exactly.
 * contact.footPivots selects heel/toe, or an explicit local x offset per foot.
 * contact.relaxed:boolean or [farRelaxed,nearRelaxed] selects hanging hands.
 * contact.relaxAmount:[far,near] continuously releases the hands from 0 to 1.
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
  // A flesh silhouette with separate weighted edge strokes. The elbow and knee
  // retain volume; shadows taper across the muscle rather than dividing it into
  // repeated triangular pieces. The rear limbs carry a quieter, narrower plane.
  function limb(a,b,c,r1,r2,far=false,load=0,leg=false,dark=0) {
    const centers=[a,along(a,b,.25),along(a,b,.64),b,along(b,c,.29),along(b,c,.68),c];
    const radii=[r1*.72,r1*(1+load*.045),r1*(leg?.94:.81),r1*(leg?.42:.43),r2*.94,r2*.59,r2*.29];
    const normals=centers.map((p,i)=>{
      const prev=centers[Math.max(0,i-1)],next=centers[Math.min(6,i+1)],
        dx=next[0]-prev[0],dy=next[1]-prev[1],len=Math.hypot(dx,dy)||1;
      return [-dy/len,dx/len];
    });
    const off=(i,m)=>[centers[i][0]+normals[i][0]*radii[i]*m,centers[i][1]+normals[i][1]*radii[i]*m];
    const silhouette=centers.map((_,i)=>off(i,-1)).concat(centers.map((_,i)=>off(6-i,1)));
    silhouette[2]=off(2,-.92);silhouette[10]=off(3,1.09);silhouette[12]=off(1,.89);
    const negative=[-.43,-.91,-.87,-.75,-.84,-.72,-.35],
      positive=far?[.3,.63,.57,.64,.52,.35,.22]:[.32,.78,.72,.74,.65,.45,.25];
    const light=(1-dark)*Math.pow(1-clamp((dark-.5)/.3),2),plane=(i,m)=>off(i,m*light-.12*dark);
    const face=negative.map((m,i)=>plane(i,m)).concat(positive.slice().reverse().map((m,i)=>plane(6-i,m)));
    let out=path(smoothContour(silhouette,.72))+path(smoothContour(face,.68),PAPER);
    // Deltoid / quadriceps meets the tendon with a short, asymmetric ink wedge.
    out+=path(`M ${point(off(1,.63))} C ${point(off(1,.16))} ${point(off(2,.33))} ${point(off(3,.12))} C ${point(off(2,.64))} ${point(off(2,.69))} ${point(off(1,.63))} Z`);
    // Forearm flexor or calf: a second mass, with breathing room at the joint.
    out+=path(`M ${point(off(4,.56))} Q ${point(off(5,.04))} ${point(off(6,-.05))} Q ${point(off(5,.43))} ${point(off(4,.56))} Z`);
    if(leg) out+=path(`M ${point(off(2,-.43))} Q ${point(off(3,-.74))} ${point(off(3,-.02))} Q ${point(off(3,-.42))} ${point(off(2,-.43))} Z`);
    // As the drawing becomes a silhouette, the broad flesh plane closes.
    // One brief tapered cut survives inside the muscle; it never crosses a joint.
    if(!far) {
      const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,
        begin=along(a,b,.24),middle=along(a,b,.4),end=along(a,b,.57),
        width=r1*.095*clamp((dark-.44)/.26)*(1-clamp((dark-.88)/.12)),
        edge=[middle[0]-dy/length*width,middle[1]+dx/length*width];
      out+=path(`M ${point(begin)} Q ${point(edge)} ${point(end)} Q ${point(middle)} ${point(begin)} Z`,PAPER);
    }
    // Leave a small dry opening in the far edge, as a brush lifts from paper.
    if(!far && dark<.48) out+=path(`M ${point(off(4,-1.01))} Q ${point(off(5,-.94))} ${point(off(6,-.38))} L ${point(off(5,-.99))} Z`,PAPER);
    return out;
  }
  function pivotFoot(ankle,near,angle=0,pivotSide) {
    const offset=typeof pivotSide==='number'&&Number.isFinite(pivotSide)?pivotSide:
      pivotSide==='heel'?-13:pivotSide==='toe'?30:angle>=0?30:-13;
    const sole=ankle[1]+(near?13:11),pivot=[ankle[0]+offset,sole],
      rad=angle*Math.PI/180,dx=ankle[0]-pivot[0],dy=ankle[1]-pivot[1];
    return {base:ankle,near,angle,pivot,sole,ankle:[pivot[0]+dx*Math.cos(rad)-dy*Math.sin(rad),pivot[1]+dx*Math.sin(rad)+dy*Math.cos(rad)]};
  }
  function foot(state,dark=0) {
    const {base:ankle,near,angle,pivot}=state;
    const x=ankle[0], y=state.sole,light=Math.pow(1-clamp(dark/.8),2);
    return `<g transform="rotate(${n(angle)} ${point(pivot)})">`+path(`M ${n(x-7)} ${n(ankle[1]-6)} C ${n(x-9)} ${n(y-12)} ${n(x-16)} ${n(y-9)} ${n(x-15)} ${y-3} C ${n(x-12)} ${y+1} ${n(x+14)} ${y+1} ${n(x+30)} ${y} L ${n(x+36)} ${y-3} Q ${n(x+40)} ${y-7} ${n(x+32)} ${y-8} L ${n(x+10)} ${y-12} L ${n(x+6)} ${n(ankle[1]-8)} Z`)+`<g transform="translate(0 ${y-3}) scale(1 ${n(light)}) translate(0 ${3-y})">`+path(`M ${n(x-5)} ${y-10} Q ${n(x+9)} ${y-4} ${n(x+27)} ${y-4} L ${n(x+9)} ${y-2} L ${n(x-9)} ${y-3} Z`,PAPER)+(near?path(`M ${n(x+25)} ${y-8} L ${n(x+25)} ${y-3} M ${n(x+29)} ${y-7} L ${n(x+29)} ${y-3}`, 'none', `stroke="${PAPER}" stroke-width="1.2"`):'')+'</g></g>';
  }
  function torso(hip,shoulder,bulk=1,dark=0,twist=0) {
    const {length:l,value}=matrix(hip,shoulder),width=lerp(.4,1.08,bulk),
      light=(1-dark)*Math.pow(1-clamp((dark-.5)/.3),2),turn=twist*13;
    // Pelvis, narrow waist, ribcage and shoulder are distinct volumes. Rotation
    // exposes the chest plane on one side and the scapula on the other.
    const outline=[[-18,-12],[-12,-32],[l*.13,-38],[l*.29,-31],
      [l*.47,-38],[l*.66,-51],[l*.83,-50],[l*1.04,-29],
      [l*1.055,-8],[l*.93,18],[l*.73,30],[l*.52,25],
      [l*.35,16],[l*.25,26],[l*.11,37],[-12,28]];
    const flesh=[[-12,-12],[-7,-27],[l*.13,-32],[l*.3,-25],
      [l*.49,-33],[l*.66,-44],[l*.82,-44],[l*.985,-27],
      [l*.995,-13],[l*.87,-5+turn],[l*.71,4+turn],
      [l*.53,8],[l*.39,10],[l*.23,19],[l*.12,29],[-7,23]];
    const chest=[[l*.92,8+turn*.3],[l*.84,19],[l*.72,24],
      [l*.58,21],[l*.46,13],[l*.61,15+turn*.3],[l*.76,12+turn*.45]];
    const lightPlane=points=>points.map(([x,y])=>[x,(y+5)*light-5]);
    let out=`<g transform="${value}"><g transform="scale(1 ${n(width)})">`+
      path(smoothContour(outline,.86))+
      path(smoothContour(lightPlane(flesh),.78),PAPER)+
      path(smoothContour(lightPlane(chest),.64),PAPER);
    // Few purposeful marks: the shoulder blade, lumbar hinge, and iliac crest.
    if(dark<.72) {
      out+=path(`M ${n(l*.91)} -40 C ${n(l*.77)} -42 ${n(l*.64)} -32 ${n(l*.61)} -20 C ${n(l*.66)} -30 ${n(l*.79)} -37 ${n(l*.91)} -40 Z`)+
        path(`M ${n(l*.49)} -34 Q ${n(l*.38)} -24 ${n(l*.31)} -23 Q ${n(l*.42)} -22 ${n(l*.49)} -34 Z`)+
        path(`M ${n(l*.14)} -25 Q ${n(l*.04)} -11 ${n(l*.12)} 1 Q ${n(l*.08)} -14 ${n(l*.14)} -25 Z`)+
        path(`M ${n(l*.14)} 29 Q ${n(l*.23)} 13 ${n(l*.34)} 10 Q ${n(l*.21)} 17 ${n(l*.14)} 29 Z`);
    }
    const cut=clamp((dark-.48)/.24)*(1-clamp((dark-.88)/.12));
    out+=path(`M ${n(l*.63)} -26 Q ${n(l*.73)} ${n(-26-5*cut)} ${n(l*.85)} -28 Q ${n(l*.74)} -26 ${n(l*.63)} -26 Z`,PAPER);
    return out+'</g></g>';
  }
  function neck(p,shoulder,dark=0) {
    return path(`M ${point(v(shoulder,-3,-10))} Q ${point(v(p,-34,-22))} ${point(v(p,-13,-24))} L ${point(v(p,-1,12))} Q ${point(v(shoulder,20,19))} ${point(v(shoulder,4,23))} Z`)+
      (dark<.65?path(`M ${point(v(shoulder,8,-3))} Q ${point(v(p,-29,-15))} ${point(v(p,-19,-17))} L ${point(v(p,-9,7))} Q ${point(v(shoulder,18,12))} ${point(v(shoulder,8,14))} Z`,PAPER):'');
  }
  function head(p,tilt,dark=0,bulk=1) {
    const size=lerp(.8,1,bulk),light=Math.pow(1-clamp(dark/.72),1.6);
    return `<g transform="translate(${point(p)}) rotate(${n(tilt-5)}) scale(${n(size)})">`+
      path('M -24 -9 C -28 -23 -20 -38 -5 -40 C 10 -43 23 -33 24 -18 Q 25 -9 21 -4 L 30 5 Q 31 8 23 10 L 23 16 L 18 20 Q 16 30 4 30 C -7 30 -14 21 -17 15 Q -25 11 -24 -9 Z')+
      `<g transform="scale(${n(light)})">`+path('M -20 -10 C -23 -24 -16 -35 -4 -36 C 8 -39 19 -30 20 -18 Q 20 -11 16 -5 L 25 5 L 18 8 L 19 14 L 13 18 Q 12 23 5 24 C -1 23 -5 18 -8 13 L -10 5 Q -7 -1 -12 -2 Q -19 -3 -16 8 L -18 11 Q -22 5 -20 -10 Z',PAPER)+
      path('M 5 -11 Q 12 -13 19 -7 L 12 -6 L 6 -8 Z M 14 14 L 21 13 L 17 16 Z M -14 1 Q -8 -2 -10 6 L -13 9 L -12 4 Z')+
      path('M -20 -22 C -12 -35 -1 -39 9 -31 C -1 -35 -12 -30 -20 -22 Z')+
      '</g></g>';
  }
  const handOpen=[[-14,-8],[-6,-12],[-1,-18],[7,-27],[11,-25],[9,-17],[18,-24],[22,-22],[16,-14],[24,-19],[27,-16],[20,-7],[27,-11],[28,-7],[19,6],[11,13],[3,16],[-12,9]];
  const handLoose=[[-8,-10],[-11,-3],[-10,10],[-5,24],[-1,25],[0,12],[5,25],[9,25],[7,10],[13,22],[16,20],[11,4],[16,11],[18,8],[11,-2],[9,-8],[3,-10],[-6,-11]];
  const palmOpen=[[-10,-5],[-4,-8],[6,-19],[3,-8],[17,-18],[8,-5],[20,-11],[12,0],[20,-4],[9,8],[3,11],[-8,6]];
  const palmLoose=[[-5,-5],[-8,0],[-5,14],[-2,18],[-1,11],[-3,4],[3,15],[5,19],[3,8],[5,5],[3,-5],[-4,-7]];
  function hand(p,other,release,dark=0,bulk=1) {
    const amount=clamp(Number(release)||0),morph=(a,b)=>a.map((q,i)=>along(q,b[i],amount)),size=lerp(.7,1,bulk),light=Math.pow(1-clamp(dark/.72),1.4);
    // The fingers curl as contact is released: the same contour throughout,
    // including the quiet hanging hand at the end of the climb.
    return `<g transform="translate(${point(p)}) rotate(${n(lerp(other?-7:7,12,amount))}) scale(${n(size)})">`+
      path(smoothContour(morph(handOpen,handLoose),.5))+
      path(smoothContour(morph(palmOpen,palmLoose).map(p=>p.map(x=>x*light)),.35),PAPER)+'</g>';
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
    // The scene owns all biomechanics when it supplies a solved skeleton.
    if(!contact.solved) {
    p.shoulder[0]-=load*11;p.shoulder[1]+=load*15+fatigue*8+breath+tremble;
    p.hip[1]+=load*4+fatigue*3;
    p.head[0]-=load*5;p.head[1]+=load*18+fatigue*15+breath*.75+tremble*.55;
    p.tilt+=load*7+fatigue*9;
    p.elbow0[1]+=load*6+tremble*.7;p.elbow1[1]+=load*11-tremble*.8;
    }
    if(contact.far)p.hand0=contact.far.slice();
    if(contact.near)p.hand1=contact.near.slice();
    if(contact.ankles) {
      for(let i=0;i<2;i++) if(contact.ankles[i]) {
        const key='ankle'+i,delta=[contact.ankles[i][0]-p[key][0],contact.ankles[i][1]-p[key][1]];
        // A planted foot can lag behind the advancing pelvis. Let its knee follow
        // part of that lag; an explicitly authored knee remains authoritative.
        if(!contact.solved && (!contact.body || !contact.body['knee'+i])) {
          p['knee'+i][0]+=delta[0]*.35;p['knee'+i][1]+=delta[1]*.38;
        }
        p[key]=contact.ankles[i].slice();
      }
    }
    const feet=[0,1].map(i=>pivotFoot(p['ankle'+i],i===1,clamp(Number(contact.footAngles?.[i])||0,-70,70),contact.footPivots?.[i]));
    p.ankle0=feet[0].ankle;p.ankle1=feet[1].ankle;
    return {pose,p,feet,load,fatigue};
  }
  function render(pose=0,seconds=0,contact={}) {
    const rig=resolve(pose,seconds,contact),{p,feet,load,fatigue}=rig;
    const relaxed=Array.isArray(contact.relaxed)?contact.relaxed.map(Boolean):
      [0,1].map(()=>contact.relaxed===undefined?rig.pose>3.8:Boolean(contact.relaxed));
    const release=[0,1].map(i=>Array.isArray(contact.relaxAmount)?clamp(Number(contact.relaxAmount[i])||0):Number(relaxed[i]));
    const bulk=clamp(contact.bulk===undefined?1:Number(contact.bulk)||0),
      dark=clamp(Number(contact.silhouette)||0),twist=clamp(Number(contact.twist)||0,-1,1),
      muscle=lerp(.42,1.12,bulk),upper=lerp(.48,1.09,bulk);
    let out='<g class="sisyphus-body">';
    // Large early limbs carry the drawing. Later the same skeleton is stripped
    // down to narrow gestures as the burden overwhelms it.
    out+=limb(v(p.hip,-5,-1),p.knee0,p.ankle0,33*muscle,22*muscle,true,load,true,dark)+foot(feet[0],dark);
    out+=limb(v(p.shoulder,5,-7),p.elbow0,p.hand0,25*upper,17*upper,true,load,false,dark)+hand(p.hand0,true,release[0],dark,bulk);
    out+=limb(v(p.hip,6,4),p.knee1,p.ankle1,38*muscle,24*muscle,false,load,true,dark)+foot(feet[1],dark);
    out+=torso(p.hip,p.shoulder,bulk,dark,twist);
    out+=neck(p.head,p.shoulder,dark);
    out+=limb(v(p.shoulder,-2,6),p.elbow1,p.hand1,29*upper,19*upper,false,load,false,dark)+hand(p.hand1,false,release[1],dark,bulk);
    out+=head(p.head,p.tilt,dark,bulk);
    // Ground contact marks belong to the scene in solved mode.
    if(!contact.solved) feet.forEach(f=>{
      if(f.sole>=439) {
        const x=f.angle?f.pivot[0]:f.base[0],width=f.angle?13:41;
        out+=path(`M ${n(x-13)} 444 L ${n(x+width)} 443 L ${n(x+7)} 446 Z`);
      }
    });
    return out+'</g>';
  }
  global.SisyphusFigure={render,resolve,pivotFoot,actions,poses:poses.map((_,i)=>i),bounds:{x:0,y:55,width:510,height:395},baseline:440};
})(typeof window==='undefined'?globalThis:window);
