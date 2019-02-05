import '../vendor/vaadin-quill.min.js';
import '../node_modules/quill-cursors/dist/quill-cursors.min';

class CoEditor extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <link href="//cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
      <link rel="stylesheet" href="/node_modules/quill-cursors/dist/quill-cursors.css">
      <style>
        :host {
          display: block;
          border: 1px solid lightgrey;
        }
      </style>
      <div id="editor-container"></div>
      `;

    const container = this.shadowRoot.querySelector('#editor-container');

    Quill.register('modules/cursors', QuillCursors);
    this._quill = new Quill(container, {
      modules: {
        toolbar: false,
        cursors: true
      },
      formats: []
    });

    this._cursors = this._quill.getModule('cursors');
    this._cursors.setCursor(
      '1', /* userId */
      { index: 0, length: 0 }, /* range */
      'User 1', /* name */
      'red' /* color */
    );

    this._quill.on('selection-change', function (range, oldRange, source) {
      range && this.send({
        type: 'cursor',
        range: range
      });
    }.bind(this));

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
      this._cursors.moveCursor('1', {
        index: operation.index + operation.text.length,
        length: 0
      });
    } else if (operation.type === 'delete') {
      this._quill.deleteText(operation.index, operation.length);
      this._cursors.moveCursor('1', {
        index: operation.index,
        length: 0
      });
    } else if (operation.type === 'cursor') {
      this._cursors.moveCursor('1', operation.range);
    }
  }
}
customElements.define('co-editor', CoEditor);
