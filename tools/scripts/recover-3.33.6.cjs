// One-time, fail-closed guards. This script never publishes or changes Git refs.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync, readdirSync, existsSync } = require('node:fs');
const path = require('node:path');

const VERSION = '3.33.6';
const SOURCE = '1bc704832acba7cee3a8a775dd0b695adf9ed1c8';
const REPO = 'statsig-io/js-client-monorepo';

function validateRequest(env) {
  assert.equal(env.GITHUB_EVENT_NAME, 'workflow_dispatch');
  assert.equal(env.GITHUB_REPOSITORY, REPO);
  assert.equal(env.GITHUB_REF, 'refs/heads/main');
  assert.equal(env.RECOVERY_TAG, VERSION);
}

function validateIdentity(head, tag, version) {
  assert.equal(head, SOURCE, 'Checkout is not the reviewed release source');
  assert.equal(tag, SOURCE, 'Release tag was moved');
  assert.equal(version, VERSION, 'Unexpected release version');
}

function loadPackages(root) {
  const json = (file) =>
    JSON.parse(readFileSync(path.join(root, file), 'utf8'));
  const packages = [];
  for (const dir of readdirSync(path.join(root, 'packages'))) {
    const project = `packages/${dir}/project.json`;
    if (
      !existsSync(path.join(root, project)) ||
      !json(project).targets?.publish
    ) {
      continue;
    }
    const manifest = json(`packages/${dir}/package.json`);
    assert.notEqual(manifest.private, true, `Private publish target: ${dir}`);
    assert.equal(manifest.version, VERSION, `Wrong package version: ${dir}`);
    assert.match(manifest.name, /^@statsig\/[a-z0-9-]+$/);
    packages.push(manifest.name);
  }
  assert.equal(packages.length, 23, 'Unexpected publish-target set');
  assert.equal(new Set(packages).size, 23, 'Duplicate publish target');
  return packages.sort();
}

function verifySource(root) {
  const git = (...args) =>
    execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
  const manifest = JSON.parse(readFileSync(path.join(root, 'package.json')));
  validateIdentity(
    git('rev-parse', 'HEAD'),
    git('rev-parse', 'refs/tags/3.33.6^{commit}'),
    manifest.version,
  );
  assert.equal(
    git('status', '--porcelain', '--untracked-files=no'),
    '',
    'Tracked release source changed',
  );
  const metadata = readFileSync(
    path.join(root, 'packages/client-core/src/StatsigMetadata.ts'),
    'utf8',
  );
  assert.ok(metadata.includes("export const SDK_VERSION = '3.33.6';"));
  return loadPackages(root);
}

function isNewer(version) {
  assert.match(version, /^\d+\.\d+\.\d+$/, 'Unexpected latest version');
  const left = version.split('.').map(Number);
  const right = VERSION.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] > right[i];
  }
  return false;
}

async function checkRegistry(packages, published = false, fetcher = fetch) {
  for (const name of packages) {
    const base = `https://registry.npmjs.org/${encodeURIComponent(name)}`;
    const response = await fetcher(`${base}/${VERSION}`, {
      signal: AbortSignal.timeout(15000),
      redirect: 'error',
    });
    assert.equal(
      response.status,
      published ? 200 : 404,
      `${name}@${VERSION}: expected ${
        published ? 'published' : 'absent'
      }, got HTTP ${response.status}; stop and inspect partial publication`,
    );
    if (published) {
      const manifest = await response.json();
      assert.equal(manifest.name, name);
      assert.equal(manifest.version, VERSION);
    } else {
      const latest = await fetcher(`${base}/latest`, {
        signal: AbortSignal.timeout(15000),
        redirect: 'error',
      });
      assert.equal(
        latest.status,
        200,
        `Cannot verify current latest for ${name}`,
      );
      assert.equal(
        isNewer((await latest.json()).version),
        false,
        `Refusing latest downgrade for ${name}`,
      );
    }
    console.log(`${name}@${VERSION}: ${published ? 'published' : 'absent'}`);
  }
}

module.exports = {
  VERSION,
  SOURCE,
  validateRequest,
  validateIdentity,
  loadPackages,
  verifySource,
  isNewer,
  checkRegistry,
};

if (require.main === module) {
  (async () => {
    validateRequest(process.env);
    const mode = process.argv[2];
    assert.ok(['request', 'preflight', 'published'].includes(mode));
    if (mode === 'request') return;
    const packages = verifySource(path.resolve(process.argv[3]));
    await checkRegistry(packages, mode === 'published');
  })().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
