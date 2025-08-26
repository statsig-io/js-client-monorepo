const TerserPlugin = require('terser-webpack-plugin');
const fs = require('fs');

function createMinifier(useNameCache = false) {
  if (useNameCache) {
    return new TerserPlugin({
      minify: (input, sourceMap, minimizerOptions, extractComments) => {
        const terser = require('terser-webpack-plugin');
        const res = terser.uglifyJsMinify(
          input,
          sourceMap,
          minimizerOptions,
          extractComments,
        );
        require('fs').writeFileSync(
          './tools/scripts/minifier-name-cache.json',
          JSON.stringify(minimizerOptions.nameCache, null, 2),
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
  }

  return new TerserPlugin({
    minify: (input, sourceMap, minimizerOptions, extractComments) => {
      const terser = require('terser-webpack-plugin');
      return terser.uglifyJsMinify(
        input,
        sourceMap,
        minimizerOptions,
        extractComments,
      );
    },
    extractComments: false,
    terserOptions: {
      output: {
        comments: false,
      },
    },
  });
}

module.exports = {
  terserWithNameCache: createMinifier(true),
  terserWithoutNameCache: createMinifier(false),
};
