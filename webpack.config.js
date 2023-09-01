const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const fs = require('fs');

const MAX_KB = 30;

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
        regex: /^_/,
        reserved: ['__STATSIG__'],
      },
    },
  },
});

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, './dist/index.js'),
  resolve: {
    extensions: ['.js'],
  },
  output: {
    filename: 'statsig-js.webpack.min.js',
    path: path.resolve(__dirname, 'build'),
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
