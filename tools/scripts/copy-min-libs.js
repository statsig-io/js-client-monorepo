const { execSync } = require('child_process');

// js-client

execSync(
  [
    'cp',
    './dist/packages/js-client/build/statsig-js-client.min.js',
    './samples/web-minified/src/assets/statsig-js-client.min.js',
  ].join(' '),
);

console.log('statsig-js-client.min.js copied');

// js-on-device-eval-client

execSync(
  [
    'cp',
    './dist/packages/js-on-device-eval-client/build/statsig-js-on-device-eval-client.min.js',
    './samples/web-minified/src/assets/statsig-js-on-device-eval-client.min.js',
  ].join(' '),
);

console.log('statsig-js-on-device-eval-client.min.js copied');

// web-analytics

execSync(
  [
    'cp',
    './dist/packages/web-analytics/build/statsig-web-analytics.min.js',
    './samples/web-minified/src/assets/statsig-web-analytics.min.js',
  ].join(' '),
);

console.log('statsig-web-analytics.min.js copied');
