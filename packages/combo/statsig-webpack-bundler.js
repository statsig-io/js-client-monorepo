const { composePlugins, withNx, withWeb } = require('@nx/webpack');
const path = require('path');
const minifier = require('../../tools/scripts/webpack-minifier');
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const DEP_MAP = {
  '@statsig/client-core': '../../dist/packages/client-core',
  '@statsig/js-client': '../../dist/packages/js-client',
  '@statsig/js-on-device-eval-client':
    '../../dist/packages/js-on-device-eval-client',
  '@statsig/session-replay': '../../dist/packages/session-replay',
  '@statsig/sha256': '../../dist/packages/sha256',
  '@statsig/web-analytics': '../../dist/packages/web-analytics',
};

class StatsigPostProcessPlugin {
  name = 'StatsigPostProcessPlugin';

  constructor(options) {
    this.options = options || {};
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap(this.name, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: this.name,
          stage: compilation.constructor.PROCESS_ASSETS_STAGE_REPORT,
        },
        (assets) => {
          const filename = `statsig-${this.options.bundleFile}.min.js`;
          const asset = assets[filename];
          if (!asset) {
            throw `[${this.name}]: Could not find file ${filename}`;
          }

          const source = asset.source();
          const parts = source.split('"use strict";');
          const tailIndex = parts.length - 1;

          const hoistedFunctions = [
            'var $Q=(e)=>Object.defineProperty(e,"__esModule",{value:!0});',
            'var $P=(a,b)=>Object.assign(a,b);',
            'var $A=() =>((t,r,u,l)=>{return new(u=u||Promise)(function(n,e){function i(t){try{s(l.next(t))}catch(t){e(t)}}function o(t){try{s(l.throw(t))}catch(t){e(t)}}function s(t){var e;t.done?n(t.value):((e=t.value)instanceof u?e:new u(function(t){t(e)})).then(i,o)}s((l=l.apply(t,r||[])).next())})});',
          ].join('');

          const sourceUsingHositedFunctions = parts[tailIndex]
            // __esModule replace
            .replaceAll(
              'Object.defineProperty(e,"__esModule",{value:!0})',
              '$Q(e)',
            )
            // Object.assign replace
            .replaceAll('Object.assign(', '$P(')
            // this.__awaiter constructor
            .replaceAll(
              'function(t,r,u,l){return new(u=u||Promise)(function(n,e){function i(t){try{o(l.next(t))}catch(t){e(t)}}function s(t){try{o(l.throw(t))}catch(t){e(t)}}function o(t){var e;t.done?n(t.value):((e=t.value)instanceof u?e:new u(function(t){t(e)})).then(i,s)}o((l=l.apply(t,r||[])).next())})};',
              '$A();',
            );

          parts[tailIndex] =
            `${hoistedFunctions}${sourceUsingHositedFunctions}`;

          const edited = parts.join('"use strict";');

          assets[filename] = {
            source: () => edited,
            size: () => edited.length,
          };
        },
      );
    });
  }
}

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

  return composePlugins(withNx(), withWeb(), () => {
    return {
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
        concatenateModules: true,
        removeAvailableModules: true,
        mergeDuplicateChunks: true,
        minimize: true,
        minimizer: [minifier],
      },
      plugins: [
        ...(plugins ?? []),
        new StatsigPostProcessPlugin({ bundleFile }),
        new BundleAnalyzerPlugin({
          analyzerMode: 'disabled',
          openAnalyzer: false,
          generateStatsFile: true,
          statsFilename: `../stats/${bundleFile}.json`,
        }),
      ],
    };
  });
}

module.exports = {
  createStatsigWebpackBundle,
};
