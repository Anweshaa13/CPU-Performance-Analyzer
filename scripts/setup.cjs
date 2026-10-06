const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const backend = path.join(root, 'backend');
const isWin = process.platform === 'win32';
const python = isWin ? 'python' : 'python3';
const venvPython = isWin ? path.join(backend, '.venv', 'Scripts', 'python.exe') : path.join(backend, '.venv', 'bin', 'python');
const npm = isWin ? 'npm.cmd' : 'npm';

function exec(cmd, args, cwd) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: false });
  if (r.status !== 0) process.exit(r.status || 1);
}

if (!fs.existsSync(venvPython)) {
  exec(python, ['-m', 'venv', '.venv'], backend);
}
exec(venvPython, ['-m', 'pip', 'install', '-r', 'requirements.txt'], backend);
exec(npm, ['install'], path.join(root, 'frontend'));
console.log('\n✅ Setup complete. Run: npm run dev\n');
