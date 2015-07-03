// demo rule to test the gui

import { fs, cp, ok, nok } from './utils';
import { DoctorCheck } from './doctor';
import log from './logger';
import { fixIt } from './prompt';
import { FixSkippedError } from './doctor';

let checks = [];

class DirCheck extends DoctorCheck {
  constructor (path) {
    super({autofix: false});
    this.path = path;
  }

  async diagnose () {
    if(!await fs.exists(this.path)) {
      return nok(`Could NOT find directory at ${this.path}!`);
    }
    let stats = await fs.lstat(this.path);
    return stats.isDirectory() ?
      ok(`Found directory at ${this.path}.`) : nok(`${this.path} is NOT a directory!`);
  }

  async fix () {
    return `Manually create a directory at ${this.path}.`;
  }

}
checks.push(new DirCheck('/tmp/appium-doctor'));
checks.push(new DirCheck('/tmp/appium-doctor/demo'));

class FileCheck extends DoctorCheck {
  constructor(path) {
    super({autofix: true});
    this.path = path;
  }

  async diagnose() {
    return await fs.exists(this.path) ?
      ok(`Found file at ${this.path}.`) : nok(`Could NOT find file at ${this.path}!`);
  }

  async fix () {
    let cmd = `touch ${this.path}`;
    log.info(`The following command need be executed: '${cmd}'.`);
    let yesno = await fixIt();
    if (yesno === 'yes') {
      await cp.exec(cmd, { maxBuffer: 524288});
    } else {
      log.info(`Skipping you will need to touch ${this.path} manually.`);
      throw new FixSkippedError('bbb');
    }
  }
}

checks.push(new FileCheck('/tmp/appium-doctor/demo/apple.fruit'));
checks.push(new FileCheck('/tmp/appium-doctor/demo/pear.fruit'));
checks.push(new FileCheck('/tmp/appium-doctor/demo/orange.fruit'));

export { DirCheck, FileCheck };
export default checks;
