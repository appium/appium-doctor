import {cp, fs} from './utils';
import {DoctorCheck} from './doctor';
import {ok, nok} from './utils';
import {system} from 'appium-support';
import path from 'path';
import {EOL} from 'os';
 let checks = [];

// Check PATH binaries

class BinaryIsInPathCheck extends DoctorCheck {
  constructor (binary) {
    super();
    this.binary = binary;
  }

  async diagnose () {
    let resolvedPath;
    try {
      let cmd = system.isWindows() ? "where " + this.binaryName : "which " + this.binaryName;
      let [stdout] =  await cp.exec(cmd, { maxBuffer: 524288 });
      if(stdout.match(/not found/gi)) {
        throw new Error('Not Found');
      }
      resolvedPath = system.isWindows() ? stdout.split(EOL)[0] : stdout.replace(EOL, "");
    } catch (err) {
      return nok(`${this.binary} is MISSING in PATH!`);
    }
    return await fs.exists(resolvedPath) ? ok(`${this.binary} was found at ${resolvedPath}`) :
      nok(`${this.binary} is in PATH, but path is NOT valid!`);
  }
  fix() {
    return `Manually install the ${this.binary} binary, add it to PATH and run appium-doctor again.`;
  }
}

checks.push(new BinaryIsInPathCheck(system.isWindows() ? "mvn.bat" : "mvn"));
checks.push(new BinaryIsInPathCheck(system.isWindows() ? "ant.bat" : "ant"));
checks.push(new BinaryIsInPathCheck(system.isWindows() ? "adb.exe" : "adb"));

// Check Android SDKs

class AndroidSdkExists extends DoctorCheck {
  constructor (sdk) {
    super();
    this.sdk = sdk;
  }

  async diagnose () {
    if (typeof process.env.ANDROID_HOME === 'undefined') {
      return nok(`${this.sdk} could not be found because ANDROID_HOME is NOT set!`);
    }
    let sdkPath = path.resolve(process.env.ANDROID_HOME, path.join("platforms", this.sdk));
    return await fs.exists(sdkPath) ? ok(`${this.sdk} was found at ${sdkPath}.`) :
      nok(`${this.sdk} could NOT be found at ${sdkPath}!`);
  }
  fix() {
    if (typeof process.env.ANDROID_HOME === "undefined") {
      return 'Manually configure ANDROID_HOME and run appium-doctor again.';
    }
    return `Manually install the ${this.sdk} sdk and run appium-doctor again.`;
  }
}

checks.push(new AndroidSdkExists('android-16'));
checks.push(new AndroidSdkExists('android-19'));

export { BinaryIsInPathCheck, AndroidSdkExists };
export default checks;
