#!/usr/bin/env node
/* research-ai MCP server（stdio）
   工具：gpu_mem_estimate —— 训练/推理显存估算（参数量、精度、批次） */
'use strict';

function estimate(a) {
  const paramsB = Number(a.paramsB);            /* 参数量（十亿） */
  const precision = String(a.precision || 'bf16');
  const batch = Math.max(1, Number(a.batch || 1));
  const seqLen = Math.max(1, Number(a.seqLen || 2048));
  const hidden = Math.max(1, Number(a.hidden || 4096));
  const mode = String(a.mode || 'train');
  const bytesPer = { fp32: 4, bf16: 2, fp16: 2, int8: 1, int4: 0.5 }[precision];
  if (!bytesPer) throw new Error('precision 支持 fp32/bf16/fp16/int8/int4');
  if (!isFinite(paramsB) || paramsB <= 0) throw new Error('paramsB 必须为正数');

  const params = paramsB * 1e9;
  const gb = 1024 * 1024 * 1024;
  const weightsGb = params * bytesPer / gb;

  let msg, totalGb;
  if (mode === 'infer') {
    /* 推理：权重 + KV cache（2 × 层数近似按 hidden/128 估） + 激活 */
    const layers = Math.max(1, Math.round(hidden / 128));
    const kvGb = 2 * layers * seqLen * batch * hidden * bytesPer / gb;
    totalGb = weightsGb + kvGb + 0.5;
    msg = '权重 ' + weightsGb.toFixed(1) + 'GB + KV cache ≈' + kvGb.toFixed(1) + 'GB + 余量 0.5GB';
  } else {
    /* AdamW 训练：权重 + 梯度 + Adam 状态(m,v) + 激活近似 */
    const trainable = a.trainableB === undefined ? paramsB : Number(a.trainableB);
    const gradGb = trainable * 1e9 * bytesPer / gb;
    const optimGb = trainable * 1e9 * (precision === 'fp32' ? 8 : 8) / gb;  /* m+v fp32 */
    const actGb = batch * seqLen * hidden * bytesPer * 12 / gb;            /* 经验系数 */
    totalGb = weightsGb + gradGb + optimGb + actGb;
    msg = '权重 ' + weightsGb.toFixed(1) + ' + 梯度 ' + gradGb.toFixed(1) + ' + Adam 状态 ' + optimGb.toFixed(1) + ' + 激活 ≈' + actGb.toFixed(1) + '（GB，经验估算）';
  }
  const gpu = {};
  [['A100 80G', 80], ['A100 40G', 40], ['RTX 4090 24G', 24], ['RTX 3090 24G', 24]].forEach(function (g) { gpu[g[0]] = Math.ceil(totalGb / g[1]); });
  return { ok: true, totalGb: Number(totalGb.toFixed(1)), breakdown: msg, sameBatchAcrossGpus: gpu, note: '训练估算含激活经验系数，多卡并行/ZeRO 会显著改变分布，仅作规划参考' };
}

const TOOLS = [{
  name: 'gpu_mem_estimate',
  description: '估算模型训练/推理所需显存：按参数量、精度、批次、序列长度给出权重/梯度/优化器状态/KV cache 分解与单卡放几张的建议。',
  inputSchema: {
    type: 'object',
    properties: {
      paramsB: { type: 'number', description: '参数量（十亿），如 7' },
      precision: { type: 'string', description: 'fp32/bf16/fp16/int8/int4，默认 bf16' },
      batch: { type: 'number', description: 'batch size，默认 1' },
      seqLen: { type: 'number', description: '序列长度，默认 2048' },
      hidden: { type: 'number', description: '隐藏维度，默认 4096' },
      mode: { type: 'string', description: 'train 或 infer，默认 train' },
      trainableB: { type: 'number', description: '可训练参数量（十亿），微调场景给（如 LoRA 0.1）；缺省=全量' }
    },
    required: ['paramsB']
  }
}];

function callTool(name, args) {
  if (name !== 'gpu_mem_estimate') throw new Error('未知工具 ' + name);
  return estimate(args);
}

/* ---------------- stdio JSON-RPC loop（与 research-math 相同骨架） ---------------- */
let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (chunk) {
  buf += chunk;
  let idx;
  while ((idx = buf.indexOf('\n')) > -1) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    let msg; try { msg = JSON.parse(line); } catch (e) { continue; }
    handle(msg);
  }
});
process.stdin.on('end', function () { process.exit(0); });

function handle(msg) {
  const respond = function (result) {
    if (msg.id === undefined) return;
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: result }) + '\n');
  };
  const fail = function (code, message) {
    if (msg.id === undefined) return;
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, error: { code: code, message: message } }) + '\n');
  };
  try {
    if (msg.method === 'initialize') {
      respond({ protocolVersion: (msg.params && msg.params.protocolVersion) || '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'research-ai-tools', version: '1.0.0' } });
    } else if (msg.method === 'tools/list') {
      respond({ tools: TOOLS });
    } else if (msg.method === 'tools/call') {
      try {
        const out = callTool(msg.params && msg.params.name, (msg.params && msg.params.arguments) || {});
        respond({ content: [{ type: 'text', text: JSON.stringify(out) }], isError: false });
      } catch (e) {
        respond({ content: [{ type: 'text', text: 'error: ' + e.message }], isError: true });
      }
    } else if (msg.method === 'ping') {
      respond({});
    } else if (/^notifications\//.test(msg.method)) {
      /* 通知不回包 */
    } else {
      fail(-32601, 'method not found: ' + msg.method);
    }
  } catch (e) { fail(-32603, e.message); }
}
