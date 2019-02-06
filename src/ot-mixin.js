export default function (superClass) {
  return class OtMixin extends superClass {

    constructor() {
      super();
      this._hb = []; // History buffer
      this._queue = [];
    }

    _remoteOperationReceived(op) {
      if (this._isCausallyReady(op)) {
        this._integrateRemoteOperation(op);
      } else {
        this._queue.push(op);
      }
    }

    _integrateRemoteOperation(op) {
      const transformed = this._transform(op);
      this._doExecute(transformed);
      this._sv[op.clientId]++;
      this._hb.push(transformed);

      this._checkQueue();
    }

    _checkQueue() {
      const causallyReadyOp = this._queue.find(op => this._isCausallyReady(op));
      causallyReadyOp && this._integrateRemoteOperation(causallyReadyOp);
    }

    _transform(op) {
      return op;
    }

    _undo(op) {
      if (op.type === 'insert') {
        this._doExecute({
          type: 'delete',
          index: op.index,
          text: op.text
        });
      } else if (op.type === 'delete') {
        this._doExecute({
          type: 'insert',
          index: op.index,
          text: op.text
        });
      } else {
        throw new Error('Unexpected operation type to undo: ' + op.type);
      }
    }
  }
}
