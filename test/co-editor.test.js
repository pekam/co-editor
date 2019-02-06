import {
  html,
  fixture,
  expect,
} from '@open-wc/testing';

import '../src/co-editor';

describe('<co-editor>', () => {

  let first, second;
  let delay;

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

    first.send = op => delay ?
      setTimeout(() => second.receive(op), delay)
      : second.receive(op);

    second.send = op => delay ?
      setTimeout(() => first.receive(op), delay)
      : first.receive(op);
  });

  const insertText = (editor, index, text) =>
    editor._quill.insertText(index, text, 'user');
  const deleteText = (editor, index, length) =>
    editor._quill.deleteText(index, length, 'user');

  const expectText = (editor, text) =>
    // Quill inserts a newline to the end
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

  it('should converge on concurrent inserts', done => {
    delay = 50;
    insertText(first, 0, 'foo');
    insertText(second, 0, 'bar');

    setTimeout(() => {
      expectTexts('barfoo');
      done();
    }, 100);
  });
});
