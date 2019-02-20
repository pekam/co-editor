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
    operation.clientId = this._id;
    operation.clientName = this.name;
    this._log.push(operation);
    this.send(JSON.stringify(operation));
  }

  _onUserSelectionChange(operation) {
    operation.clientId = this._id;
    operation.clientName = this.name;
    this.send(JSON.stringify(operation));
  }

  send(operation) {
    // Implemented by user
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
