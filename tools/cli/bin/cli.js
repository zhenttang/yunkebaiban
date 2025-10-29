#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 找到项目根目录的 node_modules/.bin/r 命令
// 无论从哪个子目录运行，都使用绝对路径
const projectRoot = join(__dirname, '..', '..', '..');
const rCommand = process.platform === 'win32' 
  ? join(projectRoot, 'node_modules', '.bin', 'r.cmd')
  : join(projectRoot, 'node_modules', '.bin', 'r');

// 使用绝对路径调用 r 命令来运行 yunke.ts
const result = spawnSync(rCommand, ['yunke.ts', ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: projectRoot,  // 在项目根目录执行
  shell: true,       // Windows 需要 shell 来执行 .cmd 文件
});

process.exit(result.status || 0);
