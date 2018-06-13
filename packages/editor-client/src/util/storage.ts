import * as debug from '../util/debug'

export function set(key: string, obj: any) {
  try {
    localStorage.setItem(key, JSON.stringify(obj))
  } catch (err) {
    debug.error('Error while writing to LocalStorage.', err)
  }
}

export function get(key: string): any {
  try {
    const json = localStorage.getItem(key)
    return json && JSON.parse(json)
  } catch (err) {
    return undefined
  }
}

export function remove(key: string) {
  localStorage.removeItem(key)
}

export function clear() {
  localStorage.clear()
}
