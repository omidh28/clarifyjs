import clone from 'lodash/clone';
import StateContainer from '../../src/stateContainer';

describe('stateContainer', () => {
  let state;
  beforeEach(() => {
    state = new StateContainer;
  });

  describe('constructor', () => {
    it('should create an object to store call results', () => {
      expect(state).to.have.property('_storage');
      expect(state._storage).to.be.an('object');
    });

    it('should create an empty string to store current path', () => {
      expect(state).to.have.property('_currentPath');
      expect(state._currentPath).to.be.a('string');
    });

    it('should create an instance of promise as final promise', () => {
      expect(state).to.have.property('finalPromise');
      expect(state.finalPromise).to.be.an.instanceof(Promise);
    });

    it('should store resolve callback of final promise', (done) => {
      expect(state).to.have.property('resolve');
      expect(state.resolve).to.be.a('function');
      state.finalPromise.then(() => done());
      state.resolve();
    });

    it('should store reject callback of final promise', (done) => {
      expect(state).to.have.property('reject');
      expect(state.reject).to.be.a('function');
      state.finalPromise.catch(() => done());
      state.reject();
    });
  });

  describe('resetFinalPromiseProperties', () => {
    it('should delete finalPromise properties that do not start with underline', () => {
      const originalPromise = clone(state.finalPromise);
      state.finalPromise.something = true;
      state.finalPromise.somethingElse = false;
      expect(state.finalPromise).to.not.equal(originalPromise);

      state.resetFinalPromiseProperties();
      expect(state.finalPromise).to.deep.equal(originalPromise);
    });
  });

  describe('store', () => {
    it('should accept a key and value and store it in storage object', () => {
      state.store('someKey', 'someValue');
      expect(state._storage).to.have.property('someKey');
      expect(state._storage.someKey).to.equal('someValue');
    });
  });

  describe('fetch', () => {
    it('should fetch the stored value associated with the given key', () => {
      state.store('myKey', 'myValue');
      expect(state.fetch('myKey')).to.equal('myValue');
    });

    it('should throw error if the key is not defined', () => {
      expect(() => state.fetch('undefinedKey')).to.throw(Error);
    });
  });

  describe('changePath', () => {
    it('should change the value of current path', () => {
      state.changePath('newPath');
      expect(state._currentPath).to.equal('newPath');
    });
  });

  describe('getPath', () => {
    it('shoud return the current path', () => {
      state.changePath('currentPath');
      expect(state.getPath()).to.equal('currentPath');
    });
  });
});
