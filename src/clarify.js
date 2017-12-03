import set from 'lodash/set';
import get from 'lodash/get';
import partial from 'lodash/partial';
import Route from './route';
import Blueprint from './blueprint';
import StateContainer from './stateContainer';
import CallManager from './callManager';
import Builder from './builder';

module.exports = function ({ routes: routesData, storage = {} }) {
  const routes = routesData.map((routeData) => new Route(routeData));
  const blueprint = new Blueprint;
  routes.forEach(route => blueprint.addRoute(route));
  blueprint.handleRoutesWithWildcard();
  let firstBranches = {};
  blueprint.findClosestRoutesToRoot().forEach(route => {
      if (route.isFunctionStyle()) {
        const isAtRoot = route.path === '' ? true : false;
        if (isAtRoot) {
          firstBranches = partial(buildMasterInvoker, blueprint, route.path, storage);
        } else {
          set(firstBranches, route.path, partial(buildMasterInvoker, blueprint, route.path, storage));
        }
      } else {
        // NOTE: assumes that root object is always function style
        // TODO: move these to a new function, also exists in buildFrom function
        // TODO: make sure it is not possible to create non-function route style at root
        const parentPath = Builder._getLevelOneParentPath(route.path);
        if (parentPath) set(firstBranches, parentPath, {});
        const parentObject = parentPath ? get(firstBranches, parentPath) : firstBranches;
        const propertyKey = Builder._getChildPath(route.path);
        Builder._attachFunctionToProperty({
          functionToAttach: partial(buildMasterInvoker, blueprint, route.path, storage),
          parentObject,
          propertyKey
        });
      }
  });

  return firstBranches;
};

function buildMasterInvoker(blueprint, currentPath, storage, ...handlerArgs) {
  const stateContainer = new StateContainer({ defaults: storage });
  const callManager = new CallManager({ stateContainer });
  const builder = new Builder({ blueprint, callManager });
  const route = blueprint.getRoute(currentPath);
  return builder.buildRouteInvoker(route)(...handlerArgs);
}
