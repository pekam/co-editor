import OtMixin from './ot-mixin.js';
import EditorMixin from './editor-mixin';

class CoEditor extends OtMixin(EditorMixin(HTMLElement)) {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          border: 1px solid lightgrey;
        }
      </style>
      `;
    this._initEditor();
  }

  _onUserInput(operation) {
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
    this._doExecute(operation);
  }
}
customElements.define('co-editor', CoEditor);
