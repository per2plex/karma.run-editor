import React from 'react'
import {Ref, MetarializedRecord} from '@karma.run/sdk'
import {Filter, Sort, ConditionType, Condition} from '@karma.run/editor-common'

import {Panel} from '../common/panel'
import {ViewContextPanelHeader} from '../common/panel/viewContextHeader'
import {SessionContext, withSession} from '../../context/session'
import {PanelToolbar} from '../common/panel/toolbar'
import {ViewContext} from '../../api/newViewContext'
import {CenteredLoadingIndicator} from '../common/loader'
import {Button, ButtonType, FlexList} from '../common'
import {refToString} from '../../util/ref'
import {IconName} from '../common/icon'
import {PanelContent} from '../common/panel/content'
import {ToolbarFilter} from './filterToolbar'
import {withLocale, LocaleContext} from '../../context/locale'
import {RecordItem} from './recordItem'
import memoize from 'memoize-one'

import {
  sortConfigurationsForViewContext,
  SortConfigration,
  filterConfigurationsForViewContext,
  objectPathForField
} from '../../filter/configuration'

export interface RecordListAction {
  key: string
  icon: IconName
  label: string
  onTrigger: (id: Ref) => void
}

export interface RecordListProps {
  viewContext: ViewContext
  sessionContext: SessionContext
  localeContext: LocaleContext
  records?: MetarializedRecord[]
  actions: RecordListAction[]
}

export class RecordList extends React.Component<RecordListProps> {
  public render() {
    if (!this.props.records) return <CenteredLoadingIndicator />

    // TODO: Empty view
    if (this.props.records.length === 0) return <>No results</>

    return (
      <>
        {this.props.records.map(record => (
          <RecordItem
            key={refToString(record.id)}
            record={record}
            viewContext={this.props.viewContext}
            reverseTagMap={this.props.sessionContext.reverseTagMap}
            localeContext={this.props.localeContext}>
            {this.props.actions.map(action => (
              <Button
                key={action.key}
                type={ButtonType.Icon}
                data={record.id}
                onTrigger={action.onTrigger}
                icon={action.icon}
                label={action.label}
              />
            ))}
          </RecordItem>
        ))}
      </>
    )
  }
}

export interface RootRecordListPanelProps {
  model: Ref
  sessionContext: SessionContext
  localeContext: LocaleContext
  disabled: boolean
  onNewRecord: (model: Ref) => void
  onEditRecord: (id: Ref) => void
  onDeleteRecord: (id: Ref) => void
}

export interface RootRecordListPanelState {
  records?: MetarializedRecord[]
  limit: number
  offset: number
  hasMore: boolean
  filter?: Filter
  sort?: Sort
  sortValue?: SortConfigration
  sortDescending: boolean
  quickSearchValue: string
}

export class RootRecordListPanel extends React.Component<
  RootRecordListPanelProps,
  RootRecordListPanelState
> {
  public state: RootRecordListPanelState = {
    limit: 50,
    offset: 0,
    hasMore: true,
    sortDescending: false,
    quickSearchValue: ''
  }

  private handleNew = () => {
    this.props.onNewRecord(this.props.model)
  }

  private handleNextPage = () => {
    this.nextPage()
  }

  private handlePreviousPage = () => {
    this.previousPage()
  }

  private handleSortChange = (value: SortConfigration, descending: boolean) => {
    this.setState(
      {
        sortValue: value,
        sortDescending: descending
      },
      () => {
        this.loadRecords(this.state.offset)
      }
    )
  }

  private handleQuickSearchChange = (value: string) => {
    this.setState(
      {
        offset: 0,
        quickSearchValue: value
      },
      () => {
        this.loadRecords(this.state.offset)
      }
    )
  }

  private get viewContext(): ViewContext | undefined {
    return this.props.sessionContext.viewContextMap.get(this.props.model)
  }

  private get sortValue(): SortConfigration {
    return this.state.sortValue || this.viewContext!.sortConfigurations[0]
  }

  private get sort(): Sort {
    return {
      path: this.sortValue.path,
      type: this.sortValue.type,
      descending: this.state.sortDescending
    }
  }

  private async previousPage() {
    this.loadRecords(this.state.offset - this.state.limit)
  }

  private async nextPage() {
    this.loadRecords(this.state.offset + this.state.limit)
  }

  private async loadRecords(offset: number) {
    if (!this.viewContext) return

    this.setState({offset, records: undefined})

    const filters: Condition[] = []
    // const fields = this.viewContext.fields
    // const descriptionKeyPaths = this.viewContext.descriptionKeyPaths

    // if (this.state.quickSearchValue.trim() !== '') {
    //   for (const keyPath of descriptionKeyPaths) {
    //     const field = findKeyPath(keyPath, fields)
    //     if (!field) continue

    //     const objectPath = objectPathForField(field, fields)

    //     filters.push({
    //       type: ConditionType.StringIncludes,
    //       path: objectPath,
    //       value: this.state.quickSearchValue.trim()
    //     })
    //   }
    // }

    // Request one more than the limit to check if there's another page
    const records = await this.props.sessionContext.getRecordList(
      this.viewContext.model,
      this.state.limit + 1,
      offset,
      this.sort,
      filters
    )

    const hasMore = records.length > this.state.limit

    if (hasMore) {
      // Remove extranous record
      records.splice(-1, 1)
    }

    this.setState({records, hasMore})
  }

  private filterConfigurationsForViewContext = memoize((viewContext?: ViewContext) => {
    if (!viewContext) return []
    return filterConfigurationsForViewContext(viewContext)
  })

  private get filterConfigurations() {
    return this.filterConfigurationsForViewContext(this.viewContext)
  }

  public componentDidMount() {
    this.loadRecords(this.state.offset)
  }

  public render() {
    const sessionContext = this.props.sessionContext
    const viewContext = this.viewContext
    const _ = this.props.localeContext.get

    // TODO: Error panel
    if (!viewContext) return <div>Not Found</div>

    return (
      <Panel>
        <ViewContextPanelHeader viewContext={viewContext} prefix={_('listRecordPrefix')} />
        <PanelToolbar
          left={
            <FlexList spacing="medium">
              <Button
                type={ButtonType.Icon}
                icon={IconName.NewDocument}
                onTrigger={this.handleNew}
                label={_('newRecord')}
              />
              <Button
                type={ButtonType.Icon}
                icon={IconName.ListArrowUp}
                onTrigger={this.handlePreviousPage}
                disabled={this.state.records == undefined || this.state.offset <= 0}
              />
              <Button
                type={ButtonType.Icon}
                icon={IconName.ListArrowDown}
                onTrigger={this.handleNextPage}
                disabled={this.state.records == undefined || !this.state.hasMore}
              />
            </FlexList>
          }
          right={
            <ToolbarFilter
              viewContext={viewContext}
              sortConfigurations={viewContext.sortConfigurations}
              sortValue={this.sortValue}
              sortDescending={this.state.sortDescending}
              onSortChange={this.handleSortChange}
              filterConfigurations={this.filterConfigurations}
              quickSearchValue={this.state.quickSearchValue}
              onQuickSearchChange={this.handleQuickSearchChange}
            />
          }
        />
        <PanelContent>
          <RecordList
            viewContext={viewContext}
            sessionContext={sessionContext}
            localeContext={this.props.localeContext}
            records={this.state.records}
            actions={[
              {
                key: 'edit',
                icon: IconName.EditDocument,
                label: _('editRecord'),
                onTrigger: this.props.onEditRecord
              },
              {
                key: 'delete',
                icon: IconName.DeleteDocument,
                label: _('deleteRecord'),
                onTrigger: this.props.onDeleteRecord
              }
            ]}
          />
        </PanelContent>
      </Panel>
    )
  }
}

export const RootRecordListPanelContainer = withLocale(withSession(RootRecordListPanel))
