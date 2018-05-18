import webpack from 'webpack'
import webpackMerge from 'webpack-merge'
import UglifyJSPlugin from 'uglifyjs-webpack-plugin'
import baseConfig from './webpack.config'

export default webpackMerge(baseConfig, {
  mode: 'production',

  plugins: [
    new webpack.DefinePlugin({
      'process.env.SENTRY_API_URL': JSON.stringify(process.env.SENTRY_API_URL),
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new UglifyJSPlugin({
      sourceMap: true
    })
  ]
})
