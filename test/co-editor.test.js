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
  });

  const setInitialText = text => {
    first._quill.setText(text, 'api');
    second._quill.setText(text, 'api');
  }

  const insertText = (editor, index, text) =>
    editor._quill.insertText(index, text, 'user');
  const deleteText = (editor, index, length) =>
    editor._quill.deleteText(index, length, 'user');

  const expectText = (editor, text) =>
    // Quill inserts a newline to the end
    expect(editor.value).to.equal(text + '\n');

  const expectConvergence = () =>
    expect(first.value).to.equal(second.value);

  const expectTexts = text => {
    expectText(first, text);
    expectText(second, text);
  };

  describe('join session', () => {
    it('should set typed initial text', () => {
      insertText(first, 0, 'foo');
      second.receive(first.generateJoinMessage());
      expectText(second, 'foo');
    });
    it('should set initial text set as property', () => {
      first.value = 'foo';
      second.receive(first.generateJoinMessage());
      expectText(second, 'foo');
    });
  });

  describe('consistency management', () => {

    let delay;

    beforeEach(() => {
      second.receive(first.generateJoinMessage());

      first.send = op => delay ?
        setTimeout(() => second.receive(op), delay)
        : second.receive(op);

      second.send = op => delay ?
        setTimeout(() => first.receive(op), delay)
        : first.receive(op);
    });

    it('should converge on insert', async () => {
      insertText(first, 0, 'foo');
      expectTexts('foo');
    });

    it('should converge on delete', async () => {
      insertText(first, 0, 'foobar');
      deleteText(first, 2, 3);
      expectTexts('for');
    });

    describe('concurrent convergence', function () {
      this.timeout(5000);
      beforeEach(() => {
        delay = 100;
      });

      it('should converge on concurrent inserts', done => {
        insertText(first, 0, 'foo');
        insertText(second, 0, 'bar');

        setTimeout(() => {
          expectTexts('barfoo');
          done();
        }, delay * 2);
      });

      it('should converge on concurrent deletes', done => {
        setInitialText('foobar');

        deleteText(first, 0, 1);
        deleteText(second, 2, 2);

        setTimeout(() => {
          // Not checking the actual values, as not
          // verifying intention-preservation yet
          expectConvergence();
          done();
        }, delay * 2);
      });

      it('should converge on concurrent insert and delete', done => {
        setInitialText('foobar');

        insertText(first, 3, 'qux');
        deleteText(second, 2, 2);

        setTimeout(() => {
          // Not checking the actual values, as not
          // verifying intention-preservation yet
          expectConvergence();
          done();
        }, delay * 2);
      });
    });

    describe('causality preservation', function () {

      let ops1, ops2;

      beforeEach(() => {
        ops1 = [];
        ops2 = [];
        first.send = ops1.push.bind(ops1);
        second.send = ops2.push.bind(ops2);
      });

      it('should not execute op received before a dependent op', () => {
        insertText(first, 0, 'a');
        insertText(first, 1, 'b');

        second.receive(ops1[1]);
        expectText(second, '');
      });

      it('should execute ops received in wrong order', () => {
        insertText(first, 0, 'a');
        insertText(first, 1, 'b');

        second.receive(ops1[1]);
        second.receive(ops1[0]);
        expectTexts('ab');
      });

      it('should execute all causally ready ops from queue asap', () => {
        insertText(first, 0, 'a');
        insertText(first, 1, 'b');
        insertText(first, 2, 'c');
        insertText(first, 3, 'd');
        insertText(first, 4, 'e');

        second.receive(ops1[1]);
        second.receive(ops1[2]);
        second.receive(ops1[4]);
        expectText(second, '');
        expect(second._queue.length).to.equal(3);

        second.receive(ops1[0]);
        expectText(second, 'abc');
        expect(second._queue.length).to.equal(1);

        second.receive(ops1[3]);
        expectText(second, 'abcde');
        expect(second._queue.length).to.equal(0);
      });
    });

    describe('intention preserved convergence', function () {
      this.timeout(5000);
      beforeEach(() => {
        delay = 100;
        setInitialText('abc');
      });

      it('concurrent inserts', done => {
        insertText(first, 1, 'FOO');
        insertText(second, 2, 'BAR');

        setTimeout(() => {
          expectTexts('aFOObBARc');
          done();
        }, delay * 2);
      });

      describe('concurrent deletes', () => {

        it('different index', done => {
          deleteText(first, 0, 1);
          deleteText(second, 2, 1);

          setTimeout(() => {
            expectTexts('b');
            done();
          }, delay * 2);
        });

        it('same index - should remove only one char', done => {
          deleteText(first, 1, 1);
          deleteText(second, 1, 1);

          setTimeout(() => {
            expectTexts('ac');
            done();
          }, delay * 2);
        });

        it('partly overlapping range', done => {
          setInitialText('abcdef');
          deleteText(first, 1, 3);
          deleteText(second, 2, 3);

          setTimeout(() => {
            expectTexts('af');
            done();
          }, delay * 2);
        });

        it('3 char overlapping range', done => {
          setInitialText('abcdef');
          deleteText(first, 0, 4);
          deleteText(second, 1, 4);

          setTimeout(() => {
            expectTexts('f');
            done();
          }, delay * 2);
        });

      });

      describe('concurrent insert and delete', () => {

        it('insert to lower index', done => {
          insertText(first, 1, 'FOO');
          deleteText(second, 2, 1);

          setTimeout(() => {
            expectTexts('aFOOb');
            done();
          }, delay * 2);
        });

        it('delete at lower index', done => {
          insertText(first, 1, 'FOO');
          deleteText(second, 0, 1);

          setTimeout(() => {
            expectTexts('FOObc');
            done();
          }, delay * 2);
        });
      });

    });
  });
});
