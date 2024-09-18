const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');
const path = require('path');
const fs = require('fs').promises;

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withReact(), (config) => {
  // Update the webpack config as needed here.
  // e.g. `config.plugins.push(new MyPlugin())`
  return {
    ...config,
    externals: ['react-native'],

    devServer: {
      ...config.devServer,
      watchFiles: ['./src/**/*'],
      setupMiddlewares: (middlewares, devServer) => {
        // config.devServer.setupMiddlewares(middlewares, devServer);
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
        }

        devServer.app.get('/sample-files', async (req, res) => {
          const samplesDir = path.join(__dirname, './src/samples');
          const files = await fs.readdir(samplesDir, { recursive: true });
          res
            .status(200)
            .json({ files: files.filter((file) => file.endsWith('.tsx')) });
        });

        return middlewares;
      },
    },
  };
});
