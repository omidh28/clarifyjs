import Blueprint from '../../src/blueprint';
import Route from '../../src/route';

describe('Blueprint', () => {
  let blueprint;
  beforeEach(() => {
    blueprint = new Blueprint;
  });

  describe('constructor', () => {
    it('should create an object to hold all routes', () => {
      expect(blueprint).to.have.property('_routes');
      expect(blueprint._routes).to.be.an('object');
    });
  });

  describe('generateRoutesFromOneWithWildcard', () => {
    it('should generate routes with possible paths without wildcard', () => {
      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.*.killApp',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.something',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.nothing',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'justIgnoreMe',
      }));

      const generatedRoutes = blueprint._generateRoutesFromOneWithWildcard(blueprint.getRoute('do.*.killApp'));
      expect(generatedRoutes).to.be.an('array');
      expect(generatedRoutes).to.have.lengthOf(2);
      expect(generatedRoutes[0]).to.be.an.instanceof(Route);
      expect(generatedRoutes[1]).to.be.an.instanceof(Route);
      expect(
        generatedRoutes.find(route => route.path === 'do.something.killApp')
      ).not.to.be.undefined;

      expect(
        generatedRoutes.find(route => route.path === 'do.nothing.killApp')
      ).not.to.be.undefined;
    });

    it('should copy everything except path from wildcard route to generated routes', () => {
      const routeWithWildcard = new Route({
        handler: () => undefined,
        path: 'do.*.killApp',
        priority: 1,
        inject: 'something',
        awaitForHandler: true
      });

      blueprint.addRoute(routeWithWildcard);
      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.nothing',
      }));

      const generatedRoutes = blueprint._generateRoutesFromOneWithWildcard(blueprint.getRoute('do.*.killApp'));
      expect(generatedRoutes).to.be.an('array');
      expect(generatedRoutes).to.have.lengthOf(1);
      const generatedRoute = generatedRoutes[0];
      expect(generatedRoute.path).to.equal('do.nothing.killApp');
      expect(generatedRoute.priority).to.equal(1);
      expect(generatedRoute.dependencies).to.be.an('array').with.lengthOf(1);
      expect(generatedRoute.dependencies).to.include('something');
      expect(generatedRoute.awaitForHandler).to.be.true;
    });
  });

  describe('resolveWildcardCharacters', () => {
    it('should return an array of possible paths with wildcard characters replaced', () => {
      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.*.killApp',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.something.*.nice',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.absolutly.nothing',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'justIgnoreMe',
      }));

      const possiblePaths = blueprint._resolveWildcardCharacters('do.*.killApp');
      expect(possiblePaths).to.be.an('array');
      expect(possiblePaths).to.have.lengthOf(2);
      expect(possiblePaths).to.include('do.something.killApp');
      expect(possiblePaths).to.include('do.absolutly.killApp');
    });
  });

  describe('pathsToReplaceWildcardsWith', () => {
    it('should return an array of possible paths that can be used to replace wildcards in the given path', () => {
      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.*.killApp',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.something.*.nice',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'not.something.*.nice',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.absolutly.nothing',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'justIgnoreMe',
      }));

      const possiblePaths = blueprint._pathsToReplaceWildcardsWith('do.*.killApp');
      expect(possiblePaths).to.be.an('array');
      expect(possiblePaths).to.have.lengthOf(2);
      expect(possiblePaths).to.include('do.something.*.nice');
      expect(possiblePaths).to.include('do.absolutly.nothing');
    });

    it('should only find paths that satisfy all wildcards in the path', () => {
      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.*.*.laters',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.nothing',
      }));

      const possiblePaths = blueprint._pathsToReplaceWildcardsWith('do.*.*.laters');
      expect(possiblePaths).to.be.an('array');
      expect(possiblePaths).to.be.empty;
    });

    it('should not match wildcard with wildcard', () => {
      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.*.killApp',
      }));
      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.*.anything',
      }));

      const possiblePaths = blueprint._pathsToReplaceWildcardsWith('do.*.killApp');
      expect(possiblePaths).to.be.an('array');
      expect(possiblePaths).to.be.empty;
    });
  });

  describe('replaceWildcardsInPathWith', () => {
    it('should replace wildcard components in the path with corresponding components from the given source path', () => {
      const pathWithWildcard = 'i.*.things';
      const sourcePath = 'i.miss.things.alot';
      const result = Blueprint._replaceWildcardsInPathWith(pathWithWildcard, sourcePath);
      expect(result).to.equal('i.miss.things');
    });
  });

  describe('hasRouteOnRootPath', () => {
    it('should return the route that its path is on root, otherwise returns false', () => {
      const rootRoute = new Route({ handler: () => undefined, path: '' });
      const someRoute = new Route({ handler: () => undefined, path: 'do.something' });

      const blueprintWithRoot = new Blueprint();
      blueprintWithRoot.addRoute(rootRoute);

      const blueprintWithoutRoot = new Blueprint();
      blueprintWithoutRoot.addRoute(someRoute);

      expect(blueprintWithoutRoot.hasRouteOnRootPath()).to.be.false;
      expect(blueprintWithRoot.hasRouteOnRootPath()).to.be.true;
    });
  });

  describe('findClosestRoutesToRoot', () => {
    it('should return the first routes that will be called before any other', () => {
      const routeOne = new Route({
        path: 'somewhere',
        handler: () => undefined
      });

      const routeTwo = new Route({
        path: 'somewhere.far',
        handler: () => undefined
      });

      const routeThree = new Route({
        path: 'any',
        handler: () => undefined
      });

      blueprint.addRoute(routeOne);
      blueprint.addRoute(routeTwo);
      blueprint.addRoute(routeThree);
      const closestRoutes = blueprint.findClosestRoutesToRoot();
      expect(closestRoutes).to.be.an('array');
      expect(closestRoutes).to.deep.include(routeOne);
      expect(closestRoutes).to.deep.include(routeThree);
      expect(closestRoutes).to.not.include(routeTwo);
    });
  });

  describe('addRoute', () => {
    it('should add the given route to routes object with their path property as key', () => {
      const route = new Route({ handler: () => undefined, path: 'do.something' });
      blueprint.addRoute(route);
      expect(blueprint._routes).to.have.property('do.something');
      expect(blueprint._routes['do.something']).to.deep.equal(route);
    });

    it('should throw error if the given route already exists', () => {
      const route = new Route({ handler: () => undefined, path: 'do.something' });
      blueprint.addRoute(route);

      expect(() => {
        blueprint.addRoute(route);
      }).to.throw(Error);
    });
  });

  describe('getRoute', () => {
    it('should get associated route with the given path', () => {
      const route = new Route({ handler: () => undefined, path: 'saySomething' });
      blueprint.addRoute(route);
      expect(blueprint.getRoute('saySomething')).to.deep.equal(route);
    });

    it('shoud throw error if the requested route does not exist', () => {
      expect(() => { blueprint.getRoute('undefinedRoute') }).to.throw(Error);
    });
  });

  describe('hasRoute', () => {
    it('shoud check if the given path has an associated route', () => {
      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'definedRoute',
      }));

      expect(blueprint.hasRoute('definedRoute')).to.be.true;
      expect(blueprint.hasRoute('undefinedRoute')).to.be.false;
    });
  });


  describe('removeRoute', () => {
    it('should remove the route associated with the given path', () => {
      const route = new Route({ handler: () => undefined, path: 'removedOne' });
      blueprint.addRoute(route);
      blueprint.removeRoute('removedOne');
      expect(blueprint._routes).not.to.have.property('removedOne');
    });
  });

  describe('handleRoutesWithWildcard', () => {
    it('should replace wildcard routes with acceptable normal routes', () => {
      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.*.now',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.*.*.later',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.nothing',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.any.thing',
      }));

      blueprint.handleRoutesWithWildcard();
      expect(blueprint._routes).to.include.keys(
        'do.any.thing',
        'do.nothing',
        'do.any.now',
        'do.nothing.now',
        'do.any.thing.later'
      );

      expect(Object.keys(blueprint._routes)).to.have.lengthOf(5);
      expect(blueprint._routes).not.to.have.property('do.*.*.later');
      expect(blueprint._routes).not.to.have.property('do.*.now');
    });
  });

  describe('removeRoutesWithWildcard', () => {
    it('should remove all routes that include wildcard', () => {
      const route = new Route({ handler: () => undefined, path: 'keep.this' });
      const routeWithWildcard = new Route({ handler: () => undefined, path: '*.not.keep.this' });
      blueprint.addRoute(route);
      blueprint.addRoute(routeWithWildcard);
      blueprint._removeRoutesWithWildcard();
      expect(blueprint._routes).to.have.property('keep.this');
      expect(blueprint._routes).not.have.property('*.not.keep.this');
    });
  });

  describe('removeSimilarBranch', () => {
    it('should take two strings and return a string where first common parts are removed', () => {
      const firstString = 'somewhere.near';
      const secondString = 'somewhere.near.a.town';
      expect(Blueprint._removeSimilarBranch(firstString, secondString)).to.equal('a.town');
    });
  });

  describe('getAllPaths', () => {
    it('should return an array of paths of added routes', () => {
      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: '',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.something.hard.*.now',
      }));

      const allPaths = blueprint.getAllPaths();
      expect(allPaths).to.have.lengthOf(2);
      expect(allPaths).to.include('');
      expect(allPaths).to.include('do.something.hard.*.now');
    });
  });

  describe('getAllPathsExcept', () => {
    it('should return an array of paths of added routes expect the given path', () => {
      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: '',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.something.hard.*.now',
      }));

      const allPaths = blueprint.getAllPathsExcept('');
      expect(allPaths).to.have.lengthOf(1);
      expect(allPaths).to.include('do.something.hard.*.now');
    });
  });

  describe('getAllPathsFrom', () => {
    it('should return an array of paths of added routes from the given source path', () => {
      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: '',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'anything',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.something.hard.*.now',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.something.easy',
      }));

      const allPathsFromSource = blueprint.getAllPathsFrom('do.something');
      expect(allPathsFromSource).to.have.lengthOf(2);
      expect(allPathsFromSource).to.include('do.something.easy');
      expect(allPathsFromSource).to.include('do.something.hard.*.now');
    });
  });

  describe('getLevelOnePathsFrom', () => {
    it('should get paths that are only one level far from the given source path', () => {
      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: '',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'anything',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.something.hard.now',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.something.easy',
      }));

      blueprint.addRoute(new Route({
        handler: () => undefined,
        path: 'do.something.easy.but.not.more',
      }));

      let levelOnePathsFromSource = blueprint.getLevelOnePathsFrom('');
      expect(levelOnePathsFromSource).to.have.lengthOf(2);
      expect(levelOnePathsFromSource).to.include('anything');
      expect(levelOnePathsFromSource).to.include('do');

      levelOnePathsFromSource = blueprint.getLevelOnePathsFrom('do');
      expect(levelOnePathsFromSource).to.have.lengthOf(2);
      expect(levelOnePathsFromSource).to.include('something.hard.now');
      expect(levelOnePathsFromSource).to.include('something.easy');

      const secondBlueprint = new Blueprint;
      secondBlueprint.addRoute(new Route({
        path: 'something.nice',
        handler: () => undefined
      }));

      secondBlueprint.addRoute(new Route ({
        path: 'something.nice.but.bad',
        handler: () => undefined
      }));

      levelOnePathsFromSource = secondBlueprint.getLevelOnePathsFrom('something.nice');
      expect(levelOnePathsFromSource).to.have.lengthOf(1);
      expect(levelOnePathsFromSource).to.include('but.bad');

    });
  });

  describe('getLevelOneRoutesFrom', () => {
    it('should return first level routes from the given path', () => {
      const simpleBlueprint = new Blueprint;
      const simpleRoutes = [
        new Route({ handler: () => undefined, path: '' }),
        new Route({ handler: () => undefined, path: 'something' }),
        new Route({ handler: () => undefined, path: 'somethingElse' }),
        new Route({ handler: () => undefined, path: 'something.ignoreThisOne' }),
      ];

      simpleRoutes.forEach((route) => simpleBlueprint.addRoute(route));
      const simpleBranches = simpleBlueprint.getLevelOneRoutesFrom('');
      expect(simpleBranches).to.have.lengthOf(2);
      expect(simpleBranches[0].path).to.equal('something');
      expect(simpleBranches[1].path).to.equal('somethingElse');
    });
  });
});
