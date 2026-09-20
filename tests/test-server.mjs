import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const server = spawn('cmd', '/c', ['/c', 'npx tsx src/cmd/devserver/main.ts'], {
  cwd: 'C:\\Users\\KIIT\\OneDrive\\Desktop\\github-player-rating\\api',
  env: { ...process.env, ADDR: ':3000' },
  stdio: 'pipe',
});

server.stdout.on('data', (d) => process.stdout.write(d));
server.stderr.on('data', (d) => process.stderr.write(d));

await setTimeout(5000);

const tests = [
  { url: 'http://localhost:3000/api/health', desc: 'health' },
  { url: 'http://localhost:3000/api/player?username=torvalds', desc: 'player' },
];

for (const t of tests) {
  try {
    const res = await fetch(t.url);
    const text = await res.text();
    console.log(`\n[${t.desc}] ${res.status}: ${text.slice(0, 500)}`);
  } catch (e) {
    console.log(`[${t.desc}] ERROR: ${e.message}`);
  }
}

server.kill('SIGTERM');
await setTimeout(1000);
process.exit(0);
