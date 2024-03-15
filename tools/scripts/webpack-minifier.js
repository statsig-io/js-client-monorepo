const TerserPlugin = require('terser-webpack-plugin');
const fs = require('fs');

const terser = new TerserPlugin({
  minify: (a, b, options, d) => {
    const terser = require('terser-webpack-plugin');
    const res = terser.uglifyJsMinify(a, b, options, d);
    require('fs').writeFileSync(
      './tools/scripts/minifier-name-cache.json',
      JSON.stringify(options.nameCache, null, 2),
    );
    return res;
  },
  extractComments: false,
  terserOptions: {
    nameCache: JSON.parse(
      fs.readFileSync('./tools/scripts/minifier-name-cache.json', 'utf8'),
    ),
    output: {
      comments: false,
    },
    mangle: {
      properties: {
        regex: /^_[^_]/, // anything starting with a single underscore
      },
    },
  },
});

module.exports = terser;
