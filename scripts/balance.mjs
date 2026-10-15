/** Deterministic smoke/balance benchmark. These are scripted players, not human playtest ratings. */
import {createRequire} from 'node:module';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
process.chdir(resolve(import.meta.dirname,'..'));
if(!existsSync('build/core.js'))execFileSync(process.execPath,['scripts/test.mjs'],{stdio:'inherit'});
const require=createRequire(import.meta.url),C=require('../tests/load-core.cjs'),{play}=require('../tests/pilot.cjs');
const rows=[];
for(const scenario of Object.keys(C.SCENARIOS))for(const difficulty of ['relaxed','standard','veteran'])for(const style of ['idle','military','civil','balanced']){
  const {s,actions}=play(C,{scenario,difficulty,style,seed:C.SCENARIOS[scenario].seed});
  rows.push({scenario,difficulty,style,seed:s.seed,outcome:s.outcome,week:s.week,reputation:+s.reputation.toFixed(2),stable_population_percent:+C.stableShare(s).toFixed(2),support_percent:+C.support(s).toFixed(2),rebels:+C.totalRebels(s).toFixed(2),peace:+s.peace.toFixed(2),casualties:s.casualties,rescued:s.rescued,completed_projects:s.completed,commands:actions.length,invalid_commands:actions.filter(a=>!a.ok).length});
}
mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/balance-report.json',JSON.stringify({note:'Scripted baseline comparisons, not human enjoyment measurements. No gameplay state is edited.',rows},null,2)+'\n');
console.table(rows.map(({scenario,difficulty,style,outcome,week,stable_population_percent,casualties})=>({scenario,difficulty,style,outcome,week,stable:stable_population_percent,casualties})));
if(rows.some(r=>r.invalid_commands))process.exitCode=1;
