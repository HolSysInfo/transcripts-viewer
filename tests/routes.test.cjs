const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

function transcriptRoute({ transcript = { _id: 'snowflake_manual' }, error } = {}) {
  const calls = [];
  const htmlResponse = new Response('<!doctype html><html>🐱</html>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
  const route = loadTypeScript('src/app/api/transcripts/[...id]/route.ts', {
    'next/server': { NextResponse: { json: (...args) => Response.json(...args) } },
    '@/lib/transcripts': {
      async getTranscript(id) {
        calls.push(['document', id]);
        if (error) throw error;
        return transcript;
      },
      async getHtmlResponse(id, download) {
        calls.push(['html', id, download]);
        return htmlResponse;
      },
    },
  });
  return { route, calls, htmlResponse };
}

function request(download = false) {
  return { nextUrl: new URL(`https://transcripts.sys-info.xyz/api/transcripts/snowflake_manual${download ? '?download=1' : ''}`) };
}

test('JSON route preserves manual string ID and returns full metadata', async () => {
  const transcript = { _id: 'snowflake_manual', storage: 'gridfs', schema_version: 2, message_count: 1001 };
  const { route, calls } = transcriptRoute({ transcript });
  const response = await route.GET(request(), { params: Promise.resolve({ id: ['snowflake_manual'] }) });
  assert.equal(route.runtime, 'nodejs');
  assert.equal(route.dynamic, 'force-dynamic');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), transcript);
  assert.deepEqual(calls, [['document', 'snowflake_manual']]);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('HTML route delegates intact response and download preference', async () => {
  const { route, calls, htmlResponse } = transcriptRoute();
  const response = await route.GET(request(true), { params: Promise.resolve({ id: ['snowflake_manual', 'html'] }) });
  assert.equal(response, htmlResponse);
  assert.deepEqual(calls, [['html', 'snowflake_manual', true]]);
});

test('missing document returns 404 while database failures return 503', async () => {
  const missing = transcriptRoute({ transcript: null });
  assert.equal((await missing.route.GET(request(), { params: Promise.resolve({ id: ['missing'] }) })).status, 404);
  const unavailable = transcriptRoute({ error: new Error('secret database connection details') });
  const response = await unavailable.route.GET(request(), { params: Promise.resolve({ id: ['present'] }) });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('retry-after'), '30');
  assert.doesNotMatch(await response.text(), /secret database/);
});

test('unknown nested route cannot be reinterpreted as a transcript ID', async () => {
  const { route, calls } = transcriptRoute();
  const response = await route.GET(request(), { params: Promise.resolve({ id: ['snowflake_manual', 'anything', 'html'] }) });
  assert.equal(response.status, 404);
  assert.deepEqual(calls, []);
});
