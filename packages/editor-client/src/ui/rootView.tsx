import * as React from 'react'

import {LoginContainer} from './login'
import {NotificationViewContainer} from '../ui/common/notification'
import {CenteredLoadingIndicator} from '../ui/common/loader'
import {withLocation, LocationContext, AppLocation} from '../context/location'
import {AsyncComponent} from './asyncComponent'

export interface RootViewProps {
  locationContext: LocationContext
}

export function rootViewForLocation(location?: AppLocation) {
  if (!location) return <CenteredLoadingIndicator />

  switch (location.type) {
    case 'login':
      return <LoginContainer session={location.session} />

    default:
      return (
        <AsyncComponent>
          {async () => {
            const {BaseViewContainer} = await import('./baseView')
            return <BaseViewContainer />
          }}
        </AsyncComponent>
      )
  }
}

export class RootView extends React.Component<RootViewProps> {
  public render() {
    return (
      <>
        {rootViewForLocation(this.props.locationContext.location)}
        <NotificationViewContainer />
      </>
    )
  }
}

export const RootViewContainer = withLocation(RootView)
