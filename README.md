# 英语成长地图 · Pre-A1 → B2

独立组织的儿童英语能力路径，覆盖 **Pre-A1、A1、A2、B1、B2**，默认突出孩子当前 **A1–A2 附近**。既能向前补基础，也能向后看成长目标。

背景为 Year 4，范围来自家长描述，尚未分项测评。Year 4 不等同于中国四年级，也不决定 CEFR 等级；听说读写可能不同步。所有能力初始均为「待确认」。

## 架构

**90 个能力点 · 113 条建议学习关系 · 5 阶段 × 6 领域**。每阶段每领域各 3 点，提供学习骨架，不声称穷尽各阶段课程内容。

| 领域 | Pre-A1 起点 | A1–A2 附近 | B1–B2 方向 |
| --- | --- | --- | --- |
| 听力 | 情境辨音、指令、简单信息 | 对话细节、顺序、故事、修正 | 主旨、观点、论证、多人信息整合 |
| 口语与语音 | 模仿、选择、熟悉问答 | 理解后跟读、追问、描述与故事 | 连贯叙述、协商、回应、语域 |
| 阅读 | 字母与声音、合音、图文匹配 | 解码与理解、细节、指代与推断 | 篇章、立场、论证与来源比较 |
| 写作 | 字词、标签、句框 | 句子、段落、留言、经历与故事 | 邮件、观点、报告、论证与修订 |
| 语法与句型 | 表达块、数量、所属与回应 | 基本句、时间、比较、计划 | 时间关系、条件、复杂句与谨慎判断 |
| 词汇与词块 | 实物连接、词群、礼貌需求 | 搭配、感受、构词与改述 | 搭配迁移、近义辨析、精确性与语域 |

每点都有能力说明、观察标准、原创任务、成人参考要点、换情境任务、练习方法、来源和建议前置。关系均为 soft，可并行学习，不设升级期限或固定词量门槛。

## 打开与使用

无需安装依赖。在仓库根目录运行：

```sh
python3 -m http.server 8000
```

打开 `http://localhost:8000/`。页面同源读取数据，不能直接双击 HTML 使用。

1. 默认「孩子附近 · A1–A2」，切换「全路径」查看 Pre-A1 到 B2，也可单选阶段、筛选领域或搜索。
2. 点能力点查看任务；「选中点附近」显示前置两层、后续一层和跨领域支持。详情中的按钮提供相同的关系访问。
3. 先观察听说读写，再按表现检查基础。跟读采用「听懂—模仿—撤去示范—换内容说」，流利跟读不能替代理解与自主表达。
4. 写下材料、提示程度与表现，再换材料、隔日复核。尤其 B1/B2 微型任务应补充更长、更多样材料与教师观察。

听力提供成人朗读脚本，听时不给孩子看。设备语音仅作练习示范，质量依赖系统；没有口语自动评分或正式 CEFR 判级。

## 观察记录

状态为待确认、需要帮助、本次能独立完成、待复核。完成一项不会自动勾选其他节点。

记录仅保存于当前浏览器，不上传 GitHub 或服务器。可导出 JSON 备份和跨设备导入；导入先完整校验再合并，同节点保留较新记录。更换地址、浏览器或清除站点数据前请先导出。可单独清除某项记录。

## 文档与检查

- [架构与数据格式](ARCHITECTURE.md)
- [学习与观察指南](LEARNING-GUIDE.md)
- [改动记录](CHANGELOG.md)
- [能力点](data/topics.json)、[关系](data/dependencies.json)、[范围和来源](data/profile.json)

```sh
node tests/test_english_map.js
node --check app.js
node --check model.js
```

检查节点完整性、阶段领域分布、无环衔接、来源、记录校验、不推断其他能力掌握，以及旧教材和其他学科模块的移除。

## 来源与许可

结构借鉴 [xiaoyang111222/cn-math-taxonomy](https://github.com/xiaoyang111222/cn-math-taxonomy)，保留 Fork 关系与历史。当前工作树已移除原数学、人教版英语、题库、诊断页面、课标映射、旧截图、生成脚本与原作者部署配置，仅保留本版英语架构和必要图形库。

参考范围：[Pre A1 Starters](https://www.cambridgeenglish.org/exams-and-tests/starters/)、[A1 Movers](https://www.cambridgeenglish.org/exams-and-tests/movers/)、[A2 Flyers](https://www.cambridgeenglish.org/exams-and-tests/flyers/)、[B1 Preliminary for Schools](https://www.cambridgeenglish.org/exams-and-tests/preliminary-for-schools/)、[B2 First for Schools](https://www.cambridgeenglish.org/exams-and-tests/first-for-schools/)、[British Council 儿童口语建议](https://www.britishcouncil.org/voices-magazine/how-help-children-speak-english-confidence)。

节点、阶段对应、顺序与任务为本版教学设计推断，未经教师或测评校准，不是官方 CEFR 逐项课程表。不能用单次任务推断等级、考试通过率或整个领域的掌握。任务为本版原创。

沿用 [CC BY-NC 4.0](LICENSE)，图形库保留各自 MIT 许可，见 [依赖说明](assets/vendor/VENDOR.md)。
