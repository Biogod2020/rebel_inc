/** A deliberately modest scripted player. Reads visible threats and uses public commands only.
 * This is a correctness / branch-coverage player, not evidence of human enjoyment or optimal balance.
 */
const base=require('./pilot.cjs');
function nextAction(C,s,style='balanced'){
 const c=s.campaign;if(!c)return base.nextAction(C,s,style);
 if(s.outcome!=='playing')return null;
 if(s.event||style==='idle'||style==='military'||style==='civil')return base.nextAction(C,s,style);
 if(c.draft.length){const preferences=s.scenario==='volcano'?['prepared','works','cooperative','radio','compact','local','reserve','clinics','precision']:c.doctrine==='accord'?['compact','radio','cooperative','local','works','reserve','clinics','precision','prepared']:['works','cooperative','radio','reserve','local','clinics','compact','precision','prepared'];return ['upgrade',preferences.find(k=>c.draft.includes(k))];}
 if(c.contracts.some(o=>o.status==='offer')){
  const offers=c.contracts.filter(o=>o.status==='offer');let o=offers.find(o=>o.kind==='service');
  if(s.scenario==='volcano'&&s.week<10)o=offers.find(o=>o.kind==='shelter')||o;
  else if(c.doctrine==='mobility')o=offers.find(o=>o.kind==='delivery'||o.kind==='road')||o;
  else if(c.doctrine==='accord'&&s.week>15)o=offers.find(o=>o.kind==='dialogue')||o;
  return ['contract',(o||offers[0]).id];
 }
 const a=base.nextAction(C,s,style);
 if(a&&['choice','evacuate','extend'].includes(a[0]))return a;
 if(a?.[0]==='recruit'&&s.units.filter(u=>u.kind!=='engineer').length<2)return a;
 // Prevent a quoted levy from producing an invalid purchase on the accord route.
 if(a?.[0]==='recruit'&&s.money<C.recruitCost(s,a[1]))return null;
 for(const m of c.missions.filter(m=>m.kind==='convoy'&&m.status==='active'&&m.stalled)){
  const probe=C.deserialize(C.serialize(s));if(C.rerouteMission(probe,m.id).ok)return ['reroute',m.id];
 }
 const o=c.contracts.find(o=>o.status==='active');
 const build=(id,kind)=>!C.projectAllowed(s,id,kind)&&s.money>=C.projectCost(s,id,kind)+3?['build',id,kind]:null;
 if(o){const d=s.districts[o.target];
  if(o.kind==='shelter'&&!d.levels.shelter&&!d.project){const b=build(d.id,d.intel<25?'survey':'shelter');if(b)return b;}
  if(o.kind==='service'&&d.levels[d.demand]<o.goal&&!d.project){const b=build(d.id,d.intel<25?'survey':d.demand);if(b)return b;}
  if(o.kind==='road'&&d.levels.road<o.goal&&!d.project){const b=build(d.id,d.intel<25?'survey':'road');if(b)return b;}
  if(o.kind==='dialogue'){
   const done=c.missions.some(m=>m.kind==='mediate'&&m.target===d.id&&m.status==='complete'&&m.id>=o.baseline);
   if(!done&&s.money>=12&&!C.operationAllowed(s,d.id,'mediate'))return ['operation',d.id,'mediate'];
   if(d.intel<40&&!d.project){const b=build(d.id,'survey');if(b)return b;}
   if(d.support<45&&!d.project){const b=build(d.id,d.demand);if(b)return b;}
  }
  if(o.kind==='delivery'&&c.deliveries-o.baseline+c.missions.filter(m=>m.kind==='convoy'&&m.status==='active').length<o.goal&&s.money>=18){const d=s.districts.filter(d=>d.id!==s.hq&&!C.operationAllowed(s,d.id,'convoy')).sort((a,b)=>C.distance(a,s.districts[s.hq])-C.distance(b,s.districts[s.hq]))[0];if(d)return ['operation',d.id,'convoy'];}
 }
 // One early airlift illustrates that disaster logistics can compete with military spending.
 if(s.scenario==='volcano'&&s.eruptionAt-s.week>=3&&s.money>=20&&!c.missions.some(m=>m.kind==='airlift')){
  const d=s.districts.filter(d=>d.warning&&d.evacuation<.8&&!C.operationAllowed(s,d.id,'airlift')).sort((a,b)=>a.evacuation-b.evacuation)[0];if(d)return ['operation',d.id,'airlift'];
 }
 if(c.doctrine==='accord'&&s.money>=18&&s.week>12&&c.missions.filter(m=>m.kind==='mediate').length<5){const d=s.districts.filter(d=>d.intel>=40&&d.rebels>3&&d.rebels<20&&!s.units.some(u=>C.active(u)&&u.at===d.id)&&!C.operationAllowed(s,d.id,'mediate')).sort((a,b)=>b.rebels-a.rebels)[0];if(d)return ['operation',d.id,'mediate'];}
 if(c.doctrine==='mobility'&&s.money>=26&&s.week>=20&&c.missions.filter(m=>m.kind==='convoy').length<5){const d=s.districts.filter(d=>d.id!==s.hq&&d.support<67&&d.intel>=40&&!C.operationAllowed(s,d.id,'convoy')).sort((a,b)=>C.distance(a,s.districts[s.hq])-C.distance(b,s.districts[s.hq]))[0];if(d)return ['operation',d.id,'convoy'];}
 if(s.money>=28&&s.week>=12&&c.surveys<1&&!c.missions.some(m=>m.kind==='recon')){const d=s.districts.filter(d=>d.intel<35&&!C.operationAllowed(s,d.id,'recon')).sort((a,b)=>b.neighbors.length-a.neighbors.length)[0];if(d)return ['operation',d.id,'recon'];}
 return a;
}
function apply(C,s,a){switch(a[0]){case 'upgrade':return C.chooseUpgrade(s,a[1]);case 'contract':return C.acceptContract(s,a[1]);case 'operation':return C.launchOperation(s,a[1],a[2]);case 'reroute':return C.rerouteMission(s,a[1]);default:return base.apply(C,s,a);}}
function play(C,options={}){
 const s=C.newGame(options.scenario||'volcano',options.governor||'civil',options.difficulty||'standard',options.seed??58421);C.initCampaign(s,options.doctrine||'rebuild');
 const actions=[],trace=[];
 for(let w=0;w<365&&s.outcome==='playing';w++){
  for(let n=0;n<18;n++){const a=nextAction(C,s,options.style);if(!a)break;const r=apply(C,s,a);actions.push({week:s.week,action:a,ok:r.ok,message:r.ok?undefined:r.message});if(!r.ok)throw Error(JSON.stringify(actions.at(-1)));}
  C.step(s);if(s.week%20===0)trace.push({week:s.week,money:Math.round(s.money),rep:Math.round(s.reputation),stable:Math.round(C.stableShare(s)),peace:Math.round(s.peace),orders:s.campaign.completedOrders,deliveries:s.campaign.deliveries});
 }
 return {s,actions,trace};
}
module.exports={nextAction,apply,play};
