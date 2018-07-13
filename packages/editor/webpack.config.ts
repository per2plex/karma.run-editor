import path from 'path'
import webpack from 'webpack'

export default (env: any) => {
  const isProductionBuild = env.mode === 'production'

  const sharedConfig: webpack.Configuration = {
    devtool: isProductionBuild ? 'source-map' : 'cheap-module-eval-source-map',
    output: {
      path: path.resolve(__dirname, './dist/client/'),
      publicPath: '/static/'
    },
    resolve: {extensions: ['.ts', '.tsx', '.js']},
    module: {
      rules: [{test: /.tsx?$/, use: 'ts-loader'}]
    }
  }

  const clientConfig: webpack.Configuration = {
    ...sharedConfig,
    entry: './src/client/index.ts',
    output: {
      ...sharedConfig.output,
      library: 'editor',
      libraryTarget: 'umd'
    }
  }

  const workerConfig: webpack.Configuration = {
    ...sharedConfig,
    entry: './src/worker/index.ts',
    output: {
      ...sharedConfig.output,
      filename: 'worker.js'
    }
  }

  return [clientConfig, workerConfig]
}
