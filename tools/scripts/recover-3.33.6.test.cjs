const assert = require('node:assert/strict');
const test = require('node:test');
const {
  SOURCE,
  validateRequest,
  validateIdentity,
  isNewer,
  checkRegistry,
} = require('./recover-3.33.6.cjs');

const request = {
  GITHUB_EVENT_NAME: 'workflow_dispatch',
  GITHUB_REPOSITORY: 'statsig-io/js-client-monorepo',
  GITHUB_REF: 'refs/heads/main',
  RECOVERY_TAG: '3.33.6',
};

test('only the intended public-main manual request is accepted', () => {
  validateRequest(request);
  for (const [key, value] of [
    ['GITHUB_EVENT_NAME', 'release'],
    ['GITHUB_REPOSITORY', 'statsig-io/not-the-public-repo'],
    ['GITHUB_REPOSITORY', 'someone/fork'],
    ['GITHUB_REF', 'refs/heads/other'],
    ['RECOVERY_TAG', '3.33.7'],
    ['RECOVERY_TAG', '3.33.6; echo injected'],
    ['RECOVERY_TAG', undefined],
  ]) {
    assert.throws(() => validateRequest({ ...request, [key]: value }));
  }
});

test('source SHA, peeled tag and version must match', () => {
  validateIdentity(SOURCE, SOURCE, '3.33.6');
  assert.throws(() => validateIdentity('wrong', SOURCE, '3.33.6'));
  assert.throws(() => validateIdentity(SOURCE, 'moved', '3.33.6'));
  assert.throws(() => validateIdentity(SOURCE, SOURCE, '3.33.7'));
});

test('latest cannot be downgraded', () => {
  for (const version of ['3.33.5', '3.33.6', '3.9.99', '2.99.99'])
    assert.equal(isNewer(version), false);
  for (const version of ['3.33.7', '3.34.0', '4.0.0'])
    assert.equal(isNewer(version), true);
  assert.throws(() => isNewer('unexpected'));
});

const response = (status, body) => ({ status, json: async () => body });
test('preflight checks each package and never treats a network error as absence', async () => {
  const calls = [];
  await checkRegistry(['@statsig/a', '@statsig/b'], false, async (url) => {
    calls.push(url);
    return url.endsWith('/latest')
      ? response(200, { version: '3.33.5' })
      : response(404);
  });
  assert.equal(calls.length, 4);
  assert.ok(calls[0].includes('%40statsig%2Fa/3.33.6'));
  for (const status of [200, 401, 403, 429, 500]) {
    await assert.rejects(
      checkRegistry(['@statsig/a'], false, async () => response(status)),
    );
  }
  await assert.rejects(
    checkRegistry(['@statsig/a'], false, async () => {
      throw new Error('timeout');
    }),
  );
});

test('partial publication aborts before proceeding to another package', async () => {
  const calls = [];
  await assert.rejects(
    checkRegistry(
      ['@statsig/a', '@statsig/b', '@statsig/c'],
      false,
      async (url) => {
        calls.push(url);
        if (url.endsWith('/latest'))
          return response(200, { version: '3.33.5' });
        return response(url.includes('%2Fb/') ? 200 : 404);
      },
    ),
  );
  assert.equal(calls.length, 3);
});

test('preflight fails closed if latest is unavailable or newer', async () => {
  for (const latest of [response(503), response(200, { version: '3.33.7' })]) {
    await assert.rejects(
      checkRegistry(['@statsig/a'], false, async (url) =>
        url.endsWith('/latest') ? latest : response(404),
      ),
    );
  }
});

test('postflight requires exact readable package identities', async () => {
  await checkRegistry(['@statsig/a'], true, async () =>
    response(200, { name: '@statsig/a', version: '3.33.6' }),
  );
  for (const bad of [
    response(404),
    response(200, { name: '@statsig/a', version: '3.33.5' }),
    response(200, { name: '@statsig/b', version: '3.33.6' }),
  ]) {
    await assert.rejects(checkRegistry(['@statsig/a'], true, async () => bad));
  }
});
