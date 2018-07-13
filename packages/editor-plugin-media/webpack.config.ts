import path from 'path'
import webpack from 'webpack'

export default (env: any) => {
  const isProductionBuild = env.mode === 'production'

  return {
    entry: path.resolve(__dirname, './src/client/index.ts'),
    output: {
      path: path.resolve(__dirname, './dist/client/'),
      publicPath: '/static/',
      filename: 'main.js',
      library: 'editor-plugin-media',
      libraryTarget: 'umd'
    },
    devtool: isProductionBuild ? 'source-map' : 'cheap-module-eval-source-map',
    resolve: {extensions: ['.ts', '.tsx', '.js']},
    module: {
      rules: [
        {
          test: /.tsx?$/,
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, './src/client/tsconfig.json')
          }
        }
      ]
    }
  } as webpack.Configuration
}
