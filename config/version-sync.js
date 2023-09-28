#!/usr/bin/env node

const mainVersion = require('../package.json').version;
const glob = require('glob');
const fs = require('fs');

const PACKAGES = [
  'dloomb-client-core',
  'dloomb-client-extensions',
  'dloomb-client-on-device-eval',
  'dloomb-client-react-native',
  'dloomb-client-react',
  'dloomb-client-remote-server-eval',
  'dloomb-client-sha256',
  'dloomb-client-test-helpers',
];

glob.sync('./packages/**/package.json').forEach((location) => {
  const content = fs.readFileSync(location);
  const updated = [
    // Top level version
    [/"version": ".*"/, `"version": "${mainVersion}"`],

    // Any sibling deps
    ...PACKAGES.map((package) => [
      new RegExp(`"${package}": ".*"`),
      `"${package}": "^${mainVersion}"`,
    ]),
  ].reduce((acc, [find, replace]) => {
    return acc.replace(find, replace);
  }, content.toString());

  fs.writeFileSync(location, updated);
});
