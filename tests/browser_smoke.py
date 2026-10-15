"""Browser input / rendering / save-adapter tests for AFTERFIRE.
Requires Python playwright and Chromium. Uses page.set_content: the evaluation
container blocks URL navigation. Only the opt-in debug flag is changed; game
logic/assets are the exact built release. The storage adapter is explicit.
No game statistics are edited. Commands and ticks below use real UI inputs.
"""
import json, os, time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts';OUT.mkdir(exist_ok=True)
HTML=(ROOT/'dist/index.html').read_text().replace("new URLSearchParams(location.search).has('test')",'true')
PILOT=(ROOT/'tests/pilot.cjs').read_text()
STORAGE="""() => { const values=new Map(); Object.defineProperty(window,'localStorage',{value:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)},configurable:true}); }"""
errors=[];commands=[];screens=[];checks=[]
def state(page):
    return page.evaluate("""() => {const s=__afterfire.app.state,C=__afterfire.core;return {week:s.week,paused:s.paused,event:s.event?.id||null,outcome:s.outcome,money:s.money,selected:__afterfire.app.selected,units:s.units.length,stable:C.stableShare(s),support:C.support(s),reputation:s.reputation,peace:s.peace,casualties:s.casualties};}""")
def snapshot(page,name):
    page.mouse.move(20,20);page.wait_for_timeout(90);page.screenshot(path=str(OUT/name));screens.append(name)
def district(page,id):
    p=page.evaluate("""id=>{const a=__afterfire.app,d=a.state.districts[id],p=a.renderer.toScreen({x:d.x,y:d.y+6}),r=a.renderer.canvas.getBoundingClientRect();return {x:p.x+r.left,y:p.y+r.top};}""",id)
    page.mouse.click(p['x'],p['y'])
    assert state(page)['selected']==id, ('district hit test',id,state(page))
def ui_action(page,a):
    kind=a[0]
    if kind=='choice':
        page.locator(f'[data-choice="{a[1]}"]').click()
        if not state(page)['paused']:page.locator('[data-action=pause]').click()
    elif kind=='build':
        page.locator('[data-tab=district]').click();district(page,a[1]);page.locator(f'[data-project="{a[2]}"]').click()
    elif kind=='policy':
        page.locator('[data-tab=policies]').click();page.locator(f'[data-policy="{a[1]}"]').click()
    elif kind=='recruit':
        page.locator('[data-tab=forces]').click();page.locator(f'[data-recruit="{a[1]}"]').click()
    elif kind=='move':
        page.locator('[data-tab=forces]').click();page.locator(f'#unit-dock [data-unit="{a[1]}"]').click();district(page,a[2])
    elif kind=='extend':
        page.locator('[data-tab=forces]').click();page.locator(f'[data-extend="{a[1]}"]').click()
    elif kind=='evacuate':
        page.locator('[data-tab=district]').click();district(page,a[1]);page.locator('[data-action=evacuate]').click()
    elif kind=='peace':
        page.locator('[data-tab=situation]').click();page.locator('[data-action=peace]').click()
    else:raise AssertionError(a)
    commands.append({'week':state(page)['week'],'action':a})
    assert 'error' not in (page.locator('#toast').get_attribute('class') or ''), (a,page.locator('#toast').inner_text())

def main():
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1,accept_downloads=True)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.evaluate(STORAGE);page.set_content(HTML,wait_until='load');page.wait_for_timeout(250)
        snapshot(page,'01-title.png');page.locator('[data-action=start]').click()
        page.wait_for_timeout(100);snapshot(page,'02-opening.png')
        page.keyboard.press('Space');page.wait_for_timeout(1650);page.keyboard.press('Space');w=state(page)['week'];assert w>=1
        page.wait_for_timeout(1600);assert state(page)['week']==w
        checks.append('real-time clock advances; space pause prevents advancement')
        ui_action(page,['build',24,'jobs']);assert page.evaluate('__afterfire.app.state.districts[24].project.kind')=='jobs'
        ui_action(page,['policy','outreach']);ui_action(page,['recruit','coalition']);ui_action(page,['recruit','coalition'])
        for _ in range(3):page.keyboard.press('.')
        ui_action(page,['move',1,10]);assert page.evaluate('__afterfire.app.state.units[0].path.length')>0
        snapshot(page,'03-deployment.png');checks.append('project, policy, recruitment, unit selection and map movement via UI')
        # Load a deterministic test strategist, which only returns suggested commands.
        page.evaluate('(function(){const module={exports:{}};'+PILOT+';window.testPilot=module.exports;})()')
        captured=set();t=time.monotonic()
        while state(page)['outcome']=='playing':
            before=state(page)
            for _ in range(18):
                a=page.evaluate('testPilot.nextAction(__afterfire.core,__afterfire.app.state,"balanced")')
                if not a:break
                ui_action(page,a)
            s=state(page)
            if s['week'] in [24,32,40,48,52,100,140] and s['week'] not in captured:
                page.locator('[data-tab=district]').click()
                if s['week'] in [32,40,48,52]:district(page,10)
                snapshot(page,f"play-W{s['week']:03d}.png");captured.add(s['week'])
            if s['week']%20==0:print('PLAY',s,flush=True)
            page.keyboard.press('.')
            assert state(page)['week']>before['week'] or state(page)['event'] or state(page)['outcome']!='playing',state(page)
            if time.monotonic()-t>240:raise AssertionError('Browser play exceeded 4 minutes')
        final=state(page);snapshot(page,'04-victory.png');assert final['outcome']=='victory',final
        checks.append('complete volcano campaign won using UI controls only; no game-stat modification')
        # Export the real save via a browser download, then import using the file control.
        with page.expect_download() as d:
            page.locator('[data-action=export]').click()
        downloaded=OUT/'browser-victory-save.json';d.value.save_as(str(downloaded));saved=json.loads(downloaded.read_text())
        assert saved['week']==final['week']
        page.get_by_role('button',name='新的行动',exact=True).click();page.locator('[data-scenario=valley]').click();page.locator('[data-action=start]').click();assert state(page)['week']==0
        page.locator('[data-action=help]').click();page.locator('#file-input').set_input_files(str(downloaded));page.wait_for_timeout(100);assert state(page)['week']==final['week']
        checks.append('save export and validated import via browser file input; local autosave uses a test adapter')
        page.close()
        # Actual responsive layouts at laptop and narrow touch-device dimensions.
        for width,height,name in [(1280,800,'05-laptop.png'),(390,844,'06-mobile.png')]:
            q=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1,is_mobile=width<500,has_touch=width<500)
            q.on('pageerror',lambda e:errors.append(str(e)));q.evaluate(STORAGE);q.set_content(HTML);q.locator('[data-scenario=valley]').click();q.locator('[data-action=start]').click();q.wait_for_timeout(180)
            q.locator('[data-layer=supply]').click();assert q.evaluate('__afterfire.app.renderer.layer')=='supply'
            assert q.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
            q.locator('[data-action=help]').click();assert q.locator('.modal').is_visible();q.locator('[data-action=close]').first.click()
            snapshot(q,name);q.close()
        checks.append('1280×800 and 390×844 layout, supply overlay, help dialog; no horizontal overflow')
        # Storage-denial fallback is checked without the adapter.
        q=browser.new_page(viewport={'width':1024,'height':768});q.on('pageerror',lambda e:errors.append(str(e)));q.set_content(HTML);q.locator('[data-action=start]').click();q.locator('.rail [data-action=save]').click();assert '导出存档' in q.locator('#toast').inner_text();q.close()
        checks.append('blocked localStorage falls back to a visible export-save instruction')
        browser.close()
        assert not errors,errors
        report={'browser':'system Chromium / headless','rendering':'exact inline build via set_content; test API opt-in flag only','storage':'explicit in-memory adapter; denial tested separately','ui_commands':len(commands),'final':final,'checks':checks,'page_errors':errors,'screenshots':screens}
        (OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));(OUT/'browser-actions.json').write_text(json.dumps(commands,ensure_ascii=False,indent=2))
        print('BROWSER PASS',json.dumps(report,ensure_ascii=False),flush=True)
if __name__=='__main__':main()
