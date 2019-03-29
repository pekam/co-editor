import OTHandler from "./ot-handler.js";
import generateUUID from './generate-uuid.js';

export default class SessionHandler extends OTHandler {

  constructor() {
    super();
    this._disable();
  }

  _isActive() {
    return this._master || this._joined;
  }

  _generateId() {
    return this._nextId++;
  }

  initSession() {
    this._master = true;
    this._nextId = 0;
    this._id = this._generateId();
    this._stateVector[this._id] = 0;
    this._enable();
  }

  joinSession() {
    this.__tmpId = generateUUID();
    this.__send({
      type: 'request-join',
      tmpId: this.__tmpId
    });
  }

  _joinRequested(op) {
    if (!this._master) {
      return;
    }
    const id = this._generateId();
    this._stateVector[id] = 0;

    const joinMessage = {
      type: 'join',
      tmpId: op.tmpId,
      id: id,
      stateVector: Object.assign({}, this._stateVector),
      text: this.value
      // TODO: include caret positions?
    };
    this.__send(joinMessage);
  }

  _joinSession(message) {
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
}

