/** China-inspired fictional province-scale campaign. No real geography, forces or forecasts.
 * The player aggregates a civil-military coordination table, NOT an actual official's powers.
 * This module is opt-in so the v1/v2 simulation and saves retain their original rules.
 */
namespace Afterfire {
  export type TheatreKey='river'|'coast'|'highland';
  export type Readiness='routine'|'reserve'|'mobilized';
  export type Allocation='balanced'|'livelihood'|'industry';
  export type Coordination='local'|'joint'|'central';
  export type AssetKind='grid'|'rail'|'factory'|'network';
  export interface StrategicAsset {kind:AssetKind;at:number;integrity:number;work:number;level:number;}
  export interface CentralSupport {arrival:number;deadline:number;baseline:number;received:boolean;}
  export interface Theatre {
    schema:1;key:TheatreKey;readiness:Readiness;allocation:Allocation;coordination:Coordination;
    pressure:number;output:number;power:number;assets:StrategicAsset[];
    supportRequest:CentralSupport|null;nextSupport:number;nextCabinet:number;
    debt:number;grants:number;reviews:number;failedReviews:number;agreements:number;
    nextTalk:number;lastCasualties:number;hold:number;strain:number;nextShock:number;
    decisions:string[];ledger:{week:number;output:number;power:number;pressure:number;essentials:number}[];
  }
  export const THEATRES:Record<TheatreKey,{name:string;region:string;tag:string;brief:string;map:Scenario;seed:number;fronts:number[];assets:number[];pressure:number;output:number}>= {
    river:{name:'江城保卫线',region:'澜江省 · 架空',tag:'01 / 工业与民生',brief:'2032年，外部冲突冲击沿江工业带。你在省域军地联席协调桌上，兼顾前线防御、工厂复产、县域医疗与财政考核。没有哪个部门能独自解决危机。',map:'valley',seed:203201,fronts:[0,6],assets:[16,24,21,27],pressure:32,output:68},
    coast:{name:'临海压力场',region:'临海省 · 架空',tag:'02 / 通商与威慑',brief:'近海危机使运价、保险和外贸同时承压。提高战备可以加强防御，也会挤占生产并推高外部压力；稳住内需、疏通援助并推动降级，才有可持续的结局。',map:'valley',seed:203202,fronts:[6,13],assets:[23,27,33,24],pressure:55,output:61},
    highland:{name:'云岭生命线',region:'云岭省 · 架空',tag:'03 / 交通与协同',brief:'山地通道承受冲突和恶劣天气的双重压力。统筹跨地区运输、分布式供电与地方自主响应，在不掏空后方的情况下维持前线和居民补给。',map:'corridor',seed:203203,fronts:[0,6],assets:[16,30,24,11],pressure:38,output:63}
  };
  export const ASSETS:Record<AssetKind,{name:string;short:string;icon:string;desc:string}>= {
    grid:{name:'区域供电中心',short:'电力',icon:'power',desc:'可靠供电支撑生产与公共服务。受损或失去补给会拖累全区。'},
    rail:{name:'综合货运枢纽',short:'货运',icon:'convoy',desc:'保持安全、补给和完好度，才能发挥运输与复产作用。'},
    factory:{name:'装备与民用工业园',short:'工业',icon:'jobs',desc:'产出同时受到电力、道路、外部压力和动员占用的影响。'},
    network:{name:'通信与调度中心',short:'通信',icon:'radar',desc:'运行良好时改善全区情报；加固后提高恢复能力。'}
  };
  export const READINESS:Record<Readiness,{name:string;desc:string}>= {
    routine:{name:'常态防御',desc:'不挤占民用生产；战力按基础值。压力每周缓降。'},
    reserve:{name:'有限动员',desc:'战力 +12%、补给恢复 +1；民用产出目标 −8 点，每月维护 +2。'},
    mobilized:{name:'强化动员',desc:'战力 +28%、补给恢复 +2；民用产出目标 −21 点，每月维护 +5，外部压力持续上升。'}
  };
  export const ALLOCATIONS:Record<Allocation,{name:string;desc:string}>= {
    balanced:{name:'均衡预算',desc:'不追加固定开支，保留财政弹性。'},
    livelihood:{name:'三保优先',desc:'每月支出 3；公共服务覆盖 +10 点，全区民心缓升，但产出目标 −3 点。'},
    industry:{name:'产业保供',desc:'每月支出 4；产出目标 +10 点、设施修复 +25%，短期民心恢复较慢。'}
  };
  export const COORDINATIONS:Record<Coordination,{name:string;desc:string}>= {
    local:{name:'属地响应',desc:'地方民心每周 +0.025；施工与跨区修复按基础速度。'},
    joint:{name:'军地协同',desc:'施工与设施修复 +12%；每月协调成本 2。'},
    central:{name:'集中保供',desc:'施工与设施修复 +25%；每月协调成本 4，地方民心每周 −0.025。'}
  };
  const good=(message:string):Result=>({ok:true,message}),bad=(message:string):Result=>({ok:false,message});
  export function newTheatre(key:TheatreKey,governor:Governor='civil',diff:Difficulty='standard',doctrine:Doctrine='rebuild',seed=THEATRES[key].seed):State {
    const def=THEATRES[key],s=newGame(def.map,governor,diff,seed);
    initCampaign(s,doctrine);
    s.theatre={schema:1,key,readiness:'routine',allocation:'balanced',coordination:'local',pressure:def.pressure,output:def.output,power:key==='highland'?66:74,assets:(['grid','rail','factory','network'] as AssetKind[]).map((kind,i)=>({kind,at:def.assets[i],integrity:[68,65,70,72][i],work:0,level:0})),supportRequest:null,nextSupport:0,nextCabinet:0,debt:0,grants:0,reviews:0,failedReviews:0,agreements:0,nextTalk:0,lastCasualties:0,hold:0,strain:0,nextShock:20,decisions:[],ledger:[]};
    s.nextEvent=8;s.money+=18;s.warningAt=99999;s.eruptionAt=99999;
    theatreNames(s);s.logs=[];s.campaign!.contracts=[];s.campaign!.nextOffer=0;generateTheatreContracts(s);
    s.mood='先稳住人口中心和供电，再决定动员与预算。';
    addLog(s,`2032 · ${def.region}。本战役是虚构省域危机；玩家代表联席协调桌，不等同现实官员权限。`);
    addLog(s,'12周后外部武装进入边缘地区；居民诉求与敌方兵力是独立系统。','warn');
    return s;
  }
  // Contract generator is kept in campaign.ts; initialize after districts are renamed.
  function generateTheatreContracts(s:State):void {s.campaign!.round=0;campaignTick(s);}
  export function theatreNames(s:State):void {
    if(!s.theatre)return;
    const base=['北岭关','长松镇','青岚岭','望山关','云屏岭','东屏关','海隘口','白沙县','北站片区','新塘乡','青石县','北城新区','滨湖县','东关镇','西郊片区','茶山乡','清源城区','江北片区','桥西县','东郊片区','临港北区','老城工业区','禾田乡','南城片区','江城中心区','古渡镇','新安片区','临江货运区','西渡口','稻香乡','南站片区','柳岸街道','南原县','临海城区','盐田片区'];
    s.districts.forEach((d,i)=>{d.name=base[i];});
    if(s.theatre.key==='coast'){s.districts[24].name='临海中心区';s.districts[33].name='滨海工业区';s.districts[27].name='海东货运区';}
    if(s.theatre.key==='highland'){s.districts[24].name='云岭中心区';s.districts[11].name='高原通信区';s.districts[30].name='南岭货运区';}
    s.units.forEach(u=>u.name=unitName(s,u.kind,u.id));
  }
  export function unitTitle(s:State,kind:UnitKind):string {return s.theatre?({coalition:'机动支援群',national:'区域防御群',engineer:'工程保障队'} as const)[kind]:UNIT_DEFS[kind].name;}
  export function unitName(s:State,kind:UnitKind,id:number):string {return `${s.theatre?({coalition:'机动',national:'防御',engineer:'工程'} as const)[kind]:kind==='coalition'?'联援':kind==='national'?'国民':'工兵'} ${String(id).padStart(2,'0')}`;}
  export function regionalTitle(s:State):string {return s.theatre?THEATRES[s.theatre.key].name:SCENARIOS[s.scenario].name;}
  export function assetEfficiency(s:State,a:StrategicAsset):number {const d=s.districts[a.at];return controlled(d)||d.hazard>0?0:a.integrity*(d.supplied?1:.35);}
  export function essentials(s:State):number {
    if(!s.theatre)return stableShare(s);
    const t=s.theatre;
    const local=s.districts.reduce((n,d)=>n+d.population*(controlled(d)||d.hazard>0?.12:d.supplied?1:.35)*Math.min(1,.55+d.levels.water*.12+d.levels.health*.12+d.levels.shelter*.04),0)/population(s);
    return clamp(local*(.6+t.power*.004)*100+(t.allocation==='livelihood'?10:0));
  }
  export const theatreCombat=(s:State):number=>!s.theatre?1:s.theatre.readiness==='mobilized'?1.28:s.theatre.readiness==='reserve'?1.12:1;
  export const theatreWorks=(s:State):number=>!s.theatre?1:s.theatre.coordination==='central'?1.25:s.theatre.coordination==='joint'?1.12:1;
  export const theatreRevenue=(s:State):number=>s.theatre?.output!==undefined?.55+s.theatre.output*.0065:1;
  export const theatreUpkeep=(s:State):number=>!s.theatre?0:(s.theatre.readiness==='mobilized'?5:s.theatre.readiness==='reserve'?2:0)+(s.theatre.allocation==='livelihood'?3:s.theatre.allocation==='industry'?4:0)+(s.theatre.coordination==='central'?4:s.theatre.coordination==='joint'?2:0);
  export function cabinetDecision(s:State,axis:'readiness'|'allocation'|'coordination',value:string):Result {
    const t=s.theatre;if(!t||s.outcome!=='playing')return bad('当前不在省域危机行动中');
    if(!['readiness','allocation','coordination'].includes(axis))return bad('无效的决策类别');
    const table=axis==='readiness'?READINESS:axis==='allocation'?ALLOCATIONS:COORDINATIONS;
    if(!Object.hasOwn(table,value))return bad('无效的联席决策');
    if(t[axis]===value)return bad('该方案已经执行');
    if(s.week<t.nextCabinet)return bad(`第 ${t.nextCabinet} 周可再次调整，避免朝令夕改`);
    if(axis==='readiness')t.readiness=value as Readiness;
    else if(axis==='allocation')t.allocation=value as Allocation;
    else t.coordination=value as Coordination;
    t.nextCabinet=s.week+4;t.decisions.push(`${s.week}:${axis}:${value}`);t.decisions=t.decisions.slice(-60);
    const label=(table as Record<string,{name:string}>)[value].name;
    addLog(s,`联席决策 · ${label}。将持续生效，4周内不可再调整。`,'info');return good('方案已生效。下一次调整需等待4周。');
  }
  export function requestCentral(s:State):Result {
    const t=s.theatre;if(!t||s.outcome!=='playing')return bad('当前没有省域授权');
    if(t.supportRequest)return bad('已有支持申请或考核尚未结清');
    if(s.week<t.nextSupport)return bad(`第 ${t.nextSupport} 周后可再次申请`);
    if(s.reputation<35)return bad('协调授权低于35，先修复公共信任');
    t.supportRequest={arrival:s.week+4,deadline:s.week+24,baseline:s.spentCivil,received:false};t.nextSupport=s.week+48;
    addLog(s,'中央专项支持申请已提交：4周后拨付32预算；24周内新增民用投入至少24，且考核时腐败≤30。','info');
    return good('申请进入办理；不是即时到账，也不是无条件收入。');
  }
  export function bridgeFinance(s:State,repay=false):Result {
    const t=s.theatre;if(!t||s.outcome!=='playing')return bad('当前没有省域授权');
    if(repay){if(t.debt<=0)return bad('没有待归还的周转预算');const n=Math.min(t.debt,20);if(s.money<n)return bad(`预算不足以归还 ${n.toFixed(1)}`);s.money-=n;t.debt=Math.max(0,t.debt-n);return good(`已归还 ${n.toFixed(1)} 周转预算。`);}
    if(t.debt>0)return bad('先结清上一笔周转，不能连续借新还旧');
    t.debt=42;s.money+=36;t.decisions.push(`${s.week}:finance`);t.decisions=t.decisions.slice(-60);return good('周转预算 +36；总偿还额42，此后每月自动扣6。纯游戏预算单位。');
  }
  export function repairAssetAllowed(s:State,kind:AssetKind):string {
    const t=s.theatre,a=t?.assets.find(x=>x.kind===kind);if(!t||!a||s.outcome!=='playing')return '当前无此设施';
    const d=s.districts[a.at];if(controlled(d)||!d.supplied)return '先恢复设施所在地区的安全与补给';
    if(a.work)return '修复加固正在进行';if(a.integrity>=96&&a.level>=2)return '设施已处于最佳状态';
    if(t.assets.some(x=>x.work))return '跨区技术队正在另一处施工';
    if(s.money<12)return '修复加固需要12预算';return '';
  }
  export function repairAsset(s:State,kind:AssetKind):Result {
    const reason=repairAssetAllowed(s,kind);if(reason)return bad(reason);
    s.money-=12;s.spentCivil+=12;s.theatre!.assets.find(a=>a.kind===kind)!.work=6;
    addLog(s,`${ASSETS[kind].name}开始修复加固，基准6周。`);return good('技术队已派出；受控或断供时施工暂停。');
  }
  export function diplomaticChannel(s:State):Result {
    const t=s.theatre;if(!t||s.outcome!=='playing')return bad('当前没有省域危机');
    if(s.week<t.nextTalk)return bad(`联络渠道第 ${t.nextTalk} 周可再次使用`);
    if(t.readiness==='mobilized')return bad('强化动员期间无法提出这一轮缓和安排');
    if(s.money<8)return bad('联络与核验需要8预算');
    s.money-=8;s.spentCivil+=8;t.pressure=clamp(t.pressure-9);t.nextTalk=s.week+16;t.agreements++;
    if(s.negotiating)s.peace=clamp(s.peace+4);
    addLog(s,'经授权的联络渠道完成一轮事实核验与人道协调：外部压力 −9，后续需维持克制。','good');return good('外部压力下降9；16周后可开展下一轮。');
  }
  export function theatreMonthly(s:State):void {
    const t=s.theatre;if(!t)return;
    if(t.debt>0){const paid=Math.min(6,t.debt,s.money);s.money-=paid;t.debt-=paid;s.lastUpkeep+=paid;if(paid<Math.min(6,t.debt+paid)){s.reputation=clamp(s.reputation-2);addLog(s,'周转预算偿还不足，协调授权受损。','bad');}}
    t.ledger.push({week:s.week,output:t.output,power:t.power,pressure:t.pressure,essentials:essentials(s)});t.ledger=t.ledger.slice(-90);
  }
  export function theatreTick(s:State):void {
    const t=s.theatre;if(!t)return;
    for(const a of t.assets){const d=s.districts[a.at],safe=!controlled(d)&&d.supplied;
      if(a.work>0&&safe){a.work=Math.max(0,a.work-theatreWorks(s)*(t.allocation==='industry'?1.25:1));if(a.work===0){a.integrity=clamp(a.integrity+32);a.level=Math.min(2,a.level+1);addLog(s,`${ASSETS[a.kind].name}修复加固完成，设施完好度提高。`,'good');}}
      if(controlled(d))a.integrity=clamp(a.integrity-.7);else if(d.rebels>3)a.integrity=clamp(a.integrity-.18);
      else if(safe)a.integrity=clamp(a.integrity+.045+a.level*.018);
    }
    const efficiency=(kind:AssetKind)=>assetEfficiency(s,t.assets.find(a=>a.kind===kind)!);
    const powerTarget=clamp(25+efficiency('grid')*.72+(t.allocation==='livelihood'?2:0));
    t.power=clamp(t.power+(powerTarget-t.power)*.16);
    const occupied=s.districts.filter(controlled).reduce((n,d)=>n+d.population,0)/population(s);
    const jobs=s.districts.reduce((n,d)=>n+(d.supplied&&!controlled(d)?d.levels.jobs:0),0);
    const diversion=t.readiness==='mobilized'?21:t.readiness==='reserve'?8:0;
    const target=clamp(24+efficiency('factory')*.32+efficiency('rail')*.17+t.power*.22+Math.min(12,jobs*.8)-t.pressure*(t.key==='coast'?.23:.12)-occupied*42-diversion+(t.allocation==='industry'?10:t.allocation==='livelihood'?-3:0));
    t.output=clamp(t.output+(target-t.output)*.1);
    const casualties=s.casualties-t.lastCasualties;t.lastCasualties=s.casualties;
    const assault=s.units.filter(u=>active(u)&&u.stance==='assault'&&s.districts[u.at].lastCombat===s.week).length;
    t.pressure=clamp(t.pressure+(t.readiness==='mobilized'?.26:t.readiness==='reserve'?.035:-.055)+casualties*.035+assault*.06-(s.negotiating?.10:0));
    for(const d of s.districts){d.support=clamp(d.support+(t.allocation==='livelihood'?.045:t.allocation==='industry'?-.016:0)+(t.coordination==='local'?.025:t.coordination==='central'?-.025:0)-(t.power<45?.055:0));d.intel=clamp(d.intel+efficiency('network')*.0015);}
    for(const u of s.units.filter(active))if(s.districts[u.at].supplied)u.supply=clamp(u.supply+(t.readiness==='mobilized'?2:t.readiness==='reserve'?1:0));
    const r=t.supportRequest;
    if(r&&!r.received&&s.week>=r.arrival){r.received=true;s.money+=32;t.grants++;addLog(s,'中央专项支持到账32。专项用途考核仍然有效，请留出民生与设施预算。','good');}
    if(r&&s.week>=r.deadline){if(s.spentCivil-r.baseline>=24&&s.corruption<=30){t.reviews++;s.reputation=clamp(s.reputation+3);addLog(s,'专项考核通过：民用投入落实、腐败受控。协调授权 +3。','good');}else{t.failedReviews++;s.reputation=clamp(s.reputation-6);addLog(s,'专项考核未通过：新增民用投入不足24或腐败超过30。协调授权 −6。','bad');}t.supportRequest=null;}
    if(s.week===t.nextShock){const choices=t.assets.filter(a=>a.kind!=='network'||t.key==='highland');const a=choices[(Math.floor(s.week/20)+s.seed)%choices.length];a.integrity=clamp(a.integrity-Math.max(4,15-a.level*4));addLog(s,`供应链冲击 · ${ASSETS[a.kind].name}完好度下降。加固可减轻下一轮损失。`,'warn');t.nextShock=s.week+36;}
  }
  export function theatreStartEnemy(s:State):void {for(const id of THEATRES[s.theatre!.key].fronts){const d=s.districts[id];d.camp=true;d.rebels=16*difficulty(s);}addLog(s,'外部冲突延伸至边缘地区。前线兵力由外部增援维持，不由居民不满生成。','bad');}
  export function theatreEnemyTick(s:State):void {
    if(s.week<12)return;const t=s.theatre!,fronts=THEATRES[t.key].fronts;
    for(const d of s.districts){if(d.hazard>0||isTruce(s,d.id))continue;const troops=s.units.some(u=>active(u)&&u.at===d.id&&!u.path.length);
      if(d.camp&&!troops)d.rebels=clamp(d.rebels+(.64+t.pressure*.007)*difficulty(s)*(s.negotiating?Math.max(.1,1-s.peace/100):1),0,100);
      if(d.rebels>0&&!troops&&!d.camp)d.rebels=Math.max(0,d.rebels-.08-d.levels.police*.12);
      if(!troops&&d.rebels>28&&s.week%4===0){const n=d.neighbors.map(id=>s.districts[id]).filter(x=>x.hazard<=0&&!isTruce(s,x.id)&&x.rebels<16&&!s.units.some(u=>active(u)&&u.at===x.id)).sort((a,b)=>b.levels.road-a.levels.road||a.id-b.id)[0];if(n){const amount=Math.min(11,d.rebels*.28);d.rebels-=amount;n.rebels+=amount;}}
    }
    if(s.week%24===0&&(!s.negotiating||s.peace<75))for(const id of fronts){const d=s.districts[id];if(!isTruce(s,id)&&!s.units.some(u=>active(u)&&u.at===id)){d.camp=true;d.rebels=Math.min(100,d.rebels+5*difficulty(s));}}
  }
  export function theatreOutcome(s:State):void {
    const t=s.theatre!;
    const held=s.districts.filter(controlled).reduce((n,d)=>n+d.population,0)/population(s);
    s.reputation=clamp(s.reputation-held*.7-(essentials(s)<40&&s.week>48?.12:0)-(s.corruption>48?(s.corruption-48)*.005:0));
    if(s.negotiating){const gain=(.22+s.policies.diplomacy*.16+Math.max(0,support(s)-42)*.024+stableShare(s)*.002-totalRebels(s)*.002)*(s.governor==='mediator'?1.35:1)*(s.campaign?.doctrine==='accord'?1.25:1);s.peace=clamp(s.peace+gain-(t.readiness==='mobilized'?.65:0));}
    const diplomatic=s.peace>=85&&t.pressure<=60&&totalRebels(s)<85;
    const defensive=totalRebels(s)<8&&t.pressure<=72;
    const conditions=s.week>=64&&essentials(s)>=70&&t.output>=55&&stableShare(s)>=55&&held<.08&&(diplomatic||defensive);
    t.hold=conditions?t.hold+1:0;s.peaceHold=t.hold;t.strain=t.pressure>=98?t.strain+1:0;
    if(t.hold>=8){s.outcome='victory';s.paused=true;s.endReason=diplomatic?'危机降级：保供、生产与地方生活恢复，停火框架得以维持。':'防御与重建完成：前线受控，后方没有因长期动员被耗空。';addLog(s,s.endReason,'good');}
    else if(s.reputation<=0||t.strain>=12||s.week>=300){s.outcome='defeat';s.paused=true;s.endReason=s.reputation<=0?'协调授权被撤回：军事控制未能替代公共服务与财政责任。':t.strain>=12?'危机失控：外部压力连续12周接近极限，联席方案被中止。':'行动期结束：尚未同时恢复保供、生产和持续安全。';}
  }
  export function theatreEvent(s:State):GameEvent {
    const cards:GameEvent[]=[
      {id:'cn_power',title:'第一场联席会：电力先给谁？',body:'省发改与工信专班要求保障工业连续生产，卫健与市县代表要求先保诊所和居民用电。战区联络席提醒，后方停摆同样会削弱防御。',choices:[{text:'医院与居民优先',detail:'支出8；全区民心 +3、电力 +4；工业产出 −5',cost:8,effect:'cn_lights'},{text:'保住工业连续生产',detail:'支出6；工业产出 +9；全区民心 −1',cost:6,effect:'cn_factory'},{text:'错峰运行，维持现有预算',detail:'不新增支出；电力 +1，工业产出 −2',cost:0,effect:'cn_shift'}]},
      {id:'cn_fiscal',title:'市县的账，不能只看总数',body:'县域基本服务支出吃紧，中心城市则希望加快交通工程。财政席位要求公开取舍；在这张协调桌上，考核目标不会自动变成执行能力。',choices:[{text:'将增量资金下沉县域',detail:'支出10；非城市地区民心 +4，腐败 −2',cost:10,effect:'cn_counties'},{text:'先完成跨区交通节点',detail:'支出10；货运设施完好度 +15，工业产出 +4',cost:10,effect:'cn_freight'},{text:'压缩一般性支出',detail:'预算 +8；全区在建项目进度 −1',cost:0,effect:'cn_saving'}]},
      {id:'cn_readiness',title:'威慑并不免费',body:'联络席请求提高战备；工业园报告关键岗位已经缺人。外部观察方同时关注动员信号。是优先眼前战力，还是维持长期生产能力？',choices:[{text:'安排短期战备补给',detail:'支出9；部队补给 +20；外部压力 +4，工业产出 −3',cost:9,effect:'cn_reserve'},{text:'保护生产，强化联络',detail:'支出7；外部压力 −7，工业产出 +3；部队補给 −5',cost:7,effect:'cn_channel'},{text:'维持既定方案',detail:'不新增支出；外部压力 +2',cost:0,effect:'cn_maintain'}]},
      {id:'cn_data',title:'一份不一致的恢复报告',body:'市县上报的恢复率与现场抽样不一致。统计、审计和工程负责人对核验的时点有分歧；决策质量取决于能否及时知道真实损失。',choices:[{text:'公开修正并独立核验',detail:'支出5；腐败 −10，全区情报 +8；协调授权暂时 −2',cost:5,effect:'cn_verify'},{text:'先现场复核，再发布结论',detail:'不新增支出；腐败 −4，所有在建工程进度 −2',cost:0,effect:'cn_review'}]},
      {id:'cn_trade',title:'外贸订单与通道成本',body:'港航企业报告保险与运输成本上升。稳订单需要公共资金，转内需也需要时间。外部压力会持续反馈到财政，而不只是新闻栏上的文字。',choices:[{text:'协调保险与民用通商',detail:'支出11；外部压力 −8，工业产出 +6',cost:11,effect:'cn_trade'},{text:'转向本地采购与内需',detail:'支出8；工业产出 +4，非城市民心 +2',cost:8,effect:'cn_domestic'},{text:'企业自行消化成本',detail:'不新增支出；工业产出 −5，全区民心 −1',cost:0,effect:'cn_wait'}]},
      {id:'cn_humanitarian',title:'先让平民安全离开',body:'前线地区的居民需要安全转移与医疗接续。保留通道意味着资源不能全部投向作战，但人员伤亡和流离失所也会反过来破坏恢复计划。',choices:[{text:'拨付安置与转运预算',detail:'支出10；流离失所人数减少50%，民心 +3，外部压力 −4',cost:10,effect:'cn_shelter'},{text:'请求属地互助与分散安置',detail:'不新增支出；流离失所人数减少20%，在建工程进度 −1',cost:0,effect:'cn_mutual'}]},
      {id:'cn_oversight',title:'紧急采购，也需要边界',body:'保供企业提出先采购、后补手续以缩短交期；审计代表担心不可追踪的支出。速度和责任都重要，不能假定其中一项没有成本。',choices:[{text:'并行审计与采购',detail:'支出8；腐败 −8，供电设施完好度 +8',cost:8,effect:'cn_procure'},{text:'走完整常规流程',detail:'不新增支出；腐败 −5，工业产出 −3',cost:0,effect:'cn_procedure'}]},
      {id:'cn_offramp',title:'冲突后的台阶',body:'授权联络渠道出现窗口。前线希望把安全条件写清，市县则需要稳定预期以恢复生产。降低动员不能替代防御，但无限延长动员也不是胜利。',choices:[{text:'以核验换取降级',detail:'支出10；外部压力 −10，已启动的和谈 +10；部队补给 −5',cost:10,effect:'cn_offramp'},{text:'先修复基本生活',detail:'支出6；全区民心 +3，工业产出 +3',cost:6,effect:'cn_rebuild'},{text:'保持现状，继续观察',detail:'不新增支出；外部压力 +3',cost:0,effect:'cn_observe'}]}
    ];return cards[s.eventIndex%cards.length];
  }
  export function theatreEventEffect(s:State,effect:string):void {
    const t=s.theatre!;const all=(v:number)=>s.districts.forEach(d=>d.support=clamp(d.support+v));
    const counties=(v:number)=>s.districts.filter(d=>d.terrain!=='city').forEach(d=>d.support=clamp(d.support+v));
    const progress=(v:number)=>s.districts.forEach(d=>{if(d.project)d.project.progress=Math.max(0,d.project.progress+v);});
    const supplies=(v:number)=>s.units.forEach(u=>u.supply=clamp(u.supply+v));
    const asset=(k:AssetKind,v:number)=>{const a=t.assets.find(x=>x.kind===k)!;a.integrity=clamp(a.integrity+v);};
    switch(effect){
      case 'cn_lights':all(3);t.power+=4;t.output-=5;break;case 'cn_factory':t.output+=9;all(-1);break;case 'cn_shift':t.power++;t.output-=2;break;
      case 'cn_counties':counties(4);s.corruption=clamp(s.corruption-2);break;case 'cn_freight':asset('rail',15);t.output+=4;break;case 'cn_saving':s.money+=8;progress(-1);break;
      case 'cn_reserve':supplies(20);t.pressure+=4;t.output-=3;break;case 'cn_channel':t.pressure-=7;t.output+=3;supplies(-5);break;case 'cn_maintain':t.pressure+=2;break;
      case 'cn_verify':s.corruption=clamp(s.corruption-10);s.districts.forEach(d=>d.intel=clamp(d.intel+8));s.reputation=clamp(s.reputation-2);break;
      case 'cn_review':s.corruption=clamp(s.corruption-4);progress(-2);break;case 'cn_trade':t.pressure-=8;t.output+=6;break;case 'cn_domestic':t.output+=4;counties(2);break;
      case 'cn_wait':t.output-=5;all(-1);break;case 'cn_shelter':s.districts.forEach(d=>d.displaced=Math.round(d.displaced*.5));all(3);t.pressure-=4;break;
      case 'cn_mutual':s.districts.forEach(d=>d.displaced=Math.round(d.displaced*.8));progress(-1);break;case 'cn_procure':s.corruption=clamp(s.corruption-8);asset('grid',8);break;
      case 'cn_procedure':s.corruption=clamp(s.corruption-5);t.output-=3;break;case 'cn_offramp':t.pressure-=10;if(s.negotiating)s.peace=clamp(s.peace+10);supplies(-5);break;
      case 'cn_rebuild':all(3);t.output+=3;break;case 'cn_observe':t.pressure+=3;break;
    }
    t.power=clamp(t.power);t.output=clamp(t.output);t.pressure=clamp(t.pressure);t.decisions.push(`${s.week}:${effect}`);t.decisions=t.decisions.slice(-60);
  }
  export function restoreTheatre(s:State,raw:unknown):void {
    if(raw===undefined)return;const x=raw as Theatre;
    const fail=():never=>{throw new Error('省域战役存档损坏');};
    const num=(v:unknown,max=100)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max;
    if(!x||x.schema!==1||!Object.hasOwn(THEATRES,x.key)||!Object.hasOwn(READINESS,x.readiness)||!Object.hasOwn(ALLOCATIONS,x.allocation)||!Object.hasOwn(COORDINATIONS,x.coordination)||s.scenario!==THEATRES[x.key].map)fail();
    for(const k of ['pressure','output','power'] as const)if(!num(x[k]))fail();
    for(const k of ['nextSupport','nextCabinet','grants','reviews','failedReviews','agreements','nextTalk','lastCasualties','hold','strain','nextShock'] as const)if(!num(x[k],1e8)||!Number.isInteger(x[k]))fail();
    if(!num(x.debt,42)||!Array.isArray(x.assets)||x.assets.length!==4||new Set(x.assets.map(a=>a.kind)).size!==4)fail();
    const assets=x.assets.map(a=>{const i=(['grid','rail','factory','network'] as string[]).indexOf(a.kind);if(i<0||a.at!==THEATRES[x.key].assets[i]||!num(a.integrity)||!num(a.work,6)||!num(a.level,2)||!Number.isInteger(a.level))fail();return {kind:a.kind,at:a.at,integrity:a.integrity,work:a.work,level:a.level};});
    if(assets.filter(a=>a.work>0).length>1)fail();
    let supportRequest:CentralSupport|null=null;
    if(x.supportRequest){const r=x.supportRequest;if(!num(r.arrival,1000)||!num(r.deadline,1000)||!Number.isInteger(r.arrival)||!Number.isInteger(r.deadline)||r.deadline!==r.arrival+20||!num(r.baseline,1e8)||typeof r.received!=='boolean')fail();supportRequest={arrival:r.arrival,deadline:r.deadline,baseline:r.baseline,received:r.received};}
    if(!Array.isArray(x.decisions)||x.decisions.length>60||x.decisions.some(v=>typeof v!=='string'||v.length>100)||!Array.isArray(x.ledger)||x.ledger.length>90)fail();
    const ledger=x.ledger.map(v=>{if(!v||!num(v.week,360)||!Number.isInteger(v.week)||!num(v.output)||!num(v.power)||!num(v.pressure)||!num(v.essentials))fail();return {week:v.week,output:v.output,power:v.power,pressure:v.pressure,essentials:v.essentials};});
    s.theatre={schema:1,key:x.key,readiness:x.readiness,allocation:x.allocation,coordination:x.coordination,pressure:x.pressure,output:x.output,power:x.power,assets,supportRequest,nextSupport:x.nextSupport,nextCabinet:x.nextCabinet,debt:x.debt,grants:x.grants,reviews:x.reviews,failedReviews:x.failedReviews,agreements:x.agreements,nextTalk:x.nextTalk,lastCasualties:x.lastCasualties,hold:x.hold,strain:x.strain,nextShock:x.nextShock,decisions:[...x.decisions],ledger};
    theatreNames(s);
  }
}
