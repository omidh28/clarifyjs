import clarify from '../../src/clarifyJs';

describe('clarify', () => {
  describe('Greet function', () => {
    beforeEach(() => {
      spy(clarify, 'greet');
      clarify.greet();
    });

    it('should have been run once', () => {
      expect(clarify.greet).to.have.been.calledOnce;
    });

    it('should have always returned hello', () => {
      expect(clarify.greet).to.have.always.returned('hello');
    });
  });
});
