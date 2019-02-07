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

      this._checkQueue();
    }

    _checkQueue() {
      const causallyReadyOpIndex = this._queue.findIndex(op => this._isCausallyReady(op));
      if (causallyReadyOpIndex > -1) {
        const causallyReadyOp = this._queue.splice(causallyReadyOpIndex, 1)[0];
        this._integrateRemoteOperation(causallyReadyOp);
      }
    }

    _addToHb(op, index) {
      if (typeof index !== 'number') {
        index = this.__getHbIndex(op);
      }
      this._hb.splice(index, 0, op);
    }

    __undoDoRedo(op) {
      const hbIndex = this.__getHbIndex(op);
      const subsequentOps = this._hb.slice(hbIndex, this._hb.length);

      subsequentOps.reverse().forEach(this.__undo.bind(this));
      this._doExecute(op);
      this._addToHb(op, hbIndex);
      subsequentOps.reverse().forEach(this._doExecuteInternal.bind(this));
    }

    /**
     * Finds the index of the first operation in history buffer
     * which should be ordered after the given operation according
     * to the total ordering in the GOT algorithm. If there's no such
     * operation, the length of the history buffer is returned.
     */
    __getHbIndex(op) {
      const sumSv = sv => Object.values(sv).reduce((sum, clock) => sum + clock);
      const opSum = sumSv(op.sv);

      const firstSubsequentIndex = this._hb.findIndex(oldOp => {
        const oldOpSum = sumSv(oldOp.sv);
        if (opSum === oldOpSum) {
          return oldOp.clientId > op.clientId;
        } else {
          return oldOpSum > opSum;
        }
      });

      if (firstSubsequentIndex === -1) {
        return this._hb.length;
      } else {
        return firstSubsequentIndex;
      }
    }

    __undo(op) {
      console.log('undoing ', op);
      if (op.type === 'insert') {
        this._doExecuteInternal({
          type: 'delete',
          index: op.index,
          text: op.text
        });
      } else if (op.type === 'delete') {
        this._doExecuteInternal({
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
