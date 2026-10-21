'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const M=require('../model.js');
const read=n=>JSON.parse(fs.readFileSync(path.join(__dirname,'../data',n+'.json'),'utf8'));
const topics=read('topics'),edges=read('dependencies'),profile=read('profile');
const ids=new Set(topics.map(t=>t.id));
assert.equal(topics.length,90);assert.equal(ids.size,90);
assert.deepEqual(profile.levels,['Pre-A1','A1','A2','B1','B2']);
assert.deepEqual(profile.focus_levels,['A1','A2']);
for(const t of topics){
 assert.ok(profile.domains.includes(t.domain));assert.ok(profile.levels.includes(t.level));
 assert.equal(t.initial_status,'unknown');assert.equal(t.alignment,'inferred');
 assert.ok(t.mastery_criteria.length>=2);
 for(const field of ['question','answer','transfer'])assert.ok(t.diagnostic_question[field]);
 assert.ok(t.practice && t.description);assert.ok(!Object.hasOwn(t,'upstream_refs'));
 assert.ok(t.source_ids.every(id=>profile.sources.some(s=>s.id===id)));
}
for(const domain of profile.domains)for(const level of profile.levels)assert.equal(topics.filter(t=>t.domain===domain && t.level===level).length,3);
const seen=new Set();
for(const e of edges){
 assert.ok(ids.has(e.topicId)&&ids.has(e.prerequisiteId));assert.notEqual(e.topicId,e.prerequisiteId);
 const key=e.prerequisiteId+'>'+e.topicId;assert.ok(!seen.has(key));seen.add(key);
 assert.equal(e.strength,'soft');assert.ok(e.reason.length>12);
}
const done=new Set();function visit(id,stack=new Set()){
 assert.ok(!stack.has(id),'cycle '+id);if(done.has(id))return;stack.add(id);
 edges.filter(e=>e.topicId===id).forEach(e=>visit(e.prerequisiteId,stack));stack.delete(id);done.add(id);
}ids.forEach(id=>visit(id));
for(const domain of profile.domains){
 const seq=topics.filter(t=>t.domain===domain).sort((a,b)=>profile.levels.indexOf(a.level)-profile.levels.indexOf(b.level)||a.order-b.order);
 for(let i=1;i<seq.length;i++)assert.ok(edges.some(e=>e.topicId===seq[i].id&&e.prerequisiteId===seq[i-1].id));
}
const near=M.nearby('ye_s03',edges,2);assert.ok(near.has('ye_s02')&&near.has('ye_g02')&&near.has('ye_s04'));assert.ok(!near.has('ye_w_b2_3'));
const record={status:'independent',note:'test observation',updated_at:'2026-10-21T12:00:00Z'};
assert.deepEqual(M.validateProgress(M.snapshot({ye_s03:record}),topics),{ye_s03:record});
for(const bad of [M.snapshot({unknown:record}),M.snapshot({ye_s03:{...record,status:'mastered'}}),M.snapshot({ye_s03:{...record,note:'x'.repeat(2001)}}),M.snapshot({ye_s03:{...record,updated_at:'bad'}}),M.snapshot([]),{schema_version:9,kind:'english-map-observations',records:{}}])assert.throws(()=>M.validateProgress(bad,topics));
assert.ok(topics.filter(t=>t.domain===profile.domains[0]&&['B1','B2'].includes(t.level)).every(t=>t.diagnostic_question.script));
for(const dir of ['diagnose','explore','english','scripts','screenshots'])assert.ok(!fs.existsSync(path.join(__dirname,'..',dir)),'obsolete module remains: '+dir);
assert.deepEqual(fs.readdirSync(path.join(__dirname,'../data')).filter(n=>n.endsWith('.json')).sort(),['dependencies.json','profile.json','topics.json']);
const forbidden=/cne_[pjh]\d|cnm_[a-z0-9]|ces-2022|cms-2022|math\.pansgo\.com|test\.pansgo\.com/;
for(const file of ['index.html','app.js','data/topics.json','data/dependencies.json','data/profile.json'])assert.ok(!forbidden.test(fs.readFileSync(path.join(__dirname,'..',file),'utf8')),'legacy content '+file);
console.log(`PASS: ${topics.length} capabilities, ${edges.length} suggested edges, 5 stages x 6 domains; acyclic paths, observation validation, no inferred mastery, no legacy curriculum modules.`);
