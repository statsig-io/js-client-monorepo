const path = require('path');
const { version } = require('../../package.json');
const fs = require('fs');

const filepath = path.resolve(
  __dirname,
  '../../packages/core/src/StatsigMetadataCore.ts',
);

const content = fs.readFileSync(filepath).toString();

const updated = content.replace(
  /const SDK_VERSION = '.*';/,
  `const SDK_VERSION = '${version}';`,
);

fs.writeFileSync(filepath, updated);
