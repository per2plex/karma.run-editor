function consoleWrapper(_logLevel: LogLevel, fn: 'log' | 'info' | 'debug' | 'warn' | 'error') {
  return (message: any, ...optionalParams: any[]) => {
    if (console) {
      ;(console as any)[fn](message, ...optionalParams)
    }
  }
}

export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warning = 'warning',
  Error = 'error'
}

export const log = consoleWrapper(LogLevel.Debug, 'log')
export const debug = consoleWrapper(LogLevel.Debug, 'debug')
export const info = consoleWrapper(LogLevel.Info, 'info')
export const warn = consoleWrapper(LogLevel.Warning, 'warn')
export const error = consoleWrapper(LogLevel.Error, 'error')
