const { composePlugins, withNx, withWeb } = require('@nx/webpack');
const path = require('path');

module.exports = composePlugins(withNx(), withWeb(), () =>
  // config
  {
    return {
      // Uncomment if you want to use webpack-bundle-analyzer
      // plugins: config.plugins.filter(
      //   (x) => x.constructor.name === 'StatsJsonPlugin',
      // ),
      entry: ['./dist/packages/precomputed-evaluations/src/index.js'],
      mode: 'production',
      target: 'web',
      resolve: {
        alias: {
          '@sigstat/core': path.resolve(__dirname, '../../dist/packages/core'),
        },
        extensions: ['.js'],
      },
      externals: ['@react-native-async-storage/async-storage'],
      output: {
        filename: 'precomputed-evaluations.min.js',
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
          '../../dist/packages/precomputed-evaluations/build',
        ),
        libraryExport: 'default',
        globalObject: 'this',
      },
    };
  },
);
