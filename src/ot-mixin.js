export default function(superClass) {
  return class OtMixin extends superClass {

    _sv = {}; // State vector
    _hb = []; // History buffer

    _undo(op) {
      if (op.type === 'insert') {
        this._doExecute({
          type: 'delete',
          index: op.index,
          length: op.text.length
        });
      } else if (op.type === 'delete') {

      } else {
        throw new Error('Unexpected operation type to undo: ' + op.type);
      }
    }
  }
}
