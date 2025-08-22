const { createStatsigWebpackBundle } = require('./statsig-webpack-bundler');

module.exports = createStatsigWebpackBundle({
  bundleFile: 'js-on-device-eval-client',
  maxByteSize: 64_000,
  dependencies: [
    '@statsig/client-core',
    '@statsig/js-on-device-eval-client',
    '@statsig/on-device-eval-core',
    '@statsig/sha256',
  ],
  client: 'js-on-device-eval-client',
});
