import Builder from '../../src/builder';
import Blueprint from '../../src/blueprint';
import Route from '../../src/route';
import StateContainer from '../../src/stateContainer';
import CallManager from '../../src/callManager';

describe('Builder', () => {
  describe('constructor', () => {
    it('should store the given blueprint object', () => {
      const blueprint = new Blueprint;
      const builder = new Builder({ blueprint });
      expect(builder).to.have.property('_blueprint');
      expect(builder._blueprint).to.deep.equal(blueprint);
    });

    it('should store the given callManager object', () => {
      const stateContainer = new StateContainer;
      const callManager = new CallManager({ stateContainer });
      const builder = new Builder({ callManager });
      expect(builder).to.have.property('_callManager');
      expect(builder._callManager).to.be.an.instanceof(CallManager);
    });
  });

  describe('buildFrom', () => {
    let blueprint = null;
    beforeEach(() => {
      blueprint = new Blueprint;
      const routeOne = new Route({
        path: '',
        handler: () => {}
      });

      const routeTwo = new Route({
        path: 'do',
        handler: () => {}
      });

      const routeThree = new Route({
        path: 'do.nothing',
        handler: () => {}
      });

      const routeFour = new Route({
        path: 'something.true',
        handler: () => {}
      });

      blueprint.addRoute(routeOne);
      blueprint.addRoute(routeTwo);
      blueprint.addRoute(routeThree);
      blueprint.addRoute(routeFour);
    });

    it('should return level one chained properties that are functions, from the given path', () => {
      const stateContainer = new StateContainer;
      const callManager = new CallManager({ stateContainer });
      const builder = new Builder({ blueprint, callManager });

      const builtObjectRoot = builder.buildFrom('');
      expect(builtObjectRoot).to.have.property('do');
      expect(builtObjectRoot.something).to.have.property('true');
      expect(builtObjectRoot.do).to.be.a('function');
      expect(builtObjectRoot.something.true).to.be.a('function');

      const builtObjectEmpty = builder.buildFrom('something.true');
      expect(builtObjectEmpty.do).to.be.undefined;
      expect(builtObjectEmpty.something).to.be.undefined;
    });

    it('should reset finalPromise properties', () => {
      const stateContainer = new StateContainer;
      const callManager = new CallManager({ stateContainer });
      const builder = new Builder({ blueprint, callManager, callManager });
      stateContainer.resetFinalPromiseProperties = spy(stateContainer.resetFinalPromiseProperties);
      const builtObjectRoot = builder.buildFrom('');
      expect(stateContainer.resetFinalPromiseProperties).to.be.have.been.called;
    });

    it('should return finalPromise', () => {
      const stateContainer = new StateContainer;
      const callManager = new CallManager({ stateContainer });
      const builder = new Builder({ blueprint, callManager, callManager });
      const builtObjectRoot = builder.buildFrom('');
      expect(builtObjectRoot).to.be.an.instanceof(Promise);
    });

    it('should call "buildRouteInvoker" function for each path', () => {
      const stateContainer = new StateContainer;
      const callManager = new CallManager({ stateContainer });
      const builder = new Builder({ blueprint, callManager });
      const buildRouteInvokerSpy = spy();
      builder.buildRouteInvoker = buildRouteInvokerSpy;
      builder.buildFrom('');
      expect(buildRouteInvokerSpy.calledTwice).to.be.true;
    });

    it('should pass the corresponding path to "buildRouteInvoker"', () => {
      const stateContainer = new StateContainer;
      const callManager = new CallManager({ stateContainer });
      const builder = new Builder({ blueprint, callManager });
      builder.buildRouteInvoker = spy(builder.buildRouteInvoker);
      builder.buildFrom('');
      expect(builder.buildRouteInvoker.args[0][0].path).to.equal('do');
      expect(builder.buildRouteInvoker.args[1][0].path).to.equal('something.true');
    });

    it('should attach invoker as property if the route is not function style', () => {
      const nonFunctionStyleRoute = new Route({
        path: 'somewhere.good',
        controller: '[]',
        handler: () => undefined
      });

      const anotherNonFunctionStyleRoute = new Route({
        path: 'justhere',
        controller: '[]',
        handler: () => undefined
      });

      blueprint.addRoute(nonFunctionStyleRoute);
      blueprint.addRoute(anotherNonFunctionStyleRoute);

      const callManager = new CallManager({ stateContainer: new StateContainer });
      const builder = new Builder({ blueprint, callManager });
      const builtResult = builder.buildFrom('', true);
      builtResult.somewhere.good;
      builtResult.justhere;

      // NOTE: it is in queue, so it means that the corresponding invoker
      // has been called
      expect(callManager._queue[0].path).to.equal('somewhere.good');
      expect(callManager._queue[1].path).to.equal('justhere');
    });
  });

  describe('buildRouteInvoker', () => {
    let blueprint = null;
    beforeEach(() => {
      blueprint = new Blueprint;
      const routeOne = new Route({
        path: '',
        handler: () => {}
      });

      const routeTwo = new Route({
        path: 'do',
        handler: () => {}
      });

      const routeThree = new Route({
        path: 'do.nothing',
        handler: () => {}
      });

      const routeFour = new Route({
        path: 'something.true',
        handler: () => {}
      });

      blueprint.addRoute(routeOne);
      blueprint.addRoute(routeTwo);
      blueprint.addRoute(routeThree);
      blueprint.addRoute(routeFour);
    });

    it('should return a function as invoker', () => {
      const builder = new Builder({ blueprint })
      const invoker = builder.buildRouteInvoker('do');
      expect(invoker).to.be.a('function');
    });

    describe('returned function', () => {
      it('should call "deferApplyOnce" function', () => {
        const stateContainer = new StateContainer;
        const callManager = new CallManager({ stateContainer });
        const builder = new Builder({ blueprint, callManager });
        callManager.deferApplyOnce = spy(callManager.deferApplyOnce);
        const invoker = builder.buildRouteInvoker(blueprint._routes['something.true']);
        invoker();
        expect(callManager.deferApplyOnce).to.have.been.called;
      });

      it('should call schedule with the corresponding route', () => {
        const stateContainer = new StateContainer;
        const callManager = new CallManager({ stateContainer });
        const builder = new Builder({ blueprint, callManager });
        callManager.schedule = spy(callManager.schedule);
        const invoker = builder.buildRouteInvoker(blueprint._routes['something.true']);
        invoker();
        const scheduleArgument = callManager.schedule.args[0][0];
        expect(scheduleArgument.path).to.equal('something.true');
      });

      it('should return built paths from the current path', () => {
        const stateContainer = new StateContainer;
        const callManager = new CallManager({ stateContainer });
        const builder = new Builder({ blueprint, callManager });
        const invoker = builder.buildRouteInvoker(blueprint._routes['do']);
        const invokeResult = invoker();
        expect(invokeResult).to.have.property('nothing');
      });
    });
  });

  describe('attachFunctionToProperty', () => {
    it('should create property on parent object with the given key', () => {
      const obj = {};
      Builder._attachFunctionToProperty({ parentObject: obj, propertyKey: 'someKey' });
      expect(obj).to.have.property('someKey');
    });

    it('should create a property that invokes the given function on access', () => {
      const myFunction = spy();
      const obj = {};
      Builder._attachFunctionToProperty({
        parentObject: obj,
        propertyKey: 'someKey',
        functionToAttach: myFunction
      });

      obj.someKey;
      expect(myFunction).to.have.been.called;
    });
  });

  describe('unsetAllPropertiesOf', () => {
    it('should delete all enumerable properties of the given object', () => {
      const object = {
        one: 2,
        two() {}
      };

      Builder._unsetAllPropertiesOf(object);
      expect(object).not.to.have.property('one');
      expect(object).not.to.have.property('two');
    });
  });

  describe('getLevelOneParentpath', () => {
    it('should return first level parent path string', () => {
      const threeLevelObject = {
        first: {
          second: {
            third: true
          }
        }
      };

      const firstLevelPath = Builder._getLevelOneParentPath('first.second.third');
      expect(firstLevelPath).to.be.a('string');
      expect(firstLevelPath).to.deep.equal('first.second');
    });

    it('should return false if the parent is the root object itself', () => {
      const oneLevelObject = {
        first: 'someValue'
      };

      const firstLevelPath = Builder._getLevelOneParentPath('first');
      expect(firstLevelPath).to.be.false;
    });
  });

  describe('getChildPath', () => {
    it('should split the given path and return the last piece of the splitted string', () => {
      const path = 'a.long.way';
      const resultChild = Builder._getChildPath(path);
      expect(resultChild).to.equal('way');
    });
  });
});
