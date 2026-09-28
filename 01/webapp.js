// @ts-nocheck
/* 前端全局脚本层：按字节精确迁移自 JS（见 app/TypeScript迁移说明.md），
   本文件关闭逐行类型检查；环境与第三方库声明见 ambient.d.ts。 */
/* ==================================================================
   供应商与模型内置数据（URL 不展示；ID 全小写；显示名保留官方大小写）
   来源：各官网文档（2026-09 核对）
================================================================== */
const PROVIDERS = [
    {
        id: 'deepseek', name: 'DeepSeek',
        url: 'https://api.deepseek.com',
        webSearch: false, webNoteZh: '该供应商 API 未提供内置联网搜索',
        webNoteEn: 'No built-in web search in this provider API',
        models: [
            { id: 'deepseek-v4-flash', name: 'DeepSeek-V4-Flash', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 384000, vision: false },
            { id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro', ctx: '1M', ctxTokens: 1000000, maxOutTokens: null, vision: false },
            { id: 'deepseek-v4-flash-vision-exp', name: 'DeepSeek-V4-Flash-Vision-Exp', ctx: '1M', ctxTokens: 1000000, maxOutTokens: null, vision: true }
        ]
    },
    {
        id: 'zhipu', name: '智谱.ai',
        url: 'https://open.bigmodel.cn/api/paas/v4',
        webSearch: true,
        models: [
            { id: 'glm-5.3-flash', name: 'GLM-5.3-Flash', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 131072, vision: false },
            { id: 'glm-5.3', name: 'GLM-5.3', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 131072, vision: false },
            { id: 'glm-5.2', name: 'GLM-5.2', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 131072, vision: false },
            { id: 'glm-5.1', name: 'GLM-5.1', ctx: '200K', ctxTokens: 200000, maxOutTokens: 131072, vision: false }
        ]
    },
    {
        id: 'bailian', name: '阿里云百炼',
        url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        webSearch: true,
        models: [
            { id: 'qwen3.8-max', name: 'Qwen3.8-Max', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 131072, vision: true },
            { id: 'qwen3.8-flash', name: 'Qwen3.8-Flash', ctx: '1M', ctxTokens: 1000000, maxOutTokens: null, vision: true },
            { id: 'qwen3.7-max', name: 'Qwen3.7-Max', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 65536, vision: false },
            { id: 'qwen3.7-plus', name: 'Qwen3.7-Plus', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 65536, vision: true },
            { id: 'kimi-k3', name: 'Kimi-K3', ctx: '1M', ctxTokens: 1048576, maxOutTokens: 1048576, vision: true, web: false },
            { id: 'glm-5.3-flash', name: 'GLM-5.3-Flash', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 131072, vision: false, web: false },
            { id: 'glm-5.3', name: 'GLM-5.3', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 131072, vision: false, web: false },
            { id: 'glm-5.2', name: 'GLM-5.2', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 131072, vision: false, web: false }
        ]
    },
    {
        id: 'tokenplan', name: '千问 Token Plan',
        url: 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
        webSearch: true,
        models: [
            { id: 'qwen3.8-max', name: 'Qwen3.8-Max', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 131072, vision: true },
            { id: 'qwen3.8-flash', name: 'Qwen3.8-Flash', ctx: '1M', ctxTokens: 1000000, maxOutTokens: null, vision: true },
            { id: 'qwen3.7-max', name: 'Qwen3.7-Max', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 65536, vision: false },
            { id: 'qwen3.7-plus', name: 'Qwen3.7-Plus', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 65536, vision: true },
            { id: 'qwen3.6-flash', name: 'Qwen3.6-Flash', ctx: '1M', ctxTokens: 1000000, maxOutTokens: null, vision: true },
            { id: 'glm-5.2', name: 'GLM-5.2', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 131072, vision: false },
            { id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro', ctx: '1M', ctxTokens: 1000000, maxOutTokens: null, vision: false },
            { id: 'deepseek-v4-pro-0813', name: 'DeepSeek-V4-Pro-0813', ctx: '1M', ctxTokens: 1000000, maxOutTokens: null, vision: false },
            { id: 'deepseek-v4-flash-0731', name: 'DeepSeek-V4-Flash-0731', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 384000, vision: false }
        ]
    },
    {
        id: 'ark', name: '火山方舟',
        url: 'https://ark.cn-beijing.volces.com/api/v3',
        webSearch: true,
        models: [
            { id: 'doubao-seed-evolving', name: 'Doubao-Seed-Evolving', ctx: '1024K', ctxTokens: 1024000, maxOutTokens: 256000, vision: true },
            { id: 'doubao-seed-2-1-pro-260628', name: 'Doubao-Seed-2.1-Pro', ctx: '256K', ctxTokens: 256000, maxOutTokens: 256000, vision: true },
            { id: 'doubao-seed-2-1-turbo-260628', name: 'Doubao-Seed-2.1-Turbo', ctx: '256K', ctxTokens: 256000, maxOutTokens: 256000, vision: true },
            { id: 'doubao-seed-2-0-lite-260428', name: 'Doubao-Seed-2.0-Lite', ctx: '256K', ctxTokens: 256000, maxOutTokens: 128000, vision: true }
        ]
    },
    {
        id: 'openrouter', name: 'OpenRouter',
        url: 'https://openrouter.ai/api/v1',
        webSearch: true,
        models: [
            { id: 'openrouter/auto', name: 'OpenRouter-Auto', ctx: '2M', ctxTokens: 2000000, maxOutTokens: null, vision: false },
            { id: 'openai/gpt-5.5', name: 'GPT-5.5', ctx: 'Auto', ctxTokens: null, maxOutTokens: null, vision: true },
            { id: 'openai/gpt-5.4-mini', name: 'GPT-5.4-Mini', ctx: '1M', ctxTokens: 1000000, maxOutTokens: null, vision: true },
            { id: 'anthropic/claude-opus-5', name: 'Claude-Opus-5', ctx: 'Auto', ctxTokens: null, maxOutTokens: null, vision: true },
            { id: 'anthropic/claude-sonnet-4-6', name: 'Claude-Sonnet-4.6', ctx: 'Auto', ctxTokens: null, maxOutTokens: null, vision: true },
            { id: 'google/gemini-3.1-pro', name: 'Gemini-3.1-Pro', ctx: '2M', ctxTokens: 2000000, maxOutTokens: null, vision: true },
            { id: 'google/gemini-3.5-flash', name: 'Gemini-3.5-Flash', ctx: 'Auto', ctxTokens: null, maxOutTokens: null, vision: true },
            { id: 'x-ai/grok-4.2', name: 'Grok-4.2', ctx: 'Auto', ctxTokens: null, maxOutTokens: null, vision: true },
            { id: 'meta/muse-spark-1.2', name: 'Muse-Spark-1.2', ctx: '1M', ctxTokens: 1000000, maxOutTokens: null, vision: true },
            { id: 'deepseek/deepseek-v4-pro', name: 'DeepSeek-V4-Pro', ctx: '1M', ctxTokens: 1000000, maxOutTokens: null, vision: false },
            { id: 'deepseek/deepseek-v4-flash', name: 'DeepSeek-V4-Flash', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 384000, vision: false },
            { id: 'z-ai/glm-5.2', name: 'GLM-5.2', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 131072, vision: false },
            { id: 'z-ai/glm-5.1', name: 'GLM-5.1', ctx: '200K', ctxTokens: 200000, maxOutTokens: 131072, vision: false },
            { id: 'qwen/qwen3.8-max', name: 'Qwen3.8-Max', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 131072, vision: true },
            { id: 'qwen/qwen3.7-plus', name: 'Qwen3.7-Plus', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 65536, vision: true },
            { id: 'moonshotai/kimi-k3', name: 'Kimi-K3', ctx: '1M', ctxTokens: 1048576, maxOutTokens: 1048576, vision: true },
            { id: 'moonshotai/kimi-k2.6', name: 'Kimi-K2.6', ctx: 'Auto', ctxTokens: null, maxOutTokens: null, vision: false },
            { id: 'minimax/minimax-m3:free', name: 'MiniMax-M3-Free', ctx: '1.05M', ctxTokens: 1050000, maxOutTokens: null, vision: true }
        ]
    },
    {
        id: 'zen', name: 'OpenCode Zen',
        url: 'https://opencode.ai/zen/v1',
        webSearch: false, webNoteZh: '该供应商未提供内置联网搜索',
        webNoteEn: 'No built-in web search in this provider',
        models: [
            { id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro', ctx: '1M', ctxTokens: 1000000, maxOutTokens: null, vision: false },
            { id: 'deepseek-v4-flash', name: 'DeepSeek-V4-Flash', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 384000, vision: false },
            { id: 'deepseek-v4-flash-free', name: 'DeepSeek-V4-Flash-Free', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 384000, vision: false },
            { id: 'glm-5.2', name: 'GLM-5.2', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 131072, vision: false },
            { id: 'glm-5.1', name: 'GLM-5.1', ctx: '200K', ctxTokens: 200000, maxOutTokens: 131072, vision: false },
            { id: 'glm-5', name: 'GLM-5', ctx: '200K', ctxTokens: 200000, maxOutTokens: 131072, vision: false },
            { id: 'kimi-k2.6', name: 'Kimi-K2.6', ctx: 'Auto', ctxTokens: null, maxOutTokens: null, vision: false },
            { id: 'kimi-k2.5', name: 'Kimi-K2.5', ctx: 'Auto', ctxTokens: null, maxOutTokens: null, vision: false },
            { id: 'minimax-m2.7', name: 'MiniMax-M2.7', ctx: 'Auto', ctxTokens: null, maxOutTokens: null, vision: false },
            { id: 'minimax-m3-free', name: 'MiniMax-M3-Free', ctx: '1.05M', ctxTokens: 1050000, maxOutTokens: null, vision: true },
            { id: 'qwen3.6-plus-free', name: 'Qwen3.6-Plus-Free', ctx: 'Auto', ctxTokens: null, maxOutTokens: null, vision: true },
            { id: 'mimo-v2.5-free', name: 'MiMo-V2.5-Free', ctx: 'Auto', ctxTokens: null, maxOutTokens: null, vision: false },
            { id: 'nemotron-3-ultra-free', name: 'Nemotron-3-Ultra-Free', ctx: '1M', ctxTokens: 1000000, maxOutTokens: null, vision: false },
            { id: 'grok-build-0.1', name: 'Grok-Build-0.1', ctx: 'Auto', ctxTokens: null, maxOutTokens: null, vision: false }
        ]
    },
    {
        id: 'go', name: 'OpenCode Go',
        url: 'https://opencode.ai/zen/go/v1',
        webSearch: false, webNoteZh: '该供应商未提供内置联网搜索；MiniMax/Qwen 系列走 Anthropic 端点，暂未收录',
        webNoteEn: 'No built-in web search; MiniMax/Qwen models use the Anthropic endpoint and are not listed',
        models: [
            { id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro', ctx: '1M', ctxTokens: 1000000, maxOutTokens: null, vision: false },
            { id: 'deepseek-v4-flash', name: 'DeepSeek-V4-Flash', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 384000, vision: false },
            { id: 'glm-5.2', name: 'GLM-5.2', ctx: '1M', ctxTokens: 1000000, maxOutTokens: 131072, vision: false },
            { id: 'glm-5.1', name: 'GLM-5.1', ctx: '200K', ctxTokens: 200000, maxOutTokens: 131072, vision: false },
            { id: 'glm-5', name: 'GLM-5', ctx: '200K', ctxTokens: 200000, maxOutTokens: 131072, vision: false },
            { id: 'kimi-k2.7-code', name: 'Kimi-K2.7-Code', ctx: '256K', ctxTokens: 262000, maxOutTokens: null, vision: true },
            { id: 'kimi-k2.6', name: 'Kimi-K2.6', ctx: 'Auto', ctxTokens: null, maxOutTokens: null, vision: false },
            { id: 'kimi-k2.5', name: 'Kimi-K2.5', ctx: 'Auto', ctxTokens: null, maxOutTokens: null, vision: false },
            { id: 'mimo-v2.5', name: 'MiMo-V2.5', ctx: 'Auto', ctxTokens: null, maxOutTokens: null, vision: false },
            { id: 'mimo-v2.5-pro', name: 'MiMo-V2.5-Pro', ctx: 'Auto', ctxTokens: null, maxOutTokens: null, vision: false }
        ]
    }
];
/* ============ i18n ============ */
const i18n = {
    zh: {
        conversations: '对话列表', newChat: '新建对话', activeContext: '当前上下文',
        references: '参考文献', attachPaper: '上传论文', activeRef: '当前参考文献',
        refDesc: '完全基于注意力机制的革命性网络架构，彻底摒弃了循环与卷积结构。',
        keyFindings: '核心发现与架构',
        bullet1: '自注意力机制使模型能够关联句中任意距离的词语。',
        bullet2: '多头注意力可从不同表示子空间联合关注信息。',
        bullet3: '与循环神经网络相比，显著缩短训练时间。',
        themeLabel: '主题', optSystem: '跟随系统', optLight: '亮色', optDark: '暗色', langLabel: '语言',
        optModernMinimal: '现代简约', optInkGreen: '只此青绿', optCinnabar: '水墨江南', optSkySea: '天空与海', optNostalgia: '城南旧事', optGlass: '万山红遍',
        optSnowMoon: '风花雪月', optPeachGrove: '桃林', optYanyun: '燕云十六声',
        optWhiteSnake: '白蛇缘起', optOfficeDaily: '办公日常', optQqClassic: '经典QQ',
        modelSettings: '模型配置', provider: '供应商', model: '模型', pickModel: '选择模型',
        keyLocalNote: '仅保存在本地浏览器', context: '上下文窗口', vision: '视觉理解',
        supported: '支持', notSupported: '不支持', webSearch: '联网搜索',
        pickProvider: '选择供应商', custom: '自定义',
        customIdPh: '模型 ID（小写，例如 my-model）', customNamePh: '显示名称（例如 My Model）',
        webOn: '开启（内置）', webModelOff: '该模型不支持联网搜索',
        maxIn: '最大输入', maxOut: '最大输出',
        maxInPh: '留空默认取模型最大上下文', maxOutPh: '留空默认取模型最大输出',
        advanced: '高级参数（可选）', tempPlaceholder: '留空使用官方推荐',
        advancedHint: '其余参数（top_p、思考模式等）将自动采用各官网推荐配置。',
        cancel: '取消', addModel: '添加模型', selectModel: '选择模型', addModelHint: '＋ 前往设置添加模型',
        listening: '正在聆听……', askPlaceholder: '询问研究方法、数学边界或核心发现……',
        newConvName: '新对话', toastAdded: '模型已添加', toastNoModel: '请先在设置中添加模型',
        demoConvTitle: '注意力机制对比',
        demoUserText: 'Vaswani 等人提出的注意力机制，在数学上与 BERT 的双向编码器注意力有何不同？',
        demoAiText: '从数学上看，Vaswani 等人（Transformer）与 BERT 使用的是完全相同的多头自注意力形式，都基于缩放点积注意力；差异在于架构上的掩码与信息流向，而非注意力公式本身。Vaswani 的标准解码器采用因果掩码以防止关注未来 token，而 BERT 使用无因果约束的全双向编码器注意力，可以在所有层中同时从左右两侧获取上下文。',
        errPick: '请选择供应商、模型并填写 API Key', errCustom: '请填写自定义模型 ID',
        copy: '复制', del: '删除', copied: '已复制',
        voice: '语音', send: '发送',
        polish: '润色', polished: '提示词已润色（演示）', polishEmpty: '请先输入提示词',
        polishResult: (m, text) => `请以学术、严谨且结构化的方式回答以下问题，给出关键步骤、数学依据与参考文献：\n\n${text}`,
        hiTitle: '你好，欢迎 👋', hiSub: '告诉我们你的需求，其余交给我们。',
        cardRole: '科研助手', cardDesc: '帮助管理科研工作流，解析论文并最大化阅读效率。',
        task1: '解析论文方法', task2: '对比模型架构', task3: '生成参考文献',
        tasks: '任务', viewAll: '查看全部',
        suggestTitle: '注意力机制与 RNN 的核心区别是什么？', suggestLabel: '建议提示词',
        pill1: '上传文件', pill2: '润色提示词', pill3: '模型配置', pill4: '研究笔记', comingSoon: '敬请期待',
        createProject: '创建项目', projectsLabel: '项目', newProjectTitle: '创建项目',
        projectName: '项目名称', projectNamePh: '例如：注意力机制研究',
        importHint: '点击选择文件，支持 PDF、Word、Markdown 等', filesLabel: '项目论文',
        errProjectName: '请填写项目名称', projectCreated: '项目已创建', newConvFor: '新建对话',
        saved: '已收藏', today: '今天', yesterday: '昨天', earlier: '更早',
        rename: '重命名', deleteConv: '删除对话', upgrade: '升级 Pro',
        searchPh: '搜索对话与项目', starAdd: '收藏', starRemove: '取消收藏',
        regenerate: '重新生成', moreDetail: '更详细', moreConcise: '更简洁',
        pin: '置顶', unpin: '取消置顶', pinnedGroup: '置顶',
        exportPdf: '导出 PDF', exportMd: '导出 Markdown', exported: '已导出',
        delConvConfirm: '确认删除该对话？此操作不可撤销。',
        delMsgConfirm: '确认删除这条消息及其回复？',
        delProjConfirm: '确认删除该项目？项目内的对话将一并删除。',
        confirmDelete: '删除',
        skillsPlugins: '技能与插件', mcpConnector: 'MCP 与连接器', notebook: '笔记本', run: '运行',
        papers: '论文', database: '数据库',
        papersDb: '知识和数据库', imported: '本地导入', addDb: '添加数据库', dbNamePh: '数据库名称',
        importPaper: '导入文件',
        kb: '知识库', kbLib: '知识库', createKb: '创建知识库', kbNamePh: '输入知识库名称',
        dbSub: '连接数据源，随时查询与分析',
        kbSub1: '构建 AI-Native 知识库', kbSub2: 'AI 智能体随时调用',
        kbCount: (n) => `${n} 个知识`, updatedAtAt: (d) => `更新于 ${d}`, allWs: '全部工作区生效',
        addKnowledge: '添加知识', searchKnowledge: '搜索知识', importFromKb: '从知识库导入',
        chooseFiles: '选择文件', dropHint: '点击选择或拖拽文件到此处，支持 PDF、Word、Markdown、表格与图片', added: '添加', quickSum: '详细总结文档内容', quickPpt: '生成 PPT', quickMind: '生成脑图', fileCardRemove: '移除', thinkingText: '正在思考…', thoughtDone: '已深度思考',
        pickKbFile: '选择知识库文件', kbFilesChosen: (n) => `已选 ${n} 个文件`, kbEmpty: '暂无知识库，先创建一个吧。',
        pickFolder: '文件夹', pickFolderFirst: '请先在左侧选择文件夹，再选择文件', clearAll: '全部清除', dragSelectHint: '支持 Ctrl 加选、Shift 范围选、拖拽框选',
        demoFileTip: '演示文件暂无内容。在该知识库中通过"添加知识"上传文件后，即可完整预览与阅读。',
        readerZoomIn: '放大', readerZoomOut: '缩小', readerSearch: '在文档中检索', readerToc: '目录',
        readerHighlight: '高亮', readerFull: '全屏', readerExit: '退出阅读', readerPageTitle: '阅读器',
        readerNoResult: '未找到结果', tocTitle: '目录', highlightHint: '选中文本进行高亮标注', delHighlight: '删除高亮',
        readerErr: '阅读器组件加载失败，请检查网络后重试。',
        docParsing: '正在解析文档……', docCtxOn: (n) => `已将《${n}》设为对话上下文`,
        notifyDone: 'AI 回复已完成', notifyFail: 'AI 回复失败', backendErr: '后端服务不可用，已回退演示模式。',
        docReply: (m, f, c) => `已读取《${f}》全文（约 ${c} 字）并设为本轮对话上下文。当前为本地演示模式（${m.name} · ${m.provider}）。基于该文档，我可以回答其结构、方法、公式与实验结论等问题；接入真实 API 后，此处将由模型基于检索到的文档片段生成带引用的回答。`,
        docReplyMore: (m, f) => `继续基于《${f}》的上下文回答。当前为本地演示模式（${m.name}），文档上下文在本会话的多轮对话中持续生效，无需重复上传。`,
        ctxPanel: '上下文资料', ctxProjFiles: '项目文件', kbLib: '知识库', ctxEmpty: '暂无资料，可从项目、知识库或数据库中添加。',
        kbFilesEmpty: '暂无知识，可从知识库导入。',
        ctxProjEmpty: '暂无项目文件，可点击右上角 + 导入。', ctxLibEmpty: '暂无知识文件，可点击右上角 + 从知识库导入。', ctxDbEmpty: '暂无数据库，可点击右上角 + 前往添加。',
        wsFileMeta: '工作区', readEmptyTip: '针对本文的讨论从这里开始，在下方输入框提问即可。',
        ctxDelConfirm: (n) => `确认删除「${n}」？此操作不可撤销。`, toastNeedProject: '请先创建项目',
        pickLib: '从知识库导入', pickDbs: '连接数据库',
        ctxContexts: '上下文',
        workNewTask: '新建任务',
        workNeedsWorkspace: 'Work 模式需要先选择工作区，已为你切换到 Chat 模式',
        workTitle: '科研工作台已就绪', workSub: '搭建智能体、连接工具，在沙箱里跑通你的实验。',
        workRole: '科研智能体', workDesc: '可自主检索文献、执行代码、分析数据并记录实验，每一步轨迹可追溯。',
        wtask1: '复现论文里的核心实验', wtask2: '检索并精读一篇 arXiv 论文', wtask3: '分析训练日志并画出 loss 曲线',
        wsuggest: '在沙箱里复现一个最小可用的多头注意力模块，并对比不同头数下的参数量。',
        workModuleMissing: 'Work 模块未加载',
        workModuleMissingHint: '当前打开的是未构建的源文件。请通过 app/start.bat 运行构建版本（或先执行 node app/build.js）。',
        workPageFailed: '页面构建失败',
        back: '返回', saved2: '已保存',
        settingsTitle: '设置',
        groupGeneral: '通用', groupModel: '模型', groupWork: '墨道 · Work', groupKnowledge: '知识与扩展',
        personalSettings: '个人设置',
        settingsAvatar: '头像', settingsAvatarBtn: '更换头像', settingsName: '昵称', settingsEmail: '邮箱',
        settingsSaveBtn: '保存', settingsNamePh: '输入昵称', settingsEmailPh: 'name@example.com',
        settingsPersonalDesc: '头像、昵称与语言偏好',
        settingsModelsDesc: '添加与管理模型接入；API Key 仅保存在本地',
        /* 个人资料页（2026-09-16 按设计图重构） */
        profilePlanFree: '免费版',
        profileEdit: '编辑', profileEditTitle: '编辑资料', profileShare: '分享', profileWall: '成就墙',
        profileShared: '档案已复制', profileWallSoon: '成就墙筹备中',
        profileNameLabel: '名称', profileSignatureLabel: '签名', profileSignaturePh: '一句话介绍自己',
        profileUidLabel: '账号 ID', profileNameBad: '名称不能为空',
        profileEmailBad: '邮箱格式不正确', profileUidBad: '账号 ID 仅允许字母、数字、- 与 _（4–24 位）',
        profileAccountGroup: '账户与订阅', profilePlanLabel: '当前计划', profilePlanHint: '当前账户的订阅套餐',
        profileSignOut: '退出登录', profileSignOutHint: '清除本机档案信息；本地任务与设置不会被删除。',
        profileSignOutConfirm: '退出登录将清除本机档案信息（名称 / 邮箱 / 签名 / 头像），本地任务、项目与设置不会被删除。确认退出？',
        profileSignedOut: '已退出登录',
        profileStatConvs: '会话', profileStatProjects: '项目', profileStatKbs: '知识库', profileStatMsgs: '消息',
        groupBehavior: '智能体行为', groupWorkspace: '工作区',
        settingsHooks: '钩子', settingsMemory: '记忆', settingsComputer: '电脑操控',
        settingsGit: 'Git', settingsWorktrees: 'Worktrees', settingsAppearance: '外观',
        /* 记忆（真实数据源：~/.qoder-cn） */
        settingsMemoryDesc: '查看和管理 Qoder 在本机保存的长期记忆。',
        memGroupBehavior: '记忆行为', memGlobal: '全局记忆',
        memGlobalHint: '开启后，Qoder 会在所有项目中读取和更新你的个人偏好、习惯和长期上下文；关闭后不会使用或更新全局记忆。',
        memProject: '项目记忆',
        memProjectHint: '开启后，Qoder 会按项目读取和更新代码库规则、经验和长期上下文；关闭后不会使用或更新任何项目记忆。',
        memGroupGlobal: '全局记忆', memGroupProject: '项目记忆',
        memFilesN: (n) => n + ' 个记忆文件',
        memUpdated: '更新于 ',
        memEmpty: '暂无记忆文件',
        memNoProjects: '暂无项目记忆',
        memLoadFail: '记忆加载失败',
        memDeleteConfirm: '确认删除该记忆？内容将移入系统临时目录（可手工找回）。',
        memDeleted: '记忆已移入系统临时目录',
        memOpenTip: '打开记忆文件夹',
        memDeleteTip: '删除该记忆',
        openFail: '打开失败',
        openNeedsDesktop: '请在桌面版应用中使用',
        /* 钩子（真实数据源：settings.json） */
        settingsHooksDesc: '查看本机用户级 settings.json 中声明的 Hooks。这里只反映磁盘配置，不代表 CLI 已加载或执行。',
        hooksSrcGroup: '配置来源', hooksUserFile: '用户级 settings.json',
        hooksCountN: (n) => 'Hook · ' + n,
        hooksWarn: 'Hooks 会在会话生命周期中自动执行，并可能访问本机文件或外部服务。请核对最近安装或修改的配置。',
        hooksConfiguredGroup: '已配置的 Hooks', hooksNoneTitle: '尚未配置用户级 Hooks',
        hooksNoneHint: 'settings.json 可读取，但其中没有用户级 Hooks。',
        hooksLoadFail: '钩子配置加载失败',
        hooksFileMissing: 'settings.json 不存在',
        /* 电脑操控（无设计图，保持原样） */
        settingsComputerDesc: '受控本机操作的权限策略',
        prefLocalNote: '本地配置 · 后端联动筹备中',
        prefOn: '开启', prefOff: '关闭',
        computerEnable: '启用电脑操控', computerMode: '授权模式',
        computerModeAsk: '每次询问', computerModeDanger: '危险操作确认', computerModeAuto: '自动执行',
        computerHint: '电脑操控能力本体筹备中；策略将随后端联动生效。',
        /* Git（按设计图还原） */
        gitBranchPrefix: '分支前缀', gitBranchPrefixHint: 'Qoder 新建分支时会预填此前缀。留空则不添加前缀。',
        gitForce: '始终强制推送', gitForceHint: 'Qoder 推送时将使用 --force-with-lease。它会改写远端分支历史，但会在远端已变化时拒绝覆盖。',
        gitCommitGroup: '提交信息', gitCommitInstr: '提交说明指令',
        gitCommitInstrHint: '添加到 AI 提交说明生成提示词中。',
        gitCommitInstrPh: '例如：使用 Conventional Commits，并用中文概括用户影响',
        /* Worktrees（偏好持久化 + 真实 git worktree list） */
        wtFetch: '创建前获取上游更新', wtFetchHint: '创建 Worktree 时，先获取上游更新。',
        wtAutoDel: '自动删除旧 Worktree', wtAutoDelHint: '建议大多数用户启用。仅当你希望自行管理旧 Worktree 和磁盘用量时关闭。',
        wtLimit: '自动删除数量限制', wtLimitHint: '超过数量后，会从最旧的 Worktree 开始自动清理。删除前会创建 Git 备份，因此被清理的 Worktree 应始终可以恢复。',
        wtCountN: (n) => n + ' 个',
        wtManagedGroup: '托管 Worktree', wtNone: '暂无托管 Worktree',
        wtNoneHint: '新建的 Worktree 会按原始仓库路径分组显示在这里。',
        wtRepoMissing: '尚未选择 Work 工作区；选择后此处显示该仓库的 Worktree。',
        wtNotRepo: '当前工作区不是 Git 仓库。',
        wtLoadFail: 'Worktree 加载失败',
        wtMain: '主工作树', wtDetached: '游离 HEAD',
        /* 外观（主题模式/主题卡/语言/字体/内容宽度均为真实功能） */
        apGroup: '界面样式', apMode: '主题模式', apModeHint: '控制转写时显示在屏幕右侧的界面样式。',
        apLight: '浅色', apDark: '暗色', apSystem: '跟随系统',
        apLang: '语言', apLangHint: '控制转写时显示在屏幕右侧的界面样式。',
        apLangZh: '简体中文', apLangEn: 'English',
        apFontStyle: '字体风格', apFontSans: '黑体', apFontKai: '楷体', apFontSong: '宋体', apFontXing: '行书', apFontMono: '等宽',
        apFontSize: '界面字号', apFontSizeHint: '五档缩放，拖动实时生效并自动保存。',
        apScale1: '小', apScale2: '较小', apScale3: '标准', apScale4: '较大', apScale5: '大',
        apWidth: '内容宽度', apWidthHint: '调整任务内容和输入区的最大宽度。',
        apWidthNarrow: '窄', apWidthStd: '标准', apWidthWide: '宽',
        prefsSaveFail: '保存失败',
        connected: '已连接', notConnected: '未连接', connect: '连接', add: '添加',
        replyDetail: (m) => `【详细模式 · ${m.name}】已收到您的问题。以下为更详尽的展开说明：首先，本条回复由本地演示逻辑生成，用于展示流式输出、复制、删除与重新生成等交互能力；其次，当前会话已绑定模型 ${m.name}（${m.provider}），上下文窗口 ${m.ctx}，联网搜索状态已随配置生效；最后，接入真实 API 后，此处将由模型按详细程度要求生成完整回答，包含逐步推理、示例与参考文献引用。`,
        replyConcise: (m) => `【简洁模式 · ${m.name}】已收到您的问题，演示回复已按要求精简。`,
        demoReply: (m) => `已收到您的问题。当前为本地演示模式，已选中 ${m.name}（${m.provider} · 上下文 ${m.ctx}）。接入真实 API 后，此回复将由模型生成。`,
        demoReplyNoModel: () => '已收到您的问题。当前尚未配置模型，请点击左下角设置 → 模型配置，选择供应商、模型并填写 API Key。'
    },
    en: {
        conversations: 'Conversations', newChat: 'New Chat', activeContext: 'Active Context',
        references: 'References', attachPaper: 'Attach Paper', activeRef: 'Active Reference',
        refDesc: 'A revolutionary network architecture based solely on attention mechanisms, eliminating recurrence and convolutions completely.',
        keyFindings: 'Key Findings & Architecture',
        bullet1: 'Self-Attention allows model to associate words regardless of their distance in a sentence.',
        bullet2: 'Multi-Head Attention enables joint attention to information from different representation subspaces.',
        bullet3: 'Reduces training times significantly compared to RNNs.',
        themeLabel: 'Theme', optSystem: 'System', optLight: 'Light', optDark: 'Dark', langLabel: 'Language',
        optModernMinimal: 'Modern Minimal', optInkGreen: 'Only Verdant', optCinnabar: 'Ink Jiangnan', optSkySea: 'Sky & Sea', optNostalgia: 'Nostalgia', optGlass: 'Crimson Peaks',
        optSnowMoon: 'Snow & Moon', optPeachGrove: 'Peach Grove', optYanyun: 'Where Winds Meet',
        optWhiteSnake: 'White Snake', optOfficeDaily: 'Office Daily', optQqClassic: 'QQ Classic',
        modelSettings: 'Model Settings', provider: 'Provider', model: 'Model', pickModel: 'Select a model',
        keyLocalNote: 'Stored locally in your browser only', context: 'Context window', vision: 'Vision',
        supported: 'Supported', notSupported: 'Not supported', webSearch: 'Web Search',
        pickProvider: 'Select provider', custom: 'Custom',
        customIdPh: 'Model ID (lowercase, e.g. my-model)', customNamePh: 'Display name (e.g. My Model)',
        webOn: 'On (built-in)', webModelOff: "This model doesn't support web search",
        maxIn: 'Max input', maxOut: 'Max output',
        maxInPh: 'Empty = model max context', maxOutPh: 'Empty = model max output',
        advanced: 'Advanced (optional)', tempPlaceholder: 'Empty = official default',
        advancedHint: 'Other parameters (top_p, thinking mode, etc.) follow each official recommended default.',
        cancel: 'Cancel', addModel: 'Add Model', selectModel: 'Select Model', addModelHint: '＋ Add a model in Settings',
        listening: 'Listening…', askPlaceholder: "Ask about methodologies, mathematical bounds, or key findings...",
        newConvName: 'New Chat', toastAdded: 'Model added', toastNoModel: 'Add a model in Settings first',
        demoConvTitle: 'Attention mechanism comparison',
        demoUserText: "How does the attention mechanism in Vaswani et al. differ mathematically from BERT's bidirectional encoder attention?",
        demoAiText: "Mathematically, both Vaswani et al. (Transformer) and BERT use the exact same Multi-Head Self-Attention formulation based on Scaled Dot-Product Attention. The difference lies in the architectural masking and flow rather than the attention equation itself. While Vaswani's standard decoder employs causal masking to prevent attending to future tokens, BERT utilizes a fully bidirectional encoder attention layer without causal constraints, allowing context retrieval from both left and right across all layers.",
        errPick: 'Please pick a provider, a model and fill in the API Key', errCustom: 'Please fill in the custom model ID',
        copy: 'Copy', del: 'Delete', copied: 'Copied',
        voice: 'Voice', send: 'Send',
        polish: 'Polish', polished: 'Prompt polished (demo)', polishEmpty: 'Type a prompt first',
        polishResult: (m, text) => `Answer the following in a rigorous, academic and structured way, with key steps, mathematical justification and references:\n\n${text}`,
        hiTitle: 'Hi, there 👋', hiSub: "Tell us what you need, and we'll handle the rest.",
        cardRole: 'Research Assistant', cardDesc: 'Designed to help manage research workflows and maximize reading efficiency.',
        task1: 'Summarize paper methods', task2: 'Compare model architectures', task3: 'Generate references',
        tasks: 'Tasks', viewAll: 'View All',
        suggestTitle: 'What are the key differences between attention mechanisms and RNNs?', suggestLabel: 'Suggested prompt',
        pill1: 'Upload file', pill2: 'Polish prompt', pill3: 'Model settings', pill4: 'Research notes', comingSoon: 'Coming soon',
        createProject: 'Create Project', projectsLabel: 'Projects', newProjectTitle: 'Create Project',
        projectName: 'Project name', projectNamePh: 'e.g. Attention Study',
        importHint: 'Click to select files — PDF, Word, Markdown and more', filesLabel: 'Project papers',
        errProjectName: 'Please enter a project name', projectCreated: 'Project created', newConvFor: 'New chat',
        saved: 'Saved', today: 'Today', yesterday: 'Yesterday', earlier: 'Earlier',
        rename: 'Rename', deleteConv: 'Delete chat', upgrade: 'Upgrade to Pro',
        searchPh: 'Search chats & projects', starAdd: 'Star', starRemove: 'Unstar',
        regenerate: 'Regenerate', moreDetail: 'More detailed', moreConcise: 'More concise',
        pin: 'Pin', unpin: 'Unpin', pinnedGroup: 'Pinned',
        exportPdf: 'Export PDF', exportMd: 'Export Markdown', exported: 'Exported',
        delConvConfirm: 'Delete this chat? This cannot be undone.',
        delMsgConfirm: 'Delete this message and its reply?',
        delProjConfirm: 'Delete this project? Its chats will be removed too.',
        confirmDelete: 'Delete',
        skillsPlugins: 'Skills & Plugins', mcpConnector: 'MCP & Connectors', notebook: 'Notebook', run: 'Run',
        papers: 'Papers', database: 'Database',
        papersDb: 'Knowledge & Database', imported: 'Local import', addDb: 'Add database', dbNamePh: 'Database name',
        importPaper: 'Import files',
        kb: 'Knowledge Base', kbLib: 'Knowledge Base', createKb: 'Create knowledge base', kbNamePh: 'Enter knowledge base name',
        dbSub: 'Connect data sources for instant query and analysis',
        kbSub1: 'Build an AI-Native knowledge base', kbSub2: 'Invoked by AI agents anytime',
        kbCount: (n) => `${n} item${n === 1 ? '' : 's'}`, updatedAtAt: (d) => `Updated ${d}`, allWs: 'Works in all workspaces',
        addKnowledge: 'Add knowledge', searchKnowledge: 'Search knowledge', importFromKb: 'Import from knowledge base',
        chooseFiles: 'Choose files', dropHint: 'Click to choose or drop files here — PDF, Word, Markdown, sheets and images', added: 'Add', quickSum: 'Summarize document', quickPpt: 'Generate PPT', quickMind: 'Generate mind map', fileCardRemove: 'Remove', thinkingText: 'Thinking…', thoughtDone: 'Thought for',
        pickKbFile: 'Select knowledge files', kbFilesChosen: (n) => `${n} file${n === 1 ? '' : 's'} selected`, kbEmpty: 'No knowledge base yet — create one.',
        pickFolder: 'Folders', pickFolderFirst: 'Select a folder on the left first, then pick files', clearAll: 'Clear all', dragSelectHint: 'Ctrl multi-select, Shift range, drag rubber-band',
        demoFileTip: 'Demo file has no content. Upload the file via "Add knowledge" in this knowledge base to preview and read it.',
        readerZoomIn: 'Zoom in', readerZoomOut: 'Zoom out', readerSearch: 'Search in document', readerToc: 'Outline',
        readerHighlight: 'Highlight', readerFull: 'Fullscreen', readerExit: 'Exit reading', readerPageTitle: 'Reader',
        readerNoResult: 'No matches', tocTitle: 'Outline', highlightHint: 'Select text to highlight', delHighlight: 'Remove highlight',
        readerErr: 'Reader components failed to load. Check your network and retry.',
        notifyDone: 'AI reply ready', notifyFail: 'AI reply failed', backendErr: 'Backend unavailable, fell back to demo mode.',
        docReply: (m, f, c) => `Read the full text of "${f}" (~${c} chars) and set it as the conversation context. Local demo mode (${m.name} · ${m.provider}). Once a real API is connected, answers will be generated from retrieved document fragments with citations.`,
        docReplyMore: (m, f) => `Still answering with the context of "${f}". Local demo mode (${m.name}); the document context persists across turns in this session.`,
        ctxPanel: 'Context', ctxProjFiles: 'Files', kbLib: 'Knowledge Base', ctxEmpty: 'No files yet — add from a project, the knowledge base or databases.',
        kbFilesEmpty: 'No knowledge files yet — import from the knowledge base via the + button above.',
        ctxProjEmpty: 'No project files yet — import via the + button above.', ctxLibEmpty: 'No knowledge files yet — import via the + button above.', ctxDbEmpty: 'No databases yet — add via the + button above.',
        wsFileMeta: 'Workspace', readEmptyTip: 'Start the discussion about this document — ask in the box below.',
        ctxDelConfirm: (n) => `Delete "${n}"? This cannot be undone.`, toastNeedProject: 'Create a project first',
        pickLib: 'Import from knowledge base', pickDbs: 'Connect databases',
        ctxContexts: 'Context',
        workNewTask: 'New Task',
        workNeedsWorkspace: 'Work mode requires a workspace. Switched to Chat.',
        workTitle: 'Research workspace ready', workSub: 'Build agents, connect tools, and run your experiments in a sandbox.',
        workRole: 'Research Agent', workDesc: 'Autonomously searches literature, runs code, analyzes data and logs experiments — every step is traceable.',
        wtask1: 'Reproduce a core experiment from a paper', wtask2: 'Search and closely read an arXiv paper', wtask3: 'Analyze training logs and plot the loss curve',
        wsuggest: 'Reproduce a minimal multi-head attention module in the sandbox and compare parameter counts across head configurations.',
        workModuleMissing: 'Work module not loaded',
        workModuleMissingHint: 'You are viewing the unbuilt source file. Run the built version via app/start.bat (or run node app/build.js first).',
        workPageFailed: 'Page failed to build',
        back: 'Back', saved2: 'Saved',
        settingsTitle: 'Settings',
        groupGeneral: 'General', groupModel: 'Model', groupWork: 'Modao · Work', groupKnowledge: 'Knowledge & Extensions',
        personalSettings: 'Personal',
        settingsAvatar: 'Avatar', settingsAvatarBtn: 'Change avatar', settingsName: 'Display name', settingsEmail: 'Email',
        settingsSaveBtn: 'Save', settingsNamePh: 'Enter a display name', settingsEmailPh: 'name@example.com',
        settingsPersonalDesc: 'Avatar, display name and language',
        settingsModelsDesc: 'Add and manage model access; API keys stay local',
        /* Profile page (rebuilt to the design 2026-09-16) */
        profilePlanFree: 'Free',
        profileEdit: 'Edit', profileEditTitle: 'Edit profile', profileShare: 'Share', profileWall: 'Achievements',
        profileShared: 'Profile copied', profileWallSoon: 'Achievements coming soon',
        profileNameLabel: 'Name', profileSignatureLabel: 'Signature', profileSignaturePh: 'Say something about yourself',
        profileUidLabel: 'Account ID', profileNameBad: 'Name cannot be empty',
        profileEmailBad: 'Invalid email address', profileUidBad: 'Account ID allows letters, digits, - and _ only (4-24)',
        profileAccountGroup: 'Account & Subscription', profilePlanLabel: 'Current plan', profilePlanHint: 'Subscription plan of this account',
        profileSignOut: 'Sign out', profileSignOutHint: 'Clears local profile info; local tasks and settings are kept.',
        profileSignOutConfirm: 'Sign out clears local profile info (name / email / signature / avatar). Local tasks, projects and settings are kept. Sign out?',
        profileSignedOut: 'Signed out',
        profileStatConvs: 'Chats', profileStatProjects: 'Projects', profileStatKbs: 'Knowledge', profileStatMsgs: 'Messages',
        groupBehavior: 'Agent Behavior', groupWorkspace: 'Workspace',
        settingsHooks: 'Hooks', settingsMemory: 'Memory', settingsComputer: 'Computer Control',
        settingsGit: 'Git', settingsWorktrees: 'Worktrees', settingsAppearance: 'Appearance',
        /* Memory (real source: ~/.qoder-cn) */
        settingsMemoryDesc: 'View and manage the long-term memory Qoder keeps on this machine.',
        memGroupBehavior: 'Memory behavior', memGlobal: 'Global memory',
        memGlobalHint: 'When on, Qoder reads and updates your personal preferences, habits and long-term context across all projects; when off, global memory is neither used nor updated.',
        memProject: 'Project memory',
        memProjectHint: 'When on, Qoder reads and updates repo rules, experience and long-term context per project; when off, no project memory is used or updated.',
        memGroupGlobal: 'Global memory', memGroupProject: 'Project memory',
        memFilesN: (n) => n + (n === 1 ? ' memory file' : ' memory files'),
        memUpdated: 'updated ',
        memEmpty: 'No memory files',
        memNoProjects: 'No project memories',
        memLoadFail: 'Failed to load memories',
        memDeleteConfirm: 'Delete this memory? Content will be moved to the system temp folder (recoverable).',
        memDeleted: 'Memory moved to the system temp folder',
        memOpenTip: 'Open memory folder',
        memDeleteTip: 'Delete this memory',
        openFail: 'Failed to open',
        openNeedsDesktop: 'Available in the desktop app',
        /* Hooks (real source: settings.json) */
        settingsHooksDesc: 'Hooks declared in the local user-level settings.json. Reflects on-disk config only; does not imply the CLI has loaded or run them.',
        hooksSrcGroup: 'Config source', hooksUserFile: 'User-level settings.json',
        hooksCountN: (n) => 'Hook · ' + n,
        hooksWarn: 'Hooks run automatically during the session lifecycle and may access local files or external services. Review recently installed or modified config.',
        hooksConfiguredGroup: 'Configured Hooks', hooksNoneTitle: 'No user-level Hooks configured',
        hooksNoneHint: 'settings.json is readable but contains no user-level Hooks.',
        hooksLoadFail: 'Failed to load Hooks',
        hooksFileMissing: 'settings.json not found',
        /* Computer control (no design, kept as-is) */
        settingsComputerDesc: 'Permission policy for controlled computer use',
        prefLocalNote: 'Local config · backend wiring coming soon',
        prefOn: 'On', prefOff: 'Off',
        computerEnable: 'Enable computer use', computerMode: 'Authorization mode',
        computerModeAsk: 'Ask every time', computerModeDanger: 'Confirm risky actions', computerModeAuto: 'Automatic',
        computerHint: 'The computer-use capability is coming soon; the saved policy will apply once wired.',
        /* Git (per design) */
        gitBranchPrefix: 'Branch prefix', gitBranchPrefixHint: 'Pre-filled when Qoder creates a branch. Leave empty for no prefix.',
        gitForce: 'Always force push', gitForceHint: 'Qoder will push with --force-with-lease. It rewrites remote history but refuses to overwrite when the remote has changed.',
        gitCommitGroup: 'Commit message', gitCommitInstr: 'Commit instruction',
        gitCommitInstrHint: 'Appended to the AI commit-message prompt.',
        gitCommitInstrPh: 'e.g. use Conventional Commits and summarize user impact',
        /* Worktrees (prefs persisted + real git worktree list) */
        wtFetch: 'Fetch upstream before create', wtFetchHint: 'Fetch upstream updates when creating a Worktree.',
        wtAutoDel: 'Auto-delete old Worktrees', wtAutoDelHint: 'Recommended for most users. Turn off only if you manage old Worktrees and disk usage yourself.',
        wtLimit: 'Auto-delete count limit', wtLimitHint: 'Beyond the limit, the oldest Worktrees are cleaned up first. A Git backup is created before deletion, so cleaned Worktrees should always be recoverable.',
        wtCountN: (n) => n + '',
        wtManagedGroup: 'Managed Worktrees', wtNone: 'No managed Worktrees',
        wtNoneHint: 'New Worktrees are grouped here by original repository path.',
        wtRepoMissing: 'No Work workspace selected; pick one to list its Worktrees.',
        wtNotRepo: 'The current workspace is not a Git repository.',
        wtLoadFail: 'Failed to load Worktrees',
        wtMain: 'Main worktree', wtDetached: 'Detached HEAD',
        /* Appearance (theme mode/cards, language, font and width are real features) */
        apGroup: 'Interface style', apMode: 'Theme mode', apModeHint: 'Controls the interface style shown on the right side while transcribing.',
        apLight: 'Light', apDark: 'Dark', apSystem: 'System',
        apLang: 'Language', apLangHint: 'Controls the interface style shown on the right side while transcribing.',
        apLangZh: '简体中文', apLangEn: 'English',
        apFontStyle: 'Font style', apFontSans: 'Sans (Segoe UI)', apFontKai: 'Kaiti (Cambria)', apFontSong: 'Songti (Georgia)', apFontXing: 'Xingkai (Segoe Script)', apFontMono: 'Monospace (Cascadia)',
        apFontSize: 'Interface font size', apFontSizeHint: 'Five-step scale — applies live and persists automatically.',
        apScale1: 'Small', apScale2: 'Smaller', apScale3: 'Standard', apScale4: 'Larger', apScale5: 'Large',
        apWidth: 'Content width', apWidthHint: 'Adjust the max width of task content and the input area.',
        apWidthNarrow: 'Narrow', apWidthStd: 'Standard', apWidthWide: 'Wide',
        prefsSaveFail: 'Save failed',
        connected: 'Connected', notConnected: 'Not connected', connect: 'Connect', add: 'Add',
        replyDetail: (m) => `[Detailed mode · ${m.name}] Got your question. Here is a more detailed walkthrough: first, this reply is generated by the local demo logic to showcase streaming output, copy, delete and regenerate interactions; second, this conversation is bound to ${m.name} (${m.provider}) with a ${m.ctx} context window, and web-search state follows your configuration; finally, once a real API is connected, the model will produce the full detailed answer here, including step-by-step reasoning, examples and cited references.`,
        replyConcise: (m) => `[Concise mode · ${m.name}] Got your question — demo reply trimmed as requested.`,
        demoReply: (m) => `Got your question. This is a local demo without a backend; selected ${m.name} (${m.provider} · context ${m.ctx}). Once a real API is connected, this reply will be generated by the model.`,
        demoReplyNoModel: () => "Got your question. No model is configured yet — open Settings (bottom-left) → Model Settings, pick a provider, a model and fill in the API Key."
    }
};
function getLang() { return localStorage.getItem('cs-lang') || 'zh'; }
const t = (key) => i18n[getLang()][key];
/* ============ 主题 ============ */
/* cs-theme 取值：system | light | dark（基础双主题） + modern-minimal | ink-green | cinnabar | sky-sea |
   nostalgia | glass | snow-moon | peach-grove | yanyun | white-snake | office-daily | qq-classic（扩展主题）。
   其中 yanyun（燕云十六声）为游戏限定、white-snake（白蛇缘起）为动画电影 IP、qq-classic（经典QQ）为
   品牌风格：三者均按用户要求仅作标注，界面不渲染任何限定标识。
   扩展主题为具体配色预设，选中后不受系统明暗影响；"跟随系统/亮色/暗色"始终回归基础双主题。 */
const langSeg = document.getElementById('langSeg');
const mediaDark = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
    const setting = localStorage.getItem('cs-theme') || 'system';
    const resolved = setting === 'system' ? (mediaDark.matches ? 'dark' : 'light') : setting;
    document.documentElement.setAttribute('data-theme', resolved);
    /* 主题选择器已迁入设置页「外观」动态面板（renderAppearance 构建），
       面板重挂后需同步选中态：外观面板按 data-theme-opt 标记，委托事件在 document 上 */
    document.querySelectorAll('#settingsWorkBody [data-theme-opt]').forEach(function (item) {
        item.classList.toggle('selected', item.dataset.themeOpt === setting);
    });
}
mediaDark.addEventListener('change', function () { if ((localStorage.getItem('cs-theme') || 'system') === 'system')
    applyTheme(); });
document.addEventListener('click', function (e) {
    const item = e.target && e.target.closest ? e.target.closest('[data-theme-opt]') : null;
    if (!item)
        return;
    e.stopPropagation();
    localStorage.setItem('cs-theme', item.dataset.themeOpt);
    applyTheme();
});
/* ============ 语言 ============ */
function applyLang() {
    const lang = getLang();
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
        const key = el.dataset.i18n;
        if (i18n[lang][key])
            el.textContent = i18n[lang][key];
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
        const key = el.dataset.i18nPh;
        if (i18n[lang][key])
            el.placeholder = i18n[lang][key];
    });
    langSeg.querySelectorAll('.seg-item').forEach(function (item) {
        item.classList.toggle('selected', item.dataset.langOpt === lang);
    });
    const polishBtnTitle = document.getElementById('polishBtn');
    if (polishBtnTitle)
        polishBtnTitle.title = t('polish');
    refreshModelMenu();
    renderModeActions();
    renderProjects();
    renderConversations();
    renderRightPanel();
    renderMessages();
    /* 语言切换属内容更新：设置页导航与面板头随语言重建（设置页开着时重挂动态节） */
    refreshSettingsSection();
}
langSeg.querySelectorAll('.seg-item').forEach(function (item) {
    item.addEventListener('click', function (e) {
        e.stopPropagation();
        localStorage.setItem('cs-lang', item.dataset.langOpt);
        applyLang();
    });
});
/* ============ 菜单开合 ============ */
const modelSelect = document.querySelector('.model-select');
/* 设置按钮：不再弹下拉，直接进入独立设置页（openSettings 见下方设置页一节） */
document.getElementById('settingsBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    openSettings();
});
document.getElementById('modelBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    var mm = document.getElementById('modelMenu');
    var willOpen = mm.style.display !== 'block';
    refreshModelMenu();
    if (willOpen)
        openDropdownMenu(document.getElementById('modelBtn'), mm);
    else
        closeDropdownMenu(mm);
    modelSelect.classList.toggle('open', willOpen);
});
modelSelect.addEventListener('click', function (e) { e.stopPropagation(); });
document.addEventListener('click', function () {
    modelSelect.classList.remove('open');
    closeDropdownMenu(document.getElementById('modelMenu'));
    document.getElementById('modelPickMenu').style.display = 'none';
    document.getElementById('providerMenu').style.display = 'none';
    document.querySelectorAll('.action-menu.open').forEach(function (mn) { mn.classList.remove('open'); });
});
/* ============ 设置页（全屏覆盖层：左导航 + 右面板） ============
   覆盖层方案：底层 DOM 原样保留 → 返回即精确还原，不动 renderMessages /
   setSidebarMode 任何分支。智能体 / 沙箱 / 笔记本 / 运行 自 Work 侧栏迁入
   （唯一挂载点在设置页）；知识与数据库 / 技能与插件 / 连接器 与侧栏双入口
   共用同一构建器同一份数据。 */
const SETTINGS_ICONS = {
    person: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="3" rx="1.5"/><rect width="7" height="7" x="3" y="14" rx="1.5"/><rect width="7" height="7" x="14" y="14" rx="1.5"/>',
    agent: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
    db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    layers: '<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
    plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
    hooks: '<circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>',
    memory: '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z"/>',
    computer: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
    git: '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    worktrees: '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>'
};
/* [section, 词条 key, 中文兜底, 图标]；顺序即导航渲染顺序（07-设置页改造.md §3） */
const SETTINGS_NAV = [
    { group: ['groupGeneral', '通用'], items: [
            ['personal', 'personalSettings', '个人设置', 'person'],
            ['theme', 'themeLabel', '主题', 'palette']
        ] },
    { group: ['groupModel', '模型'], items: [
            ['models', 'modelSettings', '模型配置', 'grid']
        ] },
    { group: ['groupWork', '墨道 · Work'], items: [
            ['agents', 'wAgents', '智能体', 'agent'],
            ['sandbox', 'wSandbox', '沙箱', 'box'],
            ['notebook', 'wNotebook', '笔记本', 'book'],
            ['run', 'wRun', '运行', 'terminal'],
            ['memory', 'settingsMemory', '记忆', 'memory']
        ] },
    { group: ['groupKnowledge', '知识与扩展'], items: [
            ['papersdb', 'papersDb', '知识和数据库', 'db'],
            ['skills', 'wSkills', '技能与插件', 'layers'],
            ['mcp', 'wMcp', '连接器', 'plug']
        ] },
    { group: ['groupBehavior', '智能体行为'], items: [
            ['hooks', 'settingsHooks', '钩子', 'hooks'],
            ['computer', 'settingsComputer', '电脑操控', 'computer']
        ] },
    { group: ['groupWorkspace', '工作区'], items: [
            ['git', 'settingsGit', 'Git', 'git'],
            ['worktrees', 'settingsWorktrees', 'Worktrees', 'worktrees']
        ] }
];
/* 主题（外观）面板按设计图重建为动态面板，仅剩个人设置 / 模型配置为静态面板 */
const SETTINGS_STATIC_PANELS = { personal: 'settingsPersonalPanel', models: 'settingsModelsPanel' };
let settingsOpen = false;
let settingsSection = null;
let settingsDynMeta = null;
/* 词条兜底：Work 词条在 bundle 执行后才并入 i18n，取不到时回退中文 */
function tn(key, fallback) {
    const d = i18n[getLang()];
    return (d && d[key]) || fallback;
}
function renderSettingsNav() {
    const nav = document.getElementById('settingsNav');
    if (!nav)
        return;
    nav.innerHTML = '';
    SETTINGS_NAV.forEach(function (g) {
        const gl = document.createElement('div');
        gl.style.cssText = 'color: var(--text-3); font-size: 10.5px; font-weight: 700; padding: 12px 8px 6px 8px; letter-spacing: 0.4px;';
        gl.textContent = tn(g.group[0], g.group[1]);
        nav.appendChild(gl);
        g.items.forEach(function (it) {
            const row = document.createElement('div');
            row.className = 'settings-nav-item' + (it[0] === settingsSection ? ' selected' : '');
            row.dataset.section = it[0];
            row.innerHTML = '<div class="sn-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + SETTINGS_ICONS[it[3]] + '</svg></div><div class="sn-label"></div>';
            row.querySelector('.sn-label').textContent = tn(it[1], it[2]);
            row.addEventListener('click', function () { showSettingsSection(it[0]); });
            nav.appendChild(row);
        });
    });
}
function renderSettingsHead() {
    const el = document.getElementById('settingsPanelTitle');
    const de = document.getElementById('settingsPanelDesc');
    if (!el)
        return;
    let title = '', desc = '';
    if (settingsSection === 'personal') {
        title = tn('personalSettings', '个人设置');
        desc = tn('settingsPersonalDesc', '头像、昵称与语言偏好');
    }
    else if (settingsSection === 'theme') {
        title = tn('settingsAppearance', '外观');
        desc = '';
    }
    else if (settingsSection === 'models') {
        title = tn('modelSettings', '模型配置');
        desc = tn('settingsModelsDesc', '添加与管理模型接入；API Key 仅保存在本地');
    }
    else if (settingsSection === 'papersdb') {
        title = tn('papersDb', '知识和数据库');
        desc = tn('dbSub', '连接数据源，随时查询与分析');
    }
    else if (settingsSection === 'hooks') {
        title = tn('settingsHooks', '钩子');
        desc = tn('settingsHooksDesc', '');
    }
    else if (settingsSection === 'memory') {
        title = tn('settingsMemory', '记忆');
        desc = tn('settingsMemoryDesc', '');
    }
    else if (settingsSection === 'computer') {
        title = tn('settingsComputer', '电脑操控');
        desc = tn('settingsComputerDesc', '受控本机操作的权限策略');
    }
    else if (settingsSection === 'git') {
        title = tn('settingsGit', 'Git');
        desc = '';
    }
    else if (settingsSection === 'worktrees') {
        title = tn('settingsWorktrees', 'Worktrees');
        desc = '';
    }
    else if (settingsDynMeta) {
        title = settingsDynMeta.title || '';
        desc = settingsDynMeta.desc || '';
    }
    el.textContent = title;
    de.textContent = desc;
    de.style.display = desc ? 'block' : 'none';
}
/* 动态区挂载：Work 四节 + 双入口三节的构建器复用（buildWorkPage 内含降级卡片） */
function mountSettingsDynamic(id) {
    const body = document.getElementById('settingsWorkBody');
    if (!body)
        return;
    body.innerHTML = '';
    settingsDynMeta = null;
    if (id === 'papersdb') {
        const page = buildPapersDbPage();
        if (page)
            body.appendChild(page);
        settingsDynMeta = { title: tn('papersDb', '知识和数据库'), desc: '' };
        return;
    }
    const page = buildWorkPage('work-' + id);
    body.appendChild(page.node);
    settingsDynMeta = { title: page.title, desc: page.desc };
}
function showSettingsSection(id, force) {
    /* 幂等（2026-09-16 用户裁定 #1）：点击当前已选中的导航项、或重复进入同一节时
       不重渲染——页面状态静止（输入、滚动、展开态不被打断）。force=true 用于
       首次打开、语言切换重建与深链跳转。 */
    if (!force && id === settingsSection)
        return;
    settingsSection = id;
    try {
        localStorage.setItem('cs-settings-section', id);
    }
    catch (e) { /* 忽略 */ }
    document.querySelectorAll('#settingsNav .settings-nav-item').forEach(function (row) {
        row.classList.toggle('selected', row.dataset.section === id);
    });
    const staticPanel = SETTINGS_STATIC_PANELS[id] || null;
    Object.keys(SETTINGS_STATIC_PANELS).forEach(function (k) {
        const el = document.getElementById(SETTINGS_STATIC_PANELS[k]);
        if (el)
            el.style.display = (k === id) ? 'flex' : 'none';
    });
    const dyn = document.getElementById('settingsWorkBody');
    if (dyn)
        dyn.style.display = staticPanel ? 'none' : 'block';
    if (!staticPanel) {
        const pref = SETTINGS_PREF_PANELS[id];
        if (pref)
            renderPrefPanel(pref);
        else
            mountSettingsDynamic(id);
    }
    else if (id === 'models')
        renderModelManage();
    renderSettingsHead();
}
function openSettings(section) {
    const page = document.getElementById('settingsPage');
    if (!page)
        return;
    if (settingsOpen) {
        if (section)
            showSettingsSection(section);
        return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    page.style.display = 'flex';
    if (!reduce) {
        page.style.transition = 'opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1), transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)';
        page.style.opacity = '0';
        page.style.transform = 'translateY(8px)';
        requestAnimationFrame(function () { page.style.opacity = '1'; page.style.transform = 'none'; });
    }
    document.body.style.overflow = 'hidden';
    settingsOpen = true;
    renderSettingsNav();
    /* 落点：深链指定 > 上次访问 > 个人设置（首次打开/深链一律 force 重渲染） */
    showSettingsSection(section || settingsSection || (function () {
        try {
            return localStorage.getItem('cs-settings-section') || 'personal';
        }
        catch (e) {
            return 'personal';
        }
    })(), true);
}
function closeSettings() {
    const page = document.getElementById('settingsPage');
    if (!page || !settingsOpen)
        return;
    settingsOpen = false;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
        page.style.display = 'none';
    }
    else {
        page.style.transition = 'opacity 0.18s cubic-bezier(0.22, 1, 0.36, 1), transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)';
        page.style.opacity = '0';
        page.style.transform = 'translateY(8px)';
        setTimeout(function () { page.style.display = 'none'; page.style.transition = ''; }, 180);
    }
    document.body.style.overflow = '';
}
function refreshSettingsSection() {
    renderSettingsNav();
    if (settingsOpen && settingsSection)
        showSettingsSection(settingsSection, true);
}
document.getElementById('settingsBackBtn').addEventListener('click', closeSettings);
document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !settingsOpen)
        return;
    /* 编辑/确认弹窗开着时先让位（它们 z-index 更高） */
    if (document.querySelector('.modal-overlay.visible'))
        return;
    closeSettings();
});
/* ============ 设置页 · 偏好面板（记忆/钩子/电脑操控/Git/Worktrees/外观） ============
   2026-09-16 按设计图逐页还原：记忆/钩子/Git/Worktrees/外观为静态结构 +
   本地持久化（cs-set-*）；无设计图的电脑操控保持原样；依赖后端联动的能力
   如实标注「筹备中」，不虚标可用性。对齐采用页面级居中（标题/分组/说明居中，
   操作行保持文字在左、控件在右）。 */
const PREF_ICONS = {
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    folderOpen: '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    fileCog: '<path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M15.2 21.6a1.7 1.7 0 0 0 1.7-2.9 1.7 1.7 0 0 0-2.4 0l.7.7-1 1-.7-.7a1.7 1.7 0 0 0 0 2.4c.3.3.7.5 1.1.5Z"/><path d="M16 18.5V17"/><path d="M14.5 16.5h-1.5"/><path d="M14.5 20.5h-1.5"/><path d="M18.5 17.5h1.5"/><path d="M18.5 19.5h1.5"/><path d="M18.5 21.5h1.5"/><path d="M19.5 18.5h-1.5"/><path d="M19.5 20.5h-1.5"/><path d="M4 22h14a2 2 0 0 0 2-2V8l-6-6H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    anchor: '<circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    flask: '<path d="M10 2v7.5a2 2 0 0 1-.24.96L4.5 19a2 2 0 0 0 1.76 3h11.48a2 2 0 0 0 1.76-3l-5.26-8.54a2 2 0 0 1-.24-.96V2"/><path d="M8 2h8"/>',
    gridSm: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    userCog: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M18 15v1"/><path d="M21 18.5h-1"/><path d="M19 20.5v-1"/><path d="M16.5 19.5h1"/>'
};
function prefSvg(name, size) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:' + (size || 17) + 'px;height:' + (size || 17) + 'px">' + (PREF_ICONS[name] || SETTINGS_ICONS[name] || '') + '</svg>';
}
function prefLoad(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || '{}') || {};
    }
    catch (e) {
        return {};
    }
}
/* ⚠️ 修复（2026-09-17）：prefPatch 此前在全代码库只有调用、没有定义——
   设置页字体下拉的 change 处理器第一行即抛 ReferenceError，同一行的
   applyFontStyle 永不执行，「换字体不生效」的真实根因（电脑操控面板同病）。
   语义：把 patch 合并进 localStorage 键（与 prefLoad 配对的即时写入）。 */
function prefPatch(key, patch) {
    try {
        const next = Object.assign({}, prefLoad(key), patch);
        localStorage.setItem(key, JSON.stringify(next));
        return next;
    }
    catch (e) {
        return {};
    }
}
/* ---- 设置页偏好：后端持久化（work.json prefs 分区），替代 localStorage ----
   CS_PREFS 首次打开设置面板时经 GET /api/work/prefs 注水；变更走 PUT（后端
   normalizePrefs 做字段合并与校验）。记忆开关联动 SDK 会话 memory scope、
   Git 偏好注入墨道系统提示（见 server/qoder.ts）。
   注意：workFetch 定义在 work bundle 的 IIFE 内，主脚本作用域不可见——
   经 window.CS_WORK.api.fetch 桥接（90-boot 暴露）；不可用时给出明确错误。 */
function workFetch(p, opts) {
    const w = window.CS_WORK;
    if (w && w.api && w.api.fetch)
        return w.api.fetch(p, opts);
    return Promise.reject(new Error('后端 API 不可用（请通过桌面版应用使用该功能）'));
}
let CS_PREFS = {
    memory: { globalOn: true, projectOn: true },
    git: { prefix: 'qoder/', force: false, instr: '' },
    worktrees: { fetchBeforeCreate: false, autoDelete: true, limit: 15 },
    appearance: { width: 'standard' }
};
let prefsLoaded = false;
function ensurePrefs() {
    if (prefsLoaded)
        return Promise.resolve(CS_PREFS);
    return workFetch('/api/work/prefs').then(function (r) {
        if (r && r.prefs)
            CS_PREFS = r.prefs;
        prefsLoaded = true;
        return CS_PREFS;
    }).catch(function () { return CS_PREFS; /* 后端不可用：沿用默认值 */ });
}
function savePrefs(patch) {
    return workFetch('/api/work/prefs', { method: 'PUT', body: patch }).then(function (r) {
        if (r && r.prefs)
            CS_PREFS = r.prefs;
        return true;
    }).catch(function (e) {
        showToast(tn('prefsSaveFail', '保存失败') + '：' + (e && e.message ? e.message : e));
        return false;
    });
}
function fmtMemMeta(scope) {
    const nf = i18n[getLang()].memFilesN;
    const n = (typeof nf === 'function') ? nf(scope.count || 0) : String(scope.count || 0);
    if (!scope.updatedAt)
        return n;
    const d = new Date(scope.updatedAt);
    const pad = function (x) { return (x < 10 ? '0' : '') + x; };
    return n + ' · ' + tn('memUpdated', '更新于 ') + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
function openMemoryFolder(dir) {
    const desk = window.csDesktop;
    if (desk && desk.openPath) {
        desk.openPath(dir).then(function (r) {
            if (r && r.error)
                showToast(tn('openFail', '打开失败') + '：' + r.error);
        }).catch(function (e) { showToast(tn('openFail', '打开失败') + '：' + (e && e.message ? e.message : e)); });
    }
    else {
        showToast(tn('openFail', '打开失败') + '：' + tn('openNeedsDesktop', '请在桌面版应用中使用'));
    }
}
function prefGroupLabel(text) {
    const l = document.createElement('div');
    l.className = 'pref-group-label';
    l.textContent = text;
    return l;
}
/* 设计图标准行：图标 + 标题/说明（左）+ 控件（右）；center=true 时整行居中 */
function prefInfoRow(opts) {
    const row = document.createElement('div');
    row.className = 'pref-row' + (opts.center ? ' pref-row-center' : '');
    if (opts.icon) {
        const ic = document.createElement('div');
        ic.className = 'pref-row-icon';
        if (opts.iconColor) {
            ic.style.color = opts.iconColor;
            ic.style.background = opts.iconBg || 'var(--surface-2)';
        }
        ic.innerHTML = prefSvg(opts.icon);
        row.appendChild(ic);
    }
    const main = document.createElement('div');
    main.className = 'pref-row-main';
    const ti = document.createElement('div');
    ti.className = 'pref-row-title';
    ti.textContent = opts.title;
    if (opts.soon) {
        const badge = document.createElement('span');
        badge.className = 'pref-soon';
        badge.textContent = '筹备中';
        ti.appendChild(badge);
    }
    main.appendChild(ti);
    if (opts.hint) {
        const h = document.createElement('div');
        h.className = 'pref-row-hint';
        h.textContent = opts.hint;
        main.appendChild(h);
    }
    row.appendChild(main);
    if (opts.end) {
        const end = document.createElement('div');
        end.className = 'pref-row-end';
        if (Array.isArray(opts.end))
            opts.end.forEach(function (n) { end.appendChild(n); });
        else
            end.appendChild(opts.end);
        row.appendChild(end);
    }
    return row;
}
function prefToggle(on, onChange) {
    const tg = document.createElement('div');
    tg.className = 'toggle' + (on ? ' on' : '');
    tg.addEventListener('click', function (e) {
        e.stopPropagation();
        const next = !tg.classList.contains('on');
        tg.classList.toggle('on', next);
        onChange(next);
    });
    return tg;
}
/* 设置页统一下拉：原生 <select> 的弹出菜单由系统渲染，CSS 动画无法介入
   （Windows 上展开生硬，即用户反馈的"卡顿"）。改为挂 body 的 fixed 菜单 +
   淡入过渡（0.18s cubic-bezier(.22,1,.36,1)，prefers-reduced-motion 时直切）。
   兼容面与原生一致：.value 可读写（程序化赋值不触发 onChange）、.id 可设；
   菜单挂 body 是为了避免被 .settings-paper 的 overflow 裁剪（同加号菜单教训），
   关闭后即从 body 摘除，不残留。 */
let prefSelectGlobalBound = false;
function prefSelectBindGlobal() {
    if (prefSelectGlobalBound)
        return;
    prefSelectGlobalBound = true;
    /* 事件委托收起：不持有实例引用，设置页重渲染不产生监听器泄漏 */
    document.addEventListener('mousedown', function (e) {
        document.querySelectorAll('.pref-select.open').forEach(function (w) {
            const menu = w.__menu;
            if (!w.contains(e.target) && !(menu && menu.contains(e.target)))
                w.__setOpen(false);
        });
    }, true);
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape')
            return;
        document.querySelectorAll('.pref-select.open').forEach(function (w) { w.__setOpen(false); });
    }, true);
    window.addEventListener('scroll', function () {
        document.querySelectorAll('.pref-select.open').forEach(function (w) { w.__setOpen(false); });
    }, true);
    window.addEventListener('resize', function () {
        document.querySelectorAll('.pref-select.open').forEach(function (w) { w.__setOpen(false); });
    });
}
function prefSelect(options, current, onChange) {
    prefSelectBindGlobal();
    const wrap = document.createElement('div');
    wrap.className = 'pref-select';
    const btn = document.createElement('div');
    btn.className = 'pref-select-btn';
    btn.setAttribute('role', 'combobox');
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('tabindex', '0');
    const label = document.createElement('span');
    label.className = 'pref-select-label';
    const chev = document.createElement('span');
    chev.className = 'pref-select-chev';
    chev.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px"><path d="M6 9l6 6 6-6"/></svg>';
    btn.appendChild(label);
    btn.appendChild(chev);
    const menu = document.createElement('div');
    menu.className = 'pref-select-menu';
    menu.setAttribute('role', 'listbox');
    let value = current;
    let open = false;
    let removeTimer = null;
    function labelOf(v) {
        const hit = options.find(function (o) { return String(o.v) === String(v); });
        return hit ? hit.label : String(v);
    }
    function paint() {
        label.textContent = labelOf(value);
        Array.prototype.forEach.call(menu.children, function (it) {
            it.classList.toggle('selected', it.dataset.v === String(value));
        });
    }
    function layout() {
        /* body 有 zoom 时 rect 是视觉坐标、写入值是本地 CSS 坐标，一律除以实测比值 k */
        const k = csViewportK() || 1;
        const r = btn.getBoundingClientRect();
        menu.style.minWidth = Math.round(Math.max(160, r.width / k)) + 'px';
        menu.style.left = Math.round(Math.max(8, r.left / k)) + 'px';
        /* 统一从视口顶锚定（top），避开 zoom 下视口底坐标的换算歧义。
           ⚠️ top 与 maxHeight 必须用同一份可用空间推导——否则向上展开时菜单会被
           maxHeight 压扁而与按钮之间出现悬空（本轮实测踩坑）。 */
        const need = Math.min(300, menu.scrollHeight + 4);
        const belowCss = (window.innerHeight - r.bottom) / k;
        const topCss = r.top / k;
        let top;
        let maxH;
        if (belowCss >= need + 6 || topCss < need + 14) {
            /* 向下：顶=按钮底+6，高度受下方空间约束 */
            top = topCss + r.height / k + 6;
            maxH = Math.min(300, Math.max(120, belowCss - 12));
        }
        else {
            /* 向上：底=按钮顶-6。top 必须按实际渲染高 min(自然高, 上限) 推导，
               否则菜单被上限压扁/或按上限放量时底部悬空 */
            maxH = Math.min(300, Math.max(120, topCss - 14));
            const renderH = Math.min(menu.scrollHeight, maxH);
            top = topCss - 6 - renderH;
        }
        menu.style.top = Math.round(Math.max(8, top)) + 'px';
        menu.style.maxHeight = Math.round(maxH) + 'px';
    }
    function setOpen(v) {
        if (open === v)
            return;
        open = v;
        wrap.classList.toggle('open', v);
        btn.setAttribute('aria-expanded', v ? 'true' : 'false');
        if (removeTimer) {
            clearTimeout(removeTimer);
            removeTimer = null;
        }
        if (v) {
            if (!menu.isConnected)
                document.body.appendChild(menu);
            layout();
            /* 双 rAF：让初始态（opacity:0）先完成一次布局，再加入可见类，淡入才生效 */
            requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add('visible'); }); });
        }
        else {
            menu.classList.remove('visible');
            removeTimer = setTimeout(function () { if (!open && menu.isConnected)
                menu.remove(); }, 240);
        }
    }
    wrap.__menu = menu;
    wrap.__setOpen = setOpen;
    btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!open); });
    btn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(!open);
        }
    });
    options.forEach(function (o) {
        const it = document.createElement('div');
        it.className = 'pref-select-item';
        it.dataset.v = String(o.v);
        it.setAttribute('role', 'option');
        it.textContent = o.label;
        it.addEventListener('click', function (e) {
            e.stopPropagation();
            value = o.v;
            paint();
            setOpen(false);
            if (onChange)
                onChange(o.v);
        });
        menu.appendChild(it);
    });
    paint();
    wrap.appendChild(btn);
    /* 原生 select 兼容面：.value 读写（程序化赋值只更新显示，不触发 onChange，与原生语义一致） */
    Object.defineProperty(wrap, 'value', {
        get: function () { return value; },
        set: function (v) { value = v; paint(); },
        configurable: true
    });
    return wrap;
}
function prefIconButton(icon, title, onClick, danger) {
    const b = document.createElement('div');
    b.className = 'pref-icon-btn' + (danger ? ' danger' : '');
    b.title = title;
    b.innerHTML = prefSvg(icon, 16);
    b.addEventListener('click', function (e) { e.stopPropagation(); onClick(); });
    return b;
}
/* 无参 = 设计图行容器（.pref-card，行内自带分隔线）；
   带 label/hint = 电脑操控旧面板的说明卡（居中文本，兼容保留） */
function prefCard(label, hint) {
    const c = document.createElement('div');
    if (!label && !hint) {
        c.className = 'pref-card';
        return c;
    }
    c.style.cssText = 'align-self: stretch; padding: 16px; background: var(--panel-bg); border: 1px solid var(--border-soft); border-radius: 12px; display: flex; flex-direction: column; gap: 10px;';
    if (label) {
        const l = document.createElement('div');
        l.style.cssText = 'color: var(--text-2); font-size: 12px; font-weight: 600; text-align: center;';
        l.textContent = label;
        c.appendChild(l);
    }
    if (hint) {
        const h = document.createElement('div');
        h.style.cssText = 'color: var(--text-3); font-size: 11.5px; line-height: 18px; text-align: center;';
        h.textContent = hint;
        c.appendChild(h);
    }
    return c;
}
function prefRow(labelText, control) {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; gap: 12px;';
    const l = document.createElement('div');
    l.style.cssText = 'color: var(--text-2); font-size: 12.5px; font-weight: 500;';
    l.textContent = labelText;
    row.appendChild(l);
    row.appendChild(control);
    return row;
}
function prefSeg(options, current, onChange) {
    const seg = document.createElement('div');
    seg.className = 'seg';
    options.forEach(function (o) {
        const it = document.createElement('div');
        it.className = 'seg-item' + (o.v === current ? ' selected' : '');
        it.textContent = o.label;
        it.addEventListener('click', function (e) {
            e.stopPropagation();
            seg.querySelectorAll('.seg-item').forEach(function (x) { x.classList.remove('selected'); });
            it.classList.add('selected');
            onChange(o.v);
        });
        seg.appendChild(it);
    });
    return seg;
}
function onOffSeg(current, onChange) {
    return prefSeg([{ v: 'on', label: tn('prefOn', '开启') }, { v: 'off', label: tn('prefOff', '关闭') }], current, onChange);
}
function renderPrefPanel(builder) {
    settingsDynMeta = null;
    const body = document.getElementById('settingsWorkBody');
    if (!body)
        return;
    body.innerHTML = '';
    const wrap = document.createElement('div');
    /* 居中基准必须是内容区（内容列宽 = 窗口 - 设置导航 216px）而非整窗：
       #settingsWorkBody(max-width:980) 已在内容列内居中，但它是 block 容器，
       其内 760 包裹层若默认左对齐，卡片中心会恰好落到整窗中心（左偏半个导航宽）。
       margin:0 auto 让包裹层在 980 容器内水平居中，卡片中心对齐内容区中心。 */
    wrap.style.cssText = 'width: 100%; max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px;';
    try {
        builder(wrap);
    }
    catch (e) {
        /* 面板构建异常不吞错：渲染错误卡并上报日志，避免空白页 */
        const errCard = document.createElement('div');
        errCard.className = 'pref-card';
        errCard.style.padding = '18px';
        const hint = document.createElement('div');
        hint.className = 'pref-row-hint';
        hint.style.textAlign = 'center';
        hint.textContent = '面板渲染失败：' + (e && e.message ? e.message : e);
        errCard.appendChild(hint);
        wrap.appendChild(errCard);
        try {
            if (window.csDesktop && window.csDesktop.log)
                window.csDesktop.log('settings pref panel error: ' + (e && e.message));
        }
        catch (x) { }
    }
    body.appendChild(wrap);
}
/* 卡片内居中提示行（空态/错误态） */
function prefCenterHint(text) {
    const r = document.createElement('div');
    r.className = 'pref-row pref-row-center';
    const m = document.createElement('div');
    m.className = 'pref-row-hint';
    m.textContent = text;
    r.appendChild(m);
    return r;
}
/* 记忆作用域行（真实数据）：打开文件夹（csDesktop.openPath）+ 软删除（后端 API） */
function memScopeRow(scope, idx) {
    const projColors = [
        { c: '#7C3AED', b: 'rgba(124,58,237,0.10)' },
        { c: '#2563EB', b: 'rgba(37,99,235,0.10)' },
        { c: '#16A34A', b: 'rgba(22,163,74,0.10)' }
    ];
    const col = scope.scope === 'global' ? null : projColors[idx % projColors.length];
    const row = prefInfoRow({
        icon: scope.scope === 'global' ? 'globe' : 'gridSm',
        iconColor: col ? col.c : undefined, iconBg: col ? col.b : undefined,
        title: scope.scope === 'global' ? tn('memGlobal', '全局记忆') : String(scope.slug || ''),
        hint: fmtMemMeta(scope),
        end: [
            prefIconButton('folderOpen', tn('memOpenTip', '打开记忆文件夹'), function () { openMemoryFolder(scope.dir); }),
            prefIconButton('trash', tn('memDeleteTip', '删除该记忆'), function () { }, true)
        ]
    });
    const trash = row.querySelectorAll('.pref-icon-btn')[1];
    trash.addEventListener('click', function () {
        showConfirm(tn('memDeleteConfirm', '确认删除该记忆？'), function () {
            workFetch('/api/work/qoder/memories/delete', {
                method: 'POST', body: { scope: scope.scope, slug: scope.slug || undefined }
            }).then(function () {
                showToast(tn('memDeleted', '记忆已移入系统临时目录'));
                showSettingsSection('memory'); /* 重挂面板刷新真实清单 */
            }).catch(function (e) {
                showToast(tn('memLoadFail', '记忆加载失败') + '：' + (e && e.message ? e.message : e));
            });
        });
    });
    return row;
}
const SETTINGS_PREF_PANELS = {
    /* 记忆：行为开关联动 SDK memory scope；清单来自 GET /api/work/qoder/memories 真实扫描 */
    memory: function (box) {
        box.appendChild(prefGroupLabel(tn('memGroupBehavior', '记忆行为')));
        const c1 = prefCard();
        const tgG = prefToggle(true, function (v) { savePrefs({ memory: { globalOn: v } }); });
        const tgP = prefToggle(true, function (v) { savePrefs({ memory: { projectOn: v } }); });
        c1.appendChild(prefInfoRow({ icon: 'globe', title: tn('memGlobal', '全局记忆'), hint: tn('memGlobalHint', ''), end: tgG }));
        c1.appendChild(prefInfoRow({ icon: 'folder', title: tn('memProject', '项目记忆'), hint: tn('memProjectHint', ''), end: tgP }));
        box.appendChild(c1);
        box.appendChild(prefGroupLabel(tn('memGroupGlobal', '全局记忆')));
        const c2 = prefCard();
        const c2Loading = prefCenterHint('…');
        c2.appendChild(c2Loading);
        box.appendChild(c2);
        box.appendChild(prefGroupLabel(tn('memGroupProject', '项目记忆')));
        const c3 = prefCard();
        const c3Loading = prefCenterHint('…');
        c3.appendChild(c3Loading);
        box.appendChild(c3);
        ensurePrefs().then(function () {
            tgG.classList.toggle('on', CS_PREFS.memory.globalOn !== false);
            tgP.classList.toggle('on', CS_PREFS.memory.projectOn !== false);
        });
        workFetch('/api/work/qoder/memories').then(function (r) {
            const m = (r && r.memories) || {};
            if (c2Loading.parentElement)
                c2Loading.remove();
            if (c3Loading.parentElement)
                c3Loading.remove();
            if (m.global && m.global.count > 0)
                c2.appendChild(memScopeRow(m.global, 0));
            else
                c2.appendChild(prefCenterHint(tn('memEmpty', '暂无记忆文件')));
            const ps = (m.projects || []).filter(function (p) { return p.count > 0; });
            if (!ps.length)
                c3.appendChild(prefCenterHint(tn('memNoProjects', '暂无项目记忆')));
            ps.forEach(function (p, i) { c3.appendChild(memScopeRow(p, i)); });
        }).catch(function (e) {
            if (c2Loading.parentElement)
                c2Loading.textContent = tn('memLoadFail', '记忆加载失败') + '：' + (e && e.message ? e.message : e);
            if (c3Loading.parentElement)
                c3Loading.remove();
        });
    },
    /* 钩子：真实读取 ~/.qoder-cn/settings.json 的 hooks 字段（磁盘配置，只读展示） */
    hooks: function (box) {
        box.appendChild(prefGroupLabel(tn('hooksSrcGroup', '配置来源')));
        const c1 = prefCard();
        const metaEl = document.createElement('span');
        metaEl.className = 'pref-meta';
        metaEl.textContent = '…';
        const pathHint = document.createElement('div');
        pathHint.className = 'pref-row-hint';
        c1.appendChild(prefInfoRow({ icon: 'fileCog', title: tn('hooksUserFile', '用户级 settings.json'), hint: '', end: metaEl }));
        c1.querySelector('.pref-row-main').appendChild(pathHint);
        box.appendChild(c1);
        const warn = document.createElement('div');
        warn.className = 'pref-warn';
        warn.textContent = tn('hooksWarn', '');
        box.appendChild(warn);
        box.appendChild(prefGroupLabel(tn('hooksConfiguredGroup', '已配置的 Hooks')));
        const c2 = prefCard();
        const c2Loading = prefCenterHint('…');
        c2.appendChild(c2Loading);
        box.appendChild(c2);
        workFetch('/api/work/qoder/hooks').then(function (r) {
            const h = (r && r.hooks) || {};
            pathHint.textContent = h.path || '';
            const cf = i18n[getLang()].hooksCountN;
            metaEl.textContent = (typeof cf === 'function') ? cf(h.count || 0) : ('Hook · ' + (h.count || 0));
            if (c2Loading.parentElement)
                c2Loading.remove();
            if (!h.exists) {
                c2.appendChild(prefCenterHint(h.error || tn('hooksFileMissing', 'settings.json 不存在')));
                return;
            }
            const evs = h.events || [];
            if (!evs.length) {
                c2.appendChild(prefInfoRow({ icon: 'anchor', title: tn('hooksNoneTitle', ''), hint: tn('hooksNoneHint', '') }));
                return;
            }
            evs.forEach(function (ev) {
                (ev.matchers || []).forEach(function (m) {
                    c2.appendChild(prefInfoRow({
                        title: String(ev.event || '') + (m.matcher ? ' · ' + m.matcher : ''),
                        hint: (m.commands || []).join('；')
                    }));
                });
            });
        }).catch(function (e) {
            if (c2Loading.parentElement)
                c2Loading.textContent = tn('hooksLoadFail', '钩子配置加载失败') + '：' + (e && e.message ? e.message : e);
        });
    },
    /* 电脑操控：开关统一为滑动块（2026-09-16 裁定 #7），授权模式为三选一 */
    computer: function (box) {
        const st = prefLoad('cs-set-computer');
        const c1 = prefCard();
        const tgOn = prefToggle(st.enabled === true, function (v) { prefPatch('cs-set-computer', { enabled: v }); });
        c1.appendChild(prefInfoRow({ icon: 'computer', title: tn('computerEnable', '启用电脑操控'), hint: '', end: tgOn }));
        box.appendChild(c1);
        const c2 = prefCard();
        c2.appendChild(prefInfoRow({
            icon: 'shield', title: tn('computerMode', '授权模式'), hint: '',
            end: prefSeg([
                { v: 'ask', label: tn('computerModeAsk', '每次询问') },
                { v: 'danger', label: tn('computerModeDanger', '危险操作确认') },
                { v: 'auto', label: tn('computerModeAuto', '自动执行') }
            ], st.mode || 'danger', function (v) { prefPatch('cs-set-computer', { mode: v }); })
        }));
        box.appendChild(c2);
        box.appendChild(prefCard(null, tn('computerHint', '')));
    },
    /* Git：分支前缀/强制推送/提交说明指令（后端持久化 + 注入墨道系统提示生效） */
    git: function (box) {
        const c1 = prefCard();
        const inp = document.createElement('input');
        inp.className = 'pref-mini-input';
        inp.placeholder = '';
        const tgF = prefToggle(false, function (v) { savePrefs({ git: { force: v } }); });
        c1.appendChild(prefInfoRow({
            title: tn('gitBranchPrefix', '分支前缀'), hint: tn('gitBranchPrefixHint', ''),
            end: inp
        }));
        c1.appendChild(prefInfoRow({
            title: tn('gitForce', '始终强制推送'), hint: tn('gitForceHint', ''),
            end: tgF
        }));
        box.appendChild(c1);
        box.appendChild(prefGroupLabel(tn('gitCommitGroup', '提交信息')));
        const c2 = prefCard();
        const blk = document.createElement('div');
        blk.style.cssText = 'padding: 15px 2px; display: flex; flex-direction: column; gap: 12px;';
        const bt = document.createElement('div');
        bt.style.cssText = 'display: flex; flex-direction: column; gap: 3px; text-align: center;';
        bt.innerHTML = '<div class="pref-row-title"></div><div class="pref-row-hint"></div>';
        bt.querySelector('.pref-row-title').textContent = tn('gitCommitInstr', '提交说明指令');
        bt.querySelector('.pref-row-hint').textContent = tn('gitCommitInstrHint', '');
        blk.appendChild(bt);
        const ta = document.createElement('textarea');
        ta.className = 'pref-textarea';
        ta.placeholder = tn('gitCommitInstrPh', '');
        blk.appendChild(ta);
        c2.appendChild(blk);
        box.appendChild(c2);
        inp.addEventListener('change', function () { savePrefs({ git: { prefix: inp.value.trim() } }); });
        ta.addEventListener('change', function () { savePrefs({ git: { instr: ta.value } }); });
        ensurePrefs().then(function () {
            inp.value = String(CS_PREFS.git.prefix || '');
            tgF.classList.toggle('on', CS_PREFS.git.force === true);
            ta.value = String(CS_PREFS.git.instr || '');
        });
    },
    /* Worktrees：偏好持久化 + 当前工作区真实 git worktree list */
    worktrees: function (box) {
        const c1 = prefCard();
        const tgFetch = prefToggle(false, function (v) { savePrefs({ worktrees: { fetchBeforeCreate: v } }); });
        const tgAuto = prefToggle(true, function (v) { savePrefs({ worktrees: { autoDelete: v } }); });
        const cntFmt = t('wtCountN');
        const cntOpts = ['5', '10', '15', '20', '25'].map(function (n) {
            return { v: n, label: (typeof cntFmt === 'function') ? cntFmt(n) : (n + ' 个') };
        });
        const limitSel = prefSelect(cntOpts, '15', function (v) { savePrefs({ worktrees: { limit: parseInt(v, 10) } }); });
        c1.appendChild(prefInfoRow({ title: tn('wtFetch', ''), hint: tn('wtFetchHint', ''), end: tgFetch }));
        c1.appendChild(prefInfoRow({ title: tn('wtAutoDel', ''), hint: tn('wtAutoDelHint', ''), end: tgAuto }));
        c1.appendChild(prefInfoRow({ title: tn('wtLimit', ''), hint: tn('wtLimitHint', ''), end: limitSel }));
        box.appendChild(c1);
        ensurePrefs().then(function () {
            tgFetch.classList.toggle('on', CS_PREFS.worktrees.fetchBeforeCreate === true);
            tgAuto.classList.toggle('on', CS_PREFS.worktrees.autoDelete !== false);
            limitSel.value = String(CS_PREFS.worktrees.limit || 15);
        });
        /* 托管 Worktree：取当前 Work 工作区（第一个带 folder 的项目）真实列举 */
        box.appendChild(prefGroupLabel(tn('wtManagedGroup', '托管 Worktree')));
        const c2 = prefCard();
        const c2Loading = prefCenterHint('…');
        c2.appendChild(c2Loading);
        box.appendChild(c2);
        const repo = (typeof projects !== 'undefined')
            ? (projects.find(function (p) { return p && p.mode === 'work' && p.folder; }) || null) : null;
        if (!repo) {
            c2Loading.textContent = tn('wtRepoMissing', '');
            return;
        }
        workFetch('/api/work/worktrees?repo=' + encodeURIComponent(repo.folder)).then(function (r) {
            const w = (r && r.worktrees) || {};
            if (c2Loading.parentElement)
                c2Loading.remove();
            if (w.error) {
                c2.appendChild(prefCenterHint(w.error));
                return;
            }
            const list = w.worktrees || [];
            if (!list.length) {
                c2.appendChild(prefInfoRow({ title: tn('wtNone', ''), hint: tn('wtNoneHint', ''), center: true }));
                return;
            }
            list.forEach(function (wt) {
                c2.appendChild(prefInfoRow({
                    icon: 'worktrees',
                    title: wt.branch ? wt.branch : (wt.bare ? tn('wtMain', '主工作树') : tn('wtDetached', '游离 HEAD')),
                    hint: wt.path + (wt.head ? ' · ' + String(wt.head).slice(0, 7) : '')
                }));
            });
        }).catch(function (e) {
            if (c2Loading.parentElement)
                c2Loading.textContent = tn('wtLoadFail', 'Worktree 加载失败') + '：' + (e && e.message ? e.message : e);
        });
    },
    /* 外观（对应应用内「主题」节）：主题模式/主题卡/语言/字体/内容宽度全部真实生效；
       终端主题、终端链接、文件图标等无对应能力的行已移除（不展示占位控件） */
    theme: function (box) {
        box.appendChild(prefGroupLabel(tn('apGroup', '界面样式')));
        const card = prefCard();
        card.style.padding = '6px 18px 18px 18px';
        /* 主题模式：system/light/dark 为真实切换 */
        const modeSel = prefSelect([
            { v: 'light', label: tn('apLight', '浅色') },
            { v: 'dark', label: tn('apDark', '暗色') },
            { v: 'system', label: tn('apSystem', '跟随系统') }
        ], localStorage.getItem('cs-theme') || 'system', function (v) {
            localStorage.setItem('cs-theme', v);
            applyTheme();
        });
        modeSel.id = 'apModeSelect';
        card.appendChild(prefInfoRow({ title: tn('apMode', '主题模式'), hint: tn('apModeHint', ''), end: modeSel }));
        /* 扩展主题预览卡：十二套主题（id 不变=CSS 选择器/持久化不动；名与配色随设计定案）。
           limited 字段仅作元数据标注（game=游戏限定 / ip=影视 IP / brand=品牌风格），当前不参与渲染
           —— 按用户要求不加任何限定标识，卡片文案保持纯主题名。 */
        const grid = document.createElement('div');
        grid.className = 'appearance-grid';
        [
            { id: 'modern-minimal', name: tn('optModernMinimal', '现代简约'), bar: '#111827', bg: 'linear-gradient(160deg,#F4F5F7,#FFFFFF)' },
            { id: 'ink-green', name: tn('optInkGreen', '只此青绿'), bar: '#1B6B5A', bg: 'linear-gradient(160deg,#EAF3F0,#F6FAF8)' },
            /* 水墨江南：宣纸暖白底 + 黛瓦墨色条（配色重建后与真实主题一致） */
            { id: 'cinnabar', name: tn('optCinnabar', '水墨江南'), bar: '#2E3438', bg: 'linear-gradient(160deg,#FAF8F4,#F1EDE5)' },
            { id: 'sky-sea', name: tn('optSkySea', '天空与海'), bar: '#2C5F8D', bg: 'linear-gradient(160deg,#E9F0F7,#F5F9FC)' },
            { id: 'nostalgia', name: tn('optNostalgia', '城南旧事'), bar: '#5C4033', bg: 'linear-gradient(160deg,#F2EBE1,#F9F5EF)' },
            /* 万山红遍：暖宣底 + 赭红→橙红条（呼应层林尽染；原磨砂玻璃的蓝紫渐变已退役） */
            { id: 'glass', name: tn('optGlass', '万山红遍'), bar: 'linear-gradient(135deg,#9E3B22,#D2733A)', bg: 'linear-gradient(160deg,#F7F1EA,#FBF8F4)' },
            /* 风花雪月：月白底 + 青莲黛紫条（冷银月白，填补紫调） */
            { id: 'snow-moon', name: tn('optSnowMoon', '风花雪月'), bar: '#4C4570', bg: 'linear-gradient(160deg,#EDF1F8,#F8FAFC)' },
            /* 桃林：淡桃底 + 绛桃木条（暖粉方向） */
            { id: 'peach-grove', name: tn('optPeachGrove', '桃林'), bar: '#94405A', bg: 'linear-gradient(160deg,#FBE9ED,#FEFBFC)' },
            /* 燕云十六声：青灰底 + 青玄条（按游戏官方壁纸实测重建：低饱和冷调）；limited='game' 为游戏限定标注 */
            { id: 'yanyun', name: tn('optYanyun', '燕云十六声'), limited: 'game', bar: '#384E4E', bg: 'linear-gradient(160deg,#DCE8EA,#F5FAFA)' },
            /* 白蛇缘起：白为主、青为辅（侧边栏纯白 + 青碧条；国际版海报「以白青为主」，呼应白蛇之白与青蛇之青） */
            { id: 'white-snake', name: tn('optWhiteSnake', '白蛇缘起'), limited: 'ip', bar: '#357A7A', bg: 'linear-gradient(160deg,#F2F8F8,#FFFFFF)' },
            /* 办公日常：暖中性灰底 + 暖石墨条（桌面/文件柜/便利贴的语义） */
            { id: 'office-daily', name: tn('optOfficeDaily', '办公日常'), bar: '#4E4842', bg: 'linear-gradient(160deg,#EDEEE9,#FCFCFB)' },
            /* 经典QQ：QQ 蓝底 + 经典 QQ 标准蓝 #12B7F5 条（主按钮用正牌 #12B7F5 + 深墨字，见 --btn-primary-text 侧通道） */
            { id: 'qq-classic', name: tn('optQqClassic', '经典QQ'), limited: 'brand', bar: 'linear-gradient(135deg,#12B7F5,#0A6EBD)', bg: 'linear-gradient(160deg,#D3E9F8,#FBFDFE)' }
        ].forEach(function (th) {
            const c = document.createElement('div');
            c.className = 'theme-card';
            c.dataset.themeOpt = th.id;
            c.innerHTML = '<div class="theme-card-preview" style="background:' + th.bg + '">'
                + '<div class="tc-bar" style="background:' + th.bar + '"></div><div class="tc-bar2"></div>'
                + '<div class="tc-body"><i></i><i></i></div>'
                + '<div class="theme-card-check"></div></div>'
                + '<div class="theme-card-name"></div>';
            c.querySelector('.theme-card-name').textContent = th.name;
            if (c.dataset.themeOpt === (localStorage.getItem('cs-theme') || 'system'))
                c.classList.add('selected');
            grid.appendChild(c);
        });
        card.appendChild(grid);
        /* 语言：真实切换（与个人设置语言联动） */
        card.appendChild(prefInfoRow({
            title: tn('apLang', '语言'), hint: tn('apLangHint', ''),
            end: prefSelect([
                { v: 'zh', label: tn('apLangZh', '简体中文') },
                { v: 'en', label: tn('apLangEn', 'English') }
            ], getLang(), function (v) { localStorage.setItem('cs-lang', v); applyLang(); })
        }));
        /* 字体风格：真实应用到根元素（衬线/等宽/无衬线） */
        card.appendChild(prefInfoRow({
            title: tn('apFontStyle', '字体风格'), hint: tn('apLangHint', ''),
            /* 字体档位 = 经典英文字体（拉丁字符）+ 对应中文字体（汉字）的合成栈；
               楷体 KaiTi、宋体 SimSun、华文行楷在本机字体注册表均已实测存在。
               旧值 serif 已退役，读取时迁移为默认黑体。 */
            end: prefSelect([
                { v: 'sans', label: tn('apFontSans', '黑体') },
                { v: 'kai', label: tn('apFontKai', '楷体') },
                { v: 'song', label: tn('apFontSong', '宋体') },
                { v: 'xing', label: tn('apFontXing', '行书') },
                { v: 'mono', label: tn('apFontMono', '等宽') }
            ], (function (s) { const f = s.font; return (f === 'serif' || !f) ? 'sans' : f; })(prefLoad('cs-set-appearance')), function (v) {
                prefPatch('cs-set-appearance', { font: v });
                applyFontStyle(v);
            })
        }));
        /* 界面字号：五档滑条（第三档=标准）。input 事件实时应用 + 即时持久化；
           刻度行标出五档，当前档高亮。 */
        const scaleLabels = [tn('apScale1', '小'), tn('apScale2', '较小'), tn('apScale3', '标准'), tn('apScale4', '较大'), tn('apScale5', '大')];
        /* 刻度与滑块对齐：thumb 固定 16px（.ap-range 自定义外观），第 i 档 thumb 中心
           位于轨道 8px + (宽-16px)×i/4 处，刻度文字按同一公式绝对定位并以中线对齐；
           刻度行与滑条同容器同宽，右侧档位标签独立成列，不参与刻度对齐。 */
        const fontSizeWrap = document.createElement('div');
        fontSizeWrap.style.cssText = 'flex-shrink: 0; min-width: 230px; display: flex; flex-direction: column; gap: 5px;';
        const fontSizeRow = document.createElement('div');
        fontSizeRow.style.cssText = 'display: flex; align-items: center; gap: 10px;';
        const rangeWrap = document.createElement('div');
        rangeWrap.style.cssText = 'flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 3px;';
        const range = document.createElement('input');
        range.type = 'range';
        range.min = '1';
        range.max = '5';
        range.step = '1';
        range.className = 'ap-range';
        range.setAttribute('aria-label', tn('apFontSize', '界面字号'));
        const levelTag = document.createElement('div');
        levelTag.style.cssText = 'flex-shrink: 0; min-width: 36px; text-align: center; font-size: 11.5px; font-weight: 700; color: var(--link);';
        const scaleRow = document.createElement('div');
        scaleRow.style.cssText = 'position: relative; height: 14px;';
        const ticks = scaleLabels.map(function (t2, i) {
            const s = document.createElement('span');
            s.textContent = t2;
            s.style.cssText = 'position: absolute; top: 0; transform: translateX(-50%); white-space: nowrap;'
                + ' left: calc(8px + (100% - 16px) * ' + (i / 4) + ');'
                + ' font-size: 10.5px; font-weight: 500; color: var(--text-3); transition: color 0.15s ease;';
            scaleRow.appendChild(s);
            return s;
        });
        const initLevel = (function (s) { const f = parseInt(s.fontSize, 10); return (f >= 1 && f <= 5) ? f : 3; })(prefLoad('cs-set-appearance'));
        function paintRangeFill(cur) {
            const p = ((cur - 1) / 4) * 100;
            range.style.background = 'linear-gradient(to right, var(--link) ' + p + '%, var(--border) ' + p + '%)';
        }
        function paintScale(cur) {
            levelTag.textContent = scaleLabels[cur - 1];
            ticks.forEach(function (s, i) {
                const on = i === cur - 1;
                s.style.color = on ? 'var(--link)' : 'var(--text-3)';
                s.style.fontWeight = on ? '700' : '500';
            });
            paintRangeFill(cur);
        }
        range.value = String(initLevel);
        fontSizeRow.appendChild(rangeWrap);
        fontSizeRow.appendChild(levelTag);
        rangeWrap.appendChild(range);
        rangeWrap.appendChild(scaleRow);
        paintScale(initLevel);
        range.addEventListener('input', function () {
            const lv = Math.min(5, Math.max(1, parseInt(range.value, 10) || 3));
            applyFontSize(lv);
            prefPatch('cs-set-appearance', { fontSize: lv });
            paintScale(lv);
        });
        /* ⚠️ scaleRow 必须留在 rangeWrap 内（与滑条同宽同位，刻度公式才成立）——
           若 appendChild 到 fontSizeWrap 会把它从 rangeWrap 移走（appendChild 的移动语义），
           刻度行横跨整行（含右侧档位标签区），与滑块行程错位 */
        fontSizeWrap.appendChild(fontSizeRow);
        card.appendChild(prefInfoRow({ title: tn('apFontSize', '界面字号'), hint: tn('apFontSizeHint', ''), end: fontSizeWrap }));
        /* 内容宽度：真实生效（Work 页面内容列最大宽度，改后重挂当前页） */
        const widthSel = prefSelect([
            { v: 'narrow', label: tn('apWidthNarrow', '窄') },
            { v: 'standard', label: tn('apWidthStd', '标准') },
            { v: 'wide', label: tn('apWidthWide', '宽') }
        ], 'standard', function (v) {
            savePrefs({ appearance: { width: v } }).then(function (ok) { if (ok && typeof Work !== 'undefined' && Work.rerender)
                Work.rerender(); });
        });
        card.appendChild(prefInfoRow({ title: tn('apWidth', '内容宽度'), hint: tn('apWidthHint', ''), end: widthSel }));
        ensurePrefs().then(function () {
            widthSel.value = String((CS_PREFS.appearance && CS_PREFS.appearance.width) || 'standard');
        });
        box.appendChild(card);
        /* 挂载后同步预览卡选中态（applyTheme 负责 data-theme-opt 标记） */
        applyTheme();
    }
};
/* 字体风格真实应用：根元素 font-family 五档切换。
   每档 = 经典英文字体（拉丁字符）+ 对应中文字体（汉字）合成；本机已实测齐备：
   KaiTi（楷体）/ SimSun（宋体）/ 华文行楷（STXingkai）/ Segoe Script / Georgia / Cambria。
   ⚠️ 两处关键：
   1. 必须设在 **body** 的内联样式上——body 自身有 CSS font-family: 'Instrument Sans'，
      若只设 html 内联，会被 body 的显式声明阻断继承，界面完全不变（旧实现的真实缺陷）。
   2. mono 档的中文字体必须排在 monospace 关键字之前，否则中文被系统等宽字体（宋体族）接走。 */
function applyFontStyle(v) {
    const root = document.body;
    if (v === 'kai')
        root.style.fontFamily = 'Cambria, Georgia, KaiTi, "楷体", "华文楷体", serif';
    else if (v === 'song')
        root.style.fontFamily = 'Georgia, "Times New Roman", SimSun, "宋体", serif';
    else if (v === 'xing')
        root.style.fontFamily = '"Segoe Script", "华文行楷", "STXingkai", cursive';
    else if (v === 'mono')
        root.style.fontFamily = '"Cascadia Mono", "Cascadia Code", Consolas, "Courier New", "Microsoft YaHei", "微软雅黑", monospace';
    else
        root.style.fontFamily = ''; /* sans（默认）：清空内联，回落到样式表的黑体默认栈 */
}
/* 启动即应用持久化的字体选择（此前只在设置页改动时应用，重启后失效）；旧值 serif 迁移为默认黑体 */
applyFontStyle((function (s) { const f = s.font; return (f === 'serif' || !f) ? 'sans' : f; })(prefLoad('cs-set-appearance')));
/* ---- 界面字号：五档 body 缩放（0.9/0.95/1/1.05/1.1，第三档=标准）----
   用 CSS zoom 而非 rem/逐点改字号：项目字号大量内联 px，zoom 让文字与布局等比缩放，
   全局一处生效且视觉协调（阅读器 textScale 已有同款实践）。 */
const FONT_SCALES = [0.9, 0.95, 1, 1.05, 1.1];
function fontZoomOf(level) {
    const i = Math.min(5, Math.max(1, parseInt(level, 10) || 3)) - 1;
    return FONT_SCALES[i];
}
function applyFontSize(level) {
    document.body.style.zoom = String(fontZoomOf(level));
}
/* fixed 菜单的 zoom 坐标校准：body 设 zoom 后，getBoundingClientRect 返回视觉坐标，
   而设置 style.left 等写入的是本地 CSS 坐标——两者的比值随 Chromium 版本/上下文而异，
   不做假设，用一次性探针实测比值 k（视觉 = CSS × k），定位一律除以 k。
   校准结果按当前 zoom 值缓存。prefSelect 菜单与加号菜单（work bundle）共用。 */
let CS_ZOOM_K = 1;
let CS_ZOOM_K_FOR = null;
function csViewportK() {
    const z = document.body.style.zoom || '';
    if (CS_ZOOM_K_FOR === z)
        return CS_ZOOM_K;
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:100px;top:100px;width:10px;height:10px;visibility:hidden;pointer-events:none;';
    document.body.appendChild(probe);
    const r = probe.getBoundingClientRect();
    CS_ZOOM_K = (r.left && Math.abs(r.left - 100) > 0.5) ? (r.left / 100) : 1;
    probe.remove();
    CS_ZOOM_K_FOR = z;
    return CS_ZOOM_K;
}
/* 启动即应用持久化的字号档位（1..5，缺省第三档标准） */
applyFontSize((function (s) { const f = parseInt(s.fontSize, 10); return (f >= 1 && f <= 5) ? f : 3; })(prefLoad('cs-set-appearance')));
/* ============ Toast ============ */
const toast = document.getElementById('toast');
let toastTimer = null;
function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
}
/* ============ 模型配置（表单已迁入设置页 #settingsModelsPanel，控件 ID 不变） ============ */
const providerBtn = document.getElementById('providerBtn');
const providerLabel = document.getElementById('providerLabel');
const providerMenu = document.getElementById('providerMenu');
const modelPickBtn = document.getElementById('modelPickBtn');
const modelPickLabel = document.getElementById('modelPickLabel');
const modelPickMenu = document.getElementById('modelPickMenu');
const customFields = document.getElementById('customFields');
const customModelId = document.getElementById('customModelId');
const customModelName = document.getElementById('customModelName');
const apiKeyInput = document.getElementById('apiKeyInput');
const ctxRow = document.getElementById('ctxRow');
const ctxValue = document.getElementById('ctxValue');
const visionRow = document.getElementById('visionRow');
const visionValue = document.getElementById('visionValue');
const webRow = document.getElementById('webRow');
const webValue = document.getElementById('webValue');
const webNote = document.getElementById('webNote');
const modalError = document.getElementById('modalError');
let pickedProvider = null;
let pickedModel = null;
function toggleMenu(menu, btn) {
    const isOpen = menu.style.display === 'block';
    document.querySelectorAll('#providerMenu, #modelPickMenu').forEach(function (m) { if (m !== menu)
        m.style.display = 'none'; });
    menu.style.display = isOpen ? 'none' : 'block';
    return !isOpen;
}
providerBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (toggleMenu(providerMenu, providerBtn))
        renderProviderMenu();
});
function renderProviderMenu() {
    providerMenu.innerHTML = '';
    PROVIDERS.forEach(function (provider) {
        const row = document.createElement('div');
        row.className = 'menu-item';
        row.style.cssText = 'padding: 9px 12px; border-radius: 9px; display: flex; flex-direction: column; gap: 2px;' + (pickedProvider && pickedProvider.id === provider.id ? ' background: var(--accent-soft);' : '');
        const line1 = document.createElement('div');
        line1.textContent = provider.name;
        line1.style.cssText = 'color: var(--text-1); font-size: 12.5px; font-weight: 600;';
        const line2 = document.createElement('div');
        line2.textContent = provider.models.length + ' ' + t('model');
        line2.style.cssText = 'color: var(--text-3); font-size: 11px;';
        row.appendChild(line1);
        row.appendChild(line2);
        row.addEventListener('click', function (e) {
            e.stopPropagation();
            pickedProvider = provider;
            pickedModel = null;
            providerLabel.textContent = provider.name;
            providerLabel.style.color = 'var(--text-1)';
            modelPickLabel.textContent = t('pickModel');
            modelPickLabel.style.color = 'var(--text-3)';
            customFields.style.display = 'none';
            customModelId.value = '';
            customModelName.value = '';
            providerMenu.style.display = 'none';
            updateModalInfo();
        });
        providerMenu.appendChild(row);
    });
}
function isCustomModel() { return pickedModel && pickedModel.custom; }
function updateModalInfo() {
    if (!pickedProvider) {
        ctxRow.style.display = 'none';
        visionRow.style.display = 'none';
        webRow.style.display = 'none';
        return;
    }
    webRow.style.display = 'flex';
    const modelWebOff = pickedModel && pickedModel.web === false;
    if (!pickedProvider.webSearch) {
        webValue.textContent = t('notSupported');
        webValue.style.color = 'var(--text-3)';
        webNote.style.display = 'block';
        webNote.textContent = getLang() === 'zh' ? pickedProvider.webNoteZh : pickedProvider.webNoteEn;
    }
    else if (modelWebOff) {
        webValue.textContent = t('notSupported');
        webValue.style.color = 'var(--text-3)';
        webNote.style.display = 'block';
        webNote.textContent = t('webModelOff');
    }
    else {
        webValue.textContent = t('webOn');
        webValue.style.color = '#16A34A';
        webNote.style.display = 'none';
    }
    if (pickedModel && !isCustomModel()) {
        ctxRow.style.display = 'flex';
        ctxValue.textContent = pickedModel.ctx;
        visionRow.style.display = 'flex';
        visionValue.textContent = pickedModel.vision ? t('supported') : t('notSupported');
        visionValue.style.color = pickedModel.vision ? '#16A34A' : 'var(--text-3)';
    }
    else {
        ctxRow.style.display = 'none';
        visionRow.style.display = 'none';
    }
}
modelPickBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!pickedProvider)
        return;
    if (!toggleMenu(modelPickMenu, modelPickBtn))
        return;
    modelPickMenu.innerHTML = '';
    pickedProvider.models.forEach(function (model) {
        const row = document.createElement('div');
        row.className = 'menu-item';
        row.style.cssText = 'padding: 9px 12px; border-radius: 9px; display: flex; flex-direction: column; gap: 2px;';
        const line1 = document.createElement('div');
        line1.textContent = model.name;
        line1.style.cssText = 'color: var(--text-1); font-size: 12.5px; font-weight: 600;';
        const line2 = document.createElement('div');
        line2.textContent = model.id + ' · ' + model.ctx + (model.vision ? ' · ' + t('vision') : '');
        line2.style.cssText = 'color: var(--text-3); font-size: 11px;';
        row.appendChild(line1);
        row.appendChild(line2);
        row.addEventListener('click', function (e) {
            e.stopPropagation();
            pickedModel = model;
            modelPickLabel.textContent = model.name;
            modelPickLabel.style.color = 'var(--text-1)';
            customFields.style.display = 'none';
            modelPickMenu.style.display = 'none';
            updateModalInfo();
        });
        modelPickMenu.appendChild(row);
    });
    const divider = document.createElement('div');
    divider.style.cssText = 'height: 1px; background: var(--border-soft); margin: 4px 6px;';
    modelPickMenu.appendChild(divider);
    const customRow = document.createElement('div');
    customRow.className = 'menu-item';
    customRow.style.cssText = 'padding: 9px 12px; border-radius: 9px; color: var(--text-2); font-size: 12.5px; font-weight: 500;';
    customRow.textContent = t('custom');
    customRow.addEventListener('click', function (e) {
        e.stopPropagation();
        pickedModel = { custom: true, id: '', name: '', ctx: '—', ctxTokens: 131072, maxOutTokens: null, vision: false };
        modelPickLabel.textContent = t('custom');
        modelPickLabel.style.color = 'var(--text-1)';
        customFields.style.display = 'flex';
        modelPickMenu.style.display = 'none';
        updateModalInfo();
        customModelId.focus();
    });
    modelPickMenu.appendChild(customRow);
});
/* 原 openModal/closeModal 与 modalClose/modalCancel/背景点击监听已随弹窗退役：
   所有入口统一改为 openSettings('models') */
/* ============ 已配置模型列表 ============ */
function getModels() { try {
    return JSON.parse(localStorage.getItem('cs-models') || '[]');
}
catch (e) {
    return [];
} }
function saveModels(list) { localStorage.setItem('cs-models', JSON.stringify(list)); }
let activeModelKey = localStorage.getItem('cs-active-model') || null;
document.getElementById('modalSave').addEventListener('click', function () {
    const key = apiKeyInput.value.trim();
    if (!pickedProvider || !pickedModel || !key) {
        modalError.textContent = t('errPick');
        modalError.style.display = 'block';
        return;
    }
    let modelId = pickedModel.id;
    let modelName = pickedModel.name;
    if (isCustomModel()) {
        modelId = customModelId.value.trim();
        modelName = customModelName.value.trim() || modelId;
        if (!modelId) {
            modalError.textContent = t('errCustom');
            modalError.style.display = 'block';
            return;
        }
    }
    const list = getModels();
    const entry = {
        key: pickedProvider.id + '/' + modelId + '/' + Date.now(),
        providerId: pickedProvider.id, providerName: pickedProvider.name,
        modelId: modelId, name: modelName,
        ctx: pickedModel.ctx, ctxTokens: pickedModel.ctxTokens, vision: pickedModel.vision,
        web: pickedProvider.webSearch && pickedModel.web !== false,
        apiKey: key,
        temperature: document.getElementById('tempInput').value,
        maxInTokens: parseInt(document.getElementById('maxInInput').value, 10) || pickedModel.ctxTokens || null,
        maxOutTokens: parseInt(document.getElementById('maxOutInput').value, 10) || pickedModel.maxOutTokens || null
    };
    list.push(entry);
    saveModels(list);
    activeModelKey = entry.key;
    localStorage.setItem('cs-active-model', activeModelKey);
    apiKeyInput.value = '';
    document.getElementById('maxInInput').value = '';
    document.getElementById('maxOutInput').value = '';
    pickedProvider = null;
    pickedModel = null;
    providerLabel.textContent = t('pickProvider');
    providerLabel.style.color = 'var(--text-3)';
    modelPickLabel.textContent = t('pickModel');
    modelPickLabel.style.color = 'var(--text-3)';
    customFields.style.display = 'none';
    customModelId.value = '';
    customModelName.value = '';
    updateModalInfo();
    refreshModelMenu();
    renderModelManage();
    showToast(t('toastAdded'));
});
function refreshModelMenu() {
    const menu = document.getElementById('modelMenu');
    const label = document.getElementById('modelLabel');
    const list = getModels();
    const active = list.find(function (m) { return m.key === activeModelKey; });
    if (active) {
        label.textContent = active.name;
        label.style.color = 'var(--text-1)';
    }
    else {
        label.textContent = t('selectModel');
        label.style.color = 'var(--text-3)';
    }
    menu.innerHTML = '';
    list.forEach(function (m) {
        const row = document.createElement('div');
        row.className = 'menu-item';
        row.style.cssText = 'padding: 9px 12px; border-radius: 9px; display: flex; flex-direction: column; gap: 2px;' + (m.key === activeModelKey ? ' background: var(--accent-soft);' : '');
        const line1 = document.createElement('div');
        line1.textContent = m.name;
        line1.style.cssText = 'color: var(--text-1); font-size: 12.5px; font-weight: 600;';
        const line2 = document.createElement('div');
        line2.textContent = m.providerName + ' · ' + m.ctx + (m.web ? ' · ' + t('webSearch') : '');
        line2.style.cssText = 'color: var(--text-3); font-size: 11px;';
        row.appendChild(line1);
        row.appendChild(line2);
        row.addEventListener('click', function (e) {
            e.stopPropagation();
            activeModelKey = m.key;
            localStorage.setItem('cs-active-model', activeModelKey);
            refreshModelMenu();
            modelSelect.classList.remove('open');
        });
        menu.appendChild(row);
    });
    if (list.length === 0) {
        const hint = document.createElement('div');
        hint.className = 'menu-item';
        hint.style.cssText = 'padding: 9px 12px; border-radius: 9px; color: var(--text-2); font-size: 12.5px; font-weight: 500;';
        hint.textContent = t('addModelHint');
        hint.addEventListener('click', function (e) { e.stopPropagation(); openSettings('models'); });
        menu.appendChild(hint);
    }
}
/* ============ 会话（内存态） ============ */
const chatScroll = document.getElementById('chatScroll');
let convSeq = 1;
const conversations = [];
let activeConvId = null;
let draft = null;
/* AI 阅读模式：按文件的独立讨论线程（与 Work/Chat 会话完全无关） */
const readThreads = {};
var readThinkingOn = null; /* 阅读模式深度思考开关（会话级，初始跟随 Chat 开关） */
var readPendAttach = []; /* 本轮待发送附件：{name, kind, data} */
var readAttachChipsHost = null;
function readThreadKey(source, ref) {
    if (source === 'kb')
        return 'kb:' + (ref.kbId || 'x') + ':' + ref.fileName;
    if (source === 'ws')
        return 'ws:' + (ref.path || ref.fileName);
    const p = getCtxProject();
    return (p ? 'proj:' + p.id : 'conv:' + (activeConvId || 'x')) + ':' + ref.fileName;
}
function currentConv() {
    if (activeConvId === 'draft')
        return draft;
    return conversations.find(function (c) { return c.id === activeConvId; });
}
function playSwap() {
    const body = document.querySelector('.chat-body');
    if (!body)
        return;
    body.classList.remove('swap-anim');
    void body.offsetWidth;
    body.classList.add('swap-anim');
}
function demoMessages() {
    return [
        { role: 'user', text: t('demoUserText') },
        { role: 'ai', text: t('demoAiText'), refs: true }
    ];
}
function createConversation(title, messages) {
    const now = Date.now();
    const conv = { id: 'c' + now + Math.random().toString(36).slice(2, 6), title: title, messages: messages || [], isNew: !messages || messages.length === 0, createdAt: now, updatedAt: now, star: false, pinned: false, mode: 'chat', agentId: null, localFiles: [], kbFiles: [], dbs: [], docCtx: null };
    conversations.unshift(conv);
    return conv;
}
let projects = [];
let view = 'chat';
function renderHeader(main, sub) {
    const pt = document.getElementById('pageTitle');
    if (!pt || readMode)
        return;
    pt.innerHTML = '';
    const mainEl = document.createElement('div');
    mainEl.textContent = main;
    mainEl.style.cssText = 'color: var(--text-1); font-size: 18px; font-weight: 700; letter-spacing: -0.02em;';
    pt.appendChild(mainEl);
    if (sub) {
        const subEl = document.createElement('div');
        subEl.textContent = sub;
        subEl.style.cssText = 'margin-top: 2px; color: var(--text-3); font-size: 12px; font-weight: 500;';
        pt.appendChild(subEl);
    }
}
function renderHeaderForConv(conv) {
    if (!conv) {
        renderHeader('', '');
        return;
    }
    const proj = conv.projectId ? projects.find(function (p) { return p.id === conv.projectId; }) : null;
    if (proj)
        renderHeader(proj.name, conv.title);
    else
        renderHeader(conv.title, '');
}
function startDraft(projectId) {
    /* 已处于该模式的新对话初始页时不再响应（静止不动，不重建、不播动画） */
    if (activeConvId === 'draft' && draft && view === 'chat' && (draft.projectId || null) === (projectId || null) && draft.messages.length === 0) {
        chatInput.focus();
        return;
    }
    const now = Date.now();
    const proj = projectId ? projects.find(function (p) { return p.id === projectId; }) : null;
    const draftMode = proj ? (proj.mode || sidebarMode) : sidebarMode;
    const defAgent = (draftMode === 'work' && typeof window.defaultAgentId === 'function') ? window.defaultAgentId() : null;
    draft = { id: 'draft-' + now, title: t('newConvName'), messages: [], isNew: true, projectId: projectId || null, createdAt: now, updatedAt: now, star: false, pinned: false, mode: draftMode, agentId: defAgent, localFiles: [], kbFiles: [], dbs: [], docCtx: null };
    /* Work 项目下的新任务：即时生成本任务记忆文档（后端幂等） */
    if (proj)
        csMemoryEnsureTask(proj, draft.id, draft.title);
    activeConvId = 'draft';
    view = 'chat';
    renderConversations();
    renderProjects();
    renderRightPanel();
    renderMessages();
    chatInput.focus();
}
/* ---- Chat / Work 模式切换 ---- */
let sidebarMode = 'chat';
function modeActionItems() {
    return [
        { id: 'newChatBtn', icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', label: sidebarMode === 'work' ? t('workNewTask') : t('newChat'), action: function () { startDraft(null); } },
        { id: 'createProjectBtn', icon: '<path d="M12 10v6"/><path d="M9 13h6"/><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>', label: t('createProject'), action: function () { if (view === 'newProject')
                return; view = 'newProject'; renderConversations(); renderMessages(); playSwap(); } },
        { id: 'papersDbBtn', icon: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>', label: t('papersDb'), action: function () { openPapersDb(); } }
    ];
}
function renderModeActions(animate) {
    const wrap = document.getElementById('modeActions');
    if (!wrap)
        return;
    wrap.innerHTML = '';
    const items = modeActionItems();
    /* Work 专属入口由 work 模块提供；未构建（直接打开源文件）时只有上面三项基础入口 */
    if (sidebarMode === 'work' && WORK_HOOKS.sidebarItems) {
        const extra = WORK_HOOKS.sidebarItems();
        if (Array.isArray(extra))
            items.push.apply(items, extra);
    }
    /* 2026-09-16：Chat/Work 切换用水平方向平滑过渡（侧滑淡入）。
       所有选项组件同一关键帧、同一时长、零延迟同步平移，消除先后错落感。
       animate=false（首次启动/同步刷新）时不加动画——侧栏立即出现。 */
    items.forEach(function (item, i) {
        const row = document.createElement('div');
        row.id = item.id;
        row.className = 'conv-item';
        if (animate) {
            /* 水平滑入：Work 从右、Chat 从左；同屏高度稳定不跳动 */
            const fromX = sidebarMode === 'work' ? 18 : -18;
            row.style.cssText = 'align-self: stretch; margin-bottom: 4px; padding: 9px 10px; border-radius: 10px; display: flex; justify-content: flex-start; align-items: center; gap: 10px; cursor: pointer; animation: csModeSlide 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; --cs-slide-x: ' + fromX + 'px;';
        }
        else {
            row.style.cssText = 'align-self: stretch; margin-bottom: 4px; padding: 9px 10px; border-radius: 10px; display: flex; justify-content: flex-start; align-items: center; gap: 10px; cursor: pointer;';
        }
        const icon = document.createElement('div');
        icon.style.cssText = 'width: 16px; height: 16px; color: var(--text-2); flex-shrink: 0;';
        icon.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + item.icon + '</svg>';
        const label = document.createElement('div');
        label.textContent = item.label;
        label.style.cssText = 'color: var(--text-1); font-size: 13.5px; font-weight: 600; word-wrap: break-word;';
        row.appendChild(icon);
        row.appendChild(label);
        row.addEventListener('click', item.action);
        wrap.appendChild(row);
    });
    renderRailActions(items);
}
/* 竖条图标栏（左栏收起态）：与侧栏功能一一对应；点击只执行动作，保持收起态 */
function renderRailActions(items) {
    const rail = document.getElementById('railActions');
    if (!rail)
        return;
    rail.innerHTML = '';
    items.forEach(function (item) {
        const b = document.createElement('div');
        b.className = 'rail-btn';
        b.title = item.label;
        b.innerHTML = '<div style="width: 17px; height: 17px;"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + item.icon + '</svg></div>';
        b.addEventListener('click', function (e) {
            e.stopPropagation();
            item.action();
        });
        rail.appendChild(b);
    });
}
/* 会话级：Work 会话是否绑定了带文件夹的项目（未绑定 = 发送时转 Chat） */
function convHasWorkspace(conv) {
    if (!conv || conv.mode !== 'work')
        return true;
    const p = conv.projectId ? projects.find(function (x) { return x.id === conv.projectId; }) : null;
    return !!(p && p.folder);
}
function setSidebarMode(mode) {
    if (sidebarMode === mode)
        return;
    /* Chat/Work 自由切换：无工作区也允许进入 Work——输入框侧有「选择工作区」
       入口（updateWorkspaceUI），未选工作区直接发消息时 sendMessage 会静默
       降级为 Chat（convHasWorkspace 分支），链路自洽，无需在切换处拦截。 */
    sidebarMode = mode;
    const now = Date.now();
    draft = { id: 'draft-' + now, title: t('newConvName'), messages: [], isNew: true, projectId: null, createdAt: now, updatedAt: now, star: false, pinned: false, mode: mode, agentId: null, localFiles: [], kbFiles: [], dbs: [], docCtx: null };
    activeConvId = 'draft';
    view = 'chat';
    renderModeActions(true);
    renderProjects();
    renderConversations();
    renderRightPanel();
    renderMessages();
    /* 2026-09-16：模式切换不再对内容区播 fadeSwap（自下而上）——
       输入框要求始终静态；水平过渡由侧栏 csModeSlide 承担，
       欢迎区由 .empty-state 自带 msgIn 动画（问候动画保留）。
       项目/对话列表与导航项同步平移：同一关键帧、零延迟，整体一致。 */
    const sb = document.getElementById('sidebarScroll');
    if (sb) {
        sb.style.setProperty('--cs-slide-x', (mode === 'work' ? 18 : -18) + 'px');
        sb.classList.remove('cs-sync-slide');
        void sb.offsetWidth; /* 强制重排以重播动画 */
        sb.classList.add('cs-sync-slide');
        setTimeout(function () { sb.classList.remove('cs-sync-slide'); }, 600);
    }
    updateModeSwitcher();
}
function updateModeSwitcher() {
    const indicator = document.getElementById('modeIndicator');
    if (indicator)
        indicator.style.transform = sidebarMode === 'work' ? 'translateX(100%)' : 'translateX(0)';
    document.querySelectorAll('#modeSwitcher .mode-seg').forEach(function (seg) {
        seg.classList.toggle('selected', seg.dataset.mode === sidebarMode);
    });
}
/* ---- 左栏展开/收起：手动收起变竖条图标栏（图二）；阅读模式完全隐藏 ----
   宽度/滑动动画仅在按钮、全局快捷键、阅读模式进出时启用 */
function setLeftPanelHidden(hide, showReopen) {
    const lp = document.getElementById('leftPanel');
    if (!lp)
        return;
    lp.classList.add('anim');
    if (hide) {
        lp.classList.remove('rail');
        lp.classList.remove('rail-done');
    }
    lp.classList.toggle('hidden', hide);
    const reopen = document.getElementById('leftReopenBtn');
    if (reopen)
        reopen.style.display = (hide && showReopen !== false) ? 'flex' : 'none';
    setTimeout(function () { lp.classList.remove('anim'); }, 340);
}
function setLeftRail(on) {
    const lp = document.getElementById('leftPanel');
    if (!lp)
        return;
    lp.classList.add('anim');
    lp.classList.remove('hidden');
    /* 收起：内容立即隐藏只留图标栏（无残影）；展开：内容立即恢复 */
    lp.classList.toggle('rail', on);
    lp.classList.toggle('rail-done', on);
    const reopen = document.getElementById('leftReopenBtn');
    if (reopen)
        reopen.style.display = 'none';
    setTimeout(function () { lp.classList.remove('anim'); }, 340);
}
function toggleLeftPanel() {
    setLeftRail(!document.getElementById('leftPanel').classList.contains('rail'));
}
document.getElementById('leftCollapseBtn').addEventListener('click', function () { toggleLeftPanel(); });
document.getElementById('leftReopenBtn').addEventListener('click', function () { setLeftRail(false); });
document.getElementById('leftExpandBtn').addEventListener('click', function () { setLeftRail(false); });
if (window.csDesktop && csDesktop.onLeftPanelToggle) {
    csDesktop.onLeftPanelToggle(function () { toggleLeftPanel(); });
}
/* ---- 自绘标题栏窗口控制（纯浏览器模式隐藏占位）---- */
(function () {
    const tb = document.getElementById('winTitlebar');
    const desk = window.csDesktop;
    if (!desk || !desk.winMinimize) {
        tb.style.display = 'none';
        document.body.style.paddingTop = '0';
        document.documentElement.style.setProperty('--titlebar-h', '0px');
        return;
    }
    document.getElementById('wtMin').addEventListener('click', function () { desk.winMinimize(); });
    document.getElementById('wtMax').addEventListener('click', function () { desk.winMaximizeToggle(); });
    document.getElementById('wtClose').addEventListener('click', function () { desk.winClose(); });
    if (desk.onMaxChanged)
        desk.onMaxChanged(function (max) {
            document.getElementById('wtMaxIco').innerHTML = max
                ? '<rect x="0.5" y="3.5" width="8" height="8" rx="1.2"/><path d="M2.8 3.3V2.5a1.2 1.2 0 0 1 1.2-1.2h5.6a1.2 1.2 0 0 1 1.2 1.2v5.6a1.2 1.2 0 0 1-1.2 1.2h-.8"/>'
                : '<rect x="1.5" y="1.5" width="9" height="9" rx="1.5"/>';
        });
})();
const modeSwitcher = document.getElementById('modeSwitcher');
modeSwitcher.addEventListener('click', function (e) {
    const seg = e.target.closest('.mode-seg');
    if (!seg)
        return;
    setSidebarMode(seg.dataset.mode);
});
/* ---- Work 模式扩展点 ----
   Work 功能实现在 01/work/*.js（build.js 内联为本文件之后的独立 script）。
   主脚本只声明挂载点：页面构建器把节点注册进 WORK_HOOKS.pages，侧栏/发送链路/
   消息渲染各处按 hook 是否存在决定走 Work 实现还是原 Chat 逻辑。
   未构建（直接双击打开源文件）时 hook 为空，页面显示"模块未加载"而非报错。 */
const WORK_HOOKS = {
    pages: {}, /* view -> function() { return { node, title, desc, wide } } */
    sidebarItems: null, /* () -> [{ id, icon, label, action }] */
    runTurn: null, /* (conv, aiMsg) -> true 表示 Work 已接管本轮 AI 回复 */
    messageRowExtra: null, /* (m, idx) -> Node | null（工具调用轨迹） */
    emptyStatePills: null, /* (mode) -> [{ key, bg, color, icon, action }] | null */
    convBadge: null /* (conv) -> string | null（会话行 meta 追加内容） */
};
function workFallbackNode(page, err) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'width: 100%; max-width: 560px; margin: 6vh auto 0; padding: 20px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; display: flex; flex-direction: column; gap: 10px;';
    const head = document.createElement('div');
    head.textContent = err ? t('workPageFailed') : t('workModuleMissing');
    head.style.cssText = 'color: var(--text-1); font-size: 14px; font-weight: 600;';
    const body = document.createElement('div');
    body.textContent = err ? String(err.message || err) : t('workModuleMissingHint');
    body.style.cssText = 'color: var(--text-2); font-size: 12.5px; line-height: 20px; font-family: var(--mono); word-break: break-all;';
    wrap.appendChild(head);
    wrap.appendChild(body);
    return wrap;
}
/* 统一解析 Work 页面：hook 抛错时降级为错误卡片，不让单页故障波及整个应用 */
function buildWorkPage(page) {
    const hook = WORK_HOOKS.pages[page];
    if (!hook)
        return { node: workFallbackNode(page, null), title: page, desc: '', wide: false };
    try {
        const r = hook() || {};
        return {
            node: r.node || workFallbackNode(page, null),
            title: r.title || page,
            desc: r.desc || '',
            wide: !!r.wide
        };
    }
    catch (e) {
        console.error('[work] page "' + page + '" 构建失败:', e);
        return { node: workFallbackNode(page, e), title: page, desc: '', wide: false };
    }
}
function openWorkPage(page) {
    /* 迁移兼容路由（07-设置页改造.md §4）：智能体/沙箱/笔记本/运行 的唯一挂载点
       在设置页——旧调用点（pills、页内跳转、历史深链）统一转发，不落中心视图 */
    const migrated = { 'work-agents': 'agents', 'work-sandbox': 'sandbox', 'work-notebook': 'notebook', 'work-run': 'run' };
    if (migrated[page]) {
        openSettings(migrated[page]);
        return;
    }
    if (view === page)
        return;
    view = page;
    renderConversations();
    renderProjects();
    renderMessages();
    playSwap();
}
/* ---- Work 工作区（本地文件夹）与 Agent 切换 ---- */
/* 项目记忆就绪（尽力而为）：项目创建/任务创建时通知后端生成记忆文件夹与任务
   md；后端 agent/run 侧也有幂等就绪保障，这里失败静默忽略（记忆是增强不是闸门）。 */
function csMemoryPost(p, body) {
    try {
        if (!window.CS_BACKEND)
            return;
        fetch(window.CS_BACKEND.base + p, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + window.CS_BACKEND.token },
            body: JSON.stringify(body)
        }).catch(function () { });
    }
    catch (e) { /* 忽略 */ }
}
function csMemoryEnsureProject(proj) {
    if (!proj || proj.mode !== 'work')
        return;
    csMemoryPost('/api/work/memory/project', { projectId: proj.id, name: proj.name });
}
function csMemoryEnsureTask(proj, taskId, title) {
    if (!proj || proj.mode !== 'work' || !taskId)
        return;
    csMemoryEnsureProject(proj);
    csMemoryPost('/api/work/memory/task', { projectId: proj.id, projectName: proj.name, taskId: taskId, title: title || '' });
}
function currentWorkspaceProject() {
    const conv = currentConv();
    if (!conv || !conv.projectId)
        return null;
    return projects.find(function (p) { return p.id === conv.projectId && p.mode === 'work' && p.folder; }) || null;
}
function workAgents() {
    return (window.CS_WORK && window.CS_WORK.state && window.CS_WORK.state.agents) || [];
}
/* ---- 下拉菜单门户：弹出层挂到 body 用 fixed 定位，
        绕开 .input-box 的 overflow 裁剪（向上弹的菜单会被裁成不可见/不可点） ---- */
function openDropdownMenu(btn, menu) {
    if (!btn || !menu)
        return;
    if (menu.parentElement !== document.body) {
        menu._home = menu.parentElement;
        document.body.appendChild(menu);
    }
    const r = btn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.left = Math.round(Math.max(6, Math.min(r.left, window.innerWidth - 200))) + 'px';
    menu.style.top = 'auto';
    menu.style.bottom = Math.round(window.innerHeight - r.top + 6) + 'px';
    menu.style.display = 'block';
}
function closeDropdownMenu(menu) {
    if (!menu)
        return;
    menu.style.display = 'none';
    if (menu._home && menu._home.isConnected) {
        menu._home.appendChild(menu);
        menu.style.position = '';
        menu.style.left = '';
        menu.style.top = '';
        menu.style.bottom = '';
    }
}
/* ---- Work 权限模式下拉（Qoder Agent SDK 五档；无边框，Agent 与工作区之间） ---- */
var PERMISSION_MODES_UI = [
    { id: 'default', label: '默认确认' },
    { id: 'acceptEdits', label: '自动接受编辑' },
    { id: 'auto', label: '自动执行' },
    { id: 'plan', label: '计划模式' },
    { id: 'dontAsk', label: '免确认' }
];
function updatePermissionUI() {
    var btn = document.getElementById('permSelectBtn');
    var lab = document.getElementById('permSelectLabel');
    var menu = document.getElementById('permSelectMenu');
    if (!btn || !lab || !menu)
        return;
    var show = sidebarMode === 'work';
    btn.style.display = show ? 'flex' : 'none';
    if (!show) {
        menu.style.display = 'none';
        return;
    }
    var conv = currentConv();
    var cur = (conv && conv.permissionMode) || 'default';
    var hit = PERMISSION_MODES_UI.find(function (m) { return m.id === cur; }) || PERMISSION_MODES_UI[0];
    lab.textContent = hit.label;
    menu.innerHTML = '';
    PERMISSION_MODES_UI.forEach(function (m) {
        var row = document.createElement('div');
        row.className = 'menu-item';
        row.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 7px 9px; border-radius: 8px;';
        var dot = document.createElement('div');
        dot.style.cssText = 'width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; background: ' + (m.id === cur ? 'var(--accent-text)' : 'var(--border)') + ';';
        var nm = document.createElement('div');
        nm.style.cssText = 'color: var(--text-1); font-size: 12.5px; font-weight: 500; flex: 1 1 0; white-space: nowrap;';
        nm.textContent = m.label;
        row.appendChild(dot);
        row.appendChild(nm);
        row.addEventListener('click', function (e) {
            e.stopPropagation();
            var c2 = currentConv();
            if (c2)
                c2.permissionMode = m.id;
            closeDropdownMenu(menu);
            updatePermissionUI();
        });
        menu.appendChild(row);
    });
}
document.getElementById('permSelectBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    var menu = document.getElementById('permSelectMenu');
    var willOpen = menu.style.display !== 'block';
    document.querySelectorAll('.dropdown-menu').forEach(function (m) { if (m.id !== 'permSelectMenu' && m.style.display === 'block')
        closeDropdownMenu(m); });
    if (willOpen)
        openDropdownMenu(document.getElementById('permSelectBtn'), menu);
    else
        closeDropdownMenu(menu);
});
document.addEventListener('click', function (e) {
    var btn = document.getElementById('permSelectBtn');
    var menu = document.getElementById('permSelectMenu');
    if (menu && menu.style.display === 'block' && !(btn && btn.contains(e.target)) && !menu.contains(e.target)) {
        closeDropdownMenu(menu);
    }
});
/* Work 选择器仅展示两个入口：墨道（主Agent，可委派子智能体）与墨析（仅对话）。
   其余内建定义（通用Agent/代码复现/数据分析）保留供主 Agent 调度，不在 UI 展示。 */
var VISIBLE_AGENT_IDS = ['agent-orchestrator', 'agent-discuss'];
var AGENT_ROLE_TAG = { 'agent-orchestrator': '主Agent', 'agent-discuss': '仅对话' };
function agentDisplayName(a) {
    var tag = AGENT_ROLE_TAG[a.id];
    return a.name + (tag ? '（' + tag + '）' : '');
}
function updateAgentSelectUI() {
    var btn = document.getElementById('agentSelectBtn');
    var lab = document.getElementById('agentSelectLabel');
    var menu = document.getElementById('agentSelectMenu');
    if (!btn || !lab || !menu)
        return;
    var show = sidebarMode === 'work';
    btn.style.display = show ? 'flex' : 'none';
    if (!show) {
        menu.style.display = 'none';
        return;
    }
    var conv = currentConv();
    var list = workAgents().filter(function (a) { return VISIBLE_AGENT_IDS.indexOf(a.id) > -1; })
        .sort(function (x, y) { return VISIBLE_AGENT_IDS.indexOf(x.id) - VISIBLE_AGENT_IDS.indexOf(y.id); });
    var cur = (conv && conv.agentId) ? list.find(function (a) { return a.id === conv.agentId; }) : null;
    if (!cur && conv && !conv.agentId)
        cur = list.find(function (a) { return a.id === 'agent-orchestrator'; }) || null;
    lab.textContent = cur ? agentDisplayName(cur) : '墨道（主Agent）';
    /* 菜单内容重建（保持展开状态时同步勾选） */
    var wasOpen = menu.style.display === 'block';
    menu.innerHTML = '';
    list.forEach(function (a) {
        var row = document.createElement('div');
        row.className = 'menu-item';
        row.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 7px 9px; border-radius: 8px;';
        var dot = document.createElement('div');
        dot.style.cssText = 'width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; background: ' + ((conv && conv.agentId === a.id) || (!conv && a.id === 'agent-orchestrator') ? 'var(--accent-text)' : 'var(--border)') + ';';
        var nm = document.createElement('div');
        nm.style.cssText = 'color: var(--text-1); font-size: 12.5px; font-weight: 500; flex: 1 1 0; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
        nm.textContent = agentDisplayName(a);
        row.appendChild(dot);
        row.appendChild(nm);
        row.addEventListener('click', function (e) {
            e.stopPropagation();
            var c2 = currentConv();
            if (c2)
                c2.agentId = a.id;
            menu.style.display = 'none';
            renderConversations();
            updateAgentSelectUI();
        });
        menu.appendChild(row);
    });
    /* 智能体列表未就绪：给可见反馈并强制重拉 bootstrap，避免「点了没反应」 */
    if (!list.length && window.CS_WORK && typeof window.CS_WORK.ready === 'function') {
        var loading = document.createElement('div');
        loading.className = 'menu-item';
        loading.style.cssText = 'padding: 8px 10px; color: var(--text-3); font-size: 12px;';
        loading.textContent = '正在加载智能体…';
        menu.appendChild(loading);
        if (!updateAgentSelectUI._retrying) {
            updateAgentSelectUI._retrying = true;
            window.CS_WORK.ready(true).then(function () {
                updateAgentSelectUI._retrying = false;
                updateAgentSelectUI();
            }).catch(function () {
                updateAgentSelectUI._retrying = false;
                loading.textContent = '智能体加载失败，请重试';
            });
        }
    }
    if (wasOpen)
        menu.style.display = 'block';
}
document.getElementById('agentSelectBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    var menu = document.getElementById('agentSelectMenu');
    if (!menu)
        return;
    var willOpen = menu.style.display !== 'block';
    updateAgentSelectUI();
    if (willOpen)
        openDropdownMenu(document.getElementById('agentSelectBtn'), menu);
    else
        closeDropdownMenu(menu);
});
document.addEventListener('click', function (e) {
    var menu = document.getElementById('agentSelectMenu');
    if (menu && menu.style.display === 'block' && !menu.contains(e.target) && e.target.closest && !e.target.closest('#agentSelectBtn'))
        closeDropdownMenu(menu);
});
function updateWorkspaceUI() {
    const btn = document.getElementById('workspaceBtn');
    const lab = document.getElementById('workspaceLabel');
    if (!btn || !lab)
        return;
    btn.style.display = sidebarMode === 'work' ? 'flex' : 'none';
    const wp = currentWorkspaceProject();
    if (wp) {
        lab.textContent = wp.name;
        btn.title = wp.folder;
        lab.style.color = 'var(--text-1)';
    }
    else {
        lab.textContent = t('wPickWorkspace');
        btn.title = t('wPickWorkspaceTip');
        lab.style.color = 'var(--text-2)';
    }
}
function pickWorkspace() {
    if (!(window.csDesktop && window.csDesktop.selectDirectory)) {
        showToast(t('wNeedDesktop'));
        return;
    }
    window.csDesktop.selectDirectory().then(function (dir) {
        if (!dir)
            return;
        if (dir && dir.error) {
            showToast(t('wPickFail') + '：' + dir.error);
            return;
        }
        if (window.csDesktop.log)
            window.csDesktop.log('workspace picked: ' + dir);
        const name = dir.split(/[\\/]/).filter(Boolean).pop() || dir;
        const project = { id: 'p' + Date.now(), name: name, mode: 'work', folder: dir, files: [], kbFiles: [], dbs: [] };
        projects.push(project);
        csMemoryEnsureProject(project);
        const conv = currentConv();
        if (conv) {
            conv.projectId = project.id;
            conv.mode = 'work';
            conv.agentId = (typeof window.defaultAgentId === 'function') ? window.defaultAgentId() : conv.agentId;
            csMemoryEnsureTask(project, conv.id, conv.title);
        }
        renderProjects();
        renderConversations();
        renderMessages();
        showToast(t('wWorkspaceSet') + '：' + name);
    }).catch(function (e) { showToast(String((e && e.message) || e)); });
}
/* ---- Chat 思考开关（加号右侧，仅 Chat 模式；按模型记忆，默认不思考） ---- */
function chatThinkingKey() { return 'cs-thinking:' + (activeModelKey || 'default'); }
function chatThinkingOn() {
    try {
        return localStorage.getItem(chatThinkingKey()) === '1';
    }
    catch (e) {
        return false;
    }
}
function setChatThinking(on) {
    try {
        localStorage.setItem(chatThinkingKey(), on ? '1' : '0');
    }
    catch (e) { /* 忽略 */ }
}
function updateThinkingUI() {
    var btn = document.getElementById('thinkingBtn');
    if (!btn)
        return;
    var show = sidebarMode === 'chat';
    btn.style.display = show ? 'flex' : 'none';
    var on = show && chatThinkingOn();
    var lb = document.getElementById('thinkingLabel');
    if (lb)
        lb.style.color = on ? 'var(--link)' : 'var(--text-2)';
    btn.style.borderColor = on ? 'var(--link)' : 'var(--border)';
    btn.title = '深度思考：' + (on ? '开（思考过程以小字流式展示）' : '关（Chat 默认不思考）');
}
document.getElementById('thinkingBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    setChatThinking(!chatThinkingOn());
    updateThinkingUI();
});
/* ---- Work 默认智能体 + 输入框 @ / 唤起 ---- */
function defaultAgentId() {
    var list = (window.CS_WORK && window.CS_WORK.state && window.CS_WORK.state.agents) || [];
    var hit = list.find(function (a) { return a.id === "agent-orchestrator"; });
    return (hit || list[0] || {}).id || null;
}
/* 斜杠指令芯片（/ 唤起的技能与连接器），发送时拼进 prompt 前缀 */
var slashPicks = [];
function renderSlashChips() {
    var host = document.getElementById("slashChips");
    if (!host)
        return;
    host.replaceChildren();
    host.style.display = slashPicks.length ? "flex" : "none";
    slashPicks.forEach(function (p, i) {
        var chip = document.createElement("div");
        chip.style.cssText = "padding: 4px 10px; background: var(--accent-soft); border: 1px solid var(--border); border-radius: 999px; display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--text-1); flex-shrink: 0;";
        var span = document.createElement("span");
        span.textContent = (p.kind === "skill" ? "技能 · " : "连接器 · ") + p.label;
        chip.appendChild(span);
        var x = document.createElement("span");
        x.textContent = "×";
        x.style.cssText = "color: var(--text-3); cursor: pointer; font-size: 13px; line-height: 1;";
        x.addEventListener("click", function () { slashPicks.splice(i, 1); renderSlashChips(); });
        chip.appendChild(x);
        host.appendChild(chip);
    });
}
function slashPrefix() {
    if (!slashPicks.length)
        return "";
    var lines = slashPicks.map(function (p) {
        return p.kind === "skill"
            ? "- 本轮请优先调用技能 chatscience-skills:" + p.ref + "（先通过 Skill 工具加载其指南，再按指南执行）。"
            : "- 本轮请优先使用 MCP 服务器 " + p.ref + " 提供的工具完成任务。";
    });
    return "【本轮指定】\n" + lines.join("\n") + "\n\n";
}
/* @ 与 / 唤起面板（输入框上方） */
var pickPanel = null;
function closePickPanel() { if (pickPanel) {
    pickPanel.remove();
    pickPanel = null;
} }
function showPickPanel(mode, query) {
    var input = document.getElementById("chatInput");
    if (!input)
        return;
    closePickPanel();
    var items = [];
    var st = (window.CS_WORK && window.CS_WORK.state) || {};
    if (mode === "agent") {
        (st.agents || []).forEach(function (a) {
            if (query && a.name.indexOf(query) === -1 && a.id.toLowerCase().indexOf(query.toLowerCase()) === -1)
                return;
            items.push({ label: a.name, sub: a.description || "", value: a });
        });
    }
    else {
        (st.skillsList || []).forEach(function (sk) {
            if (st.skills && st.skills[sk.slug] && st.skills[sk.slug].enabled === false)
                return;
            if (query && sk.name.indexOf(query) === -1 && sk.slug.toLowerCase().indexOf(query.toLowerCase()) === -1)
                return;
            items.push({ label: sk.name, sub: sk.description || sk.slug, value: { kind: "skill", ref: sk.slug, label: sk.name } });
        });
        (st.mcpList || []).forEach(function (sv) {
            if (sv.enabled === false)
                return;
            if (query && sv.key.toLowerCase().indexOf(query.toLowerCase()) === -1)
                return;
            items.push({ label: sv.key, sub: "MCP 连接器", value: { kind: "mcp", ref: sv.key, label: sv.key } });
        });
    }
    if (!items.length)
        return;
    var panel = document.createElement("div");
    panel.style.cssText = "position: fixed; z-index: 300; max-height: 280px; overflow-y: auto;"
        + " background: var(--menu-bg); border: 1px solid var(--menu-border); border-radius: 12px; box-shadow: var(--menu-shadow); padding: 6px;";
    var rect = input.getBoundingClientRect();
    panel.style.left = Math.max(12, rect.left + 40) + "px";
    panel.style.width = Math.min(440, Math.max(300, rect.width - 80)) + "px";
    panel.style.bottom = (window.innerHeight - rect.top + 8) + "px";
    items.slice(0, 12).forEach(function (it) {
        var row = document.createElement("div");
        row.className = "menu-item";
        row.style.cssText = "display: flex; flex-direction: column; gap: 2px; padding: 7px 9px; border-radius: 8px;";
        var l1 = document.createElement("div");
        l1.style.cssText = "color: var(--text-1); font-size: 12.5px; font-weight: 600;";
        l1.textContent = (mode === "agent" ? "@ " : "/ ") + it.label;
        var l2 = document.createElement("div");
        l2.style.cssText = "color: var(--text-3); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;";
        l2.textContent = it.sub;
        row.appendChild(l1);
        row.appendChild(l2);
        row.addEventListener("click", function () {
            var pos = input.selectionStart;
            var before = input.value.slice(0, pos);
            var cut = before.replace(/(?:^|\s)(?:@|\/)(?:[\w\u4e00-\u9fff-]*)$/, function (m0) { return /^\s/.test(m0) ? " " : ""; });
            input.value = cut + input.value.slice(pos);
            if (mode === "agent") {
                var conv = currentConv();
                if (conv)
                    conv.agentId = it.value.id;
                renderConversations();
                if (typeof updateAgentSelectUI === 'function')
                    updateAgentSelectUI();
            }
            else {
                if (!slashPicks.some(function (p) { return p.ref === it.value.ref; })) {
                    slashPicks.push(it.value);
                    renderSlashChips();
                }
            }
            closePickPanel();
            input.focus();
        });
        panel.appendChild(row);
    });
    pickPanel = panel;
    document.body.appendChild(panel);
}
(function () {
    var input = document.getElementById("chatInput");
    if (!input)
        return;
    input.addEventListener("input", function () {
        if (sidebarMode !== "work") {
            closePickPanel();
            return;
        }
        var pos = input.selectionStart || 0;
        var before = input.value.slice(0, pos);
        var at = before.match(/(?:^|\s)@([\w\u4e00-\u9fff-]*)$/);
        var sl = before.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);
        if (at)
            showPickPanel("agent", at[1]);
        else if (sl)
            showPickPanel("slash", sl[1]);
        else
            closePickPanel();
    });
    input.addEventListener("keydown", function (e) { if (e.key === "Escape")
        closePickPanel(); });
    document.addEventListener("click", function (e) {
        if (pickPanel && !pickPanel.contains(e.target) && e.target !== input)
            closePickPanel();
    });
})();
/* ---- 知识和数据库视图 ---- */
function fileKindFromName(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf')
        return 'pdf';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].indexOf(ext) > -1)
        return 'img';
    if (ext === 'doc' || ext === 'docx')
        return 'docx';
    if (ext === 'xls' || ext === 'xlsx')
        return 'xlsx';
    if (ext === 'csv')
        return 'csv';
    if (ext === 'md' || ext === 'markdown')
        return 'md';
    if (ext === 'html' || ext === 'htm')
        return 'html';
    return 'txt';
}
function fileIconByKind(kind) {
    if (kind === 'pdf')
        return '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M14 12h4"/><path d="M14 17h4"/>';
    if (kind === 'img')
        return '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-4-4-8 8"/>';
    if (kind === 'docx')
        return '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/>';
    if (kind === 'xlsx' || kind === 'csv')
        return '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13v8"/><path d="M16 13v8"/><path d="M4 13h16"/>';
    return '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>';
}
function fmtDate(ts) {
    const d = new Date(ts);
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
}
const papersDbState = {
    tab: 'kb',
    kbView: null,
    kbSearch: '',
    kbs: [
        {
            id: 'kb1', name: '技术报告', createdAt: Date.now() - 7 * 864e5, updatedAt: Date.now() - 864e5,
            files: [
                { name: 'Muon.pdf', data: null, updatedAt: Date.now() - 864e5 },
                { name: 'DeepSeek-R1.pdf', data: null, updatedAt: Date.now() - 2 * 864e5 },
                { name: 'mHC.pdf', data: null, updatedAt: Date.now() - 2 * 864e5 },
                { name: 'GLM5.3.pdf', data: null, updatedAt: Date.now() - 3 * 864e5 },
                { name: 'Kimi-K3.pdf', data: null, updatedAt: Date.now() - 3 * 864e5 },
                { name: 'DeepSeek-V4.pdf', data: null, updatedAt: Date.now() - 4 * 864e5 },
                { name: 'MiniMax.pdf', data: null, updatedAt: Date.now() - 5 * 864e5 },
                { name: 'DSpark_paper.pdf', data: null, updatedAt: Date.now() - 6 * 864e5 },
                { name: 'Qwen3.8-Next.pdf', data: null, updatedAt: Date.now() - 6 * 864e5 }
            ].map(function (f) { f.kind = fileKindFromName(f.name); return f; })
        },
        { id: 'kb2', name: 'QMind 知识库', files: [], createdAt: Date.now() - 10 * 864e5, updatedAt: Date.now() - 10 * 864e5 }
    ],
    dbs: [
        { name: 'PostgreSQL · research', on: true, pinned: false },
        { name: 'MySQL · lab_data', on: false, pinned: false }
    ]
};
function getKb(kbId) { return papersDbState.kbs.find(function (k) { return k.id === kbId; }) || null; }
function getKbFile(kbId, fileName) {
    const kb = getKb(kbId);
    return kb ? kb.files.find(function (f) { return f.name === fileName; }) || null : null;
}
function touchKb(kbId) { const kb = getKb(kbId); if (kb)
    kb.updatedAt = Date.now(); }
/* 读文件内容入内存：PDF/图片/docx/xlsx → ArrayBuffer，文本类 → text */
function readFileData(file, kind, cb) {
    const r = new FileReader();
    r.onload = function () { cb(r.result); };
    if (kind === 'pdf' || kind === 'img' || kind === 'docx' || kind === 'xlsx') {
        r.readAsArrayBuffer(file);
    }
    else {
        r.readAsText(file);
    }
}
/* 头像共享源：base64 data URL 每次赋给 img.src 都要重新解码（实测 80ms/次），
   转成 Blob URL 只做一次，消息行复用同一 URL 走浏览器图片缓存 */
let _avatarBlobUrl = null;
function sharedAvatarSrc() {
    const el = document.getElementById('sideAvatar');
    if (!el)
        return '';
    const src = el.src || '';
    if (src.indexOf('data:') !== 0)
        return src;
    if (!_avatarBlobUrl) {
        try {
            const parts = src.split(',');
            const mime = (parts[0].match(/data:([^;]+)/) || [])[1] || 'image/png';
            const bin = atob(parts[1]);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++)
                bytes[i] = bin.charCodeAt(i);
            _avatarBlobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
        }
        catch (e) {
            _avatarBlobUrl = src;
        }
    }
    return _avatarBlobUrl;
}
/* ---- 文件字节持久化（IndexedDB） ----
   状态快照会剥离 data 字段（体积原因），重启后 localStorage/快照里只剩元信息；
   字节存 IndexedDB，进入阅读模式时按 dbKey 恢复，保证任意文件点击即可阅读。 */
let _idbPromise = null;
function idbOpen() {
    if (_idbPromise)
        return _idbPromise;
    _idbPromise = new Promise(function (resolve) {
        try {
            const req = indexedDB.open('cs-files', 1);
            req.onupgradeneeded = function () { try {
                req.result.createObjectStore('f');
            }
            catch (e) { } };
            req.onsuccess = function () { resolve(req.result); };
            req.onerror = function () { resolve(null); };
        }
        catch (e) {
            resolve(null);
        }
    });
    return _idbPromise;
}
function idbPut(key, data) {
    return idbOpen().then(function (db) {
        if (!db || !key)
            return;
        return new Promise(function (resolve) {
            try {
                const tx = db.transaction('f', 'readwrite');
                tx.objectStore('f').put(data, key);
                tx.oncomplete = function () { resolve(); };
                tx.onerror = function () { resolve(); };
            }
            catch (e) {
                resolve();
            }
        });
    });
}
function idbGet(key) {
    return idbOpen().then(function (db) {
        if (!db || !key)
            return null;
        return new Promise(function (resolve) {
            try {
                const rq = db.transaction('f').objectStore('f').get(key);
                rq.onsuccess = function () { resolve(rq.result || null); };
                rq.onerror = function () { resolve(null); };
            }
            catch (e) {
                resolve(null);
            }
        });
    });
}
/* data 缺失时尝试恢复：IndexedDB → 工作区文件后端读取；返回是否可用 */
function ensureReadFile(file) {
    if (!file)
        return Promise.resolve(false);
    if (file.data != null)
        return Promise.resolve(true);
    const load = file.dbKey ? idbGet(file.dbKey) : Promise.resolve(null);
    return load.then(function (buf) {
        if (buf) {
            file.data = buf;
            return true;
        }
        if (file._wsPath) {
            return fetchWsFile(file._wsPath).then(function (ab) { if (ab)
                file.data = ab; return !!ab; });
        }
        return false;
    });
}
/* Work 工作区扫描（后端列出文件）+ 按路径读取字节 */
function wsScan(project) {
    if (!project || !project.folder)
        return Promise.resolve(null);
    const now = Date.now();
    if (project._wsScan && now - project._wsScan.t < 30000) {
        return Promise.resolve({ files: project._wsScan.files, fresh: false });
    }
    return fetch(window.CS_BACKEND.base + '/api/fs/list?dir=' + encodeURIComponent(project.folder), {
        headers: { 'Authorization': 'Bearer ' + window.CS_BACKEND.token }
    }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        const files = (j && j.files) || [];
        project._wsScan = { t: now, files: files };
        return { files: files, fresh: true };
    }).catch(function () { return null; });
}
function fetchWsFile(p) {
    return fetch(window.CS_BACKEND.base + '/api/fs/raw?path=' + encodeURIComponent(p), {
        headers: { 'Authorization': 'Bearer ' + window.CS_BACKEND.token }
    }).then(function (r) { return r.ok ? r.arrayBuffer() : null; }).catch(function () { return null; });
}
function addFilesToKb(kbId, fileList) {
    const kb = getKb(kbId);
    if (!kb)
        return;
    Array.prototype.forEach.call(fileList || [], function (f) {
        const kind = fileKindFromName(f.name);
        const existing = kb.files.find(function (x) { return x.name === f.name; });
        readFileData(f, kind, function (data) {
            let entry;
            if (existing) {
                existing.data = data;
                existing.kind = kind;
                existing.dbKey = 'kb:' + kbId + ':' + f.name;
                existing.updatedAt = Date.now();
                entry = existing;
            }
            else {
                entry = { name: f.name, kind: kind, data: data, dbKey: 'kb:' + kbId + ':' + f.name, updatedAt: Date.now() };
                kb.files.unshift(entry);
            }
            idbPut(entry.dbKey, data);
            touchKb(kbId);
            /* Work 模式：知识库文件建索引（供 Agent 的 kb_search 检索） */
            if (WORK_HOOKS.afterKbFileAdd) {
                try {
                    WORK_HOOKS.afterKbFileAdd(kbId, entry);
                }
                catch (e) {
                    console.warn('[kb index] failed:', e);
                }
            }
            refreshPapersDb();
            renderRightPanel();
        });
    });
}
/* 知识与数据库页刷新：设置页内挂载时重挂当前 section（renderMessages 只会重绘被遮住的
   底层视图，表现为"点了没反应"）；否则重绘主视图。页内所有刷新点统一走这里。 */
function refreshPapersDb() {
    if (settingsOpen && settingsSection === 'papersdb') {
        showSettingsSection('papersdb');
        return;
    }
    renderMessages();
}
function openPapersDb() {
    /* 已在该页面时再次点击不重复播入场动画 */
    if (view === 'papers-db')
        return;
    view = 'papers-db';
    renderConversations();
    renderProjects();
    renderMessages();
    playSwap();
}
function buildPapersDbPage() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'width: 100%; padding: 18px 28px 28px 28px; display: flex; flex-direction: column; gap: 16px;';
    /* 设置页内挂载：页内返回键为历史遗留的冗余元素，不再渲染（返回由设置页顶部返回键承担）；
       主视图（左侧栏入口）挂载时保持原样——样式/位置/行为不变。 */
    if (!(settingsOpen && settingsSection === 'papersdb')) {
        const backBtn = document.createElement('div');
        backBtn.className = 'btn';
        backBtn.style.cssText = 'align-self: flex-start; height: 34px; padding: 0 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; display: flex; align-items: center; gap: 7px; cursor: pointer; color: var(--text-2);';
        backBtn.innerHTML = '<div style="width: 13px; height: 13px;"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg></div>';
        const backText = document.createElement('div');
        backText.textContent = t('back');
        backBtn.appendChild(backText);
        backBtn.addEventListener('click', function () {
            papersDbState.kbView = null;
            view = 'chat';
            renderConversations();
            refreshPapersDb();
            playSwap();
        });
        wrap.appendChild(backBtn);
    }
    /* 顶部：标题 + 切换器 */
    const topRow = document.createElement('div');
    topRow.style.cssText = 'align-self: stretch; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;';
    const titleCol = document.createElement('div');
    titleCol.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';
    const title = document.createElement('div');
    title.textContent = t('papersDb');
    title.style.cssText = 'color: var(--text-1); font-size: 22px; font-weight: 700; letter-spacing: -0.02em;';
    const sub = document.createElement('div');
    sub.textContent = papersDbState.tab === 'kb' ? (t('kbSub1') + '，' + t('kbSub2')) : t('dbSub');
    sub.style.cssText = 'color: var(--text-3); font-size: 12.5px;';
    titleCol.appendChild(title);
    titleCol.appendChild(sub);
    const switcher = document.createElement('div');
    switcher.style.cssText = 'display: flex; gap: 4px; padding: 3px; background: var(--chip-bg); border-radius: 999px; flex-shrink: 0;';
    [
        { key: 'kb', label: t('kb') },
        { key: 'database', label: t('database') }
    ].forEach(function (tabDef) {
        const seg = document.createElement('div');
        seg.className = 'mode-seg' + (papersDbState.tab === tabDef.key ? ' selected' : '');
        seg.dataset.tab = tabDef.key;
        seg.textContent = tabDef.label;
        seg.style.cssText = 'padding: 6px 16px; border-radius: 999px; font-size: 12px; font-weight: 600; cursor: pointer; color: var(--text-3);';
        if (papersDbState.tab === tabDef.key) {
            seg.style.background = 'var(--surface)';
            seg.style.boxShadow = '0 1px 3px rgba(15, 23, 42, 0.12)';
        }
        seg.addEventListener('click', function () {
            papersDbState.tab = tabDef.key;
            papersDbState.kbView = null;
            refreshPapersDb();
        });
        switcher.appendChild(seg);
    });
    topRow.appendChild(titleCol);
    topRow.appendChild(switcher);
    wrap.appendChild(topRow);
    if (papersDbState.tab === 'kb') {
        if (papersDbState.kbView)
            buildKbDetail(wrap);
        else
            buildKbList(wrap);
    }
    if (papersDbState.tab === 'database') {
        /* 卡片网格（与知识库一致，宽度自适应） */
        const grid = document.createElement('div');
        grid.style.cssText = 'align-self: stretch; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;';
        /* 添加数据库卡片（虚线，行内输入） */
        const createCard = document.createElement('div');
        createCard.style.cssText = 'min-height: 148px; border: 1.5px dashed var(--border); border-radius: 16px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10px; cursor: pointer; color: var(--text-3); transition: border-color 0.18s ease;';
        createCard.innerHTML = '<div style="width: 20px; height: 20px;"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg></div>';
        const createLbl = document.createElement('div');
        createLbl.textContent = t('addDb');
        createLbl.style.cssText = 'font-size: 13px; font-weight: 600;';
        createCard.appendChild(createLbl);
        createCard.addEventListener('mouseover', function () { createCard.style.borderColor = 'var(--focus-border)'; });
        createCard.addEventListener('mouseout', function () { createCard.style.borderColor = 'var(--border)'; });
        createCard.addEventListener('click', function () {
            if (createCard.querySelector('input'))
                return;
            createCard.innerHTML = '';
            const input = document.createElement('input');
            input.className = 'field-input';
            input.placeholder = t('dbNamePh');
            input.style.cssText = 'width: 82%; height: 38px; font-size: 13px;';
            let dbDone = false;
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter')
                    submitDb();
                if (e.key === 'Escape')
                    refreshPapersDb();
            });
            input.addEventListener('blur', submitDb);
            function submitDb() {
                if (dbDone)
                    return; /* 防止 Enter + blur 双触发重复创建 */
                const name = input.value.trim();
                if (!name) {
                    refreshPapersDb();
                    return;
                }
                dbDone = true;
                papersDbState.dbs.unshift({ name: name, on: false, pinned: false });
                refreshPapersDb();
            }
            createCard.appendChild(input);
            setTimeout(function () { input.focus(); }, 40);
        });
        grid.appendChild(createCard);
        /* 数据库卡片 */
        papersDbState.dbs.forEach(function (db) {
            const card = document.createElement('div');
            card.style.cssText = 'min-height: 148px; padding: 18px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; display: flex; flex-direction: column; gap: 10px;';
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; align-items: center; gap: 12px;';
            const ic = document.createElement('div');
            ic.style.cssText = 'width: 38px; height: 38px; border-radius: 11px; display: flex; justify-content: center; align-items: center; flex-shrink: 0; background: var(--surface); border: 1.5px solid var(--text-2); color: var(--text-1);';
            ic.innerHTML = '<div style="width: 18px; height: 18px;"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg></div>';
            const nameCol = document.createElement('div');
            nameCol.style.cssText = 'display: flex; flex-direction: column; gap: 2px; min-width: 0;';
            const n1 = document.createElement('div');
            n1.textContent = db.name;
            n1.style.cssText = 'font-size: 15.5px; font-weight: 700; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
            const n2 = document.createElement('div');
            n2.textContent = db.on ? t('connected') : t('notConnected');
            n2.style.cssText = 'font-size: 12px; font-weight: 600; color: ' + (db.on ? '#16A34A' : 'var(--text-3)') + ';';
            nameCol.appendChild(n1);
            nameCol.appendChild(n2);
            row.appendChild(ic);
            row.appendChild(nameCol);
            const bottom = document.createElement('div');
            bottom.style.cssText = 'margin-top: auto; display: flex; justify-content: space-between; align-items: center; gap: 8px;';
            const st = document.createElement('div');
            st.textContent = db.on ? t('connected') : t('notConnected');
            st.style.cssText = 'font-size: 11.5px; font-weight: 600; color: ' + (db.on ? '#16A34A' : 'var(--text-3)') + ';';
            const tg = document.createElement('div');
            tg.className = 'toggle' + (db.on ? ' on' : '');
            tg.addEventListener('click', function (e) {
                e.stopPropagation();
                db.on = !db.on;
                refreshPapersDb();
            });
            bottom.appendChild(st);
            bottom.appendChild(tg);
            card.appendChild(row);
            card.appendChild(bottom);
            grid.appendChild(card);
        });
        if (!papersDbState.dbs.length) {
            const e = document.createElement('div');
            e.textContent = t('ctxDbEmpty');
            e.style.cssText = 'color: var(--text-3); font-size: 12.5px;';
            grid.appendChild(e);
        }
        wrap.appendChild(grid);
    }
    return wrap;
}
/* 知识库文件夹列表（图一） */
function buildKbList(wrap) {
    const grid = document.createElement('div');
    grid.style.cssText = 'align-self: stretch; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;';
    /* 创建知识库卡片 */
    const createCard = document.createElement('div');
    createCard.style.cssText = 'min-height: 148px; border: 1.5px dashed var(--border); border-radius: 16px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10px; cursor: pointer; color: var(--text-3); transition: border-color 0.18s ease;';
    createCard.innerHTML = '<div style="width: 20px; height: 20px;"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg></div>';
    const createLbl = document.createElement('div');
    createLbl.textContent = t('createKb');
    createLbl.style.cssText = 'font-size: 13px; font-weight: 600;';
    createCard.appendChild(createLbl);
    createCard.addEventListener('mouseover', function () { createCard.style.borderColor = 'var(--focus-border)'; });
    createCard.addEventListener('mouseout', function () { createCard.style.borderColor = 'var(--border)'; });
    createCard.addEventListener('click', function () {
        if (createCard.querySelector('input'))
            return;
        createCard.innerHTML = '';
        const input = document.createElement('input');
        input.className = 'field-input';
        input.placeholder = t('kbNamePh');
        input.style.cssText = 'width: 82%; height: 38px; font-size: 13px;';
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter')
                submitKb();
            if (e.key === 'Escape')
                refreshPapersDb();
        });
        input.addEventListener('blur', submitKb);
        let kbDone = false;
        function submitKb() {
            if (kbDone)
                return; /* 防止 Enter + blur 双触发重复创建 */
            const name = input.value.trim();
            if (!name) {
                refreshPapersDb();
                return;
            }
            kbDone = true;
            const now = Date.now();
            papersDbState.kbs.unshift({ id: 'kb' + now, name: name, files: [], createdAt: now, updatedAt: now });
            refreshPapersDb();
        }
        createCard.appendChild(input);
        setTimeout(function () { input.focus(); }, 40);
    });
    grid.appendChild(createCard);
    /* 知识库卡片 */
    papersDbState.kbs.forEach(function (kb) {
        const card = document.createElement('div');
        card.style.cssText = 'min-height: 148px; padding: 18px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: box-shadow 0.18s ease, transform 0.18s ease;';
        card.addEventListener('mouseover', function () { card.style.boxShadow = '0 8px 22px -8px rgba(15, 23, 42, 0.16)'; });
        card.addEventListener('mouseout', function () { card.style.boxShadow = 'none'; });
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; align-items: center; gap: 12px;';
        const ic = document.createElement('div');
        ic.style.cssText = 'width: 38px; height: 38px; border-radius: 11px; display: flex; justify-content: center; align-items: center; flex-shrink: 0; background: var(--surface); border: 1.5px solid var(--text-2); color: var(--text-1);';
        ic.innerHTML = '<div style="width: 19px; height: 19px;"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width: 19px; height: 19px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>';
        const nameCol = document.createElement('div');
        nameCol.style.cssText = 'display: flex; flex-direction: column; gap: 2px; min-width: 0;';
        const n1 = document.createElement('div');
        n1.textContent = kb.name;
        n1.style.cssText = 'font-size: 15.5px; font-weight: 700; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
        const n2 = document.createElement('div');
        n2.textContent = ' ' + t('kbCount')(kb.files.length);
        n2.style.cssText = 'font-size: 12px; color: var(--text-3); display: flex; align-items: center; gap: 4px;';
        n2.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 12px; height: 12px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg> ' + t('kbCount')(kb.files.length);
        nameCol.appendChild(n1);
        nameCol.appendChild(n2);
        row.appendChild(ic);
        row.appendChild(nameCol);
        const bottom = document.createElement('div');
        bottom.style.cssText = 'margin-top: auto; display: flex; justify-content: space-between; align-items: center; gap: 8px;';
        const ws = document.createElement('div');
        ws.textContent = t('allWs');
        ws.style.cssText = 'font-size: 11.5px; color: var(--text-3);';
        const upd = document.createElement('div');
        upd.textContent = t('updatedAtAt')(fmtDate(kb.updatedAt));
        upd.style.cssText = 'font-size: 11.5px; color: var(--text-3);';
        bottom.appendChild(ws);
        bottom.appendChild(upd);
        card.appendChild(row);
        card.appendChild(bottom);
        card.addEventListener('click', function () {
            papersDbState.kbView = { kbId: kb.id, file: null };
            refreshPapersDb();
        });
        grid.appendChild(card);
    });
    if (!papersDbState.kbs.length) {
        const e = document.createElement('div');
        e.textContent = t('kbEmpty');
        e.style.cssText = 'color: var(--text-3); font-size: 12.5px;';
        grid.appendChild(e);
    }
    wrap.appendChild(grid);
}
/* 知识库详情（图二）：左文件列表 + 右预览 */
function buildKbDetail(wrap) {
    const kb = getKb(papersDbState.kbView.kbId);
    if (!kb) {
        papersDbState.kbView = null;
        buildKbList(wrap);
        return;
    }
    /* 面包屑 */
    const crumb = document.createElement('div');
    crumb.style.cssText = 'align-self: stretch; display: flex; align-items: center; gap: 7px; font-size: 13px;';
    const c1 = document.createElement('div');
    c1.textContent = t('kb');
    c1.style.cssText = 'color: var(--text-3); cursor: pointer;';
    c1.addEventListener('click', function () { papersDbState.kbView = null; refreshPapersDb(); });
    const sep = document.createElement('div');
    sep.textContent = '/';
    sep.style.cssText = 'color: var(--text-3);';
    const c2 = document.createElement('div');
    c2.textContent = kb.name;
    c2.style.cssText = 'color: var(--text-1); font-weight: 700;';
    crumb.appendChild(c1);
    crumb.appendChild(sep);
    crumb.appendChild(c2);
    wrap.appendChild(crumb);
    const cols = document.createElement('div');
    cols.style.cssText = 'align-self: stretch; height: calc(100vh - 250px); min-height: 440px; display: flex; gap: 16px;';
    /* 左列 */
    const left = document.createElement('div');
    left.style.cssText = 'width: 262px; flex-shrink: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 12px; display: flex; flex-direction: column; gap: 10px; min-height: 0;';
    const searchInput = document.createElement('input');
    searchInput.className = 'field-input';
    searchInput.placeholder = t('searchKnowledge');
    searchInput.style.cssText = 'height: 36px; font-size: 12.5px; flex-shrink: 0;';
    searchInput.value = papersDbState.kbSearch;
    searchInput.addEventListener('input', function () {
        papersDbState.kbSearch = searchInput.value;
        renderFileList();
    });
    left.appendChild(searchInput);
    const addBtn = document.createElement('div');
    addBtn.className = 'btn';
    addBtn.style.cssText = 'height: 38px; background: var(--surface); border: 1px solid var(--border); border-radius: 11px; display: flex; justify-content: center; align-items: center; gap: 7px; cursor: pointer; flex-shrink: 0;';
    addBtn.innerHTML = '<div style="width: 13px; height: 13px; color: var(--text-2);"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg></div>';
    const addLbl = document.createElement('div');
    addLbl.textContent = t('addKnowledge');
    addLbl.style.cssText = 'color: var(--text-1); font-size: 12.5px; font-weight: 600;';
    addBtn.appendChild(addLbl);
    left.appendChild(addBtn);
    addBtn.addEventListener('click', function () { openAddKnowledgeModal(kb); });
    const fileList = document.createElement('div');
    fileList.style.cssText = 'flex: 1 1 0; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;';
    left.appendChild(fileList);
    function renderFileList() {
        fileList.innerHTML = '';
        const q = (papersDbState.kbSearch || '').toLowerCase();
        const items = kb.files.filter(function (f) { return !q || f.name.toLowerCase().indexOf(q) !== -1; });
        if (!items.length) {
            const e = document.createElement('div');
            e.textContent = t('kbCount')(0);
            e.style.cssText = 'color: var(--text-3); font-size: 11.5px; padding: 6px;';
            fileList.appendChild(e);
            return;
        }
        items.forEach(function (f) {
            const selected = papersDbState.kbView.file === f.name;
            const row = document.createElement('div');
            row.style.cssText = 'padding: 9px 11px; border-radius: 10px; display: flex; align-items: center; gap: 9px; cursor: pointer; background: ' + (selected ? 'var(--conv-active-bg)' : 'transparent') + ';';
            const ic = document.createElement('div');
            ic.style.cssText = 'width: 14px; height: 14px; flex-shrink: 0; color: var(--text-3);';
            ic.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + fileIconByKind(f.kind || fileKindFromName(f.name)) + '</svg>';
            const nm = document.createElement('div');
            nm.textContent = f.name;
            nm.style.cssText = 'font-size: 12.5px; font-weight: 500; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
            row.appendChild(ic);
            row.appendChild(nm);
            row.addEventListener('click', function () {
                papersDbState.kbView.file = f.name;
                renderPreview();
                renderFileList();
            });
            fileList.appendChild(row);
        });
    }
    renderFileList();
    cols.appendChild(left);
    /* 右侧预览 */
    const right = document.createElement('div');
    right.style.cssText = 'flex: 1 1 0; min-width: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; display: flex; flex-direction: column; overflow: hidden;';
    const tabRow = document.createElement('div');
    tabRow.style.cssText = 'padding: 10px 12px; border-bottom: 1px solid var(--border); display: flex; align-items: center; flex-shrink: 0;';
    const cur = papersDbState.kbView.file ? kb.files.find(function (f) { return f.name === papersDbState.kbView.file; }) : null;
    if (cur) {
        const tab = document.createElement('div');
        tab.style.cssText = 'padding: 6px 14px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px; display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; color: var(--text-1);';
        tab.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 13px; height: 13px; color: var(--text-3);">' + fileIconByKind(cur.kind || fileKindFromName(cur.name)) + '</svg>' + cur.name;
        tabRow.appendChild(tab);
    }
    right.appendChild(tabRow);
    const readerBox = document.createElement('div');
    readerBox.style.cssText = 'flex: 1 1 0; min-height: 0; display: flex; flex-direction: column;';
    right.appendChild(readerBox);
    cols.appendChild(right);
    wrap.appendChild(cols);
    function renderPreview() {
        if (!cur) {
            readerBox.innerHTML = '';
            const tip = document.createElement('div');
            tip.style.cssText = 'flex: 1 1 0; display: flex; justify-content: center; align-items: center; color: var(--text-3); font-size: 12.5px;';
            tip.textContent = kb.files.length === 0 ? t('kbEmpty') : t('demoFileTip');
            readerBox.appendChild(tip);
            return;
        }
        openReader(readerBox, cur);
    }
    renderPreview();
}
function buildToggleRow(label, get, set) {
    const row = document.createElement('div');
    row.className = 'info-row';
    const lab = document.createElement('div');
    lab.textContent = label;
    lab.style.cssText = 'color: var(--text-2); font-size: 12.5px; font-weight: 500;';
    const tg = document.createElement('div');
    tg.className = 'toggle' + (get() ? ' on' : '');
    tg.addEventListener('click', function () {
        set(!get());
        tg.classList.toggle('on', get());
    });
    row.appendChild(lab);
    row.appendChild(tg);
    return row;
}
function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function exportMarkdown(conv) {
    let md = '# ' + conv.title + '\n\n';
    conv.messages.forEach(function (m) {
        md += m.role === 'user' ? '**User:**\n\n' : '**ChatScience:**\n\n';
        md += m.text + '\n\n';
        if (m.attachment)
            md += '> ' + t('filesLabel') + ': ' + m.attachment + '\n\n';
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = conv.title + '.md';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(t('exported'));
}
function exportPDF(conv) {
    const w = window.open('', '_blank');
    if (!w) {
        showToast(t('exported'));
        return;
    }
    let body = '';
    conv.messages.forEach(function (m) {
        const who = m.role === 'user' ? 'User' : 'ChatScience';
        body += '<div class="msg"><div class="who">' + who + '</div><div class="txt">' + escapeHtml(m.text).replace(/\n/g, '<br>') + '</div></div>';
    });
    w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + escapeHtml(conv.title) + '</title><style>body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;max-width:720px;margin:32px auto;color:#0F172A;}h1{font-size:20px;}.msg{margin:18px 0;}.who{font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;}.txt{font-size:14px;line-height:1.7;white-space:pre-wrap;}</style></head><body><h1>' + escapeHtml(conv.title) + '</h1>' + body + '</body></html>');
    w.document.close();
    w.focus();
    w.print();
}
function deleteProject(id) {
    const idx = projects.findIndex(function (p) { return p.id === id; });
    if (idx === -1)
        return;
    projects.splice(idx, 1);
    for (let i = conversations.length - 1; i >= 0; i--) {
        if (conversations[i].projectId === id)
            conversations.splice(i, 1);
    }
    if (!currentConv()) {
        startDraft(sidebarMode);
        return;
    }
    renderConversations();
    renderProjects();
    renderMessages();
}
function openProject(projectId) {
    const list = conversations.filter(function (c) { return c.projectId === projectId; });
    if (list.length) {
        /* 已在该项目的当前会话且在聊天视图：静止不重复播动画 */
        if (view === 'chat' && activeConvId === list[0].id && !readMode)
            return;
        draft = null;
        activeConvId = list[0].id;
    }
    else {
        startDraft(projectId);
        return;
    }
    view = 'chat';
    /* 记录点击：内容瞬时替换，无入场过渡 */
    renderConversations();
    renderProjects();
    renderRightPanel();
    renderMessages();
}
/* 项目树展开状态（内存态，默认展开） */
const projectOpen = {};
/* 项目树签名守卫：内容未变只原位切换激活高亮 */
let _projListSig = '';
function projListSig(q) {
    return JSON.stringify([q, projectOpen, projects.map(function (p) {
            return [p.id, p.name, !!p.pinned, p.mode || null, p.folder ? 1 : 0, !!p.editing, (p._wsScan ? p._wsScan.t : 0)];
        }), conversations.map(function (c) {
            return [c.id, c.projectId || null, c.title, (c.messages && c.messages.length) || 0];
        })]);
}
function renderProjects() {
    const wrap = document.getElementById('projectList');
    const q = (searchQuery || '').toLowerCase();
    const sig = projListSig(q);
    if (sig === _projListSig && wrap.childElementCount) {
        toggleConvCurrentIn(wrap);
        return;
    }
    _projListSig = sig;
    wrap.innerHTML = '';
    const list = projects.filter(function (p) { return !q || p.name.toLowerCase().indexOf(q) !== -1; });
    list.slice().sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0); }).forEach(function (project) {
        const convs = conversations.filter(function (c) { return c.projectId === project.id; })
            .sort(function (a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });
        /* 展开状态完全由用户点击控制，不随切换会话强制变化 */
        const open = projectOpen[project.id] !== false;
        const row = document.createElement('div');
        row.className = 'conv-item';
        row.style.cssText = 'align-self: stretch; padding: 8px 8px; border-radius: 10px; display: flex; justify-content: flex-start; align-items: center; gap: 7px; cursor: pointer; position: relative;';
        const chev = document.createElement('div');
        chev.style.cssText = 'width: 12px; height: 12px; color: var(--text-3); flex-shrink: 0; transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);' + (open ? ' transform: rotate(90deg);' : '');
        chev.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
        row.appendChild(chev);
        const icon = document.createElement('div');
        icon.style.cssText = 'width: 15px; height: 15px; flex-shrink: 0; color: var(--text-3);';
        icon.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>';
        row.appendChild(icon);
        if (project.editing) {
            const input = document.createElement('input');
            input.className = 'field-input';
            input.value = project.name;
            input.style.cssText = 'flex: 1 1 0; min-width: 0; height: 28px; padding: 3px 8px; font-size: 12.5px;';
            input.addEventListener('click', function (e) { e.stopPropagation(); });
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && input.value.trim()) {
                    project.name = input.value.trim();
                    project.editing = false;
                    renderProjects();
                    renderConversations();
                    renderHeaderForConv(currentConv());
                }
                if (e.key === 'Escape') {
                    project.editing = false;
                    renderProjects();
                }
            });
            row.appendChild(input);
            setTimeout(function () { input.focus(); input.select(); }, 0);
            wrap.appendChild(row);
            return;
        }
        const label = document.createElement('div');
        label.textContent = project.name;
        label.style.cssText = 'flex: 1 1 0; min-width: 0; font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-2);';
        row.appendChild(label);
        const ops = document.createElement('div');
        ops.className = 'conv-ops';
        ops.style.cssText = 'display: flex; align-items: center; gap: 2px; flex-shrink: 0;';
        const add = document.createElement('div');
        add.className = 'icon-ghost';
        add.title = t('newConvFor');
        add.style.cssText = 'width: 22px; height: 22px; display: flex; justify-content: center; align-items: center; color: var(--text-3);';
        add.innerHTML = '<div style="width: 12px; height: 12px;"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg></div>';
        add.addEventListener('click', function (e) {
            e.stopPropagation();
            projectOpen[project.id] = true;
            var wantMode = project.mode || sidebarMode;
            if (sidebarMode !== wantMode && typeof setSidebarMode === 'function')
                setSidebarMode(wantMode);
            startDraft(project.id);
        });
        const moreWrap = document.createElement('div');
        moreWrap.style.cssText = 'position: relative;';
        const moreBtn = document.createElement('div');
        moreBtn.className = 'icon-ghost';
        moreBtn.style.cssText = 'width: 26px; height: 22px; display: flex; justify-content: center; align-items: center; color: var(--text-2); cursor: pointer; font-size: 15px; letter-spacing: 1px;';
        moreBtn.textContent = '···';
        const menu = document.createElement('div');
        menu.className = 'action-menu';
        menu.style.left = 'auto';
        menu.style.right = '0';
        [
            { label: project.pinned ? t('unpin') : t('pin'), act: function () { project.pinned = !project.pinned; } },
            { label: t('rename'), act: function () { project.editing = true; } },
            { label: t('deleteConv'), act: function () { showConfirm(t('delProjConfirm'), function () { deleteProject(project.id); }); } }
        ].forEach(function (opt) {
            const item = document.createElement('div');
            item.className = 'menu-item';
            item.style.cssText = 'padding: 8px 12px; border-radius: 8px; color: var(--text-2); font-size: 12.5px; font-weight: 500;';
            item.textContent = opt.label;
            item.addEventListener('click', function (e) {
                e.stopPropagation();
                menu.classList.remove('open');
                opt.act();
                renderProjects();
                renderConversations();
                renderHeaderForConv(currentConv());
            });
            menu.appendChild(item);
        });
        moreBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const willOpen = !menu.classList.contains('open');
            document.querySelectorAll('.action-menu.open').forEach(function (mn) { mn.classList.remove('open'); });
            if (willOpen)
                menu.classList.add('open');
        });
        moreWrap.appendChild(moreBtn);
        moreWrap.appendChild(menu);
        ops.appendChild(add);
        ops.appendChild(moreWrap);
        row.appendChild(ops);
        row.addEventListener('click', function (e) {
            if (e.target.closest('.conv-ops'))
                return;
            projectOpen[project.id] = open === false ? true : false;
            renderProjects();
        });
        wrap.appendChild(row);
        /* 展开的会话（缩进子行，展开时带滑入动画） */
        if (open) {
            const kids = document.createElement('div');
            kids.className = 'proj-kids';
            convs.forEach(function (c) {
                const holder = document.createElement('div');
                holder.style.cssText = 'padding-left: 24px;';
                holder.appendChild(buildConvRow(c));
                kids.appendChild(holder);
            });
            wrap.appendChild(kids);
        }
    });
}
/* 全局共享工具：输出跟随置底 + 会话执行中标记（Chat/Work 两侧共用，work 模块经 window 调用） */
window.csStickScroll = function (host) {
    if (!host)
        return;
    /* 仅当接近底部时跟随；用户上滑阅读则停住，输出在下方继续跑 */
    if (host.scrollHeight - host.scrollTop - host.clientHeight < 90)
        host.scrollTop = host.scrollHeight;
};
window.csMarkRunning = function (convId, on) {
    window.__csRunning = window.__csRunning || {};
    if (on)
        window.__csRunning[convId] = true;
    else
        delete window.__csRunning[convId];
    const row = document.querySelector('[data-conv-id="' + String(convId).replace(/"/g, '') + '"]');
    if (!row)
        return;
    const old = row.querySelector('.cs-run-spin');
    if (on && !old) {
        const sp = document.createElement('div');
        sp.className = 'cs-run-spin';
        sp.title = '任务执行中';
        sp.style.cssText = 'width: 13px; height: 13px; flex-shrink: 0; color: var(--link); animation: csSpin 0.9s linear infinite; margin-right: 2px;';
        sp.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" style="width:13px;height:13px;display:block;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
        row.appendChild(sp);
    }
    else if (!on && old) {
        old.remove();
    }
};
let searchQuery = '';
const collapsedGroups = {};
const dotColors = [
    ['rgba(37, 99, 235, 0.12)', '#2563EB'],
    ['rgba(22, 163, 74, 0.12)', '#16A34A'],
    ['rgba(234, 88, 12, 0.12)', '#EA580C'],
    ['rgba(139, 92, 246, 0.12)', '#7C3AED'],
    ['rgba(239, 68, 68, 0.12)', '#EF4444']
];
function groupKey(conv) {
    const diff = Date.now() - (conv.updatedAt || conv.createdAt || 0);
    if (diff < 86400000)
        return 'today';
    if (diff < 172800000)
        return 'yesterday';
    return 'earlier';
}
function buildConvRow(conv) {
    const row = document.createElement('div');
    row.className = 'conv-item' + (conv.id === activeConvId ? ' conv-current' : '');
    row.dataset.convId = conv.id;
    row.style.cssText = 'align-self: stretch; padding: 7px 10px; border-radius: 10px; display: flex; justify-content: flex-start; align-items: center; gap: 9px; cursor: pointer; position: relative;';
    const idx = conversations.indexOf(conv);
    const color = dotColors[Math.abs(idx) % dotColors.length];
    const dot = document.createElement('div');
    dot.textContent = (conv.title || ' ').charAt(0).toUpperCase();
    dot.style.cssText = 'width: 20px; height: 20px; border-radius: 50%; background: ' + color[0] + '; color: ' + color[1] + '; font-size: 10px; font-weight: 700; display: flex; justify-content: center; align-items: center; flex-shrink: 0;';
    row.appendChild(dot);
    if (conv.editing) {
        const input = document.createElement('input');
        input.className = 'field-input';
        input.value = conv.title;
        input.style.cssText = 'flex: 1 1 0; min-width: 0; height: 28px; padding: 3px 8px; font-size: 12.5px;';
        input.addEventListener('click', function (e) { e.stopPropagation(); });
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && input.value.trim()) {
                conv.title = input.value.trim();
                conv.editing = false;
                renderConversations();
                renderHeaderForConv(currentConv());
            }
            if (e.key === 'Escape') {
                conv.editing = false;
                renderConversations();
            }
        });
        row.appendChild(input);
        setTimeout(function () { input.focus(); input.select(); }, 0);
        return row;
    }
    const label = document.createElement('div');
    label.style.cssText = 'flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 1px;';
    const titleEl = document.createElement('div');
    titleEl.textContent = conv.title;
    titleEl.style.cssText = 'font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ' + (conv.id === activeConvId ? 'var(--text-1)' : 'var(--text-2)') + '; font-weight: ' + (conv.id === activeConvId ? '600' : '500') + ';';
    label.appendChild(titleEl);
    const proj = conv.projectId ? projects.find(function (p) { return p.id === conv.projectId; }) : null;
    const meta = [conv.mode === 'work' ? 'Work' : 'Chat'];
    if (WORK_HOOKS.convBadge) {
        const badge = WORK_HOOKS.convBadge(conv);
        if (badge)
            meta.push(badge);
    }
    if (proj)
        meta.push(proj.name);
    const metaEl = document.createElement('div');
    metaEl.textContent = meta.join(' · ');
    metaEl.style.cssText = 'font-size: 10.5px; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
    label.appendChild(metaEl);
    row.appendChild(label);
    const ops = document.createElement('div');
    ops.className = 'conv-ops';
    const moreWrap = document.createElement('div');
    moreWrap.style.cssText = 'position: relative;';
    const moreBtn = document.createElement('div');
    moreBtn.className = 'icon-ghost';
    moreBtn.style.cssText = 'width: 26px; height: 22px; display: flex; justify-content: center; align-items: center; color: var(--text-2); cursor: pointer; font-size: 15px; letter-spacing: 1px;';
    moreBtn.textContent = '···';
    const menu = document.createElement('div');
    menu.className = 'action-menu';
    menu.style.left = 'auto';
    menu.style.right = '0';
    [
        { label: conv.pinned ? t('unpin') : t('pin'), act: function () { conv.pinned = !conv.pinned; } },
        { label: t('exportPdf'), act: function () { exportPDF(conv); } },
        { label: t('exportMd'), act: function () { exportMarkdown(conv); } },
        { label: t('rename'), act: function () { conv.editing = true; } },
        { label: t('deleteConv'), act: function () { showConfirm(t('delConvConfirm'), function () { deleteConversation(conv.id); }); } }
    ].forEach(function (opt) {
        const item = document.createElement('div');
        item.className = 'menu-item';
        item.style.cssText = 'padding: 8px 12px; border-radius: 8px; color: var(--text-2); font-size: 12.5px; font-weight: 500;';
        item.textContent = opt.label;
        item.addEventListener('click', function (e) {
            e.stopPropagation();
            menu.classList.remove('open');
            opt.act();
            renderConversations();
            renderHeaderForConv(currentConv());
        });
        menu.appendChild(item);
    });
    moreBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        const willOpen = !menu.classList.contains('open');
        document.querySelectorAll('.action-menu.open').forEach(function (mn) { mn.classList.remove('open'); });
        if (willOpen)
            menu.classList.add('open');
    });
    moreWrap.appendChild(moreBtn);
    moreWrap.appendChild(menu);
    ops.appendChild(moreWrap);
    row.appendChild(ops);
    /* 执行中的会话条目显示转圈（重渲染时保留状态） */
    if (window.__csRunning && window.__csRunning[conv.id] && window.csMarkRunning) {
        /* 走 csMarkRunning 的就地 DOM 逻辑补 spinner（不改变 row 其他结构） */
        window.csMarkRunning(conv.id, false);
        window.csMarkRunning(conv.id, true);
    }
    row.addEventListener('click', function () {
        /* 已是该会话且在聊天视图：静止不重复播动画 */
        if (view === 'chat' && activeConvId === conv.id && !readMode)
            return;
        draft = null;
        activeConvId = conv.id;
        view = 'chat';
        /* 记录点击：内容瞬时替换，无入场过渡；不摸 updatedAt（避免列表重排闪烁） */
        renderConversations();
        renderRightPanel();
        renderMessages();
    });
    return row;
}
function deleteConversation(id) {
    const idx = conversations.findIndex(function (c) { return c.id === id; });
    if (idx === -1)
        return;
    conversations.splice(idx, 1);
    if (activeConvId === id) {
        if (conversations.length) {
            activeConvId = conversations[0].id;
            renderMessages();
        }
        else {
            startDraft(null);
            return;
        }
    }
    renderConversations();
    renderProjects();
}
function appendGroup(wrap, key, items, starIcon, labelOverride, pinIcon) {
    if (!items.length && !searchQuery)
        return;
    const head = document.createElement('div');
    head.className = 'group-head' + (collapsedGroups[key] ? ' collapsed' : '');
    head.style.cssText = 'align-self: stretch; padding: 7px 8px 4px 8px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;';
    const headLabel = document.createElement('div');
    headLabel.style.cssText = 'display: flex; align-items: center; gap: 5px;';
    if (starIcon) {
        headLabel.innerHTML = '<div style="width: 11px; height: 11px; color: #F59E0B;"><svg class="icon" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l5-4.87L12 2z"/></svg></div>';
    }
    if (pinIcon) {
        headLabel.innerHTML = '<div style="width: 11px; height: 11px; color: var(--text-3);"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7h1a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h1z"/></svg></div>';
    }
    const headText = document.createElement('div');
    headText.textContent = labelOverride || t(key);
    headText.style.cssText = 'color: var(--text-3); font-size: 10.5px; font-weight: 700;';
    headLabel.appendChild(headText);
    const chev = document.createElement('div');
    chev.className = 'group-chev';
    chev.style.cssText = 'width: 11px; height: 11px; color: var(--text-3);';
    chev.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>';
    head.appendChild(headLabel);
    head.appendChild(chev);
    head.addEventListener('click', function () {
        collapsedGroups[key] = !collapsedGroups[key];
        renderConversations();
    });
    wrap.appendChild(head);
    if (collapsedGroups[key])
        return;
    items.forEach(function (conv) {
        wrap.appendChild(buildConvRow(conv));
    });
}
/* 侧栏列表签名守卫：内容未变只原位切换激活高亮（消除点击/换页闪烁） */
let _convListSig = '';
function convListSig(q) {
    return JSON.stringify([q, view, collapsedGroups, conversations.map(function (c) {
            return [c.id, c.title, c.mode, !!c.star, !!c.pinned, c.updatedAt, c.projectId || null, (c.messages && c.messages.length) || 0, !!c.editing];
        })]);
}
function toggleConvCurrentIn(host) {
    if (!host)
        return;
    host.querySelectorAll('.conv-item[data-conv-id]').forEach(function (r) {
        r.classList.toggle('conv-current', r.dataset.convId === activeConvId);
    });
}
function renderConversations() {
    const wrap = document.getElementById('convList');
    const q = (searchQuery || '').toLowerCase();
    const sig = convListSig(q);
    if (sig === _convListSig && wrap.childElementCount) {
        toggleConvCurrentIn(wrap);
        renderProjects();
        renderHeaderForConv(currentConv());
        return;
    }
    _convListSig = sig;
    wrap.innerHTML = '';
    /* 项目会话归属项目树展示，顶层对话列表只放无项目会话 */
    const list = conversations.filter(function (c) { return !c.projectId && (!q || c.title.toLowerCase().indexOf(q) !== -1); });
    const pinned = list.filter(function (c) { return c.pinned; });
    appendGroup(wrap, 'pinned', pinned, false, t('pinnedGroup'), true);
    ['today', 'yesterday', 'earlier'].forEach(function (g) {
        const items = list.filter(function (c) { return !c.pinned && groupKey(c) === g; });
        appendGroup(wrap, g, items, false);
    });
    /* 项目树与会话列表保持同步（删除项目会话后树立即刷新；无递归：renderProjects 不回调本函数） */
    renderProjects();
    renderHeaderForConv(currentConv());
}
function bubbleSvgAi() {
    return '<div class="btn-primary" style="width: 34px; height: 34px; border-radius: 50%; display: inline-flex; flex-direction: column; justify-content: center; align-items: center; flex-shrink: 0;"><div style="width: 17px; height: 17px;"><svg class="icon" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg></div></div>';
}
/* 消息宿主：主聊天区。阅读模式有自己独立的线程渲染，不走这里 */
function msgHost() {
    return chatScroll;
}
/* ---- 初始态标记（欢迎态：聊天视图 + 无消息） ----
   供「只此青绿」主题的初始态背景壁纸使用（CSS 选择器 html[data-theme="ink-green"]
   body.is-initial-chat #centerPanel）。判定与 buildEmptyState 的渲染条件严格一致，
   保证「有壁纸」与「显示欢迎页」永远同进同退：
     view === 'chat' && !readMode && conv 存在 && conv.messages.length === 0
   其余一切情况（切换管理页/阅读模式/开始对话/无 conv）都移除该类，立即回落原配色。 */
function syncInitialChatFlag() {
    const conv = (view === 'chat' && !readMode) ? currentConv() : null;
    const initial = !!(conv && conv.messages.length === 0);
    document.body.classList.toggle('is-initial-chat', initial);
    return initial;
}
function renderMessages() {
    /* 阅读模式只与文件线程相关；离开聊天视图（切管理页等）时退出阅读模式 */
    if (readMode && view !== 'chat')
        exitReadMode(true);
    syncInitialChatFlag();
    /* 模式严格跟随所打开记录的 mode（必须在输入框状态渲染前同步：
       Work 任务→Work 工具栏/输入框，Chat 记录→Chat 输入框）；
       Work 无工作区时按 Chat 处理（草稿除外：草稿需保留 Work 输入框以选择工作区） */
    const syncConv0 = (view === 'chat') ? currentConv() : null;
    if (syncConv0 && syncConv0.mode === 'work' && !convHasWorkspace(syncConv0) && sidebarMode === 'work' && activeConvId !== 'draft') {
        sidebarMode = 'chat';
        renderModeActions(false);
        updateModeSwitcher();
        renderConversations();
        renderRightPanel();
    }
    else if (syncConv0 && syncConv0.mode && syncConv0.mode !== sidebarMode && (syncConv0.mode !== 'work' || convHasWorkspace(syncConv0))) {
        sidebarMode = syncConv0.mode;
        renderModeActions(false);
        updateModeSwitcher();
        renderConversations();
        renderRightPanel();
    }
    const inputArea = document.getElementById('inputArea');
    /* 非聊天视图默认隐藏消息定位条（聊天分支末尾再更新） */
    const navEl0 = document.getElementById('msgNav');
    if (navEl0)
        navEl0.style.display = 'none';
    updateWorkspaceUI();
    updateThinkingUI();
    updateAgentSelectUI();
    updatePermissionUI();
    if (view === 'newProject') {
        chatScroll.classList.remove('wide');
        inputArea.style.display = 'none';
        chatScroll.innerHTML = '';
        chatScroll.appendChild(buildNewProjectForm());
        renderHeader(t('newProjectTitle'), '');
        return;
    }
    if (view.indexOf('work-') === 0) {
        const page = buildWorkPage(view);
        inputArea.style.display = 'none';
        chatScroll.innerHTML = '';
        chatScroll.classList.toggle('wide', page.wide);
        chatScroll.appendChild(page.node);
        renderHeader(page.title, page.desc);
        return;
    }
    if (view === 'papers-db') {
        inputArea.style.display = 'none';
        closeReader();
        chatScroll.innerHTML = '';
        chatScroll.classList.add('wide');
        chatScroll.appendChild(buildPapersDbPage());
        renderHeader(t('papersDb'), '');
        return;
    }
    chatScroll.classList.remove('wide');
    inputArea.style.display = readMode ? 'none' : 'flex';
    const conv = currentConv();
    if (!conv) {
        chatScroll.innerHTML = '';
        renderHeader('', '');
        return;
    }
    renderHeaderForConv(conv);
    if (conv.messages.length === 0) {
        chatScroll.innerHTML = '';
        chatScroll.appendChild(buildEmptyState(conv.mode || sidebarMode));
        return;
    }
    const host = msgHost();
    host.innerHTML = '';
    conv.messages.forEach(function (m, idx) {
        host.appendChild(buildMessageRow(m, idx));
    });
    host.scrollTop = host.scrollHeight;
    updateMsgNav();
}
/* ---- 消息定位条（DeepSeek 式：短线指示 + hover 展开预览 + 点击定位） ---- */
function updateMsgNav() {
    const nav = document.getElementById('msgNav');
    if (!nav)
        return;
    const conv = (view === 'chat' && !readMode) ? currentConv() : null;
    const userMsgs = conv ? conv.messages.map(function (m, i) { return { m: m, i: i }; }).filter(function (x) { return x.m.role === 'user'; }) : [];
    if (!userMsgs.length) {
        nav.style.display = 'none';
        nav.innerHTML = '';
        return;
    }
    nav.style.display = 'flex';
    const dots = document.createElement('div');
    dots.className = 'nav-dots';
    const expand = document.createElement('div');
    expand.className = 'nav-expand';
    userMsgs.forEach(function (x) {
        const d = document.createElement('div');
        d.className = 'nav-dot';
        d.dataset.idx = x.i;
        d.title = (x.m.text || '').slice(0, 40);
        d.addEventListener('click', function () { navGoto(x.i); });
        dots.appendChild(d);
        const r = document.createElement('div');
        r.className = 'nav-row';
        r.dataset.idx = x.i;
        const rt = document.createElement('div');
        rt.className = 'row-text';
        rt.textContent = (x.m.text || '').replace(/\s+/g, ' ').slice(0, 60) || ' ';
        const rl = document.createElement('div');
        rl.className = 'row-line';
        r.appendChild(rt);
        r.appendChild(rl);
        r.addEventListener('click', function () { navGoto(x.i); });
        expand.appendChild(r);
    });
    nav.innerHTML = '';
    nav.appendChild(dots);
    nav.appendChild(expand);
    updateNavCurrent();
}
function updateNavCurrent() {
    const nav = document.getElementById('msgNav');
    if (!nav || nav.style.display === 'none')
        return;
    const base = chatScroll.getBoundingClientRect().top;
    const bottom = chatScroll.getBoundingClientRect().bottom;
    /* 以视口底部为准：当前屏幕最下方 AI 回复所属的记录（该记录的用户消息）为激活项 */
    let cur = null;
    nav.querySelectorAll('.nav-dot').forEach(function (d) {
        const idx = parseInt(d.dataset.idx, 10);
        const row = chatScroll.querySelector('.msg[data-idx="' + idx + '"]');
        if (row && row.getBoundingClientRect().top - base <= bottom - base)
            cur = idx;
    });
    if (cur === null) {
        const first = nav.querySelector('.nav-dot');
        if (first)
            cur = parseInt(first.dataset.idx, 10);
    }
    nav.querySelectorAll('.nav-dot').forEach(function (d) { d.classList.toggle('current', parseInt(d.dataset.idx, 10) === cur); });
    nav.querySelectorAll('.nav-row').forEach(function (r) { r.classList.toggle('current', parseInt(r.dataset.idx, 10) === cur); });
}
function navGoto(idx) {
    const row = chatScroll.querySelector('.msg[data-idx="' + idx + '"]');
    if (row)
        row.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
let navScrollT = null;
chatScroll.addEventListener('scroll', function () {
    clearTimeout(navScrollT);
    navScrollT = setTimeout(updateNavCurrent, 80);
});
/* ---- 创建项目视图 ---- */
function elHint(text) {
    const d = document.createElement('div');
    d.textContent = text;
    d.style.cssText = 'color: var(--text-3); font-size: 11.5px; line-height: 17px;';
    return d;
}
function buildNewProjectForm() {
    let files = [];
    const localData = {};
    const pickedKb = [];
    const pickedDbs = [];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'width: 100%; max-width: 560px; margin: 3vh auto 0; display: flex; flex-direction: column; gap: 16px;';
    const nameLabel = document.createElement('div');
    nameLabel.textContent = t('projectName');
    nameLabel.style.cssText = 'color: var(--text-2); font-size: 12px; font-weight: 600;';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'field-input';
    nameInput.placeholder = t('projectNamePh');
    nameInput.style.cssText = 'height: 46px; font-size: 14px;';
    wrap.appendChild(nameLabel);
    wrap.appendChild(nameInput);
    /* 项目模式：Chat（文件上传）/ Work（本地文件夹工作区，Agent 直接读写） */
    let projMode = sidebarMode === 'work' ? 'work' : 'chat';
    let folder = '';
    const modeLabel = document.createElement('div');
    modeLabel.textContent = t('wProjMode');
    modeLabel.style.cssText = 'color: var(--text-2); font-size: 12px; font-weight: 600;';
    const modeSeg = document.createElement('div');
    modeSeg.className = 'seg';
    const chatWrap = document.createElement('div');
    chatWrap.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
    const workWrap = document.createElement('div');
    workWrap.style.cssText = 'display: none; flex-direction: column; gap: 10px;';
    [['chat', t('wProjModeChat')], ['work', t('wProjModeWork')]].forEach(function (opt) {
        const it = document.createElement('div');
        it.className = 'seg-item' + (projMode === opt[0] ? ' selected' : '');
        it.textContent = opt[1];
        it.addEventListener('click', function () {
            projMode = opt[0];
            modeSeg.querySelectorAll('.seg-item').forEach(function (x) { x.classList.remove('selected'); });
            it.classList.add('selected');
            chatWrap.style.display = projMode === 'chat' ? 'flex' : 'none';
            workWrap.style.display = projMode === 'work' ? 'flex' : 'none';
        });
        modeSeg.appendChild(it);
    });
    wrap.appendChild(modeLabel);
    wrap.appendChild(modeSeg);
    /* Work：文件夹选择 */
    const folderBtn = document.createElement('div');
    folderBtn.style.cssText = 'min-height: 64px; border: 1.5px dashed var(--border); border-radius: 14px; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; padding: 10px 16px; transition: border-color 0.18s ease;';
    const folderIcon = document.createElement('div');
    folderIcon.style.cssText = 'width: 18px; height: 18px; color: var(--text-3); flex-shrink: 0;';
    folderIcon.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>';
    const folderText = document.createElement('div');
    folderText.style.cssText = 'color: var(--text-3); font-size: 12.5px; text-align: center; word-break: break-all;';
    folderText.textContent = t('wProjFolderHint');
    folderBtn.appendChild(folderIcon);
    folderBtn.appendChild(folderText);
    folderBtn.addEventListener('mouseover', function () { folderBtn.style.borderColor = 'var(--focus-border)'; });
    folderBtn.addEventListener('mouseout', function () { folderBtn.style.borderColor = 'var(--border)'; });
    folderBtn.addEventListener('click', function () {
        if (!(window.csDesktop && window.csDesktop.selectDirectory)) {
            showToast(t('wNeedDesktop'));
            return;
        }
        window.csDesktop.selectDirectory().then(function (dir) {
            if (!dir)
                return;
            folder = dir;
            folderText.textContent = dir;
            folderText.style.color = 'var(--text-1)';
            if (!nameInput.value.trim())
                nameInput.value = dir.split(/[\\/]/).filter(Boolean).pop() || '';
        });
    });
    workWrap.appendChild(folderBtn);
    workWrap.appendChild(elHint(t('wProjFolderNote')));
    wrap.appendChild(workWrap);
    wrap.appendChild(chatWrap);
    const filesLabel = document.createElement('div');
    filesLabel.textContent = t('filesLabel');
    filesLabel.style.cssText = 'color: var(--text-2); font-size: 12px; font-weight: 600;';
    const importBox = document.createElement('div');
    importBox.style.cssText = 'min-height: 110px; border: 1.5px dashed var(--border); border-radius: 14px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px; cursor: pointer; transition: border-color 0.18s ease;';
    importBox.innerHTML = '<div style="width: 22px; height: 22px; color: var(--text-3);"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/></svg></div>';
    const hint = document.createElement('div');
    hint.textContent = t('importHint');
    hint.style.cssText = 'color: var(--text-3); font-size: 12.5px; padding: 0 20px; text-align: center;';
    importBox.appendChild(hint);
    const chipRow = document.createElement('div');
    chipRow.style.cssText = 'display: none; flex-wrap: wrap; gap: 8px;';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = '.pdf,.doc,.docx,.txt,.md,.csv,.xlsx';
    fileInput.style.display = 'none';
    importBox.addEventListener('click', function () { fileInput.click(); });
    importBox.addEventListener('mouseover', function () { importBox.style.borderColor = 'var(--focus-border)'; });
    importBox.addEventListener('mouseout', function () { importBox.style.borderColor = 'var(--border)'; });
    fileInput.addEventListener('change', function () {
        Array.prototype.forEach.call(fileInput.files || [], function (f) {
            if (files.indexOf(f.name) === -1) {
                files.push(f.name);
                const kind = fileKindFromName(f.name);
                readFileData(f, kind, function (data) { localData[f.name] = data; });
            }
        });
        fileInput.value = '';
        chipRow.innerHTML = '';
        files.forEach(function (name, i) {
            const chip = document.createElement('div');
            chip.style.cssText = 'padding: 5px 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-1);';
            const nameEl = document.createElement('div');
            nameEl.textContent = name;
            nameEl.style.cssText = 'max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
            const x = document.createElement('div');
            x.textContent = '×';
            x.style.cssText = 'color: var(--text-3); cursor: pointer; font-size: 14px; line-height: 1;';
            x.addEventListener('click', function (e) {
                e.stopPropagation();
                files.splice(i, 1);
                chip.remove();
            });
            chip.appendChild(nameEl);
            chip.appendChild(x);
            chipRow.appendChild(chip);
        });
        chipRow.style.display = files.length ? 'flex' : 'none';
    });
    chatWrap.appendChild(filesLabel);
    chatWrap.appendChild(importBox);
    chatWrap.appendChild(chipRow);
    chatWrap.appendChild(fileInput);
    /* 从知识库导入（弹窗选择，已选芯片展示） */
    const kbLabel = document.createElement('div');
    kbLabel.textContent = t('importFromKb');
    kbLabel.style.cssText = 'color: var(--text-2); font-size: 12px; font-weight: 600;';
    const kbBtnRow = document.createElement('div');
    kbBtnRow.style.cssText = 'display: flex; align-items: center; gap: 10px; flex-wrap: wrap;';
    const kbPickBtn = document.createElement('div');
    kbPickBtn.className = 'btn';
    kbPickBtn.style.cssText = 'height: 36px; padding: 0 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; display: flex; align-items: center; gap: 7px; cursor: pointer;';
    kbPickBtn.innerHTML = '<div style="width: 13px; height: 13px; color: var(--text-2);"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg></div>';
    const kbPickLbl = document.createElement('div');
    kbPickLbl.textContent = t('pickKbFile');
    kbPickLbl.style.cssText = 'color: var(--text-1); font-size: 12.5px; font-weight: 600;';
    kbPickBtn.appendChild(kbPickLbl);
    kbPickBtn.addEventListener('click', function () {
        openKbImportModal(pickedKb.slice(), function (sel) {
            pickedKb.length = 0;
            sel.forEach(function (s) { pickedKb.push(s); });
            renderKbChips();
        });
    });
    const kbChipRow = document.createElement('div');
    kbChipRow.style.cssText = 'display: none; flex-wrap: wrap; gap: 8px; flex: 1 1 0;';
    function renderKbChips() {
        kbChipRow.innerHTML = '';
        kbChipRow.style.display = pickedKb.length ? 'flex' : 'none';
        pickedKb.forEach(function (s, i) {
            const chip = document.createElement('div');
            chip.style.cssText = 'padding: 5px 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-1);';
            const nameEl = document.createElement('div');
            nameEl.textContent = s.fileName;
            nameEl.style.cssText = 'max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
            const x = document.createElement('div');
            x.textContent = '×';
            x.style.cssText = 'color: var(--text-3); cursor: pointer; font-size: 14px; line-height: 1;';
            x.addEventListener('click', function (e) {
                e.stopPropagation();
                pickedKb.splice(i, 1);
                renderKbChips();
            });
            chip.appendChild(nameEl);
            chip.appendChild(x);
            kbChipRow.appendChild(chip);
        });
    }
    kbBtnRow.appendChild(kbPickBtn);
    kbBtnRow.appendChild(kbChipRow);
    chatWrap.appendChild(kbLabel);
    chatWrap.appendChild(kbBtnRow);
    /* 连接数据库：可勾选 */
    function pickRow(iconSvg, name, meta, picked) {
        const sel = picked.indexOf(name) > -1;
        const row = document.createElement('div');
        row.style.cssText = 'padding: 10px 12px; background: ' + (sel ? 'var(--accent-soft)' : 'var(--surface)') + '; border: 1px solid ' + (sel ? 'var(--focus-border)' : 'var(--border)') + '; border-radius: 12px; display: flex; align-items: center; gap: 9px; cursor: pointer; transition: background-color 0.15s ease;';
        const ic = document.createElement('div');
        ic.style.cssText = 'width: 14px; height: 14px; flex-shrink: 0; color: ' + (sel ? 'var(--accent-text)' : 'var(--text-3)') + ';';
        ic.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + iconSvg + '</svg>';
        const col = document.createElement('div');
        col.style.cssText = 'flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 1px;';
        const n1 = document.createElement('div');
        n1.textContent = name;
        n1.style.cssText = 'font-size: 12.5px; font-weight: 500; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
        col.appendChild(n1);
        if (meta) {
            const n2 = document.createElement('div');
            n2.textContent = meta;
            n2.style.cssText = 'font-size: 10.5px; color: var(--text-3);';
            col.appendChild(n2);
        }
        const check = document.createElement('div');
        check.style.cssText = 'width: 14px; height: 14px; flex-shrink: 0; color: ' + (sel ? 'var(--accent-text)' : 'transparent') + ';';
        check.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
        row.appendChild(ic);
        row.appendChild(col);
        row.appendChild(check);
        row.addEventListener('click', function () {
            const i = picked.indexOf(name);
            const nowSel = i === -1;
            if (nowSel)
                picked.push(name);
            else
                picked.splice(i, 1);
            row.style.background = nowSel ? 'var(--accent-soft)' : 'var(--surface)';
            row.style.borderColor = nowSel ? 'var(--focus-border)' : 'var(--border)';
            ic.style.color = nowSel ? 'var(--accent-text)' : 'var(--text-3)';
            check.style.color = nowSel ? 'var(--accent-text)' : 'transparent';
        });
        return row;
    }
    function pickSection(labelText, emptyText, items, picked, build) {
        const label = document.createElement('div');
        label.textContent = labelText;
        label.style.cssText = 'color: var(--text-2); font-size: 12px; font-weight: 600;';
        chatWrap.appendChild(label);
        const box = document.createElement('div');
        box.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
        if (!items.length) {
            const e = document.createElement('div');
            e.textContent = emptyText;
            e.style.cssText = 'color: var(--text-3); font-size: 11.5px; padding: 2px;';
            box.appendChild(e);
        }
        else {
            items.forEach(function (item) { box.appendChild(build(item, picked)); });
        }
        chatWrap.appendChild(box);
    }
    pickSection(t('pickDbs'), t('ctxDbEmpty'), papersDbState.dbs, pickedDbs, function (d) {
        return pickRow(ICON_DB, d.name, d.on ? t('connected') : t('notConnected'), pickedDbs);
    });
    const err = document.createElement('div');
    err.style.cssText = 'display: none; color: var(--danger-text); font-size: 12px; font-weight: 500;';
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display: flex; justify-content: flex-end; gap: 8px;';
    const cancelBtn = document.createElement('div');
    cancelBtn.className = 'btn';
    cancelBtn.textContent = t('cancel');
    cancelBtn.style.cssText = 'padding: 9px 18px; border-radius: 999px; background: var(--accent-soft); color: var(--text-2); font-size: 12.5px; font-weight: 600; cursor: pointer;';
    cancelBtn.addEventListener('click', function () {
        view = 'chat';
        renderConversations();
        renderMessages();
        playSwap();
    });
    const createBtn = document.createElement('div');
    createBtn.className = 'btn btn-primary';
    createBtn.textContent = t('createProject');
    createBtn.style.cssText = 'padding: 9px 20px; border-radius: 999px; font-size: 12.5px; font-weight: 600; cursor: pointer;';
    createBtn.addEventListener('click', function () {
        const name = nameInput.value.trim();
        if (!name) {
            err.textContent = t('errProjectName');
            err.style.display = 'block';
            return;
        }
        if (projMode === 'work' && !folder) {
            err.textContent = t('wProjFolderRequired');
            err.style.display = 'block';
            return;
        }
        const project = {
            id: 'p' + Date.now(),
            name: name,
            mode: projMode,
            folder: projMode === 'work' ? folder : '',
            files: files.map(function (f) { return { name: f, pinned: false, kind: fileKindFromName(f), data: localData[f] || null }; }),
            kbFiles: pickedKb.map(function (s) { return { kbId: s.kbId, fileName: s.fileName, pinned: false }; }),
            dbs: pickedDbs.map(function (n) { return { name: n, on: false, pinned: false }; })
        };
        projects.push(project);
        csMemoryEnsureProject(project);
        draft = { id: 'draft-' + Date.now(), title: t('newConvName'), messages: [], isNew: true, projectId: project.id, mode: projMode, agentId: (projMode === 'work' && typeof window.defaultAgentId === 'function') ? window.defaultAgentId() : null, localFiles: [], kbFiles: [], dbs: [], docCtx: null };
        if (projMode === 'work')
            csMemoryEnsureTask(project, draft.id, draft.title);
        activeConvId = 'draft';
        view = 'chat';
        renderConversations();
        renderProjects();
        renderMessages();
        playSwap();
        showToast(t('projectCreated'));
    });
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(createBtn);
    wrap.appendChild(err);
    wrap.appendChild(btnRow);
    return wrap;
}
/* ---- 新对话初始状态（欢迎页） ---- */
function buildEmptyState(mode) {
    mode = mode || 'chat';
    const isWork = mode === 'work';
    const wrap = document.createElement('div');
    wrap.className = 'empty-state';
    wrap.style.cssText = 'align-self: stretch; width: 100%; display: flex; flex-direction: column; align-items: center;';
    const orb = document.createElement('div');
    orb.style.cssText = 'width: 58px; height: 58px; color: var(--text-1);';
    orb.innerHTML = isWork
        ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'
        : '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    const title = document.createElement('div');
    title.textContent = t(isWork ? 'workTitle' : 'hiTitle');
    title.style.cssText = 'margin-top: 26px; color: var(--text-1); font-size: 30px; font-weight: 700; letter-spacing: -0.02em;';
    const sub = document.createElement('div');
    sub.textContent = t(isWork ? 'workSub' : 'hiSub');
    sub.style.cssText = 'margin-top: 10px; color: var(--text-2); font-size: 15px;';
    wrap.appendChild(orb);
    wrap.appendChild(title);
    wrap.appendChild(sub);
    return wrap;
}
/* ---- 消息操作（复制 / 删除 / 重新生成） ---- */
const ICON_COPY = '<div style="width:13px;height:13px;"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></div>';
const ICON_TRASH = '<div style="width:13px;height:13px;"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>';
const ICON_REGEN = '<div style="width:13px;height:13px;"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></div>';
function actionBtn(icon, title) {
    const btn = document.createElement('div');
    btn.className = 'action-btn';
    btn.title = title;
    btn.innerHTML = icon;
    return btn;
}
function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { showToast(t('copied')); }, function () { });
    }
    else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast(t('copied'));
    }
}
function deleteUserMessage(idx) {
    const conv = currentConv();
    if (!conv)
        return;
    showConfirm(t('delMsgConfirm'), function () {
        conv.messages.splice(idx, 1);
        if (conv.messages[idx] && conv.messages[idx].role === 'ai')
            conv.messages.splice(idx, 1);
        renderMessages();
    });
}
function regenerate(idx, mode) {
    const conv = currentConv();
    if (!conv)
        return;
    const list = getModels();
    const active = list.find(function (m) { return m.key === activeModelKey; });
    let text;
    if (!active) {
        text = t('demoReplyNoModel')();
    }
    else if (mode === 'detail') {
        text = t('replyDetail')({ name: active.name, provider: active.providerName, ctx: active.ctx });
    }
    else if (mode === 'concise') {
        text = t('replyConcise')({ name: active.name });
    }
    else {
        text = t('demoReply')({ name: active.name, provider: active.providerName, ctx: active.ctx });
    }
    const aiMsg = { role: 'ai', text: text, streaming: true };
    conv.messages.splice(idx, 1, aiMsg);
    renderMessages();
    const row = msgHost().querySelectorAll('.msg')[idx];
    startStream(row, aiMsg);
}
/* ---- Markdown / 公式渲染（AI 输出） ---- */
function escapeHtmlText(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function mdToHtml(text) {
    try {
        if (window.marked) {
            /* 公式保护：先提取为占位符，避免 markdown 破坏 LaTeX（下划线/反斜杠被转义成乱码） */
            const mathParts = [];
            const src = String(text || '').replace(/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)/g, function (m) {
                mathParts.push(m);
                return '@@CSMATH' + (mathParts.length - 1) + '@@';
            });
            let html = window.marked.parse(src, { breaks: true, mangle: false, headerIds: false });
            html = html.replace(/@@CSMATH(\d+)@@/g, function (m, i) {
                return escapeHtmlText(mathParts[parseInt(i, 10)] || '');
            });
            return window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
        }
    }
    catch (e) { /* 降级 */ }
    return '<p>' + escapeHtmlText(text).replace(/\n/g, '<br>') + '</p>';
}
function typesetMath(el) {
    try {
        if (window.renderMathInElement) {
            window.renderMathInElement(el, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '\\[', right: '\\]', display: true },
                    { left: '\\(', right: '\\)', display: false }
                ],
                throwOnError: false
            });
        }
    }
    catch (e) { /* 忽略 */ }
}
function renderAiText(el, text, withMath) {
    if (!el)
        return;
    el.classList.add('md-body');
    el.innerHTML = mdToHtml(text);
    el._stableLen = 0;
    el._stableHtml = '';
    if (withMath)
        typesetMath(el);
}
/* 流式增量渲染：稳定段/活动段分离为独立节点——稳定段只在推进时更新，活动段每帧小量替换（长输出不卡顿）。
   闭合的公式在流式期间即时 KaTeX 排版（稳定段推进时排版一次，活动段每帧排版） */
function paintStreaming(textEl, text) {
    if (!textEl._stableEl || !textEl._stableEl.parentNode) {
        textEl.innerHTML = '';
        textEl._stableEl = document.createElement('div');
        textEl._liveEl = document.createElement('div');
        textEl.appendChild(textEl._stableEl);
        textEl.appendChild(textEl._liveEl);
        textEl._stableLen = 0;
        textEl._stableHtml = '';
    }
    let cut = text.lastIndexOf('\n\n');
    /* 活动段过长时推进切分点（退到次级换行），保证每次重解析的都是短文本 */
    if (cut > 0 && text.length - cut > 1200) {
        const sub = text.lastIndexOf('\n', cut - 1);
        if (sub > 0)
            cut = sub;
    }
    if (cut > 0 && cut > (textEl._stableLen || 0)) {
        textEl._stableLen = cut;
        textEl._stableEl.innerHTML = mdToHtml(text.slice(0, cut));
        typesetMath(textEl._stableEl);
    }
    textEl._liveEl.innerHTML = cut > 0 ? mdToHtml(text.slice(cut)) : mdToHtml(text);
    typesetMath(textEl._liveEl);
}
function startStream(row, aiMsg) {
    const textEl = row ? row.querySelector('.ai-text') : null;
    if (!textEl) {
        aiMsg.streaming = false;
        renderMessages();
        return;
    }
    if (aiMsg._timer) {
        clearInterval(aiMsg._timer);
        aiMsg._timer = null;
    }
    let i = 0, tick = 0;
    aiMsg._timer = setInterval(function () {
        i = Math.min(aiMsg.text.length, i + 3);
        tick++;
        /* 边输出边渲染：全程 markdown + 分段增量，杜绝符号裸露与卡顿 */
        if (tick % 3 === 0 || i >= aiMsg.text.length || i <= 4)
            paintStreaming(textEl, aiMsg.text.slice(0, i));
        msgHost().scrollTop = msgHost().scrollHeight;
        if (i >= aiMsg.text.length) {
            clearInterval(aiMsg._timer);
            aiMsg._timer = null;
            aiMsg.streaming = false;
            renderAiText(textEl, aiMsg.text, true);
            const actions = row.querySelector('.ai-actions');
            if (actions)
                actions.style.visibility = 'visible';
        }
    }, 30);
}
/* 思考折叠块：历史渲染用（流式版在 runRealChat 内复用同一构建器） */
function buildThinkBlock(m) {
    const tb = document.createElement('div');
    tb.className = 'think-block';
    tb.dataset.open = '0';
    const head = document.createElement('div');
    head.className = 'think-head';
    const ht = document.createElement('span');
    ht.className = 'think-head-t';
    ht.textContent = t('thoughtDone');
    const ch = document.createElement('span');
    ch.className = 'think-chev';
    ch.textContent = '▼';
    head.appendChild(ht);
    head.appendChild(ch);
    const body = document.createElement('div');
    body.className = 'think-body';
    body.textContent = m.thinking || '';
    head.addEventListener('click', function () {
        tb.dataset.open = tb.dataset.open === '1' ? '0' : '1';
    });
    tb.appendChild(head);
    tb.appendChild(body);
    return tb;
}
/* AI 正文不再固定等宽栈（2026-09-17 用户裁定）：跟随「设置 → 主题 → 字体风格」的
   界面字体档位（继承 body）。代码语义仍由 .md-body code 的 CSS 固定 Consolas 等宽，
   与界面档位无关。 */
function buildMessageRow(m, idx) {
    const row = document.createElement('div');
    row.className = 'msg';
    row.dataset.idx = idx;
    row.style.cssText = 'align-self: stretch; padding: 14px 0; display: inline-flex; align-items: flex-start; gap: 14px; width: 100%;';
    if (m.role === 'user') {
        row.style.justifyContent = 'flex-end';
        const column = document.createElement('div');
        column.style.cssText = 'display: flex; flex-direction: column; align-items: flex-end; gap: 5px; max-width: min(720px, 100%); flex: 1 1 0; min-width: 0;';
        const bubble = document.createElement('div');
        /* 用户气泡降高：竖直 padding 13→9、行高 24→21，单行气泡高度 53px → 42px（约 -21%）；
           横向 padding 17→15 保持与 AI 正文一致的左右呼吸感 */
        bubble.style.cssText = 'padding: 9px 15px; background: var(--surface); border: 1.5px solid var(--user-frame); border-radius: 18px 6px 18px 18px; display: inline-flex; flex-direction: column; gap: 4px;';
        const text = document.createElement('div');
        text.textContent = m.text;
        /* 用户气泡文本不写死字体：跟随「设置 → 主题 → 字体风格」的界面字体（继承 body），
           否则切到楷体/宋体/行书时气泡仍是雅黑，界面字体割裂 */
        text.style.cssText = 'color: var(--text-1); font-size: 15px; font-weight: 400; line-height: 21px; word-wrap: break-word; white-space: pre-wrap;';
        bubble.appendChild(text);
        if (m.contexts && m.contexts.length) {
            const ctxLine = document.createElement('div');
            ctxLine.style.cssText = 'display: flex; flex-wrap: wrap; gap: 4px;';
            m.contexts.forEach(function (name) {
                const c = document.createElement('div');
                c.textContent = '📄 ' + name;
                c.style.cssText = 'color: var(--primary-text); opacity: 0.72; font-size: 11px; font-weight: 500; background: rgba(255,255,255,0.14); border-radius: 999px; padding: 2px 8px;';
                ctxLine.appendChild(c);
            });
            bubble.appendChild(ctxLine);
        }
        const actions = document.createElement('div');
        actions.style.cssText = 'display: inline-flex; gap: 2px;';
        const copyBtn = actionBtn(ICON_COPY, t('copy'));
        copyBtn.addEventListener('click', function () { copyText(m.text); });
        const delBtn = actionBtn(ICON_TRASH, t('del'));
        delBtn.addEventListener('click', function () { deleteUserMessage(idx); });
        actions.appendChild(copyBtn);
        actions.appendChild(delBtn);
        column.appendChild(bubble);
        column.appendChild(actions);
        const avatar = document.createElement('img');
        avatar.className = 'avatar-ring';
        avatar.src = sharedAvatarSrc();
        avatar.alt = 'user';
        avatar.style.cssText = 'width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0;';
        row.appendChild(column);
        row.appendChild(avatar);
    }
    else {
        /* AI 输出不显示头像：去掉头像后 content 左边界即行左边界，与输入框（同为 920px
           容器 + 28px 内边距）左边缘严格对齐；padding-top 原为对齐头像而设，一并去掉。 */
        row.style.justifyContent = 'flex-start';
        const content = document.createElement('div');
        content.style.cssText = 'width: 100%; max-width: 720px; display: flex; flex-direction: column; gap: 12px; min-width: 0;';
        /* Work 模式：工具调用轨迹置于最终回答之前（先行动、后结论） */
        if (WORK_HOOKS.messageRowExtra) {
            const extra = WORK_HOOKS.messageRowExtra(m, idx);
            if (extra)
                content.appendChild(extra);
        }
        if (m.thinking)
            content.appendChild(buildThinkBlock(m));
        const text = document.createElement('div');
        text.className = 'ai-text';
        if (m.streaming && !m.text)
            text.innerHTML = '<div class="thinking-dots"><span></span><span></span><span></span><em>' + t('thinkingText') + '</em></div>';
        else if (!m.streaming)
            renderAiText(text, m.text, true);
        /* AI 正文跟随界面字体（设置 → 主题 → 字体风格，继承 body 档位栈）；代码块仍由
           .md-body code 的 CSS 固定 Consolas 等宽（内容语义），KaTeX 公式用自带字体 */
        text.style.cssText = 'color: var(--text-1); font-size: 15px; font-weight: 400; line-height: 24px; word-wrap: break-word;';
        content.appendChild(text);
        if (m.refs) {
            const refs = document.createElement('div');
            refs.style.cssText = 'align-self: stretch; padding-top: 12px; border-top: 1px solid var(--border-soft); display: flex; flex-direction: column; gap: 7px;';
            const refsTitle = document.createElement('div');
            refsTitle.className = 'label';
            refsTitle.dataset.i18n = 'references';
            refsTitle.textContent = t('references');
            refsTitle.style.cssText = 'color: var(--text-3); font-size: 10.5px; font-weight: 700;';
            refs.appendChild(refsTitle);
            ['Vaswani et al., 2017 — Section 3.2: Scaled Dot-Product Attention', 'Devlin et al., 2018 — Section 3.1: BERT Model Architecture'].forEach(function (r) {
                const item = document.createElement('div');
                item.style.cssText = 'display: inline-flex; justify-content: flex-start; align-items: center; gap: 8px; cursor: pointer;';
                const dot = document.createElement('div');
                dot.style.cssText = 'width: 5px; height: 5px; background: var(--text-3); border-radius: 50%; flex-shrink: 0;';
                const link = document.createElement('div');
                link.className = 'ref-link';
                link.textContent = r;
                link.style.cssText = 'color: var(--link); font-size: 12.5px; font-weight: 500;';
                item.appendChild(dot);
                item.appendChild(link);
                refs.appendChild(item);
            });
            content.appendChild(refs);
        }
        const actions = document.createElement('div');
        actions.className = 'ai-actions';
        actions.style.cssText = 'display: inline-flex; gap: 2px;' + (m.streaming ? ' visibility: hidden;' : '');
        const copyBtn = actionBtn(ICON_COPY, t('copy'));
        copyBtn.addEventListener('click', function () { copyText(m.text); });
        const regenWrap = document.createElement('div');
        regenWrap.style.cssText = 'position: relative;';
        const regenBtn = actionBtn(ICON_REGEN, t('regenerate'));
        const menu = document.createElement('div');
        menu.className = 'action-menu';
        [
            { label: t('moreDetail'), mode: 'detail' },
            { label: t('moreConcise'), mode: 'concise' },
            { label: t('regenerate'), mode: 'normal' }
        ].forEach(function (opt) {
            const item = document.createElement('div');
            item.className = 'menu-item';
            item.style.cssText = 'padding: 8px 12px; border-radius: 8px; color: var(--text-2); font-size: 12.5px; font-weight: 500;';
            item.textContent = opt.label;
            item.addEventListener('click', function (e) {
                e.stopPropagation();
                menu.classList.remove('open');
                regenerate(idx, opt.mode);
            });
            menu.appendChild(item);
        });
        regenBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const willOpen = !menu.classList.contains('open');
            document.querySelectorAll('.action-menu.open').forEach(function (mn) { mn.classList.remove('open'); });
            if (willOpen)
                menu.classList.add('open');
        });
        regenWrap.appendChild(regenBtn);
        regenWrap.appendChild(menu);
        actions.appendChild(copyBtn);
        actions.appendChild(regenWrap);
        content.appendChild(actions);
        row.appendChild(content);
    }
    return row;
}
/* ============ 发送 ============ */
const chatInput = document.getElementById('chatInput');
chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
/* 发送/暂停状态机：进行中点击 = 暂停当前输出（主输入框与阅读模式输入框共用状态） */
var sendBusy = null;
function paintSendBtn(btn, on) {
    if (!btn)
        return;
    var svg = btn.querySelector('svg.icon');
    if (!svg)
        return;
    btn.title = on ? '暂停生成' : '发送';
    btn.style.background = on ? 'var(--danger-text)' : '';
    svg.innerHTML = on
        ? '<rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" stroke="none"/>'
        : '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>';
}
function setSendBusy(on, stopFn) {
    if (on)
        sendBusy = { fn: stopFn || function () { } };
    else
        sendBusy = null;
    paintSendBtn(document.getElementById('sendBtn'), on);
    paintSendBtn(document.getElementById('readSendBtn'), on);
}
document.getElementById('sendBtn').addEventListener('click', function () {
    if (sendBusy)
        sendBusy.fn();
    else
        sendMessage();
});
function sendMessage(textOverride) {
    const text = (textOverride !== undefined ? String(textOverride) : chatInput.value).trim();
    if (!text && !contextPicks.length)
        return;
    const conv = currentConv();
    if (!conv)
        return;
    /* Work 会话未绑定工作区：静默转为 Chat，消息照常发出 */
    if (conv.mode === 'work' && !convHasWorkspace(conv)) {
        conv.mode = 'chat';
        conv.agentId = null;
        sidebarMode = 'chat';
        renderModeActions(false);
        updateModeSwitcher();
        renderConversations();
        renderRightPanel();
    }
    const ctx = contextPicks.map(function (c) { return c.name; });
    conv.messages.push({ role: 'user', text: text || ' ', contexts: ctx });
    if (conv.isNew && text) {
        conv.title = text.slice(0, 26);
        conv.isNew = false;
    }
    if (activeConvId === 'draft') {
        conversations.unshift(conv);
        activeConvId = conv.id;
        draft = null;
        playSwap();
    }
    conv.updatedAt = Date.now();
    if (textOverride === undefined)
        chatInput.value = '';
    contextPicks = [];
    /* 阅读模式下保留文档上下文芯片 */
    if (readMode && readMode.fileName) {
        contextPicks.push({ type: readMode.source === 'kb' ? 'kb' : 'file', name: readMode.fileName });
    }
    renderCtxChips();
    renderRightPanel();
    renderConversations();
    renderMessages();
    const aiMsg = { role: 'ai', text: '', streaming: true };
    const userCount = conv.messages.filter(function (m) { return m.role === 'user'; }).length;
    conv.messages.push(aiMsg);
    renderMessages();
    /* 仅新增的两条消息播入场动画，历史消息静止 */
    const newRows = msgHost().querySelectorAll('.msg');
    if (newRows[newRows.length - 2])
        newRows[newRows.length - 2].style.animation = 'msgIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both';
    if (newRows[newRows.length - 1])
        newRows[newRows.length - 1].style.animation = 'msgIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; animation-delay: 0.06s;';
    /* Work 会话 → Agent 链路（多步工具调用 + 轨迹流式渲染）；Chat 会话不受影响 */
    if (WORK_HOOKS.runTurn && WORK_HOOKS.runTurn(conv, aiMsg))
        return;
    /* 真实后端（桌面版 / 带 token 的本地服务）→ 流式调用；否则本地演示 */
    if (typeof window.CS_BACKEND !== 'undefined' && window.CS_BACKEND && getModels().some(function (m) { return m.key === activeModelKey; })) {
        runRealChat(conv, aiMsg);
        return;
    }
    setTimeout(function () {
        const list = getModels();
        const active = list.find(function (m) { return m.key === activeModelKey; });
        const hasDoc = conv.docCtx && conv.docCtx.text;
        if (active && hasDoc) {
            /* 文档上下文：先显示解析中，再流式输出基于文档的回答 */
            aiMsg.text = t('docParsing');
            startStream(msgHost().querySelectorAll('.msg')[conv.messages.length - 1], aiMsg);
            setTimeout(function () {
                aiMsg.text = userCount <= 1
                    ? t('docReply')(active, conv.docCtx.fileName, conv.docCtx.text.length)
                    : t('docReplyMore')(active, conv.docCtx.fileName);
                startStream(msgHost().querySelectorAll('.msg')[conv.messages.length - 1], aiMsg);
            }, 900);
            return;
        }
        if (active) {
            aiMsg.text = t('demoReply')({ name: active.name, provider: active.providerName, ctx: active.ctx });
        }
        else {
            aiMsg.text = t('demoReplyNoModel')();
        }
        const rows = msgHost().querySelectorAll('.msg');
        startStream(rows[conv.messages.length - 1], aiMsg);
    }, 500);
}
/* ============ 真实 AI 调用（桌面版后端 / 本地服务，SSE 流式） ============ */
function docContextSystem(fileName, text) {
    return '你是一位严谨的论文阅读与研究助手。用户提供了论文《' + fileName + '》的全文，请基于该文档内容回答问题，必要时引用论文中的章节、公式或实验结论。若问题超出文档范围，请先基于文档回答，再补充你的通用知识并明确区分。\n\n===== 论文全文开始 =====\n' + text + '\n===== 论文全文结束 =====';
}
/* SSE 消费：data: {...} / data: [DONE]，事件回调 reasoning/delta/meta/error */
async function consumeChatStream(resp, ev) {
    const reader = resp.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
        const r = await reader.read();
        if (r.done)
            break;
        buf += dec.decode(r.value, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n')) > -1) {
            const line = buf.slice(0, idx).trim();
            buf = buf.slice(idx + 1);
            if (!line.startsWith('data:'))
                continue;
            const payload = line.slice(5).trim();
            if (payload === '[DONE]')
                return;
            try {
                const j = JSON.parse(payload);
                if (j.error && ev.error)
                    ev.error(j.error);
                if (j.reasoning && ev.reasoning)
                    ev.reasoning(j.reasoning);
                if (j.delta && ev.delta)
                    ev.delta(j.delta);
                if (j.done && ev.meta)
                    ev.meta(j);
            }
            catch (e) { /* 忽略 */ }
        }
    }
}
/* ChatScience Chat 模式系统提示词（科研探讨助手；共享语言规则，学术严谨风格） */
const CHAT_SYSTEM_ZH = [
    '# 角色',
    '你是 ChatScience，一个专注于科研问题探讨的 AI 助手。你的价值在于帮助用户更深入、更严谨地思考科研问题，而不是代替用户得出结论。',
    '# 核心能力',
    '1. 概念解析：复杂科研概念先给出准确定义，再拆解内涵与外延，必要时辨析常见误解。',
    '2. 背景知识：提供问题所属领域的脉络——由来、主流观点、代表性工作与争议点。',
    '3. 研究思路梳理：把模糊的研究想法整理为清晰的问题定义、假设、变量与技术路线；主动指出逻辑缺口与需先行验证的前提。',
    '4. 学术讨论：批判性回应用户观点，既指出合理之处也指出薄弱环节；区分「事实」「主流共识」「有争议的观点」「推测」。',
    '5. 方法与文献：推荐适配的研究方法、实验设计与统计分析路径；给出检索关键词与代表方向，不虚构文献条目。',
    '6. 跨学科整合：说明多学科视角差异、可迁移的概念模型与结合点。',
    '# 交流规范',
    '- 术语首次出现给简明解释；公式与符号用规范记法；区分相关性与因果性。',
    '- 结论先行、论证随后，长回答结构化分层。',
    '- 不编造事实、数据或文献；超出知识范围或知识截止时间的内容明确声明，建议用户检索验证。',
    '- 问题过宽时先给出可讨论的框架，再确认用户真正关注的方向。',
    '- 始终使用中文回答，除非用户使用其他语言。'
].join('\n');
const CHAT_SYSTEM_EN = [
    '# Role',
    'You are ChatScience, an AI assistant focused on scientific research discussion. Your value is helping the user think about research problems more deeply and rigorously, not drawing conclusions for them.',
    '# Core capabilities',
    '1. Concept analysis: define complex research concepts precisely, then unpack their scope; address common misconceptions when relevant.',
    '2. Background: provide the context of the field - origins, mainstream views, representative work, and open controversies.',
    '3. Research framing: turn vague ideas into clear problem statements, hypotheses, variables, and technical routes; point out logical gaps.',
    '4. Academic discussion: respond critically, noting both strengths and weaknesses; distinguish facts, consensus, contested claims, and speculation.',
    '5. Methods & literature: recommend suitable methods, experimental designs, and statistical paths; give search keywords and representative directions; never fabricate references.',
    '6. Cross-disciplinary integration: explain differing disciplinary perspectives, transferable models, and integration points.',
    '# Communication',
    '- Explain terms on first use; use standard notation; distinguish correlation from causation.',
    '- Conclusion first, then reasoning; structure long answers hierarchically.',
    '- Never fabricate facts, data, or citations; state clearly what is beyond your knowledge or cutoff, and suggest verification.',
    '- For overly broad questions, propose a discussion frame first, then confirm the user\'s focus.',
    '- Always respond in English regardless of the input language.'
].join('\n');
function buildChatMessages(conv) {
    const msgs = [];
    const lang = (typeof getLang === 'function') ? getLang() : 'zh';
    msgs.push({ role: 'system', content: lang === 'en' ? CHAT_SYSTEM_EN : CHAT_SYSTEM_ZH });
    if (conv.docCtx && conv.docCtx.text) {
        msgs.push({ role: 'system', content: docContextSystem(conv.docCtx.fileName, conv.docCtx.text) });
    }
    const ms = conv.messages;
    ms.forEach(function (m, i) {
        if (i === ms.length - 1 && m.role === 'ai' && m.streaming)
            return;
        if (!m.text || m.text === t('docParsing'))
            return;
        msgs.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text });
    });
    return msgs;
}
async function runRealChat(conv, aiMsg) {
    const list = getModels();
    const active = list.find(function (m) { return m.key === activeModelKey; }) || list[0];
    const textEl0 = msgHost().querySelectorAll('.msg')[conv.messages.length - 1];
    const textEl = textEl0 ? textEl0.querySelector('.ai-text') : null;
    const ctl = new AbortController();
    setSendBusy(true, function () { ctl.abort(); });
    if (window.csMarkRunning)
        window.csMarkRunning(conv.id, true); /* 侧栏转圈 */
    let full = '';
    let think = '';
    let thinkDone = false;
    const thinkStart = Date.now();
    let rafPending = false;
    let thinkRaf = false;
    /* rAF 驱动：每帧最多渲染一次，delta 到达即请求（不丢帧、不卡顿） */
    function requestPaint() {
        if (rafPending || !textEl)
            return;
        rafPending = true;
        requestAnimationFrame(function () {
            rafPending = false;
            if (!textEl)
                return;
            paintStreaming(textEl, full);
            window.csStickScroll(msgHost());
        });
    }
    /* 思考流：小字折叠块展开流式输出，正文首字到达即自动收起 */
    function ensureThinkBlock() {
        if (!textEl || !textEl.parentElement)
            return null;
        let tb = textEl.parentElement.querySelector(':scope > .think-block');
        if (!tb) {
            tb = buildThinkBlock({ thinking: '' });
            tb.dataset.open = '1';
            textEl.parentElement.insertBefore(tb, textEl);
        }
        return tb;
    }
    function requestThink() {
        if (thinkRaf)
            return;
        thinkRaf = true;
        requestAnimationFrame(function () {
            thinkRaf = false;
            const tb = ensureThinkBlock();
            if (!tb)
                return;
            const body = tb.querySelector('.think-body');
            if (body) {
                body.textContent = think;
                body.scrollTop = body.scrollHeight;
            }
            window.csStickScroll(msgHost());
        });
    }
    function collapseThink() {
        if (thinkDone)
            return;
        thinkDone = true;
        const tb = textEl ? textEl.parentElement.querySelector(':scope > .think-block') : null;
        if (tb) {
            tb.dataset.open = '0';
            const ht = tb.querySelector('.think-head-t');
            if (ht)
                ht.textContent = t('thoughtDone') + '（' + Math.max(1, Math.round((Date.now() - thinkStart) / 1000)) + 's）';
        }
    }
    try {
        const resp = await fetch(window.CS_BACKEND.base + '/api/chat', {
            method: 'POST',
            signal: ctl.signal,
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + window.CS_BACKEND.token },
            body: JSON.stringify({
                providerId: active.providerId,
                model: active.modelId,
                apiKey: active.apiKey || '',
                temperature: active.temperature || '',
                web: active.web !== false,
                thinking: chatThinkingOn(),
                messages: buildChatMessages(conv)
            })
        });
        if (!resp.ok || !resp.body)
            throw new Error('HTTP ' + resp.status);
        let failed = null;
        await consumeChatStream(resp, {
            reasoning: function (d) { think += d; aiMsg.thinking = think; requestThink(); },
            delta: function (d) { full += d; aiMsg.text = full; collapseThink(); requestPaint(); },
            meta: function (j) { aiMsg._metrics = { ttftMs: j.ttftMs, totalMs: j.totalMs, chars: j.chars }; },
            error: function (msg) { failed = msg; }
        });
        if (!full && failed)
            throw new Error(failed);
        collapseThink();
        aiMsg.text = full;
        aiMsg.streaming = false;
        renderAiText(textEl, full, true);
        window.csStickScroll(msgHost());
        if (window.csMarkRunning)
            window.csMarkRunning(conv.id, false);
        const actions = msgHost().querySelectorAll('.msg')[conv.messages.length - 1];
        const act = actions ? actions.querySelector('.ai-actions') : null;
        if (act)
            act.style.visibility = 'visible';
        if (window.csDesktop)
            window.csDesktop.notify(t('notifyDone'), full.slice(0, 80));
        setSendBusy(false);
    }
    catch (err) {
        setSendBusy(false);
        if (window.csMarkRunning)
            window.csMarkRunning(conv.id, false);
        if (ctl.signal.aborted) {
            aiMsg.text = (full || '') + '\r\n\r\n[已暂停]';
            aiMsg.streaming = false;
            renderAiText(textEl, aiMsg.text, false);
            window.csStickScroll(msgHost());
            const act0 = textEl0 ? textEl0.querySelector('.ai-actions') : null;
            if (act0)
                act0.style.visibility = 'visible';
            return;
        }
        aiMsg.text = '【' + t('notifyFail') + '】' + err.message;
        aiMsg.streaming = false;
        renderAiText(textEl, aiMsg.text, false);
        window.csStickScroll(msgHost());
        const act = textEl0 ? textEl0.querySelector('.ai-actions') : null;
        if (act)
            act.style.visibility = 'visible';
        if (window.csDesktop)
            window.csDesktop.notify(t('notifyFail'), String(err.message).slice(0, 80));
    }
}
/* ============ 已添加模型管理（编辑 / 删除 / 思考强度） ============ */
var THINK_STRENGTHS = [['off', '关闭'], ['low', '低'], ['medium', '中'], ['high', '高']];
function renderModelManage() {
    var host = document.getElementById('modelManageList');
    if (!host)
        return;
    var list = getModels();
    host.innerHTML = '';
    if (!list.length) {
        var e0 = document.createElement('div');
        e0.style.cssText = 'color: var(--text-3); font-size: 11.5px; padding: 2px;';
        e0.textContent = '尚未添加模型';
        host.appendChild(e0);
        return;
    }
    list.forEach(function (m) {
        var row = document.createElement('div');
        row.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: var(--accent-soft); border-radius: 10px;';
        var col = document.createElement('div');
        col.style.cssText = 'flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 1px;';
        var n1 = document.createElement('div');
        n1.style.cssText = 'color: var(--text-1); font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
        n1.textContent = m.name + ' · ' + (m.provider || m.providerName || '');
        var n2 = document.createElement('div');
        n2.style.cssText = 'color: var(--text-3); font-size: 10.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
        n2.textContent = m.modelId + ' · 思考 ' + (m.thinkingStrength || 'off');
        col.appendChild(n1);
        col.appendChild(n2);
        row.appendChild(col);
        var edit = document.createElement('div');
        edit.className = 'action-btn';
        edit.textContent = '编辑';
        edit.style.cssText = 'font-size: 11px; width: auto; padding: 0 8px; flex-shrink: 0;';
        edit.addEventListener('click', function () { openModelEditDialog(m.key); });
        var del = document.createElement('div');
        del.className = 'action-btn';
        del.textContent = '删除';
        del.style.cssText = 'font-size: 11px; width: auto; padding: 0 8px; color: var(--danger-text); flex-shrink: 0;';
        del.addEventListener('click', function () {
            showConfirm('删除模型「' + m.name + '」？此操作不可撤销。', function () {
                saveModels(getModels().filter(function (x) { return x.key !== m.key; }));
                if (activeModelKey === m.key) {
                    activeModelKey = null;
                    try {
                        localStorage.removeItem('cs-active-model');
                    }
                    catch (e) { }
                    refreshModelMenu();
                }
                renderModelManage();
            });
        });
        row.appendChild(edit);
        row.appendChild(del);
        host.appendChild(row);
    });
}
function openModelEditDialog(key) {
    var m = getModels().find(function (x) { return x.key === key; });
    if (!m)
        return;
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    var box = document.createElement('div');
    box.className = 'modal';
    box.style.cssText = 'width: 460px; min-height: 0;';
    var title = document.createElement('div');
    title.style.cssText = 'color: var(--text-1); font-size: 16px; font-weight: 700; margin-bottom: 14px;';
    title.textContent = '编辑模型';
    box.appendChild(title);
    function field(label, value, readonly, mono) {
        var w = document.createElement('div');
        w.style.cssText = 'display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px;';
        var l = document.createElement('div');
        l.style.cssText = 'color: var(--text-2); font-size: 11.5px; font-weight: 600;';
        l.textContent = label;
        w.appendChild(l);
        var i2 = document.createElement('input');
        i2.className = 'field-input';
        i2.value = value == null ? '' : value;
        if (readonly) {
            i2.readOnly = true;
            i2.style.opacity = '0.6';
            i2.title = '不可修改';
        }
        if (mono)
            i2.style.fontFamily = 'var(--mono)';
        w.appendChild(i2);
        return { wrap: w, input: i2 };
    }
    var fId = field('模型 ID（不可修改）', m.modelId, true, true);
    box.appendChild(fId.wrap);
    var fKey = field('API Key（不可修改）', String(m.apiKey || '').replace(/^(.{6}).*(.{4})$/, '$1****$2'), true, true);
    box.appendChild(fKey.wrap);
    var fName = field('显示名', m.name, false, false);
    box.appendChild(fName.wrap);
    var tsLabel = document.createElement('div');
    tsLabel.style.cssText = 'color: var(--text-2); font-size: 11.5px; font-weight: 600; margin-bottom: 4px;';
    tsLabel.textContent = '思考强度（按厂商官方参数注入；仅用于 Work 模式档位映射，Chat 默认不思考）';
    box.appendChild(tsLabel);
    var seg = document.createElement('div');
    seg.className = 'seg';
    seg.style.marginBottom = '10px';
    var strength = m.thinkingStrength || 'off';
    THINK_STRENGTHS.forEach(function (t2) {
        var it = document.createElement('div');
        it.className = 'seg-item' + (strength === t2[0] ? ' selected' : '');
        it.textContent = t2[1];
        it.addEventListener('click', function () { strength = t2[0]; seg.querySelectorAll('.seg-item').forEach(function (x) { x.classList.remove('selected'); }); it.classList.add('selected'); });
        seg.appendChild(it);
    });
    box.appendChild(seg);
    var fTemp = field('温度（留空 = 官方默认）', m.temperature, false, false);
    box.appendChild(fTemp.wrap);
    var fIn = field('最大输入 tokens（留空 = 模型上限）', m.maxInTokens, false, false);
    box.appendChild(fIn.wrap);
    var fOut = field('最大输出 tokens（留空 = 模型上限）', m.maxOutTokens, false, false);
    box.appendChild(fOut.wrap);
    var foot = document.createElement('div');
    foot.style.cssText = 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px;';
    var cancel = document.createElement('div');
    cancel.className = 'btn';
    cancel.style.cssText = 'padding: 8px 16px; border-radius: 999px; background: var(--accent-soft); color: var(--text-2); font-size: 12.5px; font-weight: 600; cursor: pointer;';
    cancel.textContent = '取消';
    var ok = document.createElement('div');
    ok.className = 'btn btn-primary';
    ok.style.cssText = 'padding: 8px 20px; border-radius: 999px; font-size: 12.5px; font-weight: 600; cursor: pointer;';
    ok.textContent = '保存';
    foot.appendChild(cancel);
    foot.appendChild(ok);
    box.appendChild(foot);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    overlay.classList.add('show');
    requestAnimationFrame(function () { overlay.classList.add('visible'); });
    function closeIt() { overlay.classList.remove('visible'); setTimeout(function () { overlay.remove(); }, 200); }
    cancel.addEventListener('click', closeIt);
    overlay.addEventListener('click', function (e) { if (e.target === overlay)
        closeIt(); });
    ok.addEventListener('click', function () {
        m.name = fName.input.value.trim() || m.name;
        m.thinkingStrength = strength;
        m.temperature = fTemp.input.value.trim();
        var mi = parseInt(fIn.input.value, 10);
        m.maxInTokens = isNaN(mi) ? m.maxInTokens : mi;
        var mo = parseInt(fOut.input.value, 10);
        m.maxOutTokens = isNaN(mo) ? m.maxOutTokens : mo;
        saveModels(getModels().map(function (x) { return x.key === m.key ? m : x; }));
        refreshModelMenu();
        renderModelManage();
        closeIt();
        showToast('已保存');
    });
}
/* ============ 润色（使用当前所选模型） ============ */
function polishNow() {
    const text = chatInput.value.trim();
    if (!text) {
        showToast(t('polishEmpty'));
        return;
    }
    const list = getModels();
    const active = list.find(function (m) { return m.key === activeModelKey; });
    if (!active) {
        showToast(t('toastNoModel'));
        return;
    }
    const polished = t('polishResult')(active, text);
    chatInput.value = '';
    let i = 0;
    const timer = setInterval(function () {
        i = Math.min(polished.length, i + 3);
        chatInput.value = polished.slice(0, i);
        if (i >= polished.length) {
            clearInterval(timer);
            showToast(t('polished'));
        }
    }, 16);
}
document.getElementById('polishBtn').addEventListener('click', polishNow);
/* ---- 上下文资料（右侧栏 + 输入框芯片） ---- */
let contextPicks = [];
const ICON_DOC = '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>';
const ICON_DB = '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>';
/* 经输入框「+」菜单挂载到本次对话的资源图标（插件 / 技能 / MCP 连接器） */
const ICON_SKILL = '<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>';
const ICON_PLUGIN = '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>';
const ICON_MCP = '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>';
function ctxPickIcon(type) {
    if (type === 'skill')
        return ICON_SKILL;
    if (type === 'plugin')
        return ICON_PLUGIN;
    if (type === 'mcp')
        return ICON_MCP;
    return type === 'db' ? ICON_DB : ICON_DOC;
}
/* Work 词条（80-i18n）由 90-boot 合并进主脚本 i18n；此处做存在性兜底，
   词条缺失时返回空串而不是 "undefined"。 */
function ctxPickName(type) {
    const key = type === 'skill' ? 'wPlusMenuSkills' : (type === 'plugin' ? 'wPlusMenuPlugins' : (type === 'mcp' ? 'wPlusMenuMcp' : ''));
    if (!key)
        return '';
    const d = i18n[getLang()];
    return (d && d[key]) ? String(d[key]) : '';
}
function ctxPickLabel(type) {
    const n = ctxPickName(type);
    return n ? (n + ' · ') : '';
}
/* ref 可选：插件 / 技能 / MCP 连接器用稳定标识（key / slug）参与匹配，
   避免同名条目之间选中态与移除操作相互串扰；文件、知识库、数据库不传 ref，
   沿用按 name 匹配的原行为。 */
function toggleContext(type, name, ref) {
    const probe = (ref === undefined || ref === null) ? name : ref;
    const pickRef = function (c) { return (c.ref === undefined || c.ref === null) ? c.name : c.ref; };
    const i = contextPicks.findIndex(function (c) { return c.type === type && pickRef(c) === probe; });
    if (i > -1)
        contextPicks.splice(i, 1);
    else
        contextPicks.push((ref === undefined || ref === null)
            ? { type: type, name: name }
            : { type: type, name: name, ref: ref });
    renderRightPanel();
    renderCtxChips();
}
let ctxCollapse = { proj: false, lib: false, dbs: false };
function ctxFileName(f) { return typeof f === 'string' ? f : f.name; }
function ctxFilePinned(f) { return typeof f === 'string' ? false : !!f.pinned; }
function pinFirst(a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0); }
function getCtxProject() {
    const conv = currentConv();
    return conv && conv.projectId ? projects.find(function (p) { return p.id === conv.projectId; }) : null;
}
/* 会话动态资料：项目会话读写项目，普通会话（含草稿）读写会话自身 */
function getCtxLocal() {
    const p = getCtxProject();
    if (p)
        return p.files || [];
    const c = currentConv();
    return c ? (c.localFiles || []) : [];
}
function getCtxKb() {
    const p = getCtxProject();
    if (p)
        return p.kbFiles || [];
    const c = currentConv();
    return c ? (c.kbFiles || []) : [];
}
function getCtxDbList() {
    const p = getCtxProject();
    if (p)
        return p.dbs || [];
    const c = currentConv();
    return c ? (c.dbs || []) : [];
}
function setCtxPinned(type, name, val) {
    if (type === 'file') {
        const f = getCtxLocal().find(function (x) { return ctxFileName(x) === name; });
        if (f && typeof f === 'object')
            f.pinned = val;
    }
    else if (type === 'kb') {
        const f = getCtxKb().find(function (x) { return x.fileName === name; });
        if (f)
            f.pinned = val;
    }
    else {
        const d = getCtxDbList().find(function (x) { return (typeof x === 'string' ? x : x.name) === name; });
        if (d && typeof d === 'object')
            d.pinned = val;
    }
}
function removeCtxItem(type, name) {
    const p = getCtxProject();
    const c = currentConv();
    const store = p || c;
    if (!store)
        return;
    if (type === 'file') {
        const na = getCtxLocal().filter(function (x) { return ctxFileName(x) !== name; });
        if (p)
            p.files = na;
        else
            c.localFiles = na;
    }
    else if (type === 'kb') {
        const na = getCtxKb().filter(function (x) { return x.fileName !== name; });
        if (p)
            p.kbFiles = na;
        else
            c.kbFiles = na;
    }
    else if (type === 'db') {
        const na = getCtxDbList().filter(function (x) { return (typeof x === 'string' ? x : x.name) !== name; });
        if (p)
            p.dbs = na;
        else
            c.dbs = na;
    }
    contextPicks = contextPicks.filter(function (c2) { return !(c2.type === type && c2.name === name); });
    if (typeof readMode !== 'undefined' && readMode && readMode.fileName === name)
        exitReadMode(true);
    renderRightPanel();
    renderCtxChips();
}
function importKbFiles(sel) {
    const p = getCtxProject();
    const c = currentConv();
    if (!p && !c)
        return;
    const arr = p ? (p.kbFiles = p.kbFiles || []) : (c.kbFiles = c.kbFiles || []);
    (sel || []).forEach(function (s) {
        if (!arr.some(function (x) { return x.fileName === s.fileName && x.kbId === s.kbId; })) {
            arr.push({ kbId: s.kbId, fileName: s.fileName, pinned: false });
        }
    });
    renderRightPanel();
}
function openCtxReader(type, ref) {
    if (type === 'kb') {
        const entry = getCtxKb().find(function (x) { return x.fileName === ref; });
        if (entry)
            enterReadMode('kb', { kbId: entry.kbId, fileName: entry.fileName });
    }
    else if (type === 'ws') {
        enterReadMode('ws', ref);
    }
    else if (type === 'file') {
        const f = getCtxLocal().find(function (x) { return ctxFileName(x) === ref; });
        if (f)
            enterReadMode('local', { fileName: ref });
    }
}
function fmtSize(b) {
    if (b == null)
        return '';
    if (b >= 1048576)
        return (b / 1048576).toFixed(1) + 'MB';
    if (b >= 1024)
        return Math.round(b / 1024) + 'KB';
    return b + 'B';
}
function ctxMetaOf(c) {
    let kind = null, size = null;
    if (c.type === 'kb') {
        const e = getCtxKb().find(function (x) { return x.fileName === c.name; });
        const f = e ? getKbFile(e.kbId, e.fileName) : null;
        if (f) {
            kind = f.kind || fileKindFromName(f.name);
            if (f.data)
                size = (f.data.byteLength !== undefined) ? f.data.byteLength : f.data.length;
        }
    }
    else if (c.type === 'file') {
        const f = getCtxLocal().find(function (x) { return ctxFileName(x) === c.name; });
        if (f) {
            kind = f.kind || fileKindFromName(ctxFileName(f));
            if (f.data)
                size = (f.data.byteLength !== undefined) ? f.data.byteLength : f.data.length;
        }
    }
    if (c.size != null)
        size = c.size;
    if (c.kind)
        kind = c.kind;
    return { kind: kind, size: size };
}
function renderCtxChips() {
    const box = document.getElementById('ctxChips');
    if (!box)
        return;
    box.innerHTML = '';
    if (!contextPicks.length) {
        box.style.display = 'none';
        return;
    }
    box.style.display = 'flex';
    const filePicks = contextPicks.filter(function (c) { return c.type === 'kb' || c.type === 'file'; });
    const otherPicks = contextPicks.filter(function (c) { return c.type !== 'kb' && c.type !== 'file'; });
    /* 文件卡片（图一：图标 + 名称 + 类型·大小 + 移除） */
    filePicks.forEach(function (c) {
        const meta = ctxMetaOf(c);
        const card = document.createElement('div');
        card.className = 'ctx-file-card';
        const ic = document.createElement('div');
        ic.style.cssText = 'width: 30px; height: 30px; border-radius: 8px; background: var(--danger-bg); color: var(--danger-text); display: flex; justify-content: center; align-items: center; flex-shrink: 0;';
        ic.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">' + fileIconByKind(meta.kind || fileKindFromName(c.name)) + '</svg>';
        const col = document.createElement('div');
        col.style.cssText = 'display: flex; flex-direction: column; gap: 2px; min-width: 0;';
        const n1 = document.createElement('div');
        n1.textContent = c.name;
        n1.style.cssText = 'font-size: 13.5px; font-weight: 600; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px;';
        const n2 = document.createElement('div');
        n2.textContent = (meta.kind || 'file').toUpperCase() + (meta.size ? ' · ' + fmtSize(meta.size) : '');
        n2.style.cssText = 'font-size: 11.5px; color: var(--text-3);';
        col.appendChild(n1);
        col.appendChild(n2);
        const x = document.createElement('div');
        x.textContent = '×';
        x.title = t('fileCardRemove');
        x.style.cssText = 'color: var(--text-3); cursor: pointer; font-size: 16px; line-height: 1; flex-shrink: 0; padding: 2px 4px;';
        x.addEventListener('click', function (e) { e.stopPropagation(); toggleContext(c.type, c.name); });
        card.appendChild(ic);
        card.appendChild(col);
        card.appendChild(x);
        card.addEventListener('click', function () {
            if (c.type === 'kb')
                openCtxReader('kb', c.name);
            else
                openCtxReader('file', c.name);
        });
        box.appendChild(card);
    });
    /* 快捷指令（有文件上下文时显示，点击填入提示词） */
    if (filePicks.length) {
        const quickRow = document.createElement('div');
        quickRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px;';
        [
            { label: t('quickSum'), prompt: '请详细总结这篇文档的内容，按章节结构输出要点。' },
            { label: t('quickPpt'), prompt: '请根据这篇文档的内容生成一份 PPT 大纲（Markdown 分页结构，每页含标题与要点）。' },
            { label: t('quickMind'), prompt: '请根据这篇文档的内容生成思维导图（Markdown 层级列表）。' }
        ].forEach(function (q) {
            const chip = document.createElement('div');
            chip.className = 'ctx-quick-chip';
            const lbl = document.createElement('div');
            lbl.textContent = q.label;
            const ar = document.createElement('div');
            ar.className = 'ctx-quick-arrow';
            ar.textContent = '→';
            chip.appendChild(lbl);
            chip.appendChild(ar);
            chip.addEventListener('click', function () {
                chatInput.value = q.prompt;
                chatInput.focus();
            });
            quickRow.appendChild(chip);
        });
        box.appendChild(quickRow);
    }
    /* 数据库等其他上下文小芯片 */
    if (otherPicks.length) {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px;';
        otherPicks.forEach(function (c) {
            const chip = document.createElement('div');
            chip.style.cssText = 'padding: 5px 10px; background: var(--chip-bg); border: 1px solid var(--border); border-radius: 999px; display: flex; align-items: center; gap: 6px; max-width: 260px;';
            const ic = document.createElement('div');
            ic.style.cssText = 'width: 12px; height: 12px; color: var(--text-2); flex-shrink: 0;';
            ic.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ctxPickIcon(c.type) + '</svg>';
            const nameEl = document.createElement('div');
            nameEl.textContent = c.name;
            const typeTag = ctxPickLabel(c.type);
            if (typeTag)
                nameEl.title = typeTag + c.name;
            nameEl.style.cssText = 'font-size: 12px; font-weight: 500; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
            const x = document.createElement('div');
            x.textContent = '×';
            x.style.cssText = 'color: var(--text-3); cursor: pointer; font-size: 14px; line-height: 1;';
            x.addEventListener('click', function () { toggleContext(c.type, c.name, c.ref); });
            chip.appendChild(ic);
            chip.appendChild(nameEl);
            chip.appendChild(x);
            row.appendChild(chip);
        });
        box.appendChild(row);
    }
}
function renderRightPanel() {
    const list = document.getElementById('ctxList');
    if (!list)
        return;
    /* 签名守卫：作用域/文件/选中态都没变时跳过重建——消除切换会话/项目时右栏闪动 */
    const sigProject = getCtxProject();
    const sigConv = currentConv();
    const sig = JSON.stringify([
        sigProject ? sigProject.id : null,
        sigConv ? sigConv.id : null,
        sigProject && sigProject._wsScan ? sigProject._wsScan.t : 0,
        getCtxLocal().map(ctxFileName),
        getCtxKb().map(function (x) { return x.fileName; }),
        getCtxDbList().map(function (x) { return typeof x === 'string' ? x : x.name; }),
        contextPicks,
        searchQuery || '',
        ctxCollapse
    ]);
    if (list.dataset.sig === sig && list.childElementCount)
        return;
    list.dataset.sig = sig;
    list.innerHTML = '';
    const project = getCtxProject();
    const q = (searchQuery || '').toLowerCase();
    function match(name) { return !q || name.toLowerCase().indexOf(q) !== -1; }
    function emptyNode(text) {
        const e = document.createElement('div');
        e.textContent = text;
        e.style.cssText = 'color: var(--text-3); font-size: 11.5px; padding: 2px 2px; line-height: 17px;';
        return e;
    }
    function groupBox() {
        /* 历史版本：无子容器滚动，整体随 ctxList 滚动；展开时带下拉动画 */
        const box = document.createElement('div');
        box.className = 'ctx-drop';
        box.style.cssText = 'align-self: stretch; display: flex; flex-direction: column; gap: 1px;';
        return box;
    }
    function sectionHead(label, key, importFn, importTitle) {
        const head = document.createElement('div');
        head.style.cssText = 'align-self: stretch; display: flex; justify-content: space-between; align-items: center; padding: 0 2px; cursor: pointer; user-select: none;';
        const left = document.createElement('div');
        left.style.cssText = 'display: flex; align-items: center; gap: 4px;';
        const chev = document.createElement('div');
        chev.style.cssText = 'width: 11px; height: 11px; color: var(--text-3); transition: transform 0.2s ease;' + (ctxCollapse[key] ? '' : ' transform: rotate(90deg);');
        chev.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
        const lab = document.createElement('div');
        lab.textContent = label;
        lab.style.cssText = 'color: var(--text-1); font-size: 13px; font-weight: 800; letter-spacing: -0.01em;';
        left.appendChild(chev);
        left.appendChild(lab);
        head.appendChild(left);
        if (importFn) {
            const imp = document.createElement('div');
            imp.className = 'icon-ghost';
            imp.title = importTitle;
            imp.style.cssText = 'width: 22px; height: 22px; display: flex; justify-content: center; align-items: center; color: var(--text-3); cursor: pointer;';
            imp.innerHTML = '<div style="width: 13px; height: 13px;"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg></div>';
            imp.addEventListener('click', function (e) { e.stopPropagation(); importFn(); });
            head.appendChild(imp);
        }
        head.addEventListener('click', function () {
            ctxCollapse[key] = !ctxCollapse[key];
            renderRightPanel();
        });
        return head;
    }
    function itemRow(type, name, meta, iconSvg, pinned, rowClick) {
        const selected = contextPicks.some(function (c) { return c.type === type && c.name === name; });
        const row = document.createElement('div');
        row.className = 'ctx-row';
        row.style.cssText = 'align-self: stretch; padding: 7px 8px; display: flex; align-items: center; gap: 9px;' + (selected ? ' background: var(--accent-soft);' : '');
        const ic = document.createElement('div');
        ic.style.cssText = 'width: 14px; height: 14px; flex-shrink: 0; color: ' + (selected ? 'var(--accent-text)' : 'var(--text-3)') + ';';
        ic.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + iconSvg + '</svg>';
        const col = document.createElement('div');
        col.style.cssText = 'flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 1px;';
        const n1 = document.createElement('div');
        n1.textContent = name;
        n1.style.cssText = 'font-size: 12.5px; font-weight: 500; color: ' + (selected ? 'var(--accent-text)' : 'var(--text-1)') + '; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
        col.appendChild(n1);
        if (meta) {
            const n2 = document.createElement('div');
            n2.textContent = meta;
            n2.style.cssText = 'font-size: 10.5px; color: var(--text-3);';
            col.appendChild(n2);
        }
        const addBtn = document.createElement('div');
        addBtn.style.cssText = 'width: 20px; height: 20px; flex-shrink: 0; border-radius: 6px; border: 1px solid ' + (selected ? 'var(--accent-text)' : 'var(--border)') + '; background: transparent; color: ' + (selected ? 'var(--accent-text)' : 'var(--text-3)') + '; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: all 0.15s ease;';
        addBtn.innerHTML = selected
            ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width: 11px; height: 11px;"><path d="M5 12h14"/></svg>'
            : '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width: 11px; height: 11px;"><path d="M12 5v14"/><path d="M5 12h14"/></svg>';
        addBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleContext(type, name); });
        const moreWrap = document.createElement('div');
        moreWrap.className = 'ctx-more';
        moreWrap.style.cssText = 'position: relative; flex-shrink: 0;';
        const moreBtn = document.createElement('div');
        moreBtn.className = 'icon-ghost';
        moreBtn.style.cssText = 'width: 22px; height: 20px; display: flex; justify-content: center; align-items: center; color: var(--text-3); cursor: pointer; font-size: 13px; letter-spacing: 0.5px;';
        moreBtn.textContent = '···';
        const menu = document.createElement('div');
        menu.className = 'action-menu';
        menu.style.cssText += 'bottom: auto; top: calc(100% + 6px); left: auto; right: 0; transform-origin: top right; min-width: 108px;';
        [
            { label: pinned ? t('unpin') : t('pin'), act: function () { setCtxPinned(type, name, !pinned); renderRightPanel(); } },
            { label: t('confirmDelete'), act: function () { showConfirm(t('ctxDelConfirm')(name), function () { removeCtxItem(type, name); }); } }
        ].forEach(function (opt) {
            const item = document.createElement('div');
            item.className = 'menu-item';
            item.style.cssText = 'padding: 7px 11px; border-radius: 8px; color: var(--text-2); font-size: 12px; font-weight: 500;';
            item.textContent = opt.label;
            item.addEventListener('click', function (e) {
                e.stopPropagation();
                menu.classList.remove('open');
                opt.act();
            });
            menu.appendChild(item);
        });
        moreBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const willOpen = !menu.classList.contains('open');
            document.querySelectorAll('.action-menu.open').forEach(function (mn) { mn.classList.remove('open'); });
            if (willOpen)
                menu.classList.add('open');
        });
        moreWrap.appendChild(moreBtn);
        moreWrap.appendChild(menu);
        row.appendChild(ic);
        row.appendChild(col);
        row.appendChild(moreWrap);
        row.appendChild(addBtn);
        row.addEventListener('click', rowClick || function () { toggleContext(type, name); });
        return row;
    }
    /* 1. 项目文件（本地导入 + Work 工作区扫描，点击进 AI 阅读模式） */
    const ctxProj = getCtxProject();
    list.appendChild(sectionHead(t('ctxProjFiles'), 'proj', function () {
        document.getElementById('projFileInput').click();
    }, t('importPaper')));
    if (!ctxCollapse.proj) {
        const wsFiles = (ctxProj && ctxProj._wsScan && ctxProj._wsScan.files) || [];
        const wsDocs = wsFiles.filter(function (f) { return ['pdf', 'docx', 'md', 'html'].indexOf(f.ext) > -1; });
        const projItems = getCtxLocal()
            .map(function (f) { return { name: ctxFileName(f), meta: null, pinned: ctxFilePinned(f) }; })
            .filter(function (it) { return match(it.name); })
            .sort(pinFirst);
        const box = groupBox();
        if (!projItems.length && !wsDocs.length)
            box.appendChild(emptyNode(t('ctxProjEmpty')));
        else
            projItems.forEach(function (it) { box.appendChild(itemRow('file', it.name, it.meta, ICON_DOC, it.pinned, function () { openCtxReader('file', it.name); })); });
        wsDocs.filter(function (f) { return match(f.name) && !projItems.some(function (it) { return it.name === f.name; }); })
            .forEach(function (f) { box.appendChild(itemRow('ws', f.name, t('wsFileMeta'), ICON_DOC, false, function () { openCtxReader('ws', { path: f.path, fileName: f.name }); })); });
        list.appendChild(box);
    }
    /* Work 模式：自动扫描工作区文件（结果缓存 30s，扫描完成刷新面板） */
    if (ctxProj && ctxProj.mode === 'work' && ctxProj.folder) {
        wsScan(ctxProj).then(function (res) {
            if (res && res.fresh && getCtxProject() === ctxProj)
                renderRightPanel();
        });
    }
    /* 2. 知识库（从知识库导入的文件，点击进 AI 阅读模式） */
    list.appendChild(sectionHead(t('kbLib'), 'lib', function () {
        openKbImportModal(getCtxKb().slice(), importKbFiles);
    }, t('importFromKb')));
    if (!ctxCollapse.lib) {
        const kbItems = getCtxKb()
            .map(function (x) {
            const kb = getKb(x.kbId);
            return { name: x.fileName, meta: kb ? kb.name : '', pinned: !!x.pinned };
        })
            .filter(function (it) { return match(it.name); })
            .sort(pinFirst);
        const box = groupBox();
        if (!kbItems.length)
            box.appendChild(emptyNode(t('kbFilesEmpty')));
        else
            kbItems.forEach(function (it) { box.appendChild(itemRow('kb', it.name, it.meta, ICON_DOC, it.pinned, function () { openCtxReader('kb', it.name); })); });
        list.appendChild(box);
    }
    /* 3. 数据库 */
    list.appendChild(sectionHead(t('database'), 'dbs', function () {
        papersDbState.tab = 'database';
        papersDbState.kbView = null;
        openPapersDb();
    }, t('addDb')));
    if (!ctxCollapse.dbs) {
        const wsDataFiles = (ctxProj && ctxProj._wsScan && ctxProj._wsScan.files || []).filter(function (f) { return ['xlsx', 'xls', 'csv'].indexOf(f.ext) > -1; });
        const dbItems = getCtxDbList()
            .map(function (x) {
            const name = typeof x === 'string' ? x : x.name;
            const on = typeof x === 'object' && !!x.on;
            const pinned = typeof x === 'object' && !!x.pinned;
            return { name: name, meta: on ? t('connected') : t('notConnected'), pinned: pinned };
        })
            .filter(function (it) { return match(it.name); })
            .sort(pinFirst);
        const box = groupBox();
        if (!dbItems.length && !wsDataFiles.length)
            box.appendChild(emptyNode(t('ctxDbEmpty')));
        else
            dbItems.forEach(function (it) { box.appendChild(itemRow('db', it.name, it.meta, ICON_DB, it.pinned)); });
        wsDataFiles.filter(function (f) { return match(f.name); })
            .forEach(function (f) { box.appendChild(itemRow('ws', f.name, t('wsFileMeta'), ICON_DB, false, function () { openCtxReader('ws', { path: f.path, fileName: f.name }); })); });
        list.appendChild(box);
    }
}
/* ============ 文档阅读器（pdf.js / 多格式预览，详情页与阅读模式共用） ============ */
let readerCtx = null;
function readerSvg(paths) { return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">' + paths + '</svg>'; }
function closeReader() {
    if (!readerCtx)
        return;
    readerCtx.destroyed = true;
    if (readerCtx.observer)
        readerCtx.observer.disconnect();
    if (readerCtx.doc) {
        try {
            readerCtx.doc.destroy();
        }
        catch (e) { }
    }
    if (readerCtx.imgUrl) {
        try {
            URL.revokeObjectURL(readerCtx.imgUrl);
        }
        catch (e) { }
    }
    readerCtx = null;
}
function readerDocText(file, kind) {
    /* 取纯文本用于 AI 上下文注入 */
    return new Promise(function (resolve) {
        if (file.data == null) {
            resolve('');
            return;
        }
        if (kind === 'pdf') {
            if (typeof pdfjsLib === 'undefined') {
                resolve('');
                return;
            }
            const copy = file.data.slice(0);
            pdfjsLib.getDocument({ data: copy }).promise.then(function (doc) {
                const pages = [];
                for (let i = 1; i <= doc.numPages; i++)
                    pages.push(doc.getPage(i).then(function (p) { return p.getTextContent().then(function (tc) { return tc.items.map(function (it) { return it.str; }).join(' '); }); }));
                Promise.all(pages).then(function (arr) { resolve(arr.join('\n')); }).catch(function () { resolve(''); });
            }).catch(function () { resolve(''); });
        }
        else if (kind === 'docx' && typeof mammoth !== 'undefined') {
            mammoth.extractRawText({ arrayBuffer: file.data.slice(0) }).then(function (r) { resolve(r.value || ''); }).catch(function () { resolve(''); });
        }
        else if (kind === 'xlsx' && typeof XLSX !== 'undefined') {
            try {
                const wb = XLSX.read(file.data, { type: 'array' });
                let out = '';
                wb.SheetNames.forEach(function (sn) { out += XLSX.utils.sheet_to_csv(wb.Sheets[sn]) + '\n'; });
                resolve(out);
            }
            catch (e) {
                resolve('');
            }
        }
        else if (kind === 'html') {
            try {
                const d = new DOMParser().parseFromString(String(file.data), 'text/html');
                resolve((d.body ? d.body.textContent : String(file.data)).replace(/\s+/g, ' ').trim());
            }
            catch (e) {
                resolve('');
            }
        }
        else if (typeof file.data === 'string') {
            resolve(file.data);
        }
        else {
            resolve('');
        }
    });
}
function openReader(container, file, opts) {
    opts = opts || {};
    closeReader();
    container.innerHTML = '';
    const kind = file.kind || fileKindFromName(file.name);
    readerCtx = { file: file, kind: kind, container: container, scale: 1.2, pageIdx: 1, pageCount: 0, doc: null, annotations: {}, destroyed: false, hlMode: false, observer: null, matches: [], matchIdx: -1, imgUrl: null };
    if (file.data == null) {
        const tip = document.createElement('div');
        tip.style.cssText = 'flex: 1 1 0; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10px; color: var(--text-3); padding: 40px 30px; text-align: center;';
        tip.innerHTML = '<div style="width: 40px; height: 40px; color: var(--text-3);">' + readerSvg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>') + '</div>';
        const tp = document.createElement('div');
        tp.textContent = t('demoFileTip');
        tp.style.cssText = 'font-size: 13px; line-height: 22px; max-width: 340px;';
        tip.appendChild(tp);
        container.appendChild(tip);
        return Promise.resolve();
    }
    const root = document.createElement('div');
    root.className = 'reader-root';
    const toolbar = document.createElement('div');
    toolbar.className = 'reader-toolbar';
    const body = document.createElement('div');
    body.className = 'reader-body';
    const scroll = document.createElement('div');
    scroll.className = 'reader-scroll chat-scroll';
    const toc = document.createElement('div');
    toc.className = 'reader-toc';
    body.appendChild(scroll);
    body.appendChild(toc);
    root.appendChild(toolbar);
    root.appendChild(body);
    container.appendChild(root);
    readerCtx.root = root;
    readerCtx.scroll = scroll;
    readerCtx.toc = toc;
    /* --- 工具栏 --- */
    const isPdf = kind === 'pdf' && file.data;
    const isTextual = ['txt', 'md', 'csv', 'docx', 'xlsx'].indexOf(kind) > -1 && file.data;
    function tbtn(svg, title, fn, id) {
        const b = document.createElement('div');
        b.className = 'reader-tb-btn';
        b.title = title;
        if (id)
            b.id = id;
        b.innerHTML = readerSvg(svg);
        b.addEventListener('click', fn);
        return b;
    }
    if (isPdf || isTextual) {
        if (isPdf) {
            const prev = tbtn('<path d="m15 18-6-6 6-6"/>', t('readerPageTitle') + ' -', function () { readerGoPage(readerCtx.pageIdx - 1); });
            const next = tbtn('<path d="m9 18 6-6-6-6"/>', t('readerPageTitle') + ' +', function () { readerGoPage(readerCtx.pageIdx + 1); });
            toolbar.appendChild(prev);
            toolbar.appendChild(next);
            const pageLbl = document.createElement('div');
            pageLbl.id = 'readerPageLbl';
            pageLbl.style.cssText = 'font-size: 12px; font-weight: 600; color: var(--text-2); min-width: 74px; text-align: center; flex-shrink: 0;';
            toolbar.appendChild(pageLbl);
            const zo = tbtn('<circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/><path d="M8 11h6"/>', t('readerZoomOut'), function () { readerZoom(-0.15); });
            const zi = tbtn('<circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/><path d="M11 8v6"/><path d="M8 11h6"/>', t('readerZoomIn'), function () { readerZoom(0.15); });
            toolbar.appendChild(zo);
            toolbar.appendChild(zi);
        }
        const searchBtn = tbtn('<circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/>', t('readerSearch'), function () {
            const p = body.querySelector('.reader-search-panel');
            if (p)
                p.remove();
            else
                buildSearchPanel(body, isPdf);
        });
        toolbar.appendChild(searchBtn);
        if (isPdf) {
            const tocBtn = tbtn('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="0.5"/><circle cx="4" cy="12" r="0.5"/><circle cx="4" cy="18" r="0.5"/>', t('readerToc'), function () {
                toc.classList.toggle('open');
                if (toc.classList.contains('open') && !toc.dataset.built)
                    buildReaderToc();
            });
            toolbar.appendChild(tocBtn);
            const hlBtn = tbtn('<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4l8 8Z"/>', t('readerHighlight'), function () {
                readerCtx.hlMode = !readerCtx.hlMode;
                hlBtn.classList.toggle('active', readerCtx.hlMode);
                showToast(readerCtx.hlMode ? t('highlightHint') : t('readerHighlight'));
            }, 'readerHlBtn');
            toolbar.appendChild(hlBtn);
        }
        const fullBtn = tbtn('<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>', t('readerFull'), function () {
            if (document.fullscreenElement)
                document.exitFullscreen();
            else
                root.requestFullscreen && root.requestFullscreen();
        });
        toolbar.appendChild(fullBtn);
    }
    if (kind === 'pdf')
        return renderReaderPdf(root, file);
    return renderReaderPlain(root, file, kind);
}
function buildSearchPanel(body, isPdf) {
    const panel = document.createElement('div');
    panel.className = 'reader-search-panel';
    const input = document.createElement('input');
    input.className = 'field-input';
    input.placeholder = t('readerSearch');
    input.style.cssText = 'height: 32px; font-size: 12.5px;';
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
    const cnt = document.createElement('div');
    cnt.style.cssText = 'font-size: 11.5px; color: var(--text-3);';
    const prevM = document.createElement('div');
    prevM.className = 'reader-tb-btn';
    prevM.innerHTML = readerSvg('<path d="m18 15-6-6-6 6"/>');
    const nextM = document.createElement('div');
    nextM.className = 'reader-tb-btn';
    nextM.innerHTML = readerSvg('<path d="m6 9 6 6 6-6"/>');
    row.appendChild(cnt);
    row.appendChild(prevM);
    row.appendChild(nextM);
    panel.appendChild(input);
    panel.appendChild(row);
    body.appendChild(panel);
    setTimeout(function () { input.focus(); }, 60);
    function runSearch() {
        const q = input.value.trim();
        clearSearchHl();
        if (!q) {
            cnt.textContent = '';
            return;
        }
        readerCtx.matches = [];
        readerCtx.matchIdx = -1;
        if (readerCtx.kind === 'pdf' && isPdf) {
            readerCtx.root.querySelectorAll('.textLayer span').forEach(function (sp) {
                if (sp.textContent && sp.textContent.indexOf(q) !== -1) {
                    sp.classList.add('hl');
                    readerCtx.matches.push(sp);
                }
            });
        }
        else {
            const doc = readerCtx.root.querySelector('.reader-doc');
            if (doc) {
                const walker = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT, null);
                const nodes = [];
                while (walker.nextNode())
                    nodes.push(walker.currentNode);
                nodes.forEach(function (n) {
                    const text = n.nodeValue;
                    const lower = text.toLowerCase(), ql = q.toLowerCase();
                    let idx = lower.indexOf(ql);
                    if (idx === -1)
                        return;
                    const span = document.createElement('span');
                    span.className = 'sr-hl';
                    span.style.background = 'var(--hl-search)';
                    span.style.borderRadius = '2px';
                    try {
                        const range = document.createRange();
                        range.setStart(n, idx);
                        range.setEnd(n, idx + q.length);
                        range.surroundContents(span);
                        readerCtx.matches.push(span);
                    }
                    catch (e) { }
                });
            }
        }
        cnt.textContent = readerCtx.matches.length ? readerCtx.matches.length + ' hits' : t('readerNoResult');
        if (readerCtx.matches.length)
            jumpMatch(0);
    }
    function jumpMatch(i) {
        if (!readerCtx.matches.length)
            return;
        readerCtx.matchIdx = (i + readerCtx.matches.length) % readerCtx.matches.length;
        const el = readerCtx.matches[readerCtx.matchIdx];
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        cnt.textContent = (readerCtx.matchIdx + 1) + ' / ' + readerCtx.matches.length;
    }
    prevM.addEventListener('click', function () { jumpMatch(readerCtx.matchIdx - 1); });
    nextM.addEventListener('click', function () { jumpMatch(readerCtx.matchIdx + 1); });
    input.addEventListener('input', runSearch);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter')
        jumpMatch(readerCtx.matchIdx + 1); });
}
function clearSearchHl() {
    if (!readerCtx)
        return;
    readerCtx.root.querySelectorAll('.textLayer span.hl').forEach(function (sp) { sp.classList.remove('hl'); });
    readerCtx.root.querySelectorAll('.sr-hl').forEach(function (sp) {
        const parent = sp.parentNode;
        while (sp.firstChild)
            parent.insertBefore(sp.firstChild, sp);
        sp.remove();
        parent.normalize();
    });
}
function readerZoom(delta) {
    if (!readerCtx || readerCtx.kind !== 'pdf')
        return;
    readerCtx.scale = Math.min(2.5, Math.max(0.6, readerCtx.scale + delta));
    const pct = document.getElementById('readerScalePct');
    if (pct)
        pct.textContent = Math.round(readerCtx.scale * 100) + '%';
    renderAllPages();
}
/* Ctrl + 鼠标滚轮调整文档视图大小：PDF 走重渲染缩放，文本类用 zoom 缩放 */
function attachReaderWheelZoom(container) {
    if (!container)
        return;
    container.addEventListener('wheel', function (e) {
        if (!e.ctrlKey || !readerCtx)
            return;
        e.preventDefault();
        const now = Date.now();
        if (now - (readerCtx._lastWheelZoom || 0) < 140)
            return;
        readerCtx._lastWheelZoom = now;
        if (readerCtx.kind === 'pdf') {
            readerZoom(e.deltaY < 0 ? 0.15 : -0.15);
        }
        else {
            readerCtx.textScale = Math.min(2, Math.max(0.6, (readerCtx.textScale || 1) + (e.deltaY < 0 ? 0.1 : -0.1)));
            if (readerCtx.scroll)
                readerCtx.scroll.style.zoom = readerCtx.textScale;
        }
    }, { passive: false });
}
function readerGoPage(n) {
    if (!readerCtx || readerCtx.kind !== 'pdf')
        return;
    n = Math.min(readerCtx.pageCount, Math.max(1, n));
    const wrap = readerCtx.root.querySelector('[data-page="' + n + '"]');
    if (wrap)
        wrap.scrollIntoView({ block: 'start', behavior: 'smooth' });
}
function renderAllPages() {
    if (!readerCtx || !readerCtx.pageWraps)
        return;
    readerCtx.pageWraps.forEach(function (pw, i) {
        pw.rendered = false;
        const old = pw.querySelectorAll('canvas, .textLayer, .hl-anno');
        old.forEach(function (el) { el.remove(); });
    });
    readerCtx.renderedPages = {};
    observePages();
}
function observePages() {
    if (readerCtx.observer)
        readerCtx.observer.disconnect();
    readerCtx.observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
            if (en.isIntersecting) {
                const pageIdx = parseInt(en.target.dataset.page, 10);
                renderOnePage(pageIdx, en.target);
            }
        });
    }, { root: readerCtx.scroll, rootMargin: '400px' });
    readerCtx.pageWraps.forEach(function (pw) { readerCtx.observer.observe(pw); });
}
function renderOnePage(pageIdx, wrap) {
    if (readerCtx.destroyed || !readerCtx.doc || wrap.dataset.rendering === '1')
        return;
    wrap.dataset.rendering = '1';
    /* 防重影：页面再次进入视口重渲染前，先清掉上一轮的画布/文本层/标注层，
       否则多层叠加，选中文字时会出现错位双影 */
    wrap.querySelectorAll('canvas, .textLayer, .hl-anno').forEach(function (el) { el.remove(); });
    const page = readerCtx.pagePromises[pageIdx - 1];
    page.then(function (p) {
        if (readerCtx.destroyed)
            return;
        const viewport = p.getViewport({ scale: readerCtx.scale });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = viewport.width + 'px';
        canvas.style.height = viewport.height + 'px';
        wrap.style.width = viewport.width + 'px';
        wrap.style.height = viewport.height + 'px';
        wrap.insertBefore(canvas, wrap.firstChild);
        const annLayer = document.createElement('div');
        annLayer.style.cssText = 'position: absolute; inset: 0;';
        wrap.appendChild(annLayer);
        wrap._annLayer = annLayer;
        p.render({ canvasContext: canvas.getContext('2d'), viewport: viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null }).promise.then(function () {
            return p.getTextContent();
        }).then(function (tc) {
            if (readerCtx.destroyed)
                return;
            const tl = document.createElement('div');
            tl.className = 'textLayer';
            wrap.appendChild(tl);
            if (typeof pdfjsLib.renderTextLayer !== 'undefined') {
                pdfjsLib.renderTextLayer({ textContentSource: tc, container: tl, viewport: viewport }).promise.catch(function () { });
            }
            drawAnnotations(wrap, pageIdx);
            wrap.dataset.rendering = '0';
            wrap.dataset.rendered = '1';
        }).catch(function () { wrap.dataset.rendering = '0'; });
    }).catch(function () { wrap.dataset.rendering = '0'; });
}
function drawAnnotations(wrap, pageIdx) {
    const list = (readerCtx.annotations[pageIdx] || []);
    const layer = wrap._annLayer;
    if (!layer)
        return;
    layer.innerHTML = '';
    list.forEach(function (ann) {
        ann.rects.forEach(function (r) {
            const d = document.createElement('div');
            d.className = 'hl-anno';
            d.style.left = r.x + 'px';
            d.style.top = r.y + 'px';
            d.style.width = r.w + 'px';
            d.style.height = r.h + 'px';
            d.addEventListener('click', function (e) {
                e.stopPropagation();
                showConfirm(t('delHighlight') + '「' + (ann.text || '').slice(0, 24) + '」？', function () {
                    const arr = readerCtx.annotations[pageIdx] || [];
                    const i = arr.indexOf(ann);
                    if (i > -1)
                        arr.splice(i, 1);
                    drawAnnotations(wrap, pageIdx);
                });
            });
            layer.appendChild(d);
        });
    });
}
function renderReaderPdf(root, file) {
    if (typeof pdfjsLib === 'undefined') {
        const err = document.createElement('div');
        err.style.cssText = 'flex: 1 1 0; display: flex; justify-content: center; align-items: center; color: var(--text-3); font-size: 13px;';
        err.textContent = t('readerErr');
        root.appendChild(err);
        return Promise.resolve();
    }
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    const copy = file.data.slice(0);
    return pdfjsLib.getDocument({ data: copy }).promise.then(function (doc) {
        if (readerCtx.destroyed)
            return;
        readerCtx.doc = doc;
        readerCtx.pageCount = doc.numPages;
        readerCtx.pagePromises = [];
        for (let i = 1; i <= doc.numPages; i++)
            readerCtx.pagePromises.push(doc.getPage(i));
        const scroll = readerCtx.scroll;
        readerCtx.pageWraps = [];
        for (let i = 1; i <= doc.numPages; i++) {
            const wrap = document.createElement('div');
            wrap.className = 'reader-page-wrap';
            wrap.dataset.page = i;
            scroll.appendChild(wrap);
            readerCtx.pageWraps.push(wrap);
        }
        observePages();
        scroll.addEventListener('scroll', function () {
            if (readerCtx.destroyed)
                return;
            let cur = 1;
            readerCtx.pageWraps.forEach(function (pw) {
                if (pw.offsetTop <= scroll.scrollTop + 80)
                    cur = parseInt(pw.dataset.page, 10);
            });
            readerCtx.pageIdx = cur;
            const lbl = document.getElementById('readerPageLbl');
            if (lbl)
                lbl.textContent = t('readerPageTitle') + ' ' + cur + ' / ' + readerCtx.pageCount;
        });
        const lbl = document.getElementById('readerPageLbl');
        if (lbl)
            lbl.textContent = t('readerPageTitle') + ' 1 / ' + readerCtx.pageCount;
        /* 高亮：文本层选区 */
        scroll.addEventListener('mouseup', function (e) {
            if (!readerCtx || !readerCtx.hlMode || readerCtx.destroyed)
                return;
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed)
                return;
            const spans = [];
            for (let i = 0; i < sel.rangeCount; i++)
                spans.push(sel.range(i));
            const range = spans[0];
            let node = range.startContainer;
            while (node && (!node.classList || !node.classList.contains('textLayer')))
                node = node.parentNode;
            if (!node)
                return;
            const tl = node;
            const pageWrap = tl.closest('.reader-page-wrap');
            if (!pageWrap)
                return;
            const pageIdx = parseInt(pageWrap.dataset.page, 10);
            const wrapRect = pageWrap.getBoundingClientRect();
            const rects = [];
            const textParts = [];
            for (let i = 0; i < sel.rangeCount; i++) {
                const rr = sel.range(i).getClientRects();
                for (let j = 0; j < rr.length; j++) {
                    rects.push({ x: rr[j].left - wrapRect.left, y: rr[j].top - wrapRect.top, w: rr[j].width, h: rr[j].height });
                }
                textParts.push(sel.range(i).toString());
            }
            const text = textParts.join(' ').trim();
            if (!rects.length || !text)
                return;
            if (!readerCtx.annotations[pageIdx])
                readerCtx.annotations[pageIdx] = [];
            readerCtx.annotations[pageIdx].push({ rects: rects, text: text });
            drawAnnotations(pageWrap, pageIdx);
            sel.removeAllRanges();
        });
        buildReaderToc();
    }).catch(function () {
        const err = document.createElement('div');
        err.style.cssText = 'flex: 1 1 0; display: flex; justify-content: center; align-items: center; color: var(--text-3); font-size: 13px;';
        err.textContent = t('readerErr');
        root.appendChild(err);
    });
}
function buildReaderToc() {
    if (!readerCtx || !readerCtx.doc)
        return;
    const toc = readerCtx.toc;
    toc.innerHTML = '';
    const title = document.createElement('div');
    title.textContent = t('tocTitle');
    title.style.cssText = 'color: var(--text-1); font-size: 13px; font-weight: 700; padding: 4px 10px 8px;';
    toc.appendChild(title);
    readerCtx.doc.getOutline().then(function (outline) {
        if (readerCtx.destroyed || !toc)
            return;
        const items = [];
        const pushOutline = function (arr, depth) {
            (arr || []).forEach(function (o) {
                items.push({ title: o.title || '-', depth: depth, dest: o.dest });
                if (o.items && o.items.length && depth < 2)
                    pushOutline(o.items, depth + 1);
            });
        };
        if (outline && outline.length) {
            pushOutline(outline, 0);
            items.forEach(function (it) {
                const el = document.createElement('div');
                el.className = 'reader-toc-item';
                el.textContent = it.title;
                el.style.paddingLeft = (10 + it.depth * 14) + 'px';
                el.addEventListener('click', function () {
                    readerCtx.doc.resolveDestArray ? null : null;
                    const dest = typeof it.dest === 'string' ? readerCtx.doc.getDestination(it.dest) : it.dest;
                    Promise.resolve(dest).then(function (d) {
                        if (d && d[0]) {
                            const idx = readerCtx.doc.getPageIndex(d[0]);
                            readerGoPage(idx + 1);
                            toc.classList.remove('open');
                        }
                    });
                });
                toc.appendChild(el);
            });
        }
        if (!items.length) {
            /* fallback：从每页提取大字号行作为标题 */
            const jobs = [];
            for (let i = 1; i <= Math.min(readerCtx.pageCount, 40); i++) {
                jobs.push(readerCtx.pagePromises[i - 1].then(function (p) {
                    return p.getTextContent().then(function (tc) {
                        let best = null, bestSize = 0;
                        tc.items.forEach(function (it) {
                            const size = it.transform ? Math.abs(it.transform[4]) : 0;
                            const str = (it.str || '').trim();
                            if (str.length > 2 && str.length < 90 && size > bestSize) {
                                bestSize = size;
                                best = str;
                            }
                        });
                        return { page: i, title: best };
                    });
                }));
            }
            Promise.all(jobs).then(function (arr) {
                if (readerCtx.destroyed)
                    return;
                arr.filter(function (x) { return x.title; }).forEach(function (x) {
                    const el = document.createElement('div');
                    el.className = 'reader-toc-item';
                    el.textContent = x.title;
                    el.addEventListener('click', function () { readerGoPage(x.page); toc.classList.remove('open'); });
                    toc.appendChild(el);
                });
                if (!toc.querySelectorAll('.reader-toc-item').length) {
                    const e2 = document.createElement('div');
                    e2.textContent = t('readerNoResult');
                    e2.style.cssText = 'color: var(--text-3); font-size: 11.5px; padding: 4px 10px;';
                    toc.appendChild(e2);
                }
            });
        }
    });
}
function renderReaderPlain(root, file, kind) {
    const scroll = readerCtx.scroll;
    const doc = document.createElement('div');
    doc.className = 'reader-doc';
    scroll.appendChild(doc);
    if (kind === 'img') {
        readerCtx.imgUrl = URL.createObjectURL(new Blob([file.data]));
        const img = document.createElement('img');
        img.src = readerCtx.imgUrl;
        img.style.cssText = 'max-width: 100%; display: block; margin: 0 auto;';
        doc.appendChild(img);
        return Promise.resolve();
    }
    if (kind === 'html') {
        /* 静态预览：iframe 沙箱禁脚本，样式保留 */
        const frame = document.createElement('iframe');
        frame.sandbox = 'allow-same-origin';
        frame.style.cssText = 'width: 100%; min-height: 72vh; border: none; background: var(--paper); border-radius: 10px;';
        frame.srcdoc = String(file.data);
        doc.appendChild(frame);
        return Promise.resolve();
    }
    if (kind === 'docx') {
        if (typeof mammoth === 'undefined') {
            doc.textContent = t('readerErr');
            return Promise.resolve();
        }
        return mammoth.convertToHtml({ arrayBuffer: file.data.slice(0) }).then(function (r) {
            doc.innerHTML = r.value || '';
        }).catch(function () { doc.textContent = t('readerErr'); });
    }
    if (kind === 'xlsx') {
        if (typeof XLSX === 'undefined') {
            doc.textContent = t('readerErr');
            return Promise.resolve();
        }
        try {
            const wb = XLSX.read(file.data, { type: 'array' });
            wb.SheetNames.forEach(function (sn) {
                const h = document.createElement('h3');
                h.textContent = sn;
                doc.appendChild(h);
                const div = document.createElement('div');
                div.innerHTML = XLSX.utils.sheet_to_html(wb.Sheets[sn]);
                doc.appendChild(div);
            });
        }
        catch (e) {
            doc.textContent = t('readerErr');
        }
        return Promise.resolve();
    }
    if (kind === 'csv') {
        const rows = String(file.data).split(/\r?\n/).filter(function (r) { return r.trim(); });
        const table = document.createElement('table');
        rows.slice(0, 500).forEach(function (rowStr, ri) {
            const tr = document.createElement('tr');
            rowStr.split(',').forEach(function (cell) {
                const td = document.createElement(ri === 0 ? 'th' : 'td');
                td.textContent = cell.replace(/^"|"$/g, '');
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });
        doc.appendChild(table);
        return Promise.resolve();
    }
    /* txt / md */
    const text = String(file.data);
    if (kind === 'md') {
        const lines = text.split(/\r?\n/);
        let html = '';
        let inList = false;
        lines.forEach(function (ln) {
            const esc = ln.replace(/&/g, '&amp;').replace(/</g, '&lt;');
            const li = esc.match(/^\s*[-*]\s+(.*)$/);
            if (li) {
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                html += '<li>' + inlineMd(li[1]) + '</li>';
                return;
            }
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            const h = esc.match(/^(#{1,3})\s+(.*)$/);
            if (h) {
                html += '<h' + h[1].length + '>' + inlineMd(h[2]) + '</h' + h[1].length + '>';
                return;
            }
            if (esc.trim())
                html += '<p>' + inlineMd(esc) + '</p>';
        });
        if (inList)
            html += '</ul>';
        doc.innerHTML = html;
    }
    else {
        doc.textContent = text;
    }
    return Promise.resolve();
}
function inlineMd(s) {
    return s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/`([^`]+)`/g, '<code>$1</code>');
}
/* ============ AI 阅读模式 ============ */
let readMode = null;
function enterReadMode(source, ref) {
    if (view !== 'chat') {
        showToast(t('toastNeedProject'));
        return;
    }
    let file = null;
    let fileKind = null;
    if (source === 'kb') {
        file = getKbFile(ref.kbId, ref.fileName);
        if (!file)
            return;
        fileKind = file.kind || fileKindFromName(file.name);
        file.dbKey = 'kb:' + ref.kbId + ':' + ref.fileName;
    }
    else if (source === 'ws') {
        /* Work 工作区文件：字节经后端按路径读取，不入库 */
        file = { name: ref.fileName, kind: ref.kind || fileKindFromName(ref.fileName), data: null, _wsPath: ref.path };
        fileKind = file.kind;
    }
    else {
        file = getCtxLocal().find(function (x) { return ctxFileName(x) === ref.fileName; }) || null;
        if (!file)
            return;
        fileKind = (typeof file === 'object' && file.kind) || fileKindFromName(ref.fileName);
        if (typeof file === 'object') {
            const p = getCtxProject();
            file.dbKey = file.dbKey || ((p ? 'proj:' + p.id : 'conv:' + (activeConvId || 'x')) + ':' + ref.fileName);
        }
    }
    if (readMode)
        exitReadMode(true);
    const chatBody = document.querySelector('.chat-body');
    const pt = document.getElementById('pageTitle');
    const ctxList = document.getElementById('ctxList');
    const key = readThreadKey(source === 'ws' ? 'ws' : source, ref);
    const thread = readThreads[key] || (readThreads[key] = { msgs: [], docText: '', updatedAt: Date.now() });
    readMode = { key: key, source: source, kbId: ref.kbId || null, fileName: file.name, file: file, kind: fileKind, _orig: {} };
    /* 左栏滑出隐藏：阅读模式不给任何展开入口；内容区同步放大上浮 */
    setLeftPanelHidden(true, false);
    /* 右栏强制展开并放大到 30%：文档 70 : 消息 30 */
    rightPanel.classList.remove('collapsed');
    readMode._orig.rpWidth = rightPanel.style.width || '';
    rightPanel.style.width = '30%';
    expandRightBtn.style.display = 'none';
    /* 中间标题区 → 阅读工具条（退出键在最左、无边框） */
    if (pt) {
        pt.innerHTML = '';
        const bar = document.createElement('div');
        bar.style.cssText = 'align-self: stretch; display: flex; align-items: center; gap: 14px; width: 100%;';
        const exitBtn = document.createElement('div');
        exitBtn.className = 'icon-ghost';
        exitBtn.style.cssText = 'display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--text-2); flex-shrink: 0; padding: 4px 6px; border-radius: 8px;';
        exitBtn.innerHTML = '<div style="width: 14px; height: 14px;"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg></div>';
        const exitLbl = document.createElement('div');
        exitLbl.textContent = t('readerExit');
        exitLbl.style.cssText = 'font-size: 12.5px; font-weight: 600;';
        exitBtn.appendChild(exitLbl);
        exitBtn.addEventListener('click', function () { exitReadMode(); });
        const leftCol = document.createElement('div');
        leftCol.style.cssText = 'display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 0;';
        const docIc = document.createElement('div');
        docIc.style.cssText = 'width: 15px; height: 15px; color: var(--text-3); flex-shrink: 0;';
        docIc.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + fileIconByKind(fileKind) + '</svg>';
        const nm = document.createElement('div');
        nm.textContent = file.name;
        nm.style.cssText = 'color: var(--text-1); font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
        const badge = document.createElement('div');
        badge.textContent = t('readerPageTitle');
        badge.style.cssText = 'margin-left: 8px; padding: 2px 9px; border-radius: 999px; background: var(--accent-soft); color: var(--text-2); font-size: 10.5px; font-weight: 700; flex-shrink: 0;';
        leftCol.appendChild(docIc);
        leftCol.appendChild(nm);
        leftCol.appendChild(badge);
        bar.appendChild(exitBtn);
        bar.appendChild(leftCol);
        pt.appendChild(bar);
    }
    /* 中间栏：隐藏聊天滚动区，插入阅读器 */
    chatScroll.style.display = 'none';
    const readerView = document.createElement('div');
    readerView.id = 'readerView';
    readerView.style.cssText = 'flex: 1 1 0; min-height: 0; display: flex; flex-direction: column;';
    chatBody.insertBefore(readerView, chatScroll);
    /* 右栏：独立读聊面板（针对当前文件的独立讨论，不搬主聊天 DOM） */
    const panelHead = ctxList ? ctxList.previousElementSibling : null;
    if (ctxList)
        ctxList.style.display = 'none';
    if (panelHead)
        panelHead.style.display = 'none';
    const inputArea = document.getElementById('inputArea');
    if (inputArea)
        inputArea.style.display = 'none';
    const readChatWrap = readChatWrapBuild(thread, file);
    rightPanel.insertBefore(readChatWrap, ctxList);
    openReader(readerView, file);
    attachReaderWheelZoom(readerView);
    /* 内容区放大上浮入场（280ms ease-in-out） */
    const chatBodyEl = document.querySelector('.chat-body');
    if (chatBodyEl) {
        chatBodyEl.classList.remove('content-float-in');
        void chatBodyEl.offsetWidth;
        chatBodyEl.classList.add('content-float-in');
        setTimeout(function () { chatBodyEl.classList.remove('content-float-in'); }, 340);
    }
    /* 字节缺失时恢复（IndexedDB / 工作区后端），就绪后重渲染并抽取全文供提问 */
    ensureReadFile(file).then(function (ok) {
        if (!readMode || readMode.key !== key)
            return;
        if (ok) {
            openReader(readerView, file);
            attachReaderWheelZoom(readerView);
        }
        if (!thread.docText) {
            readerDocText(file, fileKind).then(function (text) {
                if (readMode && readMode.key === key)
                    thread.docText = (text || '').slice(0, 60000);
            });
        }
    });
}
/* ---- 阅读线程消息行（独立于主会话的轻量渲染） ---- */
function buildReadRow(m) {
    const row = document.createElement('div');
    row.className = 'msg';
    row.style.cssText = 'align-self: stretch; padding: 12px 0; display: inline-flex; align-items: flex-start; gap: 12px; width: 100%;';
    if (m.role === 'user') {
        row.style.justifyContent = 'flex-end';
        const b = document.createElement('div');
        b.style.cssText = 'max-width: min(560px, 100%); padding: 11px 14px; background: var(--surface); border: 1.5px solid var(--user-frame); border-radius: 18px 6px 18px 18px; color: var(--text-1); font-size: 13.5px; line-height: 21px; white-space: pre-wrap; word-wrap: break-word;';
        b.textContent = m.display || m.text;
        row.appendChild(b);
        return row;
    }
    row.style.justifyContent = 'flex-start';
    /* 阅读模式 AI 回复不带头像/占位图标，纯内容呈现 */
    const content = document.createElement('div');
    content.style.cssText = 'width: 100%; max-width: 640px; display: flex; flex-direction: column; gap: 10px; padding: 4px 0 0 2px; min-width: 0;';
    if (m.thinking)
        content.appendChild(buildThinkBlock(m));
    const text = document.createElement('div');
    text.className = 'ai-text';
    /* 恢复自快照的流式残行（streaming:true 但已有正文）按完成态渲染 */
    if (m.streaming && !m.text)
        text.innerHTML = '<div class="thinking-dots"><span></span><span></span><span></span><em>' + t('thinkingText') + '</em></div>';
    else if (m.text)
        renderAiText(text, m.text, true);
    text.style.cssText = 'color: var(--text-1); font-size: 13.5px; font-weight: 400; line-height: 21px; word-wrap: break-word;';
    content.appendChild(text);
    row.appendChild(content);
    return row;
}
function renderReadThread(thread, hostArg) {
    const host = hostArg || document.getElementById('readMsgScroll');
    if (!host)
        return;
    host.innerHTML = '';
    if (!thread.msgs.length) {
        const empty = document.createElement('div');
        empty.className = 'read-empty-tip';
        empty.style.cssText = 'padding: 14px 8px; color: var(--text-3); font-size: 12px; line-height: 19px;';
        empty.textContent = t('readEmptyTip');
        host.appendChild(empty);
        return;
    }
    thread.msgs.forEach(function (m) { host.appendChild(buildReadRow(m)); });
    host.scrollTop = host.scrollHeight;
}
/* 独立读聊面板：文件名 + 该文件的独立消息线程 + 独立输入框（自带发送/暂停） */
function readChatWrapBuild(thread, file) {
    const old = document.getElementById('readChatWrap');
    if (old)
        old.remove();
    const readChat = document.createElement('div');
    readChat.id = 'readChatWrap';
    readChat.style.cssText = 'flex: 1 1 0; min-height: 0; min-width: 0; align-self: stretch; display: flex; flex-direction: column;';
    const readHead = document.createElement('div');
    readHead.style.cssText = 'align-self: stretch; padding: 2px 2px 10px 2px; display: flex; align-items: center; gap: 7px; flex-shrink: 0;';
    const rIc = document.createElement('div');
    rIc.className = 'btn-primary';
    rIc.style.cssText = 'width: 24px; height: 24px; border-radius: 8px; display: flex; justify-content: center; align-items: center; flex-shrink: 0;';
    rIc.innerHTML = '<div style="width: 12px; height: 12px;"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 4.8 5 1.2-4 3.9.9 5.5-4.3-2.3-4.3 2.3.9-5.5-4-3.9z"/></svg></div>';
    const rTitle = document.createElement('div');
    rTitle.textContent = file.name;
    rTitle.style.cssText = 'color: var(--text-1); font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
    readHead.appendChild(rIc);
    readHead.appendChild(rTitle);
    readChat.appendChild(readHead);
    const readMsgScroll = document.createElement('div');
    readMsgScroll.id = 'readMsgScroll';
    readChat.appendChild(readMsgScroll);
    /* 独立输入框（Chat 式）：自适应输入 + 附件/深度思考/模型名 + 发送/暂停 */
    const box = document.createElement('div');
    box.style.cssText = 'align-self: stretch; flex-shrink: 0; margin-top: 8px; padding: 10px 12px 6px 12px; background: var(--input-bg); border: 1px solid var(--border-soft); border-radius: 16px; box-shadow: var(--card-shadow); display: flex; flex-direction: column; gap: 6px;';
    const attachChips = document.createElement('div');
    attachChips.style.cssText = 'display: none; flex-wrap: wrap; gap: 4px;';
    const ta = document.createElement('textarea');
    ta.id = 'readChatInput';
    ta.rows = 1;
    ta.placeholder = '针对本文提问……';
    ta.style.cssText = 'align-self: stretch; border: none; outline: none; background: transparent; resize: none; color: var(--text-1); font-size: 13.5px; line-height: 21px; height: 21px; max-height: 120px;';
    ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; });
    ta.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            sendReadMessage();
        }
    });
    const toolRow = document.createElement('div');
    toolRow.style.cssText = 'display: flex; align-items: center; gap: 4px;';
    const attachInput = document.createElement('input');
    attachInput.type = 'file';
    attachInput.multiple = true;
    attachInput.accept = '.pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.html,.png,.jpg,.jpeg,.webp';
    attachInput.style.display = 'none';
    attachInput.addEventListener('change', function () {
        Array.prototype.forEach.call(attachInput.files || [], function (f) {
            const kind = fileKindFromName(f.name);
            readFileData(f, kind, function (data) {
                readPendAttach.push({ name: f.name, kind: kind, data: data });
                renderReadAttachChips(attachChips);
            });
        });
        attachInput.value = '';
    });
    const attachBtn = document.createElement('div');
    attachBtn.className = 'icon-ghost';
    attachBtn.title = '补充文件';
    attachBtn.style.cssText = 'width: 26px; height: 26px; border-radius: 8px; border: 1px solid var(--border); display: flex; justify-content: center; align-items: center; color: var(--text-2); cursor: pointer; flex-shrink: 0;';
    attachBtn.innerHTML = '<div style="width: 13px; height: 13px;"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg></div>';
    /* 加号改为资源挂载菜单（上传文件 / 插件 / 技能 / MCP 连接器）；
       「上传文件」维持原行为——由菜单回调唤起同一个 attachInput。
       Work 模块未加载（纯浏览器旧产物）时退回直接唤起文件选择器。 */
    attachBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        openReadPlusMenu(attachBtn, attachInput, attachChips);
    });
    if (readThinkingOn === null)
        readThinkingOn = chatThinkingOn();
    const thinkBtn = document.createElement('div');
    thinkBtn.title = '深度思考：' + (readThinkingOn ? '开' : '关');
    thinkBtn.style.cssText = 'height: 26px; padding: 0 10px; border-radius: 8px; border: 1px solid ' + (readThinkingOn ? 'var(--link)' : 'var(--border)') + '; display: flex; align-items: center; color: ' + (readThinkingOn ? 'var(--link)' : 'var(--text-2)') + '; font-size: 12px; font-weight: 500; cursor: pointer; flex-shrink: 0;';
    thinkBtn.textContent = '深度思考';
    thinkBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        readThinkingOn = !readThinkingOn;
        thinkBtn.style.borderColor = readThinkingOn ? 'var(--link)' : 'var(--border)';
        thinkBtn.style.color = readThinkingOn ? 'var(--link)' : 'var(--text-2)';
        thinkBtn.title = '深度思考：' + (readThinkingOn ? '开' : '关');
    });
    const tSpacer = document.createElement('div');
    tSpacer.style.cssText = 'flex: 1 1 0;';
    const modelLbl = document.createElement('div');
    const _am = (getModels().find(function (m) { return m.key === activeModelKey; }) || getModels()[0] || {});
    modelLbl.textContent = _am.name || _am.modelId || '';
    modelLbl.title = '当前模型';
    modelLbl.style.cssText = 'color: var(--text-3); font-size: 11.5px; font-weight: 600; white-space: nowrap; margin-right: 4px;';
    const send = document.createElement('div');
    send.id = 'readSendBtn';
    send.className = 'btn btn-primary';
    send.title = '发送';
    send.style.cssText = 'width: 30px; height: 30px; border-radius: 10px; display: flex; justify-content: center; align-items: center; cursor: pointer; flex-shrink: 0;';
    send.innerHTML = '<div style="width: 14px; height: 14px;"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg></div>';
    send.addEventListener('click', function () {
        if (sendBusy)
            sendBusy.fn();
        else
            sendReadMessage();
    });
    toolRow.appendChild(attachBtn);
    toolRow.appendChild(thinkBtn);
    toolRow.appendChild(tSpacer);
    toolRow.appendChild(modelLbl);
    toolRow.appendChild(send);
    readAttachChipsHost = attachChips;
    box.appendChild(attachChips);
    box.appendChild(ta);
    box.appendChild(toolRow);
    box.appendChild(attachInput);
    readChat.appendChild(box);
    renderReadThread(thread, readMsgScroll);
    return readChat;
}
/* 读聊面板经「+」菜单挂载的能力（{type, name, id}）。与附件分开存放，
   附件链路 readPendAttach 完全不受影响。 */
var readPendCaps = [];
function readCapIcon(type) {
    if (type === 'skill')
        return ICON_SKILL;
    if (type === 'plugin')
        return ICON_PLUGIN;
    return ICON_MCP;
}
/* 读聊面板加号：Work 模块未加载时（纯浏览器旧产物）退回直接唤起文件选择器 */
function openReadPlusMenu(anchor, fileInput, chipsHost) {
    const w = (typeof window !== 'undefined') ? window.CS_WORK : null;
    if (!w || !w.plusMenu) {
        fileInput.click();
        return;
    }
    w.plusMenu.toggle({
        anchor: anchor,
        onUpload: function () { fileInput.click(); },
        onPick: function (type, item) {
            const i = readPendCaps.findIndex(function (c) { return c.type === type && c.id === item.id; });
            if (i > -1)
                readPendCaps.splice(i, 1);
            else
                readPendCaps.push({ type: type, name: item.name, id: item.id });
            renderReadAttachChips(chipsHost);
        },
        isPicked: function (type, item) {
            return readPendCaps.some(function (c) { return c.type === type && c.id === item.id; });
        }
    });
}
function renderReadAttachChips(host) {
    if (!host)
        return;
    host.replaceChildren();
    host.style.display = (readPendAttach.length || readPendCaps.length) ? 'flex' : 'none';
    readPendAttach.forEach(function (a, i) {
        const chip = document.createElement('div');
        chip.style.cssText = 'display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; background: var(--accent-soft); color: var(--text-2); font-size: 11px; font-weight: 600; max-width: 100%;';
        const nm = document.createElement('div');
        nm.textContent = a.name;
        nm.style.cssText = 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
        const x = document.createElement('div');
        x.textContent = '×';
        x.style.cssText = 'cursor: pointer; color: var(--text-3); padding: 0 2px;';
        x.addEventListener('click', function (e) { e.stopPropagation(); readPendAttach.splice(i, 1); renderReadAttachChips(host); });
        chip.appendChild(nm);
        chip.appendChild(x);
        host.appendChild(chip);
    });
    /* 挂载的能力：图标区分类型，样式与附件芯片同族（描边 + chip 底色） */
    readPendCaps.forEach(function (c, i) {
        const chip = document.createElement('div');
        chip.style.cssText = 'display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; background: var(--chip-bg); border: 1px solid var(--border); color: var(--text-2); font-size: 11px; font-weight: 600; max-width: 100%;';
        const ic = document.createElement('div');
        ic.style.cssText = 'width: 11px; height: 11px; flex-shrink: 0; color: var(--link);';
        ic.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + readCapIcon(c.type) + '</svg>';
        const nm = document.createElement('div');
        nm.textContent = c.name;
        nm.title = ctxPickLabel(c.type) + c.name;
        nm.style.cssText = 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
        const x = document.createElement('div');
        x.textContent = '×';
        x.style.cssText = 'cursor: pointer; color: var(--text-3); padding: 0 2px;';
        x.addEventListener('click', function (e) { e.stopPropagation(); readPendCaps.splice(i, 1); renderReadAttachChips(host); });
        chip.appendChild(ic);
        chip.appendChild(nm);
        chip.appendChild(x);
        host.appendChild(chip);
    });
}
function buildReadMessages(thread) {
    const msgs = [];
    const lang = (typeof getLang === 'function') ? getLang() : 'zh';
    msgs.push({ role: 'system', content: lang === 'en' ? 'Always respond in English regardless of the input language.' : '请始终使用中文回答，无论输入是什么语言。' });
    if (thread.docText && readMode) {
        msgs.push({ role: 'system', content: docContextSystem(readMode.fileName, thread.docText) });
    }
    thread.msgs.forEach(function (m) {
        if (m.streaming || !m.text)
            return;
        msgs.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text });
    });
    return msgs;
}
async function runReadTurn(thread, aiMsg, row) {
    const list = getModels();
    const active = list.find(function (m) { return m.key === activeModelKey; }) || list[0];
    const textEl = row.querySelector('.ai-text');
    const ctl = new AbortController();
    setSendBusy(true, function () { ctl.abort(); });
    let full = '';
    let think = '';
    let thinkDone = false;
    const thinkStart = Date.now();
    let rafPending = false;
    let thinkRaf = false;
    function requestPaint() {
        if (rafPending || !textEl)
            return;
        rafPending = true;
        requestAnimationFrame(function () {
            rafPending = false;
            if (!textEl)
                return;
            paintStreaming(textEl, full);
            window.csStickScroll(document.getElementById('readMsgScroll'));
        });
    }
    function ensureThinkBlock() {
        if (!textEl || !textEl.parentElement)
            return null;
        let tb = textEl.parentElement.querySelector(':scope > .think-block');
        if (!tb) {
            tb = buildThinkBlock({ thinking: '' });
            tb.dataset.open = '1';
            textEl.parentElement.insertBefore(tb, textEl);
        }
        return tb;
    }
    function requestThink() {
        if (thinkRaf)
            return;
        thinkRaf = true;
        requestAnimationFrame(function () {
            thinkRaf = false;
            const tb = ensureThinkBlock();
            if (!tb)
                return;
            const body = tb.querySelector('.think-body');
            if (body) {
                body.textContent = think;
                body.scrollTop = body.scrollHeight;
            }
            window.csStickScroll(document.getElementById('readMsgScroll'));
        });
    }
    function collapseThink() {
        if (thinkDone)
            return;
        thinkDone = true;
        const tb = textEl ? textEl.parentElement.querySelector(':scope > .think-block') : null;
        if (tb) {
            tb.dataset.open = '0';
            const ht = tb.querySelector('.think-head-t');
            if (ht)
                ht.textContent = t('thoughtDone') + '（' + Math.max(1, Math.round((Date.now() - thinkStart) / 1000)) + 's）';
        }
    }
    function finish(okFlag, errText) {
        if (typeof setSendBusy === 'function')
            setSendBusy(false);
        aiMsg.streaming = false;
        if (textEl)
            renderAiText(textEl, aiMsg.text, true);
        if (window.csDesktop) {
            window.csDesktop.notify(okFlag ? t('notifyDone') : t('notifyFail'), String(aiMsg.text || errText || '').slice(0, 80));
        }
    }
    try {
        const resp = await fetch(window.CS_BACKEND.base + '/api/chat', {
            method: 'POST',
            signal: ctl.signal,
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + window.CS_BACKEND.token },
            body: JSON.stringify({
                providerId: active.providerId,
                model: active.modelId,
                apiKey: active.apiKey || '',
                temperature: active.temperature || '',
                web: active.web !== false,
                thinking: readThinkingOn === true,
                messages: buildReadMessages(thread)
            })
        });
        if (!resp.ok || !resp.body)
            throw new Error('HTTP ' + resp.status);
        let failed = null;
        await consumeChatStream(resp, {
            reasoning: function (d) { think += d; aiMsg.thinking = think; requestThink(); },
            delta: function (d) { full += d; aiMsg.text = full; collapseThink(); requestPaint(); },
            meta: function (j) { aiMsg._metrics = { ttftMs: j.ttftMs, totalMs: j.totalMs, chars: j.chars }; },
            error: function (msg) { failed = msg; }
        });
        if (!full && failed)
            throw new Error(failed);
        collapseThink();
        aiMsg.text = full;
        finish(true);
    }
    catch (err) {
        if (ctl.signal.aborted) {
            aiMsg.text = (full || '') + '\r\n\r\n[已暂停]';
            finish(false);
            return;
        }
        aiMsg.text = '【' + t('notifyFail') + '】' + err.message;
        finish(false, err.message);
    }
}
async function sendReadMessage() {
    if (sendBusy || !readMode)
        return;
    const ta = document.getElementById('readChatInput');
    if (!ta)
        return;
    const text = ta.value.trim();
    const atts = readPendAttach.splice(0);
    const caps = readPendCaps.splice(0);
    if (!text && !atts.length && !caps.length)
        return;
    const thread = readThreads[readMode.key];
    if (!thread)
        return;
    ta.value = '';
    ta.style.height = '21px';
    renderReadAttachChips(readAttachChipsHost);
    /* 附件正文异步抽取，并入用户消息（气泡只显示用户输入的正文） */
    let userText = text;
    let display = text;
    if (atts.length) {
        const parts = await Promise.all(atts.map(function (a) {
            return readerDocText(a, a.kind).then(function (tx) {
                return '[附件 ' + a.name + ']\n' + String(tx || '').slice(0, 20000);
            });
        }));
        userText = (text ? text + '\n\n' : '') + parts.join('\n\n');
    }
    /* 经「+」菜单挂载的能力以声明形式前置，让本轮请求带上「可用哪些资源」；
       气泡仍只显示用户正文（display 不变） */
    if (caps.length) {
        const head = caps.map(function (c) {
            const nm = ctxPickName(c.type);
            return '[' + (nm ? nm + '：' : '') + c.name + ']';
        }).join('\n');
        userText = head + (userText ? '\n\n' + userText : '');
    }
    thread.msgs.push({ role: 'user', text: userText, display: display });
    const aiMsg = { role: 'ai', text: '', streaming: true };
    thread.msgs.push(aiMsg);
    thread.updatedAt = Date.now();
    const host = document.getElementById('readMsgScroll');
    if (!host)
        return;
    const tip = host.querySelector('.read-empty-tip');
    if (tip)
        tip.remove();
    host.appendChild(buildReadRow(thread.msgs[thread.msgs.length - 2]));
    const aiRow = buildReadRow(aiMsg);
    host.appendChild(aiRow);
    host.scrollTop = host.scrollHeight;
    runReadTurn(thread, aiMsg, aiRow);
}
function exitReadMode(silent) {
    if (!readMode)
        return;
    const origRpWidth = readMode._orig ? readMode._orig.rpWidth : null;
    readMode = null;
    /* 左栏最先滑回（动画立即开始），再做后续重渲染，避免“退出后左栏迟迟不出来” */
    setLeftPanelHidden(false, true);
    const readerView = document.getElementById('readerView');
    const readChat = document.getElementById('readChatWrap');
    const ctxList = document.getElementById('ctxList');
    const inputArea = document.getElementById('inputArea');
    if (readerView)
        readerView.remove();
    closeReader();
    if (readChat)
        readChat.remove();
    /* 主聊天区与主输入框从未被搬走，恢复显示即可（无状态残留） */
    chatScroll.style.display = '';
    if (inputArea)
        inputArea.style.display = 'flex';
    rightPanel.style.width = origRpWidth || '320px';
    if (ctxList) {
        ctxList.style.display = '';
        if (ctxList.previousElementSibling)
            ctxList.previousElementSibling.style.display = '';
    }
    if (!silent) {
        renderMessages();
        renderHeaderForConv(currentConv());
        renderRightPanel();
        /* 内容区缩放下沉归位（280ms ease-in-out，与进入动画互逆） */
        const chatBodyEl = document.querySelector('.chat-body');
        if (chatBodyEl) {
            chatBodyEl.classList.remove('content-float-back');
            void chatBodyEl.offsetWidth;
            chatBodyEl.classList.add('content-float-back');
            setTimeout(function () { chatBodyEl.classList.remove('content-float-back'); }, 340);
        }
    }
}
/* 「添加知识」弹窗（图二：标题 + 内层卡片 + 取消/添加） */
function openAddKnowledgeModal(kb) {
    const files = [];
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const box = document.createElement('div');
    box.className = 'modal';
    box.style.cssText = 'width: 520px; min-height: 0; height: auto; display: flex; flex-direction: column; padding: 0; overflow: hidden; background: var(--surface-2);';
    /* 标题行 */
    const head = document.createElement('div');
    head.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 18px 20px 14px 20px; flex-shrink: 0;';
    const ttl = document.createElement('div');
    ttl.textContent = t('addKnowledge');
    ttl.style.cssText = 'color: var(--text-1); font-size: 17px; font-weight: 700;';
    const x = document.createElement('div');
    x.className = 'icon-ghost';
    x.style.cssText = 'width: 28px; height: 28px; display: flex; justify-content: center; align-items: center; color: var(--text-2); cursor: pointer;';
    x.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px;"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>';
    head.appendChild(ttl);
    head.appendChild(x);
    box.appendChild(head);
    /* 内层白色卡片 */
    const card = document.createElement('div');
    card.style.cssText = 'margin: 0 14px; background: var(--surface); border: 1px solid var(--border-soft); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 12px;';
    const dropZone = document.createElement('div');
    dropZone.style.cssText = 'min-height: 120px; border: 1.5px dashed var(--border); border-radius: 12px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px; cursor: pointer; transition: border-color 0.18s ease;';
    dropZone.innerHTML = '<div style="width: 22px; height: 22px; color: var(--text-3);"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/></svg></div>';
    const dropText = document.createElement('div');
    dropText.textContent = t('dropHint');
    dropText.style.cssText = 'color: var(--text-3); font-size: 12px; text-align: center; padding: 0 24px; line-height: 19px;';
    dropZone.appendChild(dropText);
    card.appendChild(dropZone);
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.webp';
    input.style.display = 'none';
    card.appendChild(input);
    const list = document.createElement('div');
    list.style.cssText = 'display: none; flex-direction: column; gap: 6px; max-height: 200px; overflow-y: auto;';
    card.appendChild(list);
    box.appendChild(card);
    /* 底部按钮 */
    const foot = document.createElement('div');
    foot.style.cssText = 'display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px 18px 20px; flex-shrink: 0;';
    const cancelBtn = document.createElement('div');
    cancelBtn.className = 'btn';
    cancelBtn.textContent = t('cancel');
    cancelBtn.style.cssText = 'padding: 9px 20px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); color: var(--text-2); font-size: 12.5px; font-weight: 600; cursor: pointer;';
    const okBtn = document.createElement('div');
    okBtn.className = 'btn btn-primary';
    okBtn.textContent = t('added');
    okBtn.style.cssText = 'padding: 9px 22px; border-radius: 999px; font-size: 12.5px; font-weight: 600; cursor: pointer;';
    foot.appendChild(cancelBtn);
    foot.appendChild(okBtn);
    box.appendChild(foot);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    overlay.classList.add('show');
    requestAnimationFrame(function () { overlay.classList.add('visible'); });
    function closeIt() {
        overlay.classList.remove('visible');
        setTimeout(function () { overlay.remove(); }, 200);
    }
    x.addEventListener('click', closeIt);
    cancelBtn.addEventListener('click', closeIt);
    overlay.addEventListener('click', function (e) { if (e.target === overlay)
        closeIt(); });
    function addFiles(fl) {
        Array.prototype.forEach.call(fl || [], function (f) {
            if (!files.some(function (x) { return x.name === f.name; }))
                files.push(f);
        });
        renderList();
    }
    function renderList() {
        list.innerHTML = '';
        list.style.display = files.length ? 'flex' : 'none';
        files.forEach(function (f, i) {
            const row = document.createElement('div');
            row.style.cssText = 'padding: 8px 11px; background: var(--surface-2); border: 1px solid var(--border-soft); border-radius: 10px; display: flex; align-items: center; gap: 9px;';
            const ic = document.createElement('div');
            ic.style.cssText = 'width: 14px; height: 14px; flex-shrink: 0; color: var(--text-3);';
            ic.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + fileIconByKind(fileKindFromName(f.name)) + '</svg>';
            const nm = document.createElement('div');
            nm.textContent = f.name;
            nm.style.cssText = 'flex: 1 1 0; min-width: 0; font-size: 12.5px; font-weight: 500; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
            const sz = document.createElement('div');
            sz.textContent = fmtSize(f.size);
            sz.style.cssText = 'font-size: 11px; color: var(--text-3); flex-shrink: 0;';
            const cx = document.createElement('div');
            cx.textContent = '×';
            cx.style.cssText = 'color: var(--text-3); cursor: pointer; font-size: 15px; line-height: 1; flex-shrink: 0;';
            cx.addEventListener('click', function () { files.splice(i, 1); renderList(); });
            row.appendChild(ic);
            row.appendChild(nm);
            row.appendChild(sz);
            row.appendChild(cx);
            list.appendChild(row);
        });
    }
    dropZone.addEventListener('click', function () { input.click(); });
    dropZone.addEventListener('mouseover', function () { dropZone.style.borderColor = 'var(--focus-border)'; });
    dropZone.addEventListener('mouseout', function () { dropZone.style.borderColor = 'var(--border)'; });
    input.addEventListener('change', function () { addFiles(input.files); input.value = ''; });
    dropZone.addEventListener('dragover', function (e) { e.preventDefault(); dropZone.style.borderColor = 'var(--focus-border)'; });
    dropZone.addEventListener('dragleave', function () { dropZone.style.borderColor = 'var(--border)'; });
    dropZone.addEventListener('drop', function (e) {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border)';
        addFiles(e.dataTransfer.files);
    });
    okBtn.addEventListener('click', function () {
        if (!files.length) {
            input.click();
            return;
        }
        closeIt();
        addFilesToKb(kb.id, files);
        showToast(t('addKnowledge'));
    });
}
/* 「从知识库导入」弹窗：层级化选择（先文件夹后文件，Ctrl/Shift/拖拽多选） */
function openKbImportModal(initial, onConfirm) {
    const picked = (initial || []).map(function (x) { return { kbId: x.kbId, fileName: x.fileName }; });
    let activeKbId = null;
    let lastClickIdx = -1;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const box = document.createElement('div');
    box.className = 'modal';
    box.style.cssText = 'width: 680px; min-height: 0; height: 600px; display: flex; flex-direction: column; overflow: hidden; padding: 20px;';
    const head = document.createElement('div');
    head.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-shrink: 0;';
    const ttl = document.createElement('div');
    ttl.textContent = t('pickKbFile');
    ttl.style.cssText = 'color: var(--text-1); font-size: 16px; font-weight: 700;';
    const x = document.createElement('div');
    x.className = 'icon-ghost';
    x.style.cssText = 'width: 28px; height: 28px; display: flex; justify-content: center; align-items: center; color: var(--text-3); cursor: pointer;';
    x.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>';
    head.appendChild(ttl);
    head.appendChild(x);
    box.appendChild(head);
    const bodyRow = document.createElement('div');
    bodyRow.style.cssText = 'flex: 1 1 0; min-height: 0; display: flex; gap: 12px;';
    box.appendChild(bodyRow);
    /* 左栏：文件夹（必须先选） */
    const folderCol = document.createElement('div');
    folderCol.style.cssText = 'width: 186px; flex-shrink: 0; display: flex; flex-direction: column; gap: 8px; min-height: 0;';
    const folderLbl = document.createElement('div');
    folderLbl.textContent = t('pickFolder');
    folderLbl.style.cssText = 'color: var(--text-2); font-size: 12px; font-weight: 600;';
    folderCol.appendChild(folderLbl);
    const folderList = document.createElement('div');
    folderList.style.cssText = 'flex: 1 1 0; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;';
    folderCol.appendChild(folderList);
    bodyRow.appendChild(folderCol);
    /* 右栏：文件区（激活前禁用） */
    const fileCol = document.createElement('div');
    fileCol.style.cssText = 'flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 8px; min-height: 0;';
    bodyRow.appendChild(fileCol);
    const pickedBar = document.createElement('div');
    pickedBar.style.cssText = 'flex-shrink: 0; border: 1px solid var(--border); border-radius: 12px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; background: var(--surface-2);';
    const pickedTop = document.createElement('div');
    pickedTop.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
    const pickedCnt = document.createElement('div');
    pickedCnt.style.cssText = 'font-size: 12px; font-weight: 600; color: var(--text-1);';
    const clearBtn = document.createElement('div');
    clearBtn.textContent = t('clearAll');
    clearBtn.style.cssText = 'font-size: 11.5px; color: var(--text-3); cursor: pointer;';
    clearBtn.addEventListener('click', function () { picked.length = 0; syncAll(); });
    pickedTop.appendChild(pickedCnt);
    pickedTop.appendChild(clearBtn);
    const pickedChips = document.createElement('div');
    pickedChips.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px; max-height: 58px; overflow-y: auto;';
    pickedBar.appendChild(pickedTop);
    pickedBar.appendChild(pickedChips);
    fileCol.appendChild(pickedBar);
    const fileSearch = document.createElement('input');
    fileSearch.className = 'field-input';
    fileSearch.placeholder = t('searchKnowledge');
    fileSearch.style.cssText = 'height: 34px; font-size: 12.5px; flex-shrink: 0;';
    fileCol.appendChild(fileSearch);
    const dragHint = document.createElement('div');
    dragHint.textContent = t('dragSelectHint');
    dragHint.style.cssText = 'font-size: 10.5px; color: var(--text-3); flex-shrink: 0;';
    fileCol.appendChild(dragHint);
    const fileListWrap = document.createElement('div');
    fileListWrap.style.cssText = 'flex: 1 1 0; min-height: 0; position: relative;';
    fileCol.appendChild(fileListWrap);
    const fileList = document.createElement('div');
    fileList.style.cssText = 'position: absolute; inset: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding: 2px;';
    fileListWrap.appendChild(fileList);
    const lockMask = document.createElement('div');
    lockMask.style.cssText = 'position: absolute; inset: 0; z-index: 5; background: var(--surface-2); display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10px; color: var(--text-3); font-size: 12.5px; text-align: center; padding: 0 24px;';
    lockMask.innerHTML = '<div style="width: 26px; height: 26px; color: var(--text-3);"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-8.6a1 1 0 0 1-.8-.4L8.8 3.9A1 1 0 0 0 8 3.5H4a1 1 0 0 0-1 1V19a1 1 0 0 0 1 1z"/></svg></div>';
    const lockText = document.createElement('div');
    lockText.textContent = t('pickFolderFirst');
    lockMask.appendChild(lockText);
    fileListWrap.appendChild(lockMask);
    const rubber = document.createElement('div');
    rubber.style.cssText = 'position: absolute; z-index: 6; border: 1px solid var(--accent-text); background: var(--accent-wash); display: none; pointer-events: none;';
    fileListWrap.appendChild(rubber);
    const foot = document.createElement('div');
    foot.style.cssText = 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; flex-shrink: 0;';
    const cancelBtn = document.createElement('div');
    cancelBtn.className = 'btn';
    cancelBtn.textContent = t('cancel');
    cancelBtn.style.cssText = 'padding: 8px 16px; border-radius: 999px; background: var(--accent-soft); color: var(--text-2); font-size: 12.5px; font-weight: 600; cursor: pointer;';
    const okBtn = document.createElement('div');
    okBtn.className = 'btn btn-primary';
    okBtn.textContent = t('importFromKb');
    okBtn.style.cssText = 'padding: 8px 18px; border-radius: 999px; font-size: 12.5px; font-weight: 600; cursor: pointer;';
    foot.appendChild(cancelBtn);
    foot.appendChild(okBtn);
    box.appendChild(foot);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    overlay.classList.add('show');
    requestAnimationFrame(function () { overlay.classList.add('visible'); });
    function closeIt() {
        overlay.classList.remove('visible');
        setTimeout(function () { overlay.remove(); }, 200);
    }
    x.addEventListener('click', closeIt);
    cancelBtn.addEventListener('click', closeIt);
    overlay.addEventListener('click', function (e) { if (e.target === overlay)
        closeIt(); });
    function keyOf(kbId, fn) { return kbId + '::' + fn; }
    function indexOfPicked(kbId, fn) {
        for (let i = 0; i < picked.length; i++) {
            if (picked[i].kbId === kbId && picked[i].fileName === fn)
                return i;
        }
        return -1;
    }
    function syncAll() {
        renderFolders();
        renderFiles();
        renderPicked();
    }
    function renderPicked() {
        pickedCnt.textContent = t('kbFilesChosen')(picked.length);
        pickedChips.innerHTML = '';
        picked.forEach(function (p, i) {
            const kb = getKb(p.kbId);
            const chip = document.createElement('div');
            chip.style.cssText = 'padding: 3px 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-1);';
            const nm = document.createElement('div');
            nm.textContent = (kb ? kb.name + ' / ' : '') + p.fileName;
            nm.style.cssText = 'max-width: 190px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
            const cx = document.createElement('div');
            cx.textContent = '×';
            cx.style.cssText = 'color: var(--text-3); cursor: pointer; font-size: 13px; line-height: 1;';
            cx.addEventListener('click', function () { picked.splice(i, 1); syncAll(); });
            chip.appendChild(nm);
            chip.appendChild(cx);
            pickedChips.appendChild(chip);
        });
        pickedBar.style.display = picked.length || activeKbId ? 'flex' : 'none';
    }
    function renderFolders() {
        folderList.innerHTML = '';
        if (!papersDbState.kbs.length) {
            const e = document.createElement('div');
            e.textContent = t('kbEmpty');
            e.style.cssText = 'color: var(--text-3); font-size: 11.5px; padding: 4px;';
            folderList.appendChild(e);
            return;
        }
        papersDbState.kbs.forEach(function (kb) {
            const active = activeKbId === kb.id;
            const row = document.createElement('div');
            row.style.cssText = 'padding: 9px 11px; border-radius: 10px; display: flex; align-items: center; gap: 8px; cursor: pointer; background: ' + (active ? 'var(--conv-active-bg)' : 'transparent') + ';';
            row.innerHTML = '<div style="width: 14px; height: 14px; flex-shrink: 0; color: var(--text-3);"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-8.6a1 1 0 0 1-.8-.4L8.8 3.9A1 1 0 0 0 8 3.5H4a1 1 0 0 0-1 1V19a1 1 0 0 0 1 1z"/></svg></div>';
            const nm = document.createElement('div');
            nm.textContent = kb.name;
            nm.style.cssText = 'flex: 1 1 0; min-width: 0; font-size: 12.5px; font-weight: 500; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
            const cnt = document.createElement('div');
            cnt.textContent = kb.files.length;
            cnt.style.cssText = 'font-size: 10.5px; color: var(--text-3); flex-shrink: 0;';
            row.appendChild(nm);
            row.appendChild(cnt);
            row.addEventListener('click', function () {
                activeKbId = kb.id;
                lastClickIdx = -1;
                fileSearch.value = '';
                lockMask.style.display = 'none';
                renderFolders();
                renderFiles();
            });
            folderList.appendChild(row);
        });
    }
    function renderFiles() {
        fileList.innerHTML = '';
        const kb = activeKbId ? getKb(activeKbId) : null;
        if (!kb)
            return;
        const q = (fileSearch.value || '').trim().toLowerCase();
        const items = kb.files.filter(function (f) { return !q || f.name.toLowerCase().indexOf(q) !== -1; });
        if (!items.length) {
            const e = document.createElement('div');
            e.textContent = t('readerNoResult');
            e.style.cssText = 'color: var(--text-3); font-size: 11.5px; padding: 4px;';
            fileList.appendChild(e);
            return;
        }
        items.forEach(function (f, idx) {
            const sel = indexOfPicked(kb.id, f.name) > -1;
            const row = document.createElement('div');
            row.dataset.idx = idx;
            row.style.cssText = 'padding: 8px 10px; border-radius: 9px; display: flex; align-items: center; gap: 9px; cursor: pointer;' + (sel ? ' background: var(--accent-soft); border: 1px solid var(--accent-text);' : ' border: 1px solid transparent;');
            const ic = document.createElement('div');
            ic.style.cssText = 'width: 14px; height: 14px; flex-shrink: 0; color: ' + (sel ? 'var(--accent-text)' : 'var(--text-3)') + ';';
            ic.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + fileIconByKind(f.kind || fileKindFromName(f.name)) + '</svg>';
            const nm = document.createElement('div');
            nm.textContent = f.name;
            nm.style.cssText = 'flex: 1 1 0; min-width: 0; font-size: 12.5px; font-weight: 500; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
            const ck = document.createElement('div');
            ck.style.cssText = 'width: 15px; height: 15px; flex-shrink: 0; border-radius: 5px; border: 1px solid ' + (sel ? 'var(--accent-text)' : 'var(--border)') + '; background: ' + (sel ? 'var(--accent-text)' : 'transparent') + '; color: #fff; display: flex; justify-content: center; align-items: center;';
            ck.innerHTML = sel ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width: 9px; height: 9px;"><path d="M20 6L9 17l-5-5"/></svg>' : '';
            row.appendChild(ic);
            row.appendChild(nm);
            row.appendChild(ck);
            row.addEventListener('click', function (e) {
                if (e.ctrlKey || e.metaKey) {
                    const i = indexOfPicked(kb.id, f.name);
                    if (i > -1)
                        picked.splice(i, 1);
                    else
                        picked.push({ kbId: kb.id, fileName: f.name });
                    lastClickIdx = idx;
                }
                else if (e.shiftKey && lastClickIdx > -1) {
                    const lo = Math.min(lastClickIdx, idx);
                    const hi = Math.max(lastClickIdx, idx);
                    for (let j = lo; j <= hi; j++) {
                        const f2 = items[j];
                        if (f2 && indexOfPicked(kb.id, f2.name) === -1)
                            picked.push({ kbId: kb.id, fileName: f2.name });
                    }
                }
                else {
                    const i = indexOfPicked(kb.id, f.name);
                    if (i > -1)
                        picked.splice(i, 1);
                    else
                        picked.push({ kbId: kb.id, fileName: f.name });
                    lastClickIdx = idx;
                }
                syncAll();
            });
            fileList.appendChild(row);
        });
    }
    /* 拖拽框选 */
    let dragStart = null;
    let suppressClick = false;
    fileList.addEventListener('click', function (e) {
        if (suppressClick) {
            e.stopPropagation();
            e.preventDefault();
            suppressClick = false;
        }
    }, true);
    fileList.addEventListener('mousedown', function (e) {
        if (e.button !== 0)
            return;
        const rect = fileListWrap.getBoundingClientRect();
        dragStart = { x: e.clientX - rect.left + fileListWrap.scrollLeft, y: e.clientY - rect.top + fileListWrap.scrollTop, sx: e.clientX, sy: e.clientY, moved: false, additive: e.ctrlKey || e.metaKey || e.shiftKey };
        function onMove(ev) {
            if (!dragStart)
                return;
            const dx = Math.abs(ev.clientX - dragStart.sx), dy = Math.abs(ev.clientY - dragStart.sy);
            if (!dragStart.moved && dx < 4 && dy < 4)
                return;
            dragStart.moved = true;
            ev.preventDefault();
            const rect2 = fileListWrap.getBoundingClientRect();
            const cx = ev.clientX - rect2.left + fileListWrap.scrollLeft;
            const cy = ev.clientY - rect2.top + fileListWrap.scrollTop;
            const l = Math.min(dragStart.x, cx), t = Math.min(dragStart.y, cy);
            const w = Math.abs(cx - dragStart.x), h = Math.abs(cy - dragStart.y);
            rubber.style.display = 'block';
            rubber.style.left = l + 'px';
            rubber.style.top = t + 'px';
            rubber.style.width = w + 'px';
            rubber.style.height = h + 'px';
        }
        function onUp(ev) {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            rubber.style.display = 'none';
            if (!dragStart)
                return;
            if (dragStart.moved) {
                suppressClick = true;
                const selRect = rubber.getBoundingClientRect();
                const kb = activeKbId ? getKb(activeKbId) : null;
                if (kb) {
                    if (!dragStart.additive) {
                        /* 非加选：先清除该文件夹内的选中 */
                        for (let i = picked.length - 1; i >= 0; i--) {
                            if (picked[i].kbId === kb.id)
                                picked.splice(i, 1);
                        }
                    }
                    fileList.querySelectorAll('[data-idx]').forEach(function (rowEl) {
                        const r = rowEl.getBoundingClientRect();
                        const hit = !(r.right < selRect.left || r.left > selRect.right || r.bottom < selRect.top || r.top > selRect.bottom);
                        if (hit) {
                            const f = kb.files[parseInt(rowEl.dataset.idx, 10)];
                            if (f && indexOfPicked(kb.id, f.name) === -1)
                                picked.push({ kbId: kb.id, fileName: f.name });
                        }
                    });
                }
                syncAll();
            }
            dragStart = null;
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
    fileSearch.addEventListener('input', renderFiles);
    renderFolders();
    renderFiles();
    renderPicked();
    okBtn.addEventListener('click', function () {
        closeIt();
        onConfirm(picked.slice());
    });
}
/* ============ 附件 ============ */
const paperInput = document.getElementById('paperInput');
/* 加号改为资源挂载菜单（上传文件 / 插件 / 技能 / MCP 连接器）。
   「上传文件」维持原行为——由菜单回调唤起同一个 paperInput，上行链路不变；
   Work 模块未加载时（纯浏览器直开旧产物）退回直接唤起文件选择器。 */
const mainAttachBtn = document.getElementById('attachBtn');
mainAttachBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    const w = (typeof window !== 'undefined') ? window.CS_WORK : null;
    if (!w || !w.plusMenu) {
        paperInput.click();
        return;
    }
    w.plusMenu.toggle({
        anchor: mainAttachBtn,
        onUpload: function () { paperInput.click(); },
        onPick: function (type, item) { toggleContext(type, item.name, item.id); },
        isPicked: function (type, item) {
            return contextPicks.some(function (c) {
                return c.type === type && ((c.ref === undefined || c.ref === null) ? c.name : c.ref) === item.id;
            });
        }
    });
});
document.getElementById('workspaceBtn').addEventListener('click', pickWorkspace);
paperInput.addEventListener('change', function () {
    Array.prototype.forEach.call(paperInput.files || [], function (f) {
        contextPicks.push({ type: 'file', name: f.name, size: f.size, kind: fileKindFromName(f.name) });
    });
    paperInput.value = '';
    renderCtxChips();
    renderRightPanel();
});
const micBtn = document.getElementById('micBtn');
micBtn.addEventListener('click', function () {
    const recording = micBtn.classList.toggle('recording');
    chatInput.placeholder = recording ? t('listening') : t('askPlaceholder');
});
/* ============ 右侧栏导入 ============ */
const projFileInput = document.getElementById('projFileInput');
projFileInput.addEventListener('change', function () {
    const p = getCtxProject();
    const c = currentConv();
    const target = p ? (p.files = p.files || []) : (c ? (c.localFiles = c.localFiles || []) : null);
    if (!target) {
        projFileInput.value = '';
        return;
    }
    const scope = p ? 'proj:' + p.id : 'conv:' + (c ? c.id : 'x');
    Array.prototype.forEach.call(projFileInput.files || [], function (f) {
        const kind = fileKindFromName(f.name);
        const existing = target.find(function (x) { return ctxFileName(x) === f.name; });
        readFileData(f, kind, function (data) {
            let entry;
            /* 同名文件重新导入 = 覆盖刷新：data 被快照剥离后靠重新导入恢复 */
            if (existing && typeof existing === 'object') {
                existing.kind = kind;
                existing.data = data;
                existing.dbKey = scope + ':' + f.name;
                existing.updatedAt = Date.now();
                entry = existing;
            }
            else {
                entry = { name: f.name, kind: kind, data: data, dbKey: scope + ':' + f.name, updatedAt: Date.now() };
                target.push(entry);
            }
            idbPut(entry.dbKey, data);
            renderRightPanel();
        });
    });
    projFileInput.value = '';
});
/* ============ 上下文芯片删除 / 右栏折叠 ============ */
document.querySelectorAll('.chip-x').forEach(function (x) {
    x.addEventListener('click', function (e) {
        e.stopPropagation();
        x.closest('.chip').style.display = 'none';
    });
});
const rightPanel = document.getElementById('rightPanel');
const expandRightBtn = document.getElementById('expandRightBtn');
document.getElementById('collapseRightBtn').addEventListener('click', function () {
    rightPanel.classList.add('collapsed');
    expandRightBtn.style.display = 'flex';
});
expandRightBtn.addEventListener('click', function () {
    rightPanel.classList.remove('collapsed');
    expandRightBtn.style.display = 'none';
});
/* ============ 删除确认弹窗 ============ */
const confirmModal = document.getElementById('confirmModal');
const confirmText = document.getElementById('confirmText');
let confirmCb = null;
function showConfirm(text, cb) {
    confirmText.textContent = text;
    confirmCb = cb;
    confirmModal.classList.add('show');
    requestAnimationFrame(function () { confirmModal.classList.add('visible'); });
}
function closeConfirm() {
    confirmModal.classList.remove('visible');
    setTimeout(function () { confirmModal.classList.remove('show'); }, 200);
}
document.getElementById('confirmCancel').addEventListener('click', closeConfirm);
document.getElementById('confirmOk').addEventListener('click', function () {
    closeConfirm();
    if (confirmCb) {
        const cb = confirmCb;
        confirmCb = null;
        cb();
    }
});
confirmModal.addEventListener('click', function (e) { if (e.target === confirmModal)
    closeConfirm(); });
/* ============ 搜索 ============ */
const searchBox = document.getElementById('searchBox');
const searchInput = document.getElementById('searchInput');
document.getElementById('searchToggle').addEventListener('click', function (e) {
    e.stopPropagation();
    const willShow = searchBox.style.display === 'none';
    searchBox.style.display = willShow ? 'block' : 'none';
    if (willShow)
        searchInput.focus();
    else {
        searchQuery = '';
        searchInput.value = '';
        renderProjects();
        renderConversations();
    }
});
searchInput.addEventListener('click', function (e) { e.stopPropagation(); });
searchInput.addEventListener('input', function () {
    searchQuery = searchInput.value.trim();
    renderProjects();
    renderConversations();
});
/* ============ 头像上传 ============ */
const avatarBtn = document.getElementById('avatarBtn');
const avatarInput = document.getElementById('avatarInput');
const sideAvatar = document.getElementById('sideAvatar');
avatarBtn.addEventListener('click', function () { avatarInput.click(); });
avatarInput.addEventListener('change', function () {
    const file = avatarInput.files && avatarInput.files[0];
    if (!file)
        return;
    const reader = new FileReader();
    reader.onload = function () {
        sideAvatar.src = reader.result;
        const pimg = document.getElementById('settingsAvatarImg');
        if (pimg)
            pimg.src = reader.result;
        const pprev = document.getElementById('profileAvatarPreview');
        if (pprev)
            pprev.src = reader.result;
        _avatarBlobUrl = null;
        try {
            localStorage.setItem('cs-avatar', reader.result);
        }
        catch (err) { /* 忽略超大图片 */ }
    };
    reader.readAsDataURL(file);
    avatarInput.value = '';
});
const savedAvatar = localStorage.getItem('cs-avatar');
if (savedAvatar)
    sideAvatar.src = savedAvatar;
/* ============ 名称修改（确认制） ============ */
const userName = document.getElementById('userName');
const nameEdit = document.getElementById('nameEdit');
const nameInput = document.getElementById('nameInput');
userName.textContent = localStorage.getItem('cs-name') || 'Dr. Sarah Jenkins';
function openNameEdit() {
    nameInput.value = userName.textContent;
    userName.style.display = 'none';
    document.getElementById('userEmail').style.display = 'none';
    nameEdit.style.display = 'inline-flex';
    nameInput.focus();
    nameInput.select();
}
function closeNameEdit() {
    nameEdit.style.display = 'none';
    userName.style.display = '';
    document.getElementById('userEmail').style.display = '';
}
userName.addEventListener('click', openNameEdit);
document.getElementById('nameSave').addEventListener('click', function () {
    const val = nameInput.value.trim();
    if (!val) {
        nameInput.focus();
        return;
    }
    localStorage.setItem('cs-name', val);
    userName.textContent = val;
    closeNameEdit();
});
document.getElementById('nameCancel').addEventListener('click', closeNameEdit);
nameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter')
        document.getElementById('nameSave').click();
    if (e.key === 'Escape')
        closeNameEdit();
});
/* ============ 设置页 · 个人资料（2026-09-16 按设计图重构 + 编辑弹窗） ============
   布局：头像 + 名称/套餐徽章 + 签名 + 操作按钮（编辑/分享/成就墙）；使用统计（本地
   真实数据）；账户与订阅（当前计划 / 退出登录）。编辑经模态窗改头像/名称/签名/邮箱/
   账号 ID；与侧栏用户卡共用 cs-name / cs-email / cs-avatar，另存 cs-signature / cs-uid。 */
const PROFILE_DEFAULT_NAME = 'Dr. Sarah Jenkins';
const PROFILE_DEFAULT_EMAIL = 's.jenkins@minduni.edu';
const PROFILE_DEFAULT_SIGNATURE = '让科研从重复劳动中解放，把精力还给思考';
/* 与 #sideAvatar 的 HTML 默认 src 保持一致（退出登录时还原） */
const PROFILE_DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/women/44.jpg';
function profileGet(key, fallback) {
    try {
        const v = localStorage.getItem(key);
        return (v == null || v === '') ? fallback : v;
    }
    catch (e) {
        return fallback;
    }
}
function profileSet(key, val) {
    try {
        if (val == null || val === '')
            localStorage.removeItem(key);
        else
            localStorage.setItem(key, val);
    }
    catch (e) { /* 忽略 */ }
}
function profileUid() {
    let id = profileGet('cs-uid', '');
    if (!id) {
        id = 'mt-' + Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
        profileSet('cs-uid', id);
    }
    return id;
}
const userEmailEl = document.getElementById('userEmail');
const settingsAvatarImg = document.getElementById('settingsAvatarImg');
function renderProfilePanel() {
    const name = profileGet('cs-name', PROFILE_DEFAULT_NAME);
    const email = profileGet('cs-email', PROFILE_DEFAULT_EMAIL);
    const pName = document.getElementById('profileName');
    const pSig = document.getElementById('profileSignature');
    const pMeta = document.getElementById('profileMetaId');
    if (pName)
        pName.textContent = name;
    if (pSig)
        pSig.textContent = profileGet('cs-signature', PROFILE_DEFAULT_SIGNATURE);
    if (pMeta)
        pMeta.textContent = tn('profileUidLabel', '账号 ID') + ' · ' + profileUid() + ' · ' + email;
    if (settingsAvatarImg)
        settingsAvatarImg.src = sideAvatar.src;
    const setStat = function (id, n) { const el = document.getElementById(id); if (el)
        el.textContent = String(n); };
    setStat('statConvs', (typeof conversations !== 'undefined' && conversations.length) || 0);
    setStat('statProjects', (typeof projects !== 'undefined' && projects.length) || 0);
    const kbs = (typeof papersDbState !== 'undefined' && papersDbState && papersDbState.kbs) || [];
    setStat('statKbs', kbs.length);
    let msgs = 0;
    if (typeof conversations !== 'undefined')
        conversations.forEach(function (c) { msgs += (c.messages || []).length; });
    setStat('statMsgs', msgs);
}
/* 编辑资料模态窗（与会话/模型编辑弹窗同构：overlay + modal） */
function openProfileEditModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const box = document.createElement('div');
    box.className = 'modal';
    box.style.cssText = 'width: 460px; min-height: 0;';
    const title = document.createElement('div');
    title.style.cssText = 'color: var(--text-1); font-size: 16px; font-weight: 700; margin-bottom: 14px;';
    title.textContent = tn('profileEditTitle', '编辑资料');
    box.appendChild(title);
    const avatarRow = document.createElement('div');
    avatarRow.style.cssText = 'display: flex; justify-content: flex-start; align-items: center; gap: 12px; margin-bottom: 14px;';
    const pv = document.createElement('img');
    pv.id = 'profileAvatarPreview';
    pv.style.cssText = 'width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border); background: var(--accent-soft);';
    pv.src = sideAvatar.src;
    const avBtn = document.createElement('div');
    avBtn.className = 'btn';
    avBtn.style.cssText = 'padding: 7px 16px; border-radius: 999px; background: var(--accent-soft); color: var(--text-2); font-size: 12.5px; font-weight: 600; cursor: pointer;';
    avBtn.textContent = tn('settingsAvatarBtn', '更换头像');
    avBtn.addEventListener('click', function () { avatarInput.click(); });
    avatarRow.appendChild(pv);
    avatarRow.appendChild(avBtn);
    box.appendChild(avatarRow);
    function field(labelText, value, ph) {
        const w = document.createElement('div');
        w.style.cssText = 'display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px;';
        const l = document.createElement('div');
        l.style.cssText = 'color: var(--text-2); font-size: 11.5px; font-weight: 600;';
        l.textContent = labelText;
        w.appendChild(l);
        const i2 = document.createElement('input');
        i2.className = 'field-input';
        i2.value = value == null ? '' : value;
        i2.placeholder = ph || '';
        w.appendChild(i2);
        return { wrap: w, input: i2 };
    }
    const fName = field(tn('profileNameLabel', '名称'), profileGet('cs-name', PROFILE_DEFAULT_NAME), '');
    const fSig = field(tn('profileSignatureLabel', '签名'), profileGet('cs-signature', PROFILE_DEFAULT_SIGNATURE), tn('profileSignaturePh', ''));
    const fMail = field(tn('settingsEmail', '邮箱'), profileGet('cs-email', PROFILE_DEFAULT_EMAIL), 'name@example.com');
    const fUid = field(tn('profileUidLabel', '账号 ID'), profileUid(), 'mt-xxxxxx');
    fUid.input.style.fontFamily = 'var(--mono)';
    [fName, fSig, fMail, fUid].forEach(function (f) { box.appendChild(f.wrap); });
    const foot = document.createElement('div');
    foot.style.cssText = 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px;';
    const cancel = document.createElement('div');
    cancel.className = 'btn';
    cancel.style.cssText = 'padding: 8px 16px; border-radius: 999px; background: var(--accent-soft); color: var(--text-2); font-size: 12.5px; font-weight: 600; cursor: pointer;';
    cancel.textContent = tn('cancel', '取消');
    const ok = document.createElement('div');
    ok.className = 'btn btn-primary';
    ok.style.cssText = 'padding: 8px 20px; border-radius: 999px; font-size: 12.5px; font-weight: 600; cursor: pointer;';
    ok.textContent = tn('settingsSaveBtn', '保存');
    foot.appendChild(cancel);
    foot.appendChild(ok);
    box.appendChild(foot);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    overlay.classList.add('show');
    requestAnimationFrame(function () { overlay.classList.add('visible'); });
    function closeIt() { overlay.classList.remove('visible'); setTimeout(function () { overlay.remove(); }, 200); }
    cancel.addEventListener('click', closeIt);
    overlay.addEventListener('click', function (e) { if (e.target === overlay)
        closeIt(); });
    ok.addEventListener('click', function () {
        const name = fName.input.value.trim();
        const email = fMail.input.value.trim();
        const uid = fUid.input.value.trim();
        const sig = fSig.input.value.trim();
        if (!name) {
            showToast(tn('profileNameBad', '名称不能为空'));
            fName.input.focus();
            return;
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast(tn('profileEmailBad', ''));
            fMail.input.focus();
            return;
        }
        if (!/^[A-Za-z0-9_-]{4,24}$/.test(uid)) {
            showToast(tn('profileUidBad', ''));
            fUid.input.focus();
            return;
        }
        profileSet('cs-name', name === PROFILE_DEFAULT_NAME ? null : name);
        profileSet('cs-signature', sig === PROFILE_DEFAULT_SIGNATURE ? null : sig);
        profileSet('cs-email', email === PROFILE_DEFAULT_EMAIL ? null : email);
        profileSet('cs-uid', uid);
        userName.textContent = name;
        if (userEmailEl)
            userEmailEl.textContent = email || PROFILE_DEFAULT_EMAIL;
        renderProfilePanel();
        closeIt();
        showToast(t('saved2'));
    });
}
const profileEditBtn = document.getElementById('profileEditBtn');
if (profileEditBtn)
    profileEditBtn.addEventListener('click', openProfileEditModal);
const profileShareBtn = document.getElementById('profileShareBtn');
if (profileShareBtn)
    profileShareBtn.addEventListener('click', function () {
        const text = profileGet('cs-name', PROFILE_DEFAULT_NAME) + '（' + profileUid() + '）\n'
            + profileGet('cs-signature', PROFILE_DEFAULT_SIGNATURE);
        const done = function () { showToast(tn('profileShared', '档案已复制')); };
        if (navigator.clipboard && navigator.clipboard.writeText)
            navigator.clipboard.writeText(text).then(done).catch(done);
        else
            done();
    });
const profileWallBtn = document.getElementById('profileWallBtn');
if (profileWallBtn)
    profileWallBtn.addEventListener('click', function () { showToast(tn('profileWallSoon', '成就墙筹备中')); });
const profileSignOut = document.getElementById('profileSignOut');
if (profileSignOut)
    profileSignOut.addEventListener('click', function () {
        showConfirm(tn('profileSignOutConfirm', ''), function () {
            /* 只清本机档案（名称/邮箱/签名/头像）；本地任务、项目与设置保留。
               本地账号 ID 视为设备标识，不随退出清除。 */
            ['cs-name', 'cs-email', 'cs-signature', 'cs-avatar'].forEach(function (k) { profileSet(k, null); });
            sideAvatar.src = PROFILE_DEFAULT_AVATAR;
            userName.textContent = PROFILE_DEFAULT_NAME;
            if (userEmailEl)
                userEmailEl.textContent = PROFILE_DEFAULT_EMAIL;
            avatarInput.value = '';
            renderProfilePanel();
            showToast(tn('profileSignedOut', '已退出登录'));
        });
    });
renderProfilePanel();
/* ============ 初始化 ============ */
/* 首次启动静默标记：让侧栏/面板/输入框首帧立即出现、无进场动画；
   必须在首次绘制前打上，requestAnimationFrame 后（首帧已完成）移除，
   之后的 Chat/Work 切换等动画不受影响。 */
document.documentElement.classList.add('cs-boot');
requestAnimationFrame(function () {
    requestAnimationFrame(function () { document.documentElement.classList.remove('cs-boot'); });
});
(function init() {
    const demo = createConversation(t('demoConvTitle'), demoMessages());
    activeConvId = demo.id;
    applyTheme();
    applyLang();
    renderModeActions();
    updateModeSwitcher();
    renderMessages();
    /* 每次打开页面右侧栏默认隐藏 */
    const rp0 = document.getElementById('rightPanel');
    const expand0 = document.getElementById('expandRightBtn');
    if (rp0)
        rp0.classList.add('collapsed');
    if (expand0)
        expand0.style.display = 'flex';
})();
