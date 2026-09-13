"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/* ==================================================================
   make-icons.ts · 由 logo.jpeg 生成应用图标（须用 Electron 运行）
     node_modules/electron/dist/electron.exe make-icons.js
   产物：
     icons/app.ico    多尺寸（256/128/64/48/32/24/16）exe/窗口图标
     tray.png         16px 托盘图标（tray@2x.png 32px）
   ================================================================== */
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
electron_1.app.whenReady().then(function () {
    const src = path.join(__dirname, 'logo.jpeg');
    const img = electron_1.nativeImage.createFromPath(src);
    if (img.isEmpty()) {
        console.error('[icons] logo.jpeg 解码失败');
        electron_1.app.exit(1);
        return;
    }
    const sizes = [256, 128, 64, 48, 32, 24, 16];
    const pngs = sizes.map(function (s) {
        return { s: s, png: img.resize({ width: s, height: s, quality: 'best' }).toPNG() };
    });
    /* 手工拼 ICO：6 字节头 + N 个 16 字节目录项 + PNG 数据（Vista+ 支持 PNG 压缩项） */
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2); /* type: icon */
    header.writeUInt16LE(pngs.length, 4);
    const entries = [];
    let offset = 6 + 16 * pngs.length;
    pngs.forEach(function (p) {
        const e = Buffer.alloc(16);
        e[0] = p.s % 256;
        e[1] = p.s % 256;
        e[2] = 0;
        e[3] = 0;
        e.writeUInt16LE(1, 4); /* planes */
        e.writeUInt16LE(32, 6); /* bpp */
        e.writeUInt32LE(p.png.length, 8);
        e.writeUInt32LE(offset, 12);
        entries.push(e);
        offset += p.png.length;
    });
    const ico = Buffer.concat([header, ...entries, ...pngs.map(function (p) { return p.png; })]);
    fs.mkdirSync(path.join(__dirname, 'icons'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, 'icons', 'app.ico'), ico);
    fs.writeFileSync(path.join(__dirname, 'tray.png'), img.resize({ width: 16, height: 16, quality: 'best' }).toPNG());
    fs.writeFileSync(path.join(__dirname, 'tray@2x.png'), img.resize({ width: 32, height: 32, quality: 'best' }).toPNG());
    console.log('[icons] app.ico ' + ico.length + ' bytes, ' + pngs.length + ' sizes; tray.png/tray@2x.png 已更新');
    electron_1.app.quit();
});
