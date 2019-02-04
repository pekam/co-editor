import {
  html,
  fixture,
  expect,
} from '@open-wc/testing';

import '../co-editor';

describe('<co-editor>', () => {
  
  let first, second;
  
  beforeEach(async () => {
    const parent = await fixture(html`
      <div>
        <co-editor id="one"></co-editor>
        <co-editor id="two"></co-editor>
      </div>
    `);
    first = parent.querySelector("#one");
    second = parent.querySelector("#two");
    first.send = op => second.receive(op);
    second.send = op => first.receive(op);
  });

  const insert = (editor, index, text) =>
    editor._quill.insertText(index, text, 'user');

  const expectText = (editor, text) =>
    // For some reason quill adds newline
    expect(editor._quill.getText()).to.equal(text + '\n');

  const expectTexts = text => {
    expectText(first, text);
    expectText(second, text);
  };

  it('should converge on insert', async () => {
    insert(first, 0, 'foo');
    expectTexts('foo');
  });
});
