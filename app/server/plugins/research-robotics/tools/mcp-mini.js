#!/usr/bin/env node
/* research-robotics MCP server（stdio）
   工具：torque_estimate —— 关节静态重力矩估算（质量×力臂×g，含安全系数建议） */
'use strict';

const G = 9.81;

function estimate(a) {
  const massKg = Number(a.massKg);
  const armM = Number(a.armM);
  if (!(massKg > 0)) throw new Error('massKg 必须为正数');
  if (!(armM >= 0)) throw new Error('armM 不能为负');
  const joints = Math.max(1, Math.min(12, Number(a.joints || 1)));
  const gravityTorque = massKg * G * armM;
  const dynamicFactor = Number(a.dynamicFactor || 1.5);       /* 动态放大系数（加速/冲击） */
  const peak = gravityTorque * dynamicFactor;
  const rated = Number(a.ratedNm || 0);
  const out = {
    ok: true,
    gravityTorqueNm: Number(gravityTorque.toFixed(2)),
    peakEstimateNm: Number(peak.toFixed(2)),
    perJointShareNm: Number((peak / joints).toFixed(2)),
    inputs: '质量 ' + massKg + 'kg × 力臂 ' + armM + 'm × g=' + G + '，动态系数 ' + dynamicFactor + '，均摊到 ' + joints + ' 个关节'
  };
  if (rated > 0) {
    out.ratedNm = rated;
    out.marginRatio = Number((rated / (peak / joints)).toFixed(2));
    out.verdict = out.marginRatio >= 2 ? '裕度充足（≥2 倍）' : (out.marginRatio >= 1.5 ? '可用但偏紧，建议实测验证' : '不足：需更大减速比/更高规格执行器/减载');
  } else {
    out.note = '提供 ratedNm（电机额定力矩）可计算裕度系数';
  }
  return out;
}

const TOOLS = [{
  name: 'torque_estimate',
  description: '估算机械臂/机构关节的静态重力矩与动态峰值力矩：按质量、力臂、关节数均摊，可选对照电机额定力矩给裕度判定。用于选型校核与安全检查单。',
  inputSchema: {
    type: 'object',
    properties: {
      massKg: { type: 'number', description: '末端负载+连杆折算质量（kg）' },
      armM: { type: 'number', description: '质心到关节轴的力臂（m）' },
      joints: { type: 'number', description: '均摊关节数，默认 1' },
      dynamicFactor: { type: 'number', description: '动态放大系数，默认 1.5' },
      ratedNm: { type: 'number', description: '电机额定力矩（Nm，经减速比后），可选' }
    },
    required: ['massKg', 'armM']
  }
}];

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
      respond({ protocolVersion: (msg.params && msg.params.protocolVersion) || '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'research-robotics-tools', version: '1.0.0' } });
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
