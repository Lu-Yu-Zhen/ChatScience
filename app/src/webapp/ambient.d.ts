/* ==================================================================
   ambient.d.ts · webapp 层的全局环境声明
   前端是无模块全局脚本（module: none）：主脚本（webapp.ts）与 Work 模块
   （work/*.ts）最终被 build.ts 拼接进同一个 IIFE，共享同一作用域，
   各文件顶层 const 经全局声明合并互相可见——与运行时拼接语义一致。
   本文件只声明「跨边界」的名字：preload 桥、桌面后端通道、第三方库全局、
   以及 Node 侧（build.ts 键集合校验）复用的 module导出守卫。
   ================================================================== */

/* 80-i18n.ts 的 CommonJS 导出守卫在浏览器 bundle 内不执行（module 未定义），
   在 Node 侧由 build.ts require 读取做 zh/en 键集合校验 */
declare var module: { exports?: unknown } | undefined;

/* preload 桥（main 进程 preload.ts 经 contextBridge 注入；纯浏览器模式不存在） */
interface CsDesktopBridge {
  version: string;
  platform: string;
  token: string;
  port: string;
  base: string;
  getStateSync(): string | null;
  saveState(json: string): boolean;
  notify(title: string, body: string): void;
  log(line: string): void;
  onTopmostChanged(cb: (v: boolean) => void): void;
  onLeftPanelToggle(cb: () => void): void;
  onMaxChanged(cb: (v: boolean) => void): void;
  winMinimize(): void;
  winMaximizeToggle(): void;
  winClose(): void;
  selectDirectory(): Promise<string | null | { error: string }>;
}

/* 桥接脚本（build.ts 注入）设置的桌面后端通道 */
interface CsBackend {
  base: string;
  token: string;
  mode: 'ipc' | 'http';
}

/* Work 命名空间由 00-core.ts 定义并挂到 window（此处只标注窗口挂载点的存在性，
   具体成员类型由 00-core.ts 自身提供） */
declare var Work: any;

interface Window {
  csDesktop?: CsDesktopBridge;
  CS_BACKEND?: CsBackend;
  CS_WORK?: any;
}

/* 第三方库（主页面.html 经 CDN defer 引入；浏览器全局，类型从简） */
declare var pdfjsLib: any;
declare var mammoth: any;
declare var XLSX: any;
declare var marked: any;
declare var DOMPurify: any;
declare var katex: any;
declare var renderMathInElement: any;
