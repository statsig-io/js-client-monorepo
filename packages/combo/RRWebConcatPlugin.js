const fs = require('fs');
const path = require('path');

class RRWebConcatPlugin {
  name = 'RRWebConcatPlugin';

  constructor(options) {
    this.options = options || {};
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap(this.name, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: this.name,
          stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
        },
        (assets) => {
          const filename = `statsig-${this.options.bundleFileName}.min.js`;
          const asset = assets[filename];

          if (!asset) {
            throw `[Statsig Build]: Could not find file ${filename}`;
          }
          const rrwebPath = path.resolve(
            __dirname,
            '../../packages/session-replay/node_modules/rrweb/dist/record/rrweb-record.min.js',
          );
          const rrweb = fs
            .readFileSync(rrwebPath)
            .toString()
            .replace('//# sourceMappingURL=rrweb-record.min.js.map', '');

          const originalSource = asset.source();
          const prependedSource = `${rrweb}${originalSource}`;

          // Update the asset with the new content
          assets[filename] = {
            source: () => prependedSource,
            size: () => prependedSource.length,
          };
        },
      );
    });
  }
}

module.exports = RRWebConcatPlugin;
