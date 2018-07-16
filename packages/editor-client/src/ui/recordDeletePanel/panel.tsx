import React from 'react'
import {Ref} from '@karma.run/sdk'
import {Filter, Sort, ConditionType, Condition} from '@karma.run/editor-common'

import {
  ViewContextPanelHeader,
  Panel,
  SessionContext,
  withSession,
  ModelRecord,
  PanelToolbar,
  ErrorBar,
  ViewContext,
  Button,
  ButtonType,
  FlexList,
  IconName,
  PanelContent,
  withLocale,
  LocaleContext,
  SortConfiguration
} from '@karma.run/editor-common'

import {ToolbarFilter} from '../recordListPanel/filterToolbar'
import {RecordList} from '../recordListPanel/panel'

export interface ToolbarAction {
  key: string
  icon: IconName
  label: string
  onTrigger: (id: Ref) => void
}

export interface RecordAction {
  key: string
  icon: IconName
  label: string
  onTrigger: (record: ModelRecord) => void
}

export interface RecordDeletePanelProps {
  model: Ref
  recordID: Ref
  sessionContext: SessionContext
  localeContext: LocaleContext
  disabled: boolean
  onBack: (model: Ref, record?: ModelRecord) => void
  onEditRecord: (model: Ref, id?: Ref) => Promise<ModelRecord | undefined>
  onDeleteRecord: (model: Ref, id: Ref) => Promise<void>
}

export interface RecordDeletePanelState {
  records?: ModelRecord[]
  limit: number
  offset: number
  hasMore: boolean
  filter?: Filter
  sort?: Sort
  sortValue?: SortConfiguration
  sortDescending: boolean
  quickSearchValue: string
}

export class RecordDeletePanel extends React.PureComponent<
  RecordDeletePanelProps,
  RecordDeletePanelState
> {
  public state: RecordDeletePanelState = {
    limit: 50,
    offset: 0,
    hasMore: true,
    sortDescending: false,
    quickSearchValue: ''
  }

  private handleNextPage = () => {
    this.nextPage()
  }

  private handlePreviousPage = () => {
    this.previousPage()
  }

  private handleSortChange = (value: SortConfiguration, descending: boolean) => {
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

  private handleEditRecord = async (record: ModelRecord) => {
    await this.props.onEditRecord(record.model, record.id)
    this.reload()
  }

  private handleDeleteRecord = async (record: ModelRecord) => {
    await this.props.onDeleteRecord(record.model, record.id)
    this.reload()
  }

  private get viewContext(): ViewContext | undefined {
    return this.props.sessionContext.viewContextMap.get(this.props.model)
  }

  private get sortValue(): SortConfiguration {
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

  private reload() {
    this.loadRecords(this.state.offset)
  }

  private loadRecords = async (offset: number) => {
    if (!this.viewContext) return

    this.setState({offset, records: undefined})

    const filters: Condition[] = []

    if (this.state.quickSearchValue.trim() !== '') {
      for (const keyPath of this.viewContext.displayKeyPaths) {
        const valuePath = this.viewContext.field.valuePathForKeyPath(keyPath)

        filters.push({
          type: ConditionType.StringIncludes,
          path: valuePath,
          value: this.state.quickSearchValue.trim()
        })
      }
    }

    // Request one more than the limit to check if there's another page
    const records = await this.props.sessionContext.getReferrers(
      this.viewContext.model,
      this.props.recordID,
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
        <ViewContextPanelHeader viewContext={viewContext} prefix={_('deleteRecordPrefix')} />
        <PanelToolbar
          left={
            <FlexList spacing="medium">
              <Button
                type={ButtonType.Icon}
                icon={IconName.Back}
                onTrigger={this.props.onBack}
                disabled={this.props.disabled}
                label={_('back')}
              />
              <Button
                type={ButtonType.Icon}
                onTrigger={() => {}}
                icon={IconName.DeleteDocument}
                disabled={
                  this.props.disabled || (this.state.records && this.state.records.length > 0)
                }
                label={_('deleteRecord')}
              />
              <div />
            </FlexList>
          }
          right={
            <>
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
              <ToolbarFilter
                viewContext={viewContext}
                sortConfigurations={viewContext.sortConfigurations}
                sortValue={this.sortValue}
                sortDescending={this.state.sortDescending}
                onSortChange={this.handleSortChange}
                filterConfigurations={[]}
                quickSearchValue={this.state.quickSearchValue}
                onQuickSearchChange={this.handleQuickSearchChange}
                disableQuickSearch={viewContext.displayKeyPaths.length === 0}
              />
            </>
          }>
          <ErrorBar message={_('recordIsStillBeingReferred')} />
        </PanelToolbar>
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
                onTrigger: this.handleEditRecord
              },
              {
                key: 'delete',
                icon: IconName.DeleteDocument,
                label: _('deleteRecord'),
                onTrigger: this.handleDeleteRecord
              }
            ]}
          />
        </PanelContent>
      </Panel>
    )
  }
}

export const RecordDeletePanelContainer = withLocale(withSession(RecordDeletePanel))
