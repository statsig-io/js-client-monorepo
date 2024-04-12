const { createStatsigWebpackBundle } = require('./statsig-webpack-bundler');

module.exports = createStatsigWebpackBundle({
  bundleFile: 'js-on-device-eval-client',
  maxByteSize: 48_000,
  dependencies: [
    '@statsig/client-core',
    '@statsig/js-on-device-eval-client',
    '@statsig/sha256',
  ],
  client: 'js-on-device-eval-client',
});
