import * as React from 'react'

import {style} from 'typestyle'
import {LoginContainer} from './login'
import {NotificationContainer} from '../ui/common/notification'
import {CenteredLoadingIndicator} from '../ui/common/loader'
import {Color} from '../ui/style'
import {withLocation, LocationContext} from '../context/location'
import {AppLocation} from '../store/locationStore'
import {applicationStore} from '../store/applicationStore'
import {AsyncComponent} from './asyncComponent'

export interface RootViewProps {
  locationContext: LocationContext
}

export const RootViewStyle = style({
  $debugName: 'RootView',

  backgroundColor: Color.primary.base,

  width: '100%',
  height: '100%'
})

export function rootViewForLocation(location?: AppLocation) {
  if (!location) return <CenteredLoadingIndicator />

  switch (location.type) {
    case 'login':
      return <LoginContainer originalLocation={location.originalLocation} />

    case 'restoringSession':
      return <CenteredLoadingIndicator />

    default:
      return (
        <AsyncComponent>
          {async () => {
            // const {BaseView} = await import('./baseView')
            // return <BaseView applicationStore={applicationStore} />
            return <div />
          }}
        </AsyncComponent>
      )
  }
}

export class RootView extends React.Component<RootViewProps> {
  public render() {
    return (
      <div className={RootViewStyle}>
        {rootViewForLocation(this.props.locationContext.location)}
        <NotificationContainer store={applicationStore.notificationStore} />
      </div>
    )
  }
}

export const RootViewContainer = withLocation(RootView)
