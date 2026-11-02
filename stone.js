/* A round stone with a loaded ink edge. Geometry is an exact circle:
 * support=radius, leftAt(y)=-sqrt(r²-y²). Only the painted scars rotate.
 * Scene motion supplies rolling angle from distance travelled along the hill.
 */
(function(global) {
  'use strict';
  const INK='#181719', TAU=Math.PI*2, COUNT=192;
  const n=x=>Number(x.toFixed(3));
  const path=points=>points.map((p,i)=>`${i?'L':'M'}${n(p[0])} ${n(p[1])}`).join('')+'Z';
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  function sample(value,rotationDegrees=0) {
    const radius=Number.isFinite(Number(value))?Math.max(.001,Number(value)):1;
    const rotation=Number.isFinite(Number(rotationDegrees))?Number(rotationDegrees):0;
    const turn=rotation*Math.PI/180;
    const points=Array.from({length:COUNT},(_,i)=>{
      const a=i*TAU/COUNT;return [radius*Math.cos(a),radius*Math.sin(a)];
    });
    // A thin upper contour and broad crescent beneath make a round object feel
    // heavy. Brush pressure changes the paint, never the contact geometry.
    const inner=points.map((p,i)=>{
      const a=i*TAU/COUNT,down=Math.max(0,Math.sin(a)),left=Math.max(0,-Math.cos(a));
      const grain=(.5+.5*Math.sin(a*19+.9))*.002;
      const thickness=radius*(.006+.078*down**3+.022*down*left+grain);
      const q=1-thickness/radius;
      return [p[0]*q,p[1]*q];
    });
    const marks=[];
    for(const [start,span,depth,width] of [[-2.4,.35,.055,.008],[-.45,.21,.045,.004],[1.16,.27,.105,.01]]) {
      const a=[],b=[];
      for(let i=0;i<=14;i++) {
        const q=i/14,angle=start+span*q+turn,edge=radius*(1-depth);
        const w=radius*width*Math.sin(Math.PI*q)**.8;
        a.push([Math.cos(angle)*edge,Math.sin(angle)*edge]);
        b.push([Math.cos(angle)*(edge-w),Math.sin(angle)*(edge-w)]);
      }
      marks.push(`<path d="${path(a.concat(b.reverse()))}"/>`);
    }
    const flecks=[];
    for(let i=0;i<5;i++) {
      const a=.5+i*.47, r=radius*(.965-.012*Math.sin(i*3));
      const x=Math.cos(a)*r,y=Math.sin(a)*r,l=radius*(.011+.004*(i%2));
      flecks.push(`<path fill="#fff" d="M${n(x)} ${n(y)}l${n(-Math.sin(a)*l)} ${n(Math.cos(a)*l)} ${n(l*.12)} ${n(-l*.5)}Z"/>`);
    }
    return {support:radius,points,leftAt:y=>{
      const v=Number.isFinite(Number(y))?clamp(Number(y),-radius,radius):0;
      return -Math.sqrt(Math.max(0,radius*radius-v*v));
    },svg:`<g fill="${INK}"><circle r="${n(radius)}"/><path fill="#fff" d="${path(inner)}"/>${marks.join('')}${flecks.join('')}</g>`};
  }
  global.SisyphusStone=Object.freeze({sample});
})(typeof window==='undefined'?globalThis:window);
