/* A 43-second ink film: load, failure, recovery, transformation, revelation.
 * Feet retain their position on the hillside until a deliberate recovery step.
 * The stone's rendered contour supplies both ground and hand-contact geometry.
 * Camera movement is independent of the character's changing posture.
 */
(function (global) {
  'use strict';
  const DURATION=43, DRAWING_RATE=18, FINAL_ADVANCE=260, FINAL_CENTER=772;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const mix=(a,b,t)=>a+(b-a)*t;
  const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
  const drift=t=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10);};
  const n=x=>Number(x.toFixed(3));
  const timing=(q,kind)=>kind==='strike'?1-(1-q)**3:kind==='gather'?q*q:ease(q);
  function between(t,keys) {
    for(let i=1;i<keys.length;i++) if(t<=keys[i][0]) {
      return {a:keys[i-1],b:keys[i],q:timing(clamp((t-keys[i-1][0])/(keys[i][0]-keys[i-1][0])),keys[i][2])};
    }
    return {a:keys.at(-1),b:keys.at(-1),q:1};
  }
  function at(t,keys) {const {a,b,q}=between(t,keys);return mix(a[1],b[1],q);}
  // Long periods without progress separate short, costly bursts of movement.
  const travel=[[0,0],[3.8,0],[4.25,38,'strike'],[5.12,38],[5.55,22,'strike'],
    [8.9,22],[10.1,75],[11.7,75],[12.15,49,'strike'],[14.7,49],
    [16,88],[19.6,88],[20.35,180,'strike'],[22.65,180],
    [23.5,240,'strike'],[24.8,260],[43,260]];
  const growth=[[0,188],[3.8,188],[4.25,209],[8.9,209],[10.1,237],
    [14.7,237],[16,252],[19.6,252],[20.35,303],[22.65,303],
    [23.5,330],[24.8,334],[43,334]];
  const acting=[
    [0,'brace','smooth',.12],[1.4,'brace','smooth',.2],[3.8,'brace','gather',1],
    [4.25,'extend','strike',.2],[5.12,'extend','smooth',.62],
    [5.55,'buckle','strike',.8],[6.8,'brace','smooth',.4],[8.9,'shoulder','gather',1],
    [10.1,'extend','strike',.3],[11.7,'extend','gather',1],
    [12.15,'kneel','strike',.94],[14.7,'kneel','smooth',.65],
    [16,'drag','gather',.9],[17.7,'shoulder','smooth',.86],[19.6,'shoulder','gather',1],
    [20.35,'extend','strike',.2],[21.35,'buckle','smooth',.76],
    [22.65,'shoulder','gather',1],[23.5,'extend','strike',.24],
    [24.8,'extend','smooth',.3],[26.7,'exhausted','smooth',0],[43,'exhausted','smooth',0]
  ];
  const steps=[
    [[5.8,6.55,75,31],[12.5,13.4,65,22],[16.2,16.9,85,30],[20.6,21.2,65,34],[24.85,25.55,171,18]],
    [[7.1,7.8,230,25],[13.9,14.6,225,25],[17,17.6,235,24],[21.4,22.05,235,30],[25.7,26.3,265,15]]
  ];
  function foot(t,index,advance) {
    let anchor=index?225:65,lift=0,swing=0;
    for(const [start,end,landing,height] of steps[index]) {
      const next=at(end,travel)+landing;
      if(t>=end) anchor=next;
      else if(t>start) {
        const q=(t-start)/(end-start);
        anchor=mix(anchor,next,ease(q));lift=Math.sin(Math.PI*q)*height;swing=Math.sin(Math.PI*q);break;
      } else break;
    }
    return {ankle:[anchor-advance,(index?427:429)-lift],anchor,lift,swing};
  }
  function motion(seconds) {
    const t=clamp(Number.isFinite(seconds)?seconds:0,0,DURATION);
    return {t,advance:at(t,travel),r:at(t,growth),
      slope:at(t,[[0,-34],[22.3,-34],[23.8,-22],[25.4,0],[43,0]]),
      // A patient start and finish make the reveal a camera move, not a zoom effect.
      reveal:drift((t-29.6)/8.7),mountain:ease((t-25.3)/1.6),
      opacity:Math.min(ease(t/.7),1-ease((t-42)/1))};
  }
  function sample(seconds) {
    const base=motion(seconds),{t,advance,r}=base;
    const {a,b,q}=between(t,acting), actions=global.SisyphusFigure.actions;
    const bank={...actions,
      shoulder:{hip:[178,337],shoulder:[329,242],head:[378,282],tilt:54,knee0:[103,382],knee1:[290,380],elbow0:[390,221],elbow1:[395,347]},
      drag:{...actions.kneel,hip:[157,351],shoulder:[328,292],head:[378,335],tilt:65,knee0:[91,404],knee1:[273,415]}};
    const body={};
    // The pelvis initiates a heave; the chest and head follow its weight.
    // Each landmark still lands on its authored pose, so a hold stays still.
    const lag={hip:0,knee0:0,knee1:.018,shoulder:.055,elbow0:.035,elbow1:.045,head:.11,tilt:.11};
    for(const key in bank[a[1]]) {
      const delayed=between(Math.max(0,t-(lag[key]||0)),acting);
      const from=bank[delayed.a[1]][key],to=bank[delayed.b[1]][key];
      body[key]=Array.isArray(from)?from.map((v,i)=>mix(v,to[i],delayed.q)):mix(from,to,delayed.q);
    }
    const load=mix(a[3],b[3],q), fatigue=ease(t/26);
    const release=ease((t-24.8)/1.9);
    const feet=[foot(t,0,advance),foot(t,1,advance)];
    feet.forEach((f,i)=>{
      const base=mix(i?225:65,i?265:171,release);
      body['knee'+i][0]+=(f.ankle[0]-base)*.35;
      body['knee'+i][1]-=f.lift*.42;
    });
    const tremble=(Math.sin(t*49)+.48*Math.sin(t*31))*load**5*(.7+fatigue*1.3);
    const rotation=-(advance+(r-188)*.65)*.39;
    const shape=global.SisyphusStone.sample(r,rotation);
    return {...base,cx:r+438,cy:440-shape.support,shape,rotation,
      body,load,fatigue,tremble,feet,release};
  }
  function contacts(s) {
    // Regrip one hand at a time while the other carries the load.
    const farY=at(s.t,[[0,229],[6.8,229],[7.65,207],[10.4,207],[11.8,231],
      [12.5,252],[16.6,252],[17.5,219],[24.8,219],[26.2,351],[43,351]]);
    const nearY=at(s.t,[[0,321],[6.15,321],[6.7,292],[11.6,292],[12.25,345],
      [16.9,345],[17.7,313],[24.95,313],[26.7,365],[43,365]]);
    const detach=(start,end)=>Math.sin(Math.PI*clamp((s.t-start)/(end-start)))*19;
    const farRelease=ease((s.t-24.8)/1.4),nearRelease=ease((s.t-25.05)/1.65);
    const far=[mix(s.cx+s.shape.leftAt(farY-s.cy)-7-detach(6.8,7.65)-detach(16.6,17.5),243,farRelease),farY];
    const near=[mix(s.cx+s.shape.leftAt(nearY-s.cy)-7-detach(6.15,6.7)-detach(16.9,17.7),299,nearRelease),nearY];
    return {body:s.body,load:s.load,fatigue:s.fatigue,tremble:s.tremble,
      far,near,ankles:s.feet.map(f=>f.ankle),relaxed:[farRelease>.8,nearRelease>.8],
      relaxAmount:[farRelease,nearRelease],
      footAngles:[(s.load*19-s.feet[0].swing*28)*(1-s.release),
        (s.load*3-s.feet[1].swing*21)*(1-s.release)]};
  }
  function composition(s,viewport={width:1200,height:800}) {
    const angle=s.slope*Math.PI/180, offset=s.advance-FINAL_CENTER-FINAL_ADVANCE;
    const world=(x,y)=>[.08*((x+offset)*Math.cos(angle)-(y-440)*Math.sin(angle)),
      .08*((x+offset)*Math.sin(angle)+(y-440)*Math.cos(angle))];
    // A stable composition follows the burden; body motion never drives the camera.
    const center=world(s.r+438,440-s.r),radius=s.r*.08;
    const bodyBounds=[[0,440],[300,440],[280,140]].map(p=>world(...p));
    const left=Math.min(center[0]-radius,...bodyBounds.map(p=>p[0]));
    const right=Math.max(center[0]+radius,...bodyBounds.map(p=>p[0]));
    const top=Math.min(center[1]-radius,...bodyBounds.map(p=>p[1]));
    const bottom=Math.max(center[1]+radius,...bodyBounds.map(p=>p[1]));
    const focus=[(left+right)/2,(top+bottom)/2];
    const closeScale=Math.min(10.4,viewport.height*.78/(bottom-top),viewport.width*.88/(right-left));
    const wideScale=Math.min(.76,viewport.width*.86/(1540*.72),viewport.height*.8/850);
    const scale=Math.exp(mix(Math.log(closeScale),Math.log(wideScale),s.reveal));
    const camera=`translate(${n(viewport.width/2)} ${n(viewport.height/2)}) scale(${n(scale)}) translate(${n(-mix(focus[0],0,s.reveal))} ${n(-mix(focus[1],350,s.reveal))})`;
    return {camera,offset};
  }
  function frame(seconds,viewport) {
    const s=sample(seconds),{camera,offset}=composition(s,viewport);
    const actor=`rotate(${n(s.slope)}) scale(.08) translate(${n(offset)} -440)`;
    const groundTransform=`rotate(${n(s.slope)}) scale(.08) translate(${-FINAL_CENTER-FINAL_ADVANCE} -440)`;
    // These scuffs belong to the hillside, not to the moving character.
    const ground=`<g transform="${groundTransform}" opacity="${n(1-s.mountain)}"><defs><linearGradient id="hillside-ink" gradientUnits="userSpaceOnUse" x1="${n(s.advance-180)}" x2="${n(s.advance+s.cx+280)}" y1="440" y2="440"><stop stop-color="#181719" stop-opacity="0"/><stop offset=".14" stop-color="#181719"/><stop offset=".78" stop-color="#181719"/><stop offset="1" stop-color="#181719" stop-opacity="0"/></linearGradient></defs><g fill="url(#hillside-ink)"><path d="M -700 440 L 1850 440 L 1850 443 Q 650 442 -700 447 Z"/><path opacity=".52" d="M 31 447 l 53 -2 -37 5 Z M 213 445 l 31 0 -19 3 Z M 397 448 l 54 -3 -22 4 Z M 646 446 l 29 -1 -11 3 Z M 931 447 l 51 -2 -33 4 Z"/></g></g>`;
    const pose=s.release*4;
    const contact=contacts(s);
    return {state:s,camera,actor,ground,contacts:contact,
      figure:global.SisyphusFigure.render(pose,Math.min(s.t,27.5),contact),
      stone:`<g transform="translate(${n(s.cx)} ${n(s.cy)})">${s.shape.svg}</g>`};
  }
  function markup(seconds=.8) {
    const f=frame(seconds);
    return `<g data-film opacity="${n(f.state.opacity)}"><g data-camera transform="${f.camera}"><g data-mountain opacity="${n(f.state.mountain)}" transform="scale(.72 1)">${global.SisyphusMountain.create()}</g><g data-ground>${f.ground}</g><g data-actor transform="${f.actor}"><g data-figure>${f.figure}</g><g data-boulder>${f.stone}</g></g></g></g>`;
  }
  function mount(svg) {
    const layer=svg.querySelector('[data-scene]');layer.innerHTML=markup(.8);
    const film=layer.querySelector('[data-film]'),camera=layer.querySelector('[data-camera]'),
      mountain=layer.querySelector('[data-mountain]'),actor=layer.querySelector('[data-actor]'),
      figure=layer.querySelector('[data-figure]'),stone=layer.querySelector('[data-boulder]'),ground=layer.querySelector('[data-ground]');
    let previousDrawing=-1,previousStone='',previousGround='',viewport={width:1200,height:800},lastSeconds=.8;
    function draw(seconds) {
      lastSeconds=seconds;
      const movement=motion(seconds),drawingTime=Math.min(movement.t,27.5);
      // The drawing is held on twos/threes; the camera and dissolves run at the
      // display's refresh rate. This is also a substantial reduction in DOM work.
      film.setAttribute('opacity',n(movement.opacity));
      camera.setAttribute('transform',composition(movement,viewport).camera);
      mountain.setAttribute('opacity',n(movement.mountain));
      const drawing=Math.floor(drawingTime*DRAWING_RATE);
      if(drawing!==previousDrawing) {
        const f=frame(drawing/DRAWING_RATE,viewport);
        const stoneKey=`${f.state.r}:${f.state.rotation}`;
        const groundKey=`${f.state.advance}:${f.state.r}:${f.state.slope}:${f.state.mountain}`;
        actor.setAttribute('transform',f.actor);figure.innerHTML=f.figure;
        if(stoneKey!==previousStone) {stone.innerHTML=f.stone;previousStone=stoneKey;}
        if(groundKey!==previousGround) {ground.innerHTML=f.ground;previousGround=groundKey;}
        previousDrawing=drawing;
      }
    }
    function resize() {
      const rect=svg.getBoundingClientRect();
      if(!rect.width || !rect.height) return;
      const width=n(clamp(800*rect.width/rect.height,580,1400));
      if(width===viewport.width) return;
      viewport={width,height:800};
      svg.setAttribute('viewBox',`0 0 ${width} 800`);
      draw(lastSeconds);
    }
    if(typeof ResizeObserver!=='undefined') new ResizeObserver(resize).observe(svg);
    resize();
    return draw;
  }
  global.SisyphusScene={DURATION,DRAWING_RATE,sample,frame,markup,mount};
})(typeof window==='undefined'?globalThis:window);
