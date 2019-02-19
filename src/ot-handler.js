import EditorBase from "./editor-base.js";
import transform from "./goto-control-algorithm.js";
import { inclusionTransformation, exclusionTransformation } from './transformations.js';

export default class OTHandler extends EditorBase {

  constructor() {
    super();
    this._hb = [];
    this._stateVector = {};
    this._queue = [];
  }

  _remoteOperationReceived(op) {
    if (this.__isCausallyReady(op)) {
      this._integrateRemoteOperation(op);
    } else {
      this._queue.push(op);
    }
  }

  _integrateRemoteOperation(op) {
    const transformed = transform(op, this._hb,
      inclusionTransformation, exclusionTransformation);
    this._doExecute(transformed);
    this._hb.push(transformed);

    this._stateVector[op.clientId]++;

    this._checkQueue();
  }

  _checkQueue() {
    const causallyReadyOpIndex = this._queue.findIndex(op => this.__isCausallyReady(op));
    if (causallyReadyOpIndex > -1) {
      const causallyReadyOp = this._queue.splice(causallyReadyOpIndex, 1)[0];
      this._integrateRemoteOperation(causallyReadyOp);
    }
  }

  __isCausallyReady(op) {
    const clockAhead = Object.keys(op.stateVector)
      .filter(id => id !== op.clientId.toString())
      .find(id => op.stateVector[id] > this._stateVector[id]);

    return !clockAhead && (op.stateVector[op.clientId] === this._stateVector[op.clientId] + 1);
  }
}
