import { DoctorCheck } from './doctor';
import { ok, nok, okOptional, nokOptional, resolveExecutablePath } from './utils';
import { fs, system } from 'appium-support';
import path from 'path';
import EnvVarAndPathCheck from './env';
import 'colors';

let checks = [];

let javaHome = system.isWindows() ? '%JAVA_HOME%' : '$JAVA_HOME';

checks.push(new EnvVarAndPathCheck('ANDROID_HOME'));
checks.push(new EnvVarAndPathCheck('JAVA_HOME'));

// Check that the PATH includes the jdk's bin directory
class JavaOnPathCheck extends DoctorCheck {
  async diagnose () { // eslint-disable-line require-await
    if (process.env.JAVA_HOME) {
      let javaHomeBin = path.resolve(process.env.JAVA_HOME, 'bin');
      if (process.env.PATH.indexOf(javaHomeBin) + 1) {
        return ok(`Bin directory of ${javaHome} is set`);
      }
    }
    return nok(`Bin directory for ${javaHome} is not set`);
  }

  fix () {
    return `Add ${`'${javaHome}${path.sep}bin'`.bold} to your ${'PATH'.bold} environment`;
  }
}

// Check tools
class AndroidToolCheck extends DoctorCheck {
  constructor (toolName, toolPath) {
    super();
    this.toolName = toolName;
    this.toolPath = toolPath;
  }

  async diagnose () {
    if (typeof process.env.ANDROID_HOME === 'undefined') {
      return nok(`${this.toolName} could not be found because ANDROID_HOME is NOT set!`);
    }
    let fullPath = path.resolve(process.env.ANDROID_HOME, this.toolPath);
    return await fs.exists(fullPath) ? ok(`${this.toolName} exists at: ${fullPath}`) :
      nok(`${this.toolName} could NOT be found at '${fullPath}'!`);
  }

  fix () {
    if (typeof process.env.ANDROID_HOME === 'undefined') {
      return `Manually configure ${'ANDROID_HOME'.bold} and run appium-doctor again.`;
    }
    return `Manually install ${this.toolName.bold} and add it to ${'PATH'.bold}.`;
  }
}
checks.push(new AndroidToolCheck('adb',
  path.join('platform-tools', system.isWindows() ? 'adb.exe' : 'adb')));
checks.push(new AndroidToolCheck('android',
  path.join('tools', system.isWindows() ? 'android.bat' : 'android')));
checks.push(new AndroidToolCheck('emulator',
  path.join('tools', system.isWindows() ? 'emulator.exe' : 'emulator')));
checks.push(new JavaOnPathCheck());

class OptionalAppBundleCheck extends DoctorCheck {
  async diagnose () {
    const bundletoolPath = await resolveExecutablePath('bundletool.jar');
    return bundletoolPath
      ? okOptional(`bundletool.jar is installed at: ${bundletoolPath}`)
      : nokOptional('bundletool.jar cannot be found');
  }

  async fix () { // eslint-disable-line require-await
    return `${'bundletool.jar'.bold} is used to handle Android App Bundle. Please read http://appium.io/docs/en/writing-running-appium/android/android-appbundle/ to install it` +
      `${system.isWindows() ? '. Also consider adding the ".jar" extension into your PATHEXT environment variable in order to fix the problem for Windows' : ''}`;
  }
}
checks.push(new OptionalAppBundleCheck());

export { EnvVarAndPathCheck, AndroidToolCheck, JavaOnPathCheck, OptionalAppBundleCheck };
export default checks;
