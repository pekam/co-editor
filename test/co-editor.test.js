import {
  html,
  fixture,
  expect,
} from '@open-wc/testing';

import '../src/co-editor';

describe('<co-editor>', () => {

  let first, second;
  let allClients;
  let parent;
  let delay;

  let ops1, ops2 // used to cache operations and flush them later

  beforeEach(async () => {
    delay = undefined;
    parent = await fixture(html`
      <div>
        <co-editor id="one"></co-editor>
        <co-editor id="two"></co-editor>
      </div>
    `);
    first = parent.querySelector("#one");
    second = parent.querySelector("#two");
    allClients = [first, second];
    first.initSession();
    ops1 = [];
    ops2 = [];
  });

  const connectClients = (clients = allClients) =>
    clients.forEach(client => client.addEventListener('update', e =>
      clients.forEach(otherClient => client !== otherClient && sendTo(e.detail, otherClient))));

  const connectClientsWithCaching = () => {
    first.addEventListener('update', e => {
      if (e.detail.includes('join')) {
        second.receive(e.detail);
      } else {
        ops1.push(e.detail);
      }
    });
    second.addEventListener('update', e => {
      if (e.detail.includes('join')) {
        first.receive(e.detail);
      } else {
        ops2.push(e.detail);
      }
    });
  }

  const addClient = () => {
    const client = document.createElement('co-editor');
    parent.appendChild(client);
    allClients.push(client);
    return client;
  }

  const sendTo = (op, receiver) =>
    delay ? setTimeout(() => receiver.receive(op), delay) : receiver.receive(op);

  const setInitialText = text =>
    allClients.forEach(client => client._quill.setText(text, 'api'));

  const insertText = (editor, index, text) =>
    editor._quill.insertText(index, text, 'user');
  const deleteText = (editor, index, length) =>
    editor._quill.deleteText(index, length, 'user');

  const expectText = (editor, text) =>
    // Quill inserts a newline to the end
    expect(editor.value).to.equal(text + '\n');

  const expectConvergence = () =>
    allClients.forEach(client => expect(client.value).to.equal(first.value));

  const expectTexts = text =>
    allClients.forEach(client => expectText(client, text));

  const repeat = (func, n) => [...Array(n).keys()].forEach(func);

  describe('before join', () => {
    it('should enable master', () => {
      insertText(first, 0, 'foo');
      expectText(first, 'foo');
    });
    it('should disable client', () => {
      insertText(second, 0, 'foo');
      expectText(second, '');
    });
    it('should not execute remote ops as disabled', () => {
      connectClients();
      insertText(first, 0, 'foo');
      expectText(second, '');
    });
  });

  describe('join session', () => {
    it('should set typed initial text', () => {
      insertText(first, 0, 'foo');
      connectClients();
      second.joinSession();
      expectText(second, 'foo');
    });
    it('should set initial text set as property', () => {
      first.value = 'foo';
      connectClients();
      second.joinSession();
      expectText(second, 'foo');
    });
    it('should execute queued ops', () => {
      connectClients();
      let joinMessage;
      const defaultReceive = second.receive;
      second.receive = op => {
        if (!joinMessage && JSON.parse(op).type === 'join') {
          joinMessage = op;
        } else {
          defaultReceive.call(second, op);
        }
      };
      second.joinSession();
      insertText(first, 0, 'foo');
      expectText(second, '');
      expect(second._queue.length).to.eql(3);
      second.receive(joinMessage);
      expectText(second, 'foo');
      expect(second._queue.length).to.eql(0);
    });
    it('should clear queue from ops effective in initial text', () => {
      connectClients();
      insertText(first, 0, 'foo');
      second.joinSession();
      expect(second._queue).to.eql([]);
    });
  });

  describe('consistency management', () => {

    describe('two clients', () => {

      describe('synchronized convergence', () => {

        beforeEach(() => {
          connectClients();
          second.joinSession();
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

        it('should converge on set value', () => {
          second.value = 'foo';
          expectTexts('foo');
        });
      });

      describe('concurrent convergence', function () {
        this.timeout(5000);
        beforeEach(() => {
          connectClients();
          second.joinSession();
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

        beforeEach(() => {
          connectClientsWithCaching();
          second.joinSession();
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
          connectClients();
          second.joinSession();
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

        describe('insert and delete at both clients', () => {

          const replaceText = (client, index, text) => {
            deleteText(client, index, 1);
            insertText(client, index, text);
          }

          it('replace at the same position', done => {
            replaceText(first, 1, 'A');
            replaceText(second, 1, 'B');

            setTimeout(() => {
              expectTexts('aBAc');
              done();
            }, delay * 2);
          });

          // https://github.com/pekam/co-editor/issues/8
          xit('del-ins-del vs del-ins at the same position', done => {
            replaceText(first, 1, 'A');
            deleteText(first, 1, 1);
            replaceText(second, 1, 'B');

            setTimeout(() => {
              expectTexts('aBc');
              done();
            }, delay * 2);
          });

        });
      });
    });

    describe('three clients', () => {

      beforeEach(() => {
        connectClients();
        second.joinSession();
      });

      const addClientAndConnect = () => {
        const client = addClient();
        connectClients();
        client.joinSession();
        return client;
      };

      it('should converge after third client joins and types', () => {
        const third = addClientAndConnect();
        insertText(third, 0, 'foo');
        expectTexts('foo');
      });

      it('should converge after third client joins and second one types', () => {
        addClientAndConnect();
        insertText(second, 0, 'foo');
        expectTexts('foo');
      });

      it('should converge after third client joins with initial value', () => {
        insertText(first, 0, 'foo');
        addClientAndConnect();
        expectTexts('foo');
      });
    });
  });

  describe('garbage collecting', () => {

    const expectLogInserts = (editor, expected) => {
      expect(editor._log.map(op => op.text)).to.eql(expected);
    }
    const expectLogLength = (editor, expected) => {
      expect(editor._log.length).to.eql(expected);
    }

    beforeEach(() => {
      connectClientsWithCaching();
      second.joinSession();
    });

    it('should save local op in log', () => {
      insertText(first, 0, 'a');
      expectLogInserts(first, ['a']);
    });

    it('should clear received op from log as integrated by all', () => {
      insertText(first, 0, 'a');
      second.receive(ops1[0]);
      expectLogInserts(second, []);
    });

    it('should clear local op from log after getting later update from other', () => {
      insertText(first, 0, 'a');
      second.receive(ops1[0]);
      insertText(second, 1, '_');
      first.receive(ops2[0]);
      expectLogInserts(first, []);
    });

    it('should keep local ops not yet integrated by other', () => {
      insertText(first, 0, 'ab');
      second.receive(ops1[0]);
      insertText(second, 1, '_');
      first.receive(ops2[0]);
      // op from second is not cleared as garbage collector checks only from the start of the log
      expectLogInserts(first, ['b', '_']);
    });

    it('should clear all local ops integrated by other', () => {
      insertText(first, 0, 'abcd');
      second.receive(ops1[0]);
      second.receive(ops1[1]);
      second.receive(ops1[2]);
      insertText(second, 1, '_');
      first.receive(ops2[0]);
      expectLogInserts(first, ['d', '_']);
    });

    describe('state message', () => {

      beforeEach(() => {
        connectClients();
      });

      it('should send state message after receiving enough updates', () => {
        repeat(() => {
          repeat(i => insertText(first, i, '' + i), 9);
          expectLogLength(first, 9);
          insertText(first, 0, 'a');
          expectLogLength(first, 0);
        }, 2);
      });

      it('should reset state message counter on local op', () => {
        repeat(i => insertText(first, i, '' + i), 5);
        expectLogLength(first, 5);
        insertText(second, 0, 'a');
        repeat(i => insertText(first, i, '' + i), 7);
        expectLogLength(first, 7);
        repeat(i => insertText(first, i, '' + i), 3);
        expectLogLength(first, 0);
      });
    });
  });
});
