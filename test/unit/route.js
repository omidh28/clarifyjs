import Route from '../../src/route';

describe('Route', () => {
  describe('constructor', () => {
    it('should throw type error if the given path is not a string', () => {
      expect(() => new Route({
        path: undefined,
        handler: () => undefined,
      })).to.throw(TypeError);
      expect(() => new Route({
        path: 2,
        handler: () => undefined,
      })).to.throw(TypeError);
    });

    it('should throw type error if the controller path is not a string', () => {
      expect(() => new Route({
        path: '.some',
        handler: () => undefined,
        controller: 32
      })).to.throw(TypeError);
    });

    it('should throw type error if given handler is not a function', () => {
      expect(() => new Route({
        path: '.do.something',
        handler: true,
      })).to.throw(TypeError);
      expect(() => new Route({
        path: '.do.something',
        handler: undefined,
      })).to.throw(TypeError);
    });

    it('should store the given path', () => {
      const route = new Route({ path: '.do.something', handler: () => undefined });
      expect(route).to.have.property('path');
      expect(route.path).to.equal('.do.something');
    });

    it('should store the given controller', () => {
      const route = new Route({
        path: '',
        handler: () => undefined,
        controller: '()'
      });

      expect(route).to.have.property('controller');
      expect(route.controller).to.equal('()');
    });

    it('should store storeResultAs if given directly otherwise scan controller string for it', () => {
      const givenStoreResult = new Route({
        path: '',
        handler: () => undefined,
        controller: '()',
        storeResultAs: 'someThing'
      });

      expect(givenStoreResult.storeResultAs).to.equal('someThing');

      const bothGiven = new Route({
        path: '',
        handler: () => undefined,
        controller: '() => myVar',
        storeResultAs: 'useThis'
      });

      expect(bothGiven.storeResultAs).to.equal('useThis');

      const storeResultInController = new Route({
        path: '',
        handler: () => undefined,
        controller: '() => varInController'
      });

      expect(storeResultInController.storeResultAs).to.equal('varInController');
    });

    it('should store the given injection dependencies as an array', () => {
      const routeOne = new Route({
        path: '.do.something',
        handler: () => undefined,
        inject: 'something'
      });

      expect(routeOne).to.have.property('dependencies');
      expect(routeOne.dependencies).to.be.an('array');
      expect(routeOne.dependencies).to.deep.equal(['something']);

      const routeTwo = new Route({
        path: '.do.something',
        handler: () => undefined,
        inject: ['a', 'few', 'thing'],
      });

      expect(routeTwo).to.have.property('dependencies');
      expect(routeTwo.dependencies).to.be.an('array');
      expect(routeTwo.dependencies).to.deep.equal(['a', 'few', 'thing']);
    });

    it('should store the given priority', () => {
      const route = new Route({
        path: '.do.something',
        handler: () => undefined,
        priority: 2,
      });

      expect(route).to.have.property('priority');
      expect(route.priority).to.equal(2);
    });

    it('should store the given handler', () => {
      const route = new Route({
        path: '.do.something',
        handler: spy()
      });

      expect(route).to.have.property('handler');
      expect(route.handler).to.be.a('function');
      route.handler();
      expect(route.handler).to.have.been.called;
    });

    it('should store the given async option', () => {
      const route = new Route({
        path: '.do.something',
        handler: () => undefined,
        awaitForHandler: false,
      });

      expect(route).to.have.property('awaitForHandler');
      expect(route.awaitForHandler).to.equal(false);
    });

    it('should set awaitForHandler option to false by default', () => {
      const route = new Route({
        path: '.do.something',
        handler: () => undefined,
      });

      expect(route.awaitForHandler).to.be.false;
    });

    it('should set controller to "()" by default', () => {
      const route = new Route({
        path: '.do.it',
        handler: () => undefined,
      });

      expect(route.controller).to.equal('()');
    });

    it('should set storeResultAs to empty string by default', () => {
      const route = new Route({
        path: '.do.it',
        handler: () => undefined,
      });

      expect(route.storeResultAs).to.equal('');
    });

    it('should throw type error if the given awaitForHandler option is not a boolean', () => {
      expect(() => {
        new Route({
          path: '.do.something',
          handler: () => undefined,
          awaitForHandler: 'invalid',
        });
      }).to.throw(TypeError);
    });

    it('should throw type error if the given storeResultAs option is not a string', () => {
      expect(() => {
        new Route({
          path: '.do.something',
          handler: () => undefined,
          storeResultAs: false,
        });
      }).to.throw(TypeError);
    });

    it('should set priority to negative infinity by default', () => {
      const route = new Route({
        path: '.do.something',
        handler: () => undefined,
      });

      expect(route.priority).to.equal(-Infinity);
    });

    it('should set inject to empty array by default', () => {
      const route = new Route({
        path: '.do.something',
        handler: () => undefined,
      });

      expect(route.dependencies).to.be.an('array');
      expect(route.dependencies).to.be.empty;
    });

    it('should throw type error if the given priority is not a number', () => {
      expect(() => {
        new Route({
          path: '.do.something',
          handler: () => undefined,
          priority: true
        });
      }).to.throw(TypeError);
    });

    it('should throw type error if the given inject is not a string or an array', () => {
      expect(() => {
        new Route({
          path: '.do.something',
          handler: () => undefined,
          inject: true
        });
      }).to.throw(TypeError);
    });
  });

  describe('isFunctionStyle', () => {
    it('should return true if the route endpoint should be called in function style, false otherwise', () => {
      const propertyStyle = new Route({
        path: '.do.something',
        controller: '[] => myVar',
        handler: () => undefined,
      });


      const functionStyle = new Route({
        path: '',
        controller: '()',
        handler: () => undefined,
      });

      expect(propertyStyle.isFunctionStyle()).to.be.false;
      expect(functionStyle.isFunctionStyle()).to.be.true;
    });
  });

  describe('shouldStoreResult', () => {
    it('should return the name after "=>" arrow, return false if not exists', () => {
      const withArrow = new Route({
        path: '.do.something',
        controller: '[] => myVar',
        handler: () => undefined,
      });


      const withoutArrow = new Route({
        path: '',
        controller: '()',
        handler: () => undefined,
      });

      expect(withArrow.shouldStoreResult()).to.be.equal('myVar');
      expect(withoutArrow.shouldStoreResult()).to.be.false;
    });
  });

  describe('componentsOf', () => {
    it('should return componenets of the given path', () => {
      const components = Route.componentsOf('my.route.*.path');
      expect(components).to.be.an('array');
      expect(components).to.have.lengthOf(4);
      expect(components).to.include('my');
      expect(components).to.include('route');
      expect(components).to.include('*');
      expect(components).to.include('path');
    });
  });

  describe('componentsToPath', () => {
    it('should return a path created by the given components', () => {
      const path = Route.componentsToPath(['my', 'route', 'path']);
      expect(path).to.be.a('string');
      expect(path).to.equal('my.route.path');
    });

    it('should throw TypeError if any of components are not string', () => {
      expect(() => {
        Route.componentsToPath(['my', undefined, 'path']);
      }).to.throw(TypeError);
    });
  });
});
