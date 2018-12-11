import { ok, nok, okOptional, nokOptional } from './utils';
import { exec } from 'teen_process';
import { DoctorCheck } from './doctor';
import NodeDetector from './node-detector';
import log from './logger';

let checks = [];

// Node Binary
class NodeBinaryCheck extends DoctorCheck {
  async diagnose () {
    let nodePath = await NodeDetector.detect();
    return nodePath ? ok(`The Node.js binary was found at: ${nodePath}`) :
      nok('The Node.js binary was NOT found!');
  }

  fix () {
    return `Manually setup Node.js.`;
  }
}
checks.push(new NodeBinaryCheck());

// Node version
class NodeVersionCheck extends DoctorCheck {
  async diagnose () {
    let nodePath = await NodeDetector.detect();
    if (!nodePath) {
      return nok('Node is not installed, so no version to check!');
    }
    let {stdout} = await exec(nodePath, ['--version']);
    let versionString = stdout.replace('v', '').trim();
    let version = parseInt(versionString, 10);
    if (Number.isNaN(version)) {
      return nok(`Unable to find node version (version = '${versionString}')`);
    }
    return version >= 4 ? ok(`Node version is ${versionString}`) :
      nok('Node version should be at least 4!');
  }

  fix () {
    return `Manually upgrade Node.js.`;
  }
}
checks.push(new NodeVersionCheck());

class OptionalOpencv4nodejsCommandCheck extends DoctorCheck {
  async diagnose () {
    let stdout = '';
    try {
      ({stdout} = await exec('npm', ['list', '-g', 'opencv4nodejs']));
    } catch (err) {
      log.debug(err);
    }
    return stdout.includes('opencv4nodejs')
      ? okOptional('opencv4nodejs is installed.')
      : nokOptional('opencv4nodejs cannot be found');
  }
  async fix () { // eslint-disable-line require-await
    return `Why opencv4nodejs needs and how to install it is: https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/image-comparison.md`;
  }
}
checks.push(new OptionalOpencv4nodejsCommandCheck());

export { NodeBinaryCheck, NodeVersionCheck, OptionalOpencv4nodejsCommandCheck };
export default checks;
