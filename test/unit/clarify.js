import clarify from '../../src/clarify';

describe('clarify', () => {
  it('should properly store and inject data to method handlers', (done) => {
    const sendMessageFunc = spy();
    const selectContactFunc = spy((selectedContacts) => selectedContacts);
    const filterContactFunc = spy((contacts, filter) => contacts + ' without ' + filter);
    const logFunc = spy();
    const routes = [
      {
        path: '',
        handler: sendMessageFunc,
        inject: ['contacts'],
        awaitForHandler: true,
        priority: 0
      },
      {
        path: 'to',
        handler: selectContactFunc,
        storeResultAs: 'contacts',
        priority: 2
      },
      {
        path: 'to.except',
        handler: filterContactFunc,
        inject: ['contacts'],
        storeResultAs: 'contacts',
        priority: 1
      },
      {
        path: 'to.except.then.log',
        handler: logFunc,
        priority: -Infinity
      }
  ];

  const send = clarify({ routes });
  send('hello everyone!').to('friends').except('john').then.log();
  setTimeout(() => {
    expect(selectContactFunc.args[0][0]).to.equal('friends');
    expect(filterContactFunc.args[0][0]).to.equal('friends');
    expect(filterContactFunc.args[0][1]).to.equal('john');
    expect(sendMessageFunc.args[0][0]).to.equal('friends without john');
    expect(sendMessageFunc.args[0][1]).to.equal('hello everyone!');
    done();
  }, 10);
  });

  it('should store given default storage values', (done) => {
    const routes = [{
      path: '',
      inject: ['someDefaultValue'],
      handler: spy()
    }];

    const storage = {
      someDefaultValue: 1
    };

    const invoker = clarify({ routes, storage });
    invoker();
    setTimeout(() => {
      expect(routes[0].handler).to.have.been.calledWith(1);
      done();

    }, 10);
  });
});
