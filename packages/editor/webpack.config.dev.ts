import webpackMerge from 'webpack-merge'
import baseConfig from './webpack.config'

export default webpackMerge(baseConfig, {
  mode: 'development',
  devtool: 'eval-source-map'
})
