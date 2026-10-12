const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { setImmediate: nextTurn } = require('node:timers/promises');
const { loadTypeScript } = require('./load-typescript.cjs');

const TRANSCRIPT_ID = '123456789012345678_aa1023abcdef';
const HTML_FILE_ID = '0123456789abcdef01234567';
const ASSET_FILE_ID = 'abcdef0123456789abcdef01';

class FakeObjectId {
  constructor(value = HTML_FILE_ID) {
    if (!/^[a-f0-9]{24}$/i.test(value)) throw new Error('Invalid ObjectId');
    this.value = value;
  }
  toString() { return this.value; }
  toHexString() { return this.value; }
}

function fixture({ document, html, asset, databaseError } = {}) {
  const originalHtml = html || Buffer.from('<!-- exporter -->\n<!DOCTYPE html><html><body>café こんにちは 🐱</body></html>', 'utf8');
  const transcript = document === undefined ? {
    _id: TRANSCRIPT_ID, transcript_id: TRANSCRIPT_ID,
    schema_version: 2, storage: 'gridfs', exporter: 'DiscordChatExporterPy',
    html_file_id: new FakeObjectId(HTML_FILE_ID), html_size_bytes: originalHtml.length,
    channel: { _id: '123456789012345678', name: 'ticket-support' },
    message_count: 1001,
  } : document;
  const calls = { queries: [], bucketNames: [], streams: [], connections: 0 };
  const state = {
    transcript, databaseError,
    channels: [{ _id: '123', name: 'support' }],
    htmlFile: { _id: new FakeObjectId(HTML_FILE_ID), filename: `transcript-${TRANSCRIPT_ID}.html`, length: originalHtml.length },
    assetFile: asset === undefined ? {
      _id: new FakeObjectId(ASSET_FILE_ID), filename: 'support-proof.png', length: 7,
      metadata: { content_type: 'image/png' },
    } : asset,
    htmlContent: originalHtml, assetContent: Buffer.from('PNGDATA'),
    streamFactory: null,
  };
  const database = {
    collection(name) {
      if (name === 'transcripts') return {
        async findOne(query) {
          calls.queries.push(query);
          if (state.databaseError) throw state.databaseError;
          return state.transcript;
        },
      };
      if (name === 'channels') return {
        find() { return { async toArray() { return state.channels; } }; },
      };
      throw new Error(`Unexpected collection ${name}`);
    },
  };
  class FakeGridFSBucket {
    constructor(db, options) {
      assert.equal(db, database);
      this.name = options.bucketName;
      calls.bucketNames.push(this.name);
    }
    find(query) {
      assert.ok(query._id instanceof FakeObjectId);
      return { next: async () => this.name === 'transcript_html' ? state.htmlFile : state.assetFile };
    }
    openDownloadStream(id) {
      assert.ok(id instanceof FakeObjectId);
      let stream;
      if (state.streamFactory) stream = state.streamFactory(this.name);
      else {
        const bytes = this.name === 'transcript_html' ? state.htmlContent : state.assetContent;
        // Split within a Unicode code point to expose per-chunk decoding bugs.
        const boundary = Math.max(1, bytes.indexOf(Buffer.from('🐱')) + 1);
        stream = Readable.from([bytes.subarray(0, boundary), bytes.subarray(boundary)]);
      }
      calls.streams.push(stream);
      return stream;
    }
  }
  const mongoose = {
    connection: { db: database },
    mongo: { GridFSBucket: FakeGridFSBucket, ObjectId: FakeObjectId },
  };
  const api = loadTypeScript('src/lib/transcripts.ts', {
    mongoose,
    '@/lib/mongodb': { async dbConnect() {
      calls.connections++;
      if (state.databaseError) throw state.databaseError;
      return mongoose;
    } },
  });
  return { api, state, calls, originalHtml };
}

test('Mongo queries keep snowflake/manual IDs as exact strings', async () => {
  const { api, calls, state } = fixture();
  const actual = await api.getTranscript(TRANSCRIPT_ID);
  assert.equal(actual, state.transcript);
  assert.deepEqual(calls.queries, [{ _id: TRANSCRIPT_ID }]);
});

test('format detection distinguishes archived HTML from legacy and missing documents', () => {
  const { api, state } = fixture();
  assert.equal(api.isHtmlTranscript(state.transcript), true);
  assert.equal(api.isHtmlTranscript(null), false);
  assert.equal(api.isHtmlTranscript({ _id: 'legacy', messages: [], users: [] }), false);
  assert.equal(api.isHtmlTranscript({ ...state.transcript, html_file_id: HTML_FILE_ID }), false);
});

test('HTML response preserves exact UTF-8 bytes across split GridFS chunks', async () => {
  const { api, originalHtml, calls } = fixture();
  const response = await api.getHtmlResponse(TRANSCRIPT_ID);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^text\/html;\s*charset=utf-8$/i);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const sandbox = response.headers.get('content-security-policy');
  assert.match(sandbox, /\bsandbox\b/);
  assert.match(sandbox, /\ballow-scripts\b/);
  assert.match(sandbox, /\ballow-downloads\b/);
  assert.doesNotMatch(sandbox, /\ballow-same-origin\b/);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), originalHtml);
  assert.deepEqual(calls.bucketNames, ['transcript_html']);
});

test('HTML download uses a safe attachment filename', async () => {
  const { api } = fixture();
  const response = await api.getHtmlResponse(TRANSCRIPT_ID, true);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-disposition'), /^attachment;/i);
  assert.match(response.headers.get('content-disposition'), /transcript-/);
  assert.match(response.headers.get('content-security-policy'), /\bsandbox\b/);
  assert.doesNotMatch(response.headers.get('content-security-policy'), /\ballow-same-origin\b/);
  await response.arrayBuffer();
});

test('missing document and missing HTML blob return 404 without a stream', async () => {
  const missing = fixture({ document: null });
  assert.equal((await missing.api.getHtmlResponse('missing')).status, 404);
  assert.equal(missing.calls.streams.length, 0);
  const missingBlob = fixture();
  missingBlob.state.htmlFile = null;
  assert.equal((await missingBlob.api.getHtmlResponse(TRANSCRIPT_ID)).status, 404);
  assert.equal(missingBlob.calls.streams.length, 0);
});

test('legacy JSON stays available while HTML endpoint reports unsupported format', async () => {
  const legacyDocument = { _id: 'legacy-string-id', users: [{ _id: '42', username: 'Owner' }], messages: [] };
  const { api, calls } = fixture({ document: legacyDocument });
  assert.equal(await api.getTranscript('legacy-string-id'), legacyDocument);
  assert.equal((await api.getHtmlResponse('legacy-string-id')).status, 409);
  assert.equal(calls.streams.length, 0);
});

test('database outage produces 503 rather than missing-transcript response', async () => {
  const { api } = fixture({ databaseError: new Error('offline mongodb secret-uri') });
  await assert.rejects(api.getTranscript(TRANSCRIPT_ID));
  const response = await api.getHtmlResponse(TRANSCRIPT_ID);
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /secret-uri|mongodb/i);
});

test('legacy channel lookup uses the native channels collection', async () => {
  const { api, state } = fixture();
  assert.deepEqual(await api.getLegacyChannels(), state.channels);
});

test('safe image assets stream inline with correct MIME and exact bytes', async () => {
  const { api, calls, state } = fixture();
  const response = await api.getAssetResponse(ASSET_FILE_ID);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.doesNotMatch(response.headers.get('content-disposition') || '', /^attachment;/i);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), state.assetContent);
  assert.deepEqual(calls.bucketNames, ['transcript_assets']);
});

test('active attachments force download and cannot inject response headers', async () => {
  for (const contentType of ['text/html', 'image/svg+xml', 'application/javascript']) {
    const { api } = fixture({ asset: {
      _id: new FakeObjectId(ASSET_FILE_ID),
      filename: 'evil"\r\nX-Injected: yes.html', length: 7,
      metadata: { content_type: contentType },
    } });
    const response = await api.getAssetResponse(ASSET_FILE_ID);
    assert.equal(response.status, 200);
    const disposition = response.headers.get('content-disposition');
    assert.match(disposition, /^attachment;/i);
    assert.doesNotMatch(disposition, /[\r\n]/);
    assert.equal(response.headers.get('x-injected'), null);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    await response.arrayBuffer();
  }
});

test('requested media download sets an attachment disposition', async () => {
  const { api } = fixture();
  const response = await api.getAssetResponse(ASSET_FILE_ID, true);
  assert.match(response.headers.get('content-disposition'), /^attachment;/i);
  await response.arrayBuffer();
});

test('invalid asset IDs do not open a database connection; missing assets return 404', async () => {
  const invalid = fixture();
  assert.equal((await invalid.api.getAssetResponse('../../private')).status, 404);
  assert.equal((await invalid.api.getAssetResponse('abcdefghijklmnopqrstuvwx')).status, 404);
  assert.equal(invalid.calls.connections, 0);
  const missing = fixture({ asset: null });
  assert.equal((await missing.api.getAssetResponse(ASSET_FILE_ID)).status, 404);
  assert.equal(missing.calls.streams.length, 0);
});

test('cancelling the browser response destroys its GridFS Node stream', async () => {
  const { api, state, calls } = fixture();
  state.streamFactory = () => new Readable({
    highWaterMark: 1,
    read() { this.push(Buffer.from('stream chunk')); },
  });
  const response = await api.getHtmlResponse(TRANSCRIPT_ID);
  const reader = response.body.getReader();
  await reader.read();
  await reader.cancel('browser closed transcript');
  await nextTurn();
  assert.equal(calls.streams[0].destroyed, true);
});

test('late GridFS errors fail the body read instead of delivering truncated HTML', async () => {
  const { api, state } = fixture();
  state.streamFactory = () => Readable.from((async function* () {
    yield Buffer.from('<!doctype html><html>');
    throw new Error('GridFS disconnected while reading');
  })());
  const response = await api.getHtmlResponse(TRANSCRIPT_ID);
  await assert.rejects(response.arrayBuffer(), /GridFS disconnected/);
});

module.exports = { fixture, FakeObjectId, TRANSCRIPT_ID, HTML_FILE_ID, ASSET_FILE_ID };
