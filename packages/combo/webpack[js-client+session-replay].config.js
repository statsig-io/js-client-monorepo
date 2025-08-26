const { createStatsigWebpackBundle } = require('./statsig-webpack-bundler');

const BUNDLE_FILE_NAME = 'js-client+session-replay';

module.exports = createStatsigWebpackBundle({
  bundleFile: BUNDLE_FILE_NAME,
  maxByteSize: 270_000,
  dependencies: [
    '@statsig/client-core',
    '@statsig/js-client',
    '@statsig/session-replay',
  ],
  client: 'js-client',
  externals: {
    rrweb: 'rrwebRecord',
  },
  plugins: [],
});
