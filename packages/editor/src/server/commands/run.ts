import * as path from 'path'
import express from 'express'
import compression from 'compression'
import editorMediaMiddleware, {CloudinaryBackend} from '@karma.run/editor-media-server'
import editorMiddleware from '@karma.run/editor-server'

export default function runCommand(karmaURL: string | undefined, options: any) {
  const app = express()
  const port = process.env.PORT ? Number(process.env.PORT) : options.port

  app.disable('x-powered-by')

  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_REQUESTS !== 'true') {
    app.use((req, res, next) => {
      if (req.get('X-Forwarded-Proto') === 'http') {
        res.redirect('https://' + req.headers.host + req.url)
        return
      }

      res.setHeader('Content-Security-Policy', 'upgrade-insecure-requests')
      res.setHeader('X-Content-Security-Policy', 'upgrade-insecure-requests')

      return next()
    })
  }

  app.use(compression())

  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    app.use(
      '/api/media',
      editorMediaMiddleware({
        karmaURL: process.env.KARMA_URL || process.env.KARMA_API_URL || karmaURL,
        hostname: '/api/media',
        backend: new CloudinaryBackend({
          cloudName: process.env.CLOUDINARY_CLOUD_NAME,
          folder: process.env.CLOUDINARY_FOLDER,
          apiKey: process.env.CLOUDINARY_API_KEY,
          apiSecret: process.env.CLOUDINARY_API_SECRET
        })
      })
    )
  }

  app.get('/api/status', (_, res) => {
    res.status(200).send({status: 'OK'})
  })

  app.use(
    editorMiddleware({
      staticPath: path.resolve(__dirname, '../static'),
      karmaURL: process.env.KARMA_URL || process.env.KARMA_API_URL || karmaURL,
      mediaAPIBasePath: '/api/media',
      customClientConfig: {
        sentryURL: process.env.SENTRY_API_URL
      }
    })
  )

  app.listen(port, () => {
    console.log('Server running at localhost:' + port)
  })
}
