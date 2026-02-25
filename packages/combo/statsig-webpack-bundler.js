const { composePlugins, withNx, withWeb } = require('@nx/webpack');
const path = require('path');
const {
  terserWithNameCache,
  terserWithoutNameCache,
} = require('../../tools/scripts/webpack-minifier');
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const DEP_MAP = {
  '@statsig/client-core': '../../dist/packages/client-core',
  '@statsig/js-client': '../../dist/packages/js-client',
  '@statsig/js-on-device-eval-client':
    '../../dist/packages/js-on-device-eval-client',
  '@statsig/on-device-eval-core': '../../dist/packages/on-device-eval-core',
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
            'var $Q2=(a,b,c)=>Object.defineProperty(a,b,c);',
            'var $P=(a,b)=>Object.assign(a,b);',
            'var $A=()=>((t,r,u,l)=>{return new(u=u||Promise)(function(n,e){function i(t){try{s(l.next(t))}catch(t){e(t)}}function o(t){try{s(l.throw(t))}catch(t){e(t)}}function s(t){var e;t.done?n(t.value):((e=t.value)instanceof u?e:new u(function(t){t(e)})).then(i,o)}s((l=l.apply(t,r||[])).next())})});',
          ].join('');

          // Process all parts for __awaiter patterns first
          for (let i = 0; i < parts.length; i++) {
            parts[i] = _replaceAwaiters(parts[i]);
          }

          let sourceUsingHositedFunctions = parts[tailIndex]
            // __esModule replace
            .replaceAll(
              'Object.defineProperty(e,"__esModule",{value:!0})',
              '$Q(e)',
            )
            // other Object.defineProperty
            .replaceAll('Object.defineProperty(', '$Q2(')
            // Object.assign replace
            .replaceAll('Object.assign(', '$P(');

          parts[tailIndex] = sourceUsingHositedFunctions;

          const edited = `${hoistedFunctions}${parts.join('"use strict";')}`;

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

  const useAdvancedMinification =
    bundleFile === 'js-client' || bundleFile === 'js-on-device-eval-client';

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
        modules: [
          'node_modules',
          path.resolve(__dirname, '../../node_modules'),
          path.resolve(__dirname, '../web-analytics/node_modules'),
          path.resolve(__dirname, './node_modules'),
        ],
      },
      externals,
      output: {
        filename: `statsig-${bundleFile}.min.js`,
        clean: false,
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
        maxAssetSize: maxByteSize,
        hints: 'error',
      },
      optimization: {
        concatenateModules: true,
        removeAvailableModules: true,
        mergeDuplicateChunks: true,
        minimize: true,
        minimizer: useAdvancedMinification
          ? [terserWithNameCache]
          : [terserWithoutNameCache],
      },
      plugins: [
        ...(plugins ?? []),
        ...(useAdvancedMinification
          ? [new StatsigPostProcessPlugin({ bundleFile })]
          : []),
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

function _replaceAwaiters(input) {
  if (!input.includes('this.__awaiter')) {
    return input; // No __awaiter patterns found, return as-is
  }

  const pattern = /this\.__awaiter\|\|function\((.*?)\[\]\)\).next\(\)\)\}\)\}/;
  const len =
    'this.__awaiter||function(t,o,l,u){return new(l=l||Promise)(function(i,e){function n(t){try{r(u.next(t))}catch(t){e(t)}}function s(t){try{r(u.throw(t))}catch(t){e(t)}}function r(t){var e;t.done?i(t.value):((e=t.value)instanceof l?e:new l(function(t){t(e)})).then(n,s)}r((u=u.apply(t,o||[])).next())})}'
      .length;

  const matches = input.match(pattern);
  if (matches) {
    for (let i = 0; i < matches.length; i++) {
      if (matches[i].length == len) {
        return input.replaceAll(matches[i], 'this.__awaiter||$A()');
      }
    }
  }

  // Try a simple string replacement approach for web-vitals
  if (
    input.includes('this.__awaiter||function(t,l,o,u){return new(o=o||Promise)')
  ) {
    const webVitalsPattern =
      'this.__awaiter||function(t,l,o,u){return new(o=o||Promise)(function(i,e){function n(t){try{s(u.next(t))}catch(t){e(t)}}function r(t){try{s(u.throw(t))}catch(t){e(t)}}function s(t){var e;t.done?i(t.value):((e=t.value)instanceof o?e:new o(function(t){t(e)})).then(n,r)}s((u=u.apply(t,l||[])).next())})}';
    if (input.includes(webVitalsPattern)) {
      return input.replaceAll(webVitalsPattern, 'this.__awaiter||$A()');
    }
  }

  const errorMessage =
    "[Statsig Build]: Failed to find valid '__awaiters' to replace";
  console.warn(errorMessage);
  return input;
}
