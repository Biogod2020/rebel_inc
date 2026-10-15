"""v0.3 UI playthroughs, using public mouse/keyboard/file controls only.
Imports the established map hit-test helper. Pilot proposes actions from state;
it never applies them. set_content/test opt-in + explicit memory storage are
necessary in restricted containers. Native persistence has a separate test.
"""
import json, hashlib, time, traceback, os
import browser_smoke as B
from playwright.sync_api import sync_playwright
ROOT, OUT = B.ROOT, B.OUT
RAW=(ROOT/'index.html').read_bytes()
original_state=B.state

def state(p):
 s=original_state(p)
 s.update(p.evaluate("""()=>{const a=__afterfire.app,C=__afterfire.core,t=a.state.theatre;return {theatre:t?.key,essentials:C.essentials(a.state),output:t?.output,power:t?.power,pressure:t?.pressure,grants:t?.grants,reviews:t?.reviews,debt:t?.debt,cabinetPage:a.cabinetPage,ending:a.state.endReason,enemy:C.totalRebels(a.state)};}"""))
 return s
B.state=state

def setup(browser,w=1440,h=900):
 p=B.setup(browser,w,h);p.locator('[data-setting=china]').click();return p

def cabinet(p,page):
 B.tab(p,'policies')
 if state(p)['cabinetPage']!=page:p.locator(f'[data-cabinet-page={page}]').click()

def action(p,a):
 before=state(p)
 if a[0]=='cabinet':cabinet(p,'plan');p.locator(f'[data-cabinet={a[1]}][data-value={a[2]}]').click()
 elif a[0]=='repair':cabinet(p,'supply');p.locator(f'[data-repair={a[1]}]').click()
 elif a[0]=='central':cabinet(p,'supply');p.locator('[data-action=central-support]').click()
 elif a[0]=='channel':B.tab(p,'situation');p.locator('[data-action=diplomatic-channel]').click()
 elif a[0]=='policy':cabinet(p,'capacity');p.locator(f'[data-policy={a[1]}]').click()
 else:B.ui_action(p,a);return
 B.commands.append({'run':B.run,'week':before['week'],'action':a})
 assert 'error' not in (p.locator('#toast').get_attribute('class') or ''),(a,p.locator('#toast').inner_text(),state(p))
 assert state(p)['paused']

def play(browser,key,doctrine):
 B.run=key+'-'+doctrine;p=setup(browser)
 if key=='river':B.snapshot(p,'v3-title.png')
 p.locator(f'[data-theatre={key}]').click();p.locator(f'[data-doctrine={doctrine}]').click();p.locator('[data-difficulty=standard]').click();p.locator('[data-action=start]').click()
 assert state(p)['theatre']==key and state(p)['doctrine']==doctrine
 assert p.locator('#panel').is_hidden() and p.locator('#metrics .metric').count()==3
 if key=='river':B.snapshot(p,'v3-opening.png')
 for filename,source in [('pilot.cjs','null'),('campaign-pilot.cjs','window.prevPilot'),('theatre-pilot.cjs','window.prevPilot')]:
  text=(ROOT/'tests'/filename).read_text()
  p.evaluate('(function(){const module={exports:{}};const require=()=>'+source+';'+text+';window.prevPilot=module.exports;})()')
 start=time.monotonic();n=len(B.commands)
 while state(p)['outcome']=='playing':
  prev=state(p)
  if prev['event'] and key=='river' and prev['week'] in [8,28,48]:B.snapshot(p,f'v3-event-W{prev["week"]:03}.png')
  for i in range(18):
   a=p.evaluate('prevPilot.nextAction(__afterfire.core,__afterfire.app.state,"balanced")')
   if not a:break
   action(p,a)
  now=state(p)
  if key=='river' and now['week'] in [16,40,72]:
   cabinet(p,'supply' if now['week']==40 else 'plan');B.snapshot(p,f'v3-{key}-W{now["week"]:03}.png')
  if key=='highland' and now['week']==48:B.tab(p,'missions');B.snapshot(p,'v3-logistics.png')
  if now['week']%40==0:print('PLAY',B.run,json.dumps(now,ensure_ascii=False),flush=True)
  p.keyboard.press('.')
  assert state(p)['week']>prev['week'] or state(p)['event'] or state(p)['outcome']!='playing'
  assert time.monotonic()-start<400,(B.run,state(p))
 final=state(p);final['commands']=len(B.commands)-n;final['test_seconds']=round(time.monotonic()-start,1)
 B.snapshot(p,f'v3-result-{B.run}.png');assert final['outcome']=='victory',final
 with p.expect_download() as dl:p.locator('[data-action=export]').click()
 save=OUT/f'v3-{B.run}-save.json';dl.value.save_as(str(save))
 p.locator('#modal-layer [data-action=menu]').click();p.locator('[data-action=start]').click();assert state(p)['week']==0
 p.locator('[data-action=help]').click();p.locator('#file-input').set_input_files(str(save));p.wait_for_timeout(60)
 assert state(p)['week']==final['week'] and state(p)['theatre']==key and state(p)['outcome']=='victory'
 B.checks.append(f'{B.run}: standard full UI playthrough, export/import through real file controls')
 B.finals.append(final);print('WON',B.run,json.dumps(final,ensure_ascii=False),flush=True);p.close()

def responsive(browser):
 for w,h in [(1280,800),(1024,768),(390,844),(360,780)]:
  p=setup(browser,w,h);assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),('launch overflow',w)
  p.locator('[data-action=start]').click();cabinet(p,'plan');p.wait_for_timeout(80)
  assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),('cabinet overflow',w)
  box=p.locator('#panel').bounding_box();assert 0<=box['x'] and box['x']+box['width']<=w+1 and 0<=box['y'] and box['y']+box['height']<=h+1,(w,box)
  assert p.locator('[data-cabinet]').count()==9
  p.locator('[data-cabinet=readiness][data-value=reserve]').click();assert p.locator('[data-cabinet=allocation][data-value=industry]').is_disabled()
  B.snapshot(p,f'v3-responsive-{w}.png');cabinet(p,'supply');assert p.locator('.asset-card').count()==4
  cabinet(p,'capacity');assert not p.locator('[data-policy=forecast]').count();p.keyboard.press('Escape');assert p.locator('#panel').is_hidden()
  p.locator('[data-action=help]').click();assert p.locator('.fiction-note').is_visible();p.keyboard.press('Escape');p.close()
 B.checks.append('Four viewports (1280,1024,390,360px): no horizontal overflow, bounded drawer, 4-week shared cabinet lock, facilities/long-term tabs and help work')

def main():
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  for k,d in [('river','rebuild'),('coast','accord'),('highland','mobility')]:play(b,k,d)
  responsive(b);b.close()
 assert not B.errors,B.errors
 report={'version':'0.3.0','build_sha256':hashlib.sha256(RAW).hexdigest(),'mode':'Exact inline build via set_content, test opt-in only; explicit in-memory storage. No state/time/funds edits. Native persistence tested separately.','ui_commands':len(B.commands),'campaigns':B.finals,'checks':B.checks,'page_errors':B.errors,'screenshots':B.screens}
 (OUT/'theatre-browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 (OUT/'theatre-browser-actions.json').write_text(json.dumps(B.commands,ensure_ascii=False,indent=2)+'\n')
 print('PASS',json.dumps(report,ensure_ascii=False),flush=True)
if __name__=='__main__':
 try:main()
 except Exception:
  (OUT/'theatre-browser-partial.json').write_text(json.dumps({'commands':B.commands,'finals':B.finals,'checks':B.checks,'errors':B.errors,'traceback':traceback.format_exc()},ensure_ascii=False,indent=2));raise
