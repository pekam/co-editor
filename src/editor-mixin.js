import '../vendor/vaadin-quill.min.js';
import '../node_modules/quill-cursors/dist/quill-cursors.min';

export default function (superClass) {
  return class EditorMixin extends superClass {

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
        <link href="//cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
        <link rel="stylesheet" href="/node_modules/quill-cursors/dist/quill-cursors.css">
        <div id="editor-container"></div>
        `;
      const container = this.shadowRoot.querySelector('#editor-container');

      Quill.register('modules/cursors', QuillCursors);
      this._quill = new Quill(container, {
        modules: {
          toolbar: false,
          cursors: true,
          history: { maxStack: 0 } // Disabling Quill's undo/redo
        },
        formats: []
      });
      this._cursors = this._quill.getModule('cursors');

      this._quill.on('selection-change', function (range, oldRange, source) {
        range && this._onUserSelectionChange({
          type: 'caret',
          index: range.index,
          length: range.length
        });
      }.bind(this));

      this._quill.on('text-change', function (delta, oldDelta, source) {
        if (source !== 'user') {
          return;
        }

        // Transforms the changes to a simpler format in a single object:
        // { retain: number, insert: string, delete: number }
        const ops = delta.ops.reduce((acc, op) => Object.assign(acc, op), {});

        const index = ops.retain || 0;

        if (ops.delete) {
          const oldText = oldDelta.ops[0].insert;
          const deletedText = oldText.substring(index, index + ops.delete);

          this._onUserInput({
            type: 'delete',
            index: index,
            text: deletedText
          });
        }

        if (ops.insert) {
          this._onUserInput({
            type: 'insert',
            index: index,
            text: ops.insert
          });
        }
      }.bind(this));
    }

    getText() {
      return this._quill.getText();
    }

    _setText(text) {
      this._quill.setText(text);
    }

    _disable() {
      this._quill.disable();
    }

    _enable() {
      this._quill.enable();
    }

    _doExecute(op) {
      switch (op.type) {

        case 'insert':
          this._quill.insertText(op.index, op.text);
          this.__updateCaret(op.clientId, op.name, op.index + op.text.length, 0);
          break;

        case 'delete':
          this._quill.deleteText(op.index, op.text.length);
          this.__updateCaret(op.clientId, op.name, op.index, 0);
          break;

        case 'caret':
          this.__updateCaret(op.clientId, op.name, op.index, op.length);
          break;
      }
    }

    __updateCaret(id, name, index, length) {
      if (Object.values(this._cursors.cursors).find(cursor => cursor.userId === id)) {
        this._cursors.moveCursor(id, { index: index, length: length });
      } else {
        this._cursors.setCursor(
          id, { index: index, length: length },
          name, this.__getRandomColor()
        );
      }
    }

    __getRandomColor() {
      var letters = '0123456789ABCDEF';
      var color = '#';
      for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }
  }
}
