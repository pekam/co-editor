import transform from "./got-control-algorithm.js";

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
      const transformed = transform(op, this._hb);
      this._doExecute(transformed);
      this._hb.push(transformed);

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
  }
}
