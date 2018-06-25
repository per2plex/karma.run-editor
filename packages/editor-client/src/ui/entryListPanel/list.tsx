import * as React from 'react'
import {observer} from 'mobx-react'

import {EntryItem} from './item'
import {Button, ButtonType, LocationButtonContainer} from '../../ui/common'
import {ViewContext} from '../../api/karmafe/viewContext'
import {Entry} from '../../api/karma'
import {EntryEditLocation, EntryDeleteLocation} from '../../context/location'
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
  }
}

@observer
export class EditEntryList extends React.Component<EditEntryList.Props> {
  public render() {
    return (
      <div className={EditEntryList.Style}>
        {this.props.entries.map(entry => {
          return (
            <EntryItem
              key={entry.id}
              entry={entry}
              viewContext={this.props.viewContext}
              reverseTags={this.props.reverseTags}>
              <LocationButtonContainer
                type={ButtonType.Icon}
                label="Edit"
                location={EntryEditLocation(this.props.viewContext.slug, entry.id)}
                icon={IconName.EditDocument}
              />
              <LocationButtonContainer
                type={ButtonType.Icon}
                label="Delete"
                location={EntryDeleteLocation(this.props.viewContext.slug, entry.id)}
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
