namespace Afterfire {
  export const WEEK_MS=1450;
  const app=new Controller();let previous=performance.now(),accumulator=0;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;let lastDraw=0;
  function frame(now:number):void {
    const delta=Math.min(200,Math.max(0,now-previous));previous=now;
    if(app.started&&!app.state.paused&&!app.modalKind&&app.state.outcome==='playing') {
      accumulator+=delta*app.state.speed;
      if(accumulator>=WEEK_MS){accumulator-=WEEK_MS;app.tick();}
    }else accumulator=0;
    // The simulation is fixed-step; render rate and display refresh cannot alter outcomes.
    if(!reduced||now-lastDraw>=66){app.renderer.draw(reduced?0:now,app.state.paused?0:accumulator/WEEK_MS);lastDraw=now;}
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // Explicit opt-in for reproducible browser tests. Not enabled in ordinary play.
  if(new URLSearchParams(location.search).has('test'))Object.defineProperty(window,'__afterfire',{value:{app,core:Afterfire},writable:false});
}
