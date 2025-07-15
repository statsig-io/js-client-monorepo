const fs = require('fs');
const path = require('path');

class WebVitalsConcatPlugin {
  name = 'WebVitalsConcatPlugin';

  constructor(options) {
    this.options = options || {};
  }

  findWebVitalsPath() {
    const searchPaths = [
      path.resolve(__dirname, '../web-analytics/node_modules'),
      path.resolve(__dirname, '../../node_modules'),
      path.resolve(__dirname, './node_modules'),
    ];

    for (const searchPath of searchPaths) {
      if (!fs.existsSync(searchPath)) continue;

      const pnpmPath = path.join(searchPath, '.pnpm');
      const directPath = path.join(
        searchPath,
        'web-vitals/dist/web-vitals.umd.cjs',
      );

      // Check direct node_modules path first
      if (fs.existsSync(directPath)) {
        return directPath;
      }

      // Skip pnpm check if .pnpm folder doesn't exist
      if (!fs.existsSync(pnpmPath)) continue;

      const pnpmDirs = fs.readdirSync(pnpmPath);
      const webVitalsDir = pnpmDirs.find((dir) =>
        dir.startsWith('web-vitals@'),
      );
      if (!webVitalsDir) continue;

      const pnpmWebVitalsPath = path.join(
        pnpmPath,
        webVitalsDir,
        'node_modules/web-vitals/dist/web-vitals.umd.cjs',
      );

      if (fs.existsSync(pnpmWebVitalsPath)) {
        return pnpmWebVitalsPath;
      }
    }

    return null;
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

          const webVitalsPath = this.findWebVitalsPath();

          if (!webVitalsPath) {
            console.warn(
              `[Statsig Build]: Web-vitals file not found in any of the expected locations`,
            );
            return;
          }

          console.log(
            `[Statsig Build]: Using web-vitals from: ${webVitalsPath}`,
          );

          const webVitals = fs.readFileSync(webVitalsPath).toString();

          const originalSource = asset.source();
          const prependedSource = `${webVitals}${originalSource}`;

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

module.exports = WebVitalsConcatPlugin;
