/** All numbers are fictional game abstractions, not an empirical conflict model. */
namespace Afterfire {
  export type Terrain = 'city'|'town'|'farm'|'forest'|'mountain';
  export type Scenario = 'valley'|'volcano'|'corridor';
  export type Governor = 'civil'|'engineer'|'mediator';
  export type Difficulty = 'relaxed'|'standard'|'veteran';
  export type ProjectKind = 'water'|'health'|'school'|'jobs'|'road'|'police'|'shelter'|'survey';
  export type PolicyKind = 'audit'|'outreach'|'logistics'|'training'|'diplomacy'|'forecast';
  export type UnitKind = 'coalition'|'national'|'engineer';
  export type Stance = 'protect'|'balanced'|'assault';
  export type Layer = 'terrain'|'support'|'supply'|'intel';
  export interface Point { x:number; y:number; }
  export interface Project { kind:ProjectKind; progress:number; total:number; spent:number; }
  export interface District {
    id:number; name:string; x:number; y:number; polygon:Point[]; neighbors:number[];
    terrain:Terrain; population:number; support:number; stability:number; intel:number;
    rebels:number; camp:boolean; unrest:number; demand:ProjectKind;
    levels:Record<ProjectKind,number>; project:Project|null;
    supplied:boolean; evacuation:number; evacuating:boolean; hazard:number;
    warning:boolean; displaced:number; lastCombat:number; lastLoss:number;
  }
  export interface Unit {
    id:number; name:string; kind:UnitKind; at:number; path:number[];
    leg:number; legTotal:number; hp:number; supply:number; training:number;
    contract:number; stance:Stance; experience:number;
  }
  export interface Log { week:number; text:string; type:'info'|'good'|'bad'|'warn'; }
  export interface EventChoice { text:string; detail:string; cost:number; effect:string; }
  export interface GameEvent { id:string; title:string; body:string; choices:EventChoice[]; }
  export interface Snapshot { week:number; support:number; reputation:number; rebels:number; money:number; stable:number; }
  export interface State {
    version:1; seed:number; rng:number; scenario:Scenario; governor:Governor; difficulty:Difficulty;
    week:number; money:number; reputation:number; corruption:number; inflation:number;
    policies:Record<PolicyKind,number>; districts:District[]; units:Unit[]; hq:number;
    nextUnit:number; paused:boolean; speed:number; event:GameEvent|null;
    logs:Log[]; history:Snapshot[]; outcome:'playing'|'victory'|'defeat'; endReason:string;
    peace:number; negotiating:boolean; peaceHold:number; casualties:number;
    rescued:number; spentCivil:number; spentMilitary:number; completed:number;
    warningAt:number; eruptionAt:number; eruptionCount:number; hazardZones:number[];
    eventIndex:number; nextEvent:number; rain:boolean; lastIncome:number; lastUpkeep:number;
    stableEver:number[]; losses:number; mood:string;
  }
  export interface Result { ok:boolean; message:string; }
  export interface ProjectDef { name:string; short:string; icon:string; cost:number; weeks:number; max:number; desc:string; }
  export const PROJECTS:Record<ProjectKind,ProjectDef> = {
    water:{name:'净水与灌溉',short:'净水',icon:'water',cost:7,weeks:7,max:2,desc:'恢复饮水与灌溉。改善民心；回应净水诉求时效果加倍。'},
    health:{name:'基层诊所',short:'医疗',icon:'health',cost:8,weeks:9,max:2,desc:'提供基本医疗，持续改善民心；减少灾害伤亡。'},
    school:{name:'社区学校',short:'教育',icon:'school',cost:7,weeks:10,max:2,desc:'长期改善民心，逐步降低不满与招募土壤。'},
    jobs:{name:'以工代赈',short:'就业',icon:'jobs',cost:10,weeks:11,max:2,desc:'恢复生计，改善民心；每级增加月度财政收入。'},
    road:{name:'公路与桥梁',short:'道路',icon:'road',cost:8,weeks:8,max:3,desc:'加快移动、工程和补给恢复。公路让相邻地区更易连接。'},
    police:{name:'社区警务',short:'警务',icon:'shield',cost:9,weeks:9,max:2,desc:'提高情报、阻止小股渗透。不能替代部队清剿大规模武装。'},
    shelter:{name:'避难与安置',short:'安置',icon:'home',cost:6,weeks:7,max:2,desc:'降低火山风险，加快疏散与流离失所者返乡。'},
    survey:{name:'地区调查',short:'调查',icon:'radar',cost:4,weeks:3,max:2,desc:'迅速提高当地情报。情报不足时只能看到武装规模估计。'}
  };
  export const POLICIES:Record<PolicyKind,{name:string;cost:number;max:number;desc:string;icon:string}> = {
    audit:{name:'独立审计',cost:12,max:3,desc:'持续降低腐败。腐败会吞噬施工效率，并直接拖累民心。',icon:'audit'},
    outreach:{name:'地方议事会',cost:11,max:3,desc:'全区情报与民心缓慢增长；提高稳定地区的辐射效应。',icon:'people'},
    logistics:{name:'工程与后勤',cost:12,max:3,desc:'施工速度 +20%，工程并行上限 +1，补给恢复更快。',icon:'road'},
    training:{name:'联合训练',cost:13,max:3,desc:'国民军战力 +22%；减少训练时间，所有部队损耗降低。',icon:'shield'},
    diplomacy:{name:'调解与复员',cost:13,max:3,desc:'降低武装招募，解锁和谈；民心和安全共同决定谈判进展。',icon:'peace'},
    forecast:{name:'灾害监测',cost:9,max:2,desc:'火山预警提前 8 周 / 级，疏散效率提高，灾害伤亡降低。',icon:'volcano'}
  };
  export const UNIT_DEFS:Record<UnitKind,{name:string;cost:number;train:number;power:number;upkeep:number;desc:string}> = {
    coalition:{name:'联合支援队',cost:17,train:2,power:7.2,upkeep:2.1,desc:'快速反应，战力较强；服役 96 周后撤离，可付费延长。'},
    national:{name:'国民军',cost:13,train:12,power:4.8,upkeep:0.85,desc:'需要较长训练，但驻留持久、维护低；受联合训练加成。'},
    engineer:{name:'工程救援队',cost:11,train:5,power:1.3,upkeep:0.65,desc:'加速当地施工与疏散。战力很弱，需要保护。'}
  };
  export const SCENARIOS:Record<Scenario,{name:string;subtitle:string;brief:string;seed:number}> = {
    valley:{name:'河谷重建',subtitle:'01 / 重建与安定',brief:'人口集中在南部河谷。北方山地隐藏着武装营地。让道路、学校与安全一起到达边远地区。',seed:73182},
    volcano:{name:'灰烬山脊',subtitle:'02 / 火山危机',brief:'北部火山即将苏醒。提前部署救援与安置，别让疏散行动暴露城市防线。',seed:58421},
    corridor:{name:'断裂走廊',subtitle:'03 / 后勤压力',brief:'狭长的丘陵与频繁雨季拖慢补给。敌人从两端渗透；切勿把主力孤立在前线。',seed:91603}
  };
  export const GOVERNORS:Record<Governor,{name:string;desc:string}> = {
    civil:{name:'民政专员',desc:'民生项目 −15% 费用；民心恢复更快。'},
    engineer:{name:'工程总监',desc:'施工 +30% 速度；道路项目 −25% 费用。'},
    mediator:{name:'调解代表',desc:'初始民心 +5；和谈进度 +35%。'}
  };
  export const TERRAIN:Record<Terrain,string> = {city:'城市',town:'城镇',farm:'农田',forest:'林地',mountain:'山地'};
  export const clamp=(n:number,lo=0,hi=100):number=>Math.max(lo,Math.min(hi,n));
  export const round=(n:number):number=>Math.round(n);
  export const pct=(n:number):string=>`${Math.round(n)}%`;
  export function rand(s:{rng:number}):number {
    s.rng=(s.rng+0x6D2B79F5)>>>0;
    let t=s.rng; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  }
  export const totalRebels=(s:State):number=>s.districts.reduce((a,d)=>a+d.rebels,0);
  export const population=(s:State):number=>s.districts.reduce((a,d)=>a+d.population,0);
  export const support=(s:State):number=>s.districts.reduce((a,d)=>a+d.support*d.population,0)/population(s);
  export const stableShare=(s:State):number=>s.districts.reduce((a,d)=>a+(d.stability>=100?d.population:0),0)/population(s)*100;
  export const stableCount=(s:State):number=>s.districts.filter(d=>d.stability>=100).length;
  export const controlled=(d:District):boolean=>d.rebels>=18;
  export const active=(u:Unit):boolean=>u.training<=0&&u.hp>0;
  export function addLog(s:State,text:string,type:Log['type']='info'):void {
    s.logs.unshift({week:s.week,text,type}); s.logs=s.logs.slice(0,75);
  }
  export function difficulty(s:State):number { return s.difficulty==='relaxed'?0.7:s.difficulty==='veteran'?1.3:1; }
}
