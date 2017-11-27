import startsWith from 'lodash/startsWith';
import endsWith from 'lodash/endsWith';
import difference from 'lodash/difference';
import drop from 'lodash/drop';
import sortBy from 'lodash/sortBy';
import isEqual from 'lodash/isEqual';
import findIndex from 'lodash/findIndex';
import union from 'lodash/union';
import unionBy from 'lodash/unionBy';
import includes from 'lodash/includes';
import clone from 'lodash/clone';
import Route from './route';

export default class Blueprint {
  constructor() {
    this._routes = {};
  }

  // NOTE: Should only called when all routes are added
  handleRoutesWithWildcard() {
    let routesToAdd = [];
    const pathsWithWildcard = Object.keys(this._routes).filter(path => includes(path, '*'));
    pathsWithWildcard.forEach((path) => {
      const route = this.getRoute(path);
      routesToAdd = unionBy(
        routesToAdd,
        this._generateRoutesFromOneWithWildcard(route),
        route => route.path
      );
    });

    routesToAdd.forEach(route => this.addRoute(route));
    this._removeRoutesWithWildcard();
  }

  _generateRoutesFromOneWithWildcard(routeWithWildcard) {
    const handler = routeWithWildcard.handler;
    const pathWithWildcard = routeWithWildcard.path;
    const paths = this._resolveWildcardCharacters(pathWithWildcard);
    return paths.map((path) => {
      const cloneOfWildcardRoute = clone(routeWithWildcard);
      cloneOfWildcardRoute.path = path;
      return cloneOfWildcardRoute;
    });
  }

  _resolveWildcardCharacters(pathWithWildcard) {
    const pathsToReplaceWildcardsWith = this._pathsToReplaceWildcardsWith(pathWithWildcard);
    return pathsToReplaceWildcardsWith.map((sourcePath) => {
      return Blueprint._replaceWildcardsInPathWith(pathWithWildcard, sourcePath);
    });
  }

  _pathsToReplaceWildcardsWith(pathWithWildcard) {
    return this.getAllPathsExcept(pathWithWildcard).filter((pathToCheck) => {
      const wildPathcomponents = Route.componentsOf(pathWithWildcard);
      const pathToCheckComponents = Route.componentsOf(pathToCheck);
      const numberOfWildcards = wildPathcomponents.filter(component => component === '*')
                                                  .length;
      let wildcardsLeftToCheck = numberOfWildcards;
      for (let i = 0; i < wildPathcomponents.length; i++) {
        if (wildcardsLeftToCheck === 0) break;
        const wildPathComponent = wildPathcomponents[i];
        const correspondingComponent = pathToCheckComponents[i];
        if (wildPathComponent === '*') {
          wildcardsLeftToCheck -= 1;
          if (typeof correspondingComponent !== 'string' ||
              correspondingComponent === '*') {
            return false;
          }
        } else if (correspondingComponent !== wildPathComponent) {
            return false;
        }
      }

      return true;
    });
  }

  static _replaceWildcardsInPathWith(pathWithWildcard, sourcePath) {
    const wildComponents = Route.componentsOf(pathWithWildcard);
    const sourceComponents = Route.componentsOf(sourcePath);
    const resultComponents = [];
    for (let i = 0; i < wildComponents.length; i++) {
      const wildComponent = wildComponents[i];
      const sourceComponent = sourceComponents[i];
      if (wildComponent === '*') {
        resultComponents.push(sourceComponent);
      } else {
        resultComponents.push(wildComponent);
      }
    }

    return Route.componentsToPath(resultComponents);;
  }

  findClosestRoutesToRoot() {
    if (this.hasRouteOnRootPath()) {
      return [this.getRoute('')];
    }

    return this.getLevelOneRoutesFrom('');
  }

  getLevelOneRoutesFrom(sourcePath) {
    this.getLevelOnePathsFrom(sourcePath);
    return this.getLevelOnePathsFrom(sourcePath).map(path => this.getRoute(path));
  }

  getLevelOnePathsFrom(sourcePath) {
    const allPathsFromSource = this.getAllPathsFrom(sourcePath);
    const pathsComponents = allPathsFromSource.map(path => Route.componentsOf(path));
    let levelOneComponents = pathsComponents.filter((componentsToCheck) => {
      return pathsComponents.every((components) => {
        const [subset, superset] = sortBy([components, componentsToCheck]);
        const oneIsSubsetOfAnother = difference(subset, superset).length === 0;
        if (oneIsSubsetOfAnother && componentsToCheck.length > components.length) {
          return false;
        }

        return true;
      });
    });

    const fullLevelOnePaths = levelOneComponents.map(components => Route.componentsToPath(components));
    const isSourceFromRoot = sourcePath === '' ? true : false;
    if (!isSourceFromRoot) {
      return fullLevelOnePaths.map(path => Blueprint._removeSimilarBranch(sourcePath, path));
    }

    return fullLevelOnePaths;
  }

  // TODO: remove if not necessary
  // findClosestRoutesToRoot() {
  //   if (this.hasRouteOnRootPath()) {
  //     return [this.getRoute('')];
  //   }
  //
  //   return this.getLevelOneRoutesFrom('');
  // }

  static _removeSimilarBranch(firstPath, secondPath) {
    let [smallerOne, biggerOne] = [firstPath, secondPath].sort();
    while (smallerOne[0] === biggerOne[0]) {
      smallerOne = smallerOne.slice(1);
      biggerOne = biggerOne.slice(1);
    }

    // NOTE: remove extra dot
    if (biggerOne[0] === '.') {
      biggerOne = biggerOne.slice(1);
    }

    return biggerOne;
  }

  hasRouteOnRootPath() {
    return this.hasRoute('');
  }

  getAllPathsFrom(sourcePath) {
    return this.getAllPathsExcept(sourcePath)
               .filter(path => startsWith(path, sourcePath));
  }

  getAllPathsExcept(pathToRemove) {
    return this.getAllPaths().filter(path => path !== pathToRemove);
  }

  getAllPaths() {
    return Object.keys(this._routes);
  }

  addRoute(route) {
    if (this.hasRoute(route.path)) {
      throw new Error(`blueprint.addRoute(): ${route.path} route already exits`);
    }

    this._routes[route.path] = route;
  }

  _removeRoutesWithWildcard() {
    Object.keys(this._routes).forEach((path) => {
      if (includes(path, '*')) {
        this.removeRoute(path);
      }
    });
  }

  removeRoute(path) {
    delete this._routes[path];
  }

  getRoute(path) {
    if (!this.hasRoute(path)) {
      throw new Error(`blueprint.getRoute(): No such route exists with path ${path}`);
    }

    return this._routes[path];
  }

  hasRoute(path) {
    if (this._routes.hasOwnProperty(path)) {
      return true;
    }

    return false;
  }
}
