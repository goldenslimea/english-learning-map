# 架构与数据格式

## 文件

```text
index.html          单页入口
style.css           桌面、手机、系统主题样式
app.js              路线、关系图、任务与记录交互
model.js            局部关系遍历与记录校验
data/topics.json    90 个能力点
data/dependencies.json 113 条建议衔接
data/profile.json   阶段、领域、当前范围和来源
tests/test_english_map.js 数据与行为检查
assets/vendor/      必要图形库与原许可
```

纯静态，无后端、账号系统、分析埋点或第三方 CDN。数据通过同源 fetch 加载。原版其他学科、教材页、课标、题库及诊断引擎均已移除。

## 节点

每阶段每领域各 3 点，共 90 点。`level` 是 Pre-A1 / A1 / A2 / B1 / B2；`alignment` 恒为 inferred，表示教学范围推断。ID 不代表中国教材年级。

| 字段 | 用途 |
| --- | --- |
| id / name / domain | 稳定编号、名称与领域 |
| level / order | 推断阶段和同阶段内的建议顺序 |
| phase | 相对当前范围的显示分组：foundation / bridge / next |
| description / mastery_criteria | 能力说明和成人观察标准 |
| diagnostic_question | question、answer、transfer、mode；听力可含 script |
| practice / source_ids | 练习方式与 profile.sources 引用 |
| initial_status | 恒为 unknown，不预填掌握 |

字段概念借鉴上游结构，界面称「观察标准」「试一试」；字段名不表示一次任务可以证明稳定掌握。没有上游教材节点编号或课标映射。

## 衔接与界面

关系为 `{topicId, prerequisiteId, strength, reason}`，即前者依赖后者；箭头从 prerequisiteId 指向 topicId。全部 soft，不锁课，不把语法当开始听说的必要门槛。每领域有连续的五阶段建议链，另有跨领域支持关系。

界面有「开始练习」「学习全图」两个入口，共享同一选中能力与一份任务、记录表，没有复制数据。日常练习先选领域，再选附近的小目标；完整图、搜索与范围筛选仅在学习全图中展示。脚本、观察要点、换情境任务、练习方法、前后能力和来源均可按需展开，导入导出收在右上角观察记录内。

阶段路线按范围和领域筛选，默认 A1–A2。局部图显示前置两层与后续一层；详情按钮给出全部直接前后关系，不依赖画布操作。选到当前范围外的关系点时切换相应阶段，练习选择器也包含该阶段；回到日常练习保留当前能力。记录存储键、状态含义和导出格式未改变。

## 观察记录

localStorage key 为 `youngEnglishMap.observations.v1`，不含姓名或自动推断等级，只保存每项最新快照。需要历史比较时保留不同日期导出的备份。

```json
{
  "schema_version": 1,
  "kind": "english-map-observations",
  "records": {
    "ye_s02": {
      "status": "revisit",
      "note": "示例：需换材料复核，非实际测评。",
      "updated_at": "2026-10-21T12:00:00Z"
    }
  }
}
```

状态为 unknown / emerging / independent / revisit。independent 在界面中是「本次能独立完成」，不推断其他节点或稳定掌握。导入限制 500 KB、备注 2000 字符；全部校验节点、状态、日期与版本后合并，同项取较新记录，不部分导入。保存失败提示导出。

profile 数据版本为 2，观察文件版本仍为 1，已有 A1–A2 记录可继续导入。具体阶段归属和关系未经教学数据校准。
