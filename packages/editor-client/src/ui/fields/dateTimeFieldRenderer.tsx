import * as React from 'react'

import {observer} from 'mobx-react'

import {DateTimeInput, CardError, FlexList} from '../../ui/common'
import {DateTimeFieldStore} from '../../store/fields/dateTimeFieldStore'
import {RenderOpts} from '../../ui/fields/renderFieldStore'
import {Field, FieldLabel} from '../../ui/fields/field'

export namespace DateTimeFieldRenderer {
  export interface Props extends RenderOpts {
    store: DateTimeFieldStore
  }
}

@observer
export class DateTimeFieldRenderer extends React.Component<DateTimeFieldRenderer.Props> {
  private handleChange = (value: Date | string) => {
    this.props.store.change(value)
  }

  public render() {
    let errorContent: JSX.Element | undefined

    // TODO: Error Field
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

    return (
      <Field depth={this.props.depth} index={this.props.index}>
        {!this.props.isWrapped && (
          <FieldLabel
            label={this.props.store.label}
            description={this.props.store.description}
            depth={this.props.depth}
            index={this.props.index}
          />
        )}
        <DateTimeInput
          onChange={this.handleChange}
          value={this.props.store.value}
          disabled={this.props.disabled}
        />
        {errorContent}
      </Field>
    )
  }
}
