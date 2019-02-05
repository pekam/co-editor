export default function (superClass) {
  return class StateMixin extends superClass {

    _sv = {}; // State vector

    constructor() {
      super();
      if (this._isMaster()) {
        this._nextId = 0;
        this._id = this._generateId();
        this._sv[this._id] = 0;
      } else {
        this._disable();
      }
    }

    _isMaster() {
      return this.hasAttribute('master');
    }

    // _isCausallyReady(operation) {
    //   return this._isMaster() || this._joined;
    // }

    _generateId() {
      return this._nextId++;
    }

    /**
     * Returns a message that contains information for
     * another client to join this client's session.
     */
    generateJoinMessage() {
      if (!this._isMaster()) {
        throw new Error('Only a master editor can generate ' +
          'a message for others to join its session. ' +
          'Set the "master" attribute on the editor first.');
      }

      const id = this._generateId();
      this._sv[id] = 0;

      return {
        type: 'join',
        id: id,
        sv: this._sv,
        text: this.getText()
        // TODO: include caret positions?
      }
    }

    _joinSession(message) {
      if (this._isMaster()) {
        throw new Error('A master editor received a ' +
          'message to join another session. This is not allowed.');
      }

      this._id = message.id;
      this._sv = message.sv;
      this._setText(message.text);

      this._joined = true;
      this._enable();
    }
  }
}
