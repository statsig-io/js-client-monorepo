const { execSync } = require('child_process');

execSync(
  [
    'cp',
    './dist/packages/js-client/build/statsig-js-client.min.js',
    './samples/web-minified/src/assets/statsig-js-client.min.js',
  ].join(' '),
);

console.log('statsig-js-client.min.js copied');

execSync(
  [
    'cp',
    './dist/packages/js-on-device-eval-client/build/statsig-js-on-device-eval-client.min.js',
    './samples/web-minified/src/assets/statsig-js-on-device-eval-client.min.js',
  ].join(' '),
);

console.log('statsig-js-on-device-eval-client.min.js copied');
