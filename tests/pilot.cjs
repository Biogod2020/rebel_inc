/** Test opponent/player: a heuristic using visible threats, not an optimal strategy.
 * Actions pass through the same public command functions as the UI; no stat edits.
 */
function nextAction(C,s,style='balanced') {
  const {PROJECTS,POLICIES}=C;
  if(s.outcome!=='playing')return null;
  const visible=d=>d.intel>=35?d.rebels:0;
  if(s.event){let i=0;const choices=s.event.choices;
    if(s.event.id==='aid')i=1;
    else if(s.event.id==='contract')i=s.money>=16&&s.corruption>10?0:1;
    else if(s.event.id==='village')i=s.money>=20?0:1;
    else if(s.event.id==='rain')i=s.money>=14?0:1;
    else if(s.event.id==='splinter')i=s.negotiating&&s.money>=19?0:1;
    if(s.money<choices[i].cost)i=choices.findIndex(c=>c.cost===0);
    return ['choice',i];
  }
  if(style==='idle')return null;
  if(style!=='military')for(const d of s.districts)if(d.warning&&!d.evacuating&&s.money>=C.evacuateCost(s,d.id))return ['evacuate',d.id];
  for(const u of s.units)if(u.kind==='coalition'&&u.contract<15&&s.money>=11)return ['extend',u.id];
  if(style==='military'){
    if(s.units.length<7&&s.money>=17)return ['recruit',s.units.length<3?'coalition':'national'];
    if(s.policies.training<3&&s.money>=C.policyCost(s,'training'))return ['policy','training'];
  } else if(style!=='civil') {
    const armed=s.units.filter(u=>u.kind!=='engineer').length;
    const target=s.week<25?2:s.week<65?3:s.week<115?4:5;
    if(armed<target&&s.money>=C.recruitCost(s,armed<2?'coalition':'national')+5)return ['recruit',armed<2?'coalition':'national'];
    if(s.scenario==='volcano'&&s.week>15&&!s.units.some(u=>u.kind==='engineer')&&s.money>=22)return ['recruit','engineer'];
  }
  if(style!=='military') {
    const desired=[['outreach',s.week<28?1:s.week<80?2:3],['audit',s.corruption>17?2:1],['logistics',s.week>70?2:1],['diplomacy',s.week>80?2:s.week>48?1:0],['training',s.week>60?1:0],['forecast',s.scenario==='volcano'&&s.week>=16?1:0]];
    for(const [p,level] of desired){if(s.policies[p]<level&&s.money>=C.policyCost(s,p)+10)return ['policy',p];}
    if(!s.negotiating&&s.week>=48&&s.policies.diplomacy&&C.support(s)>=48&&C.totalRebels(s)<180&&s.money>=18)return ['peace'];
  }
  for(const u of s.units) {
    if(u.training>0||u.path.length)continue;
    const d=s.districts[u.at];
    if(u.kind!=='engineer'&&((u.hp<30||u.supply<20)&&u.at!==s.hq))return ['move',u.id,s.hq];
    if(u.at===s.hq&&u.hp<85)continue;
    if(u.kind==='engineer'){
      let dest=s.districts.filter(x=>x.warning&&x.evacuation<.99&&!C.controlled(x)&&x.hazard===0).sort((a,b)=>a.evacuation-b.evacuation)[0];
      if(!dest)dest=s.districts.filter(x=>x.project&&x.hazard===0&&!C.controlled(x)).sort((a,b)=>b.population-a.population)[0];
      if(dest&&dest.id!==u.at&&!d.project&&C.findPath(s,u.at,dest.id))return ['move',u.id,dest.id];
      continue;
    }
    if(d.rebels>1)continue;
    const assigned=id=>s.units.filter(v=>v.id!==u.id&&v.kind!=='engineer'&&(v.path.length?v.path[v.path.length-1]:v.at)===id).length;
    let targets=s.districts.filter(x=>visible(x)>1&&x.hazard===0&&x.id!==u.at&&assigned(x.id)<(visible(x)>32?2:1));
    targets.sort((a,b)=>(visible(b)*1.4+b.population/2000-C.distance(d,b)*.04)-(visible(a)*1.4+a.population/2000-C.distance(d,a)*.04));
    let dest=targets[0];
    if(!dest&&s.week>=8){targets=s.districts.filter(x=>x.id<21&&x.intel<73&&x.hazard===0&&!x.warning&&assigned(x.id)===0&&x.id!==u.at);targets.sort((a,b)=>(b.terrain==='mountain'?18:0)+(73-b.intel)-C.distance(d,b)*.06-((a.terrain==='mountain'?18:0)+(73-a.intel)-C.distance(d,a)*.06));dest=targets[0];}
    if(dest&&C.findPath(s,u.at,dest.id))return ['move',u.id,dest.id];
  }
  if(style!=='military'&&s.money>=9){
    const eligible=s.districts.filter(d=>!d.project&&!C.controlled(d)&&d.hazard===0&&d.intel>=25&&d.support<93);
    const scored=[];
    for(const d of eligible){let kind=d.levels[d.demand]===0?d.demand:['jobs','water','health','school'].find(k=>d.levels[k]===0);
      if(!kind)kind=d.support<75?d.demand:null;if(!kind)continue;
      if(C.projectAllowed(s,d.id,kind))continue;
      const levels=['jobs','water','health','school'].reduce((a,k)=>a+d.levels[k],0);
      const score=Math.pow(d.population/1000,.65)*(100-d.support)/(1+levels*.38)*(d.levels[d.demand]===0?1.3:1);
      scored.push({d,kind,score});
    }
    scored.sort((a,b)=>b.score-a.score);if(scored[0])return ['build',scored[0].d.id,scored[0].kind];
  }
  return null;
}
function apply(C,s,a){switch(a[0]){case 'choice':return C.chooseEvent(s,a[1]);case 'evacuate':return C.evacuate(s,a[1]);case 'extend':return C.extendContract(s,a[1]);case 'recruit':return C.recruit(s,a[1]);case 'policy':return C.buyPolicy(s,a[1]);case 'peace':return C.startPeace(s);case 'move':return C.moveUnit(s,a[1],a[2]);case 'build':return C.buildProject(s,a[1],a[2]);default:throw Error('Unknown test action');}}
function play(C,options={}){const s=C.newGame(options.scenario||'valley',options.governor||'civil',options.difficulty||'standard',options.seed??73182),actions=[],trace=[];for(let t=0;t<365&&s.outcome==='playing';t++){
 for(let a=0;a<18;a++){const action=nextAction(C,s,options.style);if(!action)break;const r=apply(C,s,action);actions.push({week:s.week,action,ok:r.ok});if(!r.ok)break;}
 C.step(s);if(s.week%20===0)trace.push({week:s.week,money:Math.round(s.money),rep:Math.round(s.reputation),support:Math.round(C.support(s)),stable:Math.round(C.stableShare(s)),rebels:Math.round(C.totalRebels(s)),peace:Math.round(s.peace)});
 }return {s,actions,trace};}
module.exports={nextAction,apply,play};
