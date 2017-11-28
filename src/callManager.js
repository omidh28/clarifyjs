import defer from 'lodash/defer';
import once from 'lodash/once';
import isEmpty from 'lodash/isEmpty';
import Route from './route';

export default class CallManager {
  constructor({ stateContainer }) {
    this.deferApplyOnce = once(() => {
      defer(this.apply.bind(this));
    });

    this._queue = [];
    this._passedHandlerArgs = [];
    this._stateContainer = stateContainer
  }

  schedule(routeSchema, ...handlerArgs) {
    this._queue.push(routeSchema);
    this._passedHandlerArgs.push({
      priority: routeSchema.priority,
      args: [...handlerArgs]
    });
  }

  apply() {
    this._sortListByPriority();
    this._sortPassedArgumentsByPriority();
    this._processNextItem();
  }

  // NOTE: Calls itself until no item is left in the queue
  _processNextItem(previousResult = null, storePreviousResultAs = '') {
    if (previousResult && storePreviousResultAs) {
      this._stateContainer.store(storePreviousResultAs, previousResult);
    }

    if (isEmpty(this._queue)) {
      return this._stateContainer.resolve(previousResult);
    }

    const nextRoute = this._queue[0];
    const awaitForIt = nextRoute.awaitForHandler;
    const handlerArguments = [];
    const storedDependencies = this._loadDependenciesFor(nextRoute);
    for (const dependency of storedDependencies) {
      handlerArguments.push(dependency);
    }

    const passedHandlerArgs = this._passedHandlerArgs[0].args;
    for (const passedArgument of passedHandlerArgs) {
      handlerArguments.push(passedArgument);
    }

    const result = nextRoute.handler(...handlerArguments);
    if (result === 'hello everyone!') {
      console.log(handlerArguments);
      console.log('getting it!!');
    }

    this._queue.shift();
    this._passedHandlerArgs.shift();
    if (awaitForIt && (result instanceof Promise)) {
      result.then((resultAfterPromise) => {
        return this._processNextItem(resultAfterPromise, nextRoute.storeResultAs);
      });
    } else {
      return this._processNextItem(result, nextRoute.storeResultAs);
    }
  }

  _loadDependenciesFor(route) {
    const storedDependencies = [];
    const dependencyKeys = route.dependencies;
    for (const key of dependencyKeys) {
      const dependency = this._stateContainer.fetch(key);
      storedDependencies.push(dependency);
    }

    return storedDependencies;
  }

  _sortListByPriority() {
    this._queue.sort((a, b) => {
      if (a.priority < b.priority) {
        return 1;
      }

      if (a.priority > b.priority) {
        return -1;
      }

      return 0;
    });
  }

  _sortPassedArgumentsByPriority() {
    this._passedHandlerArgs.sort((a, b) => {
      if (a.priority < b.priority) {
        return 1;
      }

      if (a.priority > b.priority) {
        return -1;
      }

      return 0;
    });
  }
}
