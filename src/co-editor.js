import SessionHandler from "./session-handler.js";

class CoEditor extends SessionHandler {

  get username() {
    return this.getAttribute('username');
  }

  set username(value) {
    if (value) {
      this.setAttribute('username', value);
    } else {
      this.removeAttribute('username');
    }
  }

  _onUserInput(message) {
    super._onUserInput(message);
    this._send(message);
  }

  _onUserSelectionChange(message) {
    this._isActive() && this._send(message);
  }

  _send(message) {
    message.userId = this._id;
    message.username = this.username;
    this.dispatchEvent(new CustomEvent(
      'update', { detail: JSON.stringify(message) }));
  }

  receive(message) {
    message = JSON.parse(message);

    if (this._isActive() && message.userId === this._id) {
      return;
    }
    switch (message.type) {

      case 'request-join':
        this._joinRequested(message);
        break;
      case 'join':
        this._joinMessageReceived(message);
        break;

      case 'insert':
      case 'delete':
        this._remoteOperationReceived(message);
        break;

      case 'caret':
        this._isActive() && this._doExecute(message);
        break;

      default:
        throw new Error(`Unhandled message type ${message.type}`);
    }
    if (message.stateVector && message.userId !== undefined) {
      this._garbageCollectLog(message);
    }
  }
}
customElements.define('co-editor', CoEditor);
