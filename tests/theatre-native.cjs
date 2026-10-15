/** Native v0.3 offline verification and full Chinese-campaign UI playthrough.
 * Requires npm test/build first. Read-only observations use ?test=1.
 * All game commands, time advancement and file import/export use actual controls.
 * No injected game scripts, storage adapters or state assignments.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const C=require('./load-core.cjs'),pilot=require('./theatre-pilot.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts');fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync(path.join(root,'index.html')),url=pathToFileURL(path.join(root,'index.html')).href+'?test=1';
const errors=[],requests=[],checks=[],actions=[];
const options={headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],viewport:{width:1440,height:900},acceptDownloads:true};
if(process.env.CHROMIUM)options.executablePath=process.env.CHROMIUM;
function watch(p){p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(String(e)));p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});}
const read=p=>p.evaluate(()=>JSON.parse(JSON.stringify(__afterfire.app.state)));
const ui=p=>p.evaluate(()=>{const a=__afterfire.app;return {tab:a.tab,open:a.panelOpen,unit:a.unit,selected:a.selected,cabinet:a.cabinetPage};});
const canonical=s=>{const r=structuredClone(s);r.paused=true;return JSON.stringify(r);};
async function tab(p,t){const a=await ui(p);if(!a.open||a.tab!==t)await p.locator(`.command-dock [data-tab=${t}]`).click();}
async function cabinet(p,t){await tab(p,'policies');if((await ui(p)).cabinet!==t)await p.locator(`[data-cabinet-page=${t}]`).click();}
async function map(p,id){await p.waitForTimeout(30);const q=await p.evaluate(id=>{const a=__afterfire.app,C=__afterfire.core,r=a.renderer,d=a.state.districts[id],rect=r.canvas.getBoundingClientRect(),points=[{x:d.x,y:d.y+4},{x:d.x+13,y:d.y-5}];for(let i=1;i<8;i++)for(const v of d.polygon)points.push({x:d.x+(v.x-d.x)*i/8,y:d.y+(v.y-d.y)*i/8});for(const w of points){if(!C.contains(d.polygon,w.x,w.y)||[...r.positions.values()].some(t=>C.distance(t,w)<21))continue;const p=r.toScreen(w);p.x+=rect.left;p.y+=rect.top;if(document.elementFromPoint(p.x,p.y)===r.canvas)return p;}return null;},id);assert.ok(q,'unobscured map click');await p.mouse.click(q.x,q.y);assert.equal((await ui(p)).selected,id);}
async function unit(p,id){await tab(p,'forces');if((await ui(p)).unit!==id)await p.locator(`#unit-dock [data-unit="${id}"]`).click();}
async function command(p,a){const before=await read(p);switch(a[0]){
 case 'choice':await p.locator(`[data-choice="${a[1]}"]`).click();break;
 case 'cabinet':await cabinet(p,'plan');await p.locator(`[data-cabinet=${a[1]}][data-value=${a[2]}]`).click();break;
 case 'central':await cabinet(p,'supply');await p.locator('[data-action=central-support]').click();break;
 case 'repair':await cabinet(p,'supply');await p.locator(`[data-repair=${a[1]}]`).click();break;
 case 'channel':await tab(p,'situation');await p.locator('[data-action=diplomatic-channel]').click();break;
 case 'policy':await cabinet(p,'capacity');await p.locator(`[data-policy=${a[1]}]`).click();break;
 case 'recruit':await tab(p,'forces');await p.locator(`[data-recruit=${a[1]}]`).click();break;
 case 'upgrade':await p.locator('[data-action=draft]').first().click();await p.locator(`[data-upgrade=${a[1]}]`).click();break;
 case 'contract':await tab(p,'missions');await p.locator(`[data-contract="${a[1]}"]`).click();break;
 case 'build':case 'operation':{if((await ui(p)).unit!==null)await p.keyboard.press('Escape');await map(p,a[1]);const k=a[0]==='build'?'project':'operation';if(!await p.locator(`[data-${k}=${a[2]}]`).count())await p.locator(`[data-action=all-${k}s]`).click();await p.locator(`[data-${k}=${a[2]}]`).click();break;}
 case 'move':await unit(p,a[1]);await map(p,a[2]);break;
 case 'extend':await unit(p,a[1]);await p.locator(`[data-extend="${a[1]}"]`).click();break;
 case 'reroute':await tab(p,'missions');await p.locator(`[data-reroute="${a[1]}"]`).click();break;
 case 'peace':await tab(p,'situation');await p.locator('[data-action=peace]').click();break;
 default:throw Error('Unknown pilot action '+JSON.stringify(a));
 }
 assert.equal(await p.locator('#toast').evaluate(e=>e.classList.contains('error')),false,await p.locator('#toast').innerText());assert.equal((await read(p)).paused,true);actions.push({week:before.week,action:a});
}
async function begin(p){await p.locator('[data-theatre=coast]').click();await p.locator('[data-doctrine=accord]').click();await p.locator('[data-difficulty=standard]').click();await p.locator('[data-action=start]').click();}
async function main(){const profile=fs.mkdtempSync(path.join(os.tmpdir(),'afterfire-china-profile-'));let context;
 try{
 context=await chromium.launchPersistentContext(profile,options);let p=await context.newPage();watch(p);await p.goto(url);await begin(p);
 await command(p,['central']);await command(p,['repair','grid']);await command(p,['cabinet','allocation','livelihood']);await command(p,['recruit','coalition']);
 for(let i=0;i<5;i++)await p.keyboard.press('.');await p.keyboard.press('s');const expected=await read(p);assert.equal(expected.theatre.grants,1);assert.ok(expected.theatre.supportRequest.received);assert.ok(expected.theatre.assets[0].work>0);
 await p.reload();await p.locator('[data-action=continue]').click();assert.equal(canonical(await read(p)),canonical(expected));checks.push('Native offline reload restores pending central audit, partly repaired infrastructure, active cabinet settings and real unit.');
 await context.close();context=await chromium.launchPersistentContext(profile,options);p=await context.newPage();watch(p);await p.goto(url);await p.locator('[data-action=continue]').click();assert.equal(canonical(await read(p)),canonical(expected));checks.push('Chinese campaign survives browser shutdown/restart using actual file:// localStorage.');
 await p.locator('[data-action=help]').click();const dl=p.waitForEvent('download');await p.locator('[data-action=export]').click();const save=path.join(out,'v3-native-midgame-save.json');await (await dl).saveAs(save);
 await p.locator('#modal-layer [data-action=menu]').click();await p.locator('[data-action=start]').click();await p.locator('[data-action=help]').click();await p.locator('#file-input').setInputFiles(save);await p.waitForFunction(()=>__afterfire.app.state.week===5);assert.equal(canonical(await read(p)),canonical(expected));checks.push('Native download/file-input import preserves every state field (pause normalized).');
 const bad=structuredClone(expected);bad.theatre.pressure=101;const badfile=path.join(out,'v3-native-invalid-save.json');fs.writeFileSync(badfile,JSON.stringify(bad));await p.locator('[data-action=help]').click();await p.locator('#file-input').setInputFiles(badfile);await p.waitForTimeout(80);assert.equal(canonical(await read(p)),canonical(expected));assert.ok(await p.locator('#toast').evaluate(e=>e.classList.contains('error')));await p.keyboard.press('Escape');checks.push('Invalid theatre import is rejected without replacing the live campaign.');
 // Fresh normal playthrough, so persistence smoke purchases do not bias the pilot.
 await p.locator('[data-action=menu]').click();await begin(p);const n=actions.length,start=Date.now();
 while((await read(p)).outcome==='playing'){
   for(let i=0;i<18;i++){const a=pilot.nextAction(C,await read(p));if(!a)break;await command(p,a);}
   const s=await read(p);if(s.week%40===0)console.log('NATIVE PLAY',s.week,s.money.toFixed(1),s.theatre.output.toFixed(1));
   await p.keyboard.press('.');assert.ok(Date.now()-start<400000,'native full play time limit');
 }
 const final=await read(p);assert.equal(final.outcome,'victory',final.endReason);await p.screenshot({path:path.join(out,'v3-native-victory.png')});
 const dlFinal=p.waitForEvent('download');await p.locator('[data-action=export]').click();await (await dlFinal).saveAs(path.join(out,'v3-native-victory-save.json'));
 checks.push('Full standard coastal/accord campaign won through native file:// mouse/keyboard controls without injecting scripts or editing game state.');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 const report={version:'0.3.0',build_sha256:crypto.createHash('sha256').update(source).digest('hex'),browser:await p.evaluate(()=>navigator.userAgent),mode:'Native file://. No game-script injection or storage adapter. Test-only observation; all mutations through UI.',checks,page_errors:errors,external_network_requests:requests,ui_commands:actions.length,campaign_commands:actions.length-n,campaign:{theatre:final.theatre.key,doctrine:final.campaign.doctrine,difficulty:final.difficulty,week:final.week,outcome:final.outcome,essentials:C.essentials(final),output:final.theatre.output,pressure:final.theatre.pressure,reviews:final.theatre.reviews,casualties:final.casualties,deliveries:final.campaign.deliveries,mediations:final.campaign.mediations,ending:final.endReason}};
 fs.writeFileSync(path.join(out,'theatre-native-report.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(out,'theatre-native-actions.json'),JSON.stringify(actions,null,2)+'\n');console.log('NATIVE CHINA PASS\n'+JSON.stringify(report,null,2));
 }finally{if(context)await context.close();fs.rmSync(profile,{recursive:true,force:true});}
}
main().catch(e=>{fs.writeFileSync(path.join(out,'theatre-native-failure.json'),JSON.stringify({error:e.stack,actions,checks,errors},null,2));console.error(e);process.exitCode=1;});
