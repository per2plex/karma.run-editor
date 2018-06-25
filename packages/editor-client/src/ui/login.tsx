import * as React from 'react'

import {style} from 'typestyle'
import {TextInputType, ButtonType} from '../ui/common'
import {Color, Spacing, FontWeight} from '../ui/style'

import {Button, TextInput} from '../ui/common'

import {KarmaError, KarmaErrorType, Session} from '@karma.run/sdk'

import {Theme, withTheme} from '../context/theme'
import {SessionContext, withSession} from '../context/session'
import {withLocale, LocaleContext} from '../context/locale'
import {CenteredLoadingIndicator} from './common/loader'
import {withNotification, NotificationContext, NotificationType} from '../context/notification'

export interface LoginFormState {
  username: string
  password: string
  isSubmitting: boolean
  isRestoringSession: boolean
  error?: string
}

export interface LoginFormProps {
  session?: Session
  theme: Theme
  sessionContext: SessionContext
  localeContext: LocaleContext
  notificationContext: NotificationContext
}

export const LoginFormStyle = style({
  $debugName: 'LoginForm',

  background: `radial-gradient(circle at center, ${Color.primary.light1}, ${Color.primary.base})`,
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
          width: '30rem',

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

export class Login extends React.Component<LoginFormProps, LoginFormState> {
  constructor(props: LoginFormProps) {
    super(props)

    this.state = {
      username: '',
      password: '',
      isSubmitting: false,
      isRestoringSession: false
    }
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
      await this.props.sessionContext.authenticate(this.state.username, this.state.password)
    } catch (err) {
      const karmaError: KarmaError = err

      if (karmaError.type === KarmaErrorType.PermissionDeniedError) {
        this.setState({
          isSubmitting: false
          // error: 'Invalid login'
        })

        this.props.notificationContext.notify({
          type: NotificationType.Error,
          message: 'Invalid login'
        })
      } else {
        this.setState({
          isSubmitting: false
          // error: karmaError.message
        })

        this.props.notificationContext.notify({
          type: NotificationType.Error,
          message: karmaError.message
        })
      }
    }
  }

  public async componentDidMount() {
    if (this.props.session) {
      this.setState({isRestoringSession: true})

      try {
        await this.props.sessionContext.restoreSession(this.props.session)
      } catch (err) {
        this.setState({
          isRestoringSession: false,
          error: 'Session expired'
        })
      }
    } else if (this.props.sessionContext.canRestoreSessionFromStorage) {
      this.setState({isRestoringSession: true})

      try {
        await this.props.sessionContext.restoreSessionFromLocalStorage()
      } catch (err) {
        this.setState({
          isRestoringSession: false,
          error: 'Session expired'
        })
      }
    }
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
            {this.state.isRestoringSession ? (
              <CenteredLoadingIndicator />
            ) : (
              <form className="form">
                <div className="fieldWrapper">
                  <div className="field">
                    <TextInput
                      onChange={this.handleUsernameChange}
                      name="username"
                      placeholder={this.props.localeContext.get('username')}
                      disabled={this.state.isSubmitting}
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
                      disabled={this.state.isSubmitting}
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
            )}
          </div>
        </div>
      </div>
    )
  }
}

export const LoginContainer = withLocale(withSession(withTheme(withNotification(Login))))
