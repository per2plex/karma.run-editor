import * as React from 'react'

import {style} from 'typestyle'
import {TextInputType, ButtonType} from '../ui/common'
import {Color, Spacing, FontWeight} from '../ui/style'

import {Button, TextInput} from '../ui/common'

import {Env} from '../util/env'
import {ThemeContext} from '../context/theme'
import {SessionContext} from '../context/session'
import {KarmaError, KarmaErrorType} from '@karma.run/sdk'

export interface LoginFormState {
  karmaURL: string
  username: string
  password: string
  isSubmitting: boolean
  error?: string
}

export interface LoginFormProps {
  defaultKarmaURL?: string
  sessionContext: SessionContext
}

export const LoginFormStyle = style({
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

export class LoginForm extends React.Component<LoginFormProps, LoginFormState> {
  constructor(props: LoginFormProps) {
    super(props)

    this.state = {
      karmaURL: Env.KARMA_API_URL || '',
      username: Env.DEFAULT_USERNAME || '',
      password: Env.DEFAULT_PASSWORD || '',
      isSubmitting: false
    }
  }

  private handleKarmaURLChange = (karmaURL: string) => {
    this.setState({karmaURL})
  }

  private handleUsernameChange = (username: string) => {
    this.setState({username})
  }

  private handlePasswordChange = (password: string) => {
    this.setState({password})
  }

  private handleSubmitClick = async () => {
    this.setState({isSubmitting: true})

    try {
      await this.props.sessionContext.authenticate(
        this.state.karmaURL,
        this.state.username,
        this.state.password
      )
    } catch (err) {
      const karmaError: KarmaError = err

      if (karmaError.type === KarmaErrorType.PermissionDeniedError) {
        this.setState({
          isSubmitting: false,
          error: 'Invalid login'
        })
      } else {
      }
    }

    this.setState({isSubmitting: false})
  }

  public render() {
    let endpointContent: React.ReactNode

    if (!Env.KARMA_API_URL) {
      endpointContent = (
        <div className="fieldWrapper">
          <div className="label">Karma URL</div>
          <div className="field">
            <TextInput
              onChange={this.handleKarmaURLChange}
              name="Karma URL"
              placeholder="Karma URL"
              value={this.state.karmaURL}
            />
          </div>
        </div>
      )
    }

    return (
      <ThemeContext.Consumer>
        {context => (
          <div className={LoginFormStyle}>
            <div className="wrapper">
              <div className="content">
                <div className="header">
                  <div className="logo">
                    <context.logo />
                  </div>
                </div>
                <form className="form">
                  {endpointContent}
                  <div className="fieldWrapper">
                    <div className="label">User</div>
                    <div className="field">
                      <TextInput
                        onChange={this.handleUsernameChange}
                        name="Username"
                        placeholder="Username"
                        value={this.state.username}
                        type={TextInputType.Lighter}
                      />
                    </div>
                    <div className="field">
                      <TextInput
                        onChange={this.handlePasswordChange}
                        name="Password"
                        placeholder="Password"
                        isPassword={true}
                        value={this.state.password}
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

export const LoginPage: React.StatelessComponent = () => (
  <SessionContext.Consumer>
    {sessionContext => <LoginForm sessionContext={sessionContext} />}
  </SessionContext.Consumer>
)
