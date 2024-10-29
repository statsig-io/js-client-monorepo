const { createStatsigWebpackBundle } = require('./statsig-webpack-bundler');

module.exports = createStatsigWebpackBundle({
  bundleFile: 'js-client+web-analytics',
  maxByteSize: 50_000,
  dependencies: [
    '@statsig/client-core',
    '@statsig/js-client',
    '@statsig/web-analytics',
  ],
  client: 'js-client',
});
