import '../vendor/vaadin-quill.min.js';
import '../node_modules/quill-cursors/dist/quill-cursors.min';

export default function (superClass) {
  return class EditorMixin extends superClass {

    _initEditor() {
      this.shadowRoot.innerHTML += `
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

        let index = 0;
        delta.ops.forEach(op => {

          if (op.retain) {
            index += op.retain;
          }

          else if (op.insert) { // Contains the string to insert
            this._onUserInput({
              type: 'insert',
              index: index,
              text: op.insert
            });

            // When having selected text and inserting, the insert comes before the delete
            // so the index needs to be shifted 
            index += op.insert.length;
          }

          else if (op.delete) { // Contains the length of deletion
            const deletedText = this._quill.getContents()
              .diff(oldDelta).ops
              .find(e => e.insert).insert;

            this._onUserInput({
              type: 'delete',
              index: index,
              length: op.delete,
              text: deletedText
            });
          }
        });
      }.bind(this));
    }

    _doExecute(operation) {
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
}
