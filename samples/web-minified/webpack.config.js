const { composePlugins, withNx, withWeb } = require('@nx/webpack');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withWeb(), (config) => {
  // Update the webpack config as needed here.
  // e.g. `config.plugins.push(new MyPlugin())`
  return {
    ...config,
    devServer: {
      port: 4200,
      setupMiddlewares: (middlewares, devServer) => {
        devServer.app.post('/mock-rgstr', (_, response) => {
          response.status(202).json({ success: true });
        });

        return middlewares;
      },
    },
  };
});
