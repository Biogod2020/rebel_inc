import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
process.chdir(resolve(import.meta.dirname,'..'));mkdirSync('build',{recursive:true});
const args=['--strict','--target','ES2020','--lib','ES2022,DOM','--module','none','--outFile','build/core.js','src/model.ts','src/world.ts','src/campaign.ts','src/theatre.ts','src/simulation.ts'];
const local=resolve('node_modules/typescript/bin/tsc');
if(existsSync(local))execFileSync(process.execPath,[local,...args],{stdio:'inherit'});else execFileSync('tsc',args,{stdio:'inherit'});
execFileSync(process.execPath,['--test','tests/core.test.cjs','tests/campaign.test.cjs','tests/theatre.test.cjs'],{stdio:'inherit'});
