export type KeyPath = (string | number)[]

export interface ClassType<T> extends Function {
  new (...params: any[]): T
}

export interface KeyPathValue {
  keyPath: KeyPath,
  value: any
}

export function hashKeyPath(keyPath: KeyPath) {
  return keyPath.join('.')
}

export function copyArray<T>(array: T[]) {
  return array.slice(0)
}

function hasOwnProperty(obj: any, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function hasValueForKeyPathRecurse(
  obj: any, keyPath: KeyPath,
  ignoreValues: any[],
  depth: number
): boolean {
  const key = keyPath[depth]

  if (!hasOwnProperty(obj, String(key))) {
    return false
  }

  const value: any = obj[key]

  if (keyPath.length === depth + 1) {
    if (ignoreValues.includes(value)) return false
    return true
  } else {
    if (value == undefined) return false
    return hasValueForKeyPathRecurse(
      value, keyPath, ignoreValues, depth + 1
    )
  }
}

/**
 * Checks if an Object has an own property value for the specified KeyPath.
 */
export function hasValueForKeyPath(
  obj: any, keyPath: KeyPath,
  ignoreValues: any[] = [null, undefined]
) {
  if (obj == undefined || keyPath == undefined || keyPath.length === 0) return false
  return hasValueForKeyPathRecurse(obj, keyPath, ignoreValues, 0)
}

function getValueForKeyPathRecurse(
  obj: any, keyPath: KeyPath,
  defaultValue: any, depth: number
): any {
  const key = keyPath[depth]

  if (!hasOwnProperty(obj, String(key))) {
    return defaultValue
  }

  const value = obj[key]

  if (value == undefined) return defaultValue

  if (keyPath.length === depth + 1) {
    return value
  } else {
    return getValueForKeyPathRecurse(
      value, keyPath, defaultValue, depth + 1
    )
  }
}

/**
 * Get own property value in Object for specified KeyPath.
 */
export function getValueForKeyPath(
  obj: any, keyPath: KeyPath,
  defaultValue?: any,
): any {
  if (obj == undefined || keyPath == undefined) return defaultValue
  if (keyPath.length === 0) return obj

  return getValueForKeyPathRecurse(obj, keyPath, defaultValue, 0)
}

/**
 * Provide default value in case "value" is undefined.
 */
export function provideDefault(value: any, defaultValue?: any) {
  return (value != undefined ? value : defaultValue)
}

/**
 * Remove specified keys from Object and return a copy.
 */
export function blacklistKeys<T extends object, K extends keyof T>(object: T, keys: K[]): any {
  const objectCopy = Object.assign({}, object)

  for (const key of keys) {
    delete objectCopy[key]
  }

  return objectCopy
}

/**
 * Take specified keys from Object and return a copy.
 */
export function whitelistKeys(object: any, keys: string[]) {
  const newObject: any = {}

  for (const key of keys) {
    newObject[key] = object[key]
  }

  return newObject
}

/**
 * Return a new Object which has it's keys mirrored in the values.
 */
export function mirrorKeys(object: any) {
  const actions: any = {}

  for (const key of Object.keys(object)) {
    actions[key] = key
  }

  return actions
}

export function optional(obj: any, keyPath: KeyPath, type: any) {
  const value = getValueForKeyPath(obj, keyPath)

  if (typeof type === 'string') {
    if (typeof value !== type) {
      throw new TypeError(`"${keyPath.join('.')}" has wrong type, expected "${type}".`)
    }
  } else if (!(value instanceof type)) {
    throw new TypeError(`"${keyPath.join('.')}" is not an instance of "${type.constructor.name}".`)
  }

  return value
}

export function required(obj: any, keyPath: KeyPath, type: string | any) {
  if (hasValueForKeyPath(obj, keyPath)) {
    throw new TypeError(`"${keyPath.join('.')}" should not be null/undefined.`)
  }

  return optional(obj, keyPath, type)
}
