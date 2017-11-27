import includes from 'lodash/includes';
import last from 'lodash/last';

export default class Route {
  constructor({
    controller = '()',
    storeResultAs = '',
    inject = [],
    priority = -Infinity,
    awaitForHandler = false,
    handler,
    path
  } = {}) {
    validateArguments({
      path,
      handler,
      priority,
      awaitForHandler,
      inject,
      controller,
      storeResultAs
    });

    this.dependencies = turnIntoArray(inject);
    this.awaitForHandler = awaitForHandler;
    this.path = path;
    this.controller = controller;
    this.handler = handler;
    this.priority = priority;

    if (storeResultAs) {
      this.storeResultAs = storeResultAs;
    } else if (this.shouldStoreResult()) {
      this.storeResultAs = this.shouldStoreResult();
    } else {
      this.storeResultAs = '';
    }
  }

  static componentsOf(path) {
    const splittedPath = path.split('.');
    return splittedPath;
  }

  isFunctionStyle() {
    return includes(this.controller, '()');
  }

  shouldStoreResult() {
    if (includes(this.controller, '=>')) {
      const storeResultAs = this.controller.split('=>')[1].trim();
      return storeResultAs;
    }

    return false;
  }

  static componentsToPath(components) {
    let resultPath = '';
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      if (typeof component !== 'string') {
        throw new TypeError(`componentsToPath(): ${component} is not a valid component`);
      }

      resultPath += component;
      const isLastComponent = i === components.length - 1;
      if (!isLastComponent) {
        resultPath += '.';
      }
    }

    return resultPath;
  }
}

function turnIntoArray(givenValue) {
  if (givenValue instanceof Array === false) {
    return [givenValue];
  }

  return givenValue;
}

function validateArguments({
  path,
  handler,
  controller,
  inject,
  priority,
  awaitForHandler,
  storeResultAs
} = {}) {
  if (typeof path !== 'string') {
    throw new TypeError(`Route.constructor(): path must be a string`);
  }

  if (typeof storeResultAs !== 'string') {
    throw new TypeError(`Route.storeResultAs(): path must be a string`);
  }

  if (typeof controller !== 'string') {
    throw new TypeError(`Route.constructor(): controller must be a string`);
  }

  if (typeof handler !== 'function') {
    throw new TypeError(`Route.constructor(): handler must be a function`);
  }

  if (typeof priority !== 'number') {
    throw new TypeError(`Route.constructor(): priority must be a number`);
  }

  if (typeof awaitForHandler !== 'boolean') {
    throw new TypeError(`Route.constructor(): awaitForHandler option must be a boolean`);
  }

  if (typeof inject !== 'string' && inject instanceof Array === false) {
    throw new TypeError('Route.constructor(): inject must be a string or an array');
  }
}
