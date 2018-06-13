import * as shortid from 'shortid'
import {observable, action, runInAction, IObservableArray} from 'mobx'

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

export class NotificationStore {
  public readonly notifications: IObservableArray<NotificationItem> = observable.shallowArray()

  @action
  public notify(notification: Notification) {
    const notificationItem = {
      ...notification,
      id: shortid.generate()
    }

    this.notifications.push(notificationItem)

    setTimeout(() => {
      runInAction('notify', () => {
        const index = this.notifications.indexOf(notificationItem)
        this.notifications.splice(index, 1)
      })
    }, 5000)
  }
}
