namespace Afterfire {
  const ICONS:Record<string,string>={
    convoy:'<path d="M2 6h13v12H2Zm13 5h4l3 4v3h-7"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>',
    airlift:'<path d="m3 14 7-2V4l2-2 2 2v8l7 2v3l-7-1v4l2 1H8l2-1v-4l-7 1Z"/>',
    box:'<path d="m3 7 9-4 9 4v12l-9 4-9-4Zm0 0 9 4 9-4m-9 4v12M7 5l10 4v5"/>',
    chevron:'<path d="m8 5 7 7-7 7"/>',
    plus:'<path d="M12 4v16M4 12h16"/>',
    layers:'<path d="m2 8 10-5 10 5-10 5Zm0 5 10 5 10-5M2 18l10 5 10-5"/>',
    book:'<path d="M3 4q5-2 9 1 4-3 9-1v16q-5-2-9 1-4-3-9-1Zm9 1v16"/>',
    leaf:'<path d="M20 3C6 2 2 9 6 16c8 4 15-2 14-13ZM4 21l12-13"/>',
    map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Zm6-3v15m6-12v15"/>',
    water:'<path d="M12 2s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/><path d="M8 14a4 4 0 0 0 4 4"/>',
    health:'<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z"/>',
    school:'<path d="m2 8 10-5 10 5-10 5Zm4 3v6q6 5 12 0v-6m4-3v9"/>',
    jobs:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12q9 5 18 0m-9 0v4"/>',
    road:'<path d="m8 2-5 20m13-20 5 20M12 3v3m0 4v4m0 4v3"/>',
    shield:'<path d="m12 2 8 3v7q0 6-8 10-8-4-8-10V5Zm-4 8 8 6m0-6-8 6"/>',
    home:'<path d="m2 11 10-9 10 9M5 9v12h14V9m-9 12v-7h4v7"/>',
    radar:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m12 12 7-7M12 1v3M1 12h3m8 8v3m8-11h3"/>',
    audit:'<path d="M5 3h12v8M5 3v18h7M8 7h6m-6 4h4"/><circle cx="16" cy="16" r="4"/><path d="m19 19 3 3"/>',
    people:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4M16 4a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v3"/>',
    peace:'<path d="M12 21V8m0 7C3 15 3 6 3 6s9 0 9 9Zm0-4C12 3 21 3 21 3s0 8-9 8Z"/>',
    volcano:'<path d="m2 21 7-14h6l7 14ZM9 7l3 5 3-5M9 4 7 1m8 3 2-3m-5 2V0"/>',
    chart:'<path d="M3 3v18h18M6 15l4-5 4 3 6-8"/>',
    flag:'<path d="M5 22V3q4-3 8 0t8 0v11q-4 3-8 0t-8 0"/>',
    money:'<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M5 9v6m14-6v6"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v1"/>',
    save:'<path d="M4 3h13l4 4v14H3V3Zm3 0v6h10V3M7 21v-8h10v8"/>',
    sound:'<path d="M3 9h4l5-5v16l-5-5H3Zm13-2q6 5 0 10m3-13q8 8 0 16"/>',
    mute:'<path d="M3 9h4l5-5v16l-5-5H3Zm13 0 6 6m0-6-6 6"/>',
    fit:'<path d="M3 9V3h6m6 0h6v6m0 6v6h-6m-6 0H3v-6"/>',
    wrench:'<path d="m3 21 12-12a6 6 0 0 1 7-7l-4 4 1 3 3-1a6 6 0 0 1-7 5L6 22Z"/>',
    arrow:'<path d="M3 12h17m-6-6 6 6-6 6"/>',
    pause:'<path d="M8 5v14m8-14v14"/>',
    play:'<path d="m7 4 13 8-13 8Z"/>',
    bell:'<path d="M5 16V9a7 7 0 0 1 14 0v7l2 3H3Zm5 6h4"/>',
    cross:'<path d="m5 5 14 14M19 5 5 19"/>'
  };
  export const icon=(name:string):string=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]||ICONS.map}</svg>`;
  export const escape=(s:string):string=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  const meter=(v:number,cls=''):string=>`<div class="track ${cls}"><i style="width:${clamp(v)}%"></i></div>`;
  const SAVE_KEY='afterfire-save-v2',LEGACY_KEY='afterfire-save-v1';
  type Tab='district'|'policies'|'forces'|'situation'|'missions';
  const DIFF_LABELS:Record<Difficulty,string>={relaxed:'宽松',standard:'标准',veteran:'严峻'};
  const $=(id:string):HTMLElement=>document.getElementById(id)!;
  const disabled=(reason:string):string=>reason?`disabled title="${escape(reason)}"`:'';
  const STANCES:Record<Stance,string>={protect:'保护居民',balanced:'稳步推进',assault:'集中突击'};
  const briefProject:Record<ProjectKind,string>={water:'饮水与灌溉，恢复基本生活',health:'基层医疗，减少灾害伤亡',school:'长期民心，削弱招募土壤',jobs:'恢复生计，并增加月度收入',road:'加快行军、运输和施工',police:'防止小股渗透，改善情报',shelter:'加速疏散与受灾家庭返乡',survey:'补全地区情报，解锁建设'};
  function emblem(key:string):string {
    // Small original line illustrations, sharing the same visual grammar as map markers.
    const subject=key==='convoy'||key==='mobility'?'<path d="M54 67h48v21H54zm48 8h15l8 13h-23"/><circle cx="65" cy="92" r="5"/><circle cx="112" cy="92" r="5"/><path d="m22 101 43-66 55 0 33 66"/>':key==='peace'||key==='accord'||key==='compact'?'<path d="M89 110V55m0 24C48 77 44 35 44 35s45 0 45 44Zm0-14c0-34 47-40 47-40s2 36-47 40Z"/><path d="M61 117h57"/>':key==='volcano'||key==='prepared'?'<path d="m36 105 36-68h35l38 68H36Zm36-68 18 24 17-24M75 24l-6-12m29 12 8-12"/><path d="M48 112h83"/>':'<path d="m39 66 50-33 50 33M51 58v49h76V58M78 107V76h22v31M63 66h9m34 0h9"/><path d="M37 113h105"/>';
    return `<svg class="emblem" viewBox="0 0 180 140" aria-hidden="true"><circle cx="90" cy="72" r="56" fill="none" stroke="currentColor" opacity=".12"/><circle cx="90" cy="72" r="42" fill="none" stroke="currentColor" opacity=".09"/><g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">${subject}</g><circle cx="32" cy="39" r="2" fill="currentColor"/><path d="M145 107h12m-6-6v12" stroke="currentColor" opacity=".5"/></svg>`;
  }
  export class Controller {
    state:State;renderer:Renderer;tab:Tab='district';selected=24;unit:number|null=null;started=false;panelOpen=false;
    modalKind:'menu'|'help'|'event'|'end'|'draft'|null=null;sound=false;toastTimer=0;
    menuScenario:Scenario='volcano';menuGovernor:Governor='civil';menuDiff:Difficulty='standard';menuSeed=58421;menuDoctrine:Doctrine='rebuild';
    allProjects=false;allOperations=false;showLayers=false;showAdvanced=false;advisorOpen=true;
    private audio:AudioContext|null=null;private saveErrorShown=false;private menuPreview='';private modalFocus:HTMLElement|null=null;
    constructor(){
      this.state=newGame();
      document.body.innerHTML=`<div id="app">
        <main id="map-host"><div id="map-hover" role="tooltip"></div></main>
        <header class="topbar">
          <button class="brand" data-action="menu" aria-label="主菜单"><svg viewBox="0 0 36 36" aria-hidden="true"><path d="m3 29 12-25 5 13 6-7 8 19H3Zm8-5 5-10 6 10"/></svg><div><strong>烬土</strong><span>AFTERFIRE</span></div></button>
          <div id="metrics" class="metrics"></div><button class="icon-button menu-button" data-action="help" aria-label="手册与保存" title="手册与保存 [H]">${icon('book')}</button>
        </header>
        <section class="region-heading"><div class="eyebrow" id="region-subtitle"></div><h1 id="map-title"></h1><div class="region-line"></div></section>
        <section id="advisor" class="advisor"></section><div id="alerts" class="alerts"></div>
        <div class="map-tools"><div id="layers" class="layer-buttons"></div><button class="icon-button" data-action="layers" title="地图图层" aria-label="地图图层">${icon('layers')}</button><button class="icon-button" data-action="zoom-in" aria-label="放大地图">+</button><button class="icon-button" data-action="zoom-out" aria-label="缩小地图">−</button><button class="icon-button" data-action="fit" aria-label="地图复位">${icon('fit')}</button></div>
        <aside id="panel" class="context-panel" aria-label="行动详情" hidden><div id="panel-content"></div></aside>
        <div id="map-notice" class="map-notice"></div><div id="unit-dock" class="unit-dock"></div>
        <nav class="command-dock" aria-label="行动指令"><button data-tab="missions">${icon('flag')}<span>委托</span><i id="mission-badge"></i></button><button data-tab="district">${icon('home')}<span>建设</span></button><button data-tab="forces">${icon('shield')}<span>部队</span></button><button data-tab="policies">${icon('leaf')}<span>施政</span><i id="draft-badge"></i></button><button data-tab="situation">${icon('chart')}<span>全局</span></button></nav>
        <div class="time-control"><div id="datebox" class="datebox"></div><div id="speeds" class="speeds"></div></div>
        <div id="status" class="status-line"></div><div class="key-hint">空格 暂停 <span>·</span> 选中部队后点击地图调遣</div>
      </div><div id="modal-layer"></div><div id="toast" role="status" aria-live="polite"></div><input type="file" id="file-input" accept=".json,application/json" aria-label="导入存档">`;
      this.renderer=new Renderer($('map-host'),this.state);this.renderer.onSelect=id=>this.selectDistrict(id);this.renderer.onUnit=id=>this.selectUnit(id);this.renderer.onHover=(id,x,y)=>this.hover(id,x,y);
      document.addEventListener('click',e=>this.click(e));document.addEventListener('keydown',e=>this.key(e));
      $('file-input').addEventListener('change',e=>void this.importFile(e));
      document.addEventListener('input',e=>{const t=e.target as HTMLInputElement;if(t.id==='seed-input')this.menuSeed=Number(t.value)>>>0;});
      document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.started){this.state.paused=true;this.save(false);this.refresh();}});
      this.refresh();this.showMenu();
    }
    private put(id:string,html:string):void {const e=$(id);if(e.innerHTML!==html)e.innerHTML=html;}
    private hover(id:number,x:number,y:number):void {
      const el=$('map-hover');if(id<0||this.modalKind){el.style.display='none';return;}const d=this.state.districts[id];
      el.innerHTML=`<strong>${escape(d.name)} <small>${TERRAIN[d.terrain]}</small></strong><span>${(d.population/10000).toFixed(1)} 万居民 · 民心 ${pct(d.support)}</span><span class="${d.supplied?'good':'bad'}">${d.hazard?'熔岩封路':d.supplied?'补给通畅':'补给中断'}${d.intel<35?' · 情报不完整':d.rebels>2?' · 武装 '+this.rebelLabel(d):''}</span>`;
      el.style.display='block';el.style.left=Math.min(x+18,this.renderer.width-220)+'px';el.style.top=Math.max(85,Math.min(y+16,this.renderer.height-180))+'px';
    }
    private rebelLabel(d:District):string {return d.intel>=70?String(round(d.rebels)):d.intel>=35?(d.rebels<12?'少量':d.rebels<28?'中等':'密集'):'未知';}
    private heading(kicker:string,title:string,sub=''):string {return `<div class="sheet-header"><div><div class="eyebrow">${kicker}</div><h2>${title}</h2></div><button class="icon-button" data-action="dismiss" aria-label="收起面板">${icon('cross')}</button></div>${sub?`<p class="sheet-intro">${sub}</p>`:''}`;}
    private openTab(tab:Tab):void {
      if(tab!==this.tab){$('panel').scrollTop=0;this.allProjects=false;this.allOperations=false;}
      this.tab=tab;this.panelOpen=true;if(tab!=='forces'){this.unit=null;this.renderer.selectedUnit=null;}this.renderer.selected=tab==='district'?this.selected:-1;this.refresh();
    }
    private dismiss():void {this.panelOpen=false;this.unit=null;this.renderer.selectedUnit=null;this.renderer.selected=-1;this.refresh();}
    selectDistrict(id:number):void {
      if(this.modalKind)return;if(id<0){this.dismiss();return;}
      if(this.selected!==id){$('panel').scrollTop=0;this.allProjects=false;this.allOperations=false;}this.selected=id;this.renderer.selected=id;
      if(this.unit!==null){const u=this.state.units.find(x=>x.id===this.unit);if(u&&active(u)){const r=moveUnit(this.state,this.unit,id);if(r.ok){this.panelOpen=false;this.renderer.selected=-1;this.unit=null;this.renderer.selectedUnit=null;}this.result(r);return;}}
      this.panelOpen=true;this.tab='district';this.beep();this.refresh();
    }
    selectUnit(id:number):void {
      if(this.modalKind)return;
      if(id<0||this.unit===id){this.unit=null;this.renderer.selectedUnit=null;this.panelOpen=false;this.renderer.selected=-1;this.refresh();return;}
      const u=this.state.units.find(x=>x.id===id);if(!u)return;this.unit=id;this.renderer.selectedUnit=id;this.selected=u.at;this.renderer.selected=u.at;this.tab='forces';this.panelOpen=true;this.beep();this.refresh();
    }
    result(r:Result):void {this.toast(r.message,!r.ok);this.beep(r.ok?490:180);this.refresh();if(r.ok)this.save(false);}
    toast(text:string,error=false):void {const t=$('toast');t.textContent=text;t.className='visible'+(error?' error':'');window.clearTimeout(this.toastTimer);this.toastTimer=window.setTimeout(()=>t.className='',3600);}
    private beep(freq=340):void {
      if(!this.sound)return;try{this.audio??=new AudioContext();void this.audio.resume();const o=this.audio.createOscillator(),g=this.audio.createGain();o.connect(g);g.connect(this.audio.destination);o.type='sine';o.frequency.setValueAtTime(freq,this.audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.72,this.audio.currentTime+.13);g.gain.setValueAtTime(.027,this.audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.audio.currentTime+.16);o.start();o.stop(this.audio.currentTime+.17);}catch{this.sound=false;}
    }
    private click(e:MouseEvent):void {
      const b=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b||b.disabled)return;
      if(this.modalKind&&!b.closest('#modal-layer'))return;
      if(b.dataset.tab){const t=b.dataset.tab as Tab;if(this.panelOpen&&t===this.tab)this.dismiss();else this.openTab(t);return;}
      if(b.dataset.layer){this.renderer.layer=b.dataset.layer as Layer;this.refresh();return;}
      if(b.dataset.scenario){this.menuScenario=b.dataset.scenario as Scenario;this.menuSeed=SCENARIOS[this.menuScenario].seed;this.showMenu();return;}
      if(b.dataset.doctrine){this.menuDoctrine=b.dataset.doctrine as Doctrine;this.showMenu();return;}
      if(b.dataset.governor){this.menuGovernor=b.dataset.governor as Governor;this.showMenu();return;}
      if(b.dataset.difficulty){this.menuDiff=b.dataset.difficulty as Difficulty;this.showMenu();return;}
      if(b.dataset.project){this.result(buildProject(this.state,this.selected,b.dataset.project as ProjectKind));return;}
      if(b.dataset.policy){this.result(buyPolicy(this.state,b.dataset.policy as PolicyKind));return;}
      if(b.dataset.recruit){this.result(recruit(this.state,b.dataset.recruit as UnitKind));return;}
      if(b.dataset.unit){this.selectUnit(Number(b.dataset.unit));return;}
      if(b.dataset.goto){this.unit=null;this.renderer.selectedUnit=null;this.selected=Number(b.dataset.goto);this.openTab('district');return;}
      if(b.dataset.operation){this.result(launchOperation(this.state,this.selected,b.dataset.operation as OperationKind));return;}
      if(b.dataset.reroute){this.result(rerouteMission(this.state,Number(b.dataset.reroute)));return;}
      if(b.dataset.cancelMission){this.result(cancelOperation(this.state,Number(b.dataset.cancelMission)));return;}
      if(b.dataset.contract){const o=this.state.campaign?.contracts.find(x=>x.id===Number(b.dataset.contract));const r=acceptContract(this.state,Number(b.dataset.contract));if(r.ok&&o){this.selected=o.target;this.tab='district';this.panelOpen=true;this.renderer.selected=o.target;}this.result(r);return;}
      if(b.dataset.upgrade){const r=chooseUpgrade(this.state,b.dataset.upgrade as UpgradeId);if(r.ok)this.closeModal();this.result(r);return;}
      if(b.dataset.stance){const u=this.state.units.find(x=>x.id===Number(b.dataset.id));if(u){u.stance=b.dataset.stance as Stance;if(u.stance==='assault'&&isTruce(this.state,u.at)){delete this.state.campaign!.truces[String(u.at)];addLog(this.state,'主动突击结束了当地停火。','warn');}}this.refresh();return;}
      if(b.dataset.extend){this.result(extendContract(this.state,Number(b.dataset.extend)));return;}
      if(b.dataset.halt){this.result(haltUnit(this.state,Number(b.dataset.halt)));return;}
      if(b.dataset.choice){const r=chooseEvent(this.state,Number(b.dataset.choice));if(r.ok){this.closeModal();this.state.paused=true;}this.result(r);return;}
      if(b.dataset.speed){this.state.speed=Number(b.dataset.speed);this.state.paused=false;this.refresh();return;}
      switch(b.dataset.action){
        case 'menu':this.showMenu();break;case 'start':this.start();break;case 'resume':this.closeModal();this.renderer.replace(this.state);this.refresh();break;case 'continue':this.load();break;
        case 'pause':if(!this.state.event&&this.state.outcome==='playing'){this.state.paused=!this.state.paused;this.refresh();}break;
        case 'tick':if(!this.state.event&&this.state.outcome==='playing'){this.state.paused=true;this.tick();}break;
        case 'help':this.showHelp();break;case 'close':if(this.modalKind!=='event'){this.closeModal();this.refresh();}break;
        case 'dismiss':this.dismiss();break;case 'save':this.save(true);break;case 'export':this.exportSave();break;case 'import':$('file-input').click();break;
        case 'sound':this.sound=!this.sound;this.beep();this.showHelp();break;
        case 'peace':this.result(startPeace(this.state));break;case 'evacuate':this.result(evacuate(this.state,this.selected));break;case 'relief':this.result(relief(this.state,this.selected));break;
        case 'zoom-in':this.renderer.setZoom(this.renderer.zoom*1.18);break;case 'zoom-out':this.renderer.setZoom(this.renderer.zoom/1.18);break;case 'fit':this.renderer.fit();break;
        case 'all-projects':this.allProjects=!this.allProjects;this.refresh();break;case 'all-operations':this.allOperations=!this.allOperations;this.refresh();break;
        case 'layers':this.showLayers=!this.showLayers;this.refresh();break;case 'advanced':this.showAdvanced=!this.showAdvanced;this.showMenu();break;
        case 'draft':this.showDraft();break;case 'advisor':this.advisorOpen=!this.advisorOpen;this.refresh();break;
        case 'show-end':this.showEnd();break;case 'next-action':this.nextAction();break;
      }
    }
    private key(e:KeyboardEvent):void {
      if((e.target as HTMLElement).matches('input,textarea,select'))return;
      if(this.modalKind&&e.key==='Tab'){
        const items=Array.from(document.querySelectorAll<HTMLElement>('#modal-layer button:not(:disabled),#modal-layer input')).filter(el=>el.offsetParent!==null);
        const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}return;
      }
      if(e.key==='Escape'){
        if(this.modalKind==='event')return;
        if(this.modalKind==='menu'&&!this.started)return;
        if(this.modalKind){const wasMenu=this.modalKind==='menu';this.closeModal();if(wasMenu)this.renderer.replace(this.state);this.refresh();}else this.dismiss();return;
      }
      if(this.modalKind)return;
      if(e.code==='Space'){e.preventDefault();if(this.state.outcome==='playing')this.state.paused=!this.state.paused;this.refresh();return;}
      if(['1','2','3'].includes(e.key)){this.state.speed=[1,2,4][Number(e.key)-1];this.state.paused=false;this.refresh();return;}
      if(e.key==='.'||e.key==='。'){this.state.paused=true;this.tick();return;}
      const tabs:Record<string,Tab>={b:'district',p:'policies',u:'forces',i:'situation',m:'missions'};
      if(tabs[e.key.toLowerCase()])this.openTab(tabs[e.key.toLowerCase()]);
      if(e.key.toLowerCase()==='s'&&!e.ctrlKey&&!e.metaKey)this.save(true);if(e.key==='?'||e.key.toLowerCase()==='h')this.showHelp();if(e.key==='0')this.renderer.fit();
    }
    start():void {
      this.state=newGame(this.menuScenario,this.menuGovernor,this.menuDiff,this.menuSeed);initCampaign(this.state,this.menuDoctrine);this.started=true;this.panelOpen=false;this.tab='district';this.selected=24;this.unit=null;this.allProjects=false;this.allOperations=false;this.renderer.replace(this.state);this.closeModal();this.refresh();this.save(false);
    }
    tick():void {if(!this.started)return;step(this.state);if(this.state.week%4===0)this.save(false);this.refresh();}
    private nextAction():void {
      const s=this.state,d=s.districts.find(x=>x.warning&&!x.evacuating);
      if(d){this.selected=d.id;this.openTab('district');return;}
      if(!s.completed&&!s.districts.some(x=>x.project)){const target=s.districts.filter(x=>['city','town'].includes(x.terrain)&&!x.levels[x.demand]).sort((a,b)=>b.population-a.population)[0]??s.districts[s.hq];this.selected=target.id;this.openTab('district');return;}
      if(s.units.length===0){this.openTab('forces');return;}
      if(s.campaign?.draft.length){this.showDraft();return;}
      this.openTab('missions');
    }
    refresh():void {
      const s=this.state,c=s.campaign;
      if(this.unit!==null&&!s.units.some(u=>u.id===this.unit)){this.unit=null;this.renderer.selectedUnit=null;}
      const net=s.lastIncome-s.lastUpkeep;
      this.put('metrics',`<div class="metric money" title="每四周入账，已扣除部队维护">${icon('money')}<div><label>重建资金</label><b>$${Math.floor(s.money)}</b><small>${net>=0?'+':''}${net.toFixed(1)}/月</small></div></div><div class="metric" title="行动授权；归零时失败">${icon('flag')}<div><label>行动声望</label><b class="${s.reputation<35?'bad':''}">${Math.ceil(s.reputation)}</b><small>/100</small></div></div><button class="metric metric-button" data-tab="situation" title="稳定的人口比例；点击查看胜利条件">${icon('leaf')}<div><label>稳定人口</label><b>${pct(stableShare(s))}</b><small>/70%</small></div></button>`);
      this.put('datebox',`<b>第 ${String(s.week).padStart(2,'0')} 周</b><small>${s.rain?'雨季':s.week<12?'重建初期':s.negotiating?'和平进程':'区域行动'}</small>`);
      this.put('speeds',`<button class="play-toggle ${s.paused?'paused':''}" data-action="pause" aria-label="${s.paused?'继续':'暂停'}">${icon(s.paused?'play':'pause')}</button>${[1,2,4].map(n=>`<button data-speed="${n}" class="${s.speed===n?'active':''}" aria-label="${n}倍速">${n}×</button>`).join('')}<button class="step-button" data-action="tick" aria-label="推进一周" title="推进一周 [.]">↦</button>`);
      this.put('region-subtitle',`${SCENARIOS[s.scenario].subtitle} <span>·</span> ${DIFF_LABELS[s.difficulty]}`);$('map-title').textContent=SCENARIOS[s.scenario].name;
      this.put('layers',([['terrain','自然'],['support','民心'],['supply','补给'],['intel','情报']] as [Layer,string][]).map(([key,name])=>`<button data-layer="${key}" class="${this.renderer.layer===key?'active':''}">${name}</button>`).join(''));$('layers').classList.toggle('expanded',this.showLayers);
      this.renderAdvisor();
      const warning=s.districts.filter(d=>d.warning),activeMissions=c?.missions.filter(m=>m.status==='active')??[];
      this.put('alerts',`${warning.length?`<button class="alert warning" data-goto="${(warning.find(d=>!d.evacuating)??warning[0]).id}">${icon('volcano')}<span>火山预警 <b>${s.eruptionAt-s.week} 周</b><small>${warning.filter(d=>d.evacuation>=.9).length}/${warning.length} 地区基本撤离</small></span>${icon('chevron')}</button>`:''}${c?.draft.length?`<button class="alert new-draft" data-action="draft">${icon('leaf')}<span>新的施政授权<small>三选一，改变这一局的路线</small></span>${icon('chevron')}</button>`:''}${activeMissions.some(m=>m.stalled)?`<button class="alert warning" data-tab="missions">${icon('convoy')}<span>外勤行动受阻<small>查看路线，恢复前方安全</small></span>${icon('chevron')}</button>`:''}`);
      this.put('unit-dock',s.units.map(u=>`<button class="unit-chip ${this.unit===u.id?'selected':''} ${u.hp<30?'danger':''}" data-unit="${u.id}" title="${u.name} · ${s.districts[u.at].name} · 战备 ${pct(u.hp)} · 补给 ${pct(u.supply)}">${icon(u.kind==='engineer'?'wrench':'shield')}<span>${u.name}<small>${u.training?'训练 '+u.training+'周':u.path.length?'行军中':s.districts[u.at].rebels>1?'接敌':'待命'}</small></span><i style="--hp:${u.hp}%"></i></button>`).join(''));
      this.put('map-notice',this.unit!==null?`${icon('arrow')} 点击地图下达行军命令 <span>Esc 取消</span>`:'');$('map-notice').classList.toggle('visible',this.unit!==null);
      this.put('status',`<i class="${s.paused?'paused':''}"></i>${s.outcome!=='playing'?'行动结束':s.paused?'已暂停':'正在推进'}${s.districts.some(d=>d.project)?`<span>· ${s.districts.filter(d=>d.project).length} 项工程施工中</span>`:''}`);
      $('mission-badge').classList.toggle('on',!!c?.contracts.some(o=>o.status==='offer'));$('draft-badge').classList.toggle('on',!!c?.draft.length);
      document.querySelectorAll<HTMLButtonElement>('.command-dock [data-tab]').forEach(b=>{b.classList.toggle('active',this.panelOpen&&b.dataset.tab===this.tab);b.setAttribute('aria-expanded',String(this.panelOpen&&b.dataset.tab===this.tab));});
      const panel=$('panel'),scroll=panel.scrollTop;panel.hidden=!this.panelOpen;$('app').classList.toggle('panel-open',this.panelOpen);
      this.renderer.panelInset=this.panelOpen?350:0;
      if(this.panelOpen){this.put('panel-content',this.tab==='district'?this.districtPanel():this.tab==='policies'?this.policyPanel():this.tab==='forces'?this.forcePanel():this.tab==='missions'?this.missionPanel():this.situationPanel());panel.scrollTop=scroll;}
      if(s.event&&this.modalKind!=='event')this.showEvent();if(s.outcome!=='playing'&&!this.modalKind)this.showEnd();
    }
    private renderAdvisor():void {
      const s=this.state,o=s.campaign?.contracts.find(o=>o.status==='active');
      let title='从一份小小的承诺开始',body='选择一项地方委托。完成后，获得额外的重建预算。',label='选择委托';
      if(!s.completed&&!s.districts.some(d=>d.project)){title='先让生活重新开始';body='点击人口中心，回应当地最急迫的一项诉求。';label='查看建议地区';}
      else if(!s.units.length){title='为重建留一支预备队';body='武装将在第 12 周出现。趁现在完成训练。';label='建立机动预备队';}
      else if(o){title=o.title;body=`${o.brief}`;label='查看当前承诺';}
      else if(s.campaign?.draft.length){title='选择一条不同的路';body='一项新的施政授权已经到达。选取后会持续整局。';label='选择施政授权';}
      if(s.districts.some(d=>d.warning&&!d.evacuating)){title='先让危险区的人离开';body='指派疏散与工程支援，不必等到火山喷发。';label='前往预警地区';}
      this.put('advisor',`<button class="advisor-heading" data-action="advisor" aria-expanded="${this.advisorOpen}"><span class="eyebrow">${o?'当前承诺':'下一步'}</span><span>${this.advisorOpen?'−':'+'}</span></button>${this.advisorOpen?`<h3>${escape(title)}</h3><p>${escape(body)}</p>${o?`<div class="between small"><span>第 ${o.deadline} 周前</span><b>${pct(Math.min(100,contractProgress(s,o)))}</b></div>${meter(contractProgress(s,o))}`:''}<button class="text-action" ${o&&!s.districts.some(d=>d.warning&&!d.evacuating)?'data-tab="missions"':'data-action="next-action"'}>${label} ${icon('arrow')}</button>`:''}`);
    }
    private projectButton(d:District,kind:ProjectKind,featured=false):string {
      const s=this.state,def=PROJECTS[kind],reason=projectAllowed(s,d.id,kind),cost=projectCost(s,d.id,kind);
      return `<button class="project-action ${featured?'featured':''}" data-project="${kind}" ${disabled(reason)}><span class="action-icon">${icon(def.icon)}</span><span class="action-copy"><b>${def.name}${featured?'<em>当地急需</em>':''}</b><small>${reason||briefProject[kind]}</small></span><span class="action-price">$${cost}<small>${def.weeks}周起</small></span></button>`;
    }
    private districtPanel():string {
      const s=this.state,d=s.districts[this.selected],p=d.project;
      const state=d.hazard?'灾害封闭':controlled(d)?'武装控制':d.stability>=100?'生活已稳定':d.rebels>1&&d.intel>=35?'出现武装':'重建中';
      let kinds:ProjectKind[]=d.intel<25?['survey',d.demand,'road']:[d.demand,...(d.warning?['shelter','road']:d.rebels>2?['police','road']:['road','jobs']) as ProjectKind[]];
      kinds=[...new Set(kinds)].filter(k=>d.levels[k]<PROJECTS[k].max);if(kinds.length<3)for(const k of ['health','school','water'] as ProjectKind[])if(!kinds.includes(k)&&d.levels[k]<PROJECTS[k].max)kinds.push(k);kinds=kinds.slice(0,3);
      const ops:OperationKind[]=this.allOperations?['recon','convoy','mediate','airlift']:d.warning?['airlift','convoy']:d.intel<40?['recon','convoy']:['convoy','mediate'];
      return this.heading(`地区 ${String(d.id+1).padStart(2,'0')} · ${TERRAIN[d.terrain]}`,d.name,`${(d.population/10000).toFixed(1)} 万居民 · ${d.id===s.hq?'行动总部':state}`)+`
        <div class="local-stats"><div><small>当地民心</small><b>${pct(d.support)}</b></div><div><small>稳定进度</small><b>${pct(d.stability)}</b></div><div><small>补给状态</small><b class="word ${d.supplied?'good':'bad'}">${d.supplied?'通畅':'受阻'}</b></div></div>
        ${d.warning?`<div class="hazard-card"><div class="between"><b>${icon('volcano')} 距离喷发 ${s.eruptionAt-s.week} 周</b><span>${pct(d.evacuation*100)}</span></div>${meter(d.evacuation*100,'gold')}<button class="primary wide" data-action="evacuate" ${disabled(d.evacuating?'疏散正在进行':s.money<evacuateCost(s,d.id)?'资金不足':'')}>${d.evacuating?'疏散正在进行':'组织居民疏散 · $'+evacuateCost(s,d.id)}</button></div>`:''}
        ${d.displaced>0?`<div class="notice-card"><b>${round(d.displaced).toLocaleString()} 人等待安置</b><button data-action="relief" ${disabled(s.money<6?'资金不足':'')}>应急安置 · $6</button></div>`:''}
        ${isTruce(s,d.id)?`<div class="quiet-note good">地方停火还剩 ${s.campaign!.truces[d.id]-s.week} 周。</div>`:''}
        <div class="section-label"><h3>${p?'工程正在落地':'先做最需要的一件事'}</h3><span>${s.districts.filter(x=>x.project).length}/${projectCapacity(s)} 工程队</span></div>
        ${p?`<div class="construction-card">${icon(PROJECTS[p.kind].icon)}<div><b>${PROJECTS[p.kind].name}</b><small>${controlled(d)?'等待恢复安全':!d.supplied?'补给受阻，施工减速':'施工中 · '+pct(p.progress/p.total*100)}</small>${meter(p.progress/p.total*100)}</div></div>`:kinds.map(k=>this.projectButton(d,k,k===d.demand&&!d.levels[k])).join('')}
        <button class="disclosure" data-action="all-projects" aria-expanded="${this.allProjects}">${this.allProjects?'收起完整工程目录':'查看全部 8 类工程'} <span>${this.allProjects?'−':'+'}</span></button>
        ${this.allProjects?`<div class="all-projects">${(Object.keys(PROJECTS) as ProjectKind[]).filter(k=>p||!kinds.includes(k)).map(k=>this.projectButton(d,k)).join('')}</div>`:''}
        <div class="section-label"><h3>不只有建设</h3><button class="inline-link" data-action="all-operations">${this.allOperations?'收起':'全部行动'}</button></div>
        <div class="operations-grid">${ops.map(k=>{const def=OPERATIONS[k],reason=operationAllowed(s,d.id,k);return `<button class="operation-card" data-operation="${k}" ${disabled(reason)} title="${escape(reason||def.desc)}">${icon(def.icon)}<b>${def.name}</b><span>$${operationCost(s,k)} <small>${k==='convoy'?'按路程':def.weeks+'周'}</small></span><small>${reason|| (k==='convoy'?'车队需要安全路线':k==='mediate'?'减少武装，不靠进攻':k==='recon'?'揭示本区和邻区情报':'绕过地面道路')}</small></button>`;}).join('')}</div>
        <div class="district-foot">情报 ${pct(d.intel)} <span>·</span> 武装 ${this.rebelLabel(d)} <span>·</span> 道路 ${d.levels.road} 级</div>`;
    }
    private policyPanel():string {
      const s=this.state,c=s.campaign!,doctrine=DOCTRINES[c.doctrine];
      const notes:Record<PolicyKind,string>={audit:'持续降低腐败与工程浪费',outreach:'全区民心与情报逐步增长',logistics:'多一支工程队，施工 +20%',training:'国民军战力 +22%，训练更快',diplomacy:'减少招募，解锁正式和谈',forecast:'预警提前 8 周，疏散更快'};
      return this.heading('治理路线',doctrine.name,doctrine.desc)+`<div class="tradeoff">${icon('flag')} ${doctrine.tradeoff}</div>
        ${c.draft.length?`<button class="draft-invitation" data-action="draft">${icon('leaf')}<div><b>一项新的施政授权</b><small>三选一 · 只影响本局</small></div>${icon('arrow')}</button>`:''}
        ${c.upgrades.length?`<div class="selected-perks">${c.upgrades.map(k=>`<span title="${escape(UPGRADES[k].desc)}">${icon(UPGRADES[k].icon)}${UPGRADES[k].name}</span>`).join('')}</div>`:''}
        <div class="section-label"><h3>把预算变成长期能力</h3></div><div class="policy-list">${(Object.keys(POLICIES) as PolicyKind[]).filter(k=>k!=='forecast'||s.scenario==='volcano').map(k=>{const p=POLICIES[k],cost=policyCost(s,k),max=s.policies[k]>=p.max;return `<button class="policy-action" data-policy="${k}" ${disabled(max?'已满级':s.money<cost?'资金不足':'')}><span class="action-icon">${icon(p.icon)}</span><span class="action-copy"><b>${p.name}</b><small>${notes[k]}</small><span class="level-pips">${Array.from({length:p.max},(_,i)=>`<i class="${i<s.policies[k]?'filled':''}"></i>`).join('')}</span></span><b class="action-price">${max?'已完成':'$'+cost}</b></button>`;}).join('')}</div>
        <div class="quiet-note">通胀 ${pct(s.inflation)} · 腐败 ${pct(s.corruption)}<br>授权在第 16、56、104 周到达。可以暂缓选择，等局势更明朗。</div>`;
    }
    private forcePanel():string {
      const s=this.state,u=s.units.find(u=>u.id===this.unit);
      return this.heading('安全与支援',u?u.name:'把安全送到前线',u?`${s.districts[u.at].name} · ${u.training?'训练还需 '+u.training+' 周':u.path.length?'正在行军':'等待你的命令'}`:'选择部队，再点击目的地区域。道路与相邻支援决定行动效率。')+
      (u?`<div class="unit-detail"><div class="unit-sigil">${icon(u.kind==='engineer'?'wrench':'shield')}</div><div class="unit-bars"><label>战备 <b>${pct(u.hp)}</b></label>${meter(u.hp)}<label>补给 <b>${pct(u.supply)}</b></label>${meter(u.supply,'blue')}</div></div><div class="segmented stances">${(Object.keys(STANCES) as Stance[]).map(k=>`<button data-stance="${k}" data-id="${u.id}" class="${u.stance===k?'active':''}">${STANCES[k]}</button>`).join('')}</div><p class="quiet-note">${u.stance==='protect'?'优先保护居民，战力略低，居民伤亡风险更小。':u.stance==='balanced'?'在效率与居民风险之间维持平衡。':'突击提高战力，也提高居民伤亡风险；会结束所在地停火。'}</p>${u.path.length?`<button class="wide" data-halt="${u.id}">到下一地区后停止行军</button>`:u.training?'':'<div class="move-instruction">点击地图上的目的地，预览路线后出发。</div>'}${u.kind==='coalition'?`<div class="contract-line"><span>驻留剩余 ${u.contract} 周</span><button data-extend="${u.id}" ${disabled(u.contract>70?'合同尚有充足时间':s.money<11?'资金不足':'')}>延期 · $11</button></div>`:''}<div class="divider"></div>`:'')+
      `${s.units.length?`<div class="roster">${s.units.map(x=>`<button class="roster-row ${x.id===this.unit?'active':''}" data-unit="${x.id}">${icon(x.kind==='engineer'?'wrench':'shield')}<span><b>${x.name}</b><small>${s.districts[x.at].name} · ${x.training?'训练中':x.path.length?'行军中':'待命'}</small></span><span class="hp">${pct(x.hp)}</span>${icon('chevron')}</button>`).join('')}</div>`:''}
        <div class="section-label"><h3>增派支援</h3><span>${s.units.length}/7 支部队</span></div><div class="recruits">${(Object.keys(UNIT_DEFS) as UnitKind[]).map(k=>{const def=UNIT_DEFS[k],cost=recruitCost(s,k);return `<div class="recruit-card"><div>${icon(k==='engineer'?'wrench':'shield')}<b>${def.name}</b><small>${k==='coalition'?'2周训练 · 96周合同':k==='national'?'长期驻守 · 训练较慢':'施工与疏散 · 战力弱'}</small></div><button data-recruit="${k}" ${disabled(s.units.length>=7?'部署已满':s.money<cost?'资金不足':'')}>$${cost} ${icon('plus')}</button></div>`;}).join('')}</div>`;
    }
    private missionPanel():string {
      const s=this.state,c=s.campaign!,orders=c.contracts.filter(o=>o.status==='offer'||o.status==='active'),missions=c.missions.filter(m=>m.status==='active');
      return this.heading('地方委托','一次，只承诺一件事','从三项委托中接受一项。兑现获得预算，失约扣除 2 点声望；不是必做的胜利条件。')+
        `${orders.map(o=>`<article class="order-card ${o.status==='active'?'accepted':''}"><div class="between"><span class="eyebrow">${o.status==='active'?'进行中':'可选委托'}</span><b class="gold">+$${o.reward}</b></div><h3>${escape(o.title)}</h3><p>${escape(o.brief)}</p>${o.status==='active'?`${meter(contractProgress(s,o))}<div class="between small"><span>截止第 ${o.deadline} 周</span><b>${pct(Math.min(100,contractProgress(s,o)))}</b></div><button class="wide" data-goto="${o.target}">前往目标地区 ${icon('arrow')}</button>`:`<div class="between small"><span>${o.kind==='shelter'?'截止第 '+o.deadline+' 周':o.deadline+' 周内完成'}</span><button data-contract="${o.id}">接受承诺 ${icon('arrow')}</button></div>`}</article>`).join('')||`<div class="empty-state">${icon('flag')}<h3>下一份委托正在路上</h3><p>已兑现 ${c.completedOrders} 份承诺。${c.nextOffer<99999?`第 ${c.nextOffer} 周会有新的选择。`:''}</p></div>`}
        <div class="section-label"><h3>在路上的人</h3><span>${missions.length}/2 外勤组</span></div>
        ${missions.map(m=>`<article class="mission-row"><div class="mission-icon ${m.stalled?'blocked':''}">${icon(OPERATIONS[m.kind].icon)}</div><div><b>${OPERATIONS[m.kind].name} → ${s.districts[m.target].name}</b><small class="${m.stalled?'bad':''}">${m.stalled?`受阻 ${m.stalled} 周 · 等待道路恢复`:`预计还需 ${missionETA(s,m)} 周`}${m.kind==='convoy'?' · 物资 '+pct(m.cargo):''}</small><div class="mini-actions"><button data-goto="${m.at}">定位</button>${m.kind==='convoy'&&m.path.length?`<button data-reroute="${m.id}">寻找改道</button>`:''}<button data-cancel-mission="${m.id}">撤回 · 退30%</button></div></div></article>`).join('')||'<p class="quiet-note">点击地图上的地区，可以派出侦察、运输、调解或空运任务。</p>'}
        <div class="quiet-note">本局交付 ${c.deliveries} 次援助 · 完成 ${c.mediations} 次调解</div>`;
    }
    private chart():string {
      const h=this.state.history;if(h.length<2)return '<p class="quiet-note">每 4 周记录一次地区变化。</p>';
      const points=(key:'reputation'|'stable')=>h.map((v,i)=>`${10+i/(h.length-1)*260},${104-v[key]*.9}`).join(' ');
      return `<svg viewBox="0 0 280 126" class="situation-chart" role="img" aria-label="声望与稳定人口趋势"><path d="M10 14H270M10 59H270M10 104H270" stroke="currentColor" opacity=".12" stroke-dasharray="3 5"/><polyline points="${points('reputation')}" fill="none" stroke="#85ada6" stroke-width="1.6"/><polyline points="${points('stable')}" fill="none" stroke="#dcb472" stroke-width="2"/><text x="10" y="121">W${h[0].week}</text><text x="245" y="121">W${h[h.length-1].week}</text></svg><div class="chart-legend"><span>— 行动声望</span><span>— 稳定人口</span></div>`;
    }
    private situationPanel():string {
      const s=this.state,goals=[[stableShare(s)>=70,'让 70% 人口生活稳定',`${pct(stableShare(s))} / 70%`],[s.peace>=100,'让和平协议获得支持',`${pct(s.peace)} / 100%`],[s.peaceHold>=8,'在安全条件下巩固 8 周',`${s.peaceHold} / 8 周`]];
      return this.heading('行动全局','不是占领，而是留下生活','城市安全、基本服务和地方认同共同决定结局。')+
        `<div class="goals">${goals.map(([yes,t,v])=>`<div class="goal ${yes?'done':''}"><i>${yes?'✓':''}</i><div><b>${t}</b><small>${v}</small></div></div>`).join('')}</div>
        <button class="primary wide" data-action="peace" ${disabled(s.negotiating?'和谈已启动':s.week<48?'第 48 周后开启正式和谈':s.policies.diplomacy<1?'先升级调解与复员':support(s)<48?'人口民心需达到48%':totalRebels(s)>180?'武装规模过大':s.money<12?'资金不足':'')}>${s.negotiating?'和平进程 · '+pct(s.peace):'启动正式和谈 · $12'}</button>
        <p class="quiet-note">第 48 周后，民心 ≥48%、至少一级调解与复员、武装总规模 &lt;180 时可开启。胜利还需总武装 &lt;65。另一条路线：稳定 ≥85% 人口、总武装 &lt;5，同样巩固 8 周。</p>${this.chart()}
        <div class="local-stats"><div><small>全区民心</small><b>${pct(support(s))}</b></div><div><small>提前疏散人次</small><b>${s.rescued.toLocaleString()}</b></div><div><small>居民伤亡</small><b>${s.casualties}</b></div></div>
        <div class="section-label"><h3>最近发生的事</h3><span>第 ${s.week}/360 周</span></div><div class="log-list">${s.logs.slice(0,12).map(l=>`<div class="log ${l.type}"><time>${String(l.week).padStart(2,'0')}</time><p>${escape(l.text)}</p></div>`).join('')}</div>`;
    }
    private setModal(html:string,kind:Controller['modalKind']):void {
      if(!this.modalKind)this.modalFocus=document.activeElement as HTMLElement;
      this.modalKind=kind;this.state.paused=true;$('modal-layer').innerHTML=`<div class="overlay ${kind==='menu'?'menu-overlay':''}" role="dialog" aria-modal="true" aria-label="${kind==='menu'?'开始新的重建行动':kind==='draft'?'选择施政授权':kind==='event'?'事件决策':kind==='end'?'行动结算':'手册与保存'}">${html}</div>`;
      $('app').classList.toggle('menu-open',kind==='menu');$('app').setAttribute('inert','');$('map-hover').style.display='none';
      const focus=document.querySelector<HTMLElement>('#modal-layer [data-action="start"]')??document.querySelector<HTMLElement>('#modal-layer button:not(:disabled)');focus?.focus({preventScroll:true});
    }
    closeModal():void {
      $('modal-layer').innerHTML='';$('app').classList.remove('menu-open');$('app').removeAttribute('inert');this.modalKind=null;
      if(this.modalFocus?.isConnected)this.modalFocus.focus({preventScroll:true});this.modalFocus=null;
    }
    showMenu():void {
      let saved=false;try{saved=!!(localStorage.getItem(SAVE_KEY)||localStorage.getItem(LEGACY_KEY));}catch{/* file/private browsing may not persist. */}
      const previewKey=this.menuScenario+this.menuSeed;
      if(previewKey!==this.menuPreview||this.renderer.state===this.state){this.renderer.replace(newGame(this.menuScenario,this.menuGovernor,this.menuDiff,this.menuSeed));this.menuPreview=previewKey;}
      const d=DOCTRINES[this.menuDoctrine];
      this.setModal(`<section class="launch">
        <div class="launch-wordmark"><svg viewBox="0 0 36 36" aria-hidden="true"><path d="m3 29 12-25 5 13 6-7 8 19H3Z"/></svg> 烬土 <span>AFTERFIRE</span></div>
        <div class="launch-story"><div class="eyebrow">重建策略 · SECOND EDITION</div><h1>让生活，<br>先于承诺抵达。</h1><p>修复一条道路，兑现一份承诺。<br>在冲突与灰烬之间，选择你自己的重建之路。</p></div>
        <div class="launch-location"><span class="eyebrow">${this.menuScenario==='volcano'?'02':this.menuScenario==='valley'?'01':'03'} / 河岚联省</span><strong>${SCENARIOS[this.menuScenario].name}</strong><small>程序生成地形 · 每一条路都可以抵达</small></div>
        <div class="launch-config">
          <div class="config-top"><span class="eyebrow">选择你的下一场行动</span><button class="inline-link" data-action="advanced">${this.showAdvanced?'收起设置':'难度与高级设置'} ${icon('chevron')}</button></div>
          <div class="scenario-options">${(Object.keys(SCENARIOS) as Scenario[]).map((k,i)=>`<button class="scenario-option ${this.menuScenario===k?'active':''}" data-scenario="${k}"><span class="scenario-number">0${i+1}</span><div>${icon(k==='volcano'?'volcano':k==='corridor'?'convoy':'home')}<strong>${SCENARIOS[k].name}</strong><small>${k==='valley'?'恢复民生，连接乡村':k==='volcano'?'守住城市，也救下居民':'保护车队，打通生命线'}</small></div><span class="scenario-check">${this.menuScenario===k?'✓':''}</span></button>`).join('')}</div>
          <div class="route-row"><span class="route-label">重建路线</span><div class="route-choices">${(Object.keys(DOCTRINES) as Doctrine[]).map(k=>`<button data-doctrine="${k}" class="${k===this.menuDoctrine?'active':''}">${icon(DOCTRINES[k].icon)}${DOCTRINES[k].name}</button>`).join('')}</div></div>
          <div class="route-description"><span>${d.desc}</span><small>代价：${d.tradeoff}</small></div>
          ${this.showAdvanced?`<div class="advanced-config"><div><label>行动强度</label><div class="segmented">${(Object.keys(DIFF_LABELS) as Difficulty[]).map(k=>`<button data-difficulty="${k}" class="${this.menuDiff===k?'active':''}">${DIFF_LABELS[k]}</button>`).join('')}</div></div><div><label>治理者</label><div class="segmented">${(Object.keys(GOVERNORS) as Governor[]).map(k=>`<button data-governor="${k}" title="${escape(GOVERNORS[k].desc)}" class="${this.menuGovernor===k?'active':''}">${GOVERNORS[k].name}</button>`).join('')}</div></div><label class="seed-control">地图种子<input type="number" min="0" max="4294967295" id="seed-input" value="${this.menuSeed}"></label></div>`:''}
          <div class="launch-bottom"><div>${this.started?'<button class="continue-button" data-action="resume">返回当前行动</button>':saved?'<button class="continue-button" data-action="continue">继续上次行动</button>':'<span class="start-hint">可随时暂停思考 · 首次建议「河谷重建」</span>'}<small>新行动会覆盖自动存档。需要保留时请先导出。</small></div><button class="primary launch-button" data-action="start">开始重建 ${icon('arrow')}</button></div>
        </div><div class="launch-footer">原创实时策略 · v0.2.0 <span>完全离线 / 无外部资源</span></div>
      </section>`,'menu');
    }
    showDraft():void {
      const c=this.state.campaign;if(!c?.draft.length)return;
      this.setModal(`<section class="modal draft-modal"><button class="close icon-button" data-action="close" aria-label="稍后选择">${icon('cross')}</button><div class="eyebrow">施政授权 · ${c.draftTier+1} / 3</div><h2>这一次，选择怎样的未来？</h2><p>只选择一项。它会改变本局的重建方式，而不只是增加一个数字。</p><div class="draft-cards">${c.draft.map((k,i)=>{const d=UPGRADES[k];return `<button class="draft-card" data-upgrade="${k}"><span class="draft-index">0${i+1} <small>${d.tag}</small></span>${emblem(d.icon)}<h3>${d.name}</h3><p>${d.desc}</p><div class="draft-flavor">${d.flavor}</div><span class="select">采用这项授权 ${icon('arrow')}</span></button>`;}).join('')}</div><button class="text-action" data-action="close">保持暂停，稍后再选</button></section>`,'draft');
    }
    showEvent():void {
      const e=this.state.event;if(!e)return;
      this.setModal(`<section class="modal event-modal"><div class="event-illustration">${emblem(e.id==='village'||e.id==='splinter'?'peace':e.id==='rain'?'convoy':'home')}<span>FIELD DISPATCH</span></div><div class="event-content"><div class="eyebrow">现场来信 · 第 ${this.state.week} 周</div><h2>${escape(e.title)}</h2><p>${escape(e.body)}</p><div class="event-choices">${e.choices.map((c,i)=>`<button class="event-choice" data-choice="${i}" ${disabled(this.state.money<c.cost?'资金不足':'')}><span class="choice-index">0${i+1}</span><span><b>${escape(c.text)}</b><small>${escape(c.detail)}</small></span>${icon('chevron')}</button>`).join('')}</div><div class="event-foot">当前资金 $${Math.floor(this.state.money)} <span>行动已暂停，等待你的选择</span></div></div></section>`,'event');
    }
    showHelp():void {
      this.setModal(`<section class="modal help-modal"><button class="close icon-button" data-action="close" aria-label="关闭手册">${icon('cross')}</button><div class="eyebrow">FIELD MANUAL</div><h2>先看地图，再做决定。</h2><div class="help-grid"><div><b>01 / 点击地区</b><p>默认只展示三项建议工程。回应诉求比平均花钱更有效；完整目录按需展开。</p></div><div><b>02 / 选部队，再点目的地</b><p>移动需要时间。相邻部队互相支援，低补给削弱战力。行军途中可以在下一站停止。</p></div><div><b>03 / 不只有进攻</b><p>侦察揭示邻区；运输改善生活；调解削弱武装；空运绕过断路。最多两组外勤同时执行。</p></div><div><b>04 / 选择自己的路线</b><p>第 16、56、104 周的三选一授权改变整局策略。委托是可选目标，不完成不会阻止基础胜利。</p></div><div><b>05 / 在火山喷发前救人</b><p>危险区会出现黄色边界。组织疏散，配合安置设施与工兵；喷发将封路 12 周。</p></div><div><b>06 / 让重建持续下去</b><p>每四周预算结算。别把全部资金用于军队。完整胜利条件、民心与日志在「全局」中查看。</p></div></div><div class="keys"><kbd>空格</kbd> 暂停 <kbd>1 2 3</kbd> 调速 <kbd>.</kbd> 推进一周 <kbd>Esc</kbd> 收起<br><kbd>B / U / P / M / I</kbd> 建设 / 部队 / 施政 / 委托 / 全局</div><div class="save-tools"><button data-action="save">${icon('save')} 保存</button><button data-action="export">导出存档</button><button data-action="import">导入存档</button><button data-action="sound">${icon(this.sound?'sound':'mute')}${this.sound?'关闭音效':'开启音效'}</button><button data-action="menu">主菜单</button></div><p class="legal">支持旧版存档。每四周自动保存；切到后台自动暂停。本游戏的地区与数值为虚构，素材由代码原创绘制，与 Rebel Inc. 无官方关系。种子 ${this.state.seed} · v0.2.0</p></section>`,'help');
    }
    showEnd():void {
      const s=this.state,c=s.campaign;
      this.setModal(`<section class="modal end-modal"><div class="eyebrow">OPERATION DEBRIEF</div>${emblem(s.outcome==='victory'?'peace':'home')}<h2>${s.outcome==='victory'?'灰烬之上，生活重来。':'下一次，让重建走得更远。'}</h2><p>${escape(s.endReason)}</p><div class="result-grid">${[[s.week+'','行动周数'],[pct(stableShare(s)),'稳定人口'],[String(c?.completedOrders??0),'兑现的承诺'],[s.rescued.toLocaleString(),'提前疏散人次'],[String(c?.deliveries??0),'成功援助运输'],[s.casualties.toLocaleString(),'居民伤亡']].map(([v,k])=>`<div><strong>${v}</strong><span>${k}</span></div>`).join('')}</div><p class="quiet-note">${c?DOCTRINES[c.doctrine].name+' · '+c.upgrades.map(k=>UPGRADES[k].name).join(' / '):'经典行动'}<br>完成 ${s.completed} 项工程 · 民用投入 $${round(s.spentCivil)} · 军事投入 $${round(s.spentMilitary)}</p><div class="row center"><button class="primary" data-action="menu">开启新的重建</button><button data-action="export">导出复盘存档</button></div></section>`,'end');this.save(false);
    }
    save(notify=false):void {if(!this.started)return;try{localStorage.setItem(SAVE_KEY,serialize(this.state));if(notify)this.toast('进度已保存在当前浏览器。');}catch{if(notify||!this.saveErrorShown){this.toast('此浏览器限制本地保存；请在手册中导出存档。',true);this.saveErrorShown=true;}}}
    load():void {try{const raw=localStorage.getItem(SAVE_KEY)||localStorage.getItem(LEGACY_KEY);if(!raw)throw new Error('没有可读取的存档');this.restore(deserialize(raw));this.toast('进度已恢复。行动保持暂停。');}catch(e){this.toast('读取失败：'+(e instanceof Error?e.message:'未知错误'),true);}}
    private restore(s:State):void {this.state=s;initCampaign(s);this.started=true;this.selected=24;this.unit=null;this.panelOpen=false;this.renderer.replace(s);this.closeModal();this.refresh();}
    private exportSave():void {
      if(!this.started){this.toast('请先开始一局行动。',true);return;}
      const blob=new Blob([serialize(this.state)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`afterfire-v2-${this.state.seed}-W${this.state.week}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);this.toast('存档已导出。');
    }
    private async importFile(e:Event):Promise<void> {
      const input=e.target as HTMLInputElement,file=input.files?.[0];if(!file)return;
      try{if(file.size>1500000)throw new Error('存档过大');this.restore(deserialize(await file.text()));this.save(false);this.toast('存档已导入。');}catch(err){this.toast('导入失败：'+(err instanceof Error?err.message:'文件损坏'),true);}finally{input.value='';}
    }
  }
}
