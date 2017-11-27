import CallManager from '../../src/callManager';
import StateContainer from '../../src/stateContainer';
import Blueprint from '../../src/blueprint';
import Route from '../../src/route';

describe('CallManager', () => {
  let callManager;
  let stateContainer

  describe('constructor', () => {
    beforeEach(() => {
      stateContainer = new StateContainer;
      callManager = new CallManager({ stateContainer });
    });

    it('should create an array to store calls', () => {
      expect(callManager._queue).to.be.an('array');
    });

    it('should create an array to store passed arguments', () => {
      expect(callManager._passedHandlerArgs).to.be.an('array');
    });

    it('should store the passed state container', () => {
      expect(callManager._stateContainer).to.be.instanceOf(StateContainer);
      expect(callManager._stateContainer).to.deep.equal(stateContainer);
    });
  });

  describe('deferApplyOnce', () => {
    it('should defer and call "apply" function once even after multiple calls', (done) => {
      callManager.apply = spy(callManager.apply);
      callManager.deferApplyOnce();
      callManager.deferApplyOnce();
      callManager.deferApplyOnce();
      callManager.deferApplyOnce();
      expect(callManager.apply).to.not.have.been.called;
      setTimeout(() => {
        expect(callManager.apply).to.have.been.calledOnce;
        done();
      }, 1);
    });
  });

  describe('schedule', () => {
    beforeEach(() => {
      stateContainer = new StateContainer;
      callManager = new CallManager({ stateContainer });
    });

    it('should push passed routes to queue array', () => {
      const obj = {
        handler: () => {},
        inject: ['someData'],
        priority: 1,
        awaitForHandler: false,
        path: 'some'
      };

      callManager.schedule(new Route(obj));
      expect(callManager._queue[0].path).to.equal('some');
    });

    it('should push passed arguments to passedHandlerArgs arry', () => {
      const obj = {
        handler: () => {},
        inject: ['someData'],
        priority: 1,
        awaitForHandler: false,
        path: 'some'
      };

      callManager.schedule(new Route(obj), true, 1, 'string');
      expect(callManager._passedHandlerArgs[0].length).to.equal(3);
      expect(callManager._passedHandlerArgs[0][0]).to.equal(true);
      expect(callManager._passedHandlerArgs[0][1]).to.equal(1);
      expect(callManager._passedHandlerArgs[0][2]).to.equal('string');
    });
  });

  describe('processNextItem', () => {
    beforeEach(() => {
      stateContainer = new StateContainer;
      callManager = new CallManager({ stateContainer });
    });

    it('should call the first item in the queue', () => {
      const toCall = {
        handler: sinon.stub(),
        path: ''
      };

      callManager.schedule(new Route(toCall));
      callManager._processNextItem();
      expect(toCall.handler.called).to.be.true;
    });

    it('should call the handler with its dependencies', () => {
      const toCall = {
        handler: sinon.spy(),
        inject: ['myName', 'yourName'],
        path: 'somePath'
      };

      callManager._stateContainer.store('myName', 'jon');
      callManager._stateContainer.store('yourName', 'doe');
      callManager.schedule(new Route(toCall));
      callManager._processNextItem();
      expect(toCall.handler.calledWithExactly('jon', 'doe')).to.be.true;
    });

    it('should call the handler with its passed arguments', () => {
      const toCall = {
        handler: sinon.spy(),
        path: 'somePath'
      };

      callManager.schedule(new Route(toCall), 'some', 'args');
      callManager._processNextItem();
      expect(toCall.handler.args[0][0]).to.equal('some');
      expect(toCall.handler.args[0][1]).to.equal('args');
    });

    it('should store the result in stateContainer if storeResultAs property is given', () => {
      const toCall = {
        handler: sinon.stub().returns(2),
        storeResultAs: 'someResult',
        path: 'somePath'
      };

      callManager.schedule(new Route(toCall));
      callManager.apply();
      expect(stateContainer.fetch('someResult')).to.be.equal(2);
    });

    it('should remove the item from the queue after calling it', () => {
      const toCall = {
        handler: sinon.stub(),
        path: ''
      };

      callManager.schedule(new Route(toCall));
      callManager._processNextItem();
      expect(callManager._queue).to.be.empty;
    });
  });

  describe('apply', () => {
    beforeEach(() => {
      stateContainer = new StateContainer;
      callManager = new CallManager({ stateContainer });
    });

    it('should call handlers in list in priority order', () => {
      const firstToCall = {
        handler: sinon.stub(),
        priority: 3,
        awaitForHandler: false,
        path: 'some()'
      };

      const secondToCall = {
        handler: sinon.stub(),
        priority: 2,
        awaitForHandler: false,
        path: 'another()'
      };

      const thirdToCall = {
        handler: sinon.stub(),
        priority: 1,
        awaitForHandler: false,
        path: 'path()'
      };

      callManager.schedule(new Route(secondToCall));
      callManager.schedule(new Route(firstToCall));
      callManager.schedule(new Route(thirdToCall));
      callManager.apply();
      expect(firstToCall.handler.calledBefore(secondToCall.handler)).to.be.true;
      expect(secondToCall.handler.calledBefore(thirdToCall.handler)).to.be.true;
      expect(thirdToCall.handler.calledAfter(secondToCall.handler)).to.be.true;
    });

    it('should call resolve of final promise with last result when all calls are finished', () => {
      const firstToCall = {
        handler: spy(() => false),
        priority: 3,
        awaitForHandler: false,
        path: 'somePath'
      };

      const secondToCall = {
        handler: spy(() => true),
        priority: 2,
        awaitForHandler: false,
        path: 'anotherPath'
      };

      callManager.schedule(new Route(secondToCall));
      callManager.schedule(new Route(firstToCall));
      stateContainer.resolve = sinon.spy(stateContainer.resolve);
      expect(stateContainer.resolve.notCalled).to.be.true;
      callManager.apply();
      expect(stateContainer.resolve.calledOnce).to.be.true;
      expect(stateContainer.resolve).to.have.been.calledWith(true);
    });

    it('should wait for async handler to finish if awaitForHandler is true', (done) => {
      const firstToCall = {
        handler: sinon.stub(),
        priority: 3,
        awaitForHandler: false,
        path: 'path'
      };

      const secondToCall = {
        handler: sinon.stub(),
        priority: 2,
        awaitForHandler: false,
        path: 'pathOne'
      };

      const thirdToCall = {
        handler: sinon.stub(),
        priority: 1,
        awaitForHandler: true,
        path: 'somePath'
      }

      const fourthToCall = {
        handler: sinon.stub(),
        priority: 0,
        awaitForHandler: false,
        path: 'some'
      };

      callManager.schedule(new Route(secondToCall));
      callManager.schedule(new Route(firstToCall));
      callManager.schedule(new Route(thirdToCall));
      callManager.schedule(new Route(fourthToCall));

      let resolver;
      const promise = new Promise((resolve, reject) => {
        resolver = resolve;
      });

      thirdToCall.handler.returns(promise);
      callManager.apply();
      expect(firstToCall.handler.calledBefore(secondToCall.handler)).to.be.true;
      expect(secondToCall.handler.calledBefore(thirdToCall.handler)).to.be.true;
      expect(thirdToCall.handler.calledAfter(secondToCall.handler)).to.be.true;
      expect(fourthToCall.handler.notCalled).to.be.true;

      resolver();
      setTimeout(() => {
        expect(fourthToCall.handler.calledAfter(thirdToCall.handler)).to.be.true;
        done();
      }, 10);
    });
  });

  describe('loadDependenciesFor', () => {
    beforeEach(() => {
      stateContainer = new StateContainer;
      callManager = new CallManager({ stateContainer });
    });

    it('should return an ordered array of dependencies that needs to be injected to the handler of the given route', () => {
      const toCall = {
        handler: sinon.spy(),
        dependencies: ['myName', 'yourName']
      };

      stateContainer.store('yourName', 'doe');
      stateContainer.store('myName', 'jon');
      const dependencies = callManager._loadDependenciesFor(toCall);
      expect(dependencies).to.be.an('array');
      expect(dependencies).to.have.lengthOf(2);
      expect(dependencies[0]).to.be.equal('jon');
      expect(dependencies[1]).to.be.equal('doe');
    });
  });

  describe('sortListByPriority', () => {
    beforeEach(() => {
      stateContainer = new StateContainer;
      callManager = new CallManager({ stateContainer });
    });

    it('should descending sort call list by their priority', () => {
      const firstToCall = {
        handler: sinon.spy(),
        priority: 3,
        awaitForHandler: false,
        path: 'some'
      };

      const secondToCall = {
        handler: sinon.spy(),
        priority: 2,
        awaitForHandler: false,
        path: 'someOne'
      };

      const thirdToCall = {
        handler: sinon.spy(),
        priority: 1,
        awaitForHandler: false,
        path: 'somePath'
      };

      callManager.schedule(new Route(secondToCall));
      callManager.schedule(new Route(firstToCall));
      callManager.schedule(new Route(thirdToCall));
      callManager._sortListByPriority();
      expect(callManager._queue[0].path).to.equal('some');
      expect(callManager._queue[1].path).to.equal('someOne');
      expect(callManager._queue[2].path).to.equal('somePath');
    });
  });
});
