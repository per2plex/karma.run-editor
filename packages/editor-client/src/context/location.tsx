import React from 'react'
import {Omit} from '@karma.run/editor-common'

import {
  AppLocation,
  LocationType,
  LoginLocation,
  DashboardLocation,
  urlPathForLocation,
  locationForURLPath
} from '../store/locationStore'

import {SessionContext, withSession} from './session'

export interface LocationContext {
  location?: AppLocation
  pushLocation(location: AppLocation, onlyUpdateURL?: boolean): void
  replaceLocation(location: AppLocation, onlyUpdateURL?: boolean): void
}

export const LocationContext = React.createContext<LocationContext>({
  async pushLocation() {
    console.warn('No LocationProvider found!')
  },

  async replaceLocation() {
    console.warn('No LocationProvider found!')
  }
})

export interface LocationProviderProps {
  sessionContext: SessionContext
}

export class LocationProvider extends React.Component<LocationProviderProps, LocationContext> {
  constructor(props: LocationProviderProps) {
    super(props)

    this.state = {
      pushLocation: this.pushLocation,
      replaceLocation: this.replaceLocation
    }
  }

  private sessionMiddleware(location: AppLocation): AppLocation {
    // TODO: Restoring session
    // if (this.props.sessionContext.isRestoringSession) {
    //   return RestoringSessionLocation(location)
    // }

    // if (location.type === 'login' && location.session) {
    //   this.editorStore.restoreSession(location.session)
    //   return RestoringSessionLocation(location.originalLocation || DashboardLocation())
    // }

    if (location.type === 'login' && this.props.sessionContext.session) {
      return DashboardLocation()
    }

    if (location.type !== 'login' && !this.props.sessionContext.session) {
      return LoginLocation(location)
    }

    return location
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
          return this.pushLocation(this.state.location!, true)
        }
      }

      this.syncLocationFromURL()
    })

    if (!this.state.location) {
      this.syncLocationFromURL()
    }
  }

  private syncLocationFromURL() {
    this.replaceLocation(locationForURLPath(window.location.pathname + window.location.search))
  }

  public pushLocation = (location: AppLocation, onlyUpdateURL: boolean = false) => {
    if (location.type === LocationType.External) {
      window.open(location.url, '_blank')
      return
    }

    location = this.sessionMiddleware(location)

    if (!onlyUpdateURL) {
      this.setState({location})
    }

    window.history.pushState(undefined, '', urlPathForLocation(location))
  }

  public replaceLocation = (location: AppLocation, onlyUpdateURL: boolean = false) => {
    if (location.type === LocationType.External) {
      window.open(location.url, '_blank')
      return
    }

    location = this.sessionMiddleware(location)

    if (!onlyUpdateURL) {
      this.setState({location})
    }

    window.history.replaceState(undefined, '', urlPathForLocation(location))
  }

  public render() {
    return (
      <LocationContext.Provider value={this.state}>{this.props.children}</LocationContext.Provider>
    )
  }
}

export function withLocation<T extends {locationContext: LocationContext}>(
  Component: React.ComponentType<T>
): React.StatelessComponent<Omit<T, 'locationContext'>> {
  return props => (
    <LocationContext.Consumer>
      {locationContext => <Component {...props} locationContext={locationContext} />}
    </LocationContext.Consumer>
  )
}

export const LocationProviderContainer = withSession(LocationProvider)
