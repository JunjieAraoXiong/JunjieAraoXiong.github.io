/* Original anatomical ink study, informed by the physical acting of Sisyphus.
 * Public API: SisyphusFigure.render(pose, seconds=0, contact={}).
 * pose is a continuous scalar 0..4: brace, shoulder, crawl, extension, rest.
 * contact.near / contact.far optionally override hand centers as [x,y].
 * contact.ankles optionally overrides [rearAnkle, frontAnkle] as [x,y] pairs.
 * Coordinates: soles at y=440; x roughly 30..480; y 70..444.
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
  // A shaped muscle, with an irregular loaded-brush shadow on the lower edge.
  function muscle(a,b,r,variant=0,far=false) {
    const {length:l,value}=matrix(a,b), w=r, taper=variant===1?.2:.31;
    const d=`M ${n(-w*.3)} ${n(-w*.45)} C ${n(l*.04)} ${n(-w*1.02)} ${n(l*.17)} ${n(-w*1.21)} ${n(l*.31)} ${n(-w*.93)} C ${n(l*.48)} ${n(-w*.95)} ${n(l*.52)} ${n(-w*.5)} ${n(l*.65)} ${n(-w*.48)} C ${n(l*.83)} ${n(-w*.52)} ${n(l*.91)} ${n(-w*taper)} ${n(l)} ${n(-w*taper)} L ${n(l+w*.1)} ${n(w*.14)} C ${n(l*.86)} ${n(w*.29)} ${n(l*.83)} ${n(w*.61)} ${n(l*.63)} ${n(w*.65)} C ${n(l*.48)} ${n(w*.99)} ${n(l*.31)} ${n(w*1.05)} ${n(l*.2)} ${n(w*.7)} C ${n(-w*.24)} ${n(w*.73)} ${n(-w*.5)} ${n(w*.12)} ${n(-w*.3)} ${n(-w*.45)} Z`;
    const light=`M ${n(w*.04)} ${n(-w*.44)} C ${n(l*.09)} ${n(-w*.87)} ${n(l*.22)} ${n(-w*.93)} ${n(l*.34)} ${n(-w*.72)} C ${n(l*.5)} ${n(-w*.7)} ${n(l*.54)} ${n(-w*.25)} ${n(l*.71)} ${n(-w*.29)} L ${n(l*.91)} ${n(-w*.13)} C ${n(l*.73)} ${n(w*.04)} ${n(l*.61)} ${n(w*.39)} ${n(l*.46)} ${n(w*.39)} C ${n(l*.34)} ${n(w*.36)} ${n(l*.27)} ${n(w*.21)} ${n(l*.26)} ${n(-w*.28)} C ${n(l*.19)} ${n(w*.01)} ${n(l*.16)} ${n(w*.45)} ${n(l*.08)} ${n(w*.44)} C ${n(-w*.1)} ${n(w*.18)} ${n(-w*.03)} ${n(-w*.12)} ${n(w*.04)} ${n(-w*.44)} Z`;
    const sinew=`M ${n(l*.48)} ${n(-w*.42)} C ${n(l*.6)} ${n(-w*.19)} ${n(l*.72)} ${n(-w*.18)} ${n(l*.9)} ${n(-w*.13)} C ${n(l*.72)} ${n(-w*.05)} ${n(l*.6)} ${n(w*.06)} ${n(l*.48)} ${n(-w*.42)} Z`;
    return `<g transform="${value}">${path(d)}${path(light,PAPER)}${path(sinew)}${far?'':path(`M ${n(l*.21)} ${n(w*.58)} Q ${n(l*.42)} ${n(w*.71)} ${n(l*.57)} ${n(w*.47)} L ${n(l*.43)} ${n(w*.68)} Z`,PAPER)}</g>`;
  }
  function foot(ankle,near) {
    const x=ankle[0], y=ankle[1]+(near?13:11);
    return path(`M ${n(x-7)} ${n(ankle[1]-6)} C ${n(x-9)} ${n(y-12)} ${n(x-16)} ${n(y-9)} ${n(x-15)} ${y-3} C ${n(x-12)} ${y+1} ${n(x+14)} ${y+1} ${n(x+30)} ${y} L ${n(x+36)} ${y-3} Q ${n(x+40)} ${y-7} ${n(x+32)} ${y-8} L ${n(x+10)} ${y-12} L ${n(x+6)} ${n(ankle[1]-8)} Z`)+path(`M ${n(x-5)} ${y-10} Q ${n(x+9)} ${y-4} ${n(x+27)} ${y-4} L ${n(x+9)} ${y-2} L ${n(x-9)} ${y-3} Z`,PAPER)+(near?path(`M ${n(x+25)} ${y-8} L ${n(x+25)} ${y-3} M ${n(x+29)} ${y-7} L ${n(x+29)} ${y-3}`, 'none', `stroke="${PAPER}" stroke-width="1.2"`):'');
  }
  function torso(hip,shoulder,t) {
    const {length:l,value}=matrix(hip,shoulder);
    return `<g transform="${value}">`+path(`M -18 -22 C -14 -45 ${n(l*.18)} -54 ${n(l*.35)} -49 C ${n(l*.54)} -62 ${n(l*.77)} -61 ${n(l*.92)} -57 C ${n(l*1.08)} -55 ${n(l*1.16)} -29 ${n(l*1.1)} -5 C ${n(l*1.06)} 15 ${n(l*.9)} 36 ${n(l*.73)} 34 C ${n(l*.55)} 34 ${n(l*.46)} 22 ${n(l*.29)} 30 C ${n(l*.12)} 40 -16 28 -18 8 Z`)
      +path(`M -11 -17 C -9 -37 ${n(l*.19)} -46 ${n(l*.34)} -39 C ${n(l*.5)} -50 ${n(l*.76)} -53 ${n(l*.91)} -48 C ${n(l*1.04)} -44 ${n(l*1.07)} -30 ${n(l*1.05)} -18 C ${n(l*.9)} -25 ${n(l*.81)} -15 ${n(l*.73)} -5 C ${n(l*.65)} 9 ${n(l*.51)} 10 ${n(l*.41)} 4 C ${n(l*.29)} -4 ${n(l*.2)} -5 ${n(l*.1)} 13 C -1 23 -13 11 -11 -17 Z`,PAPER)
      +path(`M ${n(l*.36)} -38 C ${n(l*.49)} -38 ${n(l*.58)} -36 ${n(l*.64)} -29 C ${n(l*.59)} -18 ${n(l*.53)} -15 ${n(l*.5)} -9 C ${n(l*.47)} -24 ${n(l*.44)} -27 ${n(l*.36)} -38 Z`)
      +path(`M ${n(l*.61)} -45 C ${n(l*.73)} -45 ${n(l*.77)} -29 ${n(l*.9)} -30 C ${n(l*.78)} -18 ${n(l*.71)} -24 ${n(l*.61)} -45 Z`)
      +path(`M ${n(l*.32)} 19 C ${n(l*.43)} 9 ${n(l*.52)} 10 ${n(l*.6)} 17 C ${n(l*.51)} 22 ${n(l*.43)} 27 ${n(l*.32)} 19 Z`,PAPER)
      +path(`M ${n(l*.62)} 18 Q ${n(l*.76)} 20 ${n(l*.86)} 9 L ${n(l*.78)} 25 Z`,PAPER)
      +path(`M -8 -11 C 3 -21 22 -20 28 -8 C 21 5 10 14 -2 10 Z`,PAPER)
      +path(`M ${n(l*.16)} -38 Q ${n(l*.08)} -25 ${n(l*.11)} -8 L ${n(l*.03)} -22 Z`)
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
  function render(pose=0, seconds=0, contact={}) {
    pose=Math.max(0,Math.min(4,Number(pose)||0));
    const a=Math.floor(pose), b=Math.min(4,a+1), f=pose-a, p={};
    for(const key in poses[a]) p[key]=Array.isArray(poses[a][key])?poses[a][key].map((v,i)=>lerp(v,poses[b][key][i],f)):lerp(poses[a][key],poses[b][key],f);
    // Breath moves the rib cage only; hands and soles remain planted.
    const effort=pose<3.8?1:0.25, breath=Math.sin(seconds*3.5)*1.4*effort;
    p.shoulder[1]+=breath; p.head[1]+=breath*.7;
    if(contact.far) p.hand0=contact.far;
    if(contact.near) p.hand1=contact.near;
    if(contact.ankles) {
      if(contact.ankles[0]) p.ankle0=contact.ankles[0];
      if(contact.ankles[1]) p.ankle1=contact.ankles[1];
    }
    let out='<g class="sisyphus-body">';
    out+=muscle(v(p.hip,-8,-2),p.knee0,30,0,true)+muscle(p.knee0,p.ankle0,20,1,true)+foot(p.ankle0,false);
    out+=muscle(v(p.shoulder,10,-12),p.elbow0,23,0,true)+muscle(p.elbow0,p.hand0,17,1,true)+hand(p.hand0,true,pose>3.8);
    out+=muscle(v(p.hip,9,6),p.knee1,37)+muscle(p.knee1,p.ankle1,23,1)+foot(p.ankle1,true);
    out+=torso(p.hip,p.shoulder,seconds);
    out+=head(p.head,p.tilt,p.shoulder);
    out+=muscle(v(p.shoulder,-3,11),p.elbow1,32)+muscle(p.elbow1,p.hand1,21,1)+hand(p.hand1,false,pose>3.8);
    // Fine dry-brush marks at contact carry the force into the ground.
    if(p.ankle0[1]>=428) out+=path(`M ${n(p.ankle0[0]-20)} 444 L ${n(p.ankle0[0]+28)} 443 L ${n(p.ankle0[0]-5)} 446 Z`);
    if(p.ankle1[1]>=426) out+=path(`M ${n(p.ankle1[0]-16)} 444 L ${n(p.ankle1[0]+35)} 443 L ${n(p.ankle1[0]+12)} 446 Z`);
    return out+'</g>';
  }
  global.SisyphusFigure={render,poses:poses.map((_,i)=>i),bounds:{x:20,y:55,width:480,height:395},baseline:440};
})(typeof window==='undefined'?globalThis:window);
