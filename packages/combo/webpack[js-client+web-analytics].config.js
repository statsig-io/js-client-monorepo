const { createStatsigWebpackBundle } = require('./statsig-webpack-bundler');
const WebVitalsConcatPlugin = require('./WebVitalsConcatPlugin');

module.exports = createStatsigWebpackBundle({
  bundleFile: 'js-client+web-analytics',
  maxByteSize: 95_000,
  dependencies: [
    '@statsig/client-core',
    '@statsig/js-client',
    '@statsig/web-analytics',
  ],
  plugins: [
    new WebVitalsConcatPlugin({
      bundleFileName: 'js-client+web-analytics',
    }),
  ],
  client: 'js-client',
});
