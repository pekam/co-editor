import EditorBase from "./editor-base.js";
import transform from "./goto-control-algorithm.js";
import { inclusionTransformation, exclusionTransformation } from './transformations.js';

export default class OTHandler extends EditorBase {

  constructor() {
    super();
    this._log = [];
    this._stateVector = {};
    this._queue = [];
  }

  _onUserInput(op) {
    this._stateVector[this._id]++;
    op.stateVector = Object.assign({}, this._stateVector);
    this._log.push(op);
  }

  _remoteOperationReceived(op) {
    if (this._isActive() && this.__isCausallyReady(op)) {
      this._integrateRemoteOperation(op);
    } else {
      this._queue.push(op);
    }
  }

  _integrateRemoteOperation(op) {
    const transformed = transform(op, this._log,
      inclusionTransformation, exclusionTransformation);
    this._doExecute(transformed);
    this._log.push(transformed);

    this._stateVector[op.userId] = this._stateVector[op.userId] || 0;
    this._stateVector[op.userId]++;

    this._checkQueue();
  }

  _checkQueue() {
    // Remove operations which are already effective in the text
    this._queue = this._queue.filter(op =>
      op.stateVector[op.userId] > this._stateVector[op.userId]);

    const causallyReadyOpIndex = this._queue.findIndex(op => this.__isCausallyReady(op));
    if (causallyReadyOpIndex > -1) {
      const causallyReadyOp = this._queue.splice(causallyReadyOpIndex, 1)[0];
      this._integrateRemoteOperation(causallyReadyOp);
    }
  }

  __isCausallyReady(op) {
    const clockAhead = Object.keys(op.stateVector)
      .filter(id => id !== op.userId.toString())
      .find(id => op.stateVector[id] > (this._stateVector[id] || 0));

    return !clockAhead && (op.stateVector[op.userId] === (this._stateVector[op.userId] || 0) + 1);
  }
}
