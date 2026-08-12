// webpack.prod.js
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "production",
  // No source maps in the shipped package: they roughly triple the zip size
  // and are not useful to Web Store reviewers.
  devtool: false,
  performance: {
    hints: "warning",
    maxAssetSize: 512 * 1024,
    maxEntrypointSize: 768 * 1024,
  },
});
