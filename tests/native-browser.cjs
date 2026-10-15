/** Native offline/HTTP tests. No inline injection, state edits, or storage adapter.
 * Use an installed Playwright Core via PLAYWRIGHT_MODULE; do not ship browsers.
 * PLAYWRIGHT_MODULE=/absolute/path/playwright-core CHROMIUM=/path/chrome \
 *   node tests/native-browser.cjs
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const http=require('node:http');
const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts');fs.mkdirSync(out,{recursive:true});
const html=fs.readFileSync(path.join(root,'index.html'));
const errors=[],external=[],checks=[];
const args={headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],viewport:{width:1440,height:900},acceptDownloads:true};
if(process.env.CHROMIUM)args.executablePath=process.env.CHROMIUM;
function watch(page){page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url())&&!/^https?:\/\/127\.0\.0\.1:/.test(r.url()))external.push(r.url());});page.setDefaultTimeout(8000);}
const read=page=>page.evaluate(()=>{const s=window.__afterfire.app.state;return {week:s.week,money:s.money,scenario:s.scenario,doctrine:s.campaign.doctrine,outcome:s.outcome,projects:s.districts.map(d=>d.project?.kind??null),units:s.units.map(u=>({kind:u.kind,training:u.training}))};});
async function begin(page){if(await page.locator('[data-setting=classic]').count())await page.locator('[data-setting=classic]').click();await page.locator('[data-scenario=valley]').click();await page.locator('[data-doctrine=mobility]').click();await page.locator('[data-action=start]').click();await page.locator('.command-dock [data-tab=district]').click();await page.locator('[data-project]:not(:disabled)').first().click();await page.keyboard.press('Escape');await page.locator('.command-dock [data-tab=forces]').click();await page.locator('[data-recruit=coalition]').click();await page.keyboard.press('Escape');for(let i=0;i<5;i++)await page.keyboard.press('.');await page.keyboard.press('s');assert.equal((await read(page)).week,5);assert.equal(await page.locator('#toast').evaluate(e=>e.classList.contains('error')),false);return read(page);}
async function restore(page,expected){await page.locator('[data-action=continue]').click();assert.deepEqual(await read(page),expected);}
async function main(){
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'afterfire-native-profile-'));let context,server;
 try{
  const fileURL=pathToFileURL(path.join(root,'index.html')).href+'?test=1';
  context=await chromium.launchPersistentContext(profile,args);let page=await context.newPage();watch(page);await page.goto(fileURL,{waitUntil:'load'});await page.waitForFunction(()=>window.__afterfire);const version=await page.evaluate(()=>navigator.userAgent);
  const expected=await begin(page);await page.reload({waitUntil:'load'});await restore(page,expected);checks.push('Native file:// build starts and preserves an actual project, unit and week through reload.');
  await context.close();context=await chromium.launchPersistentContext(profile,args);page=await context.newPage();watch(page);await page.goto(fileURL,{waitUntil:'load'});await restore(page,expected);checks.push('file:// localStorage survives closing and reopening the browser with the same profile.');
  await page.locator('[data-action=help]').click();const downloaded=page.waitForEvent('download');await page.locator('[data-action=export]').click();const save=path.join(out,'native-export-save.json');await (await downloaded).saveAs(save);const raw=JSON.parse(fs.readFileSync(save,'utf8'));assert.equal(raw.week,expected.week);
  await page.locator('#modal-layer [data-action=menu]').click();await page.locator('[data-action=start]').click();assert.equal((await read(page)).week,0);await page.locator('[data-action=help]').click();await page.locator('#file-input').setInputFiles(save);await page.waitForFunction(()=>window.__afterfire.app.state.week===5);assert.deepEqual(await read(page),expected);checks.push('Native download and file-input import restore actual state without a storage adapter.');
  const broken=path.join(out,'native-invalid-save.json');fs.writeFileSync(broken,'{"version":1,"districts":null}');await page.locator('[data-action=help]').click();await page.locator('#file-input').setInputFiles(broken);await page.waitForTimeout(100);assert.deepEqual(await read(page),expected);assert.equal(await page.locator('#toast').evaluate(e=>e.classList.contains('error')),true);await page.keyboard.press('Escape');checks.push('Malformed native save import is rejected without replacing the current game.');
  server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;
  page=await context.newPage();watch(page);await page.goto(`http://127.0.0.1:${port}/?test=1`,{waitUntil:'load'});const httpExpected=await begin(page);await page.reload({waitUntil:'load'});await restore(page,httpExpected);checks.push('Native localhost HTTP startup and localStorage reload preserve state.');
  await context.close();context=null;await new Promise(resolve=>server.close(resolve));server=null;
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  const report={version:'0.3.0',build_sha256:crypto.createHash('sha256').update(html).digest('hex'),browser:version,mode:'Native file:// and localhost HTTP. Exact release HTML, no injected scripts or storage adapters. ?test=1 exposes read-only test observation.',checks,page_errors:errors,external_network_requests:external,restored_snapshot:expected};fs.writeFileSync(path.join(out,'native-browser-report.json'),JSON.stringify(report,null,2)+'\n');console.log('NATIVE BROWSER PASS\n'+JSON.stringify(report,null,2));
 }finally{if(context)await context.close();if(server)await new Promise(resolve=>server.close(resolve));fs.rmSync(profile,{recursive:true,force:true});}
}
main().catch(e=>{fs.writeFileSync(path.join(out,'native-browser-failure.json'),JSON.stringify({error:e.stack,checks,page_errors:errors,external_network_requests:external},null,2));console.error(e);process.exitCode=1;});
