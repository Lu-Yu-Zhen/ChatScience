"use strict";
/* ==================================================================
   shared/qoder-sdk.ts · Qoder Agent SDK 的类型接入与运行时加载
   遵循官方文档（docs.qoder.com/zh/cli/sdk）的 TypeScript API 面：
   query() / tool() / createSdkMcpServer() / Options / SDKMessage 联合类型 /
   CanUseTool / PermissionResult / AgentDefinition 等，全部取自 SDK 包自带的
   dist/index.d.ts（@qodercn-ai/qodercn-agent-sdk 1.0.34，与官方 TS 参考
   @qoder-ai/qoder-agent-sdk 同源）。本模块集中做两件事：

   1. 类型重导出：业务代码统一从这里 import type，不允许散落直接 import SDK。
      全部是 type-only 导入——编译后彻底消失，不会产生任何对 ESM 包的 require。

   2. 运行时加载器 loadSdk()：SDK 是纯 ESM 包（"type": "module"），而 Electron 33
      内置 Node 20 不支持 require(esm)。系统 Node 24 的 require(esm) 能加载，
      所以产物必须保留真实的动态 import()——这是当初打包版 server 起不来的
      根因（ERR_REQUIRE_ESM）。注意：tsc 在 CommonJS 输出里会把一切 import()
      （含变量指示符）改写成 require 包装，因此必须经 Function 间接层构造
      import()，让编译器无从识别、无从改写。
   ================================================================== */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSdk = loadSdk;
/* ---------------- 运行时加载器（CJS 进程加载 ESM SDK 的唯一通道） ---------------- */
/* 指示符收进常量，避免散落字符串 */
const SDK_PACKAGE_SPEC = '@qodercn-ai/qodercn-agent-sdk';
/* 关键：tsc 在 CommonJS 输出中会把一切 import()（无论指示符是字面量还是变量）
   统一改写为 require 包装 —— 系统 Node 24 的 require(esm) 能扛住，
   Electron 33 内置 Node 20 扛不住，打包版会再次爆发 ERR_REQUIRE_ESM。
   用 Function 间接层构造真实的 import()，编译器无法识别，原样保留到产物。 */
const dynamicImport = new Function('specifier', 'return import(specifier);');
let sdkPromise = null;
function loadSdk() {
    if (!sdkPromise) {
        sdkPromise = dynamicImport(SDK_PACKAGE_SPEC).then(function (m) {
            const mod = m;
            return mod.default || mod;
        }).catch(function (e) {
            /* 失败不缓存：曾经 rejected promise 被永久留存，之后每次调用都立即
               以同一错误拒绝，"下次自动重试"名不副实（打包版首启 node_modules
               抽取竞态等瞬时失败永无恢复机会）。重置后下次调用重新 import。 */
            sdkPromise = null;
            throw e;
        });
    }
    return sdkPromise;
}
