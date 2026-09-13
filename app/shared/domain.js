"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asPermissionMode = asPermissionMode;
/* ---------------- SDK 五档权限模式的运行时收窄 ---------------- */
const PERMISSION_MODE_VALUES = ['default', 'acceptEdits', 'auto', 'plan', 'dontAsk'];
function asPermissionMode(v, fallback = 'default') {
    return PERMISSION_MODE_VALUES.indexOf(v || '') > -1 ? v : fallback;
}
