import OTHandler from "./ot-handler";

export default class SessionHandler extends OTHandler {

  static get observedAttributes() { return ['master']; }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this.hasAttribute('master')) {
      this._master = true;
      this._nextId = 0;
      this._id = this._generateId();
      this._sv[this._id] = 0;
    } else {
      this._disable();
    }
  }

  _isActive() {
    return this._master || this._joined;
  }

  _generateId() {
    return this._nextId++;
  }

  /**
   * Returns a message that contains information for
   * another client to join this client's session.
   */
  generateJoinMessage() {
    if (!this._master) {
      throw new Error('Only a master editor can generate ' +
        'a message for others to join its session. ' +
        'Set the "master" attribute on the editor first.');
    }

    const id = this._generateId();
    this._sv[id] = 0;

    return {
      type: 'join',
      id: id,
      sv: Object.assign({}, this._sv),
      text: this.value
      // TODO: include caret positions?
    }
  }

  _joinSession(message) {
    if (this._master) {
      throw new Error('A master editor received a ' +
        'message to join another session. This is not allowed.');
    }
    this._enable();

    this._id = message.id;
    this._sv = message.sv;
    this._setValueSilently(message.text);

    // Remove from queue operations which are
    // already effective in the initial text
    this._queue = this._queue.filter(op =>
      op.sv[op.clientId] > this._sv[op.clientId]);

    this._joined = true;
  }
}

