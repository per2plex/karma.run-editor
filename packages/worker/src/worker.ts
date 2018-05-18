import * as bcryptjs from 'bcryptjs'

import {
  firstKeyOptional, Filter, Sort, ValueFilter, ConditionType,
  getValuesForValuePath, SortType, FilterType, WorkerTypeMap
} from '@karma.run/editor-common'

import { createWorker } from './createWorker'

function recursiveTextSearch(obj: any, text: string): boolean {
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.some((obj) => recursiveTextSearch(obj, text))
    } else {
      return recursiveTextSearch(Object.values(obj), text)
    }
  } else if (typeof obj === 'string' || typeof obj === 'number') {
    return obj.toString().toLowerCase().includes(text.toLowerCase()) ? true : false
  }

  return false
}

function isMatchingFieldFilter(filter: ValueFilter, entry: any) {
  const condition = filter.condition
  const values = getValuesForValuePath(entry, condition.path)

  return values.some(value => {
    switch (condition.type) {
      case ConditionType.ListLengthEqual:
        return Array.isArray(value) && value.length === condition.value

      case ConditionType.ListLengthMin:
        return Array.isArray(value) && value.length >= condition.value

      case ConditionType.ListLengthMax:
        return Array.isArray(value) && value.length <= condition.value

      case ConditionType.StringEqual:
        return typeof value === 'string'
          && value.toLowerCase() === condition.value.toLowerCase()

      case ConditionType.StringIncludes:
        return typeof value === 'string'
          && value.toLowerCase().includes(condition.value.toLowerCase())

      case ConditionType.StringStartsWith:
        return typeof value === 'string'
          && value.toLowerCase().startsWith(condition.value.toLowerCase())

      case ConditionType.StringEndsWith:
        return typeof value === 'string'
          && value.toLowerCase().endsWith(condition.value.toLowerCase())

      case ConditionType.StringRegExp: {
        try {
          return typeof value === 'string' && value.match(condition.value) != undefined
        } catch {
          return false
        }
      }

      case ConditionType.NumberEqual:
        return typeof value === 'number' && value === condition.value

      case ConditionType.NumberMin:
        return typeof value === 'number' && value >= condition.value

      case ConditionType.NumberMax:
        return typeof value === 'number' && value <= condition.value

      case ConditionType.DateEqual: {
        if (typeof value === 'string') {
          return Date.parse(value) === condition.value.getTime()
        } else if (typeof value === 'number') {
          return (value * 1000) === condition.value.getTime()
        } else if (value instanceof Date) {
          return value.getTime() === condition.value.getTime()
        }

        return false
      }

      case ConditionType.DateMin: {
        if (typeof value === 'string') {
          return Date.parse(value) >= condition.value.getTime()
        } else if (typeof value === 'number') {
          return (value * 1000) >= condition.value.getTime()
        } else if (value instanceof Date) {
          return value.getTime() >= condition.value.getTime()
        }

        return false
      }

      case ConditionType.DateMax: {
        if (typeof value === 'string') {
          return Date.parse(value) <= condition.value.getTime()
        } else if (typeof value === 'number') {
          return (value * 1000) <= condition.value.getTime()
        } else if (value instanceof Date) {
          return value.getTime() <= condition.value.getTime()
        }

        return false
      }

      case ConditionType.EnumEqual:
      case ConditionType.RefEqual:
        return typeof value === 'string' && value === condition.value

      case ConditionType.UnionKeyEqual:
        return typeof value === 'object' && value && firstKeyOptional(value) === condition.value

      case ConditionType.OptionalIsPresent:
        return condition.value ? value != undefined : value == undefined

      default: return false
    }
  })
}

function filterObjects(filter: Filter, objects: any[]): any[] {
  switch (filter.type) {
    case FilterType.Composite:
      return filter.filters.reduce(
        (entries, filter) => filterObjects(filter, entries), objects
      )

    case FilterType.FullText: {
      if (filter.value === '') return objects
      return objects.filter(entry => recursiveTextSearch(entry.value, filter.value))
    }

    case FilterType.Condition:
      return objects.filter(entry => isMatchingFieldFilter(filter, entry))
  }

  return objects
}

function sortEntries(sort: Sort, entries: any[]) : any[] {
  return entries.sort((entryA, entryB) => {
    const valueA = getValuesForValuePath(entryA, sort.path)[0]
    const valueB = getValuesForValuePath(entryB, sort.path)[0]

    if (valueA == undefined) return -1
    if (valueB == undefined) return 1

    switch (sort.type) {
      case SortType.Date: return (
        new Date(valueB).getTime() - new Date(valueA).getTime()
      )

      case SortType.String:
      default: return String(valueA).localeCompare(String(valueB))
    }
  })
}

createWorker<WorkerTypeMap>('Worker', {
  filterAndSort: ({filter, sort, objects}) => {
    const filteredEntries = filter ? filterObjects(filter, objects) : objects
    const sortedEntries = sortEntries(sort, filteredEntries)

    return sort.descending ? sortedEntries.reverse() : sortedEntries
  },

  hash: (options) => {
    const salt = bcryptjs.genSaltSync(options.costFactor)
    return bcryptjs.hashSync(options.value, salt)
  },

  salt: (options) => {
    return bcryptjs.genSaltSync(options.costFactor)
  }
})
