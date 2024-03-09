const webpack = require('webpack');

module.exports = function override(config, env) {
  // Existing fallback configuration
  config.resolve.fallback = {
    ...(config.resolve.fallback || {}),
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer/"),
  };

  // Define process.env for the browser environment
  config.plugins = (config.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
      'process.browser': true,
      'global.Buffer': require.resolve('buffer'),
    })
  ]);

  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'], // Add this line
    })
  );

  return config;
};