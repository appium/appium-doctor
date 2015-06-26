// transpile:mocha

import chai from 'chai';
import 'mochawait';
import sinon from 'sinon';
import {fs, cp} from '../lib/utils';
import NodeDetector from '../lib/node-detector';
import B from 'bluebird';
import _ from 'lodash';

chai.should();
let expect = chai.expect;

describe('NodeDetector', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });
  afterEach(() => {
    sandbox.restore();
  });

 it('retrieveInCommonPlaces - success',async () => {
    let mock = sinon.mock(fs);
    mock.expects('exists').once().returns(B.resolve(true));
    let detector = new NodeDetector();
    (await detector.retrieveInCommonPlaces())
      .should.equal('/usr/local/bin/node');
    mock.verify();
  });

 it('retrieveInCommonPlaces - failure',async () => {
    let mock = sinon.mock(fs);
    mock.expects('exists').twice().returns(B.resolve(false));
    let detector = new NodeDetector();
    expect(await detector.retrieveInCommonPlaces())
      .to.be.a('null');
    mock.verify();
  });

 // retrieveUsingWhichCommand
 let testRetrieveWithScript = (method) => {
    it(method + ' - success', async () => {
      let mocks = {
        fs: sinon.mock(fs),
        cp: sinon.mock(cp),
      };
      mocks.cp.expects('exec').once().returns(B.resolve(['/a/b/c/d\n', '']));
      mocks.fs.expects('exists').once().returns(B.resolve(true));
      let detector = new NodeDetector();
      (await detector[method]())
        .should.equal('/a/b/c/d');
      for (let m of _.values(mocks)) { m.verify(); }
    });

   it(method + ' - failure', async () => {
      {
        let mocks = {
          fs: sinon.mock(fs),
          cp: sinon.mock(cp),
        };
        mocks.cp.expects('exec').once().returns(B.resolve(['aaa not found\n', '']));
        let detector = new NodeDetector();
        expect(await detector[method]()).to.be.a('null');
        for (let m of _.values(mocks)) { m.verify(); }
      }
      {
        let mocks = {
          fs: sinon.mock(fs),
          cp: sinon.mock(cp),
        };
        mocks.cp.expects('exec').once().returns(B.resolve(['/a/b/c/d\n', '']));
        mocks.fs.expects('exists').once().returns(B.resolve(false));
        let detector = new NodeDetector();
        expect(await detector[method]()).to.be.a('null');
        for (let m of _.values(mocks)) { m.verify(); }
      }
    });
  };

  testRetrieveWithScript('retrieveUsingWhichCommand');
  testRetrieveWithScript('retrieveUsingAppleScript');

  it('retrieveUsingAppiumConfigFile - success', async () => {
    let mocks = {
      fs: sinon.mock(fs),
      cp: sinon.mock(cp),
    };
    mocks.fs.expects('exists').twice().returns(B.resolve(true));
    mocks.fs.expects('readFile').once().returns(
      B.resolve('{"node_bin": "/a/b/c/d"}'));
    let detector = new NodeDetector();
    (await detector.retrieveUsingAppiumConfigFile())
      .should.equal('/a/b/c/d');
     for (let m of _.values(mocks)) { m.verify(); }
  });

  it('retrieveUsingAppiumConfigFile - failure', async () => {
    {
      let mocks = {
        fs: sinon.mock(fs),
        cp: sinon.mock(cp),
      };
      mocks.fs.expects('exists').once().returns(B.resolve(true));
      mocks.fs.expects('readFile').once().returns(
        B.resolve('{node_bin: "/a/b/c/d"}'));
      let detector = new NodeDetector();
      expect(await detector.retrieveUsingAppiumConfigFile())
        .to.be.a('null');
      for (let m of _.values(mocks)) { m.verify(); }
    }
    {
      let mocks = {
        fs: sinon.mock(fs),
        cp: sinon.mock(cp),
      };
      mocks.fs.expects('exists').once().returns(B.resolve(true));
      mocks.fs.expects('exists').once().returns(B.resolve(false));
      mocks.fs.expects('readFile').once().returns(
        B.resolve('{"node_bin": "/a/b/c/d"}'));
      let detector = new NodeDetector();
      expect(await detector.retrieveUsingAppiumConfigFile())
        .to.be.a('null');
      for (let m of _.values(mocks)) { m.verify(); }
    }
  });

  it('checkForNodeBinary - success', async () => {
    let detector = new NodeDetector();
    sinon.stub(detector, 'retrieveInCommonPlaces').returns(null);
    sinon.stub(detector, 'retrieveUsingWhichCommand').returns(null);
    sinon.stub(detector, 'retrieveUsingAppleScript').returns('/a/b/c/d');
    sinon.stub(detector, 'retrieveUsingAppiumConfigFile').returns(null);
    (await detector.detect()).should.equal('/a/b/c/d');

    detector.retrieveUsingWhichCommand.called.should.be.ok;
    detector.retrieveUsingAppiumConfigFile.called.should.not.be.ok;
  });

  it('checkForNodeBinary - failure', async () => {
    let detector = new NodeDetector();
    sinon.stub(detector, 'retrieveInCommonPlaces').returns(null);
    sinon.stub(detector, 'retrieveUsingWhichCommand').returns(null);
    sinon.stub(detector, 'retrieveUsingAppleScript').returns(null);
    sinon.stub(detector, 'retrieveUsingAppiumConfigFile').returns(null);
    expect(await detector.detect()).to.be.a('null');

    detector.retrieveUsingWhichCommand.called.should.be.ok;
    detector.retrieveUsingAppiumConfigFile.called.should.be.ok;
  });


});
