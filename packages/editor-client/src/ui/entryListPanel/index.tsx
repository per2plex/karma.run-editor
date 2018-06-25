import * as React from 'react'

import {style} from 'typestyle'
import {IReactionDisposer, reaction} from 'mobx'
import {observer} from 'mobx-react'

import {EditorStore} from '../../store/editorStore'
import {EntryNewLocation} from '../../context/location'
import {ViewContext} from '../../api/karmafe/viewContext'
import {Spacing} from '../../ui/style'

import {EditEntryList, ChooseEntryList} from './list'
import {EntryFilterStore} from '../../filter/stores/entryFilterStore'
import {CenteredLoadingIndicator} from '../../ui/common/loader'
import {ViewContextPanelHeader} from '../../ui/common/panel/viewContextHeader'
import {PanelToolbar} from '../../ui/common/panel/toolbar'
import {Button, ButtonType, LocationButtonContainer} from '../../ui/common'
import {QuickSearchField, QuickSearchFieldStyle} from '../../filter/ui/searchField'
import {SortField, SortFieldStyle} from '../../filter/ui/sortField'
import {FilterList} from '../../filter/ui/filterList'
import {Panel} from '../../ui/common/panel'
import {PanelContent} from '../../ui/common/panel/content'
import {IconName} from '../../ui/common/icon'
import {PanelComponent} from '../../ui/panelManager'
import {NotificationType} from '../../context/notification'

export const EntryToolbarFilterStyle = style({
  display: 'flex',

  $nest: {
    [`> .${QuickSearchFieldStyle}`]: {
      marginRight: Spacing.largest
    },

    [`> .${SortFieldStyle}`]: {
      marginRight: Spacing.large,
      $nest: {'&:last-child': {marginRight: 0}}
    }
  }
})

export namespace EntryToolbarFilter {
  export interface Props {
    viewContext: ViewContext
    entryFilterStore: EntryFilterStore
  }
}

export class EntryToolbarFilter extends React.Component<EntryToolbarFilter.Props> {
  private handleFilterClick = () => {
    this.props.entryFilterStore.toggleFilterActive()
  }

  public render() {
    return (
      <div className={EntryToolbarFilterStyle}>
        <QuickSearchField store={this.props.entryFilterStore} />
        <SortField store={this.props.entryFilterStore} />
        {this.props.entryFilterStore.filterStores.length > 0 && (
          <Button
            icon={IconName.FilterList}
            type={ButtonType.Icon}
            onTrigger={this.handleFilterClick}
            selected={this.props.entryFilterStore.isFilterActive}
          />
        )}
      </div>
    )
  }
}

export namespace FilteredEntryListPanel {
  export type Props<P> = {
    editorStore: EditorStore
    notificationStore: any
    viewContext: ViewContext
  } & P

  export interface State {
    isLoading: boolean
    filterStore?: EntryFilterStore
  }
}

@observer
export class FilteredEntryListPanel<P = {}> extends React.Component<
  FilteredEntryListPanel.Props<P>,
  FilteredEntryListPanel.State
> {
  public state: FilteredEntryListPanel.State = {
    isLoading: true
  }

  private entrySyncDispose?: IReactionDisposer

  public componentWillMount() {
    if (!this.state.filterStore) {
      this.setState({
        filterStore: new EntryFilterStore(this.props.viewContext)
      })
    }

    this.entrySyncDispose = reaction(
      () => {
        const entries = this.props.editorStore.entries.get(this.props.viewContext.model[1])
        return entries ? entries.slice() : undefined
      },
      entries => {
        this.state.filterStore!.entries = entries
      }
    )
  }

  public componentWillUnmount() {
    this.entrySyncDispose!()
    this.state.filterStore!.dispose()
  }

  public async componentDidMount() {
    try {
      await this.props.editorStore.loadEntriesForModel(this.props.viewContext.model[1])
      this.setState({isLoading: false})
    } catch (err) {
      this.props.notificationStore.notify({
        message: err.message,
        type: NotificationType.Error
      })
    }
  }
}

export namespace EntryListPanel {
  export interface Props {
    disabled: boolean
    onEntryEdit: (viewContext: ViewContext, id: string) => void
    onEntryDelete: (viewContext: ViewContext, id: string) => void
    onNewEntry: (viewContext: ViewContext) => void
    onEntryChoose: (viewContext: ViewContext) => Promise<string | undefined>
  }
}

@observer
export class EntryListPanel extends FilteredEntryListPanel<EntryListPanel.Props>
  implements PanelComponent {
  // private handleLocationTrigger = (location: AppLocation) => {
  //   switch (location.type) {
  //     case LocationType.EntryEdit:
  //       return this.props.onEntryEdit(this.props.viewContext, location.id)
  //     case LocationType.EntryDelete:
  //       return this.props.onEntryDelete(this.props.viewContext, location.id)
  //     case LocationType.EntryNew:
  //       return this.props.onNewEntry(this.props.viewContext)
  //   }
  // }

  private handleEntryChoose = (model: string) => {
    const viewContext = this.props.editorStore.viewContextMap[model]
    return this.props.onEntryChoose(viewContext!)
  }

  public panelWillAppear() {}
  public panelWillDisappear() {}

  public render() {
    let content: React.ReactNode

    const createNewLink = (
      <LocationButtonContainer
        type={ButtonType.Icon}
        icon={IconName.NewDocument}
        label="Create New"
        location={EntryNewLocation(this.props.viewContext.slug)}
      />
    )

    const toolbarFilter = (
      <EntryToolbarFilter
        viewContext={this.props.viewContext}
        entryFilterStore={this.state.filterStore!}
      />
    )

    const filterList = this.state.filterStore!.isFilterActive ? (
      <FilterList store={this.state.filterStore!} onEntryChoose={this.handleEntryChoose} />
    ) : (
      undefined
    )

    if (this.state.isLoading || this.state.filterStore!.isLoading) {
      content = <CenteredLoadingIndicator />
    } else if (this.state.filterStore!.filteredEntries.length === 0) {
      content = <div>No Results</div>
    } else {
      content = (
        <EditEntryList
          viewContext={this.props.viewContext}
          entries={this.state.filterStore!.filteredEntries}
          reverseTags={this.props.editorStore.reverseTags}
        />
      )
    }

    return (
      <Panel>
        <ViewContextPanelHeader viewContext={this.props.viewContext} prefix="List" />
        <PanelToolbar left={createNewLink} right={toolbarFilter} drawer={filterList} />
        <PanelContent>{content}</PanelContent>
      </Panel>
    )
  }
}

export namespace ChooseEntryListPanel {
  export interface Props {
    disabled: boolean
    onEntryChosen: (viewContext: ViewContext, id: string | undefined) => void
    onEntryChoose: (viewContext: ViewContext) => Promise<string | undefined>
  }
}

@observer
export class ChooseEntryListPanel extends FilteredEntryListPanel<ChooseEntryListPanel.Props>
  implements PanelComponent {
  private handleLinkClick = (id?: string) => {
    this.props.onEntryChosen(this.props.viewContext, id)
  }

  private handleEntryChoose = (model: string) => {
    const viewContext = this.props.editorStore.viewContextMap[model]
    return this.props.onEntryChoose(viewContext!)
  }

  public panelWillAppear() {}
  public panelWillDisappear() {}

  public render() {
    let content: React.ReactNode

    const cancelLinkButton = (
      <Button
        type={ButtonType.Icon}
        icon={IconName.Close}
        onTrigger={this.handleLinkClick}
        label="Cancel"
      />
    )

    const toolbarFilter = (
      <EntryToolbarFilter
        viewContext={this.props.viewContext}
        entryFilterStore={this.state.filterStore!}
      />
    )

    const filterList = this.state.filterStore!.isFilterActive ? (
      <FilterList store={this.state.filterStore!} onEntryChoose={this.handleEntryChoose} />
    ) : (
      undefined
    )

    if (this.state.filterStore!.isLoading) {
      content = <CenteredLoadingIndicator />
    } else if (this.state.filterStore!.filteredEntries.length === 0) {
      content = <div>No Results</div>
    } else {
      content = (
        <ChooseEntryList
          viewContext={this.props.viewContext}
          entries={this.state.filterStore!.filteredEntries}
          reverseTags={this.props.editorStore.reverseTags}
          onChoose={this.handleLinkClick}
        />
      )
    }

    return (
      <Panel>
        <ViewContextPanelHeader viewContext={this.props.viewContext} prefix="Choose" />
        <PanelToolbar left={cancelLinkButton} right={toolbarFilter} drawer={filterList} />
        <PanelContent>{content}</PanelContent>
      </Panel>
    )
  }
}
