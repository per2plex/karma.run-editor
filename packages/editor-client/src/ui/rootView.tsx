import * as React from 'react'

import {style} from 'typestyle'
import {LoginFormContainer} from './loginForm'
import {BaseView} from './baseView'
import {NotificationContainer} from '../ui/common/notification'
import {CenteredLoadingIndicator} from '../ui/common/loader'
import {Color} from '../ui/style'
import {withLocation, LocationContext} from '../context/location'
import {AppLocation} from '../store/locationStore'
import {applicationStore} from '../store/applicationStore'

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
      return <LoginFormContainer />

    case 'restoringSession':
      return <CenteredLoadingIndicator />

    default:
      return <BaseView applicationStore={applicationStore} />
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
