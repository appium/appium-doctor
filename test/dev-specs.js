// transpile:mocha

import { BinaryIsInPathCheck } from '../lib/dev';
import {cp, fs} from '../lib/utils';
import chai from 'chai';
import 'mochawait';
import { cloneEnv } from './env-utils.js';
import {withMocks, verifyAll} from './mock-utils';

chai.should();
let P = Promise;

describe('dev', () => {
  describe('BinaryIsInPathCheck', withMocks({cp, fs} ,(mocks) => {
    cloneEnv();
    let check = new BinaryIsInPathCheck('mvn');
    it('diagnose - success', async () => {
      process.env.PATH = '/a/b/c/d;/e/f/g/h';
      mocks.cp.expects('exec').once().returns(P.resolve(['/a/b/c/d/mvn\n', '']));
      mocks.fs.expects('exists').once().returns(P.resolve(true));
      (await check.diagnose()).should.deep.equal({
        ok: true,
        message: 'mvn was found at /a/b/c/d/mvn'
      });
      verifyAll(mocks);
    });
    it('diagnose - failure - not in path ', async () => {
      process.env.PATH = '/a/b/c/d;/e/f/g/h';
      mocks.cp.expects('exec').once().returns(P.resolve(['mvn not found\n', '']));
      (await check.diagnose()).should.deep.equal({
        ok: false,
        message: 'mvn is MISSING in PATH!'
      });
      verifyAll(mocks);
    });
    it('diagnose - failure - invalid path', async () => {
      process.env.PATH = '/a/b/c/d;/e/f/g/h';
      mocks.cp.expects('exec').once().returns(P.resolve(['/a/b/c/d/mvn\n', '']));
      mocks.fs.expects('exists').once().returns(P.resolve(false));
      (await check.diagnose()).should.deep.equal({
        ok: false,
        message: 'mvn is in PATH, but path is NOT valid!'
      });
      verifyAll(mocks);
    });
  }));
});
