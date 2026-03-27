const { createStatsigWebpackBundle } = require('./statsig-webpack-bundler');

module.exports = createStatsigWebpackBundle({
  bundleFile: 'js-client',
  maxByteSize: 69_150,
  dependencies: ['@statsig/client-core', '@statsig/js-client'],
  client: 'js-client',
});
