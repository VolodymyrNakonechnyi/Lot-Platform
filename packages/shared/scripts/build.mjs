// Збирає ліби у двох форматах одночасно:
//   dist/esm — для Vite/фронту (ESM)
//   dist/cjs — для NestJS (CommonJS, бо в бекенді немає "type": "module")
//
// Замість перейменування .js -> .cjs кладемо в кожну теку маркер package.json
// із власним "type". Node дивиться на найближчий package.json і сам розуміє,
// який це модуль — жодного переписування шляхів у імпортах не треба.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const watch = process.argv.includes('--watch');

const targets = [
  { config: 'tsconfig.esm.json', dir: 'dist/esm', type: 'module' },
  { config: 'tsconfig.cjs.json', dir: 'dist/cjs', type: 'commonjs' },
];

function tsc(config) {
  return new Promise((resolve, reject) => {
    const args = [
      '-p',
      config,
      ...(watch ? ['--watch', '--preserveWatchOutput'] : []),
    ];
    const p = spawn('npx', ['tsc', ...args], { stdio: 'inherit' });
    p.on('exit', (code) =>
      code === 0 || watch
        ? resolve()
        : reject(new Error(`tsc ${config} -> ${code}`)),
    );
  });
}

async function marker({ dir, type }) {
  await mkdir(dir, { recursive: true });
  await writeFile(
    `${dir}/package.json`,
    JSON.stringify({ type }, null, 2) + '\n',
  );
}

if (watch) {
  // У watch-режимі маркери пишемо одразу, далі два tsc крутяться паралельно.
  await Promise.all(targets.map(marker));
  await Promise.all(targets.map((t) => tsc(t.config)));
} else {
  await Promise.all(targets.map((t) => tsc(t.config)));
  await Promise.all(targets.map(marker));
  console.log('@app/contracts: зібрано dist/esm + dist/cjs');
}
