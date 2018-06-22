import React from 'react'
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
      return `${basePath}/record/${location.slug}`
    case LocationType.EntryNew:
      return `${basePath}/record/${location.slug}/new`
    case LocationType.EntryEdit:
      return `${basePath}/record/${location.slug}/edit/${location.id}`
    case LocationType.EntryDelete:
      return `${basePath}/record/${location.slug}/delete/${location.id}`
    case LocationType.NotFound:
      return '${basePath}/404'
    case LocationType.NoPermission:
      return '${basePath}/403'
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

  if ((matchArray = url.match(/^\/record\/(.+?)\/new(\/?)$/))) {
    return EntryNewLocation(matchArray[1])
  }

  if ((matchArray = url.match(/^\/record\/(.+?)\/edit\/(.+?)(\/?)$/))) {
    return EntryEditLocation(matchArray[1], matchArray[2])
  }

  if ((matchArray = url.match(/^\/record\/(.+?)\/delete\/(.+?)(\/?)$/))) {
    return EntryDeleteLocation(matchArray[1], matchArray[2])
  }

  if ((matchArray = url.match(/^\/record\/(.+?)(\/?)$/))) {
    return EntryListLocation(matchArray[1])
  }

  if (url === '' || url.match(/^\/((record)(\/)?)?$/)) {
    return DashboardLocation()
  }

  return NotFoundLocation()
}

export interface LocationContext {
  location?: AppLocation
  shouldReplaceLocation: boolean
  hasUnsavedChanges: boolean
  pushLocation(location: AppLocation, onlyUpdateURL?: boolean): void
  replaceLocation(location: AppLocation, onlyUpdateURL?: boolean): void
}

export const LocationContext = React.createContext<LocationContext>({
  shouldReplaceLocation: false,
  hasUnsavedChanges: false,

  async pushLocation() {
    console.warn('No LocationProvider found!')
  },

  async replaceLocation() {
    console.warn('No LocationProvider found!')
  }
})

export interface LocationProviderProps {
  config: Config
  sessionContext: SessionContext
}

export class LocationProvider extends React.Component<LocationProviderProps, LocationContext> {
  constructor(props: LocationProviderProps) {
    super(props)

    this.state = {
      shouldReplaceLocation: false,
      hasUnsavedChanges: false,
      pushLocation: this.pushLocation,
      replaceLocation: this.replaceLocation
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

  public render() {
    return (
      <LocationContext.Provider value={this.state}>{this.props.children}</LocationContext.Provider>
    )
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

  public static getDerivedStateFromProps(
    props: LocationProviderProps,
    state: LocationContext
  ): Partial<LocationContext> | null {
    if (state.location) {
      if (state.location.type === 'login' && props.sessionContext.session) {
        return {
          location: state.location.originalLocation || DashboardLocation(),
          shouldReplaceLocation: true
        }
      }

      if (state.location.type !== 'login' && !props.sessionContext.session) {
        return {location: LoginLocation(state.location), shouldReplaceLocation: true}
      }
    }

    return null
  }
}

export const withLocation = createContextHOC(LocationContext, 'locationContext', 'withLocale')
export const LocationProviderContainer = withConfig(withSession(LocationProvider))
