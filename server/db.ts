/**
 * server/db.ts — 数据目录初始化
 *
 * Phase 5: 所有 CRUD 数据已迁移到 Rehab Python (:8000) SQLite。
 * 本文件仅负责确保 data/ 目录存在（供未来可能的本地缓存使用）。
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const DATA_DIR = path.resolve(import.meta.dirname, 'data');

/** 初始化数据目录 */
export function initDB(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('[DB] Data directory ready at', DATA_DIR);
}
