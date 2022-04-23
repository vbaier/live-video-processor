const webpack = require('webpack');

module.exports = {
  devtool: 'source-map',
  entry: {
    frontend: './frontend/src/index.js',
    data_frontend: './data_frontend/src/index.js'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx']
  },
  output: {
    filename: './[name]/static/[name]/main.js',
    path: __dirname
  },
  node: {
    global: false,
    __filename: false,
    __dirname: false,
  },
};
