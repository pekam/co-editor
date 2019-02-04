import './node_modules/quill/dist/quill.min.js';

class CoEditor extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <link href="//cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
      <style>
        :host {
          display: block;
        }
      </style>
      <div id="editor-container"></div>
      `;

    const container = this.shadowRoot.querySelector('#editor-container');

    this._quill = new Quill(container, {
      modules: {
        toolbar: false
      },
      formats: [],
      theme: 'snow'
    });

    this._quill.on('text-change', function (delta, oldDelta, source) {
      if (source === 'user') {
        this._textChanged(delta.ops);
      }
    }.bind(this));
  }

  _textChanged(ops) {
    let index = 0;
    ops.forEach(op => {

      if (op.retain) {
        index += op.retain;
      }

      else if (op.insert) { // Contains the string to insert
        this.send({
          type: 'insert',
          index: index,
          text: op.insert
        });
        // this.send(`INSERT[${index}, ${op.insert}]`);

        // When having selected text and inserting, the insert comes before the delete
        // so the index needs to be shifted 
        index += op.insert.length;
      }

      else if (op.delete) { // Contains the length of deletion
        this.send({
          type: 'delete',
          index: index,
          length: op.delete
        });
        // this.send(`DELETE[${index}, ${op.delete}]`);
      }
    });
  }

  send(operation) {
    // Implemented by user
  }

  receive(operation) {
    console.log(operation);
    if (operation.type === 'insert') {
      this._quill.insertText(operation.index, operation.text);
    } else if (operation.type === 'delete') {
      this._quill.deleteText(operation.index, operation.length);
    }
  }
}
customElements.define('co-editor', CoEditor);
