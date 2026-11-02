/* A human body, a growing burden, and one fixed hillside.
 * World coordinates are ink-drawing pixels. Bone lengths never follow scale.
 * Only the camera widens; foot contacts and the mountain stay in the world.
 */
(function(global) {
  'use strict';
  const DURATION=56,DRAWING_RATE=24;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const mix=(a,b,t)=>a+(b-a)*t;
  const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
  const drift=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
  const n=x=>Number(x.toFixed(3));
  const rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI;
  const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],dist=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
  function at(t,keys) {
    for(let i=1;i<keys.length;i++) if(t<=keys[i][0]) {
      const a=keys[i-1],b=keys[i],u=clamp((t-a[0])/(b[0]-a[0]));
      return mix(a[1],b[1],b[2]==='linear'?u:b[2]==='drive'?1-(1-u)**3:ease(u));
    }
    return keys[keys.length-1][1];
  }
  // The same ground function supplies soles, rolling contact, and the visible hill.
  function ground(x) {
    if(x>=-1050) return {y:0,slope:0};
    if(x>=-1550) {const u=-x-1050;return {y:.62*u*u/1000,slope:-.62*u/500};}
    if(x>=-2200) return {y:155+(-x-1550)*.62,slope:-.62};
    if(x>=-3200) {const u=x+3200;return {y:978-.22*u-.0002*u*u,slope:-.22-.0004*u};}
    return {y:978+(-x-3200)*.22,slope:-.22};
  }
  const travel=[[0,-3000],[10,-2300,'linear'],[18,-1700,'linear'],[20,-1650],
    [21,-1560,'drive'],[22,-1600],[24,-1500],[26,-1300,'drive'],[28,-1270],
    [30,-1050,'drive'],[31,-1100],[33,-920],[35,-700,'drive'],[37,-360],[39,0],[56,0]];
  const growth=[[0,125],[10,170],[18,270],[24,390],[30,500],[35,600],[39,650],[56,650]];
  const effort=[[0,.08],[7,.18],[13,.36],[18,.55],[20,.92],[21,.35],[22,.8],[24,.94],
    [26,.4],[28,.98],[30,.38],[31,.8],[33,1],[35,.48],[37,.95],[39,.45],[41,0],[56,0]];
  function burden(t) {
    const x=at(t,travel),r=at(t,growth),g=ground(x),angle=Math.atan(g.slope);
    return {x,r,angle,contact:[x,g.y],center:[x+Math.sin(angle)*r,g.y-Math.cos(angle)*r]};
  }
  // Integrate ds/r plus the changing tangent. The latter accounts for the
  // center following an offset curve; growth alone cannot turn the stone.
  const turnTable=[0],turnStep=1/240;
  for(let i=1;i<=DURATION/turnStep;i++) {
    const a=burden((i-1)*turnStep),b=burden(i*turnStep);
    turnTable.push(turnTable[i-1]+Math.sign(b.x-a.x)*dist(a.contact,b.contact)/((a.r+b.r)/2)+(b.angle-a.angle));
  }
  function rotation(t) {
    const index=clamp(t/turnStep,0,turnTable.length-1),lo=Math.floor(index),hi=Math.min(turnTable.length-1,lo+1);
    return deg(mix(turnTable[lo],turnTable[hi],index-lo));
  }
  function acting(t) {
    const release=ease((t-39.8)/1.4),load=at(t,effort);
    const lean=at(t,[[0,18],[10,29],[18,48],[20,69],[21,48],[22,73],[24,74],[26,46],
      [28,78],[30,49],[31,75],[33,69],[35,43],[37,66],[39,52],[39.8,52],[41.2,11],[56,11]]);
    const height=at(t,[[0,207],[10,202],[18,190],[20,166],[21,203],[22,154],[24,160],
      [26,205],[28,151],[30,205],[31,158],[33,167],[35,208],[37,178],[39,195],[39.8,195],[41.2,204],[56,204]]);
    const phase=t<18?t/1.08:18/1.08+(t-18)/1.13;
    return {lean,height,load,release,phase,armReach:mix(105,118,ease(t/32)),
      handRise:mix(-50,32,ease(t/22)),fatigue:ease(t/39),
      bulk:mix(1,.22,ease((t-7)/31)),silhouette:.88*ease((t-11)/20),
      twist:(Math.sin(phase*Math.PI)*.24)*(1-release)};
  }
  // Find a point on the back of the stone at a reachable height above the hill.
  function gripAt(b,height) {
    const contactAngle=b.angle+Math.PI/2;
    let lo=contactAngle+.025,hi=contactAngle+Math.PI-.025;
    for(let i=0;i<16;i++) {
      const a=(lo+hi)/2,p=[b.center[0]+Math.cos(a)*b.r,b.center[1]+Math.sin(a)*b.r];
      if(ground(p[0]).y-p[1]<height) lo=a;else hi=a;
    }
    const angle=(lo+hi)/2;
    return {angle,point:[b.center[0]+Math.cos(angle)*b.r,b.center[1]+Math.sin(angle)*b.r]};
  }
  function anchor(t) {
    const b=burden(t),a=acting(t),lean=rad(a.lean),forward=Math.sin(lean)*135,up=Math.cos(lean)*135;
    let gripHeight=clamp(a.height+up+b.angle*(forward+a.armReach)+a.handRise,85,2*b.r*.98);
    let grip,hipX;
    for(let i=0;i<5;i++) {
      grip=gripAt(b,gripHeight);hipX=grip.point[0]-forward-a.armReach;
      const difference=ground(hipX).y-ground(grip.point[0]).y;
      gripHeight=clamp(a.height+up-difference+a.handRise,85,2*b.r*.98);
    }
    // Once released, the pelvis remains where the last push left it.
    if(t>39) {
      const last=anchor(39),restX=last.hipX-30;
      hipX=mix(last.hipX,restX,a.release);grip=last.grip;
    }
    return {b,a,grip,hipX,hipY:ground(hipX).y-a.height};
  }
  const stepEvents=[[],[]];
  for(let start=.25,i=0;start<17.3;start+=1.08,i++) stepEvents[i%2].push([start,start+.62]);
  const late=[17.55,18.65,20.25,21.55,22.6,23.65,24.7,25.6,26.7,27.9,29.0,30.1,31.25,32.4,33.5,34.5,35.45,36.25,37.05,37.85,38.65,39.45,40.25];
  late.forEach((start,i)=>stepEvents[i%2].push([start,start+(start>35?.58:.72)]));
  const initialHip=anchor(0).hipX;
  const stepBanks=stepEvents.map((events,index)=>events.map(([start,end])=>({start,end,
    x:anchor(Math.min(end,39)).hipX+(end>39?(index?55:-50):end<18?14:48)})));
  function footState(t,index) {
    const events=stepBanks[index];let x=initialHip+(index?50:-50),last=-.6;
    for(const step of events) {
      if(t>=step.end) {x=step.x;last=step.end;continue;}
      if(t>step.start) {
        const u=clamp((t-step.start)/(step.end-step.start)),q=drift(u),
          nextX=mix(x,step.x,q),lift=Math.sin(Math.PI*u)**.85*(t<18?43:mix(34,22,ease((t-18)/21)));
        return {x:nextX,y:ground(nextX).y-lift,angle:Math.atan(ground(nextX).slope),
          roll:mix(14,-10,ease(u)),pivot:mix(30,-13,ease(u)),lift,stance:false,phase:u};
      }
      const u=clamp((t-last)/(step.start-last));
      return {x,y:ground(x).y,angle:Math.atan(ground(x).slope),
        roll:u<.2?-10*(1-ease(u/.2)):u>.73?14*ease((u-.73)/.27):0,
        pivot:u<.5?-13:30,lift:0,stance:true,phase:u};
    }
    return {x,y:ground(x).y,angle:Math.atan(ground(x).slope),roll:0,pivot:-13,lift:0,stance:true,phase:1};
  }
  function solve(a,c,l1,l2,side=1) {
    const dx=c[0]-a[0],dy=c[1]-a[1],distance=Math.max(.0001,Math.hypot(dx,dy)),
      d=clamp(distance,Math.abs(l1-l2)+.001,l1+l2-.001),
      along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along)),
      ux=dx/distance,uy=dy/distance;
    return [a[0]+ux*along-uy*height*side,a[1]+uy*along+ux*height*side];
  }
  function shoulderFor(hip,target,desired) {
    if(dist(desired,target)<=138) return desired;
    const options=[solve(hip,target,135,138,1),solve(hip,target,135,138,-1)];
    return dist(options[0],desired)<dist(options[1],desired)?options[0]:options[1];
  }
  function sample(seconds,includeShape=true) {
    const t=clamp(Number.isFinite(seconds)?seconds:0,0,DURATION),held=Math.min(t,41.2),root=anchor(held),{a,b}=root;
    const feet=[footState(held,0),footState(held,1)];
    const ankles=[],angles=[],pivots=[],ends=[];
    feet.forEach((f,i)=>{
      const offset=f.pivot,soleHeight=i?13:11,pivot=[f.x+Math.cos(f.angle)*offset,f.y+Math.sin(f.angle)*offset],
        base=[pivot[0]-offset,pivot[1]-soleHeight],angle=deg(f.angle)+f.roll;
      ankles.push(base);angles.push(angle);pivots.push(offset);
      ends.push(global.SisyphusFigure.pivotFoot(base,i===1,angle,offset).ankle);
    });
    // Preserve both planted leg lengths. The pelvis lowers under a long stride.
    const lowX=Math.max(...ends.map(p=>p[0]-203)),highX=Math.min(...ends.map(p=>p[0]+203));
    const hipX=clamp(root.hipX,lowX,highX);
    let hipY=root.hipY+Math.sin(a.phase*Math.PI*2)*3*(1-a.release);
    ends.forEach(p=>{const dx=p[0]-hipX;hipY=Math.max(hipY,p[1]-Math.sqrt(Math.max(1,211*211-dx*dx)));});
    const hip=[hipX,hipY],lean=rad(a.lean),desired=add(hip,[Math.sin(lean)*135,-Math.cos(lean)*135]);
    const gripAngle=root.grip.angle,separation=mix(38,24,ease(held/32));
    const grips=[-1,1].map((side,i)=>{
      const angle=gripAngle+side*separation/(2*b.r),cycle=((held-.6-i*1.7)%3.4+3.4)%3.4,
        detach=held>.6&&held<18&&cycle<.48?Math.sin(Math.PI*cycle/.48)**2*10*ease((18-held)/.2):0;
      return [b.center[0]+Math.cos(angle)*(b.r+detach),b.center[1]+Math.sin(angle)*(b.r+detach)];
    });
    let shoulder=shoulderFor(hip,[(grips[0][0]+grips[1][0])/2,(grips[0][1]+grips[1][1])/2],desired);
    // A hand uncurls and leaves the burden only after the last drive has settled.
    const release0=ease((held-39)/.5),release1=ease((held-39.25)/.55);
    if(a.release>0) shoulder=desired;
    const rests=[add(shoulder,[-23,146]),add(shoulder,[30,149])];
    const hands=grips.map((p,i)=>p.map((v,k)=>mix(v,rests[i][k],i?release1:release0)));
    const body={hip,shoulder,head:add(shoulder,[mix(25,34,ease(a.lean/80)),mix(-31,-18,ease(a.lean/80))]),
      tilt:mix(2,38,ease(a.lean/85))+a.release*39,
      knee0:solve(hip,ends[0],105,110,-1),knee1:solve(hip,ends[1],105,110,-1),
      elbow0:solve(shoulder,hands[0],78,82,1),elbow1:solve(shoulder,hands[1],78,82,1)};
    const turn=rotation(held),shape=includeShape?global.SisyphusStone.sample(b.r,turn):null;
    const contact={solved:true,body,far:hands[0],near:hands[1],ankles,footAngles:angles,footPivots:pivots,
      relaxAmount:[release0,release1],load:a.load,fatigue:a.fatigue,bulk:a.bulk,silhouette:a.silhouette,twist:a.twist};
    return {t,body,feet,contact,r:b.r,cx:b.center[0],cy:b.center[1],shape,rotation:turn,stoneContact:b.contact,
      release:a.release,load:a.load,advance:b.x+3000,
      reveal:drift((t-43)/8.7),mountain:ease((t-39.5)/1.7),opacity:Math.min(ease(t/.8),1-ease((t-55)/1))};
  }
  function composition(s,viewport={width:1200,height:800}) {
    // Follow the terrain and the intended travel, never the lifting foot or the
    // solved body's gait bob. The burden can grow beyond the top/right frame.
    const root=anchor(Math.min(s.t,41.2)),b=root.b,
      authored=at(s.t,[[0,1.35],[10,1.2],[18,1.04],[26,.86],[33,.73],[39,.61],[56,.61]]),
      closeScale=authored*Math.min(1,viewport.width/1000)**.65,
      figurePosition=mix(.36,.24,ease((b.r-125)/400)),
      focus=[root.hipX+viewport.width*(.5-figurePosition)/closeScale,
        ground(root.hipX).y-viewport.height*.22/closeScale],
      wideScale=Math.min(viewport.width*.9/(1540*8.64),viewport.height*.88/10800),
      scale=Math.exp(mix(Math.log(closeScale),Math.log(wideScale),s.reveal));
    return `translate(${n(viewport.width/2)} ${n(viewport.height/2)}) scale(${Number(scale.toFixed(6))}) translate(${n(-mix(focus[0],0,s.reveal))} ${n(-mix(focus[1],4200,s.reveal))})`;
  }
  const terrainPoints=[];for(let x=-5200;x<=800;x+=25) terrainPoints.push([x,ground(x).y]);
  const terrainPath=terrainPoints.map((p,i)=>`${i?'L':'M'}${n(p[0])} ${n(p[1])}`).join(' ');
  function groundMarkup(s) {
    return `<g opacity="${n(1-s.mountain)}"><defs><linearGradient id="hillside-ink" gradientUnits="userSpaceOnUse" x1="${n(s.body.hip[0]-330)}" x2="${n(s.cx+s.r+180)}"><stop stop-color="#181719" stop-opacity="0"/><stop offset=".16" stop-color="#181719"/><stop offset=".8" stop-color="#181719"/><stop offset="1" stop-color="#181719" stop-opacity="0"/></linearGradient></defs><path d="${terrainPath}" fill="none" stroke="url(#hillside-ink)" stroke-width="3.2" stroke-linecap="round"/></g>`;
  }
  function frame(seconds,viewport) {
    const state=sample(seconds);
    return {state,camera:composition(state,viewport),actor:'translate(0 0)',contacts:state.contact,
      ground:groundMarkup(state),figure:global.SisyphusFigure.render(0,Math.min(state.t,41.2),state.contact),
      stone:`<g transform="translate(${n(state.cx)} ${n(state.cy)})">${state.shape.svg}</g>`};
  }
  function markup(seconds=.8) {
    const f=frame(seconds);
    return `<g data-film="" opacity="${n(f.state.opacity)}"><g data-camera="" transform="${f.camera}"><g data-mountain="" opacity="${n(f.state.mountain)}" transform="scale(8.64 12)">${global.SisyphusMountain.create()}</g><g data-ground="">${f.ground}</g><g data-actor=""><g data-figure="">${f.figure}</g><g data-boulder="">${f.stone}</g></g></g></g>`;
  }
  function mount(svg) {
    const layer=svg.querySelector('[data-scene]');layer.innerHTML=markup(.8);
    const film=layer.querySelector('[data-film]'),camera=layer.querySelector('[data-camera]'),mountain=layer.querySelector('[data-mountain]'),
      figure=layer.querySelector('[data-figure]'),stone=layer.querySelector('[data-boulder]'),hill=layer.querySelector('[data-ground]');
    let previousDrawing=-1,previousStone='',viewport={width:1200,height:800},lastSeconds=.8;
    function draw(seconds) {
      lastSeconds=seconds;
      const drawing=Math.floor(Math.min(seconds,41.25)*DRAWING_RATE);
      if(drawing!==previousDrawing) {
        const f=frame(drawing/DRAWING_RATE,viewport);
        figure.innerHTML=f.figure;hill.innerHTML=f.ground;
        const key=`${f.state.r}:${f.state.rotation}`;if(key!==previousStone){stone.innerHTML=f.stone;previousStone=key;}
        previousDrawing=drawing;
      }
      const t=clamp(seconds,0,DURATION),state={t,reveal:drift((t-43)/8.7)};
      camera.setAttribute('transform',composition(state,viewport));
      film.setAttribute('opacity',n(Math.min(ease(t/.8),1-ease((t-55)/1))));
      mountain.setAttribute('opacity',n(ease((t-39.5)/1.7)));
    }
    function resize() {
      const rect=svg.getBoundingClientRect();if(!rect.width||!rect.height)return;
      const width=n(clamp(800*rect.width/rect.height,580,1400));if(width===viewport.width)return;
      viewport={width,height:800};svg.setAttribute('viewBox',`0 0 ${width} 800`);draw(lastSeconds);
    }
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(svg);
    draw(.8);resize();return draw;
  }
  global.SisyphusScene={DURATION,DRAWING_RATE,ground,sample,frame,markup,mount};
})(typeof window==='undefined'?globalThis:window);
