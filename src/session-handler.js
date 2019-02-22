import OTHandler from "./ot-handler";

export default class SessionHandler extends OTHandler {

  constructor() {
    super();
    this._disable();
  }

  static get observedAttributes() { return ['master']; }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this.master) {
      this._nextId = 0;
      this._id = this._generateId();
      this._stateVector[this._id] = 0;
      this._enable();
    } else {
      this._disable();
    }
  }

  get master() {
    return this.hasAttribute('master');
  }

  set master(value) {
    if (value) {
      this.setAttribute('master', value);
    } else {
      this.removeAttribute('master');
    }
  }

  _isActive() {
    return this.master || this._joined;
  }

  _generateId() {
    return this._nextId++;
  }

  /**
   * Returns a message that contains information for
   * another client to join this client's session.
   */
  generateJoinMessage() {
    if (!this.master) {
      throw new Error('Only a master editor can generate ' +
        'a message for others to join its session. ' +
        'Set the "master" attribute on the editor first.');
    }

    const id = this._generateId();
    this._stateVector[id] = 0;

    return JSON.stringify({
      type: 'join',
      id: id,
      stateVector: Object.assign({}, this._stateVector),
      text: this.value
      // TODO: include caret positions?
    });
  }

  _joinSession(message) {
    if (this.master) {
      throw new Error('A master editor received a ' +
        'message to join another session. This is not allowed.');
    }
    this._enable();

    this._id = message.id;
    this._stateVector = message.stateVector;
    this._setValueSilently(message.text);

    // Remove from queue operations which are
    // already effective in the initial text
    this._queue = this._queue.filter(op =>
      op.stateVector[op.userId] > this._stateVector[op.userId]);

    this._joined = true;
  }
}

