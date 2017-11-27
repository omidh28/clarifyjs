import set from 'lodash/set';
import initial from 'lodash/initial';
import last from 'lodash/last';
import get from 'lodash/get';
import includes from 'lodash/includes';

export default class Builder {
  constructor({ blueprint, callManager } = {}) {
    this._blueprint = blueprint;
    this._callManager = callManager;
  }

  buildFrom(sourcePath) {
    const stateContainer = this._callManager._stateContainer;
    const finalPromise = stateContainer.finalPromise;
    stateContainer.resetFinalPromiseProperties();
    const builtChainedObject = {};
    const levelOnePaths = this._blueprint.getLevelOnePathsFrom(sourcePath);
    const isSourceFromRoot = sourcePath === '' ? true : false;
    for (const relativePath of levelOnePaths) {
      let fullPath = relativePath;
      if (!isSourceFromRoot) {
        fullPath = sourcePath + '.' + relativePath;
      }

      const route = this._blueprint.getRoute(fullPath);
      const invoker = this.buildRouteInvoker(route);
      if (route.isFunctionStyle()) {
        set(finalPromise, relativePath, invoker);
      } else {
        const parentPath = Builder._getLevelOneParentPath(relativePath);
        if (parentPath) set(finalPromise, parentPath, {});
        const parentObject = parentPath ? get(finalPromise, parentPath) : finalPromise;
        const propertyKey = Builder._getChildPath(relativePath);
        Builder._attachFunctionToProperty({
          functionToAttach: invoker,
          parentObject,
          propertyKey
        });
      }
    }

    return finalPromise;
  }

  buildRouteInvoker(route) {
    return () => {
      this._callManager.schedule(route);
      this._callManager.deferApplyOnce();
      return this.buildFrom(route.path);
    }
  }

  static _attachFunctionToProperty({ parentObject, propertyKey, functionToAttach }) {
    Object.defineProperty(parentObject, propertyKey, {
      get: functionToAttach,
    });
  }

  static _unsetAllPropertiesOf(targetObject) {
    Object.keys(targetObject).forEach(key => delete targetObject[key]);
  }

  static _getLevelOneParentPath(path) {
    const isAtRoot = includes(path, '.') ? false : true;
    if (isAtRoot) {
      return false;
    }

    const splittedPath = path.split('.');
    const pathWithoutLastChild = initial(splittedPath).reduce((lastPart, currentPart) => {
      if (lastPart === '') {
        return currentPart;
      } else {
        return lastPart + '.' + currentPart;
      }
    }, '');

    return pathWithoutLastChild;
  }

  static _getChildPath(path) {
    return last(path.split('.'));
  }
}
