const { createStatsigWebpackBundle } = require('./statsig-webpack-bundler');
const WebVitalsConcatPlugin = require('./WebVitalsConcatPlugin');
const RRWebConcatPlugin = require('./RRWebConcatPlugin');

const BUNDLE_FILE_NAME = 'js-client+session-replay+web-analytics';

module.exports = createStatsigWebpackBundle({
  bundleFile: BUNDLE_FILE_NAME,
  maxByteSize: 290_000,
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
    new WebVitalsConcatPlugin({
      bundleFileName: BUNDLE_FILE_NAME,
    }),
    new RRWebConcatPlugin({
      bundleFileName: BUNDLE_FILE_NAME,
    }),
  ],
});
