const { composePlugins, withNx, withWeb } = require('@nx/webpack');
const path = require('path');
const minifier = require('../../tools/scripts/webpack-minifier');

module.exports = composePlugins(withNx(), withWeb(), () =>
  // config
  {
    return {
      // Uncomment if you want to use webpack-bundle-analyzer
      // plugins: config.plugins.filter(
      //   (x) => x.constructor.name === 'StatsJsonPlugin',
      // ),
      stats: {
        assets: true,
        modules: false,
        colors: true,
      },
      entry: ['./dist/packages/web-analytics/src/index.js'],
      mode: 'production',
      target: 'web',
      resolve: {
        alias: {
          '@statsig/client-core': path.resolve(
            __dirname,
            '../../dist/packages/client-core',
          ),
          '@statsig/js-client': path.resolve(
            __dirname,
            '../../dist/packages/js-client',
          ),
        },
        extensions: ['.js'],
      },
      externals: [],
      output: {
        filename: 'statsig-web-analytics.min.js',
        library: {
          type: 'umd',
          name: {
            root: 'StatsigWebAnalytics',
            amd: 'StatsigWebAnalytics',
            commonjs: 'StatsigWebAnalytics',
          },
        },
        path: path.resolve(
          __dirname,
          '../../dist/packages/web-analytics/build',
        ),
        libraryExport: 'default',
        globalObject: 'this',
      },
      performance: {
        maxEntrypointSize: 50_000,
        hints: 'error',
      },
      optimization: {
        minimize: true,
        minimizer: [minifier],
      },
    };
  },
);
