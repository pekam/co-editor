import OtMixin from './ot-mixin.js';
import EditorMixin from './editor-mixin';
import StateMixin from './state-mixin';

class CoEditor extends OtMixin(StateMixin(EditorMixin(HTMLElement))) {

  _onUserInput(operation) {
    this._sv[this._id]++;
    operation.sv = Object.assign({}, this._sv);
    operation.clientId = this._id;
    this.send(operation);
  }

  _onUserSelectionChange(operation) {
    this.send(operation);
  }

  send(operation) {
    // Implemented by user
  }

  receive(operation) {
    console.log(operation);
    switch(operation.type) {

      case 'join':
        this._joinSession(operation);
        break;

      case 'insert':
      case 'delete':
        this._remoteOperationReceived(operation);
        break;

      case 'cursor':
        this._doExecute(operation);
        break;

      default:
        throw new Error(`Unhandled message type ${operation.type}`);
    }
  }
}
customElements.define('co-editor', CoEditor);
