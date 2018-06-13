import * as React from 'react'
import {style} from 'typestyle'
import {Select, SelectStyle, Button, ButtonType, SelectType} from '../../ui/common'
import {observer} from 'mobx-react'
import {Color, FontWeight, Spacing} from '../../ui/style'
import {EntryFilterStore} from '../stores/entryFilterStore'
import {IconName} from '../../ui/common/icon'

export const SortFieldStyle = style({
  $debugName: 'SortFieldStyle',

  display: 'flex',
  alignItems: 'center',

  $nest: {
    '> .label': {
      marginRight: Spacing.medium,
      // textTransform: 'uppercase',
      color: Color.primary.base,
      fontWeight: FontWeight.bold,
      fontSize: '1.5rem'
    },

    [`> .${SelectStyle}`]: {
      width: '22rem'
    }
  }
})

export namespace SortField {
  export interface Props {
    store: EntryFilterStore
  }
}

@observer
export class SortField extends React.Component<SortField.Props> {
  private handleSortChange = (key: string | undefined) => {
    this.props.store.setSelectedSortIndex(parseInt(key!))
  }

  private handleSortDirectionChange = () => {
    this.props.store.toggleSortDescending()
  }

  public render() {
    const options: Select.Option[] = this.props.store.sortConfigurations.map((config, index) => ({
      key: index.toString(),
      label: config.label
    }))

    return (
      <div className={SortFieldStyle}>
        <div className="label">Sort</div>
        <Select
          options={options}
          type={SelectType.Light}
          onChange={this.handleSortChange}
          value={this.props.store.selectedSortIndex.toString()}
          disableUnselectedOption
        />
        <Button
          type={ButtonType.Icon}
          icon={this.props.store.shouldSortDescending ? IconName.ArrowUp : IconName.ArrowDown}
          onTrigger={this.handleSortDirectionChange}
        />
      </div>
    )
  }
}
