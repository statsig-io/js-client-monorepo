const path = require('path');
const { version } = require('../../package.json');
const fs = require('fs');
const { execSync } = require('child_process');

function sync(subpath) {
  const filepath = path.resolve(__dirname, '../../', subpath);

  let content = fs.readFileSync(filepath).toString();

  const regex = /("@statsig\/(?!statsig-node-core)[^":]+":\s*")([^"]+)(")/g;

  content = content.replace(regex, `$1${version}$3`);

  fs.writeFileSync(filepath, content);
}

const files = execSync(
  'find packages -type f -name "package.json" ! -path "*/node_modules/*"',
)
  .toString()
  .trim()
  .split('\n');
files.forEach((subpath) => sync(subpath));
