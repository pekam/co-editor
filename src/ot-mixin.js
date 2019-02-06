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
      this.__undoDoRedo(op);

      this._sv[op.clientId]++;
      this._hb.push(op);

      this._checkQueue();
    }

    _checkQueue() {
      const causallyReadyOp = this._queue.find(op => this._isCausallyReady(op));
      causallyReadyOp && this._integrateRemoteOperation(causallyReadyOp);
    }

    __undoDoRedo(op) {
      const subsequentOps = this.__getSubsequentOps(op);

      subsequentOps.reverse().forEach(this.__undo);
      this._doExecute(op);
      subsequentOps.reverse().forEach(this._doExecute);
    }

    __getSubsequentOps(op) {
      const sumSv = sv => Object.values(sv).reduce((sum, clock) => sum + clock);
      const opSum = sumSv(op.sv);

      return this._hb.filter(oldOp => {
        const oldOpSum = sumSv(oldOp.sv);
        if (opSum === oldOpSum) {
          return oldOp.clientId > op.clientId;
        } else {
          return oldOpSum > opSum;
        }
      });
    }

    __undo(op) {
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
