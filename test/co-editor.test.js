import {
  html,
  fixture,
  expect,
} from '@open-wc/testing';

import '../src/co-editor';

describe('<co-editor>', () => {

  let first, second;

  beforeEach(async () => {
    const parent = await fixture(html`
      <div>
        <co-editor id="one" master></co-editor>
        <co-editor id="two"></co-editor>
      </div>
    `);
    first = parent.querySelector("#one");
    second = parent.querySelector("#two");

    second.receive(first.generateJoinMessage());

    first.send = op => second.receive(op);
    second.send = op => first.receive(op);
  });

  const insertText = (editor, index, text) =>
    editor._quill.insertText(index, text, 'user');
  const deleteText = (editor, index, length) =>
    editor._quill.deleteText(index, length, 'user');

  const expectText = (editor, text) =>
    // For some reason quill adds newline
    expect(editor._quill.getText()).to.equal(text + '\n');

  const expectTexts = text => {
    expectText(first, text);
    expectText(second, text);
  };

  it('should converge on insert', async () => {
    insertText(first, 0, 'foo');
    expectTexts('foo');
  });

  it('should converge on delete', async () => {
    insertText(first, 0, 'foobar');
    deleteText(first, 2, 3);
    expectTexts('for');
  });
});
