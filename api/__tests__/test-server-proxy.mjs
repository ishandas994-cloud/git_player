import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const server = spawn('cmd', ['/c', 'npx tsx src/cmd/devserver/main.ts'], {
  cwd: 'C:\\Users\\KIIT\\OneDrive\\Desktop\\github-player-rating\\api',
  env: { ...process.env, ADDR: ':4000', PATH: process.env.PATH },
  stdio: 'ignore',
});

await setTimeout(6000);

const tests = [
  { url: 'http://localhost:4000/api/health', desc: 'health' },
  { url: 'http://localhost:4000/api/player?username=torvalds', desc: 'player' },
  { url: 'http://localhost:4000/api/compare?a=torvalds&b=mojombo', desc: 'compare' },
];

for (const t of tests) {
  try {
    const res = await fetch(t.url);
    const text = await res.text();
    console.log(`[${t.desc}] ${res.status}: ${text.slice(0, 300)}`);
  } catch (e) {
    console.log(`[${t.desc}] ERROR: ${e.message}`);
  }
}

server.kill('SIGTERM');
await setTimeout(1000);
process.exit(0);
