const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

const ENV_NAMES = ['MONGODB_URI', 'MONGO_URI', 'MONGODB_DB_NAME', 'MONGO_DB_NAME'];

function connectionFixture(t, environment = {}, connect) {
  const previousEnvironment = ENV_NAMES.map((key) => [key, process.env[key]]);
  const previousCache = globalThis.transcriptMongoCache;
  for (const key of ENV_NAMES) delete process.env[key];
  Object.assign(process.env, environment);
  delete globalThis.transcriptMongoCache;
  t.after(() => {
    for (const [key, value] of previousEnvironment) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    if (previousCache === undefined) delete globalThis.transcriptMongoCache;
    else globalThis.transcriptMongoCache = previousCache;
  });
  const calls = [];
  const connection = { connection: { readyState: 1, db: {} } };
  const mongoose = { connect: async (uri, options) => {
    calls.push({ uri, options });
    return connect ? connect(calls.length, connection) : connection;
  } };
  const api = loadTypeScript('src/lib/mongodb.ts', { mongoose });
  return { api, calls, connection };
}

test('database module can import without credentials and reports configuration at request time', async (t) => {
  const { api, calls } = connectionFixture(t);
  await assert.rejects(api.dbConnect(), /not configured/);
  assert.deepEqual(calls, []);
});

test('bot-compatible Mongo aliases select the same database and reuse a live connection', async (t) => {
  const { api, calls, connection } = connectionFixture(t, {
    MONGO_URI: 'mongodb://unit-test.invalid', MONGO_DB_NAME: 'ticket-data',
  });
  assert.equal(await api.dbConnect(), connection);
  assert.equal(await api.dbConnect(), connection);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].uri, 'mongodb://unit-test.invalid');
  assert.equal(calls[0].options.dbName, 'ticket-data');
  assert.equal(calls[0].options.bufferCommands, false);
});

test('viewer-specific configuration takes priority and database defaults to test', async (t) => {
  const { api, calls } = connectionFixture(t, {
    MONGODB_URI: 'mongodb://viewer.invalid', MONGO_URI: 'mongodb://bot.invalid',
  });
  await api.dbConnect();
  assert.equal(calls[0].uri, 'mongodb://viewer.invalid');
  assert.equal(calls[0].options.dbName, 'test');
});

test('failed connection can retry, and a disconnected cached connection is replaced', async (t) => {
  const { api, calls, connection } = connectionFixture(t,
    { MONGODB_URI: 'mongodb://unit-test.invalid' },
    async (attempt, value) => {
      if (attempt === 1) throw new Error('temporary network outage');
      return value;
    },
  );
  await assert.rejects(api.dbConnect(), /temporary network outage/);
  assert.equal(await api.dbConnect(), connection);
  assert.equal(calls.length, 2);
  connection.connection.readyState = 0;
  await api.dbConnect();
  assert.equal(calls.length, 3);
});

test('simultaneous requests share one pending database connection', async (t) => {
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const { api, calls, connection } = connectionFixture(t,
    { MONGODB_URI: 'mongodb://unit-test.invalid' },
    async () => { await pending; return connection; },
  );
  const first = api.dbConnect();
  const second = api.dbConnect();
  assert.equal(calls.length, 1);
  release();
  assert.deepEqual(await Promise.all([first, second]), [connection, connection]);
});
