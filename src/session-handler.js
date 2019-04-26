import OTHandler from "./ot-handler.js";
import { generateUUID } from './helpers.js';

export default class SessionHandler extends OTHandler {

  constructor() {
    super();
    this._disable();
  }

  initSession() {
    this._master = true;
    this._nextId = 0;
    this._id = this.__generateId();
    this._stateVector[this._id] = 0;
    this._enable();
  }

  joinSession() {
    this.__tmpId = generateUUID();
    this._send({
      type: 'request-join',
      tmpId: this.__tmpId
    });
  }

  _joinRequested(op) {
    if (!this._master) {
      return;
    }
    const id = this.__generateId();
    this._stateVector[id] = 0;

    const joinMessage = {
      type: 'join',
      tmpId: op.tmpId,
      id: id,
      stateVector: Object.assign({}, this._stateVector),
      text: this.value
      // TODO: include caret positions
    };
    this._send(joinMessage);
  }

  _joinMessageReceived(message) {
    if (this._isActive() || message.tmpId !== this.__tmpId) {
      return;
    }
    this._enable();

    this._id = message.id;
    this._stateVector = message.stateVector;
    this._setValueSilently(message.text);

    this._joined = true;
    this._checkQueue();
  }

  _isActive() {
    return this._master || this._joined;
  }

  __generateId() {
    return this._nextId++;
  }
}

