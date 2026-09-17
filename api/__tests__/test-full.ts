import 'dotenv/config';
import { handler as healthHandler } from './src/health';
import { handler as playerHandler } from './src/player';
import { handler as compareHandler } from './src/compare';

function makeMock(query: Record<string, string>, method = 'GET') {
  const res: any = {
    statusCode: 200,
    _body: null,
    _headers: {},
    status(code: number) { this.statusCode = code; return this; },
    json(body: any) { this._body = body; return this; },
    header(k: string, v: string) { this._headers[k] = v; return this; },
    sendStatus(code: number) { this.statusCode = code; return this; },
  };
  const req: any = { method, query, headers: {} };
  return { req, res };
}

async function test(name: string, handler: any, query: Record<string, string>, method?: string) {
  const { req, res } = makeMock(query, method);
  try {
    await handler(req, res);
    return { status: res.statusCode, body: res._body };
  } catch (e) {
    return { status: 500, body: String(e) };
  }
}

async function main() {
  console.log('=== API Endpoints Test ===');

  const health = await test('health', healthHandler, {});
  console.log(`[health] ${health.status}:`, JSON.stringify(health.body));

  const noUser = await test('player-missing', playerHandler, {});
  console.log(`[player-missing] ${noUser.status}:`, JSON.stringify(noUser.body));

  const badUser = await test('player-invalid', playerHandler, { username: '!!!' });
  console.log(`[player-invalid] ${badUser.status}:`, JSON.stringify(badUser.body));

  const player = await test('player-torvalds', playerHandler, { username: 'torvalds' });
  console.log(`[player-torvalds] ${player.status}:`, JSON.stringify(player.body).slice(0, 500));

  if (player.body && typeof player.body === 'object') {
    const p = player.body as any;
    console.log('  username:', p.username);
    console.log('  displayName:', p.displayName);
    console.log('  ovr:', p.ovr);
    console.log('  tier:', p.tier);
    console.log('  position:', p.position);
    console.log('  overview:', JSON.stringify(p.overview));
    console.log('  languages:', p.languages?.length ?? 0);
    console.log('  topRepos:', p.topRepos?.length ?? 0);
    console.log('  breakdown:', p.breakdown?.map((b: any) => `${b.category}:${b.score}`));
    console.log('  attributes:', JSON.stringify(p.attributes));
  }

  const compareMissing = await test('compare-missing', compareHandler, {});
  console.log(`[compare-missing] ${compareMissing.status}:`, JSON.stringify(compareMissing.body));

  const compare = await test('compare-both', compareHandler, { a: 'torvalds', b: 'mojombo' });
  console.log(`[compare-both] ${compare.status}:`, JSON.stringify(compare.body).slice(0, 500));
  if (compare.body && typeof compare.body === 'object') {
    const c = compare.body as any;
    console.log('  winner:', c.winner, 'scoreA:', c.scoreA, 'scoreB:', c.scoreB);
    console.log('  summary:', c.summary);
  }
}

main().catch(console.error);
