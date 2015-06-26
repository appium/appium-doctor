// transpile:mocha

import { pkgRoot, cp, isMac, fs } from '../lib/utils';
import chai from 'chai';
import 'mochawait';
import path from 'path';

chai.should();

describe('utils', () => {
  it('cp.exec',async () => {
    let [stdout, stderr] = await cp.exec('echo 1');
    stdout.should.equal('1\n');
    stderr.should.equal('');
  });

  // TODO: proper unit test for isMac
  it('isMac', () => {
    isMac().should.be.ok;
  });

  it('fs.readFile', async () => {
    (await fs.readFile(path.resolve(pkgRoot, 'test', 'fixtures',
      'wow.txt'), 'utf8')).should.include('WOW');
  });

  it('fs.exists', async () => {
    (await fs.exists(path.resolve(pkgRoot, 'test', 'fixtures',
      'wow.txt'))).should.be.ok;
    (await fs.exists(path.resolve(pkgRoot, 'test', 'fixtures',
      'notwow.txt'))).should.not.be.ok;
   });

});
