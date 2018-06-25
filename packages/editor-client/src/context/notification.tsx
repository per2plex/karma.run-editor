import React from 'react'
import * as shortid from 'shortid'
import {createContextHOC} from './helper'

export enum NotificationType {
  Info = 'neutral',
  Success = 'success',
  Error = 'error'
}

export interface Notification {
  message: string
  type: NotificationType
}

export interface NotificationItem extends Notification {
  id: string
}

export const notificationDisplayTime = 5000

export interface NotificationContext {
  notifications: NotificationItem[]
  notify(notification: Notification): void
}

export const NotificationContext = React.createContext<NotificationContext>({
  notifications: [],
  notify() {
    console.warn('No NotificationProvider found!')
  }
})

export class NotificationProvider extends React.Component<{}, NotificationContext> {
  constructor(props: {}) {
    super(props)

    this.state = {
      notifications: [],
      notify: this.notify
    }
  }

  private notify = (notification: Notification) => {
    const notificationItem = {...notification, id: shortid.generate()}

    this.setState({
      notifications: [...this.state.notifications, notificationItem]
    })

    setTimeout(() => {
      const index = this.state.notifications.indexOf(notificationItem)

      this.setState({
        notifications: this.state.notifications.slice(index + 1)
      })
    }, notificationDisplayTime)
  }

  public render() {
    return (
      <NotificationContext.Provider value={this.state}>
        {this.props.children}
      </NotificationContext.Provider>
    )
  }
}

export const withNotification = createContextHOC(
  NotificationContext,
  'notificationContext',
  'withNotification'
)
