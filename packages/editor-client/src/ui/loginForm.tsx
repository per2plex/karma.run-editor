import * as React from 'react'

import {style} from 'typestyle'
import {TextInputType, ButtonType} from '../ui/common'
import {Color, Spacing, FontWeight} from '../ui/style'

import {Button, TextInput} from '../ui/common'

import {NotificationStore, NotificationType} from '../store/notificationStore'
import {LocationStore} from '../store/locationStore'
import {EditorStore} from '../store/editorStore'
import {Env} from '../util/env'
import {ThemeContext} from '../context/theme'

export namespace LoginForm {
  export interface Value {
    endpoint: string
    databaseName: string
    username: string
    password: string
  }

  export interface State {
    value: Value
    isSubmitting: boolean
  }

  export interface Props {
    editorStore: EditorStore
    locationStore: LocationStore
    notificationStore: NotificationStore
  }
}

export class LoginForm extends React.Component<LoginForm.Props, LoginForm.State> {
  constructor(props: LoginForm.Props) {
    super(props)

    this.state = {
      value: {
        endpoint: Env.KARMA_API_URL || '',
        databaseName: Env.DEFAULT_DATABASE || '',
        username: Env.DEFAULT_USERNAME || '',
        password: Env.DEFAULT_PASSWORD || ''
      },
      isSubmitting: false
    }
  }

  private handleEndpointChange = (value: string) => {
    this.setState({
      ...this.state,
      value: {
        ...this.state.value,
        endpoint: value
      }
    })
  }

  private handleDatabaseNameChange = (value: string) => {
    this.setState({
      ...this.state,
      value: {
        ...this.state.value,
        databaseName: value
      }
    })
  }

  private handleUsernameChange = (value: string) => {
    this.setState({
      ...this.state,
      value: {
        ...this.state.value,
        username: value
      }
    })
  }

  private handlePasswordChange = (value: string) => {
    this.setState({
      ...this.state,
      value: {
        ...this.state.value,
        password: value
      }
    })
  }

  private handleSubmitClick = async () => {
    const value = this.state.value
    this.setState({...this.state, isSubmitting: true})

    try {
      await this.props.editorStore.login(
        value.endpoint,
        value.databaseName,
        value.username,
        value.password
      )
    } catch (err) {
      this.props.notificationStore.notify({
        message: err.message,
        type: NotificationType.Error
      })

      this.setState({...this.state, isSubmitting: false})
    }
  }

  public render() {
    let endpointContent: React.ReactNode

    if (!Env.KARMA_API_URL) {
      endpointContent = (
        <div className="fieldWrapper">
          <div className="label">Endpoint</div>
          <div className="field">
            <TextInput
              onChange={this.handleEndpointChange}
              name="Endpoint"
              placeholder="Endpoint"
              value={this.state.value.endpoint}
            />
          </div>
        </div>
      )
    }

    let databaseFieldContent: React.ReactNode

    if (Env.showDatabaseField) {
      databaseFieldContent = (
        <div className="fieldWrapper">
          <div className="label">Database</div>
          <div className="field">
            <TextInput
              onChange={this.handleDatabaseNameChange}
              name="Database Name"
              placeholder="Database Name"
              value={this.state.value.databaseName}
              type={TextInputType.Lighter}
            />
          </div>
        </div>
      )
    }

    return (
      <ThemeContext.Consumer>
        {context => (
          <div className={LoginForm.Style}>
            <div className="wrapper">
              <div className="content">
                <div className="header">
                  <div className="logo">
                    <context.logo />
                  </div>
                </div>
                <form className="form">
                  {endpointContent}
                  {databaseFieldContent}
                  <div className="fieldWrapper">
                    <div className="label">User</div>
                    <div className="field">
                      <TextInput
                        onChange={this.handleUsernameChange}
                        name="Username"
                        placeholder="Username"
                        value={this.state.value.username}
                        type={TextInputType.Lighter}
                      />
                    </div>
                    <div className="field">
                      <TextInput
                        onChange={this.handlePasswordChange}
                        name="Password"
                        placeholder="Password"
                        isPassword={true}
                        value={this.state.value.password}
                        type={TextInputType.Lighter}
                      />
                    </div>
                  </div>
                  <Button
                    type={ButtonType.Primary}
                    onTrigger={this.handleSubmitClick}
                    label="Login"
                    disabled={this.state.isSubmitting}
                  />
                </form>
              </div>
            </div>
          </div>
        )}
      </ThemeContext.Consumer>
    )
  }
}

export namespace LoginForm {
  export const Style = style({
    $debugName: 'LoginForm',

    backgroundColor: Color.primary.base,
    width: '100%',
    height: '100%',

    $nest: {
      '> .wrapper': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',

        width: '100%',
        height: '100%',

        $nest: {
          '> .content': {
            display: 'flex',
            flexDirection: 'column',
            width: '35.5rem',

            $nest: {
              '> .header': {
                display: 'flex',
                flexDirection: 'column',
                marginBottom: Spacing.largest,

                $nest: {
                  '> .logo': {
                    justifySelf: 'center',
                    height: '15rem',
                    marginBottom: Spacing.large,
                    textAlign: 'center',

                    $nest: {
                      '> svg': {
                        fill: Color.neutral.white,
                        height: '100%'
                      }
                    }
                  },

                  '> .title': {
                    fontSize: '3rem',
                    fontWeight: FontWeight.light
                  },

                  '> .subtitle': {
                    fontSize: '1.8rem',
                    fontWeight: FontWeight.light
                  }
                }
              },

              '> .form': {
                $nest: {
                  '> .fieldWrapper': {
                    marginBottom: Spacing.largest,

                    $nest: {
                      '> .label': {
                        fontWeight: FontWeight.bold,
                        marginBottom: Spacing.medium
                      },

                      '> .field': {
                        marginBottom: Spacing.large
                      }
                    }
                  },

                  [`.${Button.Style}`]: {
                    width: '100%'
                  }
                }
              }
            }
          }
        }
      }
    }
  })
}
