// transpile:mocha

import { BinaryIsInPathCheck, AndroidSdkExists } from '../lib/dev';
import { cp, fs } from '../lib/utils';
import chai from 'chai';
import 'mochawait';
import { cloneEnv } from './env-utils.js';
import { withMocks, verifyAll } from './mock-utils';

chai.should();
let P = Promise;

describe('dev', () => {
  describe('BinaryIsInPathCheck', withMocks({cp, fs} ,(mocks) => {
    cloneEnv();
    let check = new BinaryIsInPathCheck('mvn');
    it('autofix', () => {
      check.autofix.should.not.be.ok;
    });
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
    it('fix', async () => {
      (await check.fix()).should.equal('Manually install the mvn binary and add it to PATH.');
    });
  }));
  describe('AndroidSdkExists', withMocks({fs} ,(mocks) => {
    cloneEnv();
    let check = new AndroidSdkExists('android-16');
    it('autofix', () => {
      check.autofix.should.not.be.ok;
    });
    it('diagnose - success', async () => {
      process.env.ANDROID_HOME = '/a/b/c/d';
      mocks.fs.expects('exists').once().returns(P.resolve(true));
      (await check.diagnose()).should.deep.equal({
        ok: true,
        message: 'android-16 was found at /a/b/c/d/platforms/android-16.'
      });
      verifyAll(mocks);
    });
    it('failure - missing android home', async () => {
      delete process.env.ANDROID_HOME;
      (await check.diagnose()).should.deep.equal({
        ok: false,
        message: 'android-16 could not be found because ANDROID_HOME is NOT set!'
      });
      verifyAll(mocks);
    });
    it('diagnose - failure - invalid path', async () => {
      process.env.ANDROID_HOME = '/a/b/c/d';
      mocks.fs.expects('exists').once().returns(P.resolve(false));
      (await check.diagnose()).should.deep.equal({
        ok: false,
        message: 'android-16 could NOT be found at /a/b/c/d/platforms/android-16!'
      });
      verifyAll(mocks);
    });
    it('fix - ANDROID_HOME', async () => {
      delete process.env.ANDROID_HOME;
      (await check.fix()).should.equal('Manually configure ANDROID_HOME.');
    });
    it('fix - install', async () => {
      process.env.ANDROID_HOME = '/a/b/c/d';
      (await check.fix()).should.equal('Manually install the android-16 sdk.');
    });
  }));
});
