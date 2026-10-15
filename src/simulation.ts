namespace Afterfire {
  const ok=(message:string):Result=>({ok:true,message});
  const fail=(message:string):Result=>({ok:false,message});
  export function newGame(scenario:Scenario='volcano',governor:Governor='civil',diff:Difficulty='standard',seed=58421):State {
    const s:State={version:1,seed:seed>>>0,rng:seed>>>0,scenario,governor,difficulty:diff,week:0,money:diff==='relaxed'?125:105,reputation:90,corruption:6,inflation:0,policies:{audit:0,outreach:0,logistics:0,training:0,diplomacy:0,forecast:0},districts:makeWorld(seed,scenario,governor),units:[],hq:24,nextUnit:1,paused:true,speed:1,event:null,logs:[],history:[],outcome:'playing',endReason:'',peace:0,negotiating:false,peaceHold:0,casualties:0,rescued:0,spentCivil:0,spentMilitary:0,completed:0,warningAt:32,eruptionAt:48,eruptionCount:0,hazardZones:[],eventIndex:0,nextEvent:24,rain:false,lastIncome:16,lastUpkeep:0,stableEver:[],losses:0,mood:'先恢复民生，再把安全送到边远地区。'};
    if(scenario==='corridor'){s.warningAt=99999;s.eruptionAt=99999;}
    s.districts[s.hq].support=60;s.districts[s.hq].intel=100;
    updateSupply(s);addLog(s,'重建授权生效。请选择人口密集区的紧迫诉求，并建立机动预备队。');
    snapshot(s);return s;
  }
  export function projectCost(s:State,id:number,kind:ProjectKind):number {
    const d=s.districts[id],def=PROJECTS[kind];let discount=1;
    if(s.governor==='civil'&&['water','health','school','jobs','shelter'].includes(kind))discount=.85;
    if(s.governor==='engineer'&&kind==='road')discount=.75;
    return Math.ceil(def.cost*(1+d.levels[kind]*.45)*(1+s.inflation/100)*discount);
  }
  export function projectAllowed(s:State,id:number,kind:ProjectKind):string {
    const d=s.districts[id];if(!d)return '无效地区';
    if(s.outcome!=='playing')return '行动已经结束';
    if(d.project)return '该地区已有施工项目';
    if(d.hazard>0)return '熔岩尚未冷却，无法施工';
    if(controlled(d))return '地区被武装控制，需先恢复安全';
    if(d.intel<25&&kind!=='survey')return '先进行地区调查，或派部队收集情报';
    if(d.levels[kind]>=PROJECTS[kind].max)return '已达到最高等级';
    if(s.districts.filter(x=>x.project).length>=4+s.policies.logistics)return '工程队已满负荷；等待完工或升级后勤';
    if(s.money<projectCost(s,id,kind))return '资金不足';
    return '';
  }
  export function buildProject(s:State,id:number,kind:ProjectKind):Result {
    const reason=projectAllowed(s,id,kind);if(reason)return fail(reason);
    const d=s.districts[id],cost=projectCost(s,id,kind);
    s.money-=cost;s.spentCivil+=cost;s.inflation=clamp(s.inflation+1.9);s.corruption=clamp(s.corruption+cost*.07);
    const total=PROJECTS[kind].weeks*(1+d.levels[kind]*.3);
    d.project={kind,progress:0,total,spent:cost};
    addLog(s,`${d.name}：${PROJECTS[kind].name}开工，预算 $${cost}。`);return ok('工程已开工；安全和补给决定施工速度。');
  }
  export function policyCost(s:State,kind:PolicyKind):number {return Math.ceil(POLICIES[kind].cost*(1+s.policies[kind]*.65)*(1+s.inflation/100));}
  export function buyPolicy(s:State,kind:PolicyKind):Result {
    if(s.outcome!=='playing')return fail('行动已经结束');
    if(s.policies[kind]>=POLICIES[kind].max)return fail('已达到最高等级');
    const cost=policyCost(s,kind);if(s.money<cost)return fail('资金不足');
    s.money-=cost;s.spentCivil+=cost;s.policies[kind]++;s.inflation=clamp(s.inflation+2.5);
    if(kind==='audit')s.corruption=clamp(s.corruption-5);
    if(kind==='forecast'&&!s.districts.some(d=>d.warning))s.warningAt=Math.max(s.week+1,s.eruptionAt-16-s.policies.forecast*8);
    addLog(s,`${POLICIES[kind].name}升级至 ${s.policies[kind]} 级。`,'good');return ok('政策已生效。');
  }
  export function recruit(s:State,kind:UnitKind):Result {
    if(s.outcome!=='playing')return fail('行动已经结束');
    if(s.units.length>=7)return fail('最多部署 7 支部队');
    if(controlled(s.districts[s.hq])||s.districts[s.hq].hazard>0)return fail('总部不安全，无法招募');
    const def=UNIT_DEFS[kind];const cost=def.cost;
    if(s.money<cost)return fail('资金不足');
    s.money-=cost;s.spentMilitary+=cost;
    const id=s.nextUnit++;s.units.push({id,name:`${kind==='coalition'?'联援':kind==='national'?'国民':'工兵'} ${String(id).padStart(2,'0')}`,kind,at:s.hq,path:[],leg:0,legTotal:0,hp:100,supply:100,training:Math.max(1,def.train-(kind==='national'?s.policies.training*2:0)),contract:kind==='coalition'?96:99999,stance:'protect',experience:0});
    addLog(s,`${def.name}进入训练，完成后在河岚城部署。`);return ok('招募成功；训练期间仍需维护经费。');
  }
  export function moveUnit(s:State,unitId:number,to:number):Result {
    const u=s.units.find(x=>x.id===unitId);if(!u||!s.districts[to])return fail('找不到部队或目的地');
    if(s.outcome!=='playing')return fail('行动已经结束');
    if(!active(u))return fail('部队仍在训练');
    if(u.path.length)return fail('部队正在行军；可先停止后续行军，再重新下令');
    if(s.districts[to].hazard>0)return fail('目的地被熔岩阻断');
    const path=findPath(s,u.at,to);if(path===null)return fail('没有可通行路线');
    if(!path.length)return fail('部队已在该地区');
    u.path=path;u.leg=0;u.legTotal=travelCost(s,s.districts[u.at],s.districts[path[0]]);
    return ok(`${u.name} → ${s.districts[to].name}，预计 ${Math.ceil(path.reduce((a,n,i)=>a+travelCost(s,s.districts[i?path[i-1]:u.at],s.districts[n]),0))} 周。`);
  }
  export function haltUnit(s:State,id:number):Result {
    const u=s.units.find(x=>x.id===id);if(!u)return fail('找不到部队');
    // Finish the current edge instead of teleporting backwards to the origin.
    u.path=u.path.slice(0,1);return ok('到达下一地区后停止行军。');
  }
  export function extendContract(s:State,id:number):Result {
    const u=s.units.find(x=>x.id===id);if(!u||u.kind!=='coalition')return fail('仅联合支援队需要延期');
    if(s.money<11)return fail('延期需要 $11');if(u.contract>70)return fail('当前合同尚有充足时间');
    s.money-=11;s.spentMilitary+=11;u.contract+=64;s.reputation=clamp(s.reputation-1.5);return ok('驻留延长 64 周；外交成本 −1.5 声望。');
  }
  export function evacuateCost(s:State,id:number):number {return s.units.some(u=>active(u)&&u.kind==='engineer'&&(u.at===id||s.districts[id].neighbors.includes(u.at)))?3:7;}
  export function evacuate(s:State,id:number):Result {
    const d=s.districts[id];if(!d)return fail('无效地区');
    if(!d.warning)return fail('该地区当前没有火山预警');if(d.evacuating)return fail('疏散正在进行');
    const cost=evacuateCost(s,id);if(s.money<cost)return fail('资金不足');
    s.money-=cost;s.spentCivil+=cost;d.evacuating=true;d.evacuation=Math.max(d.evacuation,.10+d.levels.shelter*.15);
    addLog(s,`${d.name}开始组织疏散。道路、工兵和避难设施可以加速。`,'warn');return ok('疏散开始；留意预警倒计时。');
  }
  export function relief(s:State,id:number):Result {
    const d=s.districts[id];if(!d||!d.displaced)return fail('当地没有待安置居民');
    if(s.money<6)return fail('需要 $6 安置资金');s.money-=6;s.spentCivil+=6;
    d.displaced=Math.max(0,d.displaced-3500);d.support=clamp(d.support+3);s.reputation=clamp(s.reputation+1);return ok('临时安置已落实，受灾家庭开始恢复生活。');
  }
  export function startPeace(s:State):Result {
    if(s.negotiating)return fail('和谈已经启动');
    if(s.week<48)return fail('第 48 周后才能启动正式和谈');
    if(s.policies.diplomacy<1)return fail('需要先启动「调解与复员」');
    if(support(s)<48)return fail('人口加权民心需达到 48%');
    if(totalRebels(s)>180)return fail('先遏制武装扩张（总规模需低于 180）');
    if(s.money<12)return fail('需要 $12 谈判资金');
    s.money-=12;s.spentCivil+=12;s.negotiating=true;s.peace=5;
    addLog(s,'多方停火对话启动。和平需要安全与民生共同支撑。','good');return ok('和谈开始。继续提高民心，减少战火。');
  }
  export function eventFor(s:State):GameEvent {
    const events:GameEvent[]=[
      {id:'aid',title:'援助不是没有条件的',body:'外部援助方提出一批重建资金，但希望优先保障城市。偏远村落的代表要求公开分配规则。',choices:[{text:'接受定向援助',detail:'资金 +22；城市民心 +3，山地与林地民心 −3',cost:0,effect:'aid_city'},{text:'坚持公开分配',detail:'资金 +12；全区民心 +2，腐败 −2',cost:0,effect:'aid_fair'}]},
      {id:'contract',title:'一张异常的工程账单',body:'地方承包商的报价明显高于实际用料。立即调查会扰乱工程进度，但放任它会损害整个重建计划。',choices:[{text:'独立调查',detail:'支出 $8；腐败 −12，声望 +2',cost:8,effect:'audit'},{text:'公开重新招标',detail:'全区工程进度 −2；腐败 −6',cost:0,effect:'retender'},{text:'暂缓处理',detail:'腐败 +8；本期不影响施工',cost:0,effect:'ignore'}]},
      {id:'village',title:'来自山村的停火信',body:'一位社区代表愿意劝说本地武装放下武器，但村民首先需要看到可以维持生计的道路与工作。',choices:[{text:'资助复员与就业',detail:'支出 $10；敌对规模 −18%，民心 +2，和谈 +8',cost:10,effect:'amnesty'},{text:'请地方议事会接触',detail:'声望 +1，民心 +1；不立即减少武装',cost:0,effect:'contact'}]},
      {id:'rain',title:'雨季中的生命线',body:'连续降雨损坏了支路。一支医疗运输队请求临时道路维护，前线则希望优先补充自己的物资。',choices:[{text:'保障民用运输',detail:'支出 $7；全区民心 +3，居民不满下降',cost:7,effect:'civilians'},{text:'补充前线物资',detail:'全部部队补给 +25；民心 −1',cost:0,effect:'military'}]},
      {id:'press',title:'记者要求独立进入前线',body:'有人报告作战行动波及了居民。开放记录可能暴露失误，封锁消息则会让传言代替事实。',choices:[{text:'允许独立监督',detail:'腐败 −4；声望 +3；民心 +1',cost:0,effect:'press_open'},{text:'建立赔偿与救助',detail:'支出 $9；全区民心 +4，声望 +4',cost:9,effect:'compensate'}]},
      {id:'splinter',title:'强硬派拒绝停火',body:'一小股武装认为和平协议会剥夺他们的地位。地方调解员建议保障复员后的生计，避免让每个人都退回战场。',choices:[{text:'扩大复员保障',detail:'支出 $12；和谈 +12，武装规模 −12%',cost:12,effect:'demob'},{text:'继续地区对话',detail:'和谈 +3；一处偏远区出现少量渗透',cost:0,effect:'wait'}]}
    ];
    return events[s.eventIndex%events.length];
  }
  export function chooseEvent(s:State,index:number):Result {
    if(!s.event)return fail('没有待处理事件');const c=s.event.choices[index];if(!c)return fail('无效选项');
    if(s.money<c.cost)return fail('资金不足，请选择不需要额外资金的方案');
    s.money-=c.cost;s.spentCivil+=c.cost;
    const all=(n:number)=>s.districts.forEach(d=>d.support=clamp(d.support+n));
    switch(c.effect) {
      case 'aid_city':s.money+=22;s.districts.forEach(d=>d.support=clamp(d.support+(d.terrain==='city'?3:['mountain','forest'].includes(d.terrain)?-3:0)));break;
      case 'aid_fair':s.money+=12;all(2);s.corruption=clamp(s.corruption-2);break;
      case 'audit':s.corruption=clamp(s.corruption-12);s.reputation=clamp(s.reputation+2);break;
      case 'retender':s.districts.forEach(d=>{if(d.project)d.project.progress=Math.max(0,d.project.progress-2);});s.corruption=clamp(s.corruption-6);break;
      case 'ignore':s.corruption=clamp(s.corruption+8);break;
      case 'amnesty':s.districts.forEach(d=>d.rebels*=.82);all(2);s.peace=clamp(s.peace+(s.negotiating?8:0));break;
      case 'contact':s.reputation=clamp(s.reputation+1);all(1);break;
      case 'civilians':all(3);s.districts.forEach(d=>d.unrest=clamp(d.unrest-6));break;
      case 'military':s.units.forEach(u=>u.supply=clamp(u.supply+25));all(-1);break;
      case 'press_open':s.corruption=clamp(s.corruption-4);s.reputation=clamp(s.reputation+3);all(1);break;
      case 'compensate':all(4);s.reputation=clamp(s.reputation+4);break;
      case 'demob':s.peace=clamp(s.peace+(s.negotiating?12:0));s.districts.forEach(d=>d.rebels*=.88);break;
      case 'wait':s.peace=clamp(s.peace+(s.negotiating?3:0));{const d=s.districts.filter(x=>x.terrain==='mountain'&&x.hazard<=0).sort((a,b)=>a.support-b.support)[0];if(d)d.rebels+=8;}break;
    }
    addLog(s,`${s.event.title}：${c.text}。`,'info');s.event=null;s.eventIndex++;s.nextEvent=s.week+28;s.paused=false;return ok('决策已执行。');
  }
  function snapshot(s:State):void {s.history.push({week:s.week,support:support(s),reputation:s.reputation,rebels:totalRebels(s),money:s.money,stable:stableShare(s)});s.history=s.history.slice(-110);}
  function startInsurgency(s:State):void {
    const ids=s.scenario==='corridor'?[0,13,20]:[2,5,12];
    for(const id of ids){const d=s.districts[id];d.camp=true;d.rebels=12*difficulty(s);}
    addLog(s,'偏远地区出现有组织武装。保护城镇和交通节点，不要让主力陷在群山中。','bad');s.mood='武装开始活动。部队先守人口中心，再协同推进。';
  }
  function monthly(s:State):void {
    const jobs=s.districts.reduce((a,d)=>a+(!controlled(d)&&d.hazard<=0?d.levels.jobs*.65:0),0);
    const income=16+stableCount(s)*.65+jobs+(s.difficulty==='relaxed'?3:0);
    const upkeep=s.units.reduce((a,u)=>a+UNIT_DEFS[u.kind].upkeep,0);
    s.lastIncome=income;s.lastUpkeep=upkeep;
    s.money+=income-upkeep;
    if(s.money<0){s.reputation=clamp(s.reputation-4);s.money=0;addLog(s,'经费不足，军政服务中断，声望受损。','bad');}
    snapshot(s);
  }
  function unitsTick(s:State):void {
    const removed=new Set<number>();
    for(const u of s.units) {
      if(u.training>0){u.training--;if(u.training===0)addLog(s,`${u.name}训练完成，可在总部接收命令。`,'good');continue;}
      if(u.kind==='coalition') {
        u.contract--;
        if(u.contract===12)addLog(s,`${u.name}将在 12 周后撤离，请在部队面板办理延期。`,'warn');
        if(u.contract<=0){removed.add(u.id);addLog(s,`${u.name}合同结束，已撤离地区。`,'warn');continue;}
      }
      let d=s.districts[u.at];
      if(u.path.length) {
        const next=s.districts[u.path[0]];
        if(next.hazard>0){u.path=[];u.leg=0;addLog(s,`${u.name}路线被灾害切断，停止前进。`,'warn');}
        else {
          u.leg+=1;
          if(u.leg>=u.legTotal) {
            u.at=u.path.shift()!;u.leg=0;d=s.districts[u.at];
            if(u.path.length)u.legTotal=travelCost(s,d,s.districts[u.path[0]]);
            if(d.rebels>8){u.path=[];addLog(s,`${u.name}在${d.name}接敌，行军中止。`,'warn');}
          }
        }
      }
      u.supply=clamp(u.supply+(d.supplied?4+d.levels.road*1.8+s.policies.logistics: -4.5));
      if(d.rebels<1&&d.supplied&&!u.path.length)u.hp=clamp(u.hp+1.8+(u.at===s.hq?1:0));
      if(u.supply<=0){u.hp=clamp(u.hp-1.3);}
      d.intel=clamp(d.intel+(u.kind==='engineer'?6:11));
      for(const n of d.neighbors)s.districts[n].intel=clamp(s.districts[n].intel+1.1);
      if(u.hp<=0){removed.add(u.id);s.losses++;s.reputation=clamp(s.reputation-8);addLog(s,`${u.name}失去战斗力，行动被迫终止。`,'bad');}
    }
    s.units=s.units.filter(u=>!removed.has(u.id));
  }
  function combatTick(s:State):void {
    for(const d of s.districts) {
      const local=s.units.filter(u=>active(u)&&u.at===d.id&&!u.path.length);
      if(!local.length||d.rebels<.5||d.hazard>0)continue;
      const adjacent=s.units.filter(u=>active(u)&&!u.path.length&&d.neighbors.includes(u.at)&&u.kind!=='engineer');
      const strength=(u:Unit)=>UNIT_DEFS[u.kind].power*(.4+.6*u.hp/100)*(.25+.75*u.supply/100)*(u.kind==='national'?1+s.policies.training*.22:1)*(u.stance==='protect'?.82:u.stance==='assault'?1.23:1)*(1+u.experience*.002);
      const attack=local.reduce((a,u)=>a+strength(u),0)+adjacent.reduce((a,u)=>a+strength(u)*.28,0);
      const terrain=d.terrain==='mountain'?.56:d.terrain==='forest'?.75:1;
      const before=d.rebels,kills=Math.min(d.rebels,attack*terrain*.53*(.85+rand(s)*.3));
      d.rebels=Math.max(0,d.rebels-kills);d.lastCombat=s.week;d.lastLoss=kills;
      for(const u of local){const hit=Math.min(4.8,before*.062)*(u.kind==='engineer'?1.4:u.kind==='coalition'?.72:1)*(1-s.policies.training*.07);u.hp=clamp(u.hp-hit);u.supply=clamp(u.supply-2);u.experience=clamp(u.experience+.3);}
      const reckless=local.some(u=>u.stance==='assault');
      const risk=(reckless?.22:.025)*(d.terrain==='city'?1.4:1);
      if(rand(s)<risk){const n=Math.ceil((2+rand(s)*7)*(reckless?1.8:1));s.casualties+=n;d.support=clamp(d.support-(reckless?1.1:.3));d.unrest=clamp(d.unrest+(reckless?2.8:.5));s.reputation=clamp(s.reputation-n*.025);if(reckless)addLog(s,`${d.name}报告 ${n} 名居民伤亡；当地对作战方式的不满增加。`,'bad');}
      if(d.rebels<8&&d.rebels>1&&before>8&&s.week%3===0) {
        const exits=d.neighbors.filter(n=>s.districts[n].hazard<=0&&!s.units.some(u=>active(u)&&u.at===n));
        if(exits.length){const to=s.districts[exits.sort((a,b)=>s.districts[a].support-s.districts[b].support)[0]];to.rebels+=d.rebels*.7;d.rebels=0;}
      }
      if(d.rebels<.6){d.rebels=0;if(d.camp){d.camp=false;s.reputation=clamp(s.reputation+1.5);addLog(s,`${d.name}营地被解除。保持安全与服务，避免再次渗透。`,'good');}d.unrest=clamp(d.unrest-3);}
    }
  }
  function civilTick(s:State):void {
    for(const d of s.districts) {
      const local=s.units.filter(u=>active(u)&&u.at===d.id&&!u.path.length);
      const engineer=local.some(u=>u.kind==='engineer');
      if(d.project&&d.hazard<=0&&!controlled(d)) {
        const speed=(s.governor==='engineer'?1.3:1)*(1+s.policies.logistics*.2)*(1-s.corruption*.006)*(d.supplied?1:.22)*(engineer?1.7:1)*(1+d.levels.road*.12)*(d.terrain==='mountain'?.7:1)*(d.rebels>2?.4:1);
        d.project.progress+=speed;
        if(d.project.progress>=d.project.total) {
          const kind=d.project.kind;d.levels[kind]++;d.project=null;s.completed++;
          d.support=clamp(d.support+(d.demand===kind?5:kind==='road'?1.5:2.5));
          if(kind==='survey')d.intel=clamp(d.intel+45);
          addLog(s,`${d.name} · ${PROJECTS[kind].name}完工。`, 'good');
        }
      }
      if(d.hazard>0)continue;
      d.intel=clamp(d.intel+s.policies.outreach*.13+d.levels.police*.45+d.levels.survey*.28+(d.supplied?.06:-.08));
      if(d.evacuating&&d.warning){const nearby=s.units.some(u=>active(u)&&u.kind==='engineer'&&(u.at===d.id||d.neighbors.includes(u.at)));d.evacuation=clamp(d.evacuation+(.06+d.levels.road*.023+d.levels.shelter*.04+s.policies.forecast*.025+(nearby?.085:0))*(d.supplied?1:.55),0,1);}
      if(d.displaced>0)d.displaced=Math.max(0,d.displaced-12-d.levels.shelter*95-d.levels.jobs*25-(engineer?90:0));
      const l=d.levels;
      const service=l.water*.13+l.health*.12+l.school*.105+l.jobs*.12;
      const demand=l[d.demand]>.0?.11:0;
      const neighbor=d.neighbors.filter(n=>s.districts[n].stability>=100).length;
      const gain=service+demand+s.policies.outreach*.058+neighbor*.018+(s.governor==='civil'?.025:0)+(local.length&&local.every(u=>u.stance==='protect')?.07:0);
      const loss=.035+s.corruption*.0013+d.unrest*.001+(d.rebels>3?.18+d.rebels*.006:0)+d.displaced/Math.max(1000,d.population)*.38+(d.supplied?0:.06);
      d.support=clamp(d.support+gain-loss);
      d.unrest=clamp(d.unrest+(d.support<33?.065:-.025)-l.school*.05-l.jobs*.04+(controlled(d)?.1:0));
      if(d.support>=53&&d.rebels<3&&d.supplied){d.stability=clamp(d.stability+.22+(d.support-50)*.075+l.police*.11);}
      else if(d.rebels>5||d.support<42)d.stability=clamp(d.stability-(controlled(d)?3:.6));
      if(d.stability>=100&&!s.stableEver.includes(d.id)){s.stableEver.push(d.id);s.reputation=clamp(s.reputation+1.6);addLog(s,`${d.name}实现稳定，民生和地方治理开始自我维持。`,'good');}
    }
  }
  function enemyTick(s:State):void {
    if(s.week<12)return;
    const factor=difficulty(s)*(s.negotiating?Math.max(.4,1-s.peace/160):1);
    for(const d of s.districts) {
      if(d.hazard>0)continue;
      const troops=s.units.some(u=>active(u)&&u.at===d.id&&!u.path.length);
      if(d.camp&&!troops) {
        const grow=(.7+d.unrest*.008)*factor*(1-s.policies.diplomacy*.14)-Math.max(0,d.support-56)*.045-d.levels.police*.2;
        d.rebels=clamp(d.rebels+grow,0,120);
        if(d.rebels<.5&&d.support>62){d.camp=false;addLog(s,`${d.name}武装营地因复员与社区治理自行解散。`,'good');}
      } else if(d.rebels>0&&!troops) d.rebels=clamp(d.rebels+(.12*factor-d.levels.police*.28-Math.max(0,d.support-60)*.035),0,120);
      if(!troops&&d.rebels>26&&s.week%4===0) {
        const options=d.neighbors.filter(n=>s.districts[n].hazard<=0&&!s.units.some(u=>active(u)&&u.at===n)&&s.districts[n].rebels<20&&s.districts[n].stability<100);
        if(options.length) {
          options.sort((a,b)=>(s.districts[a].support+s.districts[a].levels.police*16)-(s.districts[b].support+s.districts[b].levels.police*16));
          const target=s.districts[options[0]];const split=Math.min(14,d.rebels*.4);d.rebels-=split;target.rebels+=split;
          if(target.intel>=40)addLog(s,`武装向${target.name}渗透。保护道路与人口中心。`,'warn');
        }
      }
    }
    if(s.week%28===0&&s.districts.filter(d=>d.camp).length<3&&(!s.negotiating||s.peace<65)) {
      const candidates=s.districts.filter(d=>d.terrain==='mountain'&&d.hazard<=0&&!d.camp&&d.support<52&&d.levels.police===0&&!s.units.some(u=>active(u)&&u.at===d.id));
      if(candidates.length&&rand(s)<.6*factor){const d=candidates[Math.floor(rand(s)*candidates.length)];d.camp=true;d.rebels+=7*factor;}
    }
  }
  function hazardsTick(s:State):void {
    s.rain=s.week%60>=38&&s.week%60<=49;
    if(s.week%60===38)addLog(s,'雨季到来。未铺装道路与无桥渡河将拖慢部队。','warn');
    for(const d of s.districts)if(d.hazard>0){d.hazard--;if(d.hazard===0){addLog(s,`${d.name}道路重新开放，可以进入并开始重建。`,'good');d.evacuating=false;d.evacuation=0;}}
    if(s.scenario!=='volcano')return;
    if(s.week===s.warningAt) {
      const groups=[[3,9,10],[3,4,11],[2,3,9],[3,10,17]];
      s.hazardZones=groups[s.eruptionCount%groups.length];
      for(const id of s.hazardZones){s.districts[id].warning=true;s.districts[id].evacuation=Math.max(s.districts[id].evacuation,s.districts[id].levels.shelter*.15);}
      addLog(s,`火山预警：${s.hazardZones.map(i=>s.districts[i].name).join('、')}。距离喷发 ${s.eruptionAt-s.week} 周。`,'warn');
      s.mood='火山预警：优先组织危险区疏散，工兵可降低费用并加速。';
    }
    if(s.week===s.eruptionAt) {
      let losses=0,rescued=0;
      for(const id of s.hazardZones) {
        const d=s.districts[id];const safety=Math.min(.98,d.evacuation+d.levels.shelter*.13+s.policies.forecast*.06);
        const n=Math.round(d.population*.022*(1-safety)*(1-d.levels.health*.16));losses+=n;rescued+=Math.round(d.population*d.evacuation);
        d.support=clamp(d.support-8*(1-safety));d.stability=clamp(d.stability-20*(1-safety));d.hazard=12;d.warning=false;d.camp=false;d.rebels=0;
        if(d.project){addLog(s,`${d.name}未完成的工程被灾害摧毁。`,'bad');d.project=null;}
        d.levels.road=Math.max(0,d.levels.road-1);
        const dest=d.neighbors.map(i=>s.districts[i]).filter(x=>!s.hazardZones.includes(x.id)).sort((a,b)=>b.levels.shelter-a.levels.shelter)[0];
        if(dest)dest.displaced+=Math.round(d.population*.38);
        for(const u of s.units.filter(u=>u.at===id)) {
          const safe=d.neighbors.find(n=>!s.hazardZones.includes(n));
          if(safe!==undefined){u.at=safe;u.path=[];u.leg=0;u.hp=clamp(u.hp-12*(1-safety));}else u.hp=clamp(u.hp-30);
        }
      }
      s.casualties+=losses;s.rescued+=rescued;s.reputation=clamp(s.reputation-losses*.026+Math.min(2,rescued/6000));s.eruptionCount++;
      addLog(s,`火山喷发：${losses} 名居民遇难，${rescued.toLocaleString()} 人提前转移；受灾区封闭 12 周。`,losses>30?'bad':'good');
      s.eruptionAt=s.week+100;s.warningAt=s.eruptionAt-16-s.policies.forecast*8;
    }
  }
  function outcomeTick(s:State):void {
    const held=s.districts.filter(controlled);const uncontrolledPop=held.reduce((a,d)=>a+d.population,0)/population(s);
    const stagnation=s.week>96?Math.max(0,.13-stableShare(s)*.003):0;
    const lost=held.length*.035+uncontrolledPop*.9+stagnation+(s.corruption>48?(s.corruption-48)*.006:0);
    s.reputation=clamp(s.reputation-lost+(stableShare(s)>30?.018:0));
    if(s.negotiating) {
      const gain=(.13+Math.max(0,support(s)-42)*.026+stableShare(s)*.003+s.policies.diplomacy*.1-totalRebels(s)*.003)*(s.governor==='mediator'?1.35:1);
      s.peace=clamp(s.peace+gain);
    }
    const peaceWin=stableShare(s)>=70&&s.peace>=100&&totalRebels(s)<65;
    const secureWin=stableShare(s)>=85&&totalRebels(s)<5;
    s.peaceHold=peaceWin||secureWin?s.peaceHold+1:0;
    if(s.peaceHold>=8){s.outcome='victory';s.paused=true;s.endReason=peaceWin?'和平协议生效。稳定的生活让冲突失去了继续的理由。':'重建完成。地方治理与安全开始自我维持。';addLog(s,s.endReason,'good');}
    else if(s.reputation<=0){s.outcome='defeat';s.paused=true;s.endReason='重建授权被撤销。声望耗尽，行动无法继续。';}
    else if(s.week>=360){s.outcome='defeat';s.paused=true;s.endReason='授权期限结束。重建尚未达到可持续和平的条件。';}
    if(s.outcome!=='playing')snapshot(s);
  }
  /** One deterministic simulation week. Pausing is a UI/clock concern; decisions halt the model. */
  export function step(s:State):void {
    if(s.outcome!=='playing'||s.event)return;
    s.week++;s.inflation=clamp(s.inflation-.36);
    s.corruption=clamp(s.corruption+s.districts.filter(d=>d.project).length*.032+s.units.length*.009-s.policies.audit*.095-.014);
    if(s.week===12)startInsurgency(s);
    hazardsTick(s);updateSupply(s);unitsTick(s);combatTick(s);
    s.units=s.units.filter(u=>{if(u.hp>0)return true;s.losses++;s.reputation=clamp(s.reputation-8);addLog(s,`${u.name}失去战斗力，已退出行动。`,'bad');return false;});
    civilTick(s);enemyTick(s);updateSupply(s);
    if(s.week%4===0)monthly(s);outcomeTick(s);
    if(s.week>=s.nextEvent&&s.outcome==='playing'){s.event=eventFor(s);s.paused=true;}
  }
  export function serialize(s:State):string {return JSON.stringify(s);}
  /** Validate before touching live state. Geometry is always rebuilt, never trusted from a save. */
  export function deserialize(text:string):State {
    if(text.length>1500000)throw new Error('存档过大');
    const x=JSON.parse(text) as State;
    if(!x||x.version!==1||!Object.hasOwn(SCENARIOS,x.scenario)||!Object.hasOwn(GOVERNORS,x.governor)||!['relaxed','standard','veteran'].includes(x.difficulty))throw new Error('不兼容的存档格式');
    const finite=(n:unknown,min:number,max:number):boolean=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
    if(!Number.isInteger(x.seed)||!Number.isInteger(x.rng)||!Number.isInteger(x.week)||!finite(x.seed,0,4294967295)||!finite(x.rng,0,4294967295)||!finite(x.week,0,360)||!Array.isArray(x.districts)||x.districts.length!==35||!Array.isArray(x.units)||x.units.length>7)throw new Error('损坏的世界数据');
    const s=newGame(x.scenario,x.governor,x.difficulty,x.seed);
    const globals=['money','reputation','corruption','inflation','nextUnit','peace','peaceHold','casualties','rescued','spentCivil','spentMilitary','completed','warningAt','eruptionAt','eruptionCount','eventIndex','nextEvent','lastIncome','lastUpkeep','losses'] as const;
    for(const k of globals){if(!finite(x[k],0,1e8))throw new Error(`非法数值：${k}`);s[k]=x[k];}
    for(const k of Object.keys(POLICIES) as PolicyKind[]){if(!Number.isInteger(x.policies?.[k])||!finite(x.policies[k],0,POLICIES[k].max))throw new Error('政策数据损坏');s.policies[k]=x.policies[k];}
    x.districts.forEach((d,i)=>{
      if(d.id!==i)throw new Error('地区编号损坏');const dest=s.districts[i];
      for(const k of ['support','stability','intel','rebels','unrest','evacuation','hazard','displaced','lastCombat','lastLoss'] as const){if(!finite(d[k],k==='lastCombat'?-100:0,1e7))throw new Error('地区数值损坏');dest[k]=d[k];}
      if(d.support>100||d.stability>100||d.intel>100||d.unrest>100||d.evacuation>1||d.hazard>12)throw new Error('地区数值越界');
      for(const k of Object.keys(PROJECTS) as ProjectKind[]){if(!Number.isInteger(d.levels?.[k])||!finite(d.levels[k],0,PROJECTS[k].max))throw new Error('工程数据损坏');dest.levels[k]=d.levels[k];}
      dest.camp=!!d.camp;dest.warning=!!d.warning;dest.evacuating=!!d.evacuating;
      if(d.project){const p=d.project;if(!Object.hasOwn(PROJECTS,p.kind)||!finite(p.progress,0,1000)||!finite(p.total,.1,1000)||!finite(p.spent,0,1e6))throw new Error('施工数据损坏');dest.project={kind:p.kind,progress:p.progress,total:p.total,spent:p.spent};}
    });
    const unitIds=new Set<number>();
    s.units=x.units.map(u=>{
      if(!Object.hasOwn(UNIT_DEFS,u.kind)||!Number.isInteger(u.at)||!s.districts[u.at]||!Array.isArray(u.path)||u.path.length>35||!['protect','balanced','assault'].includes(u.stance)||!Number.isInteger(u.id)||u.id<1||unitIds.has(u.id))throw new Error('部队数据损坏');
      unitIds.add(u.id);let at=u.at;for(const n of u.path){if(!s.districts[at].neighbors.includes(n))throw new Error('非法路线');at=n;}
      for(const k of ['leg','legTotal','hp','supply','training','contract','experience'] as const)if(!finite(u[k],0,1e5))throw new Error('部队数值损坏');
      if(u.hp>100||u.supply>100||u.experience>100)throw new Error('部队数值越界');
      return {...u,name:`${u.kind==='coalition'?'联援':u.kind==='national'?'国民':'工兵'} ${String(u.id).padStart(2,'0')}`};
    });
    if(!Number.isInteger(x.nextUnit)||x.nextUnit<=Math.max(0,...s.units.map(u=>u.id)))throw new Error('部队序号损坏');
    s.rng=x.rng;s.week=x.week;s.negotiating=!!x.negotiating;s.rain=!!x.rain;s.mood=typeof x.mood==='string'?x.mood.slice(0,240):s.mood;
    s.hazardZones=Array.isArray(x.hazardZones)?x.hazardZones.filter(n=>Number.isInteger(n)&&!!s.districts[n]):[];
    s.stableEver=Array.isArray(x.stableEver)?[...new Set(x.stableEver.filter(n=>Number.isInteger(n)&&!!s.districts[n]))]:[];
    s.logs=Array.isArray(x.logs)?x.logs.slice(0,75).filter(l=>finite(l.week,0,360)&&typeof l.text==='string'&&['good','bad','warn','info'].includes(l.type)).map(l=>({...l,text:l.text.slice(0,240)})):[];
    s.history=Array.isArray(x.history)?x.history.slice(-110).filter(h=>['week','support','reputation','rebels','money','stable'].every(k=>finite((h as unknown as Record<string,number>)[k],0,1e8))):[];
    s.event=x.event?eventFor(s):null;s.paused=true;s.speed=1;
    if(!['playing','victory','defeat'].includes(x.outcome))throw new Error('结局数据损坏');s.outcome=x.outcome;s.endReason=typeof x.endReason==='string'?x.endReason.slice(0,240):'';
    updateSupply(s);return s;
  }
}
