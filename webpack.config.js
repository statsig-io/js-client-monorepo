const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const fs = require('fs');

const MAX_KB = 30;

const TO_MINIFY = ['_store', '_network', '_options', '_logger', '_user'];

const terser = new TerserPlugin({
  minify: (a, b, options, d) => {
    const TerserPlugin = require('terser-webpack-plugin');
    const fs = require('fs');
    const res = TerserPlugin.uglifyJsMinify(a, b, options, d);
    fs.writeFileSync(
      'name-cache.json',
      JSON.stringify(options.nameCache, null, 2),
    );
    return res;
  },
  terserOptions: {
    nameCache: JSON.parse(fs.readFileSync('name-cache.json', 'utf8')),
    mangle: {
      properties: {
        regex: new RegExp(TO_MINIFY.join('|')),
      },
    },
  },
});

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, './build/statsig-react.js'),
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
  resolve: {
    extensions: ['.js'],
  },
  output: {
    filename: 'statsig-react.min.js',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    minimize: true,
    minimizer: [terser],
  },
  performance: {
    hints: 'error',
    maxEntrypointSize: 1024 * MAX_KB,
  },
};
