import { ok, nok, okOptional, nokOptional, authorizeIos, resolveExecutablePath } from './utils'; // eslint-disable-line
import { fs } from 'appium-support';
import { exec } from 'teen_process';
import { DoctorCheck, FixSkippedError } from './doctor';
import log from './logger';
import CarthageDetector from './carthage-detector';
import { fixIt } from './prompt';
import EnvVarAndPathCheck from './env';
import { EOL } from 'os';


let checks = [];
let fixes = {};

// Check for Xcode.
class XcodeCheck extends DoctorCheck {
  async diagnose () {
    let xcodePath;
    try {
      // https://github.com/appium/appium/issues/12093#issuecomment-459358120 can happen
      await exec('xcrun', ['simctl', 'help']);

      const {stdout} = await exec('xcode-select', ['-p']);
      xcodePath = (stdout || '').replace('\n', '');
    } catch (err) {
      return nok('Xcode is NOT installed!');
    }
    return xcodePath && await fs.exists(xcodePath) ? ok(`Xcode is installed at: ${xcodePath}`) :
      nok(`Xcode cannot be found at '${xcodePath}'!`);
  }

  async fix () { // eslint-disable-line require-await
    return "Manually install Xcode, and make sure 'xcode-select -p' command shows proper path like '/Applications/Xcode.app/Contents/Developer'";
  }
}
checks.push(new XcodeCheck());

// Check for Xcode Command Line Tools.
class XcodeCmdLineToolsCheck extends DoctorCheck {
  constructor () {
    super({autofix: true});
  }

  async diagnose () {
    const errMess = 'Xcode Command Line Tools are NOT installed!';
    try {
      // https://stackoverflow.com/questions/15371925/how-to-check-if-command-line-tools-is-installed
      const stdout = (await exec('xcode-select', ['-p'])).stdout;
      return ok(`Xcode Command Line Tools are installed in: ${stdout.trim()}`);
    } catch (err) {
      log.debug(err);
      return nok(errMess);
    }
  }

  async fix () {
    log.info(`The following command need be executed: xcode-select --install`);
    let yesno = await fixIt();
    if (yesno === 'yes') {
      await exec('xcode-select', ['--install']);
    } else {
      log.info('Skipping you will need to install Xcode manually.');
      throw new FixSkippedError();
    }
  }
}

checks.push(new XcodeCmdLineToolsCheck());

// Automatically run authorize iOS if requested
fixes.authorizeIosFix = async function () {
  log.info(`The authorize iOS script need to be run.`);
  let yesno = await fixIt();
  if (yesno === 'yes') {
    await authorizeIos();
  } else {
    log.info('Skipping you will need to run the authorize iOS manually.');
    throw new FixSkippedError();
  }
};

// Dev Tools Security
class DevToolsSecurityCheck extends DoctorCheck {
  constructor () {
    super({autofix: true});
  }

  async diagnose () {
    const errMess = 'DevToolsSecurity is NOT enabled!';
    let stdout;
    try {
      stdout = (await exec('DevToolsSecurity', [])).stdout;
    } catch (err) {
      log.debug(err);
      return nok(errMess);
    }
    return stdout && stdout.match(/enabled/) ? ok('DevToolsSecurity is enabled.')
      : nok(errMess);
  }
  async fix () {
    return await fixes.authorizeIosFix();
  }
}
checks.push(new DevToolsSecurityCheck());

// Authorization DB
class AuthorizationDbCheck extends DoctorCheck {
  constructor () {
    super({autofix: true});
  }

  async diagnose () {
    const successMess = 'The Authorization DB is set up properly.';
    const errMess = 'The Authorization DB is NOT set up properly.';
    let stdout;
    try {
      ({stdout} = await exec('security', ['authorizationdb', 'read', 'system.privilege.taskport']));
    } catch (err) {
      log.warn(err);
      return nok(errMess);
    }
    return stdout && (stdout.match(/is-developer/) || stdout.match(/allow/)) ?
      ok(successMess) : nok(errMess);
  }
  async fix () {
    return await fixes.authorizeIosFix();
  }
}
checks.push(new AuthorizationDbCheck());

// Check for Carthage (for WDA)
class CarthageCheck extends DoctorCheck {
  async diagnose () {
    let carthagePath = await CarthageDetector.detect();
    return carthagePath
      ? ok(`Carthage was found at: ${carthagePath}`)
      : nok(`Carthage was NOT found!`);
  }

  async fix () { // eslint-disable-line require-await
    return 'Please install Carthage. Visit https://github.com/Carthage' +
           '/Carthage#installing-carthage for more information.';
  }
}
checks.push(new CarthageCheck());

checks.push(new EnvVarAndPathCheck('HOME'));

class OptionalFbsimctlCommandCheck extends DoctorCheck {
  async diagnose () {
    const fbsimctlPath = await resolveExecutablePath('fbsimctl');
    if (fbsimctlPath) {
      try {
        const fbsimctlVersion = (await exec('brew', ['list', '--versions', 'fbsimctl'])).stdout.trim();
        return okOptional(`fbsimctl is installed at: ${fbsimctlPath}. Installed versions are: ${fbsimctlVersion}`);
      } catch {
        return okOptional(`fbsimctl is installed at: ${fbsimctlPath}. It is prbably installed as custom install.`);
      }
    }

    return nokOptional('fbsimctl cannot be found');
  }

  async fix () { // eslint-disable-line require-await
    return 'Why fbsimctl is needed and how to install it: http://appium.io/docs/en/drivers/ios-xcuitest/';
  }
}
checks.push(new OptionalFbsimctlCommandCheck());

class OptionalApplesimutilsCommandCheck extends DoctorCheck {
  async diagnose () {
    const applesimutilsPath = await resolveExecutablePath('applesimutils');
    return applesimutilsPath
      ? okOptional(`applesimutils is installed at: ${applesimutilsPath}. Installed versions are: ${(await exec('brew', ['list', '--versions', 'applesimutils'])).stdout.trim()}`)
      : nokOptional('applesimutils cannot be found');
  }

  async fix () { // eslint-disable-line require-await
    return 'Why applesimutils is needed and how to install it: http://appium.io/docs/en/drivers/ios-xcuitest/';
  }
}
checks.push(new OptionalApplesimutilsCommandCheck());

class OptionalIdevicelocationCommandCheck extends DoctorCheck {
  async diagnose () {
    const idevicelocationPath = await resolveExecutablePath('idevicelocation');
    return idevicelocationPath
      ? okOptional(`idevicelocation is installed at: ${idevicelocationPath}`)
      : nokOptional('idevicelocation cannot be found');
  }

  async fix () { // eslint-disable-line require-await
    return 'idevicelocation is used to set geolocation for real device. Please read https://github.com/JonGabilondoAngulo/idevicelocation to install it';
  }
}
checks.push(new OptionalIdevicelocationCommandCheck());

class OptionalIOSDeployCommandCheck extends DoctorCheck {
  async diagnose () {
    const iosDeployPath = await resolveExecutablePath('ios-deploy');
    return iosDeployPath
      ? okOptional(`ios-deploy is installed at: ${iosDeployPath}. Installed version is: ${(await exec(iosDeployPath, ['-V'])).stdout.trim()}`)
      : nokOptional('ios-deploy cannot be found');
  }

  async fix () { // eslint-disable-line require-await
    return 'ios-deploy is used to install iOS applications to real device. Please read http://appium.io/docs/en/drivers/ios-xcuitest-real-devices/ to install it';
  }
}
checks.push(new OptionalIOSDeployCommandCheck());

class OptionalIOSWebkitDebugProxyCommandCheck extends DoctorCheck {
  async diagnose () {
    const iosWebkitDebugProxyPath = await resolveExecutablePath('ios_webkit_debug_proxy');
    if (iosWebkitDebugProxyPath) {
      const version = (await exec(iosWebkitDebugProxyPath, ['-V'])).stdout.split(EOL);
      return okOptional(`ios_webkit_debug_proxy is installed at: ${iosWebkitDebugProxyPath}. Installed version is: ${
        version[0].replace('ios_webkit_debug_proxy ', '')}, ${version[1]}`);
    }
    return nokOptional('ios_webkit_debug_proxy cannot be found');
  }

  async fix () { // eslint-disable-line require-await
    return 'ios_webkit_debug_proxy is used to proxy requets from Appium to MobileSafari running on real device. Please read https://github.com/google/ios-webkit-debug-proxy to install it';
  }
}
checks.push(new OptionalIOSWebkitDebugProxyCommandCheck());

export {
  fixes, XcodeCheck, XcodeCmdLineToolsCheck, DevToolsSecurityCheck,
  AuthorizationDbCheck, CarthageCheck, OptionalFbsimctlCommandCheck, OptionalApplesimutilsCommandCheck, OptionalIdevicelocationCommandCheck,
  OptionalIOSDeployCommandCheck, OptionalIOSWebkitDebugProxyCommandCheck
};
export default checks;
