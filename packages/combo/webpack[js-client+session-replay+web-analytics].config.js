const { createStatsigWebpackBundle } = require('./statsig-webpack-bundler');

module.exports = createStatsigWebpackBundle({
  bundleFile: 'js-client+session-replay+web-analytics',
  maxByteSize: 300_000,
  dependencies: [
    '@statsig/client-core',
    '@statsig/js-client',
    '@statsig/web-analytics',
    '@statsig/session-replay',
    'rrweb',
  ],
});
