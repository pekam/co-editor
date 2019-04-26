import '../vendor/quill.core.js';
import '../node_modules/quill-cursors/dist/quill-cursors.min.js';
import quillStyles from '../vendor/quill-styles.js';
import { generateRandomColor } from './helpers.js';

export default class EditorBase extends HTMLElement {

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
        <style>${quillStyles}</style>
        <div id="editor-container"></div>
        `;
    const container = this.shadowRoot.querySelector('#editor-container');

    Quill.register('modules/cursors', QuillCursors);
    this._quill = new Quill(container, {
      modules: {
        cursors: true,
        history: { maxStack: 0 } // Disables Quill's undo/redo
      },
      formats: []
    });
    this.__quillCursors = this._quill.getModule('cursors');
    this.__caretData = {};

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

      // Generate character-wise operation messages
      const index = ops.retain || 0;
      ops.delete && [...Array(ops.delete)].forEach(_ => this._onUserInput({
        type: 'delete',
        index,
        length: 1
      }));
      ops.insert && [...ops.insert].forEach((c, i) => this._onUserInput({
        type: 'insert',
        index: index + i,
        text: c
      }));
    }.bind(this));
  }

  get value() {
    return this._quill.getText();
  }

  set value(value) {
    if (this._quill.isEnabled()) {
      this._quill.deleteText(0, this._quill.getLength(), 'user');
      this._quill.insertText(0, value, 'user');
    }
  }

  // This doesn't generate any operations
  _setValueSilently(value) {
    this._quill.setText(value);
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
        this.__updateCaret(op.userId, op.username, op.index + op.text.length, 0);
        break;

      case 'delete':
        if (op.disabledBy && op.disabledBy.length) {
          return;
        }

        this._quill.deleteText(op.index, op.length);
        this.__updateCaret(op.userId, op.username, op.index, 0);
        break;

      case 'caret':
        this.__updateCaret(op.userId, op.username, op.index, op.length);
        break;
    }
  }

  __updateCaret(id, username, index, length) {
    const range = { index, length };
    if (!this.__caretData[id]) {
      this.__addCaret(id, username, range);
    } else if (username !== this.__caretData[id].username) {
      // Needs to be removed and re-added to update the name
      this.__quillCursors.removeCursor(id);
      this.__addCaret(id, username, range);
    } else {
      this.__quillCursors.moveCursor(id, range);
    }
  }

  __addCaret(id, username, range) {
    const color = (this.__caretData[id] && this.__caretData[id].color)
      || generateRandomColor();
    this.__quillCursors.setCursor(id, range, username, color);
    this.__caretData[id] = { username, color };
  }
}
