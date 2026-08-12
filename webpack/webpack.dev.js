// webpack.dev.js
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

// There is no dev server. The popup reaches for chrome.* APIs as soon as it
// loads, so it only runs as an installed extension — served from localhost it
// throws before rendering anything. `npm run dev` rebuilds build/ on change
// instead; press reload on the extension in chrome://extensions to pick it up.
//
// Source maps must stay eval-free: the MV3 CSP forbids 'unsafe-eval', so any
// eval-based devtool value breaks the extension outright.
module.exports = merge(common, {
  mode: "development",
  devtool: "cheap-module-source-map",
});
