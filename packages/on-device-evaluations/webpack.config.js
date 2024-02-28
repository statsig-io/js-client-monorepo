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
      entry: ['./dist/packages/on-device-evaluations/src/index.js'],
      mode: 'production',
      target: 'web',
      resolve: {
        alias: {
          '@statsig/client-core': path.resolve(
            __dirname,
            '../../dist/packages/client-core',
          ),
          '@statsig/sha256': path.resolve(
            __dirname,
            '../../dist/packages/sha256',
          ),
        },
        extensions: ['.js'],
      },
      externals: [],
      output: {
        filename: 'on-device-evaluations.min.js',
        library: {
          type: 'umd',
          name: {
            root: 'statsig',
            amd: 'statsig',
            commonjs: 'statsig',
          },
        },
        path: path.resolve(
          __dirname,
          '../../dist/packages/on-device-evaluations/build',
        ),
        libraryExport: 'default',
        globalObject: 'this',
      },
      performance: {
        maxEntrypointSize: 60000,
        hints: 'error',
      },
      optimization: {
        minimize: true,
        minimizer: [minifier],
      },
    };
  },
);
