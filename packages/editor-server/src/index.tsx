/**
 * @module @karma.run/editor-server
 * @license MIT
 *
 * Copyright (c) 2018, karma.run AG.
 */
import React from 'react'
import ReactDOMServer from 'react-dom/server'

import path from 'path'
import express from 'express'

import {
  SignatureHeader,
  Tag,
  MetarializedRecord,
  query,
  buildFunction,
  getTags,
  getModels,
  Ref
} from '@karma.run/sdk'

import {
  ServerPlugin,
  PluginTuple,
  ViewContext,
  RefMap,
  EditorContext,
  unserializeModel,
  defaultFieldRegistry,
  ViewContextOptions
} from '@karma.run/editor-common'

const cacheOptions = {maxAge: '1d'}

export type EditorContextsForRolesFn = (
  roles: string[],
  tagMap: ReadonlyMap<string, Ref>
) => EditorContext[]

export type ViewContextsForRolesFn = (
  roles: string[],
  tagMap: ReadonlyMap<string, Ref>
) => ({model: string | Ref} & ViewContextOptions)[]

export interface MiddlewareOptions {
  title?: string
  basePath?: string
  karmaDataURL: string

  bundlePublicPath: string
  clientName: string
  workerName: string

  favicon: string
  plugins?: ServerPlugin[]

  editorContextsForRoles?: EditorContextsForRolesFn
  viewContextsForRoles?: ViewContextsForRolesFn
}

export const defaultModelGroupID: string = 'default'
export const defaultEditorContextID: string = 'default'

export function getTagsModelsAndUserRoles(
  karmaDataURL: string,
  signature: string
): Promise<{tags: Tag[]; models: MetarializedRecord[]; userRoles: string[]}> {
  return query(
    karmaDataURL,
    signature,
    buildFunction(e => () =>
      e.data(d =>
        d.struct({
          tags: d.expr(() => getTags()),
          models: d.expr(e => e.mapList(getModels(), (_, model) => e.metarialize(model))),
          userRoles: d.expr(e =>
            e.mapList(e.field('roles', e.get(e.currentUser())), (_, value) =>
              e.field('name', e.get(value))
            )
          )
        })
      )
    )
  )
}

export async function getEditorContext(
  karmaDataURL: string,
  signature: string,
  editorContextsForRoles?: EditorContextsForRolesFn,
  viewContextsForRoles?: ViewContextsForRolesFn
) {
  const {tags, models, userRoles} = await getTagsModelsAndUserRoles(karmaDataURL, signature)

  const tagMap = new Map(tags.map(tag => [tag.tag, tag.model] as [string, Ref]))
  const reverseTagMap = new RefMap(tags.map(tag => [tag.model, tag.tag] as [Ref, string]))

  const overrideViewContexts = viewContextsForRoles ? viewContextsForRoles(userRoles, tagMap) : []
  const overrideViewContextMap = new RefMap(
    overrideViewContexts.map(
      viewContext =>
        [
          typeof viewContext.model === 'string' ? tagMap.get(viewContext.model) : viewContext.model,
          viewContext
        ] as [Ref, ViewContextOptions]
    )
  )

  const viewContexts = models.map(model =>
    ViewContext.inferFromModel(
      model.id,
      unserializeModel(model.value),
      defaultFieldRegistry,
      reverseTagMap.get(model.id),
      [],
      overrideViewContextMap.get(model.id)
    )
  )

  const editorContexts: EditorContext[] = editorContextsForRoles
    ? editorContextsForRoles(userRoles, tagMap)
    : [{name: 'Default', modelGroups: [{name: 'Models', models: models.map(model => model.id)}]}]

  return {
    editorContexts,
    viewContexts
  }
}

export function editorMiddleware(opts: MiddlewareOptions): express.Router {
  const title = opts.title || 'karma.data - editor'
  const basePath = opts.basePath || ''

  const router = express.Router()
  const reactDateTimePath = require.resolve('react-datetime')
  const draftJSPath = require.resolve('draft-js')

  const reactDateTimeCSSPath = path.join(path.dirname(reactDateTimePath), 'css/react-datetime.css')
  const draftJSCSSPath = path.join(path.dirname(draftJSPath), '../dist/Draft.css')

  router.get(`${basePath}/css/react-datetime.css`, (_, res) => {
    return res.sendFile(reactDateTimeCSSPath, cacheOptions)
  })

  router.get(`${basePath}/css/draft-js.css`, (_, res) => {
    return res.sendFile(draftJSCSSPath, cacheOptions)
  })

  router.use(
    `${basePath}/static`,
    express.static(opts.bundlePublicPath, {
      index: false,
      ...cacheOptions
    })
  )

  router.use(`${basePath}/static`, (_, res) => {
    return res.status(404).send()
  })

  router.get(`${basePath}/static/favicon.ico`, (_, res) => {
    return res.sendFile(opts.favicon, cacheOptions)
  })

  router.get(`${basePath}/api/context`, async (req, res, next) => {
    const signature = req.header(SignatureHeader)
    if (!signature) return next('No signature header found.')

    try {
      const editorContext = await getEditorContext(
        opts.karmaDataURL,
        signature,
        opts.editorContextsForRoles,
        opts.viewContextsForRoles
      )

      return res.status(200).send({
        ...editorContext,
        viewContexts: editorContext.viewContexts.map(viewContext => viewContext.serialize())
      })
    } catch (err) {
      // TODO: Better error handling
      return next(err)
    }
  })

  const clientPlugins: PluginTuple[] = []

  if (opts.plugins && opts.plugins.length) {
    for (const plugin of opts.plugins) {
      plugin.initialize({router})
      console.info(`Initialized plugin: ${plugin.name}@${plugin.version}`)
    }
  }

  router.use(
    (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error(err)
      return res.status(500).send({
        error: err.message
      })
    }
  )

  router.get(`${basePath}(/*)?`, (_, res) => {
    const configJSON = JSON.stringify({
      title,
      basePath,
      karmaDataURL: opts.karmaDataURL,
      workerURL: `/static/worker.js`,
      plugins: clientPlugins
    })

    const stream = ReactDOMServer.renderToStaticNodeStream(
      <html>
        <head>
          <title>{title}</title>

          <link href={`${basePath}/static/favicon.ico`} rel="icon" type="image/x-icon" />
          <link href={`${basePath}/css/draft-js.css`} rel="stylesheet" />
          <link href={`${basePath}/css/react-datetime.css`} rel="stylesheet" />

          <link
            href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i"
            rel="stylesheet"
          />

          <script
            id="Config"
            type="application/json"
            dangerouslySetInnerHTML={{__html: configJSON}}
          />

          <script src={`${basePath}/static/${opts.clientName}`} defer />
        </head>
        <body>
          <div id="EditorRoot" />
        </body>
      </html>
    )

    res.write('<!DOCTYPE html>')
    return stream.pipe(res)
  })

  return router
}

export default editorMiddleware
