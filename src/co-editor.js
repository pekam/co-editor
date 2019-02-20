import SessionHandler from "./session-handler";

class CoEditor extends SessionHandler {

  get name() {
    return this.getAttribute('name');
  }

  set name(value) {
    if (value) {
      this.setAttribute('name', value);
    } else {
      this.removeAttribute('name');
    }
  }

  _onUserInput(operation) {
    this._stateVector[this._id]++;
    operation.stateVector = Object.assign({}, this._stateVector);
    this._log.push(operation);
    this.__send(operation);
  }

  _onUserSelectionChange(operation) {
    this._isActive() && this.__send(operation);
  }

  __send(operation) {
    operation.clientId = this._id;
    operation.clientName = this.name;
    this.dispatchEvent(new CustomEvent('update', { detail: JSON.stringify(operation) }));
  }

  receive(operation) {
    operation = JSON.parse(operation);

    if (this._isActive() && operation.clientId === this._id) {
      return;
    }
    console.log(operation);
    switch (operation.type) {

      case 'join':
        this._joinSession(operation);
        break;

      case 'insert':
      case 'delete':
        this._isActive() && this._remoteOperationReceived(operation);
        break;

      case 'caret':
        this._isActive() && this._doExecute(operation);
        break;

      default:
        throw new Error(`Unhandled message type ${operation.type}`);
    }
  }
}
customElements.define('co-editor', CoEditor);
