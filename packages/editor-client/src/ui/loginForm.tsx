import * as React from 'react'

import {style} from 'typestyle'
import {TextInputType, ButtonType} from '../ui/common'
import {Color, Spacing, FontWeight} from '../ui/style'

import {Button, TextInput} from '../ui/common'

import {KarmaError, KarmaErrorType} from '@karma.run/sdk'

import {Theme, withTheme} from '../context/theme'
import {SessionContext, withSession} from '../context/session'
import {withConfig, Config} from '../context/config'
import {withLocale, LocaleContext} from '../context/locale'

export interface LoginFormState {
  karmaURL: string
  username: string
  password: string
  isSubmitting: boolean
  error?: string
}

export interface LoginFormProps {
  config: Config
  theme: Theme
  sessionContext: SessionContext
  localeContext: LocaleContext
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

    console.log(this.props.config.karmaURL)
    this.state = {
      karmaURL: '',
      username: '',
      password: '',
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
        this.props.config.karmaURL || this.state.karmaURL,
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
    return (
      <div className={LoginFormStyle}>
        <div className="wrapper">
          <div className="content">
            <div className="header">
              <div className="logo">
                <this.props.theme.logo />
              </div>
            </div>
            <form className="form">
              {!this.props.config.karmaURL && (
                <div className="fieldWrapper">
                  <div className="label">{this.props.localeContext.get('karmaURL')}</div>
                  <div className="field">
                    <TextInput
                      onChange={this.handleKarmaURLChange}
                      name="karmaURL"
                      placeholder={this.props.localeContext.get('karmaURL')}
                      value={this.state.karmaURL}
                    />
                  </div>
                </div>
              )}
              <div className="fieldWrapper">
                <div className="label">{this.props.localeContext.get('user')}</div>
                <div className="field">
                  <TextInput
                    onChange={this.handleUsernameChange}
                    name="username"
                    placeholder={this.props.localeContext.get('username')}
                    value={this.state.username}
                    type={TextInputType.Lighter}
                  />
                </div>
                <div className="field">
                  <TextInput
                    onChange={this.handlePasswordChange}
                    name="password"
                    placeholder={this.props.localeContext.get('password')}
                    isPassword={true}
                    value={this.state.password}
                    type={TextInputType.Lighter}
                  />
                </div>
              </div>
              <Button
                type={ButtonType.Primary}
                onTrigger={this.handleSubmitClick}
                label={this.props.localeContext.get('login')}
                disabled={this.state.isSubmitting}
                loading={this.state.isSubmitting}
              />
              {/* TODO: Wrap in container */}
              {this.state.error}
            </form>
          </div>
        </div>
      </div>
    )
  }
}

export const LoginFormContainer = withConfig(withSession(withLocale(withTheme(LoginForm))))
