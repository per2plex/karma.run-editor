```
{
  recursion: {
    label: 'node',
    model: {
      struct: {
        object: {string: {}},
        type: {optional: {string: {}}},
        data: {
          optional: {
            struct: {}
          }
        },
        isVoid: {optional: {bool: {}}},
        text: {optional: { string: {}}},
        nodes: {optional: {list: {recurse: 'node' }}},
        marks: {optional: {list: {recurse: 'node' }}},
        leaves: {optional: {list: {recurse: 'node' }}}
      }
    }
  }
}
```
