import * as React from 'react'

import {style} from 'typestyle'

import {observer} from 'mobx-react'

import {ApplicationStore} from '../store/applicationStore'
import {LoginFormContainer} from './loginForm'
import {BaseView} from './baseView'
import {NotificationContainer} from '../ui/common/notification'
import {CenteredLoadingIndicator} from '../ui/common/loader'
import {Color} from '../ui/style'

export namespace RootView {
  export interface Props {
    applicationStore: ApplicationStore
  }
}

export const RootViewStyle = style({
  $debugName: 'RootView',

  backgroundColor: Color.primary.base,

  width: '100%',
  height: '100%'
})

@observer
export class RootView extends React.Component<RootView.Props> {
  public render() {
    const locationStore = this.props.applicationStore.locationStore
    let content: React.ReactNode

    if (locationStore.location.type === 'login') {
      content = <LoginFormContainer />
    } else if (locationStore.location.type === 'restoringSession') {
      content = <CenteredLoadingIndicator />
    } else {
      content = <BaseView applicationStore={this.props.applicationStore} />
    }

    return (
      <div className={RootViewStyle}>
        {content}
        <NotificationContainer store={this.props.applicationStore.notificationStore} />
      </div>
    )
  }
}
