import * as React from 'react'
import {observer} from 'mobx-react'

import {
  Card,
  CardSection,
  CardError,
  Button,
  FlexList,
  DescriptionView,
  ButtonType,
  CardFooter
} from '../../ui/common'

import {RefFieldStore} from '../../store/fields/refFieldStore'
import {RenderOpts} from './renderFieldStore'

import {Entry} from '../../api/karma'
import {LoadingIndicator, LoadingIndicatorStyle} from '../../ui/common/loader'
import {style} from 'typestyle'
import {Spacing} from '../../ui/style'
import {Field, FieldLabel} from '../../ui/fields/field'
import {IconName} from '../../ui/common/icon'

export namespace RefFieldRenderer {
  export interface Props extends RenderOpts {
    store: RefFieldStore
  }

  export interface State {
    currentID?: string
    entry?: Entry
    error?: string
  }
}

@observer
export class RefFieldRenderer extends React.Component<
  RefFieldRenderer.Props,
  RefFieldRenderer.State
> {
  constructor(props: RefFieldRenderer.Props) {
    super(props)
    this.state = {}
  }

  public componentWillMount() {
    this.loadEntry()
  }

  public componentDidUpdate() {
    if (this.state.currentID !== this.props.store.id) {
      this.setState({entry: undefined, currentID: undefined}, () => {
        this.loadEntry()
      })
    }
  }

  private async loadEntry() {
    if (!this.props.store.id) return

    const model = this.props.store.model
    const id = this.props.store.id

    this.setState({currentID: id, error: undefined})

    let entry: Entry

    try {
      entry = await this.props.onLoadEntry(model, id)
    } catch (err) {
      // Check if is still current ID
      if (id && this.state.currentID) {
        this.setState({
          error: err.message
        })
      }
      return
    }

    // Check if is still current ID
    if (id && this.state.currentID) {
      this.setState({entry, error: undefined})
    }
  }

  private handleEditClick = () => {
    this.props.onEditEntry(
      this.props.store.model,
      this.props.store.id,
      (id: string | undefined) => {
        if (id) {
          this.props.store.change(id)
          this.loadEntry()
        }
      }
    )
  }

  private handleNewClick = () => {
    this.props.onEditEntry(this.props.store.model, undefined, (id: string | undefined) => {
      if (id) this.props.store.change(id)
    })
  }

  private handleChooseClick = () => {
    this.props.onChooseEntry(this.props.store.model, (id: string | undefined) => {
      if (id) this.props.store.change(id)
    })
  }

  public render() {
    let content: JSX.Element | JSX.Element[] | undefined
    let leftFooterContent: JSX.Element | undefined

    const entry = this.state.entry
    const viewContext = this.props.viewContextMap[this.props.store.model]!

    if (this.state.error) {
      content = <CardError>{this.state.error}</CardError>
    } else if ((entry && entry.id !== this.state.currentID) || (!entry && this.state.currentID)) {
      content = (
        <CardSection>
          <LoadingIndicator style={LoadingIndicatorStyle.Dark} />
        </CardSection>
      )
    } else if (entry && viewContext) {
      const updatedDateString = new Date(entry.updated).toLocaleDateString()
      const createdDateString = new Date(entry.created).toLocaleDateString()

      content = (
        <DescriptionView
          viewContext={viewContext}
          entry={entry}
          reverseTags={this.props.reverseTags}
        />
      )

      leftFooterContent = (
        <>
          <div>Updated: {updatedDateString}</div>
          <div>Created: {createdDateString}</div>
        </>
      )
    } else {
      content = <CardSection>Select entry!</CardSection>
    }

    let errorContent: JSX.Element | undefined

    if (this.props.store.errors.length > 0) {
      errorContent = (
        <CardError>
          <FlexList>
            {this.props.store.errors.map((errorMessage, index) => (
              <div key={index}>{errorMessage}</div>
            ))}
          </FlexList>
        </CardError>
      )
    }

    let editButtons: React.ReactNode

    if (!this.props.store.disableEditing) {
      editButtons = (
        <>
          <Button
            type={ButtonType.Icon}
            key="new"
            label="New"
            icon={IconName.NewDocument}
            onTrigger={this.handleNewClick}
            disabled={this.props.disabled}
          />
          {this.props.store.id != undefined && (
            <Button
              type={ButtonType.Icon}
              key="edit"
              label="Edit"
              icon={IconName.EditDocument}
              onTrigger={this.handleEditClick}
              disabled={this.props.disabled}
            />
          )}
        </>
      )
    }

    return (
      <Field className={RefField.Style} depth={this.props.depth} index={this.props.index}>
        {!this.props.isWrapped && (
          <FieldLabel
            label={this.props.store.label}
            description={this.props.store.description}
            depth={this.props.depth}
            index={this.props.index || 0}
          />
        )}
        <Card markerColor={viewContext.color}>
          {content}
          <CardFooter
            contentLeft={leftFooterContent}
            contentRight={
              <>
                {editButtons}
                <Button
                  type={ButtonType.Icon}
                  label="Choose"
                  icon={IconName.ChooseDocument}
                  onTrigger={this.handleChooseClick}
                  disabled={this.props.disabled}
                />
              </>
            }
          />
        </Card>
        {errorContent}
      </Field>
    )
  }
}

export namespace RefField {
  export const Style = style({
    $debugName: 'RefField',

    $nest: {
      '> .buttonWrapper': {
        display: 'flex',

        opacity: 0.5,
        marginTop: Spacing.large,

        $nest: {
          '> button': {
            marginRight: Spacing.medium
          }
        }
      },

      '&:hover > .buttonWrapper': {
        opacity: 1
      }
    }
  })
}
