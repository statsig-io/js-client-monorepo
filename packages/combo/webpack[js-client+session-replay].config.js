const { createStatsigWebpackBundle } = require('./statsig-webpack-bundler');
const RRWebConcatPlugin = require('./RRWebConcatPlugin');

const BUNDLE_FILE_NAME = 'js-client+session-replay';

module.exports = createStatsigWebpackBundle({
  bundleFile: BUNDLE_FILE_NAME,
  maxByteSize: 240_000,
  dependencies: [
    '@statsig/client-core',
    '@statsig/js-client',
    '@statsig/session-replay',
  ],
  client: 'js-client',
  externals: {
    rrweb: 'rrwebRecord',
  },
  plugins: [
    new RRWebConcatPlugin({
      bundleFileName: BUNDLE_FILE_NAME,
    }),
  ],
});
