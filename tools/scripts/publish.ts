import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const [, , packageName] = process.argv;

if (typeof packageName !== 'string') {
  throw new Error(`Invalid package name: ${packageName}`);
}

const root = path.resolve(__dirname, '../../');
const dir = `${root}/dist/packages/${packageName}`;
const configPath = `${dir}/package.json`;

const hasRcFile = existsSync(`${root}/.npmrc`);

if (!existsSync(configPath)) {
  throw new Error(`Failed to find package.json at ${configPath}`);
}

const isBeta = false;

const publish = [
  `npm publish`,
  `--registry=https://registry.npmjs.org/`,
  hasRcFile ? `--userconfig=${root}/.npmrc` : '',
  `--access public`,
  isBeta ? `--tag beta` : '',
].filter(Boolean);

// If you need to promote a version to latest
// const promote = [
//   'npm dist-tag add',
//   `@statsig/${packageName}@${VERSION} latest`,
//   `--registry=https://registry.npmjs.org/`,
//   `--userconfig=${root}/.npmrc`,
// ];

// If you need to remove the beta tag from a version
// const rmBeta = [
//   'npm dist-tag rm',
//   `@statsig/${packageName}@${VERSION} beta`,
//   `--registry=https://registry.npmjs.org/`,
//   `--userconfig=${root}/.npmrc`,
// ];

const command = publish.join(' ');

try {
  execSync(command, { cwd: dir });
} catch {
  throw new Error(`Failed to publish ${packageName}`);
}
