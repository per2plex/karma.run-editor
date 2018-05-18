import webpack from 'webpack'
import webpackMerge from 'webpack-merge'
import baseConfig from './webpack.config'

export default webpackMerge(baseConfig, {
  mode: 'development',
  devtool: 'eval-source-map',
  output: {pathinfo: true},

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    })
  ]
})
