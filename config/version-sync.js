#!/usr/bin/env node

const mainVersion = require('../package.json').version;
const glob = require('glob');
const fs = require('fs');

glob.sync('./packages/**/package.json').forEach((location) => {
  const content = fs.readFileSync(location);
  const updated = content
    .toString()
    .replace(/"version": ".*"/, `"version": "${mainVersion}"`);

  console.log('Version', location, updated);
  fs.writeFileSync(location, updated);
});
