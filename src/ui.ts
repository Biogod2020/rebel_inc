namespace Afterfire {
  const ICONS:Record<string,string>={
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
  const SAVE_KEY='afterfire-save-v1';
  type Tab='district'|'policies'|'forces'|'situation';
  export class Controller {
    state:State;renderer:Renderer;tab:Tab='district';selected=24;unit:number|null=null;started=false;
    modalKind:'menu'|'help'|'event'|'end'|null=null;sound=false;toastTimer=0;
    menuScenario:Scenario='volcano';menuGovernor:Governor='civil';menuDiff:Difficulty='standard';menuSeed=58421;
    private audio:AudioContext|null=null;private saveErrorShown=false;
    constructor() {
      this.state=newGame();
      document.body.innerHTML=`<div id="app"><header class="topbar"><button class="brand" data-action="menu" title="主菜单" aria-label="打开主菜单"><svg class="brand-mark" viewBox="0 0 32 40" fill="none" aria-hidden="true"><path d="m3 32 10-24 5 12 4-7 7 19H3Z" stroke="currentColor" stroke-width="1.6"/><path d="M16 2v4m-8 29h18M13 27l4-8 4 8" stroke="currentColor" stroke-width="1.4"/></svg><div><strong>烬土</strong><span>AFTERFIRE</span></div></button><div class="metrics" id="metrics"></div><div class="clock"><div class="datebox" id="datebox"></div><div class="speeds" id="speeds"></div></div></header><div class="workspace"><nav class="rail" aria-label="行动面板"><button data-tab="district" title="地区建设 [B]">${icon('map')}<span>地区</span></button><button data-tab="policies" title="治理政策 [P]">${icon('people')}<span>治理</span></button><button data-tab="forces" title="部队部署 [U]">${icon('shield')}<span>部队</span></button><button data-tab="situation" title="全局态势 [I]">${icon('chart')}<span>态势</span></button><div class="spacer"></div><button class="utility" data-action="sound" title="音效开关" aria-label="音效开关" id="sound-button">${icon('mute')}</button><button class="utility" data-action="save" title="保存进度 [S]" aria-label="保存进度">${icon('save')}</button><button class="utility" data-action="help" title="行动手册 [?]" aria-label="行动手册">${icon('help')}</button></nav><main id="map-host"><div class="map-heading"><div class="eyebrow">RECONSTRUCTION COMMAND / 北境联省</div><h2 id="map-title">灰烬山脊</h2><div class="sub">HE LAN REGION · 民政与安全联合行动</div></div><div class="layer-buttons" id="layers" aria-label="地图图层"></div><div id="map-hover"></div><div id="map-notice"></div><div class="map-controls"><button data-action="zoom-in" title="放大" aria-label="放大地图">+</button><button data-action="zoom-out" title="缩小" aria-label="缩小地图">−</button><button data-action="fit" title="地图复位" aria-label="地图复位">${icon('fit')}</button></div><div id="unit-dock"></div><div class="objective-strip" id="objective"></div></main><aside id="panel" aria-label="行动控制面板"><div id="panel-content"></div></aside></div><footer class="footer"><span id="status"></span><span class="controls">空格 暂停 · 1/2/3 调速 · 单击部队→地区 调遣 · 滚轮 缩放</span><span class="seed" id="seed-label"></span></footer></div><div id="modal-layer"></div><div id="toast" role="status" aria-live="polite"></div><input type="file" id="file-input" accept=".json,application/json" aria-label="导入存档">`;
      this.renderer=new Renderer(document.getElementById('map-host')!,this.state);
      this.renderer.onSelect=id=>this.selectDistrict(id);this.renderer.onUnit=id=>this.selectUnit(id);
      this.renderer.onHover=(id,x,y)=>this.hover(id,x,y);
      document.addEventListener('click',e=>this.click(e));
      document.addEventListener('keydown',e=>this.key(e));
      document.getElementById('file-input')!.addEventListener('change',e=>this.importFile(e));
      document.addEventListener('input',e=>{const t=e.target as HTMLInputElement;if(t.id==='seed-input')this.menuSeed=Number(t.value)>>>0;});
      document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.started){this.state.paused=true;this.save(false);this.refresh();}});
      this.refresh();this.showMenu();
    }
    private hover(id:number,x:number,y:number):void {
      const el=document.getElementById('map-hover')!;if(id<0||this.modalKind){el.style.display='none';return;}
      const d=this.state.districts[id];el.innerHTML=`<strong>${escape(d.name)} <small class="muted">${TERRAIN[d.terrain]}</small></strong><span class="muted">人口 ${(d.population/10000).toFixed(1)} 万 · 民心 ${pct(d.support)}</span><br><span class="${d.supplied?'good':'bad'}">${d.supplied?'补给通畅':'补给受阻'}</span> · 情报 ${pct(d.intel)}${d.rebels>2&&d.intel>=35?`<br><span class="bad">武装活动 ${this.rebelLabel(d)}</span>`:''}`;el.style.display='block';el.style.left=Math.min(x+15,this.renderer.width-195)+'px';el.style.top=Math.max(8,Math.min(y+18,this.renderer.height-125))+'px';
    }
    private rebelLabel(d:District):string {return d.intel>=70?Math.round(d.rebels)+'':d.intel>=35?(d.rebels<12?'少量':d.rebels<28?'中等':'密集'):'情报不足';}
    selectDistrict(id:number):void {
      if(this.modalKind)return;
      if(this.selected!==id)document.getElementById('panel')!.scrollTop=0;
      this.selected=id;this.renderer.selected=id;
      if(this.unit!==null){const u=this.state.units.find(u=>u.id===this.unit);if(u&&active(u)){this.result(moveUnit(this.state,this.unit,id));this.tab='forces';}else this.tab='district';}
      else this.tab='district';this.beep();this.refresh();
    }
    selectUnit(id:number):void {
      if(this.modalKind)return;
      if(id<0||this.unit===id){this.unit=null;this.renderer.selectedUnit=null;this.refresh();return;}
      const u=this.state.units.find(u=>u.id===id);if(!u)return;this.unit=id;this.renderer.selectedUnit=id;this.selected=u.at;this.renderer.selected=u.at;this.tab='forces';this.beep();this.refresh();
    }
    result(r:Result):void {this.toast(r.message,!r.ok);this.beep(r.ok?440:170);this.refresh();}
    toast(text:string,error=false):void {
      const t=document.getElementById('toast')!;t.textContent=text;t.className='visible'+(error?' error':'');window.clearTimeout(this.toastTimer);this.toastTimer=window.setTimeout(()=>t.className='',3300);
    }
    private beep(freq=370):void {
      if(!this.sound)return;try{this.audio??=new AudioContext();void this.audio.resume();const osc=this.audio.createOscillator(),gain=this.audio.createGain();osc.connect(gain);gain.connect(this.audio.destination);osc.type='sine';osc.frequency.setValueAtTime(freq,this.audio.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*.68,this.audio.currentTime+.1);gain.gain.setValueAtTime(.035,this.audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,this.audio.currentTime+.13);osc.start();osc.stop(this.audio.currentTime+.14);}catch{this.sound=false;}
    }
    private click(e:MouseEvent):void {
      const b=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b||b.disabled)return;
      if(b.dataset.tab){if(this.tab!==b.dataset.tab)document.getElementById('panel')!.scrollTop=0;this.tab=b.dataset.tab as Tab;this.unit=null;this.renderer.selectedUnit=null;this.refresh();return;}
      if(b.dataset.layer){this.renderer.layer=b.dataset.layer as Layer;this.refresh();return;}
      if(b.dataset.scenario){this.menuScenario=b.dataset.scenario as Scenario;this.menuSeed=SCENARIOS[this.menuScenario].seed;this.showMenu();return;}
      if(b.dataset.governor){this.menuGovernor=b.dataset.governor as Governor;this.showMenu();return;}
      if(b.dataset.difficulty){this.menuDiff=b.dataset.difficulty as Difficulty;this.showMenu();return;}
      if(b.dataset.project){this.result(buildProject(this.state,this.selected,b.dataset.project as ProjectKind));return;}
      if(b.dataset.policy){this.result(buyPolicy(this.state,b.dataset.policy as PolicyKind));return;}
      if(b.dataset.recruit){this.result(recruit(this.state,b.dataset.recruit as UnitKind));return;}
      if(b.dataset.unit){this.selectUnit(Number(b.dataset.unit));return;}
      if(b.dataset.stance){const u=this.state.units.find(u=>u.id===Number(b.dataset.id));if(u)u.stance=b.dataset.stance as Stance;this.refresh();return;}
      if(b.dataset.extend){this.result(extendContract(this.state,Number(b.dataset.extend)));return;}
      if(b.dataset.halt){this.result(haltUnit(this.state,Number(b.dataset.halt)));return;}
      if(b.dataset.choice){const r=chooseEvent(this.state,Number(b.dataset.choice));if(r.ok)this.closeModal();this.result(r);return;}
      if(b.dataset.speed){this.state.speed=Number(b.dataset.speed);this.state.paused=false;this.refresh();return;}
      switch(b.dataset.action){
        case 'menu':this.showMenu();break;
        case 'start':this.start();break;
        case 'resume':this.closeModal();this.refresh();break;
        case 'continue':this.load();break;
        case 'pause':if(!this.state.event&&this.state.outcome==='playing'){this.state.paused=!this.state.paused;this.refresh();}break;
        case 'tick':if(!this.state.event&&this.state.outcome==='playing'){this.state.paused=true;this.tick();}break;
        case 'help':this.showHelp();break;
        case 'close':this.closeModal();this.refresh();break;
        case 'save':this.save(true);break;
        case 'export':this.exportSave();break;
        case 'import':document.getElementById('file-input')!.click();break;
        case 'sound':this.sound=!this.sound;this.beep();this.refresh();break;
        case 'peace':this.result(startPeace(this.state));break;
        case 'evacuate':this.result(evacuate(this.state,this.selected));break;
        case 'relief':this.result(relief(this.state,this.selected));break;
        case 'cancel-unit':this.unit=null;this.renderer.selectedUnit=null;this.tab='district';this.refresh();break;
        case 'zoom-in':this.renderer.setZoom(this.renderer.zoom*1.2);break;
        case 'zoom-out':this.renderer.setZoom(this.renderer.zoom/1.2);break;
        case 'fit':this.renderer.fit();break;
        case 'show-end':this.showEnd();break;
      }
    }
    private key(e:KeyboardEvent):void {
      if((e.target as HTMLElement).matches('input,textarea,select'))return;
      if(e.key==='Escape'){if(this.modalKind==='help'||this.modalKind==='menu'&&this.started||this.modalKind==='end'){this.closeModal();this.refresh();}else {this.unit=null;this.renderer.selectedUnit=null;this.refresh();}return;}
      if(this.modalKind)return;
      if(e.code==='Space'){e.preventDefault();if(this.state.outcome==='playing')this.state.paused=!this.state.paused;this.refresh();return;}
      if(['1','2','3'].includes(e.key)){this.state.speed=[1,2,4][Number(e.key)-1];this.state.paused=false;this.refresh();return;}
      if(e.key==='.'||e.key==='。'){this.state.paused=true;this.tick();return;}
      const tabs:Record<string,Tab>={b:'district',p:'policies',u:'forces',i:'situation'};
      if(tabs[e.key.toLowerCase()]){this.tab=tabs[e.key.toLowerCase()];this.unit=null;this.renderer.selectedUnit=null;this.refresh();}
      if(e.key.toLowerCase()==='s'&&!e.ctrlKey&&!e.metaKey)this.save(true);
      if(e.key==='?'||e.key.toLowerCase()==='h')this.showHelp();
      if(e.key==='0')this.renderer.fit();
    }
    start():void {
      this.state=newGame(this.menuScenario,this.menuGovernor,this.menuDiff,this.menuSeed);this.started=true;this.tab='district';this.selected=24;this.unit=null;this.renderer.replace(this.state);this.closeModal();this.refresh();this.toast('行动已暂停。先查看地区诉求、下达建设和招募命令，再按空格推进。');this.save(false);
    }
    tick():void {
      if(!this.started)return;step(this.state);if(this.state.week%4===0)this.save(false);this.refresh();
    }
    refresh():void {
      const s=this.state;
      if(this.unit!==null&&!s.units.some(u=>u.id===this.unit)){this.unit=null;this.renderer.selectedUnit=null;}
      const metrics=[{label:'可用资金',value:'$'+Math.floor(s.money),delta:`+${(s.lastIncome-s.lastUpkeep).toFixed(1)}/月`,icon:'money',cls:'gold'}, {label:'行动声望',value:Math.ceil(s.reputation).toString(),delta:'/ 100',icon:'flag',cls:s.reputation<30?'bad':''},{label:'人口民心',value:pct(support(s)),delta:'加权',icon:'people',cls:''},{label:'稳定人口',value:pct(stableShare(s)),delta:'/ 70%',icon:'peace',cls:'good'}];
      document.getElementById('metrics')!.innerHTML=metrics.map(m=>`<div class="metric" title="${m.label}${m.label==='可用资金'?'：每 4 周入账，已扣除部队维护':m.label==='人口民心'?'：按人口加权，不等同于稳定人口':''}"><label>${icon(m.icon)}${m.label}</label><span class="value ${m.cls}">${m.value}</span><span class="delta">${m.delta}</span></div>`).join('');
      document.getElementById('datebox')!.innerHTML=`W${String(s.week).padStart(3,'0')}<small>${s.rain?'RAIN / 雨季':'FIELD OPERATION'}</small>`;
      document.getElementById('speeds')!.innerHTML=`<button class="pause ${s.paused?'active':''}" data-action="pause" aria-label="${s.paused?'继续':'暂停'}" title="空格暂停 / 继续">${s.paused?'▶':'Ⅱ'}</button>${[1,2,4].map(n=>`<button data-speed="${n}" class="${s.speed===n&&!s.paused?'active':''}" aria-label="${n}倍速">${n}×</button>`).join('')}<button data-action="tick" title="推进 1 周 [.]" aria-label="推进一周">↦</button>`;
      document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===this.tab));
      document.getElementById('layers')!.innerHTML=([['terrain','地形'],['support','民心'],['supply','补给'],['intel','情报']] as [Layer,string][]).map(([key,label])=>`<button data-layer="${key}" class="${this.renderer.layer===key?'active':''}">${label}</button>`).join('');
      document.getElementById('map-title')!.textContent=SCENARIOS[s.scenario].name;
      document.getElementById('objective')!.innerHTML=`<div class="mission-label">MISSION<br><span class="gold">和平重建</span></div><div class="mission-text">${s.outcome==='playing'?(s.negotiating?'维持安全与民生，让和平协议获得持续支持。':'稳定 70% 人口，推动和谈；占领不等于和平。'):(s.outcome==='victory'?'重建行动达成目标。':'行动授权已结束。')}${s.peaceHold>0?`<br><span class="gold">巩固期 ${s.peaceHold} / 8 周</span>`:''}</div><div class="mini-meters"><div class="mini-meter"><label><span>稳定人口</span><b>${Math.round(stableShare(s))}%</b></label>${meter(stableShare(s)/.7)}</div><div class="mini-meter"><label><span>和平进程</span><b>${Math.round(s.peace)}%</b></label>${meter(s.peace,'gold')}</div></div>`;
      document.getElementById('unit-dock')!.innerHTML=s.units.map(u=>`<button class="dock-unit ${u.id===this.unit?'selected':''}" data-unit="${u.id}" title="${u.name} · ${s.districts[u.at].name} · 补给 ${round(u.supply)}%">${icon(u.kind==='engineer'?'wrench':'shield')}<span class="name">${u.name}</span>${meter(u.hp,u.hp<35?'red':'')}<span class="sub">${u.training>0?'训练 '+u.training+'周':u.path.length?'行军中':s.districts[u.at].rebels>1?'交战中':'待命'}</span></button>`).join('');
      const notice=document.getElementById('map-notice')!;notice.className=this.unit!==null?'show':'';notice.textContent=this.unit!==null?'已选择部队：点击目的地调遣 · 再次点击部队或右键取消':'';
      document.getElementById('status')!.innerHTML=`<span class="live-dot" style="${s.paused?'background:#d1be8b':''}"></span>${s.outcome!=='playing'?'行动结束':s.event?'等待决策':s.paused?'已暂停 · 可自由下达命令':`正在推进 · ${s.speed}×`} <span class="muted"> / ${s.districts.filter(d=>d.project).length} 项工程在建</span>`;
      document.getElementById('seed-label')!.textContent=`SEED ${s.seed} · BUILD 0.1.0`;
      document.getElementById('sound-button')!.innerHTML=icon(this.sound?'sound':'mute');
      const panel=document.getElementById('panel')!,scroll=panel.scrollTop;
      document.getElementById('panel-content')!.innerHTML=this.tab==='district'?this.districtPanel():this.tab==='policies'?this.policyPanel():this.tab==='forces'?this.forcePanel():this.situationPanel();panel.scrollTop=scroll;
      if(s.event&&this.modalKind!=='event')this.showEvent();
      if(s.outcome!=='playing'&&!this.modalKind)this.showEnd();
    }
    private districtPanel():string {
      const s=this.state,d=s.districts[this.selected],p=d.project;
      const status=d.hazard>0?'灾害封闭':controlled(d)?'武装控制':d.stability>=100?'已稳定':d.rebels>1?'存在冲突':'建设中';
      return `<div class="panel-kicker"><span>DISTRICT ${String(d.id+1).padStart(2,'0')}</span><span>${TERRAIN[d.terrain]} / ${status}</span></div><h2 class="panel-title">${d.name}</h2><p class="panel-sub">${(d.population/10000).toFixed(2)} 万居民 · ${d.id===s.hq?'行动总部':'河岚重建区域'}<br>情报覆盖 ${round(d.intel)}% · 武装${d.intel>=35?'规模 '+this.rebelLabel(d):'信息不完整'}</p><div class="stats-pair"><div class="stat-card"><label>当地民心</label><strong>${pct(d.support)}</strong>${meter(d.support)}</div><div class="stat-card"><label>稳定进度</label><strong>${pct(d.stability)}</strong>${meter(d.stability,'gold')}</div></div><div class="status-line"><span class="badge ${d.supplied?'':'red'}">${d.supplied?'补给已连接':'补给中断'}</span>${d.rebels>2&&d.intel>=35?'<span class="badge red">武装活动</span>':''}<span class="badge">公路 Lv.${d.levels.road}</span></div>${d.warning?`<div class="hazard-box"><h3>${icon('volcano')} 火山预警 · ${s.eruptionAt-s.week} 周</h3><p>疏散完成 ${pct(d.evacuation*100)}。工兵、道路和安置设施可加快转移。</p>${meter(d.evacuation*100,'gold')}<button class="wide" style="margin-top:11px" data-action="evacuate" ${d.evacuating||s.money<evacuateCost(s,d.id)?'disabled':''}>${d.evacuating?'疏散正在进行':'组织疏散 · $'+evacuateCost(s,d.id)}</button></div>`:''}${d.displaced>0?`<div class="hazard-box"><h3>居民等待安置 · ${round(d.displaced).toLocaleString()} 人</h3><p>避难设施、就业项目与工兵可以加快返乡，减少承接地区的压力。</p><button data-action="relief" class="wide" ${s.money<6?'disabled':''}>应急安置 · $6</button></div>`:''}<div class="demand">${d.levels[d.demand]>0?'首要诉求已回应':'首要诉求'}：<strong>${PROJECTS[d.demand].name}</strong><small>${d.levels[d.demand]>0?'继续完善服务，并保持地区安全。':'优先完成，可以更快改善当地民心。'}</small></div>${p?`<div class="construction"><div class="between"><b>${PROJECTS[p.kind].name}</b><span class="gold mono">${pct(p.progress/p.total*100)}</span></div>${meter(p.progress/p.total*100,'gold')}<small>${controlled(d)?'武装占领，施工暂停':!d.supplied?'补给中断，施工严重减速':`基础剩余约 ${Math.ceil(p.total-p.progress)} 周，受地形和后勤修正`}</small></div>`:''}<h3 class="section-title">地方建设 <small>${s.districts.filter(d=>d.project).length} / ${4+s.policies.logistics} 工程队</small></h3><div class="project-grid">${(Object.keys(PROJECTS) as ProjectKind[]).map(kind=>{const def=PROJECTS[kind],reason=projectAllowed(s,d.id,kind),max=d.levels[kind]>=def.max;return `<button class="project-card ${d.demand===kind&&!d.levels[kind]?'urgent':''} ${max?'maxed':''}" data-project="${kind}" ${reason?'disabled':''} title="${escape(def.desc+(reason?'\n'+reason:''))}"><span class="cost">${max?'✓':'$'+projectCost(s,d.id,kind)}</span>${icon(def.icon)}<strong>${def.name}</strong><span class="level">${max?'已完成最高等级':`LV ${d.levels[kind]} → ${d.levels[kind]+1} · ${def.weeks}周`}</span></button>`;}).join('')}</div><div class="divider"></div><p class="panel-sub">民心超过 53%、武装基本清除且补给连通时，地区开始积累稳定。民心增长不等于立即稳定。</p>`;
    }
    private policyPanel():string {
      const s=this.state;return `<div class="panel-kicker"><span>CIVIL ADMINISTRATION</span><span>省级治理</span></div><h2 class="panel-title">治理与重建</h2><p class="panel-sub">制度决定资金能否真正变成服务。短期支出与长期能力，需要一起考虑。</p><div class="stats-pair"><div class="stat-card"><label>腐败损耗</label><strong class="${s.corruption>35?'bad':'gold'}">${pct(s.corruption)}</strong>${meter(s.corruption,'red')}</div><div class="stat-card"><label>采购通胀</label><strong>${pct(s.inflation)}</strong>${meter(s.inflation,'gold')}</div></div>${(Object.keys(POLICIES) as PolicyKind[]).map(kind=>{const p=POLICIES[kind],cost=policyCost(s,kind),max=s.policies[kind]>=p.max;return `<div class="policy-card"><div class="row">${icon(p.icon)}<div style="flex:1"><h3>${p.name}</h3></div><div class="pips">${Array.from({length:p.max},(_,i)=>`<i class="${i<s.policies[kind]?'on':''}"></i>`).join('')}</div></div><p>${p.desc}</p><button class="wide" data-policy="${kind}" ${max||s.money<cost||kind==='forecast'&&s.scenario!=='volcano'?'disabled':''}>${max?'制度已完善':kind==='forecast'&&s.scenario!=='volcano'?'本地区无需火山监测':`升级至 Lv.${s.policies[kind]+1} · $${cost}`}</button></div>`;}).join('')}<p class="panel-sub">连续投入会短暂抬高采购成本；暂停不会让通胀下降，需要推进时间。</p>`;
    }
    private unitCard(u:Unit):string {
      const s=this.state;return `<div class="unit-card ${this.unit===u.id?'selected':''}"><button class="select-unit" data-unit="${u.id}"><h3>${icon(u.kind==='engineer'?'wrench':'shield')} ${u.name}</h3><span class="badge">${u.training>0?'训练中':u.path.length?'行军中':'可调遣'}</span></button><div class="location">${s.districts[u.at].name}${u.path.length?' → '+s.districts[u.path[u.path.length-1]].name:''} ${u.training>0?' · 剩余 '+u.training+' 周':''}</div><div class="unit-bars"><div><label><span>战备</span><b>${round(u.hp)}%</b></label>${meter(u.hp,u.hp<35?'red':'')}</div><div><label><span>补给</span><b>${round(u.supply)}%</b></label>${meter(u.supply,u.supply<30?'red':'gold')}</div></div><div class="stances">${([['protect','保护居民'],['balanced','均衡'],['assault','强攻']] as [Stance,string][]).map(([k,label])=>`<button data-stance="${k}" data-id="${u.id}" class="${u.stance===k?'active':''}" title="${k==='protect'?'较慢作战，显著降低居民伤亡风险':k==='assault'?'更快作战，但居民伤亡风险和不满显著增加':'平衡作战效率与风险'}">${label}</button>`).join('')}</div><div class="foot"><span>${u.kind==='coalition'?`驻留剩余 ${u.contract} 周`:`维护 $${UNIT_DEFS[u.kind].upkeep.toFixed(2)} / 月`}</span>${u.kind==='coalition'?`<button data-extend="${u.id}" ${s.money<11||u.contract>70?'disabled':''}>延期 $11</button>`:u.path.length?`<button data-halt="${u.id}">下一站停止</button>`:''}</div>${u.kind==='coalition'&&u.path.length?`<button class="wide" style="margin-top:8px;font-size:10px" data-halt="${u.id}">到下一站后停止行军</button>`:''}</div>`;
    }
    private forcePanel():string {
      const s=this.state;return `<div class="panel-kicker"><span>SECURITY & LOGISTICS</span><span>${s.units.length} / 7 支部队</span></div><h2 class="panel-title">部队与补给</h2><p class="panel-sub">先选部队，再点击地图上的目的地。相邻部队提供火力支援；战区会中止穿越行军。</p>${this.unit!==null?'<button class="wide" data-action="cancel-unit" style="margin-bottom:14px;font-size:11px">取消调遣选择，返回地区建设</button>':''}${s.units.length?s.units.map(u=>this.unitCard(u)).join(''):'<div class="empty">尚未部署部队。联合支援队能快速投入，国民军适合持久驻守。</div>'}<h3 class="section-title">训练与部署 <small>月维护 $${s.units.reduce((a,u)=>a+UNIT_DEFS[u.kind].upkeep,0).toFixed(1)}</small></h3>${(Object.keys(UNIT_DEFS) as UnitKind[]).map(kind=>{const d=UNIT_DEFS[kind];return `<div class="recruit-card"><div class="row">${icon(kind==='engineer'?'wrench':'shield')}<h3>${d.name}</h3></div><p>${d.desc}</p><div class="between"><small class="muted">基础训练 ${d.train} 周</small><button data-recruit="${kind}" ${s.money<d.cost||s.units.length>=7?'disabled':''}>招募 · $${d.cost}</button></div></div>`;}).join('')}<p class="panel-sub">部队只能沿实际路线移动。低补给部队伤害下降；在安全且补给连通的地区待命可以恢复战备。</p>`;
    }
    private chart():string {
      const h=this.state.history;if(h.length<2)return '<p class="panel-sub">每 4 周生成一份态势快照。</p>';
      const points=(key:'reputation'|'stable')=>h.map((v,i)=>`${10+i/(h.length-1)*252},${90-v[key]*.8}`).join(' ');
      return `<svg viewBox="0 0 280 105" class="situation-chart" aria-label="声望与稳定人口趋势"><path d="M10 10H266M10 50H266M10 90H266" stroke="#476047" stroke-width=".5" stroke-dasharray="3 4" fill="none"/><polyline points="${points('reputation')}" fill="none" stroke="#b9d9b8" stroke-width="1.7"/><polyline points="${points('stable')}" fill="none" stroke="#e4c389" stroke-width="1.7"/><text x="10" y="103" fill="#94aa8b" font-size="8">W${h[0].week}</text><text x="237" y="103" fill="#94aa8b" font-size="8">W${h[h.length-1].week}</text></svg><div class="chart-legend"><span>行动声望</span><span>稳定人口</span></div>`;
    }
    private situationPanel():string {
      const s=this.state,visible=s.districts.filter(d=>d.rebels>2&&d.intel>=35).length;
      return `<div class="panel-kicker"><span>STRATEGIC PICTURE</span><span>W${s.week} / 360</span></div><h2 class="panel-title">通往和平</h2><p class="panel-sub">一个可以自行运转的社会，才是行动的终点。</p>${this.chart()}<h3 class="section-title">和平重建目标</h3>${[[stableShare(s)>=70,`稳定至少 70% 人口`,`${stableCount(s)} / 35 地区稳定 · 当前 ${pct(stableShare(s))}`],[s.peace>=100,'和平进程达到 100%',s.negotiating?`谈判中 · 当前 ${pct(s.peace)}`:'第 48 周后，民心 ≥48%，升级调解与复员后可启动'],[s.peaceHold>=8,'安全条件下巩固 8 周',`武装规模需低于 65（情报可能不完整）；巩固 ${s.peaceHold} / 8 周`]].map(([done,title,detail])=>`<div class="goal ${done?'done':''}"><span class="check">${done?'✓':''}</span><div>${title}<small>${detail}</small></div>`).join('')}<button class="wide ${s.negotiating?'':'primary'}" data-action="peace" ${s.negotiating?'disabled':''}>${s.negotiating?'和谈进行中 · '+pct(s.peace):'启动和谈 · $12'}</button><p class="panel-sub" style="margin-top:13px;font-size:10px">另一条道路：稳定至少 85% 人口、武装规模低于 5，同样巩固 8 周。第 360 周授权期结束。</p><div class="divider"></div><div class="between"><span class="muted">可见冲突地区</span><span class="bad mono">${visible}</span></div><div class="between" style="margin-top:10px"><span class="muted">居民累计伤亡</span><span class="mono">${s.casualties.toLocaleString()}</span></div><div class="between" style="margin-top:10px"><span class="muted">提前疏散人次</span><span class="mono good">${s.rescued.toLocaleString()}</span></div><h3 class="section-title">行动日志 <small>最新 22 条</small></h3><ul class="log-list">${s.logs.slice(0,22).map(l=>`<li class="${l.type}"><time>W${String(l.week).padStart(3,'0')}</time><p>${escape(l.text)}</p></li>`).join('')}</ul>`;
    }
    private setModal(html:string,kind:Controller['modalKind'],menu=false):void {
      this.modalKind=kind;this.state.paused=true;document.getElementById('modal-layer')!.innerHTML=`<div class="overlay ${menu?'menu-overlay':''}" role="dialog" aria-modal="true" aria-label="${kind==='menu'?'行动配置':kind==='event'?'事件决策':kind==='end'?'行动结算':'行动手册'}">${html}</div>`;document.getElementById('app')!.classList.toggle('menu-open',menu);document.getElementById('map-hover')!.style.display='none';
    }
    closeModal():void {document.getElementById('modal-layer')!.innerHTML='';document.getElementById('app')!.classList.remove('menu-open');this.modalKind=null;}
    showMenu():void {
      let saved=false;try{saved=!!localStorage.getItem(SAVE_KEY);}catch{/* Private/file browsing may disallow persistence. */}
      this.setModal(`<section class="launch"><div class="launch-brand"><div class="eyebrow">A RECONSTRUCTION STRATEGY GAME</div><h1>烬土</h1><div class="english">AFTERFIRE</div><p class="tagline">秩序不是占领。<br>和平需要建设。</p><p class="intro">在战火与灰烬之间，重建一个地区。<br>让补给越过山岭，让生活先于承诺抵达。<br>你赢得的，应该是人们愿意留下的未来。</p><div class="version">ORIGINAL STRATEGY · v0.1.0<br><br>程序绘制地图 · 离线运行 · 无外部素材</div></div><div class="launch-config"><div class="eyebrow">OPERATION BRIEF / 行动简报</div><div class="scenario-options">${(Object.keys(SCENARIOS) as Scenario[]).map(key=>`<button class="scenario-option ${this.menuScenario===key?'active':''}" data-scenario="${key}">${icon(key==='volcano'?'volcano':key==='corridor'?'road':'map')}<div><strong>${SCENARIOS[key].name}</strong><small>${SCENARIOS[key].subtitle}</small></div></button>`).join('')}</div><p class="briefing">${SCENARIOS[this.menuScenario].brief}</p><label>治理者</label><div class="segmented">${(Object.keys(GOVERNORS) as Governor[]).map(k=>`<button data-governor="${k}" class="${this.menuGovernor===k?'active':''}">${GOVERNORS[k].name}</button>`).join('')}</div><p class="governor-detail">${GOVERNORS[this.menuGovernor].desc}</p><label>行动强度</label><div class="segmented">${([['relaxed','宽松'],['standard','标准'],['veteran','严峻']] as [Difficulty,string][]).map(([k,n])=>`<button data-difficulty="${k}" class="${this.menuDiff===k?'active':''}">${n}</button>`).join('')}</div><div class="seed-row"><label for="seed-input">地图种子</label><input id="seed-input" type="number" min="0" max="4294967295" value="${this.menuSeed}"/><span>相同种子可以复盘</span></div><button class="primary launch-button" data-action="start">开始行动 ${icon('arrow')}</button>${this.started?'<button class="continue-button" data-action="resume">返回当前行动（暂停）</button>':saved?'<button class="continue-button" data-action="continue">继续上次保存的行动</button>':''}<div class="start-note">建议首次选择「河谷重建 / 宽松」<br>新行动会覆盖自动存档；可先在手册中导出旧存档。</div></div></section>`,'menu',true);
    }
    showEvent():void {
      const e=this.state.event;if(!e)return;this.setModal(`<section class="modal"><div class="event-icon">${icon('bell')}</div><div class="eyebrow">FIELD DISPATCH / W${this.state.week}</div><h2>${escape(e.title)}</h2><p>${escape(e.body)}</p><div class="between"><span class="muted" style="font-size:10px">行动已暂停，等待你的决策</span><span class="gold mono">$${Math.floor(this.state.money)}</span></div><div class="choices">${e.choices.map((c,i)=>`<button class="choice" data-choice="${i}" ${this.state.money<c.cost?'disabled':''}><strong>${escape(c.text)}</strong><small>${escape(c.detail)}</small></button>`).join('')}</div></section>`,'event');
    }
    showHelp():void {
      this.setModal(`<section class="modal" style="width:650px"><button class="close" data-action="close" aria-label="关闭手册">${icon('cross')}</button><div class="eyebrow">FIELD MANUAL / 行动手册</div><h2>不是涂满地图，而是重建生活。</h2><div class="help-grid"><div class="help-item"><b>01 / 先听诉求</b><p>点击城镇，优先回应「首要诉求」。工程需施工，民心达到 53% 且安全、通补给后才能积累稳定。</p></div><div class="help-item"><b>02 / 早建预备队</b><p>在部队面板招募。第 12 周武装出现。选择部队，再点击目的地；再次点击部队或右键取消选择。</p></div><div class="help-item"><b>03 / 不打孤立的仗</b><p>相邻部队提供支援。山地不利作战，低补给进一步削弱战力。公路加快调动；保护居民姿态可减少平民伤亡。</p></div><div class="help-item"><b>04 / 把钱变成能力</b><p>每 4 周自动发放预算并扣除部队维护。审计抑制腐败，后勤加快施工。不要只投资军事。</p></div><div class="help-item"><b>05 / 灰烬之前撤离</b><p>灰烬山脊首次喷发在第 48 周。金色边界标示危险区：点击后组织疏散。工兵、道路与安置设施提高效率。</p></div><div class="help-item"><b>06 / 谈判结束战争</b><p>第 48 周后，民心 ≥48%、武装规模 &lt;180、至少一级调解与复员，即可付费启动和谈。详细胜利条件见态势面板。</p></div></div><p><span class="help-key">空格</span> 暂停 / 继续　<span class="help-key">1 2 3</span> 1× / 2× / 4×　<span class="help-key">.</span> 推进一周<br><span class="help-key">B P U I</span> 切换面板　<span class="help-key">S</span> 保存　<span class="help-key">0</span> 地图复位<br>拖动地图平移，滚轮缩放；切换图层检查民心、补给与情报。</p><div class="divider"></div><div class="row"><button data-action="save">保存进度</button><button data-action="export">导出存档</button><button data-action="import">导入存档</button></div><p style="font-size:10px">每 4 周自动保存；切到后台会自动暂停。浏览器禁用本地存储时，使用导出存档。原创建设策略游戏，与 Rebel Inc. 无官方关系。地区和所有机制均为虚构，不是现实冲突预测模型。</p><button class="primary wide" data-action="close">返回行动（保持暂停）</button></section>`,'help');
    }
    showEnd():void {
      const s=this.state;this.setModal(`<section class="modal" style="width:620px"><div class="event-icon">${icon(s.outcome==='victory'?'peace':'flag')}</div><div class="eyebrow">OPERATION DEBRIEF / 行动结算</div><h2>${s.outcome==='victory'?'灰烬之上，生活重来。':'重建还没有抵达终点。'}</h2><p>${escape(s.endReason)}</p><div class="result-grid">${[[s.week+'','行动周数'],[pct(stableShare(s)),'稳定人口'],[pct(support(s)),'人口民心'],[s.casualties.toLocaleString(),'居民伤亡'],[s.rescued.toLocaleString(),'提前疏散人次'],[s.completed+'','完成工程']].map(([v,label])=>`<div class="result-stat"><strong>${v}</strong><small>${label}</small></div>`).join('')}</div>${this.chart()}<p style="font-size:11px">民用投入 $${round(s.spentCivil)} · 军事投入 $${round(s.spentMilitary)}<br>${s.outcome==='defeat'?(s.reputation<=0?'复盘建议：检查城市失守、停滞与灾害伤亡。不要把所有部队和预算消耗在山地。':'复盘建议：更早回应人口中心的诉求，发展地方议事会，并尽早启动和谈。'):'安全不是和平的全部。下一局，试着用更少的伤亡达到同样的终点。'}</p><div class="row"><button class="primary" data-action="menu">新的行动</button><button data-action="export">导出复盘存档</button></div></section>`,'end');this.save(false);
    }
    save(notify=false):void {if(!this.started)return;try{localStorage.setItem(SAVE_KEY,serialize(this.state));if(notify)this.toast('进度已保存到当前浏览器。');}catch{if(notify||!this.saveErrorShown){this.toast('浏览器不允许本地存储，请在手册中导出存档。',true);this.saveErrorShown=true;}}}
    load():void {try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)throw new Error('没有可读取的存档');this.restore(deserialize(raw));this.toast('存档已载入，行动保持暂停。');}catch(e){this.toast('读取失败：'+(e instanceof Error?e.message:'未知错误'),true);}}
    private restore(s:State):void {this.state=s;this.started=true;this.selected=24;this.unit=null;this.renderer.replace(s);this.closeModal();this.refresh();}
    private exportSave():void {
      if(!this.started){this.toast('请先开始一局行动。',true);return;}
      const blob=new Blob([serialize(this.state)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`afterfire-${this.state.seed}-W${this.state.week}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);this.toast('存档已导出。');
    }
    private async importFile(e:Event):Promise<void> {
      const input=e.target as HTMLInputElement,file=input.files?.[0];if(!file)return;
      try{if(file.size>1500000)throw new Error('存档过大');const s=deserialize(await file.text());this.restore(s);this.save(false);this.toast('存档导入成功。');}catch(err){this.toast('导入失败：'+(err instanceof Error?err.message:'文件损坏'),true);}finally{input.value='';}
    }
  }
}
