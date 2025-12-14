// webpack.common.js
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    main: "./src/index.js",
    background: "./src/Core/background.js",
    "group-view": "./src/group-view.js", // Entry point for group view page
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "../build"),
    clean: true,
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(jpg|png|gif|svg)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
              outputPath: "./images",
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      chunks: ["main"], // Include only main entry in index.html
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "src/images", to: "images" },
        { from: "public/manifest.json", to: "manifest.json" },
        { from: "public/group-view.html", to: "group-view.html" },
      ],
    }),
  ],
};
