#!/usr/bin/env node

const fs = require('fs');

const FILE_LIMIT_MAP = {
  'statsig-js-local-eval.min.js': 20_000,
  'statsig-js-remote-eval.min.js': 10_000,
  'statsig-react.min.js': 5_000,
  'statsig-sha256.min.js': 5_000,
};

function runSizeCheck(file, size) {
  const stats = fs.statSync(`dist/${file}`);

  if (stats.size > size) {
    console.error(
      `[${file}] Build as grown larger than limit. Limit ${size} bytes, Actual: ${stats.size} bytes`,
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
  throw new Error('Size Check Failed');
}
