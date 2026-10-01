const test = require('node:test');
const assert = require('node:assert/strict');
process.env.CORS_ORIGIN = 'https://clearcash.example';
const { app } = require('./server');

test('health, allowed CORS and denied CORS work without database access', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  try {
    for (const path of ['/health','/api/health']) {
      const response = await fetch(origin + path);
      assert.equal(response.status, 200);
      assert.equal((await response.json()).message, 'ClearCash API is running');
    }
    const allowed = await fetch(origin + '/health', { headers: { Origin: 'https://clearcash.example' } });
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://clearcash.example');
    const denied = await fetch(origin + '/health', { headers: { Origin: 'https://untrusted.example' } });
    assert.equal(denied.headers.get('access-control-allow-origin'), null);
    const preflight = await fetch(origin + '/api/transactions', { method: 'OPTIONS', headers: { Origin: 'https://clearcash.example', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } });
    assert.equal(preflight.status, 204);
    assert.match(preflight.headers.get('access-control-allow-headers'), /authorization/);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
