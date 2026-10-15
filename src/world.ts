namespace Afterfire {
  export const LAND:Point[]=[{x:80,y:170},{x:260,y:62},{x:550,y:52},{x:930,y:125},{x:1032,y:360},{x:935,y:597},{x:652,y:703},{x:260,y:655},{x:65,y:434}];
  const NAMES=['北望岭','赤岩关','云杉谷','灰冠峰','松石岭','东隘口','雾林', '白鹿坡','石桥村','冷泉','炭溪','青松镇','芦苇湾','风口', '西林场','茶谷','望川镇','双河口','橄榄坡','东牧场','长石堡', '临川城','麦田乡','南河村','河岚城','老集镇','绿洲','东港镇', '西渡口','稻香里','新桥','柳岸','南原','海门城','盐湾'];
  function clip(poly:Point[],nx:number,ny:number,k:number):Point[] {
    const out:Point[]=[];
    for(let i=0;i<poly.length;i++) {
      const a=poly[i],b=poly[(i+1)%poly.length]; const da=a.x*nx+a.y*ny-k,db=b.x*nx+b.y*ny-k;
      if(da<=0.0001)out.push(a);
      if((da<0)!==(db<0)) {const t=da/(da-db);out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}
    }
    return out;
  }
  export function makeWorld(seed:number,scenario:Scenario,governor:Governor):District[] {
    const rng={rng:seed^0x756367}; const sites:Point[]=[];
    for(let r=0;r<5;r++) for(let c=0;c<7;c++) {
      const inset=r===0?32:r===4?36:0;
      sites.push({x:162+inset+c*(120-inset/3)+(rand(rng)-.5)*46,y:164+r*106+(rand(rng)-.5)*42});
    }
    const districts=sites.map((p,id)=>{
      let polygon=LAND.map(x=>({...x}));
      sites.forEach((q,j)=>{if(j!==id)polygon=clip(polygon,q.x-p.x,q.y-p.y,(q.x*q.x+q.y*q.y-p.x*p.x-p.y*p.y)/2);});
      const row=Math.floor(id/7),col=id%7;
      let terrain:Terrain=row<=1&&col>0&&col<6?'mountain':row<3?'forest':'farm';
      if(scenario==='corridor'&&(col===0||col>=5||row===2&&col!==3))terrain='mountain';
      if([11,16,23,26,27,30].includes(id))terrain='town';
      if([21,24,33].includes(id))terrain='city';
      const pop=Math.round((terrain==='city'?26000:terrain==='town'?11500:terrain==='farm'?7000:terrain==='forest'?3700:1800)*(0.85+rand(rng)*.3)/100)*100;
      const demand:ProjectKind=(['water','health','school','jobs'] as ProjectKind[])[Math.floor(rand(rng)*4)];
      const levels:Record<ProjectKind,number>={water:0,health:0,school:0,jobs:0,road:row>=3?1:0,police:0,shelter:0,survey:0};
      if(id===24) {levels.water=1;levels.road=2;levels.police=1;}
      return {id,name:NAMES[id],...p,polygon,neighbors:[],terrain,population:pop,support:(terrain==='city'?43:terrain==='mountain'?27:36)+rand(rng)*6+(governor==='mediator'?5:0),stability:0,intel:row>=3?85:row===2?48:22,rebels:0,camp:false,unrest:terrain==='mountain'?23:12,demand,levels,project:null,supplied:false,evacuation:0,evacuating:false,hazard:0,warning:false,displaced:0,lastCombat:-10,lastLoss:0} as District;
    });
    for(const d of districts)for(const e of districts)if(d.id!==e.id) {
      const nx=e.x-d.x,ny=e.y-d.y,k=(e.x*e.x+e.y*e.y-d.x*d.x-d.y*d.y)/2;
      if(d.polygon.some((p,i)=>Math.abs(p.x*nx+p.y*ny-k)<.02&&Math.abs(d.polygon[(i+1)%d.polygon.length].x*nx+d.polygon[(i+1)%d.polygon.length].y*ny-k)<.02)) d.neighbors.push(e.id);
    }
    return districts;
  }
  export const distance=(a:Point,b:Point):number=>Math.hypot(a.x-b.x,a.y-b.y);
  export function riverX(y:number):number {return 530+Math.sin(y*.011)*55+Math.sin(y*.025)*16;}
  export const riverCross=(a:District,b:District):boolean=>(a.x-riverX(a.y))*(b.x-riverX(b.y))<0;
  export function travelCost(s:State,a:District,b:District):number {
    const road=Math.min(a.levels.road,b.levels.road);
    let cost=distance(a,b)/70*(b.terrain==='mountain'?2.1:b.terrain==='forest'?1.4:1);
    cost/=1+road*.45;
    if(s.rain&&road<2)cost*=1.4;
    if(riverCross(a,b)&&road<1)cost*=1.65;
    return Math.max(1,cost);
  }
  /** Dijkstra: the route uses adjacency, terrain, roads and active hazards. */
  export function findPath(s:State,from:number,to:number):number[]|null {
    if(from===to)return [];
    const dist=s.districts.map(()=>Infinity),prev=s.districts.map(()=>-1),seen=new Set<number>();dist[from]=0;
    for(let i=0;i<s.districts.length;i++) {
      let best=-1;
      for(let j=0;j<dist.length;j++)if(!seen.has(j)&&(best<0||dist[j]<dist[best]))best=j;
      if(best<0||!Number.isFinite(dist[best]))break;
      if(best===to)break;seen.add(best);
      for(const n of s.districts[best].neighbors) {
        const d=s.districts[n];if(d.hazard>0)continue;
        const v=dist[best]+travelCost(s,s.districts[best],d)+(controlled(d)&&n!==to?7:0);
        if(v<dist[n]){dist[n]=v;prev[n]=best;}
      }
    }
    if(prev[to]<0)return null;
    const path:number[]=[];let at=to;
    while(at!==from){path.unshift(at);at=prev[at];if(at<0||path.length>50)return null;}
    return path;
  }
  /** A safe chain to HQ is required; front-line districts may receive supplies from a safe neighbor. */
  export function updateSupply(s:State):void {
    s.districts.forEach(d=>d.supplied=false);
    const h=s.districts[s.hq];if(h.hazard>0||controlled(h))return;
    const queue=[s.hq];h.supplied=true;
    while(queue.length) {
      const at=queue.shift()!;
      for(const n of s.districts[at].neighbors) {
        const d=s.districts[n];
        if(!d.supplied&&d.hazard<=0&&!controlled(d)){d.supplied=true;queue.push(n);}
      }
    }
    // A unit can fight at the tip of a supply line, but cannot relay through enemy control.
    for(const u of s.units)if(active(u)) {
      const d=s.districts[u.at];
      if(d.hazard<=0&&d.neighbors.some(n=>!controlled(s.districts[n])&&s.districts[n].supplied))d.supplied=true;
    }
  }
  export function contains(poly:Point[],x:number,y:number):boolean {
    let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++) {
      const a=poly[i],b=poly[j];
      if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;
    }return hit;
  }
}
