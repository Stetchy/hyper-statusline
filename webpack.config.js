const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  target: "node",
  entry: "./index.js",
  output: {
    path: `${__dirname}/dist/`,
    filename: "index.js",
    libraryTarget: "commonjs"
  },
  plugins: [new webpack.DefinePlugin({ "global.GENTLY": false })],
  externals: [
    nodeExternals(),
    "hyper/component",
    "hyper/notify",
    "hyper/decorate",
    "react",
    "electron"
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/
      },
      {
        test: /\.(?:ico|gif|png|jpg|jpeg|webp|svg)$/,
        use: "url-loader"
      }
    ]
  }
};
