/* A 36-second ink film: effort, accumulation, arrival, revelation.
 * World coordinates stay fixed while the camera follows the climb and retreats.
 * Pure sample()/frame() functions also generate the no-JavaScript poster.
 */
(function (global) {
  'use strict';
  const DURATION = 36;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const mix = (a, b, x) => a + (b - a) * x;
  const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const n = x => Number(x.toFixed(3));
  const at = (t, keys) => {
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const [ta, a] = keys[i - 1], [tb, b] = keys[i];
        return mix(a, b, ease((t - ta) / (tb - ta)));
      }
    }
    return keys[keys.length - 1][1];
  };
  // Each attempt has its own anticipation, hold, thrust, and partial retreat.
  const posture = [[0,.15],[1.2,.4],[2.8,1],[3.6,1.08],[4.9,2.8],
    [5.6,3],[6.5,1.4],[7.2,1.1],[8.7,1.9],[10.2,2],[11.3,2.08],
    [12.7,2.95],[13.4,3],[14.4,2.25],[15.3,2],[16.7,1.2],
    [17.8,1.1],[19.2,2.7],[20.6,3],[21.9,3.02],[23.7,4],[36,4]];
  const ascent = [[0,0],[2.8,.02],[3.5,.02],[5.4,.22],[6.9,.17],
    [10,.2],[11.3,.2],[13.4,.46],[15.1,.4],[17.6,.45],
    [20.6,.86],[22.8,1],[36,1]];
  const growth = [[0,188],[3.5,192],[5.6,221],[10,229],[13.6,268],
    [17.7,274],[21.7,318],[23,322],[36,322]];
  function sample(seconds) {
    const t = clamp(seconds, 0, DURATION);
    const progress = at(t, ascent), pose = at(t, posture);
    const reveal = ease((t - 24) / 7.8);
    const slope = at(t, [[0,-30],[6,-33],[13,-38],[18,-42],[21,-26],[23.5,0],[36,0]]);
    const r = at(t, growth), cx = r + 438;
    const tremble = (Math.sin(t * 43) + Math.sin(t * 29)) * .65 *
      (t < 22 ? Math.sin(Math.PI * (t % 3.8) / 3.8) ** 6 : 0);
    return { t, pose, progress, r, cx, cy: 440-r, slope, reveal,
      rotation: -progress * 560,
      x: -152 * (1-progress), y: 225 * (1-progress),
      tremble, mountain: ease((t-22.7)/2.1),
      opacity: Math.min(ease(t/.7), 1-ease((t-35)/1)) };
  }
  function curve(points) {
    let d = `M ${points[0].map(n).join(' ')}`;
    for (let i=0;i<points.length;i++) {
      const a=points[(i+points.length-1)%points.length], b=points[i],
        c=points[(i+1)%points.length], e=points[(i+2)%points.length];
      d+=` C ${n(b[0]+(c[0]-a[0])/6)} ${n(b[1]+(c[1]-a[1])/6)} ${n(c[0]-(e[0]-b[0])/6)} ${n(c[1]-(e[1]-b[1])/6)} ${n(c[0])} ${n(c[1])}`;
    }
    return d+' Z';
  }
  function boulder(s) {
    const outer=[], inner=[], turn=s.rotation*Math.PI/180;
    // Uneven loaded-brush rim, with its darkest edge bearing the weight.
    for(let i=0;i<32;i++) {
      const a=i*Math.PI/16, rr=1+.014*Math.sin(3*a+turn)+.009*Math.cos(7*a+turn);
      const thickness=.008+.033*(.5+.5*Math.sin(a-.3))**3+.006*(.5+.5*Math.sin(11*a+turn));
      outer.push([Math.cos(a)*s.r*rr, Math.sin(a)*s.r]);
      inner.push([Math.cos(a)*s.r*(rr-thickness),Math.sin(a)*s.r*(1-thickness)]);
    }
    return `<g transform="translate(${n(s.cx)} ${n(s.cy)})"><path fill="#181719" d="${curve(outer)}"/><path fill="#fff" d="${curve(inner)}"/><g transform="rotate(${n(s.rotation)})" fill="#181719"><path opacity=".8" d="M ${n(-s.r*.57)} ${n(-s.r*.75)} Q ${n(-s.r*.8)} ${n(-s.r*.56)} ${n(-s.r*.83)} ${n(-s.r*.32)} Q ${n(-s.r*.81)} ${n(-s.r*.58)} ${n(-s.r*.57)} ${n(-s.r*.75)} Z"/><path d="M ${n(s.r*.58)} ${n(s.r*.75)} Q ${n(s.r*.75)} ${n(s.r*.61)} ${n(s.r*.81)} ${n(s.r*.42)} Q ${n(s.r*.77)} ${n(s.r*.64)} ${n(s.r*.58)} ${n(s.r*.75)} Z"/></g></g>`;
  }
  function contacts(s) {
    const release=ease((s.t-21.9)/1.8);
    const yFar=mix(229,351,release), yNear=mix(321,365,release);
    const tangent=y=>s.cx-Math.sqrt(Math.max(0,s.r*s.r-(y-s.cy)**2))-7;
    const handFar=[mix(tangent(yFar),243,release),yFar];
    const handNear=[mix(tangent(yNear),299,release),yNear];
    // Replant one foot at a time; the other continues to carry the load.
    function step(start,end,lift,offset) {
      const q=clamp((s.t-start)/(end-start));
      return [offset*Math.sin(Math.PI*q),-lift*Math.sin(Math.PI*q)];
    }
    let a=[0,0],b=[0,0];
    [[5.9,7.0,28,24],[13.5,14.8,36,32],[17,18,22,18]].forEach(k=>{
      const v=step(...k); a=[a[0]+v[0],a[1]+v[1]];
    });
    [[8,9,24,18],[15,16.2,31,25],[20.8,21.8,17,15]].forEach(k=>{
      const v=step(...k); b=[b[0]+v[0],b[1]+v[1]];
    });
    return {far:handFar,near:handNear,
      ankles:[[at(s.t,[[0,65],[3.5,65],[5.6,15],[7,75],[11.3,75],[13.4,15],[14.8,75],[17.6,75],[20.6,25],[21.8,70],[23.7,171]])+a[0],429+a[1]],[at(s.t,[[0,225],[3.5,225],[5.6,175],[9,235],[11.3,235],[13.4,180],[16.2,245],[17.6,245],[20.6,185],[21.8,225],[23.7,265]])+b[0],427+b[1]]]};
  }
  function frame(seconds) {
    const s=sample(seconds), angle=s.slope*Math.PI/180;
    const world=(x,y)=>[s.x+.08*((x-s.cx)*Math.cos(angle)-(y-440)*Math.sin(angle)),
      s.y+.08*((x-s.cx)*Math.sin(angle)+(y-440)*Math.cos(angle))];
    const center=world(s.cx,s.cy), radius=s.r*.08;
    const body=[[30,440],[310,440],[150,280],[290,130+Math.min(s.pose,2)*55],[510,220]].map(p=>world(...p));
    const left=Math.min(center[0]-radius,...body.map(p=>p[0]));
    const right=Math.max(center[0]+radius,...body.map(p=>p[0]));
    const top=Math.min(center[1]-radius,...body.map(p=>p[1]));
    const bottom=Math.max(center[1]+radius,...body.map(p=>p[1]));
    const focus=[(left+right)/2,(top+bottom)/2];
    const closeScale=Math.min(10.8,640/(bottom-top),960/(right-left));
    const scale=Math.exp(mix(Math.log(closeScale),Math.log(.76),s.reveal));
    const targetX=mix(focus[0],0,s.reveal), targetY=mix(focus[1],330,s.reveal);
    const camera=`translate(600 400) scale(${n(scale)}) translate(${n(-targetX)} ${n(-targetY)})`;
    const actor=`translate(${n(s.x)} ${n(s.y)}) rotate(${n(s.slope)}) scale(.08) translate(${n(-s.cx)} -440)`;
    const ground=`<path fill="#181719" opacity="${n(1-s.mountain)}" d="M -160 449 Q 310 437 ${n(s.cx+130)} 439 L ${n(s.cx+255)} 443 Q 350 443 -160 449 Z"/>`;
    const dust=s.t<22?`<path fill="#181719" opacity="${n(Math.abs(s.tremble)*.45)}" d="M 37 453 l -15 7 8 -2 Z M 183 457 l -9 5 14 -3 Z M 7 465 l -7 4 12 -2 Z"/>`:'';
    return {state:s,camera,actor,
      figure:global.SisyphusFigure.render(s.pose,Math.min(s.t,24),contacts(s)),
      stone:boulder(s),ground:ground+dust};
  }
  function markup(seconds=0.8) {
    const f=frame(seconds);
    return `<g data-film opacity="${n(f.state.opacity)}"><g data-camera transform="${f.camera}"><g data-mountain opacity="${n(f.state.mountain)}" transform="scale(.72 1)">${global.SisyphusMountain.create()}</g><g data-actor transform="${f.actor}"><g data-ground>${f.ground}</g><g data-figure>${f.figure}</g><g data-boulder>${f.stone}</g></g></g></g>`;
  }
  function mount(svg) {
    const layer=svg.querySelector('[data-scene]');
    layer.innerHTML=markup(.8);
    const film=layer.querySelector('[data-film]'), camera=layer.querySelector('[data-camera]'),
      mountain=layer.querySelector('[data-mountain]'), actor=layer.querySelector('[data-actor]'),
      figure=layer.querySelector('[data-figure]'), stone=layer.querySelector('[data-boulder]'),
      ground=layer.querySelector('[data-ground]');
    let resting=false;
    return seconds=>{
      const f=frame(seconds);
      film.setAttribute('opacity',n(f.state.opacity));
      camera.setAttribute('transform',f.camera);
      mountain.setAttribute('opacity',n(f.state.mountain));
      actor.setAttribute('transform',f.actor);
      if(!resting || seconds<25) {
        figure.innerHTML=f.figure; stone.innerHTML=f.stone; ground.innerHTML=f.ground;
      }
      resting=seconds>=25;
    };
  }
  global.SisyphusScene={DURATION,sample,frame,markup,mount};
})(typeof window==='undefined'?globalThis:window);
