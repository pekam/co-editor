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
      this._cursors.setCursor(
        '1', /* userId */
        { index: 0, length: 0 }, /* range */
        'User 1', /* name */
        'red' /* color */
      );

      this._quill.on('selection-change', function (range, oldRange, source) {
        range && this._onUserSelectionChange({
          type: 'cursor',
          range: range
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

    _doExecute(operation) {
      if (operation.type === 'insert') {
        this._quill.insertText(operation.index, operation.text);
        this._cursors.moveCursor('1', {
          index: operation.index + operation.text.length,
          length: 0
        });
      } else if (operation.type === 'delete') {
        this._quill.deleteText(operation.index, operation.text.length);
        this._cursors.moveCursor('1', {
          index: operation.index,
          length: 0
        });
      } else if (operation.type === 'cursor') {
        this._cursors.moveCursor('1', operation.range);
      }
    }
  }
}
