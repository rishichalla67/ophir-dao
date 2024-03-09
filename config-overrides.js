const webpack = require('webpack');

module.exports = function override(config, env) {
  // Existing fallback configuration
  config.resolve.fallback = {
    ...(config.resolve.fallback || {}),
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
  };

  // Define process.env for the browser environment
  config.plugins = (config.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
      'process.browser': true,
    })
  ]);

  return config;
};