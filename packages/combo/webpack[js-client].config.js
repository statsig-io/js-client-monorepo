const { createStatsigWebpackBundle } = require('./statsig-webpack-bundler');

module.exports = createStatsigWebpackBundle({
  bundleFile: 'js-client',
  maxByteSize: 45_000,
  dependencies: ['@statsig/client-core', '@statsig/js-client'],
  client: 'js-client',
});
