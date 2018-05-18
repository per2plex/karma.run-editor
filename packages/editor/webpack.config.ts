import webpack from 'webpack'
import path from 'path'

export default {
  entry: {
    'main': './src/client/index.tsx',
    'worker': './src/worker/index.ts'
  },

  output: {
    path: __dirname + '/dist/client',
    filename: '[name].js',
    publicPath: '/'
  },

  module: {
    rules: [
      {test: /\.(ts|tsx)$/, include: [path.resolve(__dirname, 'src/client')], use: {
        loader: 'ts-loader',
        options: {configFile: path.resolve(__dirname, 'src/client/tsconfig.json')}
      }},
      {test: /\.(ts|tsx)$/, include: [path.resolve(__dirname, 'src/worker')], use: {
        loader: 'ts-loader',
        options: {configFile: path.resolve(__dirname, 'src/worker/tsconfig.json')}
      }}
    ]
  },

  plugins: [],
  devtool: 'source-map',

  watchOptions: {
    ignored: /node_modules|dist/
  }
} as webpack.Configuration
