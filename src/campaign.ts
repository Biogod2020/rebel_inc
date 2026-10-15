/** Optional v2 systems. Legacy saves/core simulations remain deterministic without them. */
namespace Afterfire {
  export type Doctrine='rebuild'|'mobility'|'accord';
  export type UpgradeId='works'|'cooperative'|'radio'|'clinics'|'prepared'|'precision'|'local'|'compact'|'reserve';
  export type OperationKind='recon'|'convoy'|'mediate'|'airlift';
  export type ContractKind='service'|'road'|'delivery'|'dialogue'|'protect'|'shelter';
  export interface FieldMission {
    id:number; kind:OperationKind; target:number; at:number; path:number[]; leg:number; legTotal:number;
    progress:number; total:number; cargo:number; stalled:number; started:number; cost:number;
    status:'active'|'complete'|'failed';
  }
  export interface Contract {
    id:number; kind:ContractKind; target:number; title:string; brief:string; goal:number; progress:number;
    baseline:number; deadline:number; reward:number; status:'offer'|'active'|'complete'|'failed';
  }
  export interface Campaign {
    schema:2; doctrine:Doctrine; upgrades:UpgradeId[]; draft:UpgradeId[]; draftTier:number; nextDraft:number;
    missions:FieldMission[]; nextMission:number; cooldowns:Record<string,number>;
    contracts:Contract[]; round:number; nextOffer:number; completedOrders:number; failedOrders:number;
    deliveries:number; mediations:number; surveys:number; truces:Record<string,number>;
  }
  export const DOCTRINES:Record<Doctrine,{name:string;tag:string;desc:string;tradeoff:string;icon:string}>={
    rebuild:{name:'民生先行',tag:'建设 / 辐射',desc:'民生工程费用 −10%；从人口中心向乡村恢复生活。',tradeoff:'部队维护费 +15%',icon:'home'},
    mobility:{name:'生命走廊',tag:'运输 / 机动',desc:'部队与运输队移动时间 −20%；以交通线组织重建。',tradeoff:'所有工程费用 +10%',icon:'convoy'},
    accord:{name:'地方共治',tag:'调解 / 复员',desc:'地方调解费用 −25%；正式和谈推进 +25%。',tradeoff:'联合支援队招募费 +$4',icon:'peace'}
  };
  export const UPGRADES:Record<UpgradeId,{name:string;tag:string;desc:string;icon:string;flavor:string}>={
    works:{name:'模块化工地',tag:'工程网络',desc:'额外 1 支工程队；所有工程施工速度 +15%。',icon:'wrench',flavor:'先让工具到达，再让承诺落地。'},
    cooperative:{name:'乡村合作社',tag:'经济循环',desc:'通补给的非城市就业项目，每级增加 $0.8 月收入；当地民心每周 +0.05。',icon:'jobs',flavor:'一份生计，胜过一百份公告。'},
    radio:{name:'山间电台',tag:'情报网络',desc:'已建学校的地区及其邻区，每周情报 +1.2；侦察时长减半。',icon:'radar',flavor:'让消息比流言走得更快。'},
    clinics:{name:'流动诊疗',tag:'救援协同',desc:'援助运输到达后，相邻地区民心也 +3；目的地返乡人数额外 +1500。',icon:'health',flavor:'医院不应该只存在于地图的中央。'},
    prepared:{name:'社区演练',tag:'灾害韧性',desc:'有安置设施的危险区每周自动增加 5% 疏散进度；空运额外疏散 15%。',icon:'volcano',flavor:'最好的救援，发生在警报之前。'},
    precision:{name:'透明采购',tag:'财政纪律',desc:'每周额外消退 0.25 通胀、0.08 腐败；工程速度 −7%。',icon:'audit',flavor:'慢一点验收，少一点消失的预算。'},
    local:{name:'在地守护',tag:'民军协同',desc:'保护居民姿态的国民军，让所在区及邻区民心每周 +0.06。',icon:'shield',flavor:'留下的人，也应当是熟悉的人。'},
    compact:{name:'停火观察员',tag:'地方协议',desc:'成功调解后，该地区停火 24 周，双方停止交战和武装扩张。',icon:'peace',flavor:'先有一座村庄不再响起枪声。'},
    reserve:{name:'后备补给站',tag:'战线续航',desc:'驻守己方道路的部队每周补给 +5；空运费用 −$3。',icon:'box',flavor:'不让前线只剩下一条虚线。'}
  };
  export const OPERATIONS:Record<OperationKind,{name:string;cost:number;weeks:number;icon:string;desc:string}>={
    recon:{name:'空中侦察',cost:5,weeks:3,icon:'radar',desc:'3 周后揭示本区与邻区情报。无需地面补给；同地区冷却 16 周。'},
    convoy:{name:'援助运输',cost:10,weeks:2,icon:'convoy',desc:'车队从总部沿公路出发。交付后民心最多 +9、安置 2500 人；被截断会等待，暴露在武装区会损失物资。'},
    mediate:{name:'地方调解',cost:8,weeks:8,icon:'peace',desc:'当地情报至少 40、武装少于 30。持续 8 周，成功后武装减半、民心 +6；武装达到 30 时暂停。'},
    airlift:{name:'紧急空运',cost:12,weeks:3,icon:'airlift',desc:'绕过道路。目标及相邻部队补给 +35；危险区疏散 +25%。同地区冷却 20 周。'}
  };
  export function initCampaign(s:State,doctrine:Doctrine='rebuild'):Campaign {
    if(s.campaign)return s.campaign;
    s.campaign={schema:2,doctrine,upgrades:[],draft:[],draftTier:0,nextDraft:16,missions:[],nextMission:1,cooldowns:{},contracts:[],round:0,nextOffer:0,completedOrders:0,failedOrders:0,deliveries:0,mediations:0,surveys:0,truces:{}};
    generateContracts(s);return s.campaign;
  }
  export const hasUpgrade=(s:State,key:UpgradeId):boolean=>!!s.campaign?.upgrades.includes(key);
  export const isTruce=(s:State,id:number):boolean=>(s.campaign?.truces[String(id)]??0)>s.week;
  export const projectCapacity=(s:State):number=>4+s.policies.logistics+(hasUpgrade(s,'works')?1:0);
  export const recruitCost=(s:State,kind:UnitKind):number=>UNIT_DEFS[kind].cost+(s.campaign?.doctrine==='accord'&&kind==='coalition'?4:0);
  export function campaignProjectFactor(s:State,kind:ProjectKind):number {
    if(s.campaign?.doctrine==='mobility')return 1.1;
    return s.campaign?.doctrine==='rebuild'&&['water','health','school','jobs','shelter'].includes(kind)?.9:1;
  }
  export function operationCost(s:State,kind:OperationKind):number {
    return OPERATIONS[kind].cost-(kind==='mediate'&&s.campaign?.doctrine==='accord'?2:0)-(kind==='airlift'&&hasUpgrade(s,'reserve')?3:0);
  }
  export function operationAllowed(s:State,id:number,kind:OperationKind):string {
    if(!s.campaign)return '请先开始新版行动';
    if(!Object.hasOwn(OPERATIONS,kind))return '无效行动';
    const d=s.districts[id];if(!d)return '无效地区';
    if(s.outcome!=='playing')return '行动已结束';
    if(s.campaign.missions.filter(m=>m.status==='active').length>=2)return '两组外勤人员都在执行任务';
    if(s.campaign.missions.some(m=>m.target===id&&m.kind===kind&&m.status==='active'))return '同一任务已在执行';
    const remaining=(s.campaign.cooldowns[`${kind}:${id}`]??0)-s.week;
    if(remaining>0)return `此地还需等待 ${remaining} 周才能重复该行动`;
    if(s.money<operationCost(s,kind))return '资金不足';
    if(d.hazard>0&&kind!=='recon')return '熔岩区暂时不能接收人员或物资';
    if(kind==='convoy'){
      if(id===s.hq)return '请选择总部以外的接收地区';
      if(controlled(d))return '先恢复接收地区的安全';
      if(!findPath(s,s.hq,id))return '运输路线被灾害完全截断';
    }
    if(kind==='mediate'&&(d.intel<40||d.rebels>=30))return '需情报 ≥40%、武装规模 <30';
    if(kind==='airlift'&&!d.warning&&!s.units.some(u=>active(u)&&(u.at===id||d.neighbors.includes(u.at))&&u.supply<90))return '此处没有待疏散居民或需要补给的部队';
    return '';
  }
  export function launchOperation(s:State,id:number,kind:OperationKind):Result {
    const reason=operationAllowed(s,id,kind);if(reason)return {ok:false,message:reason};
    const c=s.campaign!,cost=operationCost(s,kind),path=kind==='convoy'?findPath(s,s.hq,id)!:[];
    const m:FieldMission={id:c.nextMission++,kind,target:id,at:kind==='convoy'?s.hq:id,path,leg:0,legTotal:path.length?travelCost(s,s.districts[s.hq],s.districts[path[0]]):1,progress:0,total:OPERATIONS[kind].weeks,cargo:100,stalled:0,started:s.week,cost,status:'active'};
    if(kind==='recon'&&hasUpgrade(s,'radio'))m.total=1.5;
    s.money-=cost;s.spentCivil+=cost;c.missions.push(m);c.cooldowns[`${kind}:${id}`]=s.week+(kind==='convoy'?24:kind==='mediate'?28:kind==='airlift'?20:16);
    addLog(s,`${OPERATIONS[kind].name} → ${s.districts[id].name}，预算 $${cost}。`);
    return {ok:true,message:kind==='convoy'?'运输队已出发。可以在地图上跟踪它，并用部队保护路线。':'外勤行动开始。结果将在任务完成后生效。'};
  }
  export function missionETA(s:State,m:FieldMission):number {
    if(m.kind!=='convoy')return Math.max(0,Math.ceil(m.total-m.progress));
    let eta=Math.max(0,m.total-m.progress),at=m.at;
    m.path.forEach((id,i)=>{eta+=i===0?Math.max(0,m.legTotal-m.leg):travelCost(s,s.districts[at],s.districts[id]);at=id;});return Math.ceil(eta);
  }
  export function cancelOperation(s:State,id:number):Result {
    if(s.outcome!=='playing')return {ok:false,message:'行动已结束'};
    const m=s.campaign?.missions.find(x=>x.id===id&&x.status==='active');if(!m)return {ok:false,message:'没有可撤回的行动'};
    m.status='failed';s.money+=Math.floor(m.cost*.3);addLog(s,`${OPERATIONS[m.kind].name}已撤回，收回 $${Math.floor(m.cost*.3)}。`,'warn');return {ok:true,message:'已撤回外勤人员，退回 30% 预算；冷却时间不变。'};
  }
  export function rerouteMission(s:State,id:number):Result {
    const m=s.campaign?.missions.find(x=>x.id===id&&x.status==='active'&&x.kind==='convoy');
    if(!m||s.outcome!=='playing')return {ok:false,message:'没有可改道的运输队'};
    if(controlled(s.districts[m.target])||s.districts[m.target].hazard)return {ok:false,message:'接收地区尚不安全，无法改道'};
    if(m.at===m.target)return {ok:false,message:'运输队已经到达，正在交付'};
    const dist=new Map<number,number>([[m.at,0]]),prev=new Map<number,number>(),queue=new Set(s.districts.map(d=>d.id));
    while(queue.size){let best=-1,value=Infinity;for(const i of queue){const v=dist.get(i)??Infinity;if(v<value){value=v;best=i;}}if(best<0)break;queue.delete(best);if(best===m.target)break;
      for(const n of s.districts[best].neighbors){if(!queue.has(n)||controlled(s.districts[n])||s.districts[n].hazard)continue;const next=value+travelCost(s,s.districts[best],s.districts[n]);if(next<(dist.get(n)??Infinity)){dist.set(n,next);prev.set(n,best);}}
    }
    if(!prev.has(m.target))return {ok:false,message:'没有绕开敌控与熔岩区的安全路线'};
    const path:number[]=[];let at=m.target;while(at!==m.at){path.unshift(at);at=prev.get(at)!;}
    if(path.join(',')===m.path.join(','))return {ok:false,message:'当前已经是可用的最佳路线'};
    m.path=path;m.leg=0;m.legTotal=travelCost(s,s.districts[m.at],s.districts[path[0]]);m.stalled=0;
    addLog(s,`运输队已改道，从${s.districts[m.at].name}继续出发。`);return {ok:true,message:'已避开敌控和熔岩区。运输队从当前位置继续，不消耗额外预算。'};
  }
  function finishMission(s:State,m:FieldMission):void {
    const c=s.campaign!,d=s.districts[m.target];m.status='complete';
    switch(m.kind){
      case 'recon':for(const id of [d.id,...d.neighbors])s.districts[id].intel=clamp(s.districts[id].intel+55);c.surveys++;break;
      case 'convoy':{
        const efficiency=m.cargo/100;d.support=clamp(d.support+9*efficiency);d.unrest=clamp(d.unrest-7*efficiency);d.displaced=Math.max(0,d.displaced-2500*efficiency);s.reputation=clamp(s.reputation+1.5*efficiency);c.deliveries++;
        if(hasUpgrade(s,'clinics')){d.displaced=Math.max(0,d.displaced-1500*efficiency);d.neighbors.forEach(n=>s.districts[n].support=clamp(s.districts[n].support+3*efficiency));}break;
      }
      case 'mediate':d.rebels*=.5;d.support=clamp(d.support+6);d.unrest=clamp(d.unrest-12);if(d.rebels<5&&d.support>=50)d.camp=false;c.mediations++;if(s.negotiating)s.peace=clamp(s.peace+3);if(hasUpgrade(s,'compact'))c.truces[String(d.id)]=s.week+24;break;
      case 'airlift':s.units.filter(u=>active(u)&&(u.at===d.id||d.neighbors.includes(u.at))).forEach(u=>u.supply=clamp(u.supply+35));if(d.warning)d.evacuation=clamp(d.evacuation+.25+(hasUpgrade(s,'prepared')?.15:0),0,1);break;
    }
    addLog(s,`${d.name} · ${OPERATIONS[m.kind].name}完成${m.kind==='convoy'?`，物资保全 ${round(m.cargo)}%`:''}。`,'good');
  }
  function missionTick(s:State):void {
    const c=s.campaign!;
    for(const m of c.missions.filter(x=>x.status==='active')){
      const d=s.districts[m.target];
      if(s.week-m.started>48||m.cargo<=0){m.status='failed';addLog(s,`${d.name}的${OPERATIONS[m.kind].name}失去执行条件。`,'bad');continue;}
      if(m.kind==='convoy'&&m.path.length){
        const next=s.districts[m.path[0]],at=s.districts[m.at];
        if(next.hazard>0||controlled(next)||at.hazard>0){m.stalled++;if(m.stalled===1)addLog(s,`运输队在${at.name}等待：前方道路不安全。`,'warn');continue;}
        m.stalled=0;
        const escort=s.units.some(u=>active(u)&&u.kind!=='engineer'&&(u.at===at.id||u.at===next.id));
        if(!escort&&Math.max(at.rebels,next.rebels)>3)m.cargo=clamp(m.cargo-Math.max(at.rebels,next.rebels)*.5);
        if(m.cargo<=0)continue;
        m.leg++;
        if(m.leg>=m.legTotal){m.at=m.path.shift()!;m.leg=Math.max(0,m.leg-m.legTotal);if(!m.path.length)m.leg=0;if(m.path.length)m.legTotal=travelCost(s,s.districts[m.at],s.districts[m.path[0]]);}
        continue;
      }
      if(m.kind==='mediate'&&(d.rebels>=30||d.hazard>0)){m.stalled++;continue;}
      if(m.kind==='convoy'&&(controlled(d)||d.hazard>0)){m.stalled++;continue;}
      if(m.kind==='airlift'&&d.hazard>0){m.status='failed';addLog(s,'火山提前切断了空运接收区。','warn');continue;}
      m.stalled=0;m.progress++;if(m.progress>=m.total)finishMission(s,m);
    }
    if(c.missions.length>30)c.missions=c.missions.filter(m=>m.status==='active'||s.week-m.started<64).slice(-30);
  }
  function generateContracts(s:State):void {
    const c=s.campaign!;if(c.contracts.some(o=>o.status==='active'))return;
    c.contracts=c.contracts.filter(o=>o.status==='complete'||o.status==='failed').slice(-9);
    const rng={rng:(s.seed^((c.round+1)*374761393))>>>0};
    const safe=s.districts.filter(d=>!controlled(d)&&d.hazard===0);
    const urban=safe.filter(d=>['city','town','farm'].includes(d.terrain)&&d.levels[d.demand]<PROJECTS[d.demand].max);
    const remote=safe.filter(d=>['mountain','forest'].includes(d.terrain)&&d.levels.road<3);
    const service=urban[Math.floor(rand(rng)*urban.length)]??safe[0];
    const road=remote[Math.floor(rand(rng)*remote.length)]??safe[0];
    if(!service||!road)return;
    const round=c.round++,base=round*10;
    const list:Contract[]=[
      {id:base+1,kind:'service',target:service.id,title:`让${service.name}重新运转`,brief:`提升 1 级${PROJECTS[service.demand].short}，并让当地民心达到 53%。`,goal:service.levels[service.demand]+1,progress:0,baseline:0,deadline:52,reward:18,status:'offer'},
      {id:base+2,kind:round%2===0?'road':'delivery',target:road.id,title:round%2===0?'山路不再是边界':'两次如约而至',brief:round%2===0?`提升${road.name} 1 级道路，保持补给通畅。`:'完成两次援助运输。保护车队比派出车队更重要。',goal:round%2===0?road.levels.road+1:2,progress:0,baseline:0,deadline:48,reward:round%2===0?17:25,status:'offer'},
      {id:base+3,kind:round%2===0?'dialogue':'protect',target:road.id,title:round%2===0?'让一个村庄放下武器':'十二周没有枪声',brief:round%2===0?`在${road.name}完成地方调解，并使民心 ≥45%、武装 <10。`:`让${service.name}民心 ≥53%、武装 <3、通补给，连续维持 12 周。`,goal:round%2===0?1:12,progress:0,baseline:0,deadline:60,reward:22,status:'offer'}
    ];
    if(list[2].kind==='protect')list[2].target=service.id;
    if(s.scenario==='volcano'&&round===0&&s.week<s.eruptionAt-7){list[2]={id:base+3,kind:'shelter',target:9,title:'在灰烬落下之前',brief:'在冷泉建成至少 1 级安置设施，并在预警时疏散至 90%。',goal:1,progress:0,baseline:0,deadline:s.eruptionAt-1,reward:24,status:'offer'};}
    c.contracts.push(...list);c.nextOffer=Number.MAX_SAFE_INTEGER;
  }
  export function acceptContract(s:State,id:number):Result {
    const c=s.campaign,o=c?.contracts.find(x=>x.id===id&&x.status==='offer');
    if(!c||!o||s.outcome!=='playing')return {ok:false,message:'这项委托已不可接受'};
    if(c.contracts.some(x=>x.status==='active'))return {ok:false,message:'先兑现当前承诺，再接下一项'};
    if(o.kind==='shelter'&&s.week>o.deadline)return {ok:false,message:'这次火山预警已结束'};
    o.status='active';if(o.kind!=='shelter')o.deadline+=s.week;o.baseline=o.kind==='delivery'?c.deliveries:o.kind==='dialogue'?c.nextMission:0;
    c.contracts=c.contracts.filter(x=>x.status!=='offer');
    addLog(s,`接受委托「${o.title}」；期限第 ${o.deadline} 周。`);return {ok:true,message:'承诺已记下。目标已标在地图上；未兑现会失去 2 点声望。'};
  }
  export function contractProgress(s:State,o:Contract):number {
    const c=s.campaign!,d=s.districts[o.target];
    switch(o.kind){
      case 'service':return Math.min(d.levels[d.demand]/o.goal,d.support/53)*100;
      case 'road':return d.supplied?d.levels.road/o.goal*100:0;
      case 'delivery':return (c.deliveries-o.baseline)/o.goal*100;
      case 'dialogue':return Math.min(c.missions.some(m=>m.kind==='mediate'&&m.target===o.target&&m.status==='complete'&&m.id>=o.baseline)?1:0,d.support/45,d.rebels<10?1:0)*100;
      case 'protect':return o.progress/o.goal*100;
      case 'shelter':return Math.min(d.levels.shelter,d.warning?d.evacuation/.9:0)*100;
    }
  }
  function contractsTick(s:State):void {
    const c=s.campaign!;
    c.contracts=c.contracts.filter(o=>!(o.status==='offer'&&o.kind==='shelter'&&s.week>o.deadline));
    for(const o of c.contracts.filter(x=>x.status==='active')){
      const d=s.districts[o.target];if(o.kind==='protect')o.progress=d.support>=53&&d.rebels<3&&d.supplied?o.progress+1:0;
      if(s.week<=o.deadline&&contractProgress(s,o)>=100){o.status='complete';c.completedOrders++;c.nextOffer=s.week+8;s.money+=o.reward;s.reputation=clamp(s.reputation+3);addLog(s,`委托兑现 · ${o.title}。获得 $${o.reward} 与 3 点声望。`,'good');}
      else if(s.week>o.deadline){o.status='failed';c.failedOrders++;c.nextOffer=s.week+8;s.reputation=clamp(s.reputation-2);addLog(s,`委托逾期 · ${o.title}。声望 −2。`,'warn');}
    }
    if(s.week>=c.nextOffer)generateContracts(s);
  }
  export function chooseUpgrade(s:State,id:UpgradeId):Result {
    const c=s.campaign;if(!c||!c.draft.includes(id)||s.outcome!=='playing')return {ok:false,message:'此授权当前不可选择'};
    c.upgrades.push(id);c.draft=[];c.draftTier++;c.nextDraft=[16,56,104][c.draftTier]??99999;
    addLog(s,`施政授权 · ${UPGRADES[id].name}。`,'good');return {ok:true,message:'授权已生效，仅持续本局。被放弃的路线不会同时获得。'};
  }
  export function campaignTick(s:State):void {
    const c=s.campaign;if(!c)return;
    missionTick(s);contractsTick(s);
    if(s.week>=c.nextDraft&&!c.draft.length&&c.draftTier<3){
      const pool=(Object.keys(UPGRADES) as UpgradeId[]).filter(x=>!c.upgrades.includes(x));
      const rng={rng:(s.seed^(c.draftTier+5)*668265263)>>>0};
      for(let i=pool.length-1;i>0;i--){const j=Math.floor(rand(rng)*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
      c.draft=pool.slice(0,3);addLog(s,'新的施政授权已送达。在三条路线中选择一条。','good');
    }
    if(hasUpgrade(s,'precision')){s.inflation=clamp(s.inflation-.25);s.corruption=clamp(s.corruption-.08);}
    for(const d of s.districts){
      if(hasUpgrade(s,'cooperative')&&d.supplied&&d.levels.jobs&&d.terrain!=='city')d.support=clamp(d.support+.05);
      if(hasUpgrade(s,'radio')&&(d.levels.school||d.neighbors.some(id=>s.districts[id].levels.school>0)))d.intel=clamp(d.intel+1.2);
      if(hasUpgrade(s,'prepared')&&d.warning&&d.levels.shelter)d.evacuation=clamp(d.evacuation+.05,0,1);
    }
    for(const u of s.units.filter(active)){
      const d=s.districts[u.at];
      if(hasUpgrade(s,'reserve')&&!controlled(d)&&d.levels.road&&d.hazard<=0)u.supply=clamp(u.supply+5);
      if(hasUpgrade(s,'local')&&u.kind==='national'&&u.stance==='protect'&&!u.path.length)[d.id,...d.neighbors].forEach(id=>s.districts[id].support=clamp(s.districts[id].support+.06));
    }
  }
  /** Strict, reconstructive validation for persisted optional systems. Never spread untrusted objects. */
  export function restoreCampaign(s:State,raw:unknown):void {
    if(raw===undefined)return;
    const x=raw as Campaign;
    const num=(n:unknown,lo=0,hi=1e8):boolean=>typeof n==='number'&&Number.isFinite(n)&&n>=lo&&n<=hi;
    const integer=(n:unknown,lo=0,hi=1e8):boolean=>num(n,lo,hi)&&Number.isInteger(n);
    const bad=():never=>{throw new Error('新版行动数据损坏');};
    if(!x||x.schema!==2||!Object.hasOwn(DOCTRINES,x.doctrine))bad();
    for(const k of ['draftTier','nextDraft','nextMission','round','nextOffer','completedOrders','failedOrders','deliveries','mediations','surveys'] as const)if(!integer(x[k],0,Number.MAX_SAFE_INTEGER))bad();
    if(x.draftTier>3||!Array.isArray(x.upgrades)||!Array.isArray(x.draft)||x.upgrades.length>3||x.draft.length>3||new Set(x.upgrades).size!==x.upgrades.length||new Set(x.draft).size!==x.draft.length||[...x.upgrades,...x.draft].some(id=>!Object.hasOwn(UPGRADES,id))||x.draft.some(id=>x.upgrades.includes(id))||x.upgrades.length!==x.draftTier)bad();
    if(!Array.isArray(x.missions)||x.missions.length>30||!Array.isArray(x.contracts)||x.contracts.length>12)bad();
    const c:Campaign={schema:2,doctrine:x.doctrine,upgrades:[...x.upgrades],draft:[...x.draft],draftTier:x.draftTier,nextDraft:x.nextDraft,missions:[],nextMission:x.nextMission,cooldowns:{},contracts:[],round:x.round,nextOffer:x.nextOffer,completedOrders:x.completedOrders,failedOrders:x.failedOrders,deliveries:x.deliveries,mediations:x.mediations,surveys:x.surveys,truces:{}};
    if(!x.cooldowns||typeof x.cooldowns!=='object'||Array.isArray(x.cooldowns)||Object.keys(x.cooldowns).length>140)bad();
    for(const [key,value] of Object.entries(x.cooldowns)){if(!/^(recon|convoy|mediate|airlift):([0-9]|[12][0-9]|3[0-4])$/.test(key)||!integer(value,0,1000))bad();c.cooldowns[key]=value;}
    if(!x.truces||typeof x.truces!=='object'||Array.isArray(x.truces)||Object.keys(x.truces).length>35)bad();
    for(const [key,value] of Object.entries(x.truces)){if(!/^([0-9]|[12][0-9]|3[0-4])$/.test(key)||!integer(value,0,1000))bad();c.truces[key]=value;}
    const ids=new Set<number>();
    for(const m of x.missions){
      if(!m||!Object.hasOwn(OPERATIONS,m.kind)||!integer(m.id,1)||ids.has(m.id)||!integer(m.target,0,34)||!integer(m.at,0,34)||!['active','complete','failed'].includes(m.status)||!Array.isArray(m.path)||m.path.length>35)bad();ids.add(m.id);
      for(const k of ['leg','legTotal','progress','total','cargo','stalled','started','cost'] as const)if(!num(m[k],0,10000))bad();
      if(m.cargo>100||m.total<=0||m.legTotal<=0||m.progress>m.total+1||m.leg>=m.legTotal||m.started>s.week)bad();
      let at=m.at;for(const n of m.path){if(!integer(n,0,34)||!s.districts[at].neighbors.includes(n))bad();at=n;}
      if(m.path.length&&at!==m.target||m.kind!=='convoy'&&m.path.length)bad();
      c.missions.push({id:m.id,kind:m.kind,target:m.target,at:m.at,path:[...m.path],leg:m.leg,legTotal:m.legTotal,progress:m.progress,total:m.total,cargo:m.cargo,stalled:m.stalled,started:m.started,cost:m.cost,status:m.status});
    }
    if(c.nextMission<=Math.max(0,...ids)||c.missions.filter(m=>m.status==='active').length>2)bad();
    const orderIds=new Set<number>();
    for(const o of x.contracts){
      if(!o||!integer(o.id,1)||orderIds.has(o.id)||!integer(o.target,0,34)||!['service','road','delivery','dialogue','protect','shelter'].includes(o.kind)||!['offer','active','complete','failed'].includes(o.status)||typeof o.title!=='string'||typeof o.brief!=='string'||o.title.length>100||o.brief.length>240)bad();orderIds.add(o.id);
      for(const k of ['goal','progress','baseline','deadline','reward'] as const)if(!num(o[k],0,10000))bad();if(o.goal<=0||o.reward>100)bad();
      c.contracts.push({id:o.id,kind:o.kind,target:o.target,title:o.title,brief:o.brief,goal:o.goal,progress:o.progress,baseline:o.baseline,deadline:o.deadline,reward:o.reward,status:o.status});
    }
    if(c.contracts.filter(o=>o.status==='active').length>1)bad();s.campaign=c;
  }
}
