// transpile:mocha

import {authorizeIos, XcodeCheck, XcodeCmdLineToolsCheck,
  DevToolsSecurityCheck, AuthorizationDbCheck, NodeBinaryCheck } from '../lib/ios';
import {cp, fs} from '../lib/utils';
import * as utils from '../lib/utils';
import NodeDetector from '../lib/node-detector';
import chai from 'chai';
import 'mochawait';
import B from 'bluebird';
import {withMocks, verifyAll} from './mock-utils';

chai.should();
let P = Promise;

describe('ios', () => {
  describe('authorizeIos', withMocks({cp}, (mocks) => {
    it('should work',async () => {
      mocks.cp.expects('exec').once().returns(P.resolve(["", ""]));
      await authorizeIos();
      verifyAll(mocks);
    });
  }));

  describe('XcodeCheck', withMocks({cp, fs} ,(mocks) => {
    let check = new XcodeCheck();
    it('autofix', () => {
      check.autofix.should.be.ok;
    });
    it('diagnose - success', async () => {
      mocks.cp.expects('exec').once().returns(P.resolve(['/a/b/c/d\n', '']));
      mocks.fs.expects('exists').once().returns(P.resolve(true));
      (await check.diagnose()).should.deep.equal({
        ok: true,
        message: 'Xcode is installed at /a/b/c/d.'
      });
      verifyAll(mocks);
    });
    it('diagnose - failure - xcode-select', async () => {
      mocks.cp.expects('exec').once().returns(P.reject(new Error('Something wrong!')));
      (await check.diagnose()).should.deep.equal({
        ok: false,
        message: 'Xcode is NOT installed!'
      });
      verifyAll(mocks);
    });
    it('diagnose - failure - path not exists', async () => {
      mocks.cp.expects('exec').once().returns(
        P.resolve(['/a/b/c/d\n', '']));
      mocks.fs.expects('exists').once().returns(P.resolve(false));
      (await check.diagnose()).should.deep.equal({
        ok: false,
        message: 'Xcode cannot be found at /a/b/c/d!'
      });
      verifyAll(mocks);
    });
    it('fix', async () => {
      mocks.cp.expects('exec').once().returns(
        P.resolve(['', '']));
      await check.fix();
      verifyAll(mocks);
    });
  }));
  describe('XcodeCmdLineToolsCheck', withMocks({cp, utils} ,(mocks) => {
    let check = new XcodeCmdLineToolsCheck();
    it('autofix', () => {
      check.autofix.should.be.ok;
    });
    it('diagnose - success', async () => {
      mocks.utils.expects('macOsxVersion').once().returns(P.resolve('10.10'));
      mocks.cp.expects('exec').once().returns(P.resolve(['1234 install-time\n', '']));
      (await check.diagnose()).should.deep.equal({
        ok: true,
        message: 'Xcode Command Line Tools are installed.'
      });
      verifyAll(mocks);
    });
    it('diagnose - failure - pkgutil crash', async () => {
      mocks.utils.expects('macOsxVersion').once().returns(B.resolve('10.10'));
      mocks.cp.expects('exec').once().returns(Promise.reject(new Error('Something wrong!')));
      (await check.diagnose()).should.deep.equal({
        ok: false,
        message: 'Xcode Command Line Tools are NOT installed!'
      });
      verifyAll(mocks);
    });
    it('diagnose - failure - no install time', async () => {
      mocks.utils.expects('macOsxVersion').once().returns(B.resolve('10.10'));
      mocks.cp.expects('exec').once().returns(P.resolve(['1234 abcd\n', '']));
      (await check.diagnose()).should.deep.equal({
        ok: false,
        message: 'Xcode Command Line Tools are NOT installed!'
      });
      verifyAll(mocks);
    });
    it('fix', async () => {
      mocks.cp.expects('exec').once().returns(P.resolve(['', '']));
      await check.fix();
      verifyAll(mocks);
    });
  }));
  describe('DevToolsSecurityCheck', withMocks({cp, utils} ,(mocks) => {
    let check = new DevToolsSecurityCheck();
    it('autofix', () => {
      check.autofix.should.be.ok;
    });
    it('diagnose - success', async () => {
      mocks.cp.expects('exec').once().returns(P.resolve(['1234 enabled\n', '']));
      (await check.diagnose()).should.deep.equal({
        ok: true,
        message: 'DevToolsSecurity is enabled.'
      });
      verifyAll(mocks);
    });
    it('diagnose - failure - DevToolsSecurity crash', async () => {
      mocks.cp.expects('exec').once().returns(Promise.reject(new Error('Something wrong!')));
      (await check.diagnose()).should.deep.equal({
        ok: false,
        message: 'DevToolsSecurity is NOT enabled!'
      });
      verifyAll(mocks);
    });
    it('diagnose - failure - not enabled', async () => {
      mocks.cp.expects('exec').once().returns(P.resolve(['1234 abcd\n', '']));
      (await check.diagnose()).should.deep.equal({
        ok: false,
        message: 'DevToolsSecurity is NOT enabled!'
      });
      verifyAll(mocks);
    });
    it('fix', async () => {
      mocks.cp.expects('exec').once().returns(P.resolve(['', '']));
      await check.fix();
      verifyAll(mocks);
    });
  }));
  describe('AuthorizationDbCheck', withMocks({cp, fs, utils} ,(mocks) => {
    let check = new AuthorizationDbCheck();
    it('autofix', () => {
      check.autofix.should.be.ok;
    });
    it('diagnose - success - 10.10', async () => {
      mocks.cp.expects('exec').once().returns(P.resolve(['1234 is-developer\n', '']));
      (await check.diagnose()).should.deep.equal({
        ok: true,
        message: 'The Authorization DB is set up properly.'
      });
      verifyAll(mocks);
    });
    it('diagnose - success - 10.8', async () => {
      mocks.cp.expects('exec').once().returns(P.reject(new Error('Oh No!')));
      mocks.utils.expects('macOsxVersion').once().returns(P.resolve('10.8'));
      mocks.fs.expects('readFile').once().returns(P.resolve(
        '<key>system.privilege.taskport</key> \n <dict>\n <key>allow-root</key>\n <true/>')); 
      (await check.diagnose()).should.deep.equal({
        ok: true,
        message: 'The Authorization DB is set up properly.'
      });
      verifyAll(mocks);
    });
    it('diagnose - failure - 10.10 - security', async () => {
      mocks.cp.expects('exec').once().returns(P.reject(new Error('Oh No!')));
      mocks.utils.expects('macOsxVersion').once().returns(P.resolve('10.10'));
      (await check.diagnose()).should.deep.equal({
        ok: false,
        message: 'The Authorization DB is NOT set up properly.'
      });
      verifyAll(mocks);
    });
    it('diagnose - failure - /etc/authorization', async () => {
      mocks.cp.expects('exec').once().returns(P.reject(new Error('Oh No!')));
      mocks.utils.expects('macOsxVersion').once().returns(P.resolve('10.8'));
      mocks.fs.expects('readFile').once().returns(P.resolve(''));
      (await check.diagnose()).should.deep.equal({
        ok: false,
        message: 'The Authorization DB is NOT set up properly.'
      });
      verifyAll(mocks);
    });
    it('fix', async () => {
      mocks.cp.expects('exec').once().returns(P.resolve(['', '']));
      await check.fix();
      verifyAll(mocks);
    });
  }));
  describe('NodeBinaryCheck', withMocks({NodeDetector} ,(mocks) => {
    let check = new NodeBinaryCheck();
    it('autofix', () => {
      check.autofix.should.not.be.ok;
    });
    it('diagnose - success', async () => {
      mocks.NodeDetector.expects('detect').once().returns(P.resolve('/a/b/c/d'));
      (await check.diagnose()).should.deep.equal({
        ok: true,
        message: 'The Node.js binary was found at: /a/b/c/d.'
      });
      verifyAll(mocks);
    });
    it('diagnose - failure', async () => {
      mocks.NodeDetector.expects('detect').once().returns(P.resolve(null));
      (await check.diagnose()).should.deep.equal({
        ok: false,
        message: 'The Node.js binary was NOT found!'
      });
      verifyAll(mocks);
    });
    it('fix', async () => {
      (await check.fix()).should.equal('Manually setup Node.js ' +
        'and run appium-doctor again.');
    });
  }));
});
