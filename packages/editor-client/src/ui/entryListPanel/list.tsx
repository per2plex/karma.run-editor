import * as React from 'react'
import {observer} from 'mobx-react'

import {EntryItem} from './item'
import {LocationButton, Button, ButtonType} from '../../ui/common'
import {ViewContext} from '../../api/karmafe/viewContext'
import {Entry} from '../../api/karma'
import {EntryEditLocation, EntryDeleteLocation, AppLocation} from '../../store/locationStore'
import {ObjectMap} from '@karma.run/editor-common'
import {style} from 'typestyle'
import {Spacing} from '../../ui/style'
import {IconName} from '../../ui/common/icon'
import {marginTopExceptFirst} from '../../util/style'

export namespace EditEntryList {
  export interface Props {
    viewContext: ViewContext
    entries: Entry[]
    reverseTags: ObjectMap<string>
    onLocationTrigger: (location: AppLocation) => void
  }
}

@observer
export class EditEntryList extends React.Component<EditEntryList.Props> {
  public render() {
    return (
      <div className={EditEntryList.Style}>
        {this.props.entries.map(entry => {
          const editLocation = EntryEditLocation(
            this.props.viewContext.slug || this.props.viewContext.model,
            entry.id
          )

          const deleteLocation = EntryDeleteLocation(
            this.props.viewContext.slug || this.props.viewContext.model,
            entry.id
          )

          return (
            <EntryItem
              key={entry.id}
              entry={entry}
              viewContext={this.props.viewContext}
              reverseTags={this.props.reverseTags}>
              <LocationButton
                type={ButtonType.Icon}
                label="Edit"
                location={editLocation}
                onTrigger={this.props.onLocationTrigger}
                icon={IconName.EditDocument}
              />
              <LocationButton
                type={ButtonType.Icon}
                label="Delete"
                location={deleteLocation}
                onTrigger={this.props.onLocationTrigger}
                icon={IconName.DeleteDocument}
              />
            </EntryItem>
          )
        })}
      </div>
    )
  }
}

export namespace ChooseEntryList {
  export interface Props {
    viewContext: ViewContext
    entries: Entry[]
    reverseTags: ObjectMap<string>
    onChoose: (id: string) => void
  }
}

@observer
export class ChooseEntryList extends React.Component<ChooseEntryList.Props> {
  public render() {
    return (
      <div className={EditEntryList.Style}>
        {this.props.entries.map(entry => (
          <EntryItem
            key={entry.id}
            entry={entry}
            viewContext={this.props.viewContext}
            reverseTags={this.props.reverseTags}>
            <Button
              type={ButtonType.Icon}
              data={entry.id}
              onTrigger={this.props.onChoose}
              icon={IconName.ChooseDocument}
              label="Choose"
            />
          </EntryItem>
        ))}
      </div>
    )
  }
}

export namespace EditEntryList {
  export const Style = style({
    $debugName: 'EditEntryList',

    $nest: {
      [`.${EntryItem.Style}`]: {
        width: '100%',
        ...marginTopExceptFirst(Spacing.medium)
      }
    }
  })
}
