import React from 'react'
import memoize from 'memoize-one'
import {Session} from '@karma.run/sdk'
import qs from 'qs'

import {SessionContext, withSession} from './session'
import {createContextHOC} from './helper'
import {withConfig, Config} from './config'

export const enum LocationType {
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
  | LoginLocation
  | DashboardLocation
  | EntryListLocation
  | EntryNewLocation
  | EntryEditLocation
  | EntryDeleteLocation
  | NotFoundLocation
  | NoPermissionLocation
  | ExternalLocation

export function urlPathForLocation(basePath: string, location: AppLocation): string {
  switch (location.type) {
    case LocationType.Login:
      return `${basePath}/login`
    case LocationType.Dashboard:
      return `${basePath}/`
    case LocationType.EntryList:
      return `${basePath}/records/${location.slug}`
    case LocationType.EntryNew:
      return `${basePath}/records/${location.slug}/new`
    case LocationType.EntryEdit:
      return `${basePath}/records/${location.slug}/edit/${location.id}`
    case LocationType.EntryDelete:
      return `${basePath}/records/${location.slug}/delete/${location.id}`
    case LocationType.NotFound:
      return `${basePath}/404`
    case LocationType.NoPermission:
      return `${basePath}/403`
    case LocationType.External:
      return location.url
  }
}

export function locationForURLPath(basePath: string, url: string): AppLocation {
  url = url.replace(window.location.origin, '')
  url = url.substring(basePath.length)

  let matchArray: RegExpMatchArray | null

  if ((matchArray = url.match(/^\/login(?:\?(.*))?(\/?)$/))) {
    const query = qs.parse(matchArray[1])

    const username = query.username
    const signature = query.signature

    if (typeof username === 'string' && typeof signature === 'string') {
      return LoginLocation(undefined, {username, signature})
    } else {
      return LoginLocation()
    }
  }

  if ((matchArray = url.match(/^\/404(\/?)$/))) return NotFoundLocation()
  if ((matchArray = url.match(/^\/403(\/?)$/))) return NoPermissionLocation()

  if ((matchArray = url.match(/^\/records\/(.+?)\/new(\/?)$/))) {
    return EntryNewLocation(matchArray[1])
  }

  if ((matchArray = url.match(/^\/records\/(.+?)\/edit\/(.+?)(\/?)$/))) {
    return EntryEditLocation(matchArray[1], matchArray[2])
  }

  if ((matchArray = url.match(/^\/records\/(.+?)\/delete\/(.+?)(\/?)$/))) {
    return EntryDeleteLocation(matchArray[1], matchArray[2])
  }

  if ((matchArray = url.match(/^\/records\/(.+?)(\/?)$/))) {
    return EntryListLocation(matchArray[1])
  }

  if (url === '' || url.match(/^\/((records)(\/)?)?$/)) {
    return DashboardLocation()
  }

  return NotFoundLocation()
}

export interface LocationActionContext {
  pushLocation(location: AppLocation): void
  replaceLocation(location: AppLocation): void
  locationForURLPath(path: string): AppLocation
  urlPathForLocation(location: AppLocation): string
}

export const defaultActionContext = {
  async pushLocation() {
    console.warn('No LocationProvider found!')
  },

  async replaceLocation() {
    console.warn('No LocationProvider found!')
  },

  locationForURLPath() {
    console.warn('No LocationProvider found!')
    return NotFoundLocation()
  },

  urlPathForLocation() {
    console.warn('No LocationProvider found!')
    return ''
  }
}

export const LocationActionContext = React.createContext<LocationActionContext>({
  ...defaultActionContext
})

export interface LocationActionProviderProps {
  locationContext: LocationContext
}

export class LocationActionProvider extends React.Component<
  LocationActionProviderProps,
  LocationActionContext
> {
  public shouldComponentUpdate(nextProps: LocationActionProviderProps) {
    const locationContext = this.props.locationContext
    const nextLocationContext = nextProps.locationContext

    if (
      locationContext.pushLocation !== nextLocationContext.pushLocation ||
      locationContext.replaceLocation !== nextLocationContext.replaceLocation ||
      locationContext.locationForURLPath !== nextLocationContext.locationForURLPath ||
      locationContext.urlPathForLocation !== nextLocationContext.urlPathForLocation
    ) {
      return true
    }

    return false
  }

  private getActionContext = memoize(
    (
      pushLocation: LocationActionContext['pushLocation'],
      replaceLocation: LocationActionContext['replaceLocation'],
      locationForURLPath: LocationActionContext['locationForURLPath'],
      urlPathForLocation: LocationActionContext['urlPathForLocation']
    ): LocationActionContext => {
      return {
        pushLocation,
        replaceLocation,
        locationForURLPath,
        urlPathForLocation
      }
    }
  )

  public render() {
    const locationContext = this.props.locationContext
    const actionContext = this.getActionContext(
      locationContext.pushLocation,
      locationContext.replaceLocation,
      locationContext.locationForURLPath,
      locationContext.urlPathForLocation
    )

    return (
      <LocationActionContext.Provider value={actionContext}>
        {this.props.children}
      </LocationActionContext.Provider>
    )
  }
}

export interface LocationStateContext {
  location?: AppLocation
  shouldReplaceLocation: boolean
  hasUnsavedChanges: boolean
}

export type LocationContext = LocationStateContext & LocationActionContext

export const LocationContext = React.createContext<LocationContext>({
  shouldReplaceLocation: false,
  hasUnsavedChanges: false,
  ...defaultActionContext
})

export interface LocationProviderProps {
  config: Config
  sessionContext: SessionContext
}

export function sessionContextMiddleware(
  location: AppLocation,
  sessionContext: SessionContext
): AppLocation {
  if (location.type === 'login' && sessionContext.session) {
    return location.originalLocation
      ? sessionContextMiddleware(location.originalLocation, sessionContext)
      : DashboardLocation()
  }

  if (location.type !== 'login' && !sessionContext.session) {
    return LoginLocation(location)
  }

  if (
    location.type === LocationType.EntryList &&
    !sessionContext.viewContextSlugMap.get(location.slug)
  ) {
    return NotFoundLocation()
  }

  return location
}

export class LocationProvider extends React.Component<LocationProviderProps, LocationContext> {
  constructor(props: LocationProviderProps) {
    super(props)

    this.state = {
      shouldReplaceLocation: false,
      hasUnsavedChanges: false,
      pushLocation: this.pushLocation,
      replaceLocation: this.replaceLocation,
      locationForURLPath: this.locationForURLPath,
      urlPathForLocation: this.urlPathForLocation
    }
  }

  public componentDidMount() {
    window.addEventListener('popstate', () => {
      // TODO: Check for unsaved changes
      if (false) {
        const confirmed = window.confirm(
          'You have unsaved changes, are you sure you want to go back?'
        )

        if (!confirmed && this.state.location) {
          // Push current location back to the stack,
          // isn't the best solution if the user pressed forward instead of back
          window.history.pushState(
            undefined,
            '',
            urlPathForLocation(this.props.config.basePath, this.state.location!)
          )
          return
        }
      }

      this.syncLocationFromURL()
    })

    if (!this.state.location) {
      this.syncLocationFromURL()
    }
  }

  private syncLocationFromURL() {
    this.replaceLocation(
      locationForURLPath(
        this.props.config.basePath,
        window.location.pathname + window.location.search
      )
    )
  }

  public locationForURLPath = (path: string): AppLocation => {
    return locationForURLPath(this.props.config.basePath, path)
  }

  public urlPathForLocation = (location: AppLocation): string => {
    return urlPathForLocation(this.props.config.basePath, location)
  }

  public pushLocation = (location: AppLocation) => {
    if (location.type === LocationType.External) {
      window.open(location.url, '_blank')
      return
    }

    this.setState({location, shouldReplaceLocation: false})
  }

  public replaceLocation = (location: AppLocation) => {
    if (location.type === LocationType.External) {
      window.open(location.url, '_blank')
      return
    }

    this.setState({location, shouldReplaceLocation: true})
  }

  public componentDidUpdate(_prevProps: LocationProviderProps, prevState: LocationContext) {
    if (!window) return

    // Sync location to history
    if (this.state.location && this.state.location !== prevState.location) {
      if (this.state.shouldReplaceLocation) {
        window.history.replaceState(
          undefined,
          '',
          urlPathForLocation(this.props.config.basePath, this.state.location)
        )
      } else {
        window.history.pushState(
          undefined,
          '',
          urlPathForLocation(this.props.config.basePath, this.state.location)
        )
      }
    }
  }

  public render() {
    return (
      <LocationContext.Provider value={this.state}>
        <LocationActionProvider locationContext={this.state}>
          {this.props.children}
        </LocationActionProvider>
      </LocationContext.Provider>
    )
  }

  public static getDerivedStateFromProps(
    props: LocationProviderProps,
    state: LocationContext
  ): Partial<LocationContext> | null {
    if (state.location) {
      return {
        location: sessionContextMiddleware(state.location, props.sessionContext)
      }
    }

    return null
  }
}

export const withLocation = createContextHOC(LocationContext, 'locationContext', 'withLocation')
export const withLocationAction = createContextHOC(
  LocationActionContext,
  'locationActionContext',
  'withLocationAction'
)

export const LocationProviderContainer = withConfig(withSession(LocationProvider))
