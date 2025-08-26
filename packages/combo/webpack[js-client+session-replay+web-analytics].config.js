const { createStatsigWebpackBundle } = require('./statsig-webpack-bundler');
const WebVitalsConcatPlugin = require('./WebVitalsConcatPlugin');

const BUNDLE_FILE_NAME = 'js-client+session-replay+web-analytics';

module.exports = createStatsigWebpackBundle({
  bundleFile: BUNDLE_FILE_NAME,
  maxByteSize: 300_000,
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
  ],
});
