import sinon from 'sinon';
import _ from 'lodash';

let SANDBOX = Symbol();

function withMocks (libs, fn) {
  return () => {
    let sandbox;
    let mocks = {};
    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      mocks[SANDBOX] = sandbox;
      for (let [key, value] of _.pairs(libs)) {
        mocks[key] = sandbox.mock(value);
      }
    });
    afterEach(() => {
      sandbox.restore();
    });
    fn(mocks);
  };
}

function verifyAll (mocks) {
  _(mocks).chain().values().flatten().each(
    function (m) { m.verify(); } ).value();
}

function sandbox (mocks) {
  return mocks[SANDBOX];
}

export {withMocks, verifyAll, sandbox};
