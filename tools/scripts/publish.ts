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

if (!existsSync(`${root}/.npmrc`)) {
  // put a .npmrc file in the root sdk directory
  // should look like: //registry.npmjs.org/:_authToken=npm_YOUR_TOKEN_TO_PUBLISH
  throw new Error(`.npmrc file not found it root directory`);
}

if (!existsSync(configPath)) {
  throw new Error(`Failed to find package.json at ${configPath}`);
}

const isBeta = false;

const publish = [
  `npm publish`,
  `--registry=https://registry.npmjs.org/`,
  `--userconfig=${root}/.npmrc`,
  `--access public`,
  isBeta ? `--tag beta` : '',
];

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
