(async function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const M = window.EnglishMap;
  const storageKey = 'youngEnglishMap.observations.v1';
  let topics, deps, profile, byId, cy, selected, records = {}, view = 'overview', mode = 'practice';
  const overview = document.createElement('div');
  overview.id = 'overview';
  $('cy').before(overview);
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(text, fn, className) {
    const node = el('button',text,className); node.type='button'; node.addEventListener('click',fn); return node;
  }
  function notify(text, error = false) { $('message').textContent=text; $('message').classList.toggle('error',error); }
  function status(id) { return M.statuses[records[id]?.status || 'unknown']; }
  function currentTopics() {
    const query = $('search').value.trim().toLocaleLowerCase();
    return topics.filter(t => ($('scope').value==='all' || ($('scope').value==='focus' ? profile.focus_levels.includes(t.level) : t.level===$('scope').value)) && (!$('domain').value || t.domain === $('domain').value) && (!query || [t.name,t.description,t.domain,t.id,t.practice].join(' ').toLocaleLowerCase().includes(query)));
  }
  function choose(id, scroll = mode === 'map') {
    if (!byId.has(id)) return;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    selected=id;
    history.replaceState(null,'','#'+id);
    if ($('scope').value==='focus' && !profile.focus_levels.includes(byId.get(id).level)) $('scope').value=byId.get(id).level;
    else if (!['focus','all',byId.get(id).level].includes($('scope').value)) $('scope').value=byId.get(id).level;
    if ($('domain').value && $('domain').value!==byId.get(id).domain) $('domain').value='';
    if (!currentTopics().some(t=>t.id===id)) $('search').value='';
    renderList(); renderDetail(); renderSessionPicker(); renderMap();
    if (scroll) scrollToTask();
  }
  function nodeButton(t, className) {
    const b = button(t.name,()=>choose(t.id),className);
    b.dataset.topic=t.id;
    b.classList.toggle('selected',t.id===selected);
    b.setAttribute('aria-pressed',String(t.id===selected));
    b.append(el('small',status(t.id)));
    return b;
  }
  function renderList() {
    const visible=currentTopics();
    $('count').textContent=`${visible.length} 个能力点 · 已观察 ${Object.keys(records).length} / ${topics.length}`;
    $('list').replaceChildren();
    for (const level of profile.levels) {
      const rows=visible.filter(t=>t.level===level);
      if (!rows.length) continue;
      $('list').append(el('h3',level+(profile.focus_levels.includes(level)?' · 孩子附近':'')));
      rows.forEach(t=>$('list').append(nodeButton(t,'node-button')));
    }
    if (!visible.length) $('list').append(el('p','没有匹配的能力点，试试其他关键词。','empty'));
  }
  function renderOverview() {
    overview.replaceChildren();
    const header=el('div',undefined,'overview-head');
    const levels=profile.levels.filter(level=>currentTopics().some(t=>t.level===level));
    overview.style.setProperty('--level-count',String(Math.max(1,levels.length)));
    overview.classList.toggle('fullpath',levels.length>3);
    levels.forEach(level=>header.append(el('span',level+(profile.focus_levels.includes(level)?' · 孩子附近':''))));
    overview.append(header);
    const filtered=currentTopics();
    profile.domains.forEach(domain=>{
      if (!filtered.some(t=>t.domain===domain)) return;
      const lane=el('section',undefined,'lane'); lane.append(el('h3',domain));
      const grid=el('div',undefined,'lane-grid');
      levels.forEach(level=>{
        const phase=level==='Pre-A1'?'foundation':(profile.focus_levels.includes(level)?'bridge':'next');
        const group=el('div',undefined,'phase-group '+phase);
        group.append(el('span',level,'level-chip'));
        const rows=filtered.filter(t=>t.domain===domain && t.level===level);
        rows.forEach(t=>group.append(nodeButton(t,'overview-node')));
        if (!rows.length) group.append(el('span','—','small'));
        grid.append(group);
      });
      lane.append(grid); overview.append(lane);
    });
    if (!filtered.length) overview.append(el('p','没有匹配的能力点。','empty'));
  }
  function color(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function renderGraph() {
    const visible=M.nearby(selected,deps,2);
    const elements=topics.filter(t=>visible.has(t.id)).map(t=>({data:{id:t.id,label:t.level+' · '+t.name+'\n'+status(t.id),phase:t.phase}}));
    deps.filter(d=>visible.has(d.prerequisiteId) && visible.has(d.topicId)).forEach((d,i)=>elements.push({data:{id:'e'+i,source:d.prerequisiteId,target:d.topicId}}));
    if (cy) cy.destroy();
    if (!window.cytoscape) { $('cy').replaceChildren(el('p','关系图暂时无法加载；前后关系仍可在详情中查看。')); return; }
    cy=cytoscape({container:$('cy'),elements,style:[
      {selector:'node',style:{shape:'round-rectangle',width:165,height:64,label:'data(label)','background-color':color('--foundation'),color:color('--ink'),'font-family':'PingFang SC, Microsoft YaHei, sans-serif','font-size':12,'text-wrap':'wrap','text-max-width':150,'text-valign':'center','text-halign':'center','border-width':1,'border-color':color('--line')}},
      {selector:'node[phase="bridge"]',style:{'background-color':color('--bridge')}},
      {selector:'node[phase="next"]',style:{'background-color':color('--next')}},
      {selector:'edge',style:{width:1.2,'line-color':color('--muted'),'target-arrow-color':color('--muted'),'target-arrow-shape':'triangle','curve-style':'bezier','line-style':'dashed','arrow-scale':0.8}},
      {selector:'node.current',style:{'border-color':color('--green'),'border-width':3}},
    ],layout:{name:'dagre',rankDir:'TB',nodeSep:25,rankSep:45,padding:22},minZoom:0.35,maxZoom:2.5});
    cy.getElementById(selected).addClass('current');
    cy.on('tap','node',evt=>choose(evt.target.id()));
    $('map-hint').textContent='虚线箭头表示建议先练 → 后练；显示前置两层及后续一层。详情中的按钮提供相同关系。';
  }
  function renderMap() {
    $('view-overview').setAttribute('aria-pressed',String(view==='overview'));
    $('view-nearby').setAttribute('aria-pressed',String(view==='nearby'));
    overview.hidden=view!=='overview'; $('cy').hidden=view!=='nearby';
    $('fit').disabled=view==='overview';
    if (view==='overview' || mode!=='map') {
      renderOverview();
      $('map-hint').textContent='按领域查看阶段路线；切换学习范围可展开全路径。点「前后关系」查看跨领域衔接。';
    } else renderGraph();
  }
  function speak(script) {
    if (!('speechSynthesis' in window)) { notify('此设备不支持示范朗读，请由成人按脚本朗读。',true); return; }
    speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(script);
    speech.lang='en-GB'; speech.rate=0.85;
    speech.onerror=()=>notify('设备语音暂不可用，请由成人朗读脚本。',true);
    speechSynthesis.speak(speech);
  }
  function scrollToTask() {
    $('detail').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  }
  function setMode(next) {
    mode=next;
    $('practice-panel').hidden=mode!=='practice';
    $('map-panel').hidden=mode!=='map';
    $('mode-practice').setAttribute('aria-pressed',String(mode==='practice'));
    $('mode-map').setAttribute('aria-pressed',String(mode==='map'));
    renderMap();
    $('main').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  }
  function renderSessionPicker() {
    const t=byId.get(selected);
    const shortNames=['听力','口语','阅读','写作','语法','词汇'];
    const subtitles=['听懂信息','开口表达','理解文章','写清意思','组织句子','积累表达'];
    $('domain-picker').replaceChildren();
    profile.domains.forEach((domain,index)=>{
      const b=button('',()=>{
        const current=byId.get(selected);
        const preferred=profile.entry_points.map(id=>byId.get(id)).find(row=>row.domain===domain);
        const target=profile.focus_levels.includes(current.level)?preferred:topics.find(row=>row.domain===domain && row.level===current.level);
        choose(target.id,false);
      },'domain-choice');
      b.setAttribute('aria-pressed',String(t.domain===domain));
      b.append(el('span',shortNames[index],'domain-name'),el('small',subtitles[index]));
      $('domain-picker').append(b);
    });
    $('session-topic').replaceChildren();
    const levels=profile.levels.filter(level=>profile.focus_levels.includes(level)||level===t.level);
    levels.forEach(level=>{
      const group=el('optgroup');group.label=level+(profile.focus_levels.includes(level)?' · 孩子附近':' · 当前查看');
      topics.filter(row=>row.domain===t.domain && row.level===level).forEach(row=>{
        const option=el('option',row.name);option.value=row.id;group.append(option);
      });
      $('session-topic').append(group);
    });
    $('session-topic').value=selected;
    $('session-hint').textContent=profile.focus_levels.includes(t.level)?'这里先列出该领域 A1–A2 附近的目标。完整路径在「学习全图」。':'当前查看 '+t.level+' 目标；孩子的实际起点仍需分项观察。';
    updateRecordCount();
  }
  function updateRecordCount() {
    const n=Object.keys(records).length;
    $('record-count').textContent=n?`已记录 ${n} 项能力的观察。`:'尚无观察记录。待确认表示还没观察。';
  }
  function fold(title,content,className='more-section') {
    const d=el('details',undefined,className);d.append(el('summary',title),content);return d;
  }
  function renderDetail() {
    const t=byId.get(selected),q=t.diagnostic_question;
    const header=el('div',undefined,'task-heading');
    const heading=el('div');heading.append(el('span',`${t.domain} · ${t.level}`,'pill'),el('h2',t.name),el('p',t.description));
    header.append(heading,el('span',status(selected),'task-status'));
    $('detail').replaceChildren(header);
    const body=el('div',undefined,'task-layout');
    const task=el('section',undefined,'task-body');task.setAttribute('aria-label','任务与家长提示');
    task.append(el('p','做个小任务','section-label'),el('p',q.question,'task-prompt'));
    if(q.script){
      task.append(button('播放语音示范',()=>speak(q.script),'listen-button'));
      const script=el('div');script.append(el('p',q.script),el('p','听力观察时，请让孩子只听，不看脚本。','small'));
      task.append(fold('成人朗读脚本',script));
    }
    const notes=el('div');const criteria=el('ul');t.mastery_criteria.forEach(item=>criteria.append(el('li',item)));
    notes.append(criteria,el('p',q.answer));
    task.append(fold('家长查看：观察要点和参考回答',notes));
    task.append(fold('换个情境再试',el('p',q.transfer)));
    task.append(fold('这个能力怎么练',el('p',t.practice)));
    const form=el('form',undefined,'observation-form');form.setAttribute('aria-label','记录这次表现');
    form.append(el('h3','记下这次表现'),el('p','按这一次实际完成的情况选择。','small'));
    const statusLabel=el('label','这次的表现');statusLabel.htmlFor='observation-status';
    const select=el('select');select.id='observation-status';
    Object.entries(M.statuses).forEach(([value,label])=>{const option=el('option',label);option.value=value;select.append(option);});
    select.value=records[t.id]?.status||'unknown';
    const noteWrap=el('div');const noteLabel=el('label','材料、提示程度与观察备注');noteLabel.htmlFor='observation-note';
    const note=el('textarea');note.id='observation-note';note.maxLength=2000;note.placeholder='例如：听两遍能说出活动，时间还需要提示。';note.value=records[t.id]?.note||'';
    noteWrap.append(noteLabel,note);
    const noteDetails=fold('补充备注（可选）',noteWrap,'note-details');noteDetails.open=Boolean(note.value);
    const save=el('button','保存这次观察','primary-button');save.type='submit';
    const updated=el('p',records[t.id]?'最近记录：'+new Date(records[t.id].updated_at).toLocaleDateString('zh-CN'):'还没观察过这一项','small record-date');
    const clear=button('清除此项记录',()=>{
      const next={...records};delete next[t.id];
      try{localStorage.setItem(storageKey,JSON.stringify(M.snapshot(next)));}
      catch(error){notify('浏览器无法更新存档，未清除记录。',true);return;}
      records=next;renderList();renderMap();renderDetail();updateRecordCount();notify('已清除此项记录，恢复为待确认。');
    },'text-button');clear.disabled=!records[t.id];
    form.append(statusLabel,select,noteDetails,save,updated,fold('更多记录操作',clear,'record-actions'));
    form.addEventListener('submit',event=>{
      event.preventDefault();
      records={...records,[t.id]:{status:select.value,note:note.value,updated_at:new Date().toISOString()}};
      let persisted=true;try{localStorage.setItem(storageKey,JSON.stringify(M.snapshot(records)));}catch(error){persisted=false;}
      renderList();renderMap();updateRecordCount();
      updated.textContent='最近记录：'+new Date(records[t.id].updated_at).toLocaleDateString('zh-CN');
      clear.disabled=false;header.querySelector('.task-status').textContent=status(t.id);
      notify(persisted?'已保存。下次换个内容，再看看能否独立完成。':'浏览器无法保存：请从右上角「观察记录」导出备份。',!persisted);
    });
    body.append(task,form);$('detail').append(body);
    const connections=el('div',undefined,'task-connections');
    connections.append(button('查看这个能力的前后关系',()=>{view='nearby';setMode('map');},'text-button'),el('p','本次独立完成不等于稳定掌握，也不会自动勾选其他能力。','small'));
    $('detail').append(connections);
    const relationContent=el('div',undefined,'relation-content');
    const before=deps.filter(d=>d.topicId===selected),after=deps.filter(d=>d.prerequisiteId===selected);
    for(const [title,edges,key] of [['往前检查',before,'prerequisiteId'],['接下来会用到',after,'topicId']]){
      relationContent.append(el('h3',title));
      if(!edges.length)relationContent.append(el('p','本图没有设置其他直接关系。','small'));
      edges.forEach(edge=>{const b=button(byId.get(edge[key]).name,()=>choose(edge[key],true),'relation');b.append(el('small',edge.reason));relationContent.append(b);});
    }
    const sources=el('p',undefined,'small');t.source_ids.forEach(id=>{const source=profile.sources.find(x=>x.id===id);const a=el('a',source.title+' ');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';sources.append(a);});
    relationContent.append(el('h3','参考范围'),sources,el('p',t.cefr_scope+' · 具体阶段对应为教学设计推断。','small'));
    $('detail').append(fold('展开前后能力与参考依据',relationContent,'connections-details'));
  }
  try {
    [topics,deps,profile]=await Promise.all(['topics','dependencies','profile'].map(async name=>{const response=await fetch('data/'+name+'.json');if(!response.ok)throw new Error('加载失败');return response.json();}));
    byId=new Map(topics.map(t=>[t.id,t]));
    selected=byId.has(location.hash.slice(1))?location.hash.slice(1):'ye_l03';
    if (!profile.focus_levels.includes(byId.get(selected).level)) $('scope').value=byId.get(selected).level;
    try { const saved=localStorage.getItem(storageKey); if(saved)records=M.validateProgress(JSON.parse(saved),topics); } catch(error) { notify('本机记录无法读取，已保留原存档。可尝试导入之前的备份。',true); }
    profile.domains.forEach(domain=>{const option=el('option',domain);option.value=domain;$('domain').append(option);});
    $('scope').addEventListener('change',()=>{renderList();renderMap();});
    $('domain').addEventListener('change',()=>{renderList();renderMap();});
    $('search').addEventListener('input',()=>{renderList();renderMap();});
    $('view-overview').addEventListener('click',()=>{view='overview';renderMap();});
    $('view-nearby').addEventListener('click',()=>{view='nearby';renderMap();});
    $('fit').addEventListener('click',()=>{if(cy)cy.fit(undefined,24);});
    $('mode-practice').addEventListener('click',()=>setMode('practice'));
    $('mode-map').addEventListener('click',()=>setMode('map'));
    $('open-task').addEventListener('click',scrollToTask);
    $('session-topic').addEventListener('change',()=>choose($('session-topic').value,false));
    $('export').addEventListener('click',()=>{
      const a=el('a');const url=URL.createObjectURL(new Blob([JSON.stringify(M.snapshot(records),null,2)],{type:'application/json'}));
      a.href=url;a.download='english-map-observations.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('已导出观察记录，请保留备份。');
    });
    $('import').addEventListener('change',async event=>{
      const file=event.target.files[0];if(!file)return;
      try {
        if(file.size>500000)throw new Error('文件过大，请选择本地图导出的记录。');
        const incoming=M.validateProgress(JSON.parse(await file.text()),topics);
        const merged={...records};let changed=0;
        for(const [id,row] of Object.entries(incoming))if(!merged[id] || Date.parse(row.updated_at)>Date.parse(merged[id].updated_at)){merged[id]=row;changed++;}
        localStorage.setItem(storageKey,JSON.stringify(M.snapshot(merged)));records=merged;
        renderList();renderMap();renderDetail();renderSessionPicker();notify(`已合并 ${changed} 项较新的观察记录，保留本机较新记录。`);
      } catch(error) { notify(error instanceof SyntaxError?'无法读取 JSON，未导入任何内容。':error.message,true); }
      event.target.value='';
    });
    window.addEventListener('hashchange',()=>{if(byId.has(location.hash.slice(1)))choose(location.hash.slice(1));});
    const media=matchMedia('(prefers-color-scheme: dark)');media.addEventListener('change',()=>{if(view==='nearby')renderMap();});
    renderList();renderMap();renderDetail();renderSessionPicker();
  } catch(error) { notify('地图数据未能加载。请通过本地服务或部署地址打开，并刷新重试。',true);$('list').textContent='数据加载失败';$('detail').textContent='暂时无法显示任务。'; }
})();
