const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const fs = require('fs');
const CustomMinifyPlugin = require('../build/CustomMinifyPlugin').default;

const MAX_KB = 40;
const TO_MINIFY = [
  '_store',
  '_network',
  '_options',
  '_logger',
  '_user',
  'getObjectFromLocalStorage',
  'setObjectInLocalStorage',
  '_enforceStorageLimit',
  'setValues',
  'switchToUser',
  'fetchEvaluations',
  'createGateExposure',
  'createConfigExposure',
  'createLayerParameterExposure',
  '_sendPostRequest',
  'sendEvents',
  '_instance',
  'logMissingStatsigUserWarning',
  'isRemoteEvaluationClient',
  'emptyDynamicConfig',
  'emptyLayer',
];

const terser = new TerserPlugin({
  minify: (a, b, options, d) => {
    const TerserPlugin = require('terser-webpack-plugin');
    const fs = require('fs');
    const res = TerserPlugin.uglifyJsMinify(a, b, options, d);
    fs.writeFileSync(
      './config/name-cache.json',
      JSON.stringify(options.nameCache, null, 2),
    );
    return res;
  },

  extractComments: false,
  terserOptions: {
    nameCache: JSON.parse(fs.readFileSync('./config/name-cache.json', 'utf8')),
    output: {
      comments: false,
    },
    mangle: {
      properties: {
        regex: new RegExp(TO_MINIFY.join('|')),
      },
    },
  },
});

function makeWebpackConfig(name, extras) {
  return {
    name,
    mode: 'production',
    module: {
      rules: [
        {
          test: /\.(?:js|mjs|cjs)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [['@babel/preset-env', { targets: 'defaults' }]],
            },
          },
        },
      ],
    },
    resolve: {
      extensions: ['.js'],
    },
    entry: path.resolve(__dirname, `../build/${name}.js`),
    output: {
      filename: `${name}.min.js`,
      path: path.resolve(__dirname, '../dist'),
    },
    optimization: {
      minimize: true,
      minimizer: [terser],
    },
    performance: {
      hints: 'error',
      maxEntrypointSize: 1024 * MAX_KB,
    },
    plugins: [new CustomMinifyPlugin({ options: true })],
    ...extras,
  };
}

module.exports = [
  makeWebpackConfig('statsig-js-remote-eval'),
  makeWebpackConfig('statsig-react', {
    externals: {
      react: 'react',
      'react-dom': 'reactDOM',
    },
  }),
  makeWebpackConfig('statsig-js-local-eval'),
  makeWebpackConfig('statsig-sha256'),
  makeWebpackConfig('statsig-js-extensions'),
];
