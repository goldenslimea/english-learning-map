/* Shared data and observation logic; no inferred mastery or prerequisite skipping. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EnglishMap = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const statuses = Object.freeze({unknown:'待确认', emerging:'需要帮助', independent:'本次能独立完成', revisit:'待复核'});
  function nearby(id, dependencies, upDepth = 2) {
    const ids = new Set([id]);
    let frontier = [id];
    for (let depth = 0; depth < upDepth; depth++) {
      const next = [];
      dependencies.forEach(edge => {
        if (frontier.includes(edge.topicId) && !ids.has(edge.prerequisiteId)) {
          ids.add(edge.prerequisiteId); next.push(edge.prerequisiteId);
        }
      });
      frontier = next;
    }
    dependencies.filter(edge => edge.prerequisiteId === id).forEach(edge => ids.add(edge.topicId));
    return ids;
  }
  function validateProgress(value, topics) {
    if (!value || value.schema_version !== 1 || value.kind !== 'english-map-observations' || !value.records || typeof value.records !== 'object' || Array.isArray(value.records)) throw new Error('记录格式不匹配，请选择本地图导出的 JSON。');
    const known = new Set(topics.map(topic => topic.id));
    const records = {};
    for (const [id, row] of Object.entries(value.records)) {
      if (!known.has(id)) throw new Error('记录包含本地图中不存在的能力点。');
      if (!row || typeof row !== 'object' || !Object.hasOwn(statuses,row.status) || typeof row.note !== 'string' || row.note.length > 2000 || typeof row.updated_at !== 'string' || !Number.isFinite(Date.parse(row.updated_at))) throw new Error('记录中的状态、备注或日期有误，未导入任何内容。');
      records[id] = {status:row.status, note:row.note, updated_at:row.updated_at};
    }
    return records;
  }
  function snapshot(records) { return {schema_version:1,kind:'english-map-observations',records}; }
  return {statuses,nearby,validateProgress,snapshot};
});
