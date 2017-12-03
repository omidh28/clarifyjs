import startsWith from 'lodash/startsWith';

export default class StateContainer {
  constructor({ defaults = {} } = {}) {
    this.finalPromise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });

    this._storage = {};
    this._currentPath = '';

    Object.keys(defaults).forEach(key => {
      this.store(key, defaults[key]);
    });
  }

  resetFinalPromiseProperties() {
    const keysToDelete = Object.keys(this.finalPromise).forEach(key => {
      if (!startsWith(key, '_')) {
        delete this.finalPromise[key];
      }
    });
  }

  store(key, value) {
    this._storage[key] = value;
  }

  fetch(key) {
    if (!this._storage.hasOwnProperty(key)) {
      throw new Error(`StateContainer.fetch(): value of ${key} is not defined`);
    }

    return this._storage[key];
  }

  changePath(newPath) {
    this._currentPath = newPath;
  }

  getPath() {
    return this._currentPath;
  }
}
