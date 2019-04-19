/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as webpack from 'webpack';
import * as path from 'path';
import * as TerserPlugin from 'terser-webpack-plugin';

export default baseWebpackConfig({
  webAppRoot: path.resolve(__dirname, '../build/client'),
  apiFallback: '/index.html',
  contentBase: path.resolve(__dirname, '../src/client/public'),
  env: 'dev',
  devPort: getPortFromEnv(),
  alias: {},
  devServerOpen: !process.env.DO_NOT_OPEN_WEB_PAGE,
});

type WebpackConfigurationWithDevServer = webpack.Configuration & {
  devServer: any;
};

type BaseWebpackOptions = {
  webAppRoot: string;
  env: 'prod' | 'dev';
  contentBase: string;
  alias: { [from: string]: string };
  devServerOpen: boolean;
  devPort: number | undefined;
  apiFallback: string;
};

/**
 * Get the port from the environment variable `PORT`, or `undefined` is the
 * port should be chosen randomly by the `http` library.
 */
function getPortFromEnv(): number | undefined {
  // 'random' is used, e.g., for end-to-end tests
  if (process.env.PORT === 'random') {
    return undefined;
  } else if (process.env.PORT) {
    return parseInt(process.env.PORT, 10);
  }
  return 3978;
}

function baseWebpackConfig(
  options: BaseWebpackOptions,
): WebpackConfigurationWithDevServer {
  const webAppRoot = options.webAppRoot;

  const cssRules: webpack.RuleSetRule[] = [
    {
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    },
    {
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
    },
  ];
  const imageRules: webpack.RuleSetRule[] = [
    {
      test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 8000, // Convert images < 8kb to base64 strings
            name: 'media/[name]-[hash:8].[ext]',
          },
        },
      ],
    },
  ];

  return {
    optimization: {
      minimizer: [new TerserPlugin()],
    },

    entry: [path.join(webAppRoot, 'index.js')],

    output: {
      // Output into build folder
      path: options.contentBase,
      filename: 'index.js',
    },

    context: webAppRoot,

    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

    resolve: {
      alias: options.alias,
      extensions: ['.js', '.tsx', '.ts', '.scss'],
    },

    devtool: 'cheap-module-source-map', // https://reactjs.org/docs/cross-origin-errors.html

    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        },
      }),
    ],

    module: {
      rules: [
        ...cssRules,
        ...imageRules,
        {
          test: /\.txt$/,
          use: ['raw-loader'],
        },
      ],
    },

    node: {
      __dirname: false,
    },

    stats: 'errors-only',

    devServer: {
      port: options.devPort,
      contentBase: options.contentBase,
      publicPath: '/',
      historyApiFallback: {
        rewrites: [{ from: /.*/, to: options.apiFallback }],
      },
      compress: true,
      open: options.devServerOpen,
      overlay: true,
    },
  };
}
