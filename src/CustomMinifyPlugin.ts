import { Compilation, Compiler } from 'webpack';

const DISABLE_ALL = false;

const FLAGS = {
  extractDefineProperties: true,
  extract__esModule: true,
};

export default class CustomMinifyPlugin {
  apply(compiler: Compiler) {
    const pluginName = CustomMinifyPlugin.name;

    compiler.hooks.emit.tapAsync(pluginName, (compilation, callback) => {
      if (DISABLE_ALL) {
        callback();
        return;
      }

      for (const filename in compilation.assets) {
        const asset = compilation.assets[filename];

        if (asset && typeof asset.source === 'function') {
          const originalSource = asset.source().toString();
          let modifiedSource = originalSource;

          if (FLAGS.extractDefineProperties) {
            modifiedSource = modifiedSource
              .replaceAll('Object.defineProperty', '_S')
              .replace(
                /"use strict";/g,
                '"use strict";var _S=Object.defineProperty;',
              );
          }

          if (FLAGS.extract__esModule) {
            modifiedSource = modifiedSource
              .replaceAll(/"__esModule"/g, '_T')
              .replace(/"use strict";/g, '"use strict";var _T="__esModule";');
          }

          compilation.assets[filename] = {
            source: () => modifiedSource,
            size: () => modifiedSource.length,
          } as Compilation['assets'][string];
        }
      }
      callback();
    });
  }
}
