namespace Afterfire {
  const COLORS:Record<Terrain,string>={city:'#a5a181',town:'#999978',farm:'#889062',forest:'#526f5c',mountain:'#787969'};
  function pathPoly(c:CanvasRenderingContext2D,p:Point[]):void {c.beginPath();p.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();}
  function line(c:CanvasRenderingContext2D,a:Point,b:Point):void {c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
  function circle(c:CanvasRenderingContext2D,x:number,y:number,r:number,color:string):void {c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
  function mountain(c:CanvasRenderingContext2D,x:number,y:number,r:number,shade:number):void {
    c.fillStyle=`rgba(28,43,38,${shade})`;c.beginPath();c.moveTo(x-r,y+r*.4);c.lineTo(x+r*.05,y-r);c.lineTo(x+r*1.2,y+r*.6);c.closePath();c.fill();
    c.fillStyle='rgba(219,214,179,.16)';c.beginPath();c.moveTo(x-r,y+r*.4);c.lineTo(x+r*.05,y-r);c.lineTo(x+r*.14,y+r*.1);c.closePath();c.fill();
    c.strokeStyle='rgba(228,219,185,.18)';c.lineWidth=.8;c.beginPath();c.moveTo(x-r*.7,y+r*.3);c.lineTo(x,y-r*.65);c.lineTo(x+r*.65,y+r*.15);c.stroke();
  }
  export class Renderer {
    canvas:HTMLCanvasElement;ctx:CanvasRenderingContext2D;cache:HTMLCanvasElement;
    state:State;selected=24;selectedUnit:number|null=null;hover=-1;layer:Layer='terrain';
    zoom=1;pan={x:0,y:0};width=1;height=1;scale=1;ox=0;oy=0;time=0;
    onSelect:(id:number)=>void=()=>{};onUnit:(id:number)=>void=()=>{};onHover:(id:number,x:number,y:number)=>void=()=>{};
    private observer:ResizeObserver;private down:{x:number;y:number;panX:number;panY:number}|null=null;
    private dragged=false;private positions=new Map<number,Point>();
    constructor(parent:HTMLElement,state:State) {
      this.state=state;this.canvas=document.createElement('canvas');this.canvas.id='world';this.canvas.setAttribute('aria-label','互动战略地图。点击地区查看民生；选择部队后点击地区下达行军命令。');this.canvas.setAttribute('role','img');parent.prepend(this.canvas);
      this.ctx=this.canvas.getContext('2d',{alpha:false})!;this.cache=document.createElement('canvas');this.cache.width=2200;this.cache.height=1520;
      this.bake();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(parent);this.resize();
      this.canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;this.down={x:e.clientX,y:e.clientY,panX:this.pan.x,panY:this.pan.y};this.dragged=false;this.canvas.setPointerCapture(e.pointerId);});
      this.canvas.addEventListener('pointermove',e=>{
        if(this.down){const dx=e.clientX-this.down.x,dy=e.clientY-this.down.y;if(Math.hypot(dx,dy)>5)this.dragged=true;if(this.dragged){this.pan={x:this.down.panX+dx,y:this.down.panY+dy};this.limitPan();this.hover=-1;this.onHover(-1,0,0);return;}}
        const rect=this.canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;const w=this.toWorld(x,y);const d=this.state.districts.find(d=>contains(d.polygon,w.x,w.y));this.hover=d?.id??-1;this.onHover(this.hover,x,y);
      });
      this.canvas.addEventListener('pointerup',e=>{
        if(!this.down)return;const moved=this.dragged;this.down=null;
        if(moved)return;const rect=this.canvas.getBoundingClientRect(),w=this.toWorld(e.clientX-rect.left,e.clientY-rect.top);
        for(const [id,p] of [...this.positions].reverse())if(distance(p,w)<19){this.onUnit(id);return;}
        const d=this.state.districts.find(d=>contains(d.polygon,w.x,w.y));if(d)this.onSelect(d.id);
      });
      this.canvas.addEventListener('pointercancel',()=>this.down=null);
      this.canvas.addEventListener('pointerleave',()=>{this.hover=-1;this.onHover(-1,0,0);});
      this.canvas.addEventListener('wheel',e=>{e.preventDefault();const r=this.canvas.getBoundingClientRect();this.setZoom(this.zoom*(e.deltaY<0?1.13:1/1.13),e.clientX-r.left,e.clientY-r.top);},{passive:false});
      this.canvas.addEventListener('contextmenu',e=>{e.preventDefault();this.onUnit(-1);});
    }
    destroy():void {this.observer.disconnect();this.canvas.remove();}
    replace(state:State):void {this.state=state;this.selected=24;this.selectedUnit=null;this.zoom=1;this.pan={x:0,y:0};this.bake();}
    private resize():void {
      const rect=this.canvas.parentElement!.getBoundingClientRect();this.width=rect.width;this.height=rect.height;
      const ratio=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.round(this.width*ratio);this.canvas.height=Math.round(this.height*ratio);this.canvas.style.width=this.width+'px';this.canvas.style.height=this.height+'px';this.limitPan();
    }
    private transform():void {this.scale=Math.min(this.width/1100,this.height/760)*this.zoom;this.ox=(this.width-1100*this.scale)/2+this.pan.x;this.oy=(this.height-760*this.scale)/2+this.pan.y;}
    toWorld(x:number,y:number):Point {this.transform();return {x:(x-this.ox)/this.scale,y:(y-this.oy)/this.scale};}
    toScreen(p:Point):Point {this.transform();return {x:p.x*this.scale+this.ox,y:p.y*this.scale+this.oy};}
    setZoom(value:number,x=this.width/2,y=this.height/2):void {const before=this.toWorld(x,y);this.zoom=clamp(value,1,2.7);const after=this.toScreen(before);this.pan.x+=x-after.x;this.pan.y+=y-after.y;this.limitPan();}
    fit():void {this.zoom=1;this.pan={x:0,y:0};}
    private limitPan():void {const mx=this.width*(this.zoom-1)*.48+70,my=this.height*(this.zoom-1)*.48+55;this.pan.x=clamp(this.pan.x,-mx,mx);this.pan.y=clamp(this.pan.y,-my,my);}
    private bake():void {
      const c=this.cache.getContext('2d')!;c.setTransform(2,0,0,2,0,0);c.clearRect(0,0,1100,760);
      const water=c.createLinearGradient(0,0,1100,760);water.addColorStop(0,'#182f32');water.addColorStop(1,'#315152');c.fillStyle=water;c.fillRect(0,0,1100,760);
      const rng={rng:this.state.seed^0x123abc};
      c.strokeStyle='rgba(160,196,181,.065)';c.lineWidth=.6;
      for(let y=10;y<760;y+=23){c.beginPath();for(let x=0;x<1100;x+=8){const yy=y+Math.sin(x*.018+y)*4;x?c.lineTo(x,yy):c.moveTo(x,yy);}c.stroke();}
      for(let ring=4;ring>=1;ring--){c.save();c.translate(550,370);c.scale(1+ring*.014,1+ring*.014);c.translate(-550,-370);pathPoly(c,LAND);c.strokeStyle=`rgba(172,199,179,${.03+(.014*(5-ring))})`;c.lineWidth=1.2;c.stroke();c.restore();}
      pathPoly(c,LAND);c.shadowBlur=26;c.shadowColor='#071a1c';c.fillStyle='#63775e';c.fill();c.shadowBlur=0;
      for(const d of this.state.districts) {
        c.save();pathPoly(c,d.polygon);c.clip();c.fillStyle=COLORS[d.terrain];c.fillRect(0,0,1100,760);
        const light=c.createLinearGradient(d.x-90,d.y-100,d.x+90,d.y+100);light.addColorStop(0,'rgba(241,230,177,.15)');light.addColorStop(1,'rgba(13,32,31,.20)');c.fillStyle=light;c.fillRect(0,0,1100,760);
        for(let i=0;i<150;i++){const x=d.x+(rand(rng)-.5)*260,y=d.y+(rand(rng)-.5)*220;c.fillStyle=rand(rng)<.5?'rgba(255,240,182,.055)':'rgba(11,36,30,.07)';c.fillRect(x,y,rand(rng)*3+.5,rand(rng)*2+.5);}
        if(d.terrain==='mountain') {
          for(let i=0;i<12;i++)mountain(c,d.x+(rand(rng)-.5)*160,d.y+(rand(rng)-.5)*130,16+rand(rng)*23,.10+rand(rng)*.13);
          c.strokeStyle='rgba(38,51,43,.16)';c.lineWidth=.65;
          for(let j=0;j<9;j++){c.beginPath();for(let x=d.x-110;x<d.x+110;x+=4){const y=d.y-85+j*20+Math.sin(x*.034+j*.6)*13;c.lineTo(x,y);}c.stroke();}
        }else if(d.terrain==='forest') {
          for(let i=0;i<65;i++){const x=d.x+(rand(rng)-.5)*180,y=d.y+(rand(rng)-.5)*145,r=2+rand(rng)*5;circle(c,x+2,y+2,r+1,'rgba(13,31,26,.14)');c.fillStyle=rand(rng)<.5?'rgba(34,65,45,.30)':'rgba(153,167,102,.18)';c.beginPath();c.moveTo(x-r,y+r);c.lineTo(x,y-r*1.6);c.lineTo(x+r,y+r);c.fill();}
        }else {
          for(let i=0;i<17;i++){const x=d.x+(rand(rng)-.5)*210,y=d.y+(rand(rng)-.5)*160;c.save();c.translate(x,y);c.rotate(-.23);const w=14+rand(rng)*25,h=8+rand(rng)*15;c.fillStyle=rand(rng)<.5?'rgba(186,171,106,.22)':'rgba(45,92,52,.16)';c.fillRect(0,0,w,h);c.strokeStyle='rgba(208,195,145,.14)';c.lineWidth=.5;for(let yy=2;yy<h;yy+=3)line(c,{x:0,y:yy},{x:w,y:yy});c.restore();}
        }
        c.restore();
      }
      c.save();pathPoly(c,LAND);c.clip();
      // The river bends organically; crossing costs use the same river function.
      for(const [width,col] of [[17,'rgba(33,66,61,.35)'],[10,'#274c55'],[6,'#47757b'],[1,'rgba(165,193,170,.37)']] as [number,string][]) {
        c.strokeStyle=col;c.lineWidth=width;c.beginPath();for(let y=40;y<730;y+=5)c.lineTo(riverX(y),y);c.stroke();
      }
      c.restore();
      for(const d of this.state.districts){pathPoly(c,d.polygon);c.strokeStyle='rgba(229,222,181,.2)';c.lineWidth=1;c.stroke();}
      pathPoly(c,LAND);c.strokeStyle='rgba(222,217,174,.50)';c.lineWidth=2;c.stroke();
      // Settlement blocks are original procedural artwork, with south-east shadows.
      for(const d of this.state.districts) {
        if(d.terrain==='mountain')continue;
        const count=d.terrain==='city'?33:d.terrain==='town'?15:6;
        for(let i=0;i<count;i++) {
          const x=d.x+(rand(rng)-.5)*(d.terrain==='city'?49:32),y=d.y-16+(rand(rng)-.5)*28;
          const w=3+rand(rng)*5,h=3+rand(rng)*5;c.fillStyle='rgba(26,39,34,.34)';c.fillRect(x+3,y+3,w,h);
          c.fillStyle=rand(rng)<.35?'#b8b79e':'#d0c5a5';c.fillRect(x,y,w,h);c.fillStyle='rgba(250,237,195,.5)';c.fillRect(x,y,w,1);
        }
      }
      if(this.state.scenario==='volcano')this.volcano(c,false);
      c.font='italic 14px Georgia, serif';c.fillStyle='rgba(201,215,196,.32)';c.textAlign='center';c.save();c.translate(1000,520);c.rotate(-1.08);c.fillText('T H E   G R E Y   S E A',0,0);c.restore();
      c.font='10px monospace';c.fillStyle='rgba(196,208,188,.36)';c.fillText('31° N',60,735);c.fillText('72° E',1040,735);
    }
    private volcano(c:CanvasRenderingContext2D,active:boolean):void {
      const d=this.state.districts[3],x=d.x,y=d.y-21;
      const rings=[{r:54,col:'#646658'},{r:42,col:'#575d52'},{r:30,col:'#686a59'},{r:18,col:'#434c43'}];
      for(const {r,col} of rings){c.fillStyle=col;c.beginPath();for(let i=0;i<12;i++){const a=i/12*Math.PI*2,rr=r*(1+Math.sin(i*7+2)*.13);c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.63);}c.closePath();c.fill();c.strokeStyle='rgba(201,197,158,.18)';c.lineWidth=1;c.stroke();}
      c.fillStyle=active?'#d67740':'#252e2b';c.beginPath();c.ellipse(x,y-2,11,6,0,0,Math.PI*2);c.fill();
      if(active){c.shadowColor='#f18449';c.shadowBlur=22;c.strokeStyle='#f9ba66';c.lineWidth=2;c.beginPath();c.ellipse(x,y-2,9,4.5,0,0,Math.PI*2);c.stroke();c.shadowBlur=0;}
    }
    draw(ms:number,fraction:number):void {
      this.time=ms/1000;const s=this.state,c=this.ctx;this.transform();
      const ratio=this.canvas.width/this.width;c.setTransform(ratio,0,0,ratio,0,0);c.fillStyle='#233d3e';c.fillRect(0,0,this.width,this.height);
      c.save();c.translate(this.ox,this.oy);c.scale(this.scale,this.scale);c.drawImage(this.cache,0,0,1100,760);
      for(const d of s.districts) {
        c.save();pathPoly(c,d.polygon);
        if(this.layer==='support'){c.fillStyle=d.support>55?`rgba(74,203,157,${.15+d.support/270})`:`rgba(204,116,72,${.14+(100-d.support)/400})`;c.fill();}
        else if(this.layer==='supply'){c.fillStyle=d.supplied?'rgba(77,183,185,.27)':'rgba(211,106,86,.34)';c.fill();}
        else if(this.layer==='intel'){c.fillStyle=`rgba(124,175,219,${d.intel/200})`;c.fill();if(d.intel<40){c.fillStyle='rgba(12,25,27,.32)';c.fill();}}
        else {if(d.stability>=100){c.fillStyle='rgba(94,204,166,.22)';c.fill();}else if(d.intel<35){c.fillStyle='rgba(14,24,28,.17)';c.fill();}}
        if(d.rebels>3&&d.intel>=35){c.fillStyle=`rgba(151,48,38,${controlled(d)?.31:.13})`;c.fill();c.strokeStyle=controlled(d)?'rgba(236,140,108,.7)':'rgba(240,155,116,.34)';c.lineWidth=1.4;c.setLineDash(controlled(d)?[]:[3,4]);c.stroke();c.setLineDash([]);}
        if(d.warning){c.fillStyle=`rgba(244,181,69,${.07+Math.sin(this.time*3)*.035})`;c.fill();c.setLineDash([7,5]);c.strokeStyle='#f0c075';c.lineWidth=2;c.stroke();c.setLineDash([]);}
        if(d.hazard>0){c.fillStyle='rgba(91,46,33,.68)';c.fill();c.clip();for(let j=0;j<8;j++){c.strokeStyle=j%2?'rgba(243,147,67,.7)':'rgba(239,98,44,.4)';c.lineWidth=j%2?1.5:5;c.beginPath();c.moveTo(d.x-85,d.y+j*13-50);c.bezierCurveTo(d.x-20,d.y+j*7-60,d.x+30,d.y+j*13-30,d.x+80,d.y+j*8-40);c.stroke();}}
        c.restore();
      }
      // Road networks and visible logistics convoys.
      for(const d of s.districts)for(const n of d.neighbors)if(n>d.id) {
        const e=s.districts[n];const roads=Math.min(d.levels.road,e.levels.road);const closed=d.hazard>0||e.hazard>0;
        c.strokeStyle=closed?'rgba(70,39,29,.6)':roads?'rgba(37,50,39,.60)':'rgba(223,211,164,.16)';c.lineWidth=roads?4:1.2;c.setLineDash(roads?[]:[3,6]);line(c,d,e);c.setLineDash([]);
        if(roads){c.strokeStyle=closed?'rgba(135,80,50,.5)':'rgba(203,192,144,.76)';c.lineWidth=1.5+roads*.2;line(c,d,e);
          if(riverCross(d,e)){const dx=(d.x+e.x)/2,dy=(d.y+e.y)/2;c.save();c.translate(dx,dy);c.rotate(Math.atan2(e.y-d.y,e.x-d.x));c.strokeStyle='#d1c7a1';c.lineWidth=1.5;line(c,{x:-7,y:-3},{x:7,y:-3});line(c,{x:-7,y:3},{x:7,y:3});c.restore();}
          if(!closed&&d.supplied&&e.supplied){const t=(this.time*.10+d.id*.14)%1;circle(c,d.x+(e.x-d.x)*t,d.y+(e.y-d.y)*t,1.5,'#d7e4b1');}
        }
      }
      // Selected and hovered district outlines stay visible above every overlay.
      for(const [id,isSelected] of [[this.hover,false],[this.selected,true]] as [number,boolean][])if(id>=0) {
        const d=s.districts[id];if(!d)continue;pathPoly(c,d.polygon);c.fillStyle=isSelected?'rgba(244,232,181,.065)':'rgba(247,240,208,.045)';c.fill();c.strokeStyle=isSelected?'#f3e5b9':'rgba(250,238,199,.55)';c.lineWidth=isSelected?2.5:1.3;c.stroke();
      }
      if(s.scenario==='volcano')this.volcano(c,s.districts.some(d=>d.hazard>0));
      this.drawLabels(c);
      this.drawUnits(c,fraction);
      if(s.scenario==='volcano') {
        const hot=s.districts.some(d=>d.hazard>0);
        const d=s.districts[3];
        for(let j=0;j<(hot?12:5);j++){const t=(this.time*.18+j*.15)%1;circle(c,d.x+Math.sin(t*4+j)*8+t*26,d.y-27-t*(hot?130:60),3+t*(hot?17:8),`rgba(197,199,182,${(hot?.23:.1)*(1-t)})`);}
      }
      c.restore();this.drawCompass(c);
    }
    private drawLabels(c:CanvasRenderingContext2D):void {
      const s=this.state;
      for(const d of s.districts) {
        const showEnemy=d.rebels>2&&d.intel>=35;
        if(showEnemy&&d.hazard<=0) {
          c.save();c.translate(d.x-26,d.y-15);c.strokeStyle='#f6b69a';c.lineWidth=2.3;line(c,{x:-5,y:-5},{x:5,y:5});line(c,{x:5,y:-5},{x:-5,y:5});
          c.fillStyle='#f2c1a7';c.font='bold 10px monospace';c.textAlign='center';c.fillText(d.intel>=70?String(Math.round(d.rebels)):'?',0,16);c.restore();
        }
        if(d.camp&&d.intel>=70){c.strokeStyle='#f1b794';c.lineWidth=1.5;c.beginPath();c.moveTo(d.x+21,d.y-16);c.lineTo(d.x+27,d.y-27);c.lineTo(d.x+33,d.y-16);c.closePath();c.stroke();}
        c.textAlign='center';c.font=`${d.terrain==='city'?'bold ':''}${d.terrain==='city'?16:13}px "Noto Sans CJK SC","Microsoft YaHei",sans-serif`;
        const labelY=d.y+8;c.strokeStyle='rgba(27,44,36,.86)';c.lineWidth=3.5;c.lineJoin='round';c.strokeText(d.name,d.x,labelY);c.fillStyle=d.hazard>0?'#f4c8a5':d.stability>=100?'#bdf2d4':'#f0e9cc';c.fillText(d.name,d.x,labelY);
        if(this.layer==='support'||this.layer==='intel') {
          c.font='bold 11px monospace';c.fillStyle='#f4e8c6';c.fillText(pct(this.layer==='support'?d.support:d.intel),d.x,d.y+24);
        }else if(d.stability>4&&d.hazard<=0){c.fillStyle='rgba(20,42,35,.7)';c.fillRect(d.x-15,d.y+15,30,2);c.fillStyle=d.stability>=100?'#a7e3be':'#dac795';c.fillRect(d.x-15,d.y+15,30*d.stability/100,2);}
        if(d.id===s.hq){c.fillStyle='#d6e6b9';c.font='bold 8px monospace';c.fillText('H Q',d.x,d.y-36);c.strokeStyle='#d3e1b5';c.lineWidth=1;line(c,{x:d.x-12,y:d.y-32},{x:d.x+12,y:d.y-32});}
        if(d.project) {
          const p=d.project;c.strokeStyle='rgba(20,39,35,.75)';c.lineWidth=3;c.beginPath();c.arc(d.x-30,d.y+28,7,0,Math.PI*2);c.stroke();c.strokeStyle='#e8c684';c.beginPath();c.arc(d.x-30,d.y+28,7,-Math.PI/2,-Math.PI/2+Math.PI*2*p.progress/p.total);c.stroke();c.fillStyle='#f0d9a4';c.font='8px sans-serif';c.fillText('工',d.x-30,d.y+31);
        }
        if(d.warning){c.font='bold 11px sans-serif';c.fillStyle='#ffdb8c';c.fillText(`△ ${s.eruptionAt-s.week}周${d.evacuating?' · '+pct(d.evacuation*100):''}`,d.x,d.y-35);}
        if(d.hazard>0){c.font='bold 10px sans-serif';c.fillStyle='#ffc395';c.fillText(`封闭 ${d.hazard}周`,d.x,d.y+27);}
        if(d.displaced>400){c.font='10px sans-serif';c.fillStyle='#e3cda0';c.fillText('⌂ 待安置',d.x+32,d.y+26);}
        if(s.week-d.lastCombat<2)for(let j=0;j<3;j++){const t=(this.time*2+j*.35)%1;circle(c,d.x+Math.sin(j*23)*23,d.y-7+Math.cos(j*9)*15,2+t*8,`rgba(252,190,105,${.45*(1-t)})`);}
      }
    }
    private drawUnits(c:CanvasRenderingContext2D,fraction:number):void {
      this.positions.clear();const s=this.state;const counts=new Map<number,number>();
      for(const u of s.units) {
        const d=s.districts[u.at];let x=d.x,y=d.y;const selected=this.selectedUnit===u.id;
        if(u.path.length&&active(u)) {
          const next=s.districts[u.path[0]],t=clamp((u.leg+fraction)/Math.max(1,u.legTotal),0,1);x=d.x+(next.x-d.x)*t;y=d.y+(next.y-d.y)*t;
          if(selected){c.setLineDash([5,5]);c.lineDashOffset=-this.time*12;c.strokeStyle='#cbe7cf';c.lineWidth=2;c.beginPath();c.moveTo(x,y);for(const n of u.path)c.lineTo(s.districts[n].x,s.districts[n].y);c.stroke();c.setLineDash([]);c.lineDashOffset=0;const end=s.districts[u.path[u.path.length-1]];c.strokeStyle='#d6eacc';c.beginPath();c.arc(end.x,end.y,22,0,Math.PI*2);c.stroke();}
        }else {const i=counts.get(u.at)||0;counts.set(u.at,i+1);x+=(i%3-1)*29;y+=36+Math.floor(i/3)*28;}
        this.positions.set(u.id,{x,y});c.save();c.translate(x,y);
        const col=u.kind==='coalition'?'#a9d4e7':u.kind==='engineer'?'#e9c984':'#b3dfb8';
        c.globalAlpha=active(u)?1:.55;c.shadowColor='#092221';c.shadowBlur=5;
        c.fillStyle=selected?'#486660':'#243d3a';c.strokeStyle=selected?'#fff3c3':col;c.lineWidth=selected?2.2:1.5;
        c.beginPath();c.roundRect(-12,-12,24,24,4);c.fill();c.stroke();c.shadowBlur=0;
        c.strokeStyle=col;c.lineWidth=1.8;
        if(u.kind==='engineer'){line(c,{x:-5,y:5},{x:4,y:-4});c.beginPath();c.arc(3,-3,4,.1,Math.PI*1.6);c.stroke();}
        else {line(c,{x:-6,y:-5},{x:6,y:5});line(c,{x:6,y:-5},{x:-6,y:5});if(u.kind==='coalition')line(c,{x:-6,y:0},{x:6,y:0});}
        c.fillStyle='#1a2d29';c.fillRect(-11,9,22,3);c.fillStyle=u.hp<35?'#e9977d':col;c.fillRect(-11,9,22*u.hp/100,3);
        if(u.supply<30){c.fillStyle='#eaa477';c.font='bold 14px sans-serif';c.textAlign='center';c.fillText('!',18,4);}
        if(u.training>0){c.fillStyle='#d5e5d9';c.font='9px sans-serif';c.textAlign='center';c.fillText(u.training+'周',0,25);}
        if(selected){c.font='bold 10px sans-serif';c.textAlign='center';c.strokeStyle='#172d29';c.lineWidth=3;c.strokeText(u.name,0,-20);c.fillStyle='#f4edd3';c.fillText(u.name,0,-20);}
        c.restore();
      }
    }
    private drawCompass(c:CanvasRenderingContext2D):void {
      const x=this.width-35,y=75;c.save();c.translate(x,y);c.strokeStyle='rgba(217,230,208,.35)';c.lineWidth=1;c.beginPath();c.arc(0,0,15,0,Math.PI*2);c.stroke();c.fillStyle='#d2deca';c.beginPath();c.moveTo(0,-12);c.lineTo(-4,5);c.lineTo(0,2);c.lineTo(4,5);c.closePath();c.fill();c.font='9px monospace';c.textAlign='center';c.fillText('N',0,-22);c.restore();
      c.strokeStyle='rgba(209,224,203,.5)';c.lineWidth=1;const yy=this.height-77;line(c,{x:27,y:yy},{x:99,y:yy});line(c,{x:27,y:yy-3},{x:27,y:yy+3});line(c,{x:99,y:yy-3},{x:99,y:yy+3});c.fillStyle='rgba(209,224,203,.6)';c.textAlign='left';c.font='9px monospace';c.fillText(`${Math.round(20/this.zoom)} km · 战略示意`,27,yy-7);
    }
  }
}
