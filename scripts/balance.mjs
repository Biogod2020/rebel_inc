/** Reproducible script comparisons. No game state is edited by the full-play pilot. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
process.chdir(resolve(import.meta.dirname,'..'));
// Always rebuild: a stale core invalidates a balance report.
execFileSync(process.execPath,['scripts/test.mjs'],{stdio:'pipe'});
const require=createRequire(import.meta.url),C=require('../tests/load-core.cjs'),{play}=require('../tests/campaign-pilot.cjs');
const rows=[];
function run(options){
 const {s,actions}=play(C,options);C.deserialize(C.serialize(s));
 if(!Number.isFinite(s.money)||s.money<0||s.districts.some(d=>d.support<0||d.support>100||d.rebels<0)||s.units.some(u=>u.hp<=0||u.hp>100)||s.outcome==='playing')throw Error('State invariant failure');
 rows.push({...options,outcome:s.outcome,week:s.week,reputation:+s.reputation.toFixed(2),stable_population_percent:+C.stableShare(s).toFixed(2),support_percent:+C.support(s).toFixed(2),rebels:+C.totalRebels(s).toFixed(2),peace:+s.peace.toFixed(2),casualties:s.casualties,rescued:s.rescued,completed_projects:s.completed,orders:s.campaign.completedOrders,failed_orders:s.campaign.failedOrders,deliveries:s.campaign.deliveries,mediations:s.campaign.mediations,surveys:s.campaign.surveys,upgrades:[...s.campaign.upgrades],commands:actions.length,invalid_commands:actions.filter(a=>!a.ok).length,mission_types:[...new Set(actions.filter(a=>a.action[0]==='operation').map(a=>a.action[2]))]});
}
for(const scenario of Object.keys(C.SCENARIOS))for(const difficulty of ['relaxed','standard','veteran'])for(const doctrine of ['rebuild','mobility','accord'])for(const delta of [0,137])run({scenario,difficulty,doctrine,style:'balanced',seed:C.SCENARIOS[scenario].seed+delta});
for(const scenario of Object.keys(C.SCENARIOS))for(const style of ['idle','military','civil'])run({scenario,difficulty:'standard',doctrine:'rebuild',style,seed:C.SCENARIOS[scenario].seed});
mkdirSync('artifacts',{recursive:true});
const summary={games:rows.length,route_games:rows.filter(r=>r.style==='balanced').length,controls:rows.filter(r=>r.style!=='balanced').length,victories:rows.filter(r=>r.outcome==='victory').length,defeats:rows.filter(r=>r.outcome==='defeat').length,invalid_commands:rows.reduce((n,r)=>n+r.invalid_commands,0)};
writeFileSync('artifacts/balance-report.json',JSON.stringify({version:'0.2.0',note:'54 scripted route/seed/difficulty combinations plus 9 baseline controls. The pilot is not optimal; these are not human win rates or enjoyment ratings. Full-play states are not edited.',summary,rows},null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
console.table(rows.filter(r=>r.style==='balanced'&&r.difficulty==='standard'&&r.seed===C.SCENARIOS[r.scenario].seed).map(({scenario,doctrine,outcome,week,orders,deliveries,mediations,commands})=>({scenario,doctrine,outcome,week,orders,deliveries,mediations,commands})));
if(rows.some(r=>r.invalid_commands))process.exitCode=1;
