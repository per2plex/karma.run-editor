import os from 'os'
import fs from 'fs'
import path from 'path'
import shortid from 'shortid'
import mkdirp from 'mkdirp'

import Busboy from 'busboy'
import {
  deleteNullValues,
  DatabaseHeader,
  SignatureHeader,
  Session,
  rpcRequest
} from '@karma.run/editor-common'

import {Router, RequestHandler, json, Response} from 'express'
import {ErrorRequestHandler, Request, NextFunction} from 'express-serve-static-core'
import {MediaType, ErrorType, MediaPrivilege} from '@karma.run/editor-media-common'

import {LocalBackend} from './backend'

import {getFilePathForID, UploadFile, getMetadataForID} from './helper'

import {
  commitMedia,
  uploadMedia,
  deleteMedia,
  thumbnailRedirectURL,
  copyMedia,
  UploadOptions,
  CommitOptions,
  DeleteOptions,
  ThumbnailOptions,
  CopyOptions
} from './action'

export type UploadMiddlewareOptions = UploadOptions
export type CommitMiddlewareOptions = CommitOptions
export type CopyMiddlewareOptions = CopyOptions
export type DeleteMiddlewareOptions = DeleteOptions
export type ThumbnailMiddlewareOptions = ThumbnailOptions

export interface CheckPrivilegeMiddlewareOptions {
  karmaURL: string
}

export interface PreviewMiddlewareOptions {
  tempDirPath: string
}

export type MiddlewareOptions = UploadMiddlewareOptions &
  CommitMiddlewareOptions &
  PreviewMiddlewareOptions &
  CopyMiddlewareOptions &
  DeleteMiddlewareOptions &
  ThumbnailMiddlewareOptions &
  CheckPrivilegeMiddlewareOptions

export const defaultOptions: MiddlewareOptions = Object.freeze({
  karmaURL: '',
  hostname: '',
  tempDirPath: path.join(os.tmpdir(), 'karma.run-media'),
  backend: new LocalBackend(),
  allowedMediaTypes: [
    MediaType.Image,
    MediaType.Video,
    MediaType.Audio,
    MediaType.Document,
    MediaType.Other
  ]
})

export function uploadMediaMiddleware(opts: UploadMiddlewareOptions): RequestHandler {
  // Create temp dir if it doesn't exist
  mkdirp.sync(opts.tempDirPath)

  return async (req, res, next) => {
    const busboy = new Busboy({
      headers: req.headers,
      limits: {files: 1}
    })

    let uploadFile: UploadFile | undefined

    busboy.on('file', (_fieldName, fileStream, filename) => {
      const id = shortid()

      uploadFile = {id, filename, path: getFilePathForID(id, opts.tempDirPath)}
      fileStream.pipe(fs.createWriteStream(uploadFile.path))
    })

    busboy.on('finish', async () => {
      if (!uploadFile) return next(ErrorType.InvalidRequest)

      try {
        return res.status(200).send(
          await uploadMedia(uploadFile, {
            hostname: opts.hostname,
            tempDirPath: opts.tempDirPath,
            allowedMediaTypes: opts.allowedMediaTypes
          })
        )
      } catch (err) {
        return next(err)
      }
    })

    req.pipe(busboy)
  }
}

export function previewMediaMiddleware(opts: PreviewMiddlewareOptions): RequestHandler {
  return async (req, res, next) => {
    if (!req.params.id || typeof req.params.id !== 'string') return next(ErrorType.InvalidRequest)

    try {
      const tempFilePath = path.join(opts.tempDirPath, req.params.id)
      const metadata = await getMetadataForID(req.params.id, opts.tempDirPath)

      return res.status(200).sendFile(tempFilePath, {
        headers: {'Content-Type': metadata.mimeType}
      })
    } catch (err) {
      return next(ErrorType.NotFound)
    }
  }
}

export function commitMediaMiddleware(opts: CommitMiddlewareOptions): RequestHandler {
  return async (req, res, next) => {
    if (
      !req.body.id ||
      typeof req.body.id !== 'string' ||
      (req.body.overrideID && typeof req.body.overrideID !== 'string')
    ) {
      return next(ErrorType.InvalidRequest)
    }

    try {
      return res.status(200).send(await commitMedia(req.body.id, req.body.overrideID, opts))
    } catch (err) {
      return next(err)
    }
  }
}

export function copyMediaMiddleware(opts: DeleteMiddlewareOptions): RequestHandler {
  return async (req, res, next) => {
    if (!req.body.id || typeof req.body.id !== 'string') return next(ErrorType.InvalidRequest)

    try {
      return res.status(200).send(await copyMedia(req.body.id, opts))
    } catch (err) {
      return next(err)
    }
  }
}

export function deleteMediaMiddleware(opts: DeleteMiddlewareOptions): RequestHandler {
  return async (req, res, next) => {
    if (!req.params.id || typeof req.params.id !== 'string') return next(ErrorType.InvalidRequest)

    try {
      return res.status(200).send(await deleteMedia(req.params.id, opts))
    } catch (err) {
      return next(err)
    }
  }
}

export function thumbnailRedirectMiddleware(opts: ThumbnailMiddlewareOptions): RequestHandler {
  return async (req, res, next) => {
    if (!req.params.id || typeof req.params.id !== 'string') return next(ErrorType.InvalidRequest)

    try {
      return res.redirect(await thumbnailRedirectURL(req.params.id, opts))
    } catch (err) {
      return next(err)
    }
  }
}

export function checkPrivilegeMiddleware(opts: CheckPrivilegeMiddlewareOptions) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const database = req.get(DatabaseHeader)
    const signature = req.get(SignatureHeader)

    if (!signature) return next(ErrorType.PermissionDenied)

    const session: Session = {
      endpoint: opts.karmaURL,
      database: database || '',
      username: '',
      signature
    }

    try {
      const editorContexts = await rpcRequest(session, {
        all: {tag: '_frontend_editor_context_v2'}
      })

      for (const editorContext of editorContexts) {
        if (editorContext.privileges && editorContext.privileges.includes(MediaPrivilege)) {
          return next()
        }
      }
    } catch (err) {
      return next(err)
    }

    return next(ErrorType.PermissionDenied)
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (typeof err === 'string') {
    let statusCode = 400

    switch (err) {
      case ErrorType.PermissionDenied:
        statusCode = 403
        break

      case ErrorType.NotFound:
        statusCode = 404
        break

      case ErrorType.Internal:
        statusCode = 500
        break
    }

    return res.status(statusCode).send({type: err})
  } else {
    return res.status(500).send({type: ErrorType.Internal})
  }
}

export function mediaMiddleware(options?: Partial<MiddlewareOptions>): Router {
  const opts = options ? {...defaultOptions, ...deleteNullValues(options)} : defaultOptions
  const router = Router()

  router.get('/preview/:id', previewMediaMiddleware(opts))
  router.get('/thumbnail/:id', thumbnailRedirectMiddleware(opts))

  router.use(json())
  router.use(checkPrivilegeMiddleware(opts))

  router.post('/upload', uploadMediaMiddleware(opts))
  router.post('/commit', commitMediaMiddleware(opts))
  router.post('/copy', copyMediaMiddleware(opts))

  router.delete('/:id', deleteMediaMiddleware(opts))
  router.use(errorHandler)

  return router
}
