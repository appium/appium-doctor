// transpile:mocha

import chai from 'chai';
import 'mochawait';
import {fs, cp} from '../lib/utils';
import NodeDetector from '../lib/node-detector';
import B from 'bluebird';
import {withMocks, verifyAll, getSandbox} from './mock-utils';

chai.should();
let expect = chai.expect;

describe('NodeDetector', withMocks({fs, cp}, (mocks) => {

 it('retrieveInCommonPlaces - success',async () => {
    mocks.fs.expects('exists').once().returns(B.resolve(true));
    let detector = new NodeDetector();
    (await detector.retrieveInCommonPlaces())
      .should.equal('/usr/local/bin/node');
    verifyAll(mocks);
  });

  it('retrieveInCommonPlaces - failure',async () => {
    mocks.fs.expects('exists').twice().returns(B.resolve(false));
    let detector = new NodeDetector();
    expect(await detector.retrieveInCommonPlaces()).to.be.a('null');
    verifyAll(mocks);
  });

  // retrieveUsingWhichCommand
  let testRetrieveWithScript = (method) => {
    it(method + ' - success', async () => {
      mocks.cp.expects('exec').once().returns(B.resolve(['/a/b/c/d\n', '']));
      mocks.fs.expects('exists').once().returns(B.resolve(true));
      let detector = new NodeDetector();
      (await detector[method]())
        .should.equal('/a/b/c/d');
      verifyAll(mocks);
    });

    it(method + ' - failure - path not found ', async () => {
      mocks.cp.expects('exec').once().returns(B.resolve(['aaa not found\n', '']));
      let detector = new NodeDetector();
      expect(await detector[method]()).to.be.a('null');
      verifyAll(mocks);
    });
    it(method + ' - failure - path not exist', async () => {
      mocks.cp.expects('exec').once().returns(B.resolve(['/a/b/c/d\n', '']));
      mocks.fs.expects('exists').once().returns(B.resolve(false));
      let detector = new NodeDetector();
      expect(await detector[method]()).to.be.a('null');
    });
  };

  testRetrieveWithScript('retrieveUsingWhichCommand');
  testRetrieveWithScript('retrieveUsingAppleScript');

  it('retrieveUsingAppiumConfigFile - success', async () => {
    mocks.fs.expects('exists').twice().returns(B.resolve(true));
    mocks.fs.expects('readFile').once().returns(
      B.resolve('{"node_bin": "/a/b/c/d"}'));
    let detector = new NodeDetector();
    (await detector.retrieveUsingAppiumConfigFile())
      .should.equal('/a/b/c/d');
    verifyAll(mocks);
  });

  it('retrieveUsingAppiumConfigFile - failure - not json', async () => {
    mocks.fs.expects('exists').once().returns(B.resolve(true));
    mocks.fs.expects('readFile').once().returns(
      B.resolve('{node_bin: "/a/b/c/d"}'));
    let detector = new NodeDetector();
    expect(await detector.retrieveUsingAppiumConfigFile())
      .to.be.a('null');
    verifyAll(mocks);
  });

  it('retrieveUsingAppiumConfigFile - failure - path does not exist', async () => {
    mocks.fs.expects('exists').once().returns(B.resolve(true));
    mocks.fs.expects('exists').once().returns(B.resolve(false));
    mocks.fs.expects('readFile').once().returns(
      B.resolve('{"node_bin": "/a/b/c/d"}'));
    let detector = new NodeDetector();
    expect(await detector.retrieveUsingAppiumConfigFile())
      .to.be.a('null');
    verifyAll(mocks);
  });

  it('checkForNodeBinary - success', async () => {
    let detector = new NodeDetector();
    mocks.detector = getSandbox(mocks).mock(detector);
    mocks.detector.expects('retrieveInCommonPlaces').once().returns(null);
    mocks.detector.expects('retrieveUsingWhichCommand').once().returns(null);
    mocks.detector.expects('retrieveUsingAppleScript').returns('/a/b/c/d');
    mocks.detector.expects('retrieveUsingAppiumConfigFile').never();
    (await detector.detect()).should.equal('/a/b/c/d');
    verifyAll(mocks);
  });

  it('checkForNodeBinary - failure', async () => {
    let detector = new NodeDetector();
    mocks.detector = getSandbox(mocks).mock(detector);
    mocks.detector.expects('retrieveInCommonPlaces').once().returns(null);
    mocks.detector.expects('retrieveUsingWhichCommand').once().returns(null);
    mocks.detector.expects('retrieveUsingAppleScript').once().returns(null);
    mocks.detector.expects('retrieveUsingAppiumConfigFile').once().returns(null);
    expect(await detector.detect()).to.be.a('null');
    verifyAll(mocks);
  });

}));
