/* ==================================================================
   store.ts · Work 配置持久化（app/data/work.json）
   - 分区读改写：main.js 支持多窗口，两窗口同时 PUT 会后写覆盖前写，
     因此每个 section 的更新都走 promise 链串行化。
   - 原子写：tmp + rename，与既有 state.json 同一套模式。
   - 与前端 state.json 的边界：state.json 是前端 UI 快照（会话/项目/知识库/模型），
     work.json 是后端能力配置（智能体/技能/连接器/沙箱策略），互不覆盖。
   ================================================================== */
import * as fs from 'fs';
import * as path from 'path';
import type { StoreApi, WorkSectionName, WorkState } from '../shared/domain';

export const VERSION = 1;

export function defaults(): WorkState {
  return {
    version: VERSION,
    agents: [],              /* 智能体定义 */
    subagents: [],           /* 墨道子智能体（经 options.agents 委派；可编辑可添加不可删） */
    skills: {},              /* slug -> { enabled, order } */
    mcpServers: [],          /* MCP 服务器配置 */
    sandboxPolicy: {},       /* 覆盖 policy.DEFAULT_POLICY */
    modelToolSupport: {},    /* 'providerId/modelId' -> 'fc' | 'react' */
    runHistory: [],          /* 运行页历史（最多 100 条） */
    seeded: false,           /* 内建智能体是否已播种 */
    domainPlugins: {},       /* 领域插件启用开关：未记录=启用，显式 false=停用 */
    prefs: {                 /* 设置页偏好（记忆开关/Git/Worktrees/外观宽度） */
      memory: { globalOn: true, projectOn: true },
      git: { prefix: 'qoder/', force: false, instr: '' },
      worktrees: { fetchBeforeCreate: false, autoDelete: true, limit: 15 },
      appearance: { width: 'standard' }
    }
  };
}

export function createStore(appRoot: string, log?: (line: string) => void): StoreApi {
  const file = path.join(appRoot, 'data', 'work.json');
  let cache: WorkState | null = null;
  let chain: Promise<boolean> = Promise.resolve(false);

  function readRaw(): WorkState {
    try {
      const txt = fs.readFileSync(file, 'utf8');
      const obj = JSON.parse(txt);
      if (!obj || typeof obj !== 'object') return defaults();
      /* 向前兼容：缺失的 section 用默认值补齐，多余的键保留 */
      const d = defaults();
      Object.keys(d).forEach(function (k) {
        if ((obj as unknown as Record<string, unknown>)[k] === undefined) (obj as unknown as Record<string, unknown>)[k] = (d as unknown as Record<string, unknown>)[k];
      });
      return obj as WorkState;
    } catch (e) {
      return defaults();
    }
  }

  function load(): WorkState {
    if (cache === null) cache = readRaw();
    return cache;
  }

  function flush(): Promise<boolean> {
    return new Promise(function (resolve) {
      try {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        const tmp = file + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(cache, null, 2), 'utf8');
        fs.renameSync(tmp, file);
        resolve(true);
      } catch (e) {
        if (log) log('work store write failed: ' + (e as Error).message);
        resolve(false);
      }
    });
  }

  /* 所有写操作串到同一条 promise 链上，保证读-改-写不交错 */
  function mutate(fn: (state: WorkState) => boolean | undefined | void): Promise<boolean> {
    chain = chain.then(function () {
      load();
      let changed: boolean | undefined = true;
      try { changed = fn(cache as WorkState) as boolean | undefined; } catch (e) {
        if (log) log('work store mutate failed: ' + (e as Error).message);
        throw e;
      }
      return changed === false ? false : flush();
    }).catch(function (e) { if (log) log('work store chain error: ' + (e as Error).message); return false; });
    return chain;
  }

  const api: StoreApi = {
    file: file,
    all: function () { return JSON.parse(JSON.stringify(load())) as WorkState; },
    section: function <K extends WorkSectionName>(name: K): WorkState[K] {
      const d = defaults();
      const v = load()[name];
      return (v === undefined ? d[name] : JSON.parse(JSON.stringify(v))) as WorkState[K];
    },
    setSection: function <K extends WorkSectionName>(name: K, value: WorkState[K]): Promise<boolean> {
      if (!(name in defaults())) throw new Error('unknown work.json section: ' + String(name));
      return mutate(function (s) { s[name] = value; });
    },
    /* 分区局部更新：fn(sectionValue) 返回新值（或原地修改后返回 undefined） */
    update: function <K extends WorkSectionName>(name: K, fn: (cur: WorkState[K]) => WorkState[K] | undefined | void): Promise<boolean> {
      if (!(name in defaults())) throw new Error('unknown work.json section: ' + String(name));
      return mutate(function (s) {
        const next = fn(s[name]);
        if (next !== undefined) s[name] = next;
      });
    },
    mutate: mutate,
    reload: function () { cache = null; return load(); }
  };
  return api;
}
