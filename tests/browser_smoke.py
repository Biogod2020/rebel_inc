"""Reproducible v0.2 UI playthroughs. Requires Python Playwright and Chromium.
The sandbox blocks navigation; set_content uses the exact inline release with
only its test-API opt-in enabled. An explicit in-memory storage adapter is used.
The pilot READS state, proposes actions, and all game mutations go through real
mouse/keyboard/file controls. No money, health, time or outcome is assigned.
Native file/HTTP persistence is verified separately by native-browser.cjs.
"""
import hashlib,json,os,time,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts';OUT.mkdir(exist_ok=True)
RAW=(ROOT/'index.html').read_text()
HTML=RAW.replace("new URLSearchParams(location.search).has('test')",'true')
BASE=(ROOT/'tests/pilot.cjs').read_text();PILOT=(ROOT/'tests/campaign-pilot.cjs').read_text()
STORAGE="""() => {const v=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>v.get(k)??null,setItem:(k,x)=>v.set(k,String(x)),removeItem:k=>v.delete(k)},configurable:true});}"""
errors=[];commands=[];screens=[];checks=[];finals=[];run='smoke';captured=set()
def state(p):
 return p.evaluate("""() => {const a=__afterfire.app,s=a.state,c=s.campaign,C=__afterfire.core;return {week:s.week,paused:s.paused,event:s.event?.id??null,outcome:s.outcome,money:s.money,selected:a.selected,unit:a.unit,tab:a.tab,panel:a.panelOpen,modal:a.modalKind,units:s.units.length,stable:C.stableShare(s),support:C.support(s),reputation:s.reputation,peace:s.peace,casualties:s.casualties,rescued:s.rescued,scenario:s.scenario,doctrine:c?.doctrine,orders:c?.completedOrders,deliveries:c?.deliveries,mediations:c?.mediations,upgrades:c?.upgrades};}""")
def snapshot(p,name):
 p.mouse.move(4,4);p.wait_for_timeout(90);p.screenshot(path=str(OUT/name));screens.append(name)
def setup(browser,width=1440,height=900,adapter=True):
 p=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1,accept_downloads=True,is_mobile=width<500,has_touch=width<500)
 p.set_default_timeout(5000);p.on('pageerror',lambda e:errors.append(str(e)))
 if adapter:p.evaluate(STORAGE)
 p.set_content(HTML,wait_until='load');p.wait_for_function('window.__afterfire !== undefined');p.wait_for_timeout(90)
 return p
def tab(p,key):
 s=state(p)
 if not(s['panel'] and s['tab']==key):p.locator(f'.command-dock [data-tab="{key}"]').click()
def district(p,id):
 p.wait_for_timeout(25)
 point=p.evaluate("""id=>{const a=__afterfire.app,C=__afterfire.core,d=a.state.districts[id],r=a.renderer,rect=r.canvas.getBoundingClientRect();const choices=[{x:d.x,y:d.y+4},{x:d.x+13,y:d.y-5}];for(let k=1;k<8;k++)for(const v of d.polygon)choices.push({x:d.x+(v.x-d.x)*k/8,y:d.y+(v.y-d.y)*k/8});for(const w of choices){if(!C.contains(d.polygon,w.x,w.y))continue;if([...r.positions.values()].some(t=>C.distance(t,w)<21))continue;const q=r.toScreen(w);q.x+=rect.left;q.y+=rect.top;if(document.elementFromPoint(q.x,q.y)===r.canvas)return q;}return null;}""",id)
 if not point:
  snapshot(p,f'failure-hit-{run}-{id}.png');raise AssertionError(('no unobscured map point',id,state(p)))
 p.mouse.click(point['x'],point['y'])
 assert state(p)['selected']==id,('district hit test',id,state(p))
def selectunit(p,id):
 tab(p,'forces')
 if state(p)['unit']!=id:p.locator(f'#unit-dock [data-unit="{id}"]').click()
def clearunit(p):
 if state(p)['unit'] is not None:p.keyboard.press('Escape')
def ui_action(p,a):
 kind=a[0];before=state(p)
 if kind=='choice':p.locator(f'[data-choice="{a[1]}"]').click()
 elif kind=='upgrade':
  p.locator('[data-action=draft]').first.click()
  if 'draft' not in captured:snapshot(p,'v2-draft.png');captured.add('draft')
  p.locator(f'[data-upgrade="{a[1]}"]').click()
 elif kind=='contract':tab(p,'missions');p.locator(f'[data-contract="{a[1]}"]').click()
 elif kind in ['build','operation']:
  clearunit(p);district(p,a[1]);key='project' if kind=='build' else 'operation';loc=p.locator(f'[data-{key}="{a[2]}"]')
  if not loc.count():p.locator(f'[data-action="all-{key}s"]').click()
  loc.click()
 elif kind=='reroute':tab(p,'missions');p.locator(f'[data-reroute="{a[1]}"]').click()
 elif kind=='policy':tab(p,'policies');p.locator(f'[data-policy="{a[1]}"]').click()
 elif kind=='recruit':tab(p,'forces');p.locator(f'[data-recruit="{a[1]}"]').click()
 elif kind=='move':selectunit(p,a[1]);district(p,a[2])
 elif kind=='extend':selectunit(p,a[1]);p.locator(f'[data-extend="{a[1]}"]').click()
 elif kind=='evacuate':clearunit(p);district(p,a[1]);p.locator('[data-action=evacuate]').click()
 elif kind=='peace':tab(p,'situation');p.locator('[data-action=peace]').click()
 else:raise AssertionError(('unsupported command',a))
 now=state(p);commands.append({'run':run,'week':before['week'],'action':a})
 assert 'error' not in (p.locator('#toast').get_attribute('class') or ''),(a,p.locator('#toast').inner_text(),now)
 assert now['paused'],('a UI command unexpectedly unpaused the game',a,now)
def smoke(browser):
 p=setup(browser);snapshot(p,'v2-title.png');p.locator('[data-action=start]').click();snapshot(p,'v2-opening.png')
 assert p.locator('#panel').is_hidden() and p.locator('#metrics .metric').count()==3
 p.keyboard.press('Space');p.wait_for_timeout(1630);p.keyboard.press('Space');w=state(p)['week'];assert w>=1
 p.wait_for_timeout(1580);assert state(p)['week']==w
 checks.append('real-time clock advances; space pause freezes it; opening has 3 resources and no details drawer')
 tab(p,'district');assert p.locator('[data-project]').count()==3
 p.locator('[data-action=all-projects]').click();assert p.locator('[data-project]').count()==8
 snapshot(p,'v2-all-projects.png');p.keyboard.press('Escape');assert p.locator('#panel').is_hidden()
 p.locator('[data-action=help]').click();w=state(p)['week'];p.keyboard.press('.');assert state(p)['week']==w
 assert p.locator('#app').get_attribute('inert') is not None
 for _ in range(20):p.keyboard.press('Tab')
 assert p.evaluate("document.activeElement.closest('#modal-layer') !== null")
 p.keyboard.press('Escape');assert state(p)['modal'] is None
 checks.append('progressive project disclosure, Escape dismissal, modal pause, inert background and keyboard focus containment')
 p.locator('[data-action=layers]').click();p.locator('[data-layer=supply]').click();assert p.evaluate('__afterfire.app.renderer.layer')=='supply'
 p.locator('[data-layer=terrain]').click();p.locator('[data-action=layers]').click();z=p.evaluate('__afterfire.app.renderer.zoom');p.locator('[data-action=zoom-in]').click();assert p.evaluate('__afterfire.app.renderer.zoom')>z;p.locator('[data-action=fit]').click()
 timing=p.evaluate("""()=>{const r=__afterfire.app.renderer,a=[];for(let i=0;i<45;i++){const t=performance.now();r.draw(i*16,0);a.push(performance.now()-t);}a.sort((a,b)=>a-b);return{median_ms:a[22],p95_ms:a[42],sample_frames:a.length,viewport:[innerWidth,innerHeight],note:'Headless CPU renderer sampling, not a frame-rate guarantee.'};}""")
 checks.append('map layers, zoom and reset operate through real buttons');p.close();return timing
def play(browser,scenario,doctrine):
 global run
 run=scenario+'-'+doctrine;p=setup(browser);p.locator(f'[data-scenario="{scenario}"]').click();p.locator(f'[data-doctrine="{doctrine}"]').click();p.locator('[data-action=start]').click()
 assert state(p)['week']==0 and state(p)['doctrine']==doctrine
 p.evaluate('(function(){const module={exports:{}};'+BASE+';window.basePilot=module.exports;})()')
 p.evaluate('(function(){const module={exports:{}};const require=()=>window.basePilot;'+PILOT+';window.testPilot=module.exports;})()')
 started=time.monotonic();startcommands=len(commands)
 while state(p)['outcome']=='playing':
  before=state(p)
  if before['event'] and 'event' not in captured:snapshot(p,'v2-event.png');captured.add('event')
  for _ in range(18):
   a=p.evaluate('testPilot.nextAction(__afterfire.core,__afterfire.app.state,"balanced")')
   if not a:break
   ui_action(p,a)
  s=state(p)
  if scenario=='volcano' and s['week'] in [28,36,48,72,120]:
   p.keyboard.press('Escape')
   if s['week'] in [28,36]:district(p,9)
   snapshot(p,f"v2-volcano-W{s['week']:03d}.png")
  if scenario=='corridor' and s['week']==40:tab(p,'missions');snapshot(p,'v2-convoys.png')
  if s['week']%40==0:print('PLAY',run,json.dumps(s,ensure_ascii=False),flush=True)
  p.keyboard.press('.');now=state(p)
  assert now['week']>before['week'] or now['event'] or now['outcome']!='playing',('clock stuck',now)
  if time.monotonic()-started>390:raise AssertionError(('playthrough exceeded 390 seconds',run,now))
 final=state(p);final['commands']=len(commands)-startcommands;final['test_seconds']=round(time.monotonic()-started,1)
 snapshot(p,f'v2-victory-{run}.png');assert final['outcome']=='victory',final;finals.append(final)
 with p.expect_download() as d:p.locator('[data-action=export]').click()
 save=OUT/f'v2-{run}-save.json';d.value.save_as(str(save));assert json.loads(save.read_text())['week']==final['week']
 p.locator('#modal-layer [data-action=menu]').click();p.locator('[data-action=start]').click();assert state(p)['week']==0
 p.locator('[data-action=help]').click();p.locator('#file-input').set_input_files(str(save));p.wait_for_timeout(80)
 assert state(p)['week']==final['week'] and state(p)['outcome']=='victory'
 checks.append(f'{run}: full campaign won through mouse/keyboard only, then exported and imported through file controls')
 print('WON',run,json.dumps(final,ensure_ascii=False),flush=True);p.close()
def responsive(browser):
 for width,height in [(1280,800),(1024,768),(390,844),(360,780)]:
  p=setup(browser,width,height);p.locator('[data-scenario=valley]').click();p.locator('[data-action=start]').click();p.wait_for_timeout(100)
  assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),('horizontal overflow',width)
  if p.locator('[data-action=advisor]').is_visible():p.locator('[data-action=advisor]').click()
  snapshot(p,f'v2-responsive-{width}.png');tab(p,'district');assert p.locator('[data-project]').count()==3
  box=p.locator('#panel').bounding_box();assert box and box['x']>=0 and box['x']+box['width']<=width+1 and box['y']>=0 and box['y']+box['height']<=height+1,(width,box)
  snapshot(p,f'v2-responsive-district-{width}.png');p.keyboard.press('Escape');assert p.locator('#panel').is_hidden()
  p.locator('[data-action=help]').click();assert p.locator('.help-modal').is_visible();p.keyboard.press('Escape');p.close()
 checks.append('1280×800, 1024×768, 390×844, 360×780: no horizontal overflow; context drawer bounded; close/help controls work')
def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  timing=smoke(browser)
  for scenario,doctrine in [('valley','rebuild'),('volcano','accord'),('corridor','mobility')]:play(browser,scenario,doctrine)
  responsive(browser)
  p=setup(browser,1024,768,False);p.locator('[data-action=start]').click();p.keyboard.press('s');assert '导出存档' in p.locator('#toast').inner_text();assert 'visible' in p.locator('#toast').get_attribute('class');p.close()
  checks.append('denied localStorage produces a visible, actionable export-save fallback');browser.close()
  assert not errors,errors
  report={'version':'0.2.0','build_sha256':hashlib.sha256(RAW.encode()).hexdigest(),'browser':'system Chromium / headless','rendering':'exact inline release via set_content; test-API opt-in only','storage':'explicit in-memory adapter; denial checked separately; native persistence is a separate test','ui_commands':len(commands),'campaigns':finals,'checks':checks,'render_timing':timing,'page_errors':errors,'screenshots':screens}
  (OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');(OUT/'browser-actions.json').write_text(json.dumps(commands,ensure_ascii=False,indent=2)+'\n')
  print('BROWSER PASS',json.dumps(report,ensure_ascii=False),flush=True)
if __name__=='__main__':
 try:main()
 except Exception:
  (OUT/'browser-partial.json').write_text(json.dumps({'commands':commands,'finals':finals,'checks':checks,'errors':errors,'traceback':traceback.format_exc()},ensure_ascii=False,indent=2));raise
