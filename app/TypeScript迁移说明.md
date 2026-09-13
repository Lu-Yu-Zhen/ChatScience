# ChatScience · TypeScript 迁移说明

> 迁移日期：2026-09-13
> 依据：Qoder Agent SDK 官方文档（docs.qoder.com/zh/cli/sdk：overview / quick-start / references / references-typescript）
> 原则：**功能与对外行为不变**——所有 HTTP 路由、SSE 事件、文件布局、启动链路与打包产物结构均保持原样

---

## 一、改写范围

### 1.1 已迁移为 TypeScript（19 个源文件 → `app/src/`）

| 层 | 文件（src 下） | 说明 |
|---|---|---|
| 共享类型 | `shared/domain.ts` | 全项目业务域类型：WorkState 分区、StoreApi / SandboxApi / NotesApi / KbApi / QoderApi / ResearchApi 接口、SandboxPolicy、ExecResult、AgentDefRecord、WorkRunEventMap（SSE 事件负载）、CsDesktopBridge（preload 桥） |
| SDK 接入 | `shared/qoder-sdk.ts` | 官方类型重导出（type-only）+ `loadSdk()` 动态加载器 |
| Electron 壳 | `main.ts`、`preload.ts` | 窗口/托盘/快捷键/IPC 白名单/原子写状态，逐行保持 |
| 后端 | `server/index.ts` | 启动/鉴权/端口回退/`/api/state`、`/api/chat`（SSE）、工作区文件扫描 |
| 后端 | `server/routes.ts` | 全部 `/api/work/*` 路由（29 个端点） |
| 后端 | `server/qoder.ts` | Qoder Agent SDK 封装：`runWorkTurn`、`makeCanUseTool`、`buildScienceServer`（6 个 in-process 科研工具）、技能插件管理、`ping` |
| 后端 | `server/sandbox.ts` | 沙箱执行引擎（execCode / installDeps / 文件 API / GC / 声明式断网） |
| 后端 | `server/proc.ts` | 运行时探测、进程树终止、spawnGuarded |
| 后端 | `server/policy.ts` | 沙箱策略、路径守卫、16 类危险命令静态拦截 |
| 后端 | `server/store.ts` | work.json 分区串行化持久化 |
| 后端 | `server/sse.ts` | SSE 心跳与事件帧 |
| 后端 | `server/notes.ts`、`server/kb.ts`、`server/ai.ts`、`server/research.ts` | 笔记 / BM25 知识库 / 多厂商 AI 流式代理 / arXiv·网页·检索工具 |
| 构建工具 | `build.ts`、`pack.ts`、`make-icons.ts` | renderer 构建（断言全部保留）、打包（新增 tsc 步骤）、图标生成 |

**产物落位策略**：`rootDir=src、outDir=.`——编译产物回到迁移前的 exact 路径
（`main.js`、`preload.js`、`server/*.js`、`build.js`、`pack.js`、`make-icons.js`、新增 `shared/*.js`）。
因此 Electron 入口（package.json `main`）、build.js 的注入路径、pack.js 的复制清单、
verify 脚本、start.bat 的调用路径**全部无需改动**。

### 1.2 保持 JavaScript（有意为之，非遗漏）

| 部分 | 原因 |
|---|---|
| `01/主页面.html`（单文件前端）+ `01/work/*.js`（13 个模块） | 前端是「构建期内联进单个 IIFE」的拼接模型，13 个 work 模块共享同一闭包作用域，且主脚本 38 万字符内联在 HTML 里；转 TS 需要先把前端模块化（ESM + 打包器），属独立的前端架构改造，硬转只会引入行为风险。已列为后续迭代（见第七节） |
| `verify/*.js`（验证脚本） | 验证脚本本身就是本次迁移的行为安全网；同步改写会削弱验证能力。新增的 `verify/ts-migration-smoke.js` 也用 JS 编写 |
| `_cdp_eval.js` | 调试辅助脚本，与产品链路无关 |
| `server/config.json`、`server/qoder.json` | 运行时配置（后者含 PAT），不属于代码 |

### 1.3 配置与脚本变更

| 文件 | 变更 |
|---|---|
| `app/tsconfig.json`（新增） | 见第三节 |
| `app/package.json` | devDependencies 新增 `typescript@^5.9.2`、`@types/node@^20`、`@types/express@^4`；dependencies 显式声明 `zod@^4`（此前仅作为 SDK 的隐式 peer 依赖存在）；scripts 新增 `typecheck` / `build:ts`，`start` 改为先 tsc 再 electron |
| `app/start.bat` | 启动前增加 tsc 编译步骤（编译失败即中止，不启动 Electron） |
| `app/pack.ts` | 打包流程第 0 步先跑 tsc；node_modules 复制排除清单增加 `typescript` 与 `@types/*`（产物不含构建工具链）；产物自检增加 `node_modules/zod`；使用说明补充 TS 源码结构说明 |
| `.gitignore`（仓库级） | 排除 node_modules / dist / data / 日志 / 两份密钥文件 |

---

## 二、类型声明策略

1. **SDK 类型以官方包为准**：`@qodercn-ai/qodercn-agent-sdk@1.0.34` 自带 `dist/index.d.ts`，
   与官方 TypeScript参考页（references-typescript）同源。业务代码不直接 import SDK，
   统一经 `shared/qoder-sdk.ts` 重导出，当前接入的官方类型面：
   `query` / `tool` / `createSdkMcpServer` / `accessToken`（运行时，经 loadSdk）；
   `Options` / `Query` / `SDKMessage` 及各成员 / `CanUseTool` / `CanUseToolOptions` /
   `PermissionResult` / `PermissionMode` / `AgentDefinition` / `McpServerConfig` 族 /
   `SdkPluginConfig` / `CallToolResult` / `ToolAnnotations` / `AnyZodRawShape` /
   `AuthOptions`（类型，type-only 零运行时成本）。
2. **SDK 模块的值类型**用 `type QoderSdkModule = typeof import('@qodercn-ai/qodercn-agent-sdk')`
   获取（纯类型引用，不触发加载），`loadSdk(): Promise<QoderSdkModule>` 使 `sdk.query()`
   等调用获得完整的官方参数/返回类型检查。
3. **业务域类型集中在 `shared/domain.ts`**，采用结构化接口 + 各工厂函数返回值显式标注
   （`createSandbox(): SandboxApi` 等），模块间依赖（WorkCtx / QoderDeps）全部有类型，
   路由层 `mountRoutes(app, ctx: WorkCtx)` 不再是隐式 any。
4. **strict 全开**：`strict: true` 下无隐式 any；请求体等边界输入统一
   `Record<string, any>`（Body）显式收口；SDK 消息 content 块用最小断言
   （`AnyContentBlock`）对齐线路协议形状。

## 三、编译配置（tsconfig.json 逐项说明）

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",          // Electron 33 = Chromium 130 / Node 20，ES2022 全量支持
    "lib": ["ES2022", "DOM", "DOM.Iterable"],  // DOM 仅为 preload 的 window.location 提供类型
    "module": "commonjs",        // Electron 主进程与 preload 均为 CJS 加载，保持不变
    "moduleResolution": "node",  // 与 commonjs 匹配；SDK 类型经 package.json "types" 解析
    "rootDir": "src",
    "outDir": ".",               // 产物落回原路径，下游零改动（注意必须显式 exclude，见第五节）
    "strict": true,              // 全量严格模式
    "esModuleInterop": true,
    "skipLibCheck": true,        // SDK d.ts 的 ESM 子路径导入与 @types 混用的库间差异不阻塞编译
    "noEmitOnError": true,       // 关键：类型不过不出产物，杜绝半成品覆盖可用代码
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]   // 显式声明：避免默认 exclude 把 outDir="." 全目录排除
}
```

## 四、构建与运行链路

```
开发：编辑 app/src/**/*.ts
  → npm run typecheck        （tsc --noEmit，快检）
  → npm run build:ts         （tsc，产物落回原路径）
  → node build.js            （renderer 构建，未变）
  → npm start                （= build:ts + electron .）

打包：node pack.js
  → 第 0 步 tsc 编译 → build.js 构建渲染层 → 复制 Electron 运行时
  → 复制 main/preload/server（编译产物）+ node_modules（排除 electron/typescript/@types）
  → rcedit 图标 → 产物自检 → 启动冒烟（与迁移前一致）

便携包内：resources/app/ 下是编译后的 JS（明文可改），
  「重新构建.bat」仍只跑 node build.js，包内无需 TS 工具链。
```

## 五、迁移注意事项（踩过的坑）

1. **动态 import 被编译器改写（最重要）**：SDK 是纯 ESM 包（`"type": "module"`），
   Electron 33 内置 Node 20 无 `require(esm)`。tsc 在 CommonJS 输出中会把**一切**
   `import()`——包括变量指示符——统一改写为 `require()` 包装，重新引入当年打包版
   `ERR_REQUIRE_ESM` 故障。解法：`shared/qoder-sdk.ts` 用 Function 间接层构造真实
   `import()`，编译器无法识别、原样保留：
   ```ts
   const dynamicImport = new Function('specifier', 'return import(specifier);');
   sdkPromise = dynamicImport(SDK_PACKAGE_SPEC).then(m => m.default || m);
   ```
   已实测：编译产物中确认无任何对 SDK 的静态 require；SDK 经该通道加载成功
   （`query`/`tool`/`createSdkMcpServer`/`accessToken` 均为 function）。
2. **tsconfig `outDir: "."` 与默认 exclude**：不显式声明 `exclude` 时，tsc 会把
   outDir（即整个 app 目录）加入默认排除，导致 `include` 匹配不到任何文件
   （TS18003）。必须显式 `"exclude": ["node_modules", "dist"]`。
3. **zod 显式声明**：`qoder.ts` 的科研工具 schema 直接依赖 zod（官方文档 tool()
   即 Zod raw shape 用法），此前 zod 仅作为 SDK 的 peer 依赖被 npm 提升安装；
   迁移后已在 dependencies 显式声明（实测安装版本 4.5.4，满足 SDK peer
   `^3.25 || ^4`），pack 产物自检也已加入 zod 存在性检查。
4. **SDK 消息类型断言点**：`SDKMessage` 联合类型成员的字段在 d.ts 中部分较宽
   （如 `stream_event` 的 `event.delta` 为 `{}`），业务只依赖线路协议的已知字段，
   用最小形状断言（不改变运行时）收窄；`result` 消息的 `duration_ms` 等用 `??`
   兜底本地计时，与 JS 版宽松字段访问等价。
5. **`noEmitOnError: true`**：保证「编译失败绝不覆盖现有可用产物」——这是行为
   不变承诺在工具链上的落实；start.bat 与 pack.js 均按 tsc 退出码中止。
6. **Buffer 泛型**：@types/node 20 起 `Buffer<T>` 带底层 ArrayBuffer 泛型，
   `Buffer.concat` 需要元素类型一致（`Buffer<ArrayBuffer>`），make-icons 的
   PNG 缓冲做了相应标注，逻辑未变。

## 六、行为保持验证（全部通过）

| 验证项 | 结果 |
|---|---|
| `tsc --noEmit`（strict） | 0 错误 |
| SDK 动态加载（编译产物 → 真实 import ESM SDK） | ✅ query/tool/createSdkMcpServer/accessToken 可用 |
| renderer/index.html 一致性 | ✅ 新旧 build.js 产物 SHA256 完全一致（510,972 bytes） |
| 编译产物语法（node --check × 19） | ✅ 全部通过 |
| 行为冒烟 `verify/ts-migration-smoke.js`（21 项） | ✅ ALL PASS |
| —— 鉴权 | 无 token → 401 ✅ |
| —— bootstrap | store 播种 4 智能体 + 沙箱默认策略 + 运行时探测 ✅ |
| —— 技能 | 12 技能全量发现、builtin 标记正确 ✅ |
| —— qoder config | hasToken=true、model=performance ✅ |
| —— 笔记 | 增查删 ✅ |
| —— 知识库 | 索引/状态/删除 ✅ |
| —— 沙箱 | 真实 python 执行（RESULT:42）✅；`rm -rf /` 静态拦截 ✅ |
| 未覆盖 | `/api/chat`（需外网上游）、`/api/work/agent/run`（需 Qoder 云端，可用 `verify/sdk-smoke.js` 单测）、pack.js 全流程（会拉起 exe，建议在桌面会话手动跑一次 `node pack.js`） |

## 七、迁移中发现的历史问题（遵从行为不变原则，未修改，仅记录）

1. **Chat 深度思考开关实际无效**：`index.js`（现 `index.ts`）调用 `applyThinking`
   把思考参数写到了 `chatOpts` 上，但 `chatStream` 组装上游请求体时并不读取这些
   字段——思考开关注入从未到达上游。属既有 bug，本次原样保留；如需修复，
   在 `chatStream` 内把 `opts.thinking / enable_thinking / reasoning` 复制进 `body` 即可。
2. **`/api/work/sandbox/runtimes?force=1` 不生效**：沙箱 API 的 `detectRuntimes`
   包装函数一直忽略参数（走了 TTL 缓存）。本次按原行为保留（参数收下但忽略，
   源码有注释标记）；如需启用，把包装改为透传 `force` 一行即可。
3. **沙箱「运行时未安装」错误文案缺右括号**：源表达式 `+ join(...) || '无' + '）'`
   因运算符优先级导致 `||` 分支永不生效且丢失闭合括号。原样保留（提示性文案，
   不影响功能）。

## 八、后续建议

1. **前端 TS 化（二期）**：把 `01/work/*.js` 拆为 ESM 模块 + `主页面.html` 内联脚本
   抽取为 TS 源，经打包器（如 esbuild）产出 bundle，替换现有「字符串内联」模型；
   可顺带获得 i18n 词条的编译期校验（替代 build.js 的运行时键集合 diff）。
2. 修复第七节 1/2 两个历史问题（各一处小改动，建议单独提交并补验证）。
3. 跑一次完整 `node pack.js` 打包 + 启动冒烟，确认便携产物链路（本次受环境限制
   未在打包流程内拉起 exe）。
4. `verify/sdk-smoke.js` 等脚本如需迁移 TS，可复用 `shared/qoder-sdk.ts` 的类型面。

---

*迁移代码与验证脚本已入库：基线 `a31f729`（迁移前）→ TypeScript 迁移提交。*
