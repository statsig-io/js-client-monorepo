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
      entry: ['./dist/packages/js-on-device-eval-client/src/index.js'],
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
        filename: 'statsig-js-on-device-eval-client.min.js',
        library: {
          type: 'umd',
          name: {
            root: 'StatsigOnDeviceEval',
            amd: 'StatsigOnDeviceEval',
            commonjs: 'StatsigOnDeviceEval',
          },
        },
        path: path.resolve(
          __dirname,
          '../../dist/packages/js-on-device-eval-client/build',
        ),
        libraryExport: 'default',
        globalObject: 'this',
      },
      performance: {
        maxEntrypointSize: 45000,
        hints: 'error',
      },
      optimization: {
        minimize: true,
        minimizer: [minifier],
      },
    };
  },
);
