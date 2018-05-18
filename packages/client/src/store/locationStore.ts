import { observable, action, reaction } from 'mobx'
import * as qs from 'qs'

import { EditorStore } from '../store/editorStore'
import { Session } from '../api/karma'
import { Env } from '../util/env'

export const enum LocationType {
  RestoringSession = 'restoringSession',
  Login = 'login',
  Dashboard = 'dashboard',
  EntryList = 'entryList',
  EntryNew = 'entryNew',
  EntryEdit = 'entryEdit',
  EntryDelete = 'entryDelete',
  NotFound = 'notFound',
  NoPermission = 'noPermission',
  External = 'external'
}

export interface RestoringSessionLocation {
  type: LocationType.RestoringSession
  originalLocation: AppLocation
}

export function RestoringSessionLocation(originalLocation: AppLocation): RestoringSessionLocation {
  return {type: LocationType.RestoringSession, originalLocation}
}

export interface LoginLocation {
  type: LocationType.Login
  originalLocation?: AppLocation
  session?: Session
}

export function LoginLocation(originalLocation?: AppLocation, session?: Session): LoginLocation {
  return {type: LocationType.Login, originalLocation, session}
}

export interface DashboardLocation {
  type: LocationType.Dashboard
}

export function DashboardLocation(): DashboardLocation {
  return {type: LocationType.Dashboard}
}

export interface EntryListLocation {
  type: LocationType.EntryList
  slug: string
}

export function EntryListLocation(slug: string): EntryListLocation {
  return {type: LocationType.EntryList, slug}
}

export interface EntryNewLocation {
  type: LocationType.EntryNew
  slug: string
}

export function EntryNewLocation(slug: string): EntryNewLocation {
  return {type: LocationType.EntryNew, slug}
}

export interface EntryEditLocation {
  type: LocationType.EntryEdit
  slug: string
  id: string
}

export function EntryEditLocation(slug: string, id: string): EntryEditLocation {
  return {type: LocationType.EntryEdit, slug, id}
}

export interface EntryDeleteLocation {
  type: LocationType.EntryDelete
  slug: string
  id: string
}

export function EntryDeleteLocation(slug: string, id: string): EntryDeleteLocation {
  return {type: LocationType.EntryDelete, slug, id}
}

export interface NotFoundLocation {
  type: LocationType.NotFound
}

export function NotFoundLocation(): NotFoundLocation {
  return {type: LocationType.NotFound}
}

export interface NoPermissionLocation {
  type: LocationType.NoPermission
}

export function NoPermissionLocation(): NoPermissionLocation {
  return {type: LocationType.NoPermission}
}

export interface ExternalLocation {
  type: LocationType.External
  url: string
}

export function ExternalLocation(url: string): ExternalLocation {
  return {type: LocationType.External, url}
}

export type AppLocation =
  RestoringSessionLocation
  | LoginLocation
  | DashboardLocation
  | EntryListLocation
  | EntryNewLocation
  | EntryEditLocation
  | EntryDeleteLocation
  | NotFoundLocation
  | NoPermissionLocation
  | ExternalLocation

export function prefixWithBasePath(url: string): string {
  return Env.basePath + url
}

export function urlPathForLocation(location: AppLocation): string {
  switch (location.type) {
    case LocationType.RestoringSession: return urlPathForLocation(location.originalLocation)
    case LocationType.Login: return prefixWithBasePath('/login')
    case LocationType.Dashboard: return prefixWithBasePath('/')
    case LocationType.EntryList: return prefixWithBasePath(`/entries/${location.slug}`)
    case LocationType.EntryNew: return prefixWithBasePath(`/entries/${location.slug}/new`)
    case LocationType.EntryEdit: return prefixWithBasePath(`/entries/${location.slug}/edit/${location.id}`)
    case LocationType.EntryDelete: return prefixWithBasePath(`/entries/${location.slug}/delete/${location.id}`)
    case LocationType.NotFound: return prefixWithBasePath('/404')
    case LocationType.NoPermission: return prefixWithBasePath('/403')
    case LocationType.External: return location.url
  }
}

export function locationForURLPath(url: string): AppLocation {
  url = url.replace(window.location.origin, '')
  url = url.substring(Env.basePath.length)

  let matchArray: RegExpMatchArray | null

  if (matchArray = url.match(/^\/login(?:\?(.*))?(\/?)$/)) {
    const query = qs.parse(matchArray[1])

    const endpoint = query.endpoint || Env.KARMA_API_URL
    const database = query.database || ''
    const username = query.username
    const signature = query.signature

    if (typeof endpoint === 'string'
      && typeof database === 'string'
      && typeof username === 'string'
      && typeof signature === 'string') {
      return LoginLocation(undefined, {endpoint, database, username, signature})
    } else {
      return LoginLocation()
    }
  }

  if (matchArray = url.match(/^\/404(\/?)$/)) return NotFoundLocation()
  if (matchArray = url.match(/^\/403(\/?)$/)) return NoPermissionLocation()

  if (matchArray = url.match(/^\/entries\/(.+?)\/new(\/?)$/)) {
    return EntryNewLocation(matchArray[1])
  }

  if (matchArray = url.match(/^\/entries\/(.+?)\/edit\/(.+?)(\/?)$/)) {
    return EntryEditLocation(matchArray[1], matchArray[2])
  }

  if (matchArray = url.match(/^\/entries\/(.+?)\/delete\/(.+?)(\/?)$/)) {
    return EntryDeleteLocation(matchArray[1], matchArray[2])
  }

  if (matchArray = url.match(/^\/entries\/(.+?)(\/?)$/)) {
    return EntryListLocation(matchArray[1])
  }

  if (url === '' || url.match(/^\/((entries)(\/)?)?$/)) {
    return DashboardLocation()
  }

  return NotFoundLocation()
}

export class LocationStore {
  @observable.ref public location!: AppLocation

  private readonly editorStore: EditorStore

  constructor(editorStore: EditorStore) {
    this.editorStore = editorStore

    window.addEventListener('popstate', () => {
      if (this.editorStore.hasUnsavedChanges) {
        let confirmed = window.confirm('You have unsaved changes, are you sure you want to go back?')

        if (!confirmed) {
          // Push current location back to the stack,
          // isn't the best solution if the user pressed forward instead of back
          return this.pushLocation(this.location, true)
        }
      }

      this.syncLocationFromURL()
    })

    reaction(() => this.editorStore.session, (session) => {
      if (session == undefined) {
        this.replaceLocation(LoginLocation())
      } else if (this.location.type === 'login') {
        this.replaceLocation(this.location.originalLocation || DashboardLocation())
      }
    })

    reaction(() => this.editorStore.isRestoringSession, isRestoringSession => {
      if (!isRestoringSession && this.location.type === 'restoringSession') {
        this.replaceLocation(this.location.originalLocation)
      }
    })
  }

  @action public syncLocationFromURL() {
    this.replaceLocation(locationForURLPath(window.location.pathname + window.location.search))
  }

  public syncURLFromLocation() {
    this.pushLocation(this.location, true)
  }

  sessionMiddleware(location: AppLocation): AppLocation {
    if (this.editorStore.isRestoringSession) {
      return RestoringSessionLocation(location)
    }

    if (location.type === 'login' && location.session) {
      this.editorStore.restoreSession(location.session)
      return RestoringSessionLocation(location.originalLocation || DashboardLocation())
    }

    if (location.type === 'login' && this.editorStore.session) {
      return DashboardLocation()
    }

    if (location.type !== 'login' && !this.editorStore.session) {
      return LoginLocation(location)
    }

    return location
  }

  @action public pushLocation(location: AppLocation, onlyUpdateURL: boolean = false) {
    if (location.type === LocationType.External) {
      window.open(location.url, '_blank')
    }

    location = this.sessionMiddleware(location)
    if (!onlyUpdateURL) this.location = location
    window.history.pushState(undefined, '', urlPathForLocation(location))
  }

  @action public replaceLocation(location: AppLocation, onlyUpdateURL: boolean = false) {
    if (location.type === LocationType.External) {
      window.open(location.url, '_blank')
    }

    location = this.sessionMiddleware(location)
    if (!onlyUpdateURL) this.location = location
    window.history.replaceState(undefined, '', urlPathForLocation(location))
  }
}
