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
  const req: any = {
    method,
    query,
    headers: {},
  };
  return { req, res };
}

async function test(name: string, handler: any, query: Record<string, string>, method?: string) {
  const { req, res } = makeMock(query, method);
  try {
    await handler(req, res);
    console.log(`[${name}] ${res.statusCode}: ${JSON.stringify(res._body).slice(0, 300)}`);
  } catch (e) {
    console.log(`[${name}] ERROR: ${e}`);
  }
}

async function main() {
  await test('health', healthHandler, {});
  await test('player-missing', playerHandler, {});
  await test('player-invalid', playerHandler, { username: '!!!invalid!!!' });
  await test('player-torvalds', playerHandler, { username: 'torvalds' });
  await test('player-linus', playerHandler, { username: 'torvalds' });
  await test('compare-missing', compareHandler, {});
  await test('compare-both', compareHandler, { a: 'torvalds', b: 'mojombo' });
}

main().catch(console.error);
