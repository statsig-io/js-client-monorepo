const { createStatsigWebpackBundle } = require('./statsig-webpack-bundler');
const RRWebConcatPlugin = require('./RRWebConcatPlugin');

const BUNDLE_FILE_NAME = 'js-client+session-replay+web-analytics';

module.exports = createStatsigWebpackBundle({
  bundleFile: BUNDLE_FILE_NAME,
  maxByteSize: 155_000,
  dependencies: [
    '@statsig/client-core',
    '@statsig/js-client',
    '@statsig/web-analytics',
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
