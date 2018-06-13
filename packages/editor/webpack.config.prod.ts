import webpackMerge from 'webpack-merge'
import UglifyJsPlugin from 'uglifyjs-webpack-plugin'

import baseConfig from './webpack.config'

export default webpackMerge(baseConfig, {
  mode: 'production',
  devtool: 'source-map',
  plugins: [new UglifyJsPlugin({uglifyOptions: {compress: {inline: false}}})]
})
