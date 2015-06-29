// transpile:mocha

import {authorizeIos} from '../lib/ios';
import {cp} from '../lib/utils';
import chai from 'chai';
import 'mochawait';
import B from 'bluebird';
import {withMocks, verifyAll} from './mock-utils';

chai.should();

describe('ios', () => {
  describe('authorizeIos', withMocks({cp}, (mocks) => {
    it('should work',async () => {
      mocks.cp.expects('exec').once().returns(B.resolve(["", ""]));
      await authorizeIos();
      verifyAll(mocks);
    });
  }));

});
