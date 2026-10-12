const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

const ID = '123456789012345678_aa1023abcdef';
const element = (type, props) => ({ type, props });

function pageFixture({ document, error, channelError } = {}) {
  const calls = [];
  const transcript = document === undefined ? {
    _id: ID, schema_version: 2, storage: 'gridfs', html_file_id: {},
  } : document;
  const page = loadTypeScript('src/app/[id]/page.tsx', {
    'react/jsx-runtime': { jsx: element, jsxs: element },
    'next/navigation': {
      notFound() { throw new Error('NEXT_NOT_FOUND'); },
      redirect(location) { throw Object.assign(new Error('NEXT_REDIRECT'), { location }); },
    },
    '@/components/channel-header': { ChannelHeader: 'LegacyChannelHeader' },
    '@/components/message-list': { MessageList: 'LegacyMessageList' },
    '@/components/message-input': { MessageInput: 'LegacyMessageInput' },
    '@/lib/transcripts': {
      async getTranscript(id) {
        calls.push(['document', id]);
        if (error) throw error;
        return transcript;
      },
      isHtmlTranscript(value) { return value?.schema_version === 2 && value.storage === 'gridfs'; },
      async getLegacyChannels() {
        calls.push(['channels']);
        if (channelError) throw channelError;
        return [{ _id: 'old-channel', name: 'support' }];
      },
    },
  });
  const render = (id = ID, search = {}) => page.default({
    params: Promise.resolve({ id }), searchParams: Promise.resolve(search),
  });
  return { render, calls };
}

function descendants(node) {
  if (node == null) return [];
  if (Array.isArray(node)) return node.flatMap(descendants);
  if (typeof node !== 'object') return [node];
  if (typeof node.type === 'function') return descendants(node.type(node.props));
  return [node, ...descendants(node.props?.children)];
}

function pageText(node) {
  return descendants(node).filter((item) => typeof item === 'string').join(' ');
}

test('new HTML documents use the existing domain and an isolated full-height iframe', async () => {
  const { render, calls } = pageFixture();
  const output = await render();
  assert.equal(output.type, 'iframe');
  assert.equal(output.props.src, `/api/transcripts/${ID}/html`);
  assert.ok(output.props.sandbox.split(' ').includes('allow-scripts'));
  assert.ok(output.props.sandbox.split(' ').includes('allow-downloads'));
  assert.ok(!output.props.sandbox.split(' ').includes('allow-same-origin'));
  assert.equal(output.props.referrerPolicy, 'no-referrer');
  assert.equal(output.props.style.height, '100dvh');
  assert.deepEqual(calls, [['document', ID]]);
});

test('download query redirects to the raw HTML attachment endpoint', async () => {
  const { render } = pageFixture();
  await assert.rejects(render(ID, { download: '1' }), (error) => {
    assert.equal(error.message, 'NEXT_REDIRECT');
    assert.equal(error.location, `/api/transcripts/${ID}/html?download=1`);
    return true;
  });
});

test('missing transcript invokes the real page not-found behavior', async () => {
  const { render } = pageFixture({ document: null });
  await assert.rejects(render(), /NEXT_NOT_FOUND/);
});

test('database outage produces a retry message without exposing connection details', async () => {
  const { render } = pageFixture({ error: new Error('secret mongodb connection details') });
  const text = pageText(await render());
  assert.match(text, /temporarily unavailable/i);
  assert.doesNotMatch(text, /secret|mongodb/i);
});

test('legacy JSON renders existing messages and tolerates unavailable optional channel lookup', async () => {
  const document = {
    _id: 'legacy', channel: { _id: '123', name: 'ticket-support' },
    users: [{ _id: '42', username: 'Owner' }],
    messages: [{ _id: 'message-1', author: '42', content: 'Original message', timestamp: '2024-01-01T12:00:00Z' }],
  };
  const { render, calls } = pageFixture({ document, channelError: new Error('optional channel lookup offline') });
  const output = await render('legacy');
  const list = descendants(output).find((node) => node?.type === 'LegacyMessageList');
  assert.ok(list);
  assert.equal(list.props.messages[0].content, 'Original message');
  assert.ok(list.props.messages[0].timestamp instanceof Date);
  assert.deepEqual(list.props.users, document.users);
  assert.deepEqual(list.props.channels, []);
  assert.deepEqual(calls, [['document', 'legacy'], ['channels']]);
});

test('unsupported partial documents display an explanation instead of crashing', async () => {
  const { render } = pageFixture({ document: { _id: 'partial', messages: null, users: null } });
  assert.match(pageText(await render('partial')), /supported export/i);
});
