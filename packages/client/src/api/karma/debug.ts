import { Model } from './model'
import { mapObject } from '@karma.run/editor-common'

// Debug
const typeCSS = 'font-weight: bold; color: black;'
const fieldCSS = 'font-weight: normal; color: gray;'
const fieldFormat = '%c%s: %c%s'
const format = '%c%s'

function printType(group: boolean, type: string, field?: string) {
  const logFn = group ? console.groupCollapsed : console.log

  if (field) {
    logFn(fieldFormat, fieldCSS, field, typeCSS, type)
  } else {
    logFn(format, typeCSS, type)
  }
}

export function printModel(model: Model, field?: string) {
  switch (model.type) {
    // BaseModel
    case 'int': case 'int8': case 'int16': case 'int32': case 'int64':
    case 'uint': case 'uint8': case 'uint16': case 'uint32': case 'uint64':
    case 'float': case 'string': case 'dateTime': case 'bool': {
      printType(false, model.type, field)
      break
    }

    // RefModel
    case 'ref': {
      printType(true, model.type, field)
      console.log(model.model)
      console.groupEnd()
      break
    }

    // EnumModel
    case 'enum': {
      printType(true, model.type, field)
      console.log(model.values.join(', '))
      console.groupEnd()
      break
    }

    // ContainerModel
    case 'list': case 'map': case 'set': case 'optional': {
      printType(true, model.type, field)
      printModel(model.model)
      console.groupEnd()
      break
    }

    // ArrayModel
    case 'tuple': case 'or': {
      printType(true, model.type, field)
      model.fields.map(field => printModel(field))
      console.groupEnd()
      break
    }

    // FieldModel
    case 'struct': case 'union': {
      printType(true, model.type, field)
      mapObject(model.fields, (model, key) => printModel(model, key))
      console.groupEnd()
      break
    }

    // RecurseModel
    case 'recurse': {
      printType(true, model.type, field)
      console.log(model.label)
      console.groupEnd()
      break
    }

    // RecursionModel
    case 'recursion': {
      printType(true, model.type, field)
      printModel(model.model, model.label)
      console.groupEnd()
      break
    }

    // RecursiveModel
    case 'recursive': {
      printType(true, model.type, field)
      console.log('Top: %s', model.top)
      mapObject(model.models, (model, key) => printModel(model, key))
      console.groupEnd()
      break
    }

    default: {
      printType(false, model.type, field)
      break
    }
  }
}
