/** Test-only heuristic. All changes go through public command functions. */
const base=require('./campaign-pilot.cjs');
function nextAction(C,s,style='balanced'){
 const t=s.theatre;if(!t)return base.nextAction(C,s,style);
 if(s.outcome!=='playing')return null;
 if(s.event){let idx=s.money>19?0:s.event.choices.findIndex(x=>x.cost===0);if(style==='military'&&s.event.id==='cn_readiness'&&s.money>9)idx=0;return ['choice',idx];}
 if(style==='idle')return null;
 if(style==='military'){
  if(t.readiness!=='mobilized'&&s.week>=t.nextCabinet)return ['cabinet','readiness','mobilized'];
  const a=base.nextAction(C,s,style);return a;
 }
 if(s.campaign.draft.length)return base.nextAction(C,s,style);
 if(s.units.filter(u=>u.kind!=='engineer').length<2){const a=base.nextAction(C,s,style);if(a?.[0]==='recruit')return a;}
 if(!t.supportRequest&&s.week>=t.nextSupport&&s.reputation>=35)return ['central'];
 if(s.week>=t.nextCabinet){
  if(t.allocation!=='livelihood')return ['cabinet','allocation','livelihood'];
  if(t.coordination!=='joint'&&s.week>=12)return ['cabinet','coordination','joint'];
  if(t.readiness!=='reserve'&&s.week>=24&&s.week<70)return ['cabinet','readiness','reserve'];
  if(t.readiness!=='routine'&&s.week>=70)return ['cabinet','readiness','routine'];
 }
 if(s.money>=25&&!t.assets.some(a=>a.work)){
  const a=t.assets.filter(a=>a.integrity<(a.kind==='grid'?89:74)&&!C.repairAssetAllowed(s,a.kind)).sort((a,b)=>(a.kind==='grid'?-50:0)+a.integrity-((b.kind==='grid'?-50:0)+b.integrity))[0];if(a)return ['repair',a.kind];
 }
 if(t.pressure>48&&s.week>=t.nextTalk&&s.money>=20)return ['channel'];
 const a=base.nextAction(C,s,style);
 if(a?.[0]==='peace'&&t.readiness==='mobilized')return null;
 return a;
}
function apply(C,s,a){switch(a[0]){case 'cabinet':return C.cabinetDecision(s,a[1],a[2]);case 'central':return C.requestCentral(s);case 'repair':return C.repairAsset(s,a[1]);case 'channel':return C.diplomaticChannel(s);default:return base.apply(C,s,a);}}
function play(C,opts={}){
 const s=C.newTheatre(opts.key||'river',opts.governor||'civil',opts.difficulty||'standard',opts.doctrine||'rebuild',opts.seed??C.THEATRES[opts.key||'river'].seed);
 const actions=[],trace=[];
 for(let w=0;w<310&&s.outcome==='playing';w++){
  for(let i=0;i<18;i++){const a=nextAction(C,s,opts.style);if(!a)break;const r=apply(C,s,a);actions.push({week:s.week,action:a,ok:r.ok});if(!r.ok)throw Error(JSON.stringify({...actions.at(-1),message:r.message}));}
  C.step(s);if(s.week%20===0)trace.push({week:s.week,money:Math.round(s.money),rep:Math.round(s.reputation),stable:Math.round(C.stableShare(s)),essentials:Math.round(C.essentials(s)),output:Math.round(s.theatre.output),pressure:Math.round(s.theatre.pressure),enemy:Math.round(C.totalRebels(s)),peace:Math.round(s.peace)});
 }
 return {s,actions,trace};
}
module.exports={nextAction,apply,play};
