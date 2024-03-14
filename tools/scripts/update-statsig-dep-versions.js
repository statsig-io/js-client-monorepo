const path = require('path');
const { version } = require('../../package.json');
const fs = require('fs');
const { execSync } = require('child_process');

function sync(subpath) {
  const filepath = path.resolve(__dirname, '../../', subpath);

  let content = fs.readFileSync(filepath).toString();

  const regexes = [
    '@statsig/client-core',
    '@statsig/sha256',
    '@statsig/react-bindings',
    '@statsig/js-client',
    '@statsig/js-on-device-eval-client',
  ].map((mod) => new RegExp(`(${mod}": ")([^"]*)`));

  regexes.forEach((regex) => {
    content = content.replace(regex, `$1${version}`);
  });

  fs.writeFileSync(filepath, content);
}

const files = execSync(
  'find packages -type f -name "package.json" ! -path "*/node_modules/*"',
)
  .toString()
  .trim()
  .split('\n');
files.forEach((subpath) => sync(subpath));
