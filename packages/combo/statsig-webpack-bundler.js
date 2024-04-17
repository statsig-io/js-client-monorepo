const { composePlugins, withNx, withWeb } = require('@nx/webpack');
const path = require('path');
const minifier = require('../../tools/scripts/webpack-minifier');

const DEP_MAP = {
  '@statsig/client-core': '../../dist/packages/client-core',
  '@statsig/js-client': '../../dist/packages/js-client',
  '@statsig/js-on-device-eval-client':
    '../../dist/packages/js-on-device-eval-client',
  '@statsig/session-replay': '../../dist/packages/session-replay',
  '@statsig/sha256': '../../dist/packages/sha256',
  '@statsig/web-analytics': '../../dist/packages/web-analytics',
  '@rrweb/types': '../../packages/session-replay/node_modules/@rrweb/types',
};

/**
 * Creates a Statsig Webpack bundle with size optimizations.
 *
 * @param {Object} args - Configuration for bundle creation.
 * @param {string} args.bundleFile - The desired output path and filename for the bundle.
 * @param {number} args.maxByteSize - The maximum allowable size for the bundle in bytes.
 * @param {string[]} args.dependencies - An array of dependency names to include in the bundle, limited to 'foo', 'bar', and 'boo'.
 * @returns {Promise<string>} A promise resolving to the path of the generated bundle file if successful, or rejecting with an error if the process fails.
 */
function createStatsigWebpackBundle({
  bundleFile,
  maxByteSize,
  dependencies,
  client,
  externals,
  plugins,
}) {
  const alias = {};

  Object.values(dependencies ?? []).forEach((dep) => {
    if (!DEP_MAP[dep]) {
      throw 'No dependency mapping found for ' + dep;
    }

    alias[dep] = path.resolve(__dirname, DEP_MAP[dep]);
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return composePlugins(withNx(), withWeb(), (_config) => {
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
      entry: `./dist/packages/combo/src/${bundleFile}.js`,
      mode: 'production',
      target: 'web',
      resolve: {
        alias,
        extensions: ['.js'],
      },
      externals,
      output: {
        filename: `statsig-${bundleFile}.min.js`,
        library: {
          type: 'umd',
          name: {
            root: 'Statsig',
            amd: 'Statsig',
            commonjs: 'Statsig',
          },
        },
        path: path.resolve(
          __dirname,
          '../../dist/packages/combo/build',
          client,
        ),
        libraryExport: 'default',
        globalObject: 'this',
      },
      performance: {
        maxEntrypointSize: maxByteSize,
        hints: 'error',
      },
      optimization: {
        minimize: true,
        minimizer: [minifier],
      },
      plugins,
    };
  });
}

module.exports = {
  createStatsigWebpackBundle,
};
