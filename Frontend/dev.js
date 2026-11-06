import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../backend');

console.log('\x1b[36m%s\x1b[0m', '=======================================================');
console.log('\x1b[36m%s\x1b[0m', '  SindhuDrishti — Unified Backend + Frontend Launcher  ');
console.log('\x1b[36m%s\x1b[0m', '=======================================================\n');

// 1. Launch FastAPI Backend on port 8000
console.log('\x1b[33m%s\x1b[0m', '[BACKEND] Starting FastAPI server on http://127.0.0.1:8000 ...');
const backend = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--reload', '--host', '127.0.0.1', '--port', '8000'], {
  cwd: backendDir,
  shell: true,
  stdio: 'inherit'
});

// 2. Launch Vite Frontend on port 3000
console.log('\x1b[32m%s\x1b[0m', '[FRONTEND] Starting Vite dev server on http://localhost:3000 ...\n');
const frontend = spawn('npx', ['vite', '--port=3000', '--host=0.0.0.0'], {
  cwd: __dirname,
  shell: true,
  stdio: 'inherit'
});

function killProcess(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-proc.pid);
    }
  } catch {}
}

let cleanedUp = false;
function cleanup() {
  if (cleanedUp) return;
  cleanedUp = true;
  console.log('\n\x1b[31m%s\x1b[0m', '[SHUTDOWN] Stopping both backend and frontend servers...');
  killProcess(backend);
  killProcess(frontend);
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

