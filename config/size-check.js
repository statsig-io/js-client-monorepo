#!/usr/bin/env node

const fs = require('fs');
const resetColor = '\x1b[0m';
const redColor = '\x1b[31m';

const FILE_LIMIT_MAP = {
  'statsig-js-on-device-eval.min.js': 30_000,
  'statsig-js-remote-server-eval.min.js': 20_000,
  'statsig-js-extensions.min.js': 20_000,
  'statsig-react.min.js': 20_000,
  'statsig-react-native.min.js': 30_000,
  'statsig-sha256.min.js': 6_000,
};

function runSizeCheck(file, size) {
  const stats = fs.statSync(`dist/${file}`);

  if (stats.size > size) {
    console.error(
      `${redColor}[${file}] Build as grown larger than limit. Limit ${size} bytes, Actual: ${stats.size} bytes${resetColor}`,
    );
    return false;
  }

  console.log(`[${file}] Build size (${stats.size} bytes)`);
  return true;
}

const pass = Object.entries(FILE_LIMIT_MAP).reduce(
  (acc, [file, size]) => runSizeCheck(file, size) && acc,
  true,
);

if (!pass) {
  console.error(`${redColor}⛔️ Size Check Failed${resetColor}`);
  process.exit(1);
}
