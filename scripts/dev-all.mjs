// Starts the API server and the website together:  npm run start:all
import { spawn } from 'node:child_process';

const run = (name, args) => {
  const p = spawn('npm', args, { stdio: 'inherit', shell: true });
  p.on('exit', (code) => { console.log(`[${name}] stopped (${code})`); process.exit(code ?? 0); });
  return p;
};
run('server', ['run', 'server']);
run('site', ['run', 'dev']);
