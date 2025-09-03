const { composePlugins, withNx, withWeb } = require('@nx/webpack');
const path = require('path');

module.exports = composePlugins(withNx(), withWeb(), () => {
  return {
    entry: path.resolve(__dirname, 'src/index.js'),
    mode: 'production',
    target: 'web',
    context: __dirname,
    experiments: {
      outputModule: false,
    },
    output: {
      filename: 'sidecar.min.js',
      path: path.resolve(__dirname, '../../dist/packages/sidecar'),
      library: {
        type: 'umd',
        name: 'StatsigSidecar',
      },
      globalObject: 'this',
    },
    resolve: {
      extensions: ['.js'],
      alias: {
        '@statsig/client-core': path.resolve(
          __dirname,
          '../../dist/packages/client-core',
        ),
        '@statsig/js-client': path.resolve(
          __dirname,
          '../../dist/packages/js-client',
        ),
        '@statsig/js-local-overrides': path.resolve(
          __dirname,
          '../../dist/packages/js-local-overrides',
        ),
        '@statsig/web-analytics': path.resolve(
          __dirname,
          '../../dist/packages/web-analytics',
        ),
        'web-vitals': path.resolve(
          __dirname,
          '../../node_modules/.pnpm/web-vitals@5.0.3/node_modules/web-vitals',
        ),
      },
      modules: [
        'node_modules',
        path.resolve(__dirname, '../../node_modules'),
        path.resolve(__dirname, 'node_modules'),
      ],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          include: path.resolve(__dirname, 'src'),
          type: 'javascript/esm',
        },
      ],
    },
    optimization: {
      minimize: true,
    },
  };
});
