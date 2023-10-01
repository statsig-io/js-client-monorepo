const { composePlugins, withNx, withWeb } = require('@nx/webpack');
const path = require('path');

module.exports = composePlugins(withNx(), withWeb(), (_config) => {
  return {
    entry: ['./dist/packages/precomputed-evaluations/src/index.js'],
    mode: 'production',
    target: 'web',
    resolve: {
      alias: {
        '@sigstat/core': path.resolve(__dirname, '../../dist/packages/core'),
      },
      extensions: [
        // '.tsx', '.ts',
        '.js',
      ],
    },
    stats: true,
    output: {
      filename: 'statsig-prod-web-sdk.js',
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
});
