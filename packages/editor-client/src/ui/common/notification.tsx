import * as React from 'react'
import {style} from 'typestyle'
import {Spacing, Color} from '../style'
import {Notification, NotificationStore} from '../../store/notificationStore'
import {observer} from 'mobx-react'

export const NotificationViewStyle = style({
  $debugName: 'NotificationView',
  width: '30vw',
  padding: Spacing.medium,
  marginBottom: Spacing.small,
  border: '1px solid',

  $nest: {
    '&[data-type="neutral"]': {
      backgroundColor: Color.neutral.light2,
      borderColor: Color.neutral.light1
    },

    '&[data-type="success"]': {
      borderColor: Color.success.base,
      backgroundColor: Color.success.light2,
      color: Color.success.dark1
    },

    '&[data-type="error"]': {
      borderColor: Color.error.light1,
      backgroundColor: Color.error.light2,
      color: Color.error.dark1
    }
  }
})

export namespace NotificationView {
  export interface Props {
    notification: Notification
  }
}

export const NotificationView: React.StatelessComponent<NotificationView.Props> = props => {
  return (
    <div className={NotificationViewStyle} data-type={props.notification.type}>
      {props.notification.message}
    </div>
  )
}

export const NotificationContainerStyle = style({
  $debugName: 'NotificationContainer',

  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  position: 'absolute',
  left: 0,
  right: 0,
  top: Spacing.medium,
  bottom: 0,
  pointerEvents: 'none',
  zIndex: 1000,
  overflow: 'hidden'
})

export namespace NotificationContainer {
  export interface Props {
    store: NotificationStore
  }
}

export const NotificationContainer = observer<
  React.StatelessComponent<NotificationContainer.Props>
>(props => {
  const notifications = props.store.notifications.map(notification => (
    <NotificationView key={notification.id} notification={notification} />
  ))

  return <div className={NotificationContainerStyle}>{notifications}</div>
})
