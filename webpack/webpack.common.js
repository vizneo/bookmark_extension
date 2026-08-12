// webpack.common.js
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const pkg = require("../package.json");

module.exports = {
  entry: {
    main: "./src/index.js",
    background: "./src/Core/background.js",
    "group-view": "./src/group-view.js",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "../build"),
    clean: true,
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
  optimization: {
    // The service worker is a classic worker and must stay a single file.
    splitChunks: { chunks: (chunk) => chunk.name !== "background" },
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: { loader: "babel-loader" },
      },
      {
        // Extracted rather than injected via <style>, so the extension never
        // depends on inline styles being allowed by the page CSP.
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: "asset/resource",
        generator: { filename: "images/[name][ext]" },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: "[name].css" }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      filename: "index.html",
      chunks: ["main"],
    }),
    new HtmlWebpackPlugin({
      template: "./public/group-view.html",
      filename: "group-view.html",
      chunks: ["group-view"],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "src/images", to: "images" },
        {
          from: "public/manifest.json",
          to: "manifest.json",
          // package.json is the single source of truth for the version.
          transform: (content) => {
            const manifest = JSON.parse(content.toString());
            manifest.version = pkg.version;
            return JSON.stringify(manifest, null, 2);
          },
        },
      ],
    }),
  ],
};
