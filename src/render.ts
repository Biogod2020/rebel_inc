/** Original procedural atlas renderer: no external textures, models, fonts or copied assets. */
namespace Afterfire {
  function pathPoly(c:CanvasRenderingContext2D,p:Point[]):void {c.beginPath();p.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();}
  function line(c:CanvasRenderingContext2D,a:Point,b:Point):void {c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
  function circle(c:CanvasRenderingContext2D,x:number,y:number,r:number,color:string):void {c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
  const MAP_FONT='"Noto Sans CJK SC","PingFang SC","Microsoft YaHei",sans-serif';
  function shape(c:CanvasRenderingContext2D,pts:number[][],color:string):void {c.fillStyle=color;pathPoly(c,pts.map(p=>({x:p[0],y:p[1]})));c.fill();}
  function tree(c:CanvasRenderingContext2D,x:number,y:number,r:number,variant:number):void {
    c.fillStyle='rgba(21,53,45,.17)';c.beginPath();c.ellipse(x+r*.6,y+r*.45,r*.95,r*.38,-.15,0,Math.PI*2);c.fill();
    c.strokeStyle='#695d40';c.lineWidth=1;line(c,{x,y:y+1},{x,y:y-r*.6});
    if(variant>.37){shape(c,[[x-r*.75,y],[x,y-r*2.45],[x+r*.9,y]],'#466e55');shape(c,[[x-r*.75,y],[x,y-r*2.45],[x-r*.06,y-r*.2]],'#729769');shape(c,[[x-r*.6,y-r*.7],[x,y-r*2.8],[x+r*.68,y-r*.6]],'#527e5c');shape(c,[[x-r*.6,y-r*.7],[x,y-r*2.8],[x,y-r*.8]],'#87a779');}
    else {circle(c,x,y-r*.8,r,'#507c5b');circle(c,x-r*.3,y-r*1.1,r*.82,'#7d9e67');circle(c,x-r*.45,y-r*1.4,r*.51,'#9cb87a');}
  }
  function house(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,roof:string):void {
    shape(c,[[x,y],[x+w*1.8,y+w*.4],[x+w*.4,y+w*1.05],[x-w*.7,y+w*.4]],'rgba(29,47,38,.22)');
    shape(c,[[x-w,y-w*.4],[x,y],[x,y-h],[x-w,y-h-w*.4]],'#d5c9a8');
    shape(c,[[x,y],[x+w,y-w*.45],[x+w,y-h-w*.45],[x,y-h]],'#a09878');
    shape(c,[[x-w-1,y-h-w*.4],[x,y-h-w*1.04],[x+w+1,y-h-w*.4],[x,y-h+.2]],roof);
    c.strokeStyle='rgba(255,243,206,.6)';c.lineWidth=.6;line(c,{x:x-w,y:y-h-w*.4},{x,y:y-h-w*1.04});
    c.fillStyle='#596154';c.fillRect(x-w*.65,y-h*.65,1.4,2.2);c.fillRect(x+1,y-h*.7,1.2,2.2);
  }
  function peak(c:CanvasRenderingContext2D,x:number,y:number,r:number,h:number,snow=false):void {
    shape(c,[[x-r,y+6],[x-r*.1,y-h],[x+r*.34,y-h*.37],[x+r,y+3],[x+r*.2,y+r*.4]],'#828779');
    shape(c,[[x-r,y+6],[x-r*.58,y-h*.32],[x-r*.1,y-h],[x-r*.17,y+5]],'#bdbaa1');
    shape(c,[[x-r*.1,y-h],[x+r*.34,y-h*.37],[x+r,y+3],[x+r*.07,y-h*.18]],'#747f73');
    shape(c,[[x-r*.1,y-h],[x-r*.17,y+5],[x+r*.2,y+r*.4],[x+r*.07,y-h*.18]],'#a0a28c');
    shape(c,[[x-r*.6,y+3],[x-r*.1,y-h],[x-r*.38,y-h*.32]],'#d0c6a3');
    c.strokeStyle='rgba(230,223,187,.36)';c.lineWidth=.75;c.beginPath();c.moveTo(x-r*.1,y-h);c.lineTo(x-r*.38,y-h*.25);c.lineTo(x-r*.66,y+4);c.stroke();
    if(snow){shape(c,[[x-r*.1,y-h],[x-r*.3,y-h*.53],[x-r*.09,y-h*.64],[x+r*.04,y-h*.45],[x+r*.16,y-h*.59]],'#e1e3d7');}
  }
  export class Renderer {
    canvas:HTMLCanvasElement;ctx:CanvasRenderingContext2D;cache:HTMLCanvasElement;
    state:State;selected=-1;selectedUnit:number|null=null;hover=-1;layer:Layer='terrain';
    panelInset=0;zoom=1;pan={x:0,y:0};width=1;height=1;scale=1;ox=0;oy=0;time=0;
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
        const d=this.state.districts.find(d=>contains(d.polygon,w.x,w.y));this.onSelect(d?.id??-1);
      });
      this.canvas.addEventListener('pointercancel',()=>this.down=null);
      this.canvas.addEventListener('pointerleave',()=>{this.hover=-1;this.onHover(-1,0,0);});
      this.canvas.addEventListener('wheel',e=>{e.preventDefault();const r=this.canvas.getBoundingClientRect();this.setZoom(this.zoom*(e.deltaY<0?1.13:1/1.13),e.clientX-r.left,e.clientY-r.top);},{passive:false});
      this.canvas.addEventListener('contextmenu',e=>{e.preventDefault();this.onUnit(-1);});
    }
    destroy():void {this.observer.disconnect();this.canvas.remove();}
    replace(state:State):void {this.state=state;this.selected=-1;this.selectedUnit=null;this.zoom=1;this.pan={x:0,y:0};this.bake();}
    private resize():void {
      const rect=this.canvas.parentElement!.getBoundingClientRect();this.width=rect.width;this.height=rect.height;
      const ratio=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.round(this.width*ratio);this.canvas.height=Math.round(this.height*ratio);this.canvas.style.width=this.width+'px';this.canvas.style.height=this.height+'px';this.limitPan();
    }
    private transform():void {this.scale=Math.min((this.width-24-(this.width>1050?this.panelInset:0))/1100,(this.height-72)/760)*this.zoom;this.ox=(this.width-(this.width>1050?this.panelInset:0)-1100*this.scale)/2+this.pan.x;this.oy=(this.height-760*this.scale)/2+this.pan.y-6;}
    toWorld(x:number,y:number):Point {this.transform();return {x:(x-this.ox)/this.scale,y:(y-this.oy)/this.scale};}
    toScreen(p:Point):Point {this.transform();return {x:p.x*this.scale+this.ox,y:p.y*this.scale+this.oy};}
    setZoom(value:number,x=this.width/2,y=this.height/2):void {const before=this.toWorld(x,y);this.zoom=clamp(value,.85,3);const after=this.toScreen(before);this.pan.x+=x-after.x;this.pan.y+=y-after.y;this.limitPan();}
    fit():void {this.zoom=1;this.pan={x:0,y:0};}
    private limitPan():void {const mx=this.width*(this.zoom-1)*.48+70,my=this.height*(this.zoom-1)*.48+55;this.pan.x=clamp(this.pan.x,-mx,mx);this.pan.y=clamp(this.pan.y,-my,my);}
    private bake():void {
      const c=this.cache.getContext('2d')!;c.setTransform(2,0,0,2,0,0);c.clearRect(0,0,1100,760);
      const rng={rng:this.state.seed^0x512ba},dry=this.state.scenario==='corridor';
      // Sea is rendered in screen space, leaving the atlas cache transparent offshore.
      // Survey grid, deliberately much quieter than the land and the primary markers.
      c.strokeStyle='rgba(202,220,210,.032)';c.lineWidth=.65;
      for(let x=0;x<1100;x+=48)line(c,{x,y:0},{x,y:760});for(let y=0;y<760;y+=48)line(c,{x:0,y},{x:1100,y});
      for(let j=7;j>=1;j--){c.save();c.translate(550,370);c.scale(1+j*.012,1+j*.012);c.translate(-550,-370);pathPoly(c,LAND);c.strokeStyle=`rgba(152,202,188,${.13-j*.012})`;c.lineWidth=j===1?7:1;c.stroke();c.restore();}
      c.save();c.translate(0,10);pathPoly(c,LAND);c.fillStyle='#506964';c.shadowColor='rgba(3,22,31,.7)';c.shadowBlur=20;c.shadowOffsetY=12;c.fill();c.restore();
      pathPoly(c,LAND);c.fillStyle=dry?'#b7ad7a':'#a5b583';c.fill();
      // A continuous terrain field instead of 35 flat, independently coloured polygons.
      const terrain=document.createElement('canvas');terrain.width=550;terrain.height=380;const tc=terrain.getContext('2d')!,im=tc.createImageData(550,380);
      for(let y=0;y<380;y++)for(let x=0;x<550;x++){
        const X=x*2,Y=y*2;const noise=Math.sin(X*.022+Math.sin(Y*.019)*2)*.3+Math.cos(Y*.033+X*.013)*.25+Math.sin(X*.078+Y*.059)*.13;
        const high=clamp((350-Y)/270+noise*.32,0,1),shade=(Math.cos(X*.022+Math.sin(Y*.019)*2)*.25+Math.sin(Y*.033+X*.013)*.16);
        const lo=dry?[179,171,117]:[153,174,118],hi=[151,155,129];const idx=(y*550+x)*4;
        for(let k=0;k<3;k++)im.data[idx+k]=(lo[k]*(1-high)+hi[k]*high)*(1+shade*.24)+noise*6;
        im.data[idx+3]=255;
      }
      tc.putImageData(im,0,0);c.save();pathPoly(c,LAND);c.clip();c.drawImage(terrain,0,0,1100,760);
      // Inland contours make the height readable without turning the board into a heatmap.
      c.strokeStyle='rgba(59,87,62,.12)';c.lineWidth=.65;
      for(let k=0;k<20;k++){c.beginPath();for(let x=70;x<1030;x+=8){const y=104+k*12+Math.sin(x*.015+k*.2)*16+Math.cos(x*.031-k*.14)*6;x===70?c.moveTo(x,y):c.lineTo(x,y);}c.stroke();}
      c.restore();
      const objects:{y:number;draw:()=>void}[]=[];
      for(const d of this.state.districts){
        c.save();pathPoly(c,d.polygon);c.clip();
        if(d.terrain==='forest'){
          const g=c.createRadialGradient(d.x,d.y,15,d.x,d.y,110);g.addColorStop(0,'rgba(48,108,78,.22)');g.addColorStop(1,'rgba(48,108,78,0)');c.fillStyle=g;c.fillRect(d.x-120,d.y-120,240,240);
        }
        if(['farm','city','town'].includes(d.terrain)){
          for(let i=0;i<(d.terrain==='farm'?21:9);i++){
            const x=d.x+(rand(rng)-.5)*200,y=d.y+(rand(rng)-.5)*145;
            if(Math.abs(x-riverX(y))<24)continue;
            c.save();c.translate(x,y);c.rotate(-.23);const w=13+rand(rng)*24,h=7+rand(rng)*14;
            c.fillStyle=['#c4b86d','#afba7f','#9ba96a','#d0bd7e','#a1b886'][Math.floor(rand(rng)*5)];c.globalAlpha=.6;c.fillRect(0,0,w,h);c.strokeStyle='rgba(251,230,159,.42)';c.lineWidth=.55;for(let j=2;j<h;j+=3)line(c,{x:0,y:j},{x:w,y:j});c.restore();
          }
        }
        c.restore();
        if(d.terrain==='mountain'){
          for(let i=0;i<5;i++){
            const x=d.x+(rand(rng)-.5)*75,y=d.y+(rand(rng)-.5)*53+15,r=23+rand(rng)*23,h=29+rand(rng)*28;
            if(contains(d.polygon,x,y)&&Math.abs(x-riverX(y))>34&&!(d.id===3&&this.state.scenario==='volcano'))objects.push({y,draw:()=>peak(c,x,y,r,h,i===0&&d.y<190)});
          }
        }else{
          for(let i=0;i<(d.terrain==='forest'?56:12);i++){
            const x=d.x+(rand(rng)-.5)*205,y=d.y+(rand(rng)-.5)*166,r=2.9+rand(rng)*3.1,v=rand(rng);
            if(contains(d.polygon,x,y)&&distance({x,y},d)>32&&Math.abs(x-riverX(y))>19)objects.push({y,draw:()=>tree(c,x,y,r,v)});
          }
        }
        if(d.terrain!=='mountain'){
          const count=d.terrain==='city'?32:d.terrain==='town'?17:5;
          for(let i=0;i<count;i++){
            const col=i%6,row=Math.floor(i/6),x=d.x+(col-2.5)*8+row*2,y=d.y-8+(row-2)*8+(col%2)*2;
            const w=d.terrain==='city'?3.4+rand(rng)*1.6:3+rand(rng)*1.2,h=d.terrain==='city'?5+rand(rng)*5:3+rand(rng)*3,roof=rand(rng)<.55?'#bd795b':'#658a84';
            objects.push({y,draw:()=>house(c,x,y,w,h,roof)});
          }
        }
      }
      c.save();pathPoly(c,LAND);c.clip();
      for(const [width,col] of [[22,'rgba(52,100,95,.15)'],[15,'#788e75'],[11,'#376f79'],[7,'#498f96'],[1,'rgba(207,227,202,.3)']] as [number,string][]){
        c.strokeStyle=col;c.lineWidth=width;c.beginPath();for(let y=25;y<740;y+=3)c.lineTo(riverX(y),y);c.stroke();
      }
      for(let y=110;y<680;y+=46){c.strokeStyle='rgba(184,216,199,.32)';c.lineWidth=.7;c.beginPath();c.moveTo(riverX(y)-2,y);c.quadraticCurveTo(riverX(y+5),y+5,riverX(y+11)+1,y+11);c.stroke();}
      c.restore();
      objects.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
      for(const d of this.state.districts){pathPoly(c,d.polygon);c.strokeStyle='rgba(242,234,199,.25)';c.lineWidth=.75;c.setLineDash([2,4]);c.stroke();c.setLineDash([]);}
      pathPoly(c,LAND);c.strokeStyle='#b9be97';c.lineWidth=1.5;c.stroke();
      if(this.state.scenario==='volcano')this.volcano(c,false);
      c.textAlign='center';c.font='italic 13px Georgia,serif';c.fillStyle='rgba(220,226,202,.38)';c.save();c.translate(1005,487);c.rotate(-1.12);c.fillText('T h e   G r e y   S e a',0,0);c.restore();
      c.font='italic 11px Georgia,serif';c.fillStyle='rgba(47,66,49,.45)';c.fillText('N O R T H E R N   H I G H L A N D S',575,96);c.fillText('H E L A N   B A S I N',408,617);
    }
    private volcano(c:CanvasRenderingContext2D,hot:boolean):void {
      const d=this.state.districts[3],x=d.x,y=d.y-10;
      c.save();c.translate(x,y);
      const sides=[{p:[[-64,19],[-21,-45],[4,-61],[34,-30],[66,18],[18,41]],c:'#7c8373'},{p:[[-64,19],[-21,-45],[4,-61],[-1,9],[-31,28]],c:'#bab499'},{p:[[4,-61],[34,-30],[66,18],[18,41],[-1,9]],c:'#7a7d6d'},{p:[[-21,-45],[4,-61],[26,-39],[10,-18],[-12,-20]],c:'#999782'}];
      sides.forEach(o=>shape(c,o.p,o.c));
      c.fillStyle='#b8aa86';c.beginPath();c.ellipse(2,-41,23,11,.1,0,Math.PI*2);c.fill();
      c.fillStyle=hot?'#e56a34':'#464f48';c.beginPath();c.ellipse(3,-41,16,7,.1,0,Math.PI*2);c.fill();
      if(hot){c.strokeStyle='#ffb456';c.shadowBlur=12;c.shadowColor='#f77830';c.lineWidth=4;c.beginPath();c.moveTo(6,-36);c.bezierCurveTo(23,-16,4,0,34,25);c.stroke();c.shadowBlur=0;}
      c.restore();
    }
    draw(now:number,fraction=0):void {
      this.time=now/1000;this.transform();const c=this.ctx,s=this.state;
      const ratio=this.canvas.width/this.width;c.setTransform(ratio,0,0,ratio,0,0);const sea=c.createRadialGradient(this.width*.51,this.height*.5,60,this.width*.51,this.height*.5,Math.max(this.width,this.height)*.67);sea.addColorStop(0,'#315d65');sea.addColorStop(.52,'#214b57');sea.addColorStop(1,'#12333e');c.fillStyle=sea;c.fillRect(0,0,this.width,this.height);
      c.save();c.translate(this.ox,this.oy);c.scale(this.scale,this.scale);c.drawImage(this.cache,0,0,1100,760);
      for(const d of s.districts){
        c.save();pathPoly(c,d.polygon);
        if(this.layer==='support'){c.fillStyle=d.support>=53?`rgba(44,162,123,${.15+d.support/400})`:`rgba(191,97,57,${.15+(100-d.support)/440})`;c.fill();}
        else if(this.layer==='supply'){c.fillStyle=d.supplied?'rgba(74,184,198,.25)':'rgba(214,91,67,.4)';c.fill();}
        else if(this.layer==='intel'){c.fillStyle=d.intel<35?'rgba(24,39,52,.52)':`rgba(106,176,204,${d.intel/320})`;c.fill();}
        else if(d.stability>=100){c.fillStyle='rgba(114,176,111,.12)';c.fill();}
        else if(d.intel<35){c.fillStyle='rgba(35,52,60,.14)';c.fill();}
        if(d.rebels>3&&d.intel>=35){c.fillStyle=controlled(d)?'rgba(177,55,34,.32)':'rgba(201,95,46,.09)';c.fill();c.strokeStyle=controlled(d)?'rgba(234,115,72,.85)':'rgba(232,164,108,.5)';c.setLineDash(controlled(d)?[]:[4,5]);c.lineWidth=1.3;c.stroke();}
        if(d.warning){c.fillStyle=`rgba(255,186,63,${.09+Math.sin(this.time*2)*.025})`;c.fill();c.strokeStyle='#ffc96f';c.setLineDash([8,6]);c.lineDashOffset=-this.time*5;c.lineWidth=2;c.stroke();}
        if(isTruce(s,d.id)){c.strokeStyle='#a9e7c4';c.lineWidth=2;c.setLineDash([6,3]);c.stroke();}
        if(d.hazard>0){c.fillStyle='rgba(86,58,47,.73)';c.fill();c.clip();for(let j=0;j<7;j++){c.strokeStyle=j%2?'#f8a54f':'rgba(230,102,49,.6)';c.lineWidth=j%2?1.6:4;c.beginPath();c.moveTo(d.x-80,d.y+j*15-55);c.bezierCurveTo(d.x-22,d.y+j*7-54,d.x+18,d.y+j*13-37,d.x+80,d.y+j*8-35);c.stroke();}}
        c.restore();
      }
      this.drawRoads(c);
      for(const d of s.districts){if(d.hazard>0)continue;if(d.levels.health){house(c,d.x+23,d.y-17,5,7,'#e3d9b6');c.strokeStyle='#548985';c.lineWidth=1.4;line(c,{x:d.x+22,y:d.y-27},{x:d.x+27,y:d.y-27});line(c,{x:d.x+24.5,y:d.y-29.5},{x:d.x+24.5,y:d.y-24.5});}if(d.levels.school)house(c,d.x-20,d.y-22,5,9,'#d3b565');if(d.levels.shelter){shape(c,[[d.x+29,d.y],[d.x+35,d.y-13],[d.x+43,d.y]],'#e5c582');shape(c,[[d.x+35,d.y-13],[d.x+43,d.y],[d.x+46,d.y-4]],'#ad9c6b');}if(d.stability>=100){for(let i=0;i<3;i++)tree(c,d.x-23+i*18,d.y+35+(i%2)*5,3.5,.8);}}
      for(const [id,selected] of [[this.hover,false],[this.selected,true]] as [number,boolean][]){
        if(id<0||!s.districts[id])continue;pathPoly(c,s.districts[id].polygon);c.fillStyle=selected?'rgba(255,238,172,.08)':'rgba(255,249,224,.06)';c.fill();c.strokeStyle=selected?'#ffdb9a':'rgba(255,247,211,.65)';c.lineWidth=selected?2.4:1.2;c.shadowBlur=selected?9:0;c.shadowColor='rgba(255,215,135,.55)';c.stroke();c.shadowBlur=0;
      }
      const contract=s.campaign?.contracts.find(o=>o.status==='active');
      if(contract){const d=s.districts[contract.target];c.save();c.translate(d.x+24,d.y-36);c.rotate(Math.PI/4);c.fillStyle='#dfb565';c.fillRect(-5,-5,10,10);c.strokeStyle='#ffebbb';c.lineWidth=1;c.strokeRect(-5,-5,10,10);c.restore();}
      this.drawMissions(c,fraction);this.drawLabels(c);this.drawUnits(c,fraction);this.drawPreview(c);
      if(s.scenario==='volcano'){
        const hot=s.districts.some(d=>d.hazard>0),d=s.districts[3];
        for(let j=0;j<(hot?13:5);j++){const t=(this.time*.07+j*.17)%1;circle(c,d.x+5+t*48+Math.sin(t*7+j)*7,d.y-54-t*(hot?120:75),3+t*(hot?23:13),`rgba(220,221,200,${(hot?.2:.12)*(1-t)})`);}
      }
      c.restore();
      if(s.rain&&this.time){c.strokeStyle='rgba(189,220,223,.10)';c.lineWidth=.7;for(let i=0;i<60;i++){const x=(i*173.9+this.time*35)%this.width,y=(i*77.1+this.time*130)%this.height;line(c,{x,y},{x:x-4,y:y+14});}}
      const vignette=c.createRadialGradient(this.width/2,this.height/2,this.height*.24,this.width/2,this.height/2,this.width*.69);vignette.addColorStop(0,'rgba(3,22,30,0)');vignette.addColorStop(1,'rgba(3,22,30,.26)');c.fillStyle=vignette;c.fillRect(0,0,this.width,this.height);
      this.drawCompass(c);
    }
    private drawRoads(c:CanvasRenderingContext2D):void {
      const s=this.state;
      for(const d of s.districts)for(const n of d.neighbors)if(n>d.id){
        const e=s.districts[n],roads=Math.min(d.levels.road,e.levels.road),closed=d.hazard>0||e.hazard>0;
        if(!roads){if(this.layer==='supply'||this.selected===d.id||this.selected===n){c.strokeStyle='rgba(244,227,171,.4)';c.lineWidth=1;c.setLineDash([2,5]);line(c,d,e);c.setLineDash([]);}continue;}
        c.strokeStyle=closed?'rgba(64,45,32,.5)':'rgba(73,78,50,.50)';c.lineWidth=4+roads*.4;line(c,d,e);
        c.strokeStyle=closed?'rgba(144,94,55,.55)':'#d6c698';c.lineWidth=1.4+roads*.35;line(c,d,e);
        if(riverCross(d,e)){
          let t=.5;for(let i=0,lo=0,hi=1;i<12;i++){t=(lo+hi)/2;const pt={x:d.x+(e.x-d.x)*t,y:d.y+(e.y-d.y)*t};if((pt.x-riverX(pt.y))*(d.x-riverX(d.y))>0)lo=t;else hi=t;}
          c.save();c.translate(d.x+(e.x-d.x)*t,d.y+(e.y-d.y)*t);c.rotate(Math.atan2(e.y-d.y,e.x-d.x));c.strokeStyle='#eee0b4';c.lineWidth=1.5;line(c,{x:-10,y:-3},{x:10,y:-3});line(c,{x:-10,y:3},{x:10,y:3});c.restore();
        }
      }
    }
    private label(c:CanvasRenderingContext2D,text:string,x:number,y:number,size=12,strong=false,col='#faf2d8'):void {
      c.font=`${strong?'600 ':''}${size}px ${MAP_FONT}`;c.textAlign='center';c.lineJoin='round';c.strokeStyle='rgba(29,56,49,.80)';c.lineWidth=3;c.strokeText(text,x,y);c.fillStyle=col;c.fillText(text,x,y);
    }
    private drawLabels(c:CanvasRenderingContext2D):void {
      const s=this.state;
      for(const d of s.districts){
        const conflict=d.rebels>2&&d.intel>=35,focus=d.id===this.selected||d.id===this.hover,visible=focus||d.terrain==='city'||d.terrain==='town'||conflict||d.warning||d.project||this.zoom>1.4||this.layer!=='terrain';
        if(visible)this.label(c,d.name,d.x,d.y+16,d.terrain==='city'?15:12,d.terrain==='city',d.hazard>0?'#ffd3ac':d.stability>=100?'#c8f1c7':'#fcf1d5');
        else {circle(c,d.x,d.y,2,'rgba(232,230,196,.65)');}
        if(d.terrain==='city'){c.fillStyle='rgba(240,231,191,.8)';c.fillRect(d.x-2,d.y-34,4,4);}
        if(d.id===s.hq){this.label(c,'行动总部',d.x,d.y-45,9,false,'#c9e8db');}
        if(d.stability>=100){this.label(c,'✓',d.x+24,d.y+15,11,true,'#b8f3bd');}
        else if(d.stability>10&&visible){c.fillStyle='rgba(26,59,48,.6)';c.fillRect(d.x-13,d.y+22,26,2);c.fillStyle='#d9c491';c.fillRect(d.x-13,d.y+22,26*d.stability/100,2);}
        if(this.layer==='support'||this.layer==='intel')this.label(c,pct(this.layer==='support'?d.support:d.intel),d.x,d.y+36,10);
        if(conflict&&d.hazard<=0){
          c.save();c.translate(d.x-27,d.y-12);c.fillStyle='#bc613e';c.strokeStyle='#ffe0b2';c.lineWidth=1;c.beginPath();c.roundRect(-9,-9,18,18,4);c.fill();c.stroke();c.strokeStyle='#ffebd0';line(c,{x:-3,y:-3},{x:3,y:3});line(c,{x:3,y:-3},{x:-3,y:3});c.restore();this.label(c,d.intel>=70?String(round(d.rebels)):'?',d.x-27,d.y+8,10,true,'#ffe4ba');
        }
        if(d.camp&&d.intel>=70){c.strokeStyle='#f9c28a';c.lineWidth=1.6;c.beginPath();c.moveTo(d.x+22,d.y-15);c.lineTo(d.x+28,d.y-26);c.lineTo(d.x+34,d.y-15);c.closePath();c.stroke();}
        if(d.project){const p=d.project;c.lineWidth=2.6;c.strokeStyle='rgba(35,57,43,.7)';c.beginPath();c.arc(d.x-24,d.y+28,6,0,Math.PI*2);c.stroke();c.strokeStyle='#f0cc83';c.beginPath();c.arc(d.x-24,d.y+28,6,-Math.PI/2,-Math.PI/2+Math.PI*2*p.progress/p.total);c.stroke();}
        if(d.warning){this.label(c,`△ ${s.eruptionAt-s.week}周 · ${pct(d.evacuation*100)}`,d.x,d.y-33,11,true,'#ffda86');}
        if(d.hazard>0)this.label(c,`封闭 ${d.hazard}周`,d.x,d.y+32,10,false,'#ffca9f');
        if(s.week-d.lastCombat<2&&this.time){for(let j=0;j<2;j++){const t=(this.time*1.4+j*.5)%1;circle(c,d.x+Math.sin(j*23)*20,d.y-9,1+t*9,`rgba(255,214,136,${.4*(1-t)})`);}}
      }
    }
    private drawUnits(c:CanvasRenderingContext2D,fraction:number):void {
      this.positions.clear();const s=this.state,counts=new Map<number,number>();
      for(const u of s.units){
        const d=s.districts[u.at];let x=d.x,y=d.y;const selected=this.selectedUnit===u.id;
        if(u.path.length&&active(u)){
          const n=s.districts[u.path[0]],t=clamp((u.leg+fraction)/Math.max(1,u.legTotal),0,1);x+= (n.x-d.x)*t;y+=(n.y-d.y)*t;
          if(selected){c.strokeStyle='#ccece3';c.lineWidth=1.5;c.setLineDash([4,6]);c.lineDashOffset=-this.time*9;c.beginPath();c.moveTo(x,y);u.path.forEach(id=>c.lineTo(s.districts[id].x,s.districts[id].y));c.stroke();c.setLineDash([]);c.lineDashOffset=0;}
        }else{const i=counts.get(u.at)??0;counts.set(u.at,i+1);x+=(i%3-1)*26;y+=39+Math.floor(i/3)*25;}
        this.positions.set(u.id,{x,y});c.save();c.translate(x,y);const col=u.kind==='coalition'?'#a7d5e1':u.kind==='engineer'?'#efcf8c':'#b5d9ad';c.globalAlpha=active(u)?1:.5;
        c.shadowBlur=6;c.shadowColor='#264a40';c.fillStyle=selected?'#e3dab5':'#234644';c.strokeStyle=selected?'#fff5d2':col;c.lineWidth=selected?2:1.4;c.beginPath();c.roundRect(-10,-10,20,20,5);c.fill();c.stroke();c.shadowBlur=0;c.strokeStyle=selected?'#3b5b49':col;c.lineWidth=1.5;
        if(u.kind==='engineer'){line(c,{x:-4,y:4},{x:3,y:-3});c.beginPath();c.arc(2,-2,3,0,Math.PI*1.6);c.stroke();}else{line(c,{x:-4,y:-4},{x:4,y:4});line(c,{x:4,y:-4},{x:-4,y:4});}
        c.fillStyle='#273f39';c.fillRect(-8,8,16,2);c.fillStyle=u.hp<35?'#e28c69':col;c.fillRect(-8,8,16*u.hp/100,2);
        if(u.supply<30)this.label(c,'!',14,3,12,true,'#ffb277');if(selected)this.label(c,u.name,0,-18,10,true);c.restore();
      }
    }
    private drawMissions(c:CanvasRenderingContext2D,fraction:number):void {
      const s=this.state;
      for(const m of s.campaign?.missions??[]){
        if(m.status!=='active')continue;const a=s.districts[m.at];let x=a.x,y=a.y;
        if(m.kind==='convoy'&&m.path.length){
          const b=s.districts[m.path[0]],t=m.stalled?0:clamp((m.leg+fraction)/Math.max(1,m.legTotal),0,1);x+= (b.x-a.x)*t;y+=(b.y-a.y)*t;
          c.strokeStyle=m.stalled?'#f1ad79':'rgba(241,217,145,.85)';c.lineWidth=1.4;c.setLineDash([2,5]);c.beginPath();c.moveTo(x,y);m.path.forEach(n=>c.lineTo(s.districts[n].x,s.districts[n].y));c.stroke();c.setLineDash([]);
        }else y-=22;
        if(m.kind==='recon'){c.strokeStyle='rgba(214,238,235,.50)';c.lineWidth=1;c.beginPath();c.arc(x,y,22+Math.sin(this.time)*5,0,Math.PI*2);c.stroke();continue;}
        c.save();c.translate(x,y);c.fillStyle=m.stalled?'#bd6b47':'#d8b572';c.strokeStyle='#fbebc1';c.lineWidth=1;c.beginPath();c.roundRect(-9,-6,18,12,3);c.fill();c.stroke();
        if(m.kind==='convoy'){circle(c,-5,7,2,'#2f4d48');circle(c,5,7,2,'#2f4d48');c.fillStyle='#4a6b60';c.fillRect(3,-4,4,5);}else{c.strokeStyle='#476358';line(c,{x:-4,y:0},{x:4,y:0});line(c,{x:0,y:-4},{x:0,y:4});}c.restore();
      }
    }
    private drawPreview(c:CanvasRenderingContext2D):void {
      if(this.selectedUnit===null||this.hover<0)return;const s=this.state,u=s.units.find(x=>x.id===this.selectedUnit);if(!u||!active(u)||u.at===this.hover)return;
      const path=findPath(s,u.at,this.hover);if(!path)return;let at=u.at,eta=0;c.beginPath();c.moveTo(s.districts[at].x,s.districts[at].y);
      path.forEach(n=>{eta+=travelCost(s,s.districts[at],s.districts[n]);c.lineTo(s.districts[n].x,s.districts[n].y);at=n;});c.strokeStyle='#ffdfa0';c.lineWidth=1.8;c.setLineDash([4,6]);c.stroke();c.setLineDash([]);const d=s.districts[this.hover];this.label(c,`预计 ${Math.ceil(eta)} 周`,d.x,d.y+58,11,true,'#ffe1a7');
    }
    private drawCompass(c:CanvasRenderingContext2D):void {
      const x=this.width-37,y=this.height-155;c.save();c.translate(x,y);c.strokeStyle='rgba(216,229,213,.3)';c.lineWidth=1;line(c,{x:-14,y:0},{x:14,y:0});line(c,{x:0,y:-14},{x:0,y:14});shape(c,[[0,-11],[-3,5],[0,2],[3,5]],'#b5cec3');c.font='9px monospace';c.fillStyle='#b5cec3';c.textAlign='center';c.fillText('N',0,-22);c.restore();
    }
  }
}
